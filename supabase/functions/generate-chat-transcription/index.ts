import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { format } from "https://esm.sh/date-fns@3.6.0";
import { ptBR } from "https://esm.sh/date-fns@3.6.0/locale";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId } = await req.json();
    
    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: "conversationId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from("whatsapp_messages")
      .select("content, is_from_contact, is_ai_response, message_type, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ transcription: "Nenhuma mensagem encontrada." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch conversation details
    const { data: conversation } = await supabase
      .from("whatsapp_conversations")
      .select("contact_name, contact_phone, channel")
      .eq("id", conversationId)
      .single();

    const contactName = conversation?.contact_name || conversation?.contact_phone || "Contato";
    const channel = conversation?.channel?.toUpperCase() || "WHATSAPP";

    // Format transcription
    const header = `═══════════════════════════════════════════════
TRANSCRIÇÃO DE CONVERSA - ${channel}
Contato: ${contactName}
Telefone: ${conversation?.contact_phone || "N/A"}
Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
Total de mensagens: ${messages.length}
═══════════════════════════════════════════════\n\n`;

    let currentDate = "";
    const formattedMessages = messages.map((msg) => {
      const msgDate = format(new Date(msg.created_at), "dd/MM/yyyy", { locale: ptBR });
      const msgTime = format(new Date(msg.created_at), "HH:mm", { locale: ptBR });
      
      let dateHeader = "";
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        dateHeader = `\n─── ${msgDate} ───\n\n`;
      }

      const sender = msg.is_from_contact ? `📥 ${contactName}` : (msg.is_ai_response ? "🤖 IA" : "📤 Você");
      const msgType = msg.message_type === "audio" ? " [ÁUDIO]" : "";
      
      return `${dateHeader}[${msgTime}] ${sender}${msgType}:\n${msg.content}\n`;
    }).join("\n");

    const transcription = header + formattedMessages;

    return new Response(
      JSON.stringify({ transcription }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating transcription:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
