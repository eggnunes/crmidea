import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONSULTANT_NAME = "Rafael Egg";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header to identify the user
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const { clientEmail, clientName, subject, content } = await req.json();

    console.log(`Sending email to ${clientEmail} with subject: ${subject}`);

    if (!clientEmail || !subject || !content) {
      throw new Error("Missing required fields: clientEmail, subject, or content");
    }

    const resend = new Resend(resendApiKey);

    // Convert plain text content to HTML with proper formatting
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="white-space: pre-wrap; line-height: 1.6;">
${content.split('\n').map((line: string) => `          <p style="margin: 0 0 10px 0;">${line || '&nbsp;'}</p>`).join('\n')}
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Esta mensagem foi enviada por ${CONSULTANT_NAME} via plataforma IDEA Consultoria.
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: `${CONSULTANT_NAME} <contato@rafaelegg.com>`,
      to: [clientEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the sent email
    if (userId) {
      await supabase.from("sent_emails_log").insert({
        user_id: userId,
        recipient_email: clientEmail,
        recipient_name: clientName,
        subject: subject,
        email_type: "client_communication",
        status: "sent",
        metadata: { content_length: content.length }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        data: emailResponse
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    console.error("Error in send-client-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
