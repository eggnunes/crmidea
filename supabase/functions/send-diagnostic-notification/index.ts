import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONSULTANT_EMAIL = "eggnunes@gmail.com";
const CONSULTANT_NAME = "Rafael Egg";
const FROM_EMAIL = "Consultoria IDEA <naoresponda@rafaelegg.com>";

interface DiagnosticNotificationRequest {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  officeName: string;
  consultantEmail: string;
  consultantId: string;
  diagnosticSummary: {
    practiceAreas: string;
    numLawyers: number;
    numEmployees: number;
    selectedFeaturesCount: number;
    aiExperience: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const zapiInstanceId = Deno.env.get("ZAPI_INSTANCE_ID");
    const zapiToken = Deno.env.get("ZAPI_TOKEN");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: DiagnosticNotificationRequest = await req.json();
    console.log("Received notification request:", JSON.stringify(data));

    const {
      clientName,
      clientEmail,
      clientPhone,
      officeName,
      consultantId,
      diagnosticSummary,
    } = data;

    const siteUrl = Deno.env.get("SITE_URL") || "https://advocate-ai-crm.lovable.app";
    
    // Get booking URL from consulting settings
    let bookingUrl = `${siteUrl}/agendar/${consultantId}`;
    const { data: settings } = await supabase
      .from("consulting_settings")
      .select("calendar_booking_url")
      .eq("user_id", consultantId)
      .maybeSingle();
    
    if (settings?.calendar_booking_url) {
      bookingUrl = settings.calendar_booking_url;
    }

    // Get consultant's personal WhatsApp
    let consultantPhone = "";
    const { data: followUpSettings } = await supabase
      .from("follow_up_settings")
      .select("personal_whatsapp")
      .eq("user_id", consultantId)
      .maybeSingle();
    
    if (followUpSettings?.personal_whatsapp) {
      consultantPhone = followUpSettings.personal_whatsapp;
    }

    const results: { clientWhatsapp?: boolean; consultantWhatsapp?: boolean; clientEmail?: boolean; consultantEmail?: boolean } = {};

    // ====================
    // SEND WHATSAPP TO CLIENT
    // ====================
    if (clientPhone && zapiInstanceId && zapiToken) {
      try {
        let formattedPhone = clientPhone.replace(/\D/g, "");
        if (!formattedPhone.startsWith("55")) {
          formattedPhone = "55" + formattedPhone;
        }

        const clientMessage = `🎉 *Olá, ${clientName.split(" ")[0]}!*

Seu diagnóstico foi recebido com sucesso! ✅

Agora, o próximo passo é agendar nossa *primeira reunião* para iniciarmos a implementação da sua intranet jurídica com IA.

📅 *Clique no link abaixo para agendar:*
${bookingUrl}

Após agendar, aguarde a data da reunião. Vamos construir juntos a inteligência artificial do seu escritório! 🚀

_${CONSULTANT_NAME}_
_Consultoria IDEA_`;

        const response = await fetch(
          `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: formattedPhone,
              message: clientMessage
            }),
          }
        );

        if (response.ok) {
          console.log("WhatsApp message sent to client successfully");
          results.clientWhatsapp = true;
        } else {
          console.error("Failed to send WhatsApp to client:", await response.text());
          results.clientWhatsapp = false;
        }
      } catch (error) {
        console.error("Error sending WhatsApp to client:", error);
        results.clientWhatsapp = false;
      }
    }

    // ====================
    // SEND WHATSAPP TO CONSULTANT
    // ====================
    if (consultantPhone && zapiInstanceId && zapiToken) {
      try {
        let formattedConsultantPhone = consultantPhone.replace(/\D/g, "");
        if (!formattedConsultantPhone.startsWith("55")) {
          formattedConsultantPhone = "55" + formattedConsultantPhone;
        }

        const consultantMessage = `🆕 *Novo Diagnóstico Preenchido!*

Um cliente acabou de completar o formulário de diagnóstico.

👤 *Cliente:* ${clientName}
🏢 *Escritório:* ${officeName}
📧 *E-mail:* ${clientEmail}
📱 *WhatsApp:* ${clientPhone}

📊 *Resumo:*
• ${diagnosticSummary.numLawyers} advogado(s)
• ${diagnosticSummary.numEmployees} colaborador(es)
• ${diagnosticSummary.selectedFeaturesCount} funcionalidades selecionadas
• Experiência com IA: ${diagnosticSummary.aiExperience}

Acesse o painel para ver os detalhes completos.`;

        const response = await fetch(
          `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: formattedConsultantPhone,
              message: consultantMessage
            }),
          }
        );

        if (response.ok) {
          console.log("WhatsApp message sent to consultant successfully");
          results.consultantWhatsapp = true;
        } else {
          console.error("Failed to send WhatsApp to consultant:", await response.text());
          results.consultantWhatsapp = false;
        }
      } catch (error) {
        console.error("Error sending WhatsApp to consultant:", error);
        results.consultantWhatsapp = false;
      }
    }

    // ====================
    // EMAIL TO CONSULTANT (ADMIN)
    // ====================
    const consultantEmailHtml = `
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
          .value { font-size: 16px; font-weight: 600; color: #1e293b; }
          .highlight { background: #eef2ff; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          .stats { display: flex; gap: 20px; flex-wrap: wrap; }
          .stat { flex: 1; min-width: 120px; text-align: center; padding: 15px; background: #f1f5f9; border-radius: 8px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #6366f1; }
          .stat-label { font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Novo Diagnóstico Concluído!</h1>
          <p>Um cliente completou o formulário de diagnóstico</p>
        </div>
        <div class="content">
          <div class="highlight">
            <strong>⚠️ Ação necessária:</strong> Crie horários disponíveis na sua agenda antes de entrar em contato com o cliente.
          </div>
          
          <div class="info-card">
            <div class="label">Cliente</div>
            <div class="value">${clientName}</div>
          </div>
          
          <div class="info-card">
            <div class="label">Escritório</div>
            <div class="value">${officeName}</div>
          </div>
          
          <div class="info-card">
            <div class="label">Contato</div>
            <div class="value">📧 ${clientEmail}</div>
            <div class="value">📱 ${clientPhone}</div>
          </div>
          
          <h3>📊 Resumo do Diagnóstico</h3>
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${diagnosticSummary.numLawyers}</div>
              <div class="stat-label">Advogados</div>
            </div>
            <div class="stat">
              <div class="stat-value">${diagnosticSummary.numEmployees}</div>
              <div class="stat-label">Colaboradores</div>
            </div>
            <div class="stat">
              <div class="stat-value">${diagnosticSummary.selectedFeaturesCount}</div>
              <div class="stat-label">Funcionalidades</div>
            </div>
          </div>
          
          <div class="info-card">
            <div class="label">Áreas de Atuação</div>
            <div class="value">${diagnosticSummary.practiceAreas || "Não informado"}</div>
          </div>
          
          <div class="info-card">
            <div class="label">Experiência com IA</div>
            <div class="value">${diagnosticSummary.aiExperience}</div>
          </div>
          
          <a href="${siteUrl}/metodo-idea/consultoria" class="btn">Ver Detalhes do Cliente</a>
        </div>
      </body>
      </html>
    `;

    // Email to client
    const clientEmailHtml = `
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
          .highlight { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .btn { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
          .steps { margin: 20px 0; }
          .step { display: flex; align-items: flex-start; margin: 15px 0; }
          .step-number { background: #6366f1; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; }
          .step-content { flex: 1; }
          .step-title { font-weight: 600; margin-bottom: 4px; }
          .step-desc { font-size: 14px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✅ Diagnóstico Recebido!</h1>
          <p>Obrigado por completar o formulário de diagnóstico</p>
        </div>
        <div class="content">
          <p>Olá <strong>${clientName.split(" ")[0]}</strong>,</p>
          
          <p>Recebemos seu diagnóstico e estamos muito felizes em tê-lo(a) conosco! 🎉</p>
          
          <div class="highlight">
            <strong>📅 Próximo passo:</strong> Agende nossa primeira reunião clicando no botão abaixo e aguarde a data marcada.
          </div>
          
          <h3>📊 Resumo do seu diagnóstico:</h3>
          <div class="info-card">
            <div class="label">Escritório</div>
            <div class="value">${officeName}</div>
          </div>
          <div class="info-card">
            <div class="label">Equipe</div>
            <div class="value">${diagnosticSummary.numLawyers} advogado(s) e ${diagnosticSummary.numEmployees} colaborador(es)</div>
          </div>
          <div class="info-card">
            <div class="label">Áreas de Atuação</div>
            <div class="value">${diagnosticSummary.practiceAreas || "Não informado"}</div>
          </div>
          <div class="info-card">
            <div class="label">Funcionalidades Selecionadas</div>
            <div class="value">${diagnosticSummary.selectedFeaturesCount} funcionalidade(s) escolhida(s) para implementação</div>
          </div>
          
          <h3>🚀 Como funciona a consultoria:</h3>
          <div class="steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <div class="step-title">Agende a Reunião</div>
                <div class="step-desc">Clique no botão abaixo e escolha o melhor horário para você.</div>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <div class="step-title">Aguarde a Reunião</div>
                <div class="step-desc">Na data marcada, nos reuniremos para apresentar o plano personalizado.</div>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <div class="step-title">Implementação</div>
                <div class="step-desc">Trabalharemos juntos para implementar cada funcionalidade.</div>
              </div>
            </div>
          </div>
          
          <p style="text-align: center;">
            <a href="${bookingUrl}" class="btn">📅 Agendar Primeira Reunião</a>
          </p>
          
          <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
            Se tiver alguma dúvida, basta responder este email.<br><br>
            Até breve!<br>
            <strong>${CONSULTANT_NAME}</strong><br>
            <em>Consultoria IDEA - Inteligência Artificial para Advogados</em>
          </p>
        </div>
      </body>
      </html>
    `;

    // Send email to consultant
    try {
      console.log("Sending email to consultant:", CONSULTANT_EMAIL);
      const consultantSubject = `🎉 Novo Diagnóstico: ${officeName} - ${clientName}`;
      const consultantEmailResponse = await resend.emails.send({
        from: FROM_EMAIL,
        to: [CONSULTANT_EMAIL],
        subject: consultantSubject,
        html: consultantEmailHtml,
      });
      console.log("Consultant email sent:", consultantEmailResponse);
      results.consultantEmail = true;

      // Log the sent email
      if (consultantId) {
        try {
          await supabase.from("sent_emails_log").insert({
            user_id: consultantId,
            recipient_email: CONSULTANT_EMAIL,
            recipient_name: CONSULTANT_NAME,
            subject: consultantSubject,
            email_type: "diagnostic_admin_notification",
            status: "sent",
            metadata: { client_name: clientName, office_name: officeName }
          });
        } catch (logError) {
          console.error("Error logging email:", logError);
        }
      }
    } catch (error) {
      console.error("Error sending consultant email:", error);
      results.consultantEmail = false;
    }

    // Send email to client
    try {
      console.log("Sending email to client:", clientEmail);
      const clientSubject = "✅ Diagnóstico Recebido - Consultoria IDEA";
      const clientEmailResponse = await resend.emails.send({
        from: FROM_EMAIL,
        to: [clientEmail],
        subject: clientSubject,
        html: clientEmailHtml,
      });
      console.log("Client email sent:", clientEmailResponse);
      results.clientEmail = true;

      // Log the sent email
      if (consultantId) {
        try {
          await supabase.from("sent_emails_log").insert({
            user_id: consultantId,
            recipient_email: clientEmail,
            recipient_name: clientName,
            subject: clientSubject,
            email_type: "diagnostic_client_confirmation",
            status: "sent",
            metadata: { office_name: officeName, booking_url: bookingUrl }
          });
        } catch (logError) {
          console.error("Error logging email:", logError);
        }
      }
    } catch (error) {
      console.error("Error sending client email:", error);
      results.clientEmail = false;
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in send-diagnostic-notification:", error);
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