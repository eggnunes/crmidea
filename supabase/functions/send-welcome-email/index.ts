import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "Consultoria IDEA <naoresponda@rafaelegg.com>";

interface WelcomeEmailRequest {
  clientName: string;
  clientEmail: string;
  officeName: string;
  consultantId: string;
  clientId?: string;
  checkFormFilled?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: WelcomeEmailRequest = await req.json();
    console.log("Received welcome email request:", JSON.stringify(data));

    const {
      clientName,
      clientEmail,
      officeName,
      consultantId,
      clientId,
      checkFormFilled,
    } = data;

    const siteUrl = Deno.env.get("SITE_URL") || "https://crmidea.lovable.app";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if form is already filled
    let hasFilledForm = false;
    if (checkFormFilled && clientId) {
      const { data: formProgress } = await supabase
        .from("diagnostic_form_progress")
        .select("is_completed")
        .eq("client_user_id", clientId)
        .maybeSingle();
      
      hasFilledForm = formProgress?.is_completed || false;
      console.log("Form filled status:", hasFilledForm);
    }

    // Generate form URL with consultant ID
    const formUrl = `${siteUrl}/diagnostico/${consultantId}`;
    
    // Generate QR Code URL (using a free QR code API)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(formUrl)}`;

    // Build email content
    let formSection = "";
    if (!hasFilledForm) {
      formSection = `
        <div class="highlight" style="background: #fff7ed; border-left: 4px solid #f97316;">
          <strong>📝 Complete seu Diagnóstico:</strong>
          <p style="margin: 10px 0 5px;">Para iniciarmos a consultoria, precisamos que você preencha o formulário de diagnóstico do seu escritório.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${formUrl}" class="btn" style="margin-bottom: 20px;">📋 Preencher Formulário de Diagnóstico</a>
          
          <div style="margin-top: 20px;">
            <p style="font-size: 14px; color: #64748b; margin-bottom: 15px;">Ou escaneie o QR Code:</p>
            <img src="${qrCodeUrl}" alt="QR Code para formulário" style="width: 150px; height: 150px; border: 2px solid #e2e8f0; border-radius: 8px;" />
          </div>
          
          <p style="font-size: 12px; color: #94a3b8; margin-top: 15px;">Link direto: <a href="${formUrl}" style="color: #6366f1;">${formUrl}</a></p>
        </div>
      `;
    } else {
      formSection = `
        <div class="highlight" style="background: #ecfdf5; border-left: 4px solid #10b981;">
          <strong>✅ Formulário Preenchido!</strong>
          <p style="margin: 10px 0 0;">Seu diagnóstico já foi recebido. Em breve entraremos em contato para agendar a primeira reunião.</p>
        </div>
      `;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
          .info-card { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
          .value { font-size: 14px; color: #1e293b; }
          .highlight { border-radius: 0 8px 8px 0; padding: 15px; margin: 20px 0; }
          .btn { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .steps { margin: 20px 0; }
          .step { display: flex; align-items: flex-start; margin: 15px 0; }
          .step-number { background: #6366f1; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; }
          .step-content { flex: 1; }
          .step-title { font-weight: 600; margin-bottom: 4px; }
          .step-desc { font-size: 14px; color: #64748b; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Bem-vindo(a) à Consultoria IDEA!</h1>
          <p>Estamos muito felizes em tê-lo(a) conosco</p>
        </div>
        <div class="content">
          <p>Olá <strong>${clientName.split(" ")[0]}</strong>,</p>
          
          <p>É um prazer ter você e o <strong>${officeName}</strong> como cliente da Consultoria IDEA em Inteligência Artificial para Advogados! 🚀</p>
          
          ${formSection}
          
          <h3>🔮 O que você pode esperar:</h3>
          <div class="steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <div class="step-title">Diagnóstico Personalizado</div>
                <div class="step-desc">Analisaremos o perfil do seu escritório para criar um plano sob medida.</div>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <div class="step-title">Reuniões de Acompanhamento</div>
                <div class="step-desc">Sessões práticas para implementar IA no seu dia a dia jurídico.</div>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <div class="step-title">Suporte Contínuo</div>
                <div class="step-desc">Acompanhamento para garantir que você domine as ferramentas.</div>
              </div>
            </div>
          </div>
          
          <div class="info-card">
            <div class="label">Acesse sua área do cliente</div>
            <p style="margin: 10px 0 0;">Você pode acompanhar seu progresso, agendar reuniões e muito mais na sua área exclusiva:</p>
            <p style="margin: 15px 0 0;"><a href="${siteUrl}/area-cliente" class="btn" style="display: inline-block;">🔐 Acessar Área do Cliente</a></p>
          </div>
          
          <div class="footer">
            <p>Dúvidas? Responda este e-mail que teremos prazer em ajudar.</p>
            <p><strong>Equipe IDEA - Consultoria em IA para Advogados</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send welcome email
    console.log("Sending welcome email to:", clientEmail);
    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: [clientEmail],
      subject: `🎉 Bem-vindo(a) à Consultoria IDEA - ${officeName}`,
      html: emailHtml,
    });
    console.log("Welcome email sent:", emailResponse);

    // Log email sent
    try {
      await supabase.from("sent_emails_log").insert({
        user_id: consultantId,
        email_type: "welcome",
        recipient_email: clientEmail,
        recipient_name: clientName,
        subject: `🎉 Bem-vindo(a) à Consultoria IDEA - ${officeName}`,
        status: "sent",
        metadata: {
          formUrl: !hasFilledForm ? formUrl : null,
          formFilled: hasFilledForm,
        },
      });
    } catch (logError) {
      console.error("Error logging email:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResponse.data?.id,
        formFilled: hasFilledForm,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in send-welcome-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
