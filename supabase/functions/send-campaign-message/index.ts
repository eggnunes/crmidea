import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { campaignId, recipientId, campaignType, content, subject, recipientEmail, recipientPhone, recipientName } = await req.json();

    console.log(`Processing campaign message: campaignId=${campaignId}, type=${campaignType}, recipient=${recipientEmail || recipientPhone}`);

    if (campaignType === 'email') {
      // Check if email is unsubscribed
      if (recipientEmail) {
        const { data: unsubscribed } = await supabase
          .from('email_unsubscribes')
          .select('id')
          .ilike('email', recipientEmail)
          .maybeSingle();

        if (unsubscribed) {
          console.log(`Email ${recipientEmail} is unsubscribed, skipping...`);
          
          // Update recipient status to blocked
          await supabase
            .from('campaign_recipients')
            .update({ 
              status: 'bloqueado',
              error_message: 'E-mail descadastrado da lista'
            })
            .eq('id', recipientId);

          return new Response(
            JSON.stringify({ success: false, message: "Email is unsubscribed", skipped: true }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Send via Resend
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      
      if (!resendApiKey) {
        throw new Error("RESEND_API_KEY not configured");
      }

      if (!recipientEmail) {
        throw new Error("Recipient email is required for email campaigns");
      }

      const resend = new Resend(resendApiKey);

      // Replace placeholders in content
      let personalizedContent = content;
      if (recipientName) {
        personalizedContent = personalizedContent.replace(/\{nome\}/gi, recipientName);
        personalizedContent = personalizedContent.replace(/\{name\}/gi, recipientName);
      }

      // Generate unsubscribe link
      const encodedEmail = btoa(recipientEmail);
      const unsubscribeUrl = `${supabaseUrl}/functions/v1/email-unsubscribe?email=${encodedEmail}&campaign=${campaignId || ''}`;

      // Convert plain text to HTML with unsubscribe link
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="white-space: pre-wrap; line-height: 1.6;">
${personalizedContent.split('\n').map((line: string) => `            <p style="margin: 0 0 10px 0;">${line || '&nbsp;'}</p>`).join('\n')}
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Você está recebendo este e-mail porque se inscreveu em nossa lista.
            </p>
            <p style="margin: 10px 0;">
              <a href="${unsubscribeUrl}" style="color: #888; font-size: 12px; text-decoration: underline;">
                Clique aqui para cancelar sua inscrição
              </a>
            </p>
          </div>
        </div>
      `;

      const emailResponse = await resend.emails.send({
        from: "Rafael Egg <contato@rafaelegg.com>",
        to: [recipientEmail],
        subject: subject || "Mensagem da campanha",
        html: htmlContent,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });

      console.log("Email sent successfully:", emailResponse);

      // Update recipient status
      await supabase
        .from('campaign_recipients')
        .update({ 
          status: 'enviado',
          sent_at: new Date().toISOString()
        })
        .eq('id', recipientId);

      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully", data: emailResponse }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (campaignType === 'whatsapp') {
      // Send via Z-API
      const zapiInstanceId = Deno.env.get("ZAPI_INSTANCE_ID");
      const zapiToken = Deno.env.get("ZAPI_TOKEN");
      const zapiClientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");

      if (!zapiInstanceId || !zapiToken) {
        throw new Error("Z-API credentials not configured");
      }

      if (!recipientPhone) {
        throw new Error("Recipient phone is required for WhatsApp campaigns");
      }

      // Format phone number
      let formattedPhone = recipientPhone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('55') && formattedPhone.length <= 11) {
        formattedPhone = '55' + formattedPhone;
      }

      // Replace placeholders in content
      let personalizedContent = content;
      if (recipientName) {
        personalizedContent = personalizedContent.replace(/\{nome\}/gi, recipientName);
        personalizedContent = personalizedContent.replace(/\{name\}/gi, recipientName);
      }

      const zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (zapiClientToken) {
        headers['Client-Token'] = zapiClientToken;
      }

      const response = await fetch(zapiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phone: formattedPhone,
          message: personalizedContent,
        }),
      });

      const result = await response.json();
      console.log("WhatsApp message sent:", result);

      if (!response.ok) {
        throw new Error(`Z-API error: ${JSON.stringify(result)}`);
      }

      // Update recipient status
      await supabase
        .from('campaign_recipients')
        .update({ 
          status: 'enviado',
          sent_at: new Date().toISOString()
        })
        .eq('id', recipientId);

      return new Response(
        JSON.stringify({ success: true, message: "WhatsApp message sent successfully", data: result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      throw new Error(`Unknown campaign type: ${campaignType}`);
    }

  } catch (error: unknown) {
    console.error("Error in send-campaign-message:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
