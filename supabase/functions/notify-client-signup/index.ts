import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const { clientName, clientEmail, clientPhone } = await req.json();

    console.log("Notifying about new client signup:", { clientName, clientEmail, clientPhone });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
    const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN");
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    // Get consultant's phone from follow_up_settings
    const { data: settings } = await supabase
      .from("follow_up_settings")
      .select("personal_whatsapp")
      .limit(1)
      .maybeSingle();

    const consultantPhone = settings?.personal_whatsapp || "5527998098704";
    const formattedConsultantPhone = consultantPhone.replace(/\D/g, "");

    // ========= NOTIFY CONSULTANT =========
    if (ZAPI_INSTANCE_ID && ZAPI_TOKEN) {
      const consultantMessage = `🆕 *Novo Cadastro na Consultoria IDEA!*

👤 *Nome:* ${clientName}
📧 *E-mail:* ${clientEmail}
${clientPhone ? `📱 *WhatsApp:* ${clientPhone}` : ""}

⏳ O cliente está aguardando aprovação para acessar a área do cliente.

Acesse o painel administrativo para aprovar.`;

      const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;

      try {
        const consultantResponse = await fetch(zapiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(ZAPI_CLIENT_TOKEN && { "Client-Token": ZAPI_CLIENT_TOKEN }),
          },
          body: JSON.stringify({
            phone: formattedConsultantPhone,
            message: consultantMessage,
          }),
        });
        const consultantResult = await consultantResponse.json();
        console.log("Consultant Z-API response:", consultantResult);
      } catch (error) {
        console.error("Error sending consultant WhatsApp:", error);
      }

      // ========= NOTIFY CLIENT VIA WHATSAPP =========
      if (clientPhone) {
        const formattedClientPhone = clientPhone.replace(/\D/g, "");
        
        const clientMessage = `✅ *Cadastro Recebido com Sucesso!*

Olá, ${clientName.split(" ")[0]}! 👋

Seu cadastro na *Consultoria IDEA* foi realizado com sucesso!

📋 Seu mentor, *Rafael Egg*, já foi notificado sobre o seu cadastro.

⏳ Em breve ele será aprovado e você receberá uma mensagem aqui mesmo no WhatsApp quando o acesso for liberado.

Qualquer dúvida, estou à disposição! 🚀`;

        try {
          const clientResponse = await fetch(zapiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(ZAPI_CLIENT_TOKEN && { "Client-Token": ZAPI_CLIENT_TOKEN }),
            },
            body: JSON.stringify({
              phone: formattedClientPhone,
              message: clientMessage,
            }),
          });
          const clientResult = await clientResponse.json();
          console.log("Client Z-API response:", clientResult);
        } catch (error) {
          console.error("Error sending client WhatsApp:", error);
        }
      }
    } else {
      console.log("Z-API credentials not configured, skipping WhatsApp notifications");
    }

    // ========= SEND CONFIRMATION EMAIL TO CLIENT =========
    if (RESEND_API_KEY && clientEmail) {
      try {
        const resend = new Resend(RESEND_API_KEY);
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8b5cf6, #d946ef); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
              .highlight { background: #faf5ff; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📋 Cadastro Recebido!</h1>
              <p>Consultoria IDEA</p>
            </div>
            <div class="content">
              <p>Olá <strong>${clientName.split(" ")[0]}</strong>,</p>
              
              <p>Seu cadastro na <strong>Consultoria IDEA</strong> foi recebido com sucesso! 🎉</p>
              
              <div class="highlight">
                <strong>⏳ Próximos passos:</strong>
                <p style="margin: 10px 0 0;">Seu mentor, <strong>Rafael Egg</strong>, já foi notificado sobre o seu cadastro. Em breve ele será aprovado e você receberá um e-mail quando o acesso for liberado.</p>
              </div>
              
              <p>Assim que seu cadastro for aprovado, você poderá:</p>
              <ul>
                <li>✅ Acessar seu Dashboard exclusivo</li>
                <li>✅ Preencher o formulário de diagnóstico</li>
                <li>✅ Acompanhar seu progresso na consultoria</li>
              </ul>
              
              <div class="footer">
                <p><strong>Rafael Egg - Especialista em IA para Advogados</strong></p>
              </div>
            </div>
          </body>
          </html>
        `;

        await resend.emails.send({
          from: "Rafael Nunes <naoresponda@rafaelegg.com>",
          to: [clientEmail],
          subject: "📋 Cadastro Recebido - Consultoria IDEA",
          html: emailHtml,
        });
        console.log("Confirmation email sent to:", clientEmail);
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-client-signup:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
