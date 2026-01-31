import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate JWT and get authenticated user
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("JWT validation failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authenticatedUserId = claimsData.claims.sub as string;

    const { conversationId } = await req.json();
    
    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: "conversationId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify conversation belongs to authenticated user
    const { data: conversation, error: convError } = await supabase
      .from("whatsapp_conversations")
      .select("contact_name, contact_phone")
      .eq("id", conversationId)
      .eq("user_id", authenticatedUserId)
      .single();

    if (convError || !conversation) {
      console.error("Conversation not found or access denied:", convError);
      return new Response(
        JSON.stringify({ error: "Conversa não encontrada ou acesso negado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch messages (conversation ownership already verified)
    const { data: messages, error: messagesError } = await supabase
      .from("whatsapp_messages")
      .select("content, is_from_contact, is_ai_response, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ summary: "Nenhuma mensagem encontrada para resumir." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contactName = conversation?.contact_name || conversation?.contact_phone || "Contato";

    // Format messages for summary
    const formattedMessages = messages.map((msg) => {
      const sender = msg.is_from_contact ? contactName : (msg.is_ai_response ? "IA" : "Você");
      return `${sender}: ${msg.content}`;
    }).join("\n");

    // Generate summary using Lovable AI
    const response = await fetch("https://api.lovable.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um assistente que gera resumos concisos de conversas de chat em português brasileiro.
            
Gere um resumo estruturado contendo:
1. Tópicos principais discutidos
2. Perguntas feitas pelo contato
3. Resoluções ou próximos passos
4. Pontos importantes a lembrar

Seja conciso e objetivo. Máximo 200 palavras.`
          },
          {
            role: "user",
            content: `Gere um resumo da seguinte conversa:\n\n${formattedMessages}`
          }
        ],
        max_tokens: 500,
      }),
    });

    const aiResult = await response.json();
    const summary = aiResult.choices?.[0]?.message?.content || "Não foi possível gerar o resumo.";

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating summary:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
