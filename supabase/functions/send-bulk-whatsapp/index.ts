import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
    const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN");
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
      throw new Error("Z-API not configured");
    }

    const { recipients, message, intervalMs } = await req.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error("Recipients array is required");
    }

    if (!message) {
      throw new Error("Message is required");
    }

    const delay = intervalMs || 120000; // default 2 minutes
    const results: Array<{ name: string; phone: string; success: boolean; messageId?: string; error?: string }> = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const { name, phone } = recipient;

      // Personalize message
      const personalizedMessage = message.replace(/\{nome\}/gi, name.split(' ')[0]);

      // Format phone
      let formattedPhone = phone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
      }

      try {
        console.log(`[${i + 1}/${recipients.length}] Sending to ${name} (${formattedPhone})`);

        const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (ZAPI_CLIENT_TOKEN) {
          headers['Client-Token'] = ZAPI_CLIENT_TOKEN;
        }

        const response = await fetch(zapiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            phone: formattedPhone,
            message: personalizedMessage,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(`Z-API error: ${JSON.stringify(result)}`);
        }

        console.log(`✅ Sent to ${name}: messageId=${result.messageId}`);
        results.push({ name, phone, success: true, messageId: result.messageId });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`❌ Failed for ${name}: ${errorMsg}`);
        results.push({ name, phone, success: false, error: errorMsg });
      }

      // Wait before next message (skip wait after last message)
      if (i < recipients.length - 1) {
        console.log(`⏳ Waiting ${delay / 1000}s before next message...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n📊 Done: ${successCount}/${recipients.length} sent successfully`);

    return new Response(
      JSON.stringify({ success: true, total: recipients.length, sent: successCount, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in send-bulk-whatsapp:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
