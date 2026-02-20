import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

/** Format phone to Z-API standard (55XXXXXXXXXXX) */
function formatPhone(phone: string): string {
  let p = phone.replace(/\D/g, '');
  if (!p.startsWith('55')) p = '55' + p;
  return p;
}

/** Send the AI summary via WhatsApp (Z-API) to the consulting client */
async function sendSummaryViaWhatsApp(
  supabase: any,
  clientId: string,
  sessionTitle: string,
  sessionDate: string,
  aiSummary: string,
): Promise<void> {
  const ZAPI_INSTANCE_ID = Deno.env.get('ZAPI_INSTANCE_ID');
  const ZAPI_TOKEN = Deno.env.get('ZAPI_TOKEN');
  const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN');

  if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
    console.warn('[summarize-meeting] Z-API not configured, skipping WhatsApp send');
    return;
  }

  // Get client phone
  const { data: client, error: clientErr } = await supabase
    .from('consulting_clients')
    .select('full_name, phone')
    .eq('id', clientId)
    .single();

  if (clientErr || !client?.phone) {
    console.warn('[summarize-meeting] Client phone not found, skipping WhatsApp');
    return;
  }

  const formattedPhone = formatPhone(client.phone);

  // Format date
  let dateStr = '';
  try {
    dateStr = new Date(sessionDate).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch { dateStr = sessionDate; }

  // Convert markdown to plain text for WhatsApp
  const plainSummary = aiSummary
    .replace(/^## .*/gm, '')
    .replace(/^### (.*)/gm, '*$1*')
    .replace(/^- /gm, '• ')
    .replace(/\*\*(.*?)\*\*/g, '*$1*')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const message =
    `📋 *Resumo da Reunião de Consultoria*\n` +
    `📅 ${sessionTitle} — ${dateStr}\n\n` +
    `${plainSummary}\n\n` +
    `_Este resumo foi gerado automaticamente após a reunião._`;

  const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ZAPI_CLIENT_TOKEN) headers['Client-Token'] = ZAPI_CLIENT_TOKEN;

  const resp = await fetch(zapiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phone: formattedPhone, message }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error('[summarize-meeting] WhatsApp send failed:', resp.status, errText);
  } else {
    console.log(`[summarize-meeting] WhatsApp summary sent to ${client.full_name} (${formattedPhone})`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { sessionId, sendWhatsApp = true } = body;
    if (!sessionId) throw new Error('sessionId é obrigatório');

    // Get session with transcription
    const { data: session, error: sessErr } = await supabase
      .from('consulting_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessErr || !session) throw new Error('Sessão não encontrada');
    if (!session.transcription) throw new Error('Sessão não possui transcrição. Transcreva primeiro.');

    console.log(`[summarize-meeting] Generating summary for session ${sessionId}`);

    const prompt = `Você é um assistente especializado em consultoria de IA para advogados. Analise a transcrição desta reunião de consultoria e gere um resumo estruturado em português brasileiro.

A transcrição da reunião é:

${session.transcription.substring(0, 30000)}

Gere o resumo no seguinte formato markdown:

## Resumo da Reunião

### 📋 Tópicos Discutidos
- Liste os principais tópicos abordados

### ✅ Decisões Tomadas
- Liste as decisões tomadas durante a reunião

### 🎯 Próximos Passos
- Liste as ações que devem ser executadas

### ⚠️ Pontos de Atenção
- Liste questões que precisam de acompanhamento

### 💡 Destaques
- Insights importantes ou conquistas mencionadas

Seja conciso mas completo. Use bullet points. Mantenha o foco em ações práticas.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('[summarize-meeting] AI error:', errText);
      throw new Error('Erro ao gerar resumo com IA');
    }

    const aiData = await aiResponse.json();
    const aiSummary = aiData.choices?.[0]?.message?.content || '';

    console.log(`[summarize-meeting] Summary generated, length=${aiSummary.length}`);

    // Save summary
    const { error: updateErr } = await supabase
      .from('consulting_sessions')
      .update({
        ai_summary: aiSummary,
        summary_generated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateErr) throw updateErr;

    // Send via WhatsApp automatically (non-blocking)
    if (sendWhatsApp && session.client_id && aiSummary) {
      try {
        await sendSummaryViaWhatsApp(
          supabase,
          session.client_id,
          session.title,
          session.session_date,
          aiSummary,
        );
      } catch (wpErr) {
        console.warn('[summarize-meeting] WhatsApp send error (non-blocking):', wpErr);
      }
    }

    return new Response(JSON.stringify({ success: true, ai_summary: aiSummary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[summarize-meeting] Error:', error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
