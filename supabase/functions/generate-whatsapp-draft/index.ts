// Lovable Cloud backend function: generate a WhatsApp draft message using Lovable AI
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody = {
  clientName?: string;
  clientPhone?: string;
  description?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Backend env vars missing");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") ?? "",
        },
      },
    });

    // Validate JWT (verify_jwt is disabled in config)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const description = (body.description ?? "").trim();
    const clientName = (body.clientName ?? "").trim();
    const clientPhone = (body.clientPhone ?? "").trim();

    if (!description) {
      return new Response(JSON.stringify({ error: "Descrição é obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load training docs (grounding) for this user
    const { data: docs, error: docsError } = await supabase
      .from("ai_training_documents")
      .select("title, content")
      .eq("user_id", userId)
      .eq("status", "trained")
      .order("created_at", { ascending: false })
      .limit(10);

    if (docsError) {
      console.error("Docs fetch error:", docsError);
    }

    const knowledgeBase = (docs ?? [])
      .map((d) => {
        const title = d.title ? `# ${d.title}` : "# Documento";
        const content = (d.content ?? "").trim();
        return `${title}\n${content}`;
      })
      .join("\n\n---\n\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt =
      "Você é um assistente de consultoria. Gere UMA mensagem curta e acolhedora para WhatsApp (2–3 frases). " +
      "Use SOMENTE as informações fornecidas no contexto (dados do cliente + base de conhecimento). " +
      "É proibido inventar fatos, regras ou detalhes. Se faltar informação, peça uma pergunta objetiva para eu completar.";

    const userPrompt =
      `Dados do cliente:\n- Nome: ${clientName || "(não informado)"}\n- Telefone: ${clientPhone || "(não informado)"}\n\n` +
      `Pedido do consultor (o que deve ser comunicado):\n${description}\n\n` +
      `Base de conhecimento (use para manter tom/consistência; não invente):\n${knowledgeBase || "(sem documentos de treino)"}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 180,
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      const status = aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 500;
      const error =
        aiResp.status === 429
          ? "Muitas solicitações. Tente novamente em instantes."
          : aiResp.status === 402
            ? "Créditos de IA esgotados. Adicione créditos para continuar."
            : "Erro ao gerar mensagem.";

      return new Response(JSON.stringify({ error }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const message = (aiJson?.choices?.[0]?.message?.content ?? "").trim();

    if (!message) {
      return new Response(JSON.stringify({ error: "IA não retornou mensagem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-whatsapp-draft error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
