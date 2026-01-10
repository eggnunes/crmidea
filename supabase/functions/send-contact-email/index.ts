import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

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
  // Allow letters (including accented), spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  return nameRegex.test(name) && name.length >= 2 && name.length <= 100;
}

function isValidPhone(phone: string): boolean {
  // Allow digits, spaces, plus, hyphens, parentheses
  const phoneRegex = /^[\d\s+\-()]+$/;
  return phoneRegex.test(phone) && phone.length <= 30;
}

function isValidMessage(message: string): boolean {
  return message.length >= 10 && message.length <= 5000;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    
    // Extract and trim inputs
    const name = typeof rawData.name === 'string' ? rawData.name.trim() : '';
    const email = typeof rawData.email === 'string' ? rawData.email.trim().toLowerCase() : '';
    const phone = typeof rawData.phone === 'string' ? rawData.phone.trim() : undefined;
    const message = typeof rawData.message === 'string' ? rawData.message.trim() : '';

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Nome, email e mensagem são obrigatórios" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate input formats
    if (!isValidName(name)) {
      return new Response(
        JSON.stringify({ error: "Nome inválido. Use apenas letras e espaços (2-100 caracteres)" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (phone && !isValidPhone(phone)) {
      return new Response(
        JSON.stringify({ error: "Telefone inválido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!isValidMessage(message)) {
      return new Response(
        JSON.stringify({ error: "Mensagem deve ter entre 10 e 5000 caracteres" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Sanitize inputs for HTML output
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = phone ? escapeHtml(phone) : null;
    const safeMessage = escapeHtml(message);

    // Send notification email to Rafael
    const notificationRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Contato Site <onboarding@resend.dev>",
        to: ["contato@rafaelegg.com"],
        subject: `Nova mensagem de contato: ${safeName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">Nova mensagem de contato</h1>
            <div style="background: #1e293b; padding: 20px; border-radius: 10px; color: #e2e8f0;">
              <p><strong>Nome:</strong> ${safeName}</p>
              <p><strong>Email:</strong> ${safeEmail}</p>
              ${safePhone ? `<p><strong>Telefone:</strong> ${safePhone}</p>` : ''}
              <p><strong>Mensagem:</strong></p>
              <p style="background: #0f172a; padding: 15px; border-radius: 5px;">${safeMessage.replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        `,
      }),
    });

    if (!notificationRes.ok) {
      const errorData = await notificationRes.text();
      console.error("Error sending notification email:", errorData);
      throw new Error("Failed to send notification email");
    }

    // Send confirmation email to the sender
    const confirmationRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Rafael Egg <onboarding@resend.dev>",
        to: [email],
        subject: "Recebemos sua mensagem!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">Olá, ${safeName}!</h1>
            <p style="color: #64748b; font-size: 16px;">
              Recebi sua mensagem e entrarei em contato em breve.
            </p>
            <p style="color: #64748b; font-size: 16px;">
              Enquanto isso, você pode conhecer meus produtos e serviços em 
              <a href="https://rafaelegg.com" style="color: #f59e0b;">rafaelegg.com</a>
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155;">
              <p style="color: #94a3b8; font-size: 14px;">
                Atenciosamente,<br>
                <strong style="color: #f59e0b;">Rafael Egg</strong><br>
                Mentor em IA para Advocacia
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!confirmationRes.ok) {
      console.error("Warning: Could not send confirmation email");
    }

    console.log("Emails sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Mensagem enviada com sucesso!" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar solicitação" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
