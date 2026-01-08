import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONSULTANT_EMAIL = "eggnunes@gmail.com";
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
    const data: DiagnosticNotificationRequest = await req.json();
    console.log("Received notification request:", JSON.stringify(data));

    const {
      clientName,
      clientEmail,
      clientPhone,
      officeName,
      consultantEmail,
      consultantId,
      diagnosticSummary,
    } = data;

    const siteUrl = Deno.env.get("SITE_URL") || "https://crmidea.lovable.app";
    const bookingUrl = `${siteUrl}/agendar/${consultantId}`;

    // Email to consultant (admin)
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
          
          <a href="${siteUrl}/consultoria" class="btn">Ver Detalhes do Cliente</a>
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
            <strong>📋 Próximos passos:</strong> Em breve entraremos em contato para agendar nossa primeira reunião de consultoria.
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
                <div class="step-title">Análise do Diagnóstico</div>
                <div class="step-desc">Vamos analisar suas respostas para criar um plano personalizado.</div>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <div class="step-title">Primeira Reunião</div>
                <div class="step-desc">Agendaremos uma reunião para apresentar o plano e tirar dúvidas.</div>
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
            <strong>Equipe IDEA - Consultoria em IA para Advogados</strong>
          </p>
        </div>
      </body>
      </html>
    `;

    // Send email to consultant
    console.log("Sending email to consultant:", CONSULTANT_EMAIL);
    const consultantEmailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: [CONSULTANT_EMAIL],
      subject: `🎉 Novo Diagnóstico: ${officeName} - ${clientName}`,
      html: consultantEmailHtml,
    });
    console.log("Consultant email sent:", consultantEmailResponse);

    // Send email to client
    console.log("Sending email to client:", clientEmail);
    const clientEmailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: [clientEmail],
      subject: "✅ Diagnóstico Recebido - Consultoria IDEA",
      html: clientEmailHtml,
    });
    console.log("Client email sent:", clientEmailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        consultantEmailId: consultantEmailResponse.data?.id,
        clientEmailId: clientEmailResponse.data?.id,
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