import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const campaignId = url.searchParams.get("campaign");
    const reason = url.searchParams.get("reason") || "user_request";

    if (!email) {
      return new Response(
        generateHtmlPage("Erro", "E-mail não fornecido.", false),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Decode email from base64
    let decodedEmail: string;
    try {
      decodedEmail = atob(email);
    } catch {
      decodedEmail = email;
    }

    // Get user agent and IP
    const userAgent = req.headers.get("user-agent") || null;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                      req.headers.get("cf-connecting-ip") || null;

    // Insert unsubscribe record
    const { error } = await supabase
      .from("email_unsubscribes")
      .upsert({
        email: decodedEmail.toLowerCase(),
        reason,
        campaign_id: campaignId || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        unsubscribed_at: new Date().toISOString()
      }, {
        onConflict: "email",
        ignoreDuplicates: false
      });

    if (error) {
      console.error("Error saving unsubscribe:", error);
      // If it's a duplicate, still show success
      if (error.code !== "23505") {
        throw error;
      }
    }

    console.log(`Email unsubscribed: ${decodedEmail}`);

    // Return success HTML page
    return new Response(
      generateHtmlPage(
        "Descadastro Confirmado",
        `O e-mail <strong>${decodedEmail}</strong> foi removido da nossa lista de e-mails.<br><br>Você não receberá mais comunicações por e-mail.`,
        true
      ),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
    );

  } catch (error: unknown) {
    console.error("Error in email-unsubscribe:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      generateHtmlPage("Erro", `Ocorreu um erro ao processar seu descadastro: ${errorMessage}`, false),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
    );
  }
});

function generateHtmlPage(title: string, message: string, success: boolean): string {
  const icon = success 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Rafael Egg</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 500px;
      padding: 40px;
      background: rgba(255,255,255,0.05);
      border-radius: 16px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .icon { margin-bottom: 24px; }
    h1 {
      font-size: 28px;
      margin-bottom: 16px;
      color: ${success ? '#10b981' : '#ef4444'};
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: rgba(255,255,255,0.8);
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.1);
      font-size: 14px;
      color: rgba(255,255,255,0.5);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="footer">
      Rafael Egg - Consultoria em IA para Advogados
    </div>
  </div>
</body>
</html>`;
}
