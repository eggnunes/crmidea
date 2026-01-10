import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONSULTANT_NAME = "Rafael Egg";
const CONSULTANT_EMAIL = "rafael@rafaelegg.com";

// Simple HTML entity encoding to prevent XSS
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

// Validation functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function isValidName(name: string): boolean {
  return typeof name === 'string' && name.length >= 1 && name.length <= 100;
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s+\-()]+$/;
  return phoneRegex.test(phone) && phone.length <= 30;
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const zapiInstanceId = Deno.env.get("ZAPI_INSTANCE_ID");
    const zapiToken = Deno.env.get("ZAPI_TOKEN");

    // Check for authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authentication' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the JWT token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authenticatedUserId = user.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, clientId, consultantId, clientEmail, clientName, clientPhone } = await req.json();

    // Validate action
    const validActions = ['form_submitted', 'session_scheduled', 'progress_update'];
    if (!action || !validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate inputs
    if (clientId && !isValidUUID(clientId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid client ID format' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (clientEmail && !isValidEmail(clientEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (clientName && !isValidName(clientName)) {
      return new Response(
        JSON.stringify({ error: 'Invalid name format' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (clientPhone && !isValidPhone(clientPhone)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone format' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use authenticated user as consultant (ignore consultantId from body for security)
    const actualConsultantId = authenticatedUserId;

    console.log(`Processing consulting notification: ${action} for client ${clientId || clientName}`);

    // Fetch consultant settings using authenticated user
    let settings = null;
    const { data } = await supabase
      .from("consulting_settings")
      .select("*")
      .eq("user_id", actualConsultantId)
      .maybeSingle();
    settings = data;

    const bookingUrl = settings?.calendar_booking_url || "https://calendar.app.google/QekSkCGbKjaRb3Qp8";
    const whatsappEnabled = settings?.whatsapp_notifications_enabled ?? true;
    const emailEnabled = settings?.email_notifications_enabled ?? true;

    const results: { whatsapp?: boolean; email?: boolean } = {};

    // Sanitize client name for messages
    const safeClientName = clientName ? clientName.substring(0, 100) : 'Cliente';

    // Send WhatsApp notification
    if (whatsappEnabled && clientPhone && zapiInstanceId && zapiToken) {
      try {
        let formattedPhone = clientPhone.replace(/\D/g, "");
        if (!formattedPhone.startsWith("55")) {
          formattedPhone = "55" + formattedPhone;
        }

        let message = "";
        if (action === "form_submitted") {
          message = `🎉 *Olá, ${safeClientName}!*

Seu formulário de diagnóstico foi recebido com sucesso!

Agora vamos dar o próximo passo: agendar nossa primeira reunião para iniciar a implantação da sua intranet jurídica.

📅 *Clique no link abaixo para agendar:*
${bookingUrl}

Qualquer dúvida, estou à disposição!

_${CONSULTANT_NAME}_
_Consultoria IDEA_`;
        } else if (action === "session_scheduled") {
          message = `📅 *Reunião Agendada!*

Olá, ${safeClientName}! Uma nova reunião de consultoria foi agendada.

Em breve você receberá mais detalhes sobre data e horário.

_${CONSULTANT_NAME}_`;
        } else if (action === "progress_update") {
          message = `📊 *Atualização da Consultoria*

Olá, ${safeClientName}! Temos novidades sobre o andamento da sua consultoria.

Acesse seu dashboard para ver os detalhes completos.

_${CONSULTANT_NAME}_`;
        }

        if (message) {
          const response = await fetch(
            `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: formattedPhone,
                message: message
              }),
            }
          );

          if (response.ok) {
            console.log("WhatsApp message sent successfully");
            results.whatsapp = true;
          } else {
            console.error("Failed to send WhatsApp:", await response.text());
            results.whatsapp = false;
          }
        }
      } catch (error) {
        console.error("Error sending WhatsApp:", error);
        results.whatsapp = false;
      }
    }

    // Send Email notification
    if (emailEnabled && clientEmail && resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        // Sanitize for HTML
        const safeHtmlName = escapeHtml(safeClientName);
        
        let subject = "";
        let htmlContent = "";
        
        if (action === "form_submitted") {
          subject = "🎉 Diagnóstico recebido - Próximos passos";
          htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #16a34a;">Diagnóstico Recebido com Sucesso!</h1>
              
              <p>Olá, <strong>${safeHtmlName}</strong>!</p>
              
              <p>Seu formulário de diagnóstico foi recebido e estamos analisando todas as informações para preparar um plano personalizado para o seu escritório.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">📅 Próximo Passo: Agendar Reunião</h3>
                <p>Para iniciarmos a implantação da sua intranet jurídica, precisamos agendar nossa primeira reunião.</p>
                <a href="${escapeHtml(bookingUrl)}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                  Agendar Reunião
                </a>
              </div>
              
              <h3>O que vamos fazer:</h3>
              <ul>
                <li>Análise detalhada do seu diagnóstico</li>
                <li>Geração do prompt personalizado</li>
                <li>Início da implementação a quatro mãos</li>
                <li>Acompanhamento contínuo</li>
              </ul>
              
              <p>Qualquer dúvida, estou à disposição!</p>
              
              <p>Abraços,<br><strong>${CONSULTANT_NAME}</strong><br>Consultoria IDEA</p>
            </div>
          `;
        } else if (action === "session_scheduled") {
          subject = "📅 Reunião de Consultoria Agendada";
          htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #2563eb;">Reunião Agendada!</h1>
              <p>Olá, <strong>${safeHtmlName}</strong>!</p>
              <p>Uma nova reunião de consultoria foi agendada. Em breve você receberá mais detalhes.</p>
              <p>Abraços,<br><strong>${CONSULTANT_NAME}</strong></p>
            </div>
          `;
        }

        if (subject && htmlContent) {
          const emailResponse = await resend.emails.send({
            from: `${CONSULTANT_NAME} <onboarding@resend.dev>`,
            to: [clientEmail],
            subject: subject,
            html: htmlContent,
          });

          console.log("Email sent successfully:", emailResponse);
          results.email = true;
        }
      } catch (error) {
        console.error("Error sending email:", error);
        results.email = false;
      }
    }

    // Also notify the consultant
    if (action === "form_submitted" && resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        // Sanitize for HTML
        const safeHtmlName = escapeHtml(safeClientName);
        const safeHtmlEmail = escapeHtml(clientEmail || 'Não informado');
        const safeHtmlPhone = escapeHtml(clientPhone || 'Não informado');
        
        await resend.emails.send({
          from: `Sistema IDEA <onboarding@resend.dev>`,
          to: [CONSULTANT_EMAIL],
          subject: `🆕 Novo Diagnóstico: ${safeHtmlName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #16a34a;">Novo Diagnóstico Recebido!</h1>
              
              <p>Um novo cliente preencheu o formulário de diagnóstico:</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Nome:</strong> ${safeHtmlName}</p>
                <p><strong>E-mail:</strong> ${safeHtmlEmail}</p>
                <p><strong>Telefone:</strong> ${safeHtmlPhone}</p>
              </div>
              
              <p>Acesse o painel de consultoria para ver os detalhes completos.</p>
            </div>
          `,
        });
        
        console.log("Consultant notification email sent");
      } catch (error) {
        console.error("Error sending consultant notification:", error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: "Notifications processed" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    console.error("Error in send-consulting-notification:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
