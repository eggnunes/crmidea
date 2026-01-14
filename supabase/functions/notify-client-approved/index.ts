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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { clientName, clientEmail, clientPhone, dashboardUrl, consultantId } = await req.json();

    console.log("Notifying client about approval:", { clientName, clientEmail, clientPhone });

    const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
    const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN");
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    // Get admin user ID for logging if not provided
    let adminUserId = consultantId;
    if (!adminUserId) {
      const { data: adminUser } = await supabase
        .from("profiles")
        .select("user_id")
        .limit(1)
        .single();
      adminUserId = adminUser?.user_id;
    }

    // ========= SEND APPROVAL EMAIL =========
    if (RESEND_API_KEY && clientEmail) {
      try {
        const resend = new Resend(RESEND_API_KEY);
        const emailSubject = "🎉 Cadastro Aprovado - Consultoria IDEA";
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
              .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; }
              .highlight { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 Cadastro Aprovado!</h1>
              <p>Consultoria IDEA</p>
            </div>
            <div class="content">
              <p>Olá <strong>${clientName.split(" ")[0]}</strong>,</p>
              
              <p>Ótima notícia! Seu cadastro na <strong>Consultoria IDEA</strong> foi <strong>aprovado</strong>! 🎉</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" class="btn">🚀 Acessar Meu Dashboard</a>
              </div>
              
              <div class="highlight">
                <strong>✨ O que fazer agora:</strong>
                <ul style="margin: 10px 0 0; padding-left: 20px;">
                  <li>Acesse seu Dashboard clicando no botão acima</li>
                  <li>Preencha o formulário de diagnóstico para personalizarmos sua consultoria</li>
                  <li>Acompanhe seu progresso e materiais exclusivos</li>
                </ul>
              </div>
              
              <p>Estou muito animado para começar essa jornada de transformação digital com você! Qualquer dúvida, estou à disposição.</p>
              
              <div class="footer">
                <p><strong>Rafael Egg - Especialista em IA para Advogados</strong></p>
              </div>
            </div>
          </body>
          </html>
        `;

        await resend.emails.send({
          from: "Rafael Egg <naoresponda@rafaelegg.com>",
          to: [clientEmail],
          subject: emailSubject,
          html: emailHtml,
        });
        console.log("Approval email sent to:", clientEmail);

        // Log the sent email
        if (adminUserId) {
          try {
            await supabase.from("sent_emails_log").insert({
              user_id: adminUserId,
              recipient_email: clientEmail,
              recipient_name: clientName,
              subject: emailSubject,
              email_type: "client_approval",
              status: "sent",
              metadata: { dashboard_url: dashboardUrl }
            });
          } catch (logError) {
            console.error("Error logging email:", logError);
          }
        }
      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
      }
    }

    // ========= SEND WHATSAPP NOTIFICATION =========
    if (ZAPI_INSTANCE_ID && ZAPI_TOKEN && clientPhone) {
      const formattedClientPhone = clientPhone.replace(/\D/g, "");
      
      const clientMessage = `🎉 *Cadastro Aprovado!*

Olá, ${clientName.split(" ")[0]}! 👋

Ótima notícia! Seu cadastro na *Consultoria IDEA* foi *aprovado*! 🚀

✅ Agora você pode acessar seu Dashboard exclusivo e começar sua jornada de transformação digital.

👉 *Acesse agora:* ${dashboardUrl}

📋 *Próximo passo:* Preencha o formulário de diagnóstico para personalizarmos sua consultoria.

Qualquer dúvida, estou à disposição!

*Rafael Egg* - Especialista em IA para Advogados`;

      const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;

      try {
        const response = await fetch(zapiUrl, {
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
        const result = await response.json();
        console.log("Client approval WhatsApp response:", result);
      } catch (error) {
        console.error("Error sending client approval WhatsApp:", error);
      }
    } else {
      console.log("Z-API credentials not configured or no phone, skipping WhatsApp notification");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-client-approved:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
