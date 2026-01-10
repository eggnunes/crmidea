import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT and get the user ID from the token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('[generate-logo] Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = claimsData.claims.sub as string;
    const { office_name, practice_areas, custom_instructions } = await req.json();

    if (!office_name) {
      throw new Error("Nome do escritório é obrigatório");
    }

    console.log("Generating logo for:", office_name, "by user:", authenticatedUserId);
    if (custom_instructions) {
      console.log("With custom instructions:", custom_instructions);
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Generate professional law office logo prompt
    const practiceInfo = practice_areas ? ` specializing in ${practice_areas}` : "";
    
    // Build the prompt - if custom instructions are provided, they take priority
    let prompt: string;
    if (custom_instructions && custom_instructions.trim()) {
      prompt = `Create a professional logo for a Brazilian law office called "${office_name}"${practiceInfo}. 

IMPORTANT - THE USER HAS REQUESTED SPECIFIC CHANGES. YOU MUST FOLLOW THESE INSTRUCTIONS EXACTLY:
${custom_instructions}

Additional requirements:
- The logo should still be professional and suitable for legal/law firm branding
- Square format, suitable for use as an avatar or icon
- High contrast for readability
Ultra high resolution, professional quality.`;
    } else {
      prompt = `Create a professional, modern logo for a Brazilian law office called "${office_name}"${practiceInfo}. The logo should be:
- Clean and minimalist design
- Professional color scheme (navy blue, gold, or burgundy tones)
- Suitable for legal/law firm branding
- Include a subtle legal symbol like scales of justice, a column, or a stylized book
- Modern typography for the office name
- High contrast for readability
- Square format, suitable for use as an avatar or icon
Ultra high resolution, professional quality.`;
    }

    console.log("Sending request to Lovable AI...");

    // Retry logic for image generation
    let imageBase64: string | undefined;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`[generate-logo] Attempt ${attempt}/3`);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          modalities: ["image", "text"]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[generate-logo] Attempt ${attempt} API error:`, errorText);
        lastError = new Error(`API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      console.log(`[generate-logo] Attempt ${attempt} response received`);
      
      imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (imageBase64) {
        console.log(`[generate-logo] Image generated successfully on attempt ${attempt}`);
        break;
      } else {
        console.log(`[generate-logo] Attempt ${attempt} - No image in response, retrying...`);
        console.log(`[generate-logo] Response content:`, data.choices?.[0]?.message?.content);
        lastError = new Error("No image generated by AI model");
      }
    }

    if (!imageBase64) {
      console.error("[generate-logo] Failed to generate image after 3 attempts");
      throw lastError || new Error("No image generated after multiple attempts");
    }

    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const fileName = `generated/${authenticatedUserId}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

    const { error: uploadError } = await supabase.storage
      .from('consulting-logos')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('consulting-logos')
      .getPublicUrl(fileName);

    console.log("Logo uploaded successfully:", publicUrl);

    return new Response(
      JSON.stringify({ logo_url: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-logo function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
