import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    console.log("Notifying about new client signup:", { clientName, clientEmail });

    const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
    const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN");
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
      console.log("Z-API credentials not configured, skipping WhatsApp notification");
      return new Response(
        JSON.stringify({ success: true, message: "Notification skipped - Z-API not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get consultant's phone from follow_up_settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settings } = await supabase
      .from("follow_up_settings")
      .select("personal_whatsapp")
      .limit(1)
      .maybeSingle();

    const consultantPhone = settings?.personal_whatsapp || "5527998098704";
    
    // Format phone for Z-API
    const formattedPhone = consultantPhone.replace(/\D/g, "");

    const message = `🆕 *Novo Cadastro na Consultoria IDEA!*

👤 *Nome:* ${clientName}
📧 *E-mail:* ${clientEmail}
${clientPhone ? `📱 *Telefone:* ${clientPhone}` : ""}

⏳ O cliente está aguardando aprovação para acessar a área do cliente.

Acesse o painel administrativo para aprovar: /metodo-ideia/consultoria`;

    const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;

    const response = await fetch(zapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ZAPI_CLIENT_TOKEN && { "Client-Token": ZAPI_CLIENT_TOKEN }),
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    });

    const result = await response.json();
    console.log("Z-API response:", result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
