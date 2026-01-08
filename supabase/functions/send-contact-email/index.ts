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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, message }: ContactEmailRequest = await req.json();

    // Validate inputs
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Nome, email e mensagem são obrigatórios" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

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
        subject: `Nova mensagem de contato: ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">Nova mensagem de contato</h1>
            <div style="background: #1e293b; padding: 20px; border-radius: 10px; color: #e2e8f0;">
              <p><strong>Nome:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${phone ? `<p><strong>Telefone:</strong> ${phone}</p>` : ''}
              <p><strong>Mensagem:</strong></p>
              <p style="background: #0f172a; padding: 15px; border-radius: 5px;">${message.replace(/\n/g, '<br>')}</p>
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
            <h1 style="color: #f59e0b;">Olá, ${name}!</h1>
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
