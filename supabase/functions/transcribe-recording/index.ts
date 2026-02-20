import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

async function getValidAccessToken(supabase: any, userId: string): Promise<string> {
  const { data: tokenData, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) throw new Error('Google não conectado');

  if (new Date(tokenData.expires_at) < new Date()) {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const tokens = await tokenResponse.json();
    if (tokens.error) throw new Error(tokens.error_description || tokens.error);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    await supabase
      .from('google_calendar_tokens')
      .update({ access_token: tokens.access_token, expires_at: expiresAt })
      .eq('user_id', userId);
    return tokens.access_token;
  }
  return tokenData.access_token;
}

/** Format phone to Z-API standard */
function formatPhone(phone: string): string {
  let p = phone.replace(/\D/g, '');
  if (!p.startsWith('55')) p = '55' + p;
  return p;
}

/** Send summary via WhatsApp (Z-API) */
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
    console.warn('[transcribe-recording] Z-API not configured, skipping WhatsApp send');
    return;
  }

  const { data: client } = await supabase
    .from('consulting_clients')
    .select('full_name, phone')
    .eq('id', clientId)
    .single();

  if (!client?.phone) {
    console.warn('[transcribe-recording] Client phone not found, skipping WhatsApp');
    return;
  }

  const formattedPhone = formatPhone(client.phone);

  let dateStr = '';
  try {
    dateStr = new Date(sessionDate).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch { dateStr = sessionDate; }

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
    console.error('[transcribe-recording] WhatsApp send failed:', resp.status, errText);
  } else {
    console.log(`[transcribe-recording] WhatsApp summary sent to ${client.full_name} (${formattedPhone})`);
  }
}

async function generateAISummary(transcription: string, clientName: string, sessionTitle: string): Promise<string> {
  const prompt = `Você é um assistente especializado em consultoria de IA para advogados. Analise a transcrição desta reunião de consultoria e gere um resumo estruturado em português brasileiro.

Cliente: ${clientName}
Reunião: ${sessionTitle}

A transcrição da reunião é:

${transcription.substring(0, 30000)}

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
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error('[transcribe-recording] AI error:', errText);
    throw new Error('Erro ao gerar resumo com IA');
  }

  const aiData = await aiResponse.json();
  return aiData.choices?.[0]?.message?.content || '';
}

/**
 * Build a multipart/form-data body by streaming the Drive file directly.
 * This avoids loading the entire file into Edge Function memory.
 * We use a boundary to construct the multipart payload manually,
 * piping the Drive response body directly into the outgoing request body.
 */
async function transcribeViaStream(
  accessToken: string,
  fileId: string,
  fileName: string,
): Promise<string> {
  const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
  // First get file metadata to know size and mime type
  const metaResp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=size,mimeType,name`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  let mimeType = 'video/mp4';
  let fileSize = 0;
  if (metaResp.ok) {
    const meta = await metaResp.json();
    mimeType = meta.mimeType || 'video/mp4';
    fileSize = parseInt(meta.size || '0', 10);
    const sizeMB = Math.round(fileSize / 1024 / 1024);
    console.log(`[transcribe-recording] File: ${meta.name}, size=${sizeMB}MB, type=${mimeType}`);
  }

  // Build the multipart boundary
  const boundary = `----ElevenLabsBoundary${Date.now()}`;
  const safeFileName = fileName || 'recording.mp4';

  // Preamble: headers for the file part
  const preamble = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${safeFileName}"`,
    `Content-Type: ${mimeType}`,
    '',
    '', // empty line before body
  ].join('\r\n');

  // Fields: model_id, language_code, diarize
  const fields = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="model_id"`,
    '',
    'scribe_v2',
    `--${boundary}`,
    `Content-Disposition: form-data; name="language_code"`,
    '',
    'por',
    `--${boundary}`,
    `Content-Disposition: form-data; name="diarize"`,
    '',
    'true',
    `--${boundary}--`,
    '',
  ].join('\r\n');

  const preambleBytes = new TextEncoder().encode(preamble);
  // separator between file data and trailing fields
  const separatorBytes = new TextEncoder().encode(`\r\n`);
  const fieldsBytes = new TextEncoder().encode(fields);

  // Fetch the file from Drive as a stream
  const driveResp = await fetch(driveUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!driveResp.ok) {
    throw new Error(`Drive download failed: ${driveResp.status} ${driveResp.statusText}`);
  }

  if (!driveResp.body) {
    throw new Error('Drive response has no body');
  }

  // Create a TransformStream to pipe: preamble + drive stream + fields
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Write asynchronously
  (async () => {
    try {
      await writer.write(preambleBytes);

      const reader = driveResp.body!.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }

      await writer.write(separatorBytes);
      await writer.write(fieldsBytes);
    } catch (e) {
      console.error('[transcribe-recording] Stream write error:', e);
    } finally {
      await writer.close();
    }
  })();

  // Calculate total content-length if we know file size
  let contentLength: string | undefined;
  if (fileSize > 0) {
    const total = preambleBytes.length + fileSize + separatorBytes.length + fieldsBytes.length;
    contentLength = String(total);
  }

  const headers: Record<string, string> = {
    'xi-api-key': ELEVENLABS_API_KEY,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
  };
  if (contentLength) {
    headers['Content-Length'] = contentLength;
  }

  console.log(`[transcribe-recording] Streaming to ElevenLabs via multipart pipe...`);

  const sttResp = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers,
    body: readable,
    // @ts-ignore - duplex required for streaming body in some runtimes
    duplex: 'half',
  });

  if (!sttResp.ok) {
    const errText = await sttResp.text();
    console.error('[transcribe-recording] ElevenLabs stream error:', errText);
    throw new Error(`ElevenLabs STT failed (stream): ${sttResp.status} — ${errText}`);
  }

  const result = await sttResp.json();
  return result.text || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { userId, sessionId, fileId, fileName, force } = body;

    if (!userId || !sessionId || !fileId) {
      return new Response(JSON.stringify({ error: 'userId, sessionId, and fileId are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[transcribe-recording] Starting: session=${sessionId}, file=${fileName || fileId}`);

    // Check if session already has transcription
    const { data: session } = await supabase
      .from('consulting_sessions')
      .select('id, title, transcription, ai_summary, client_id, consulting_clients!client_id(full_name)')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Sessão não encontrada' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (session.transcription && !force) {
      console.log('[transcribe-recording] Session already has transcription, skipping STT (use force=true to override)');
      // Just generate summary if missing
      if (!session.ai_summary) {
        const clientName = (session.consulting_clients as any)?.full_name || '';
        const summary = await generateAISummary(session.transcription, clientName, session.title);
        if (summary) {
          await supabase.from('consulting_sessions').update({
            ai_summary: summary,
            summary_generated_at: new Date().toISOString(),
          }).eq('id', sessionId);

          // Send via WhatsApp (non-blocking)
          if (session.client_id) {
            try {
              await sendSummaryViaWhatsApp(
                supabase,
                session.client_id,
                session.title,
                session.session_date,
                summary,
              );
            } catch (wpErr) {
              console.warn('[transcribe-recording] WhatsApp send error (non-blocking):', wpErr);
            }
          }
        }
        return new Response(JSON.stringify({ success: true, action: 'summary_only', summary_length: summary.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true, action: 'already_complete' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (session.transcription && force) {
      console.log('[transcribe-recording] force=true: clearing existing transcription and reprocessing...');
      await supabase.from('consulting_sessions').update({
        transcription: null,
        ai_summary: null,
        summary_generated_at: null,
      }).eq('id', sessionId);
    }

    const accessToken = await getValidAccessToken(supabase, userId);

    // Stream the Drive file directly to ElevenLabs — no memory accumulation
    const transcription = await transcribeViaStream(accessToken, fileId, fileName || 'recording.mp4');

    console.log(`[transcribe-recording] Transcription: ${transcription.length} chars`);

    if (!transcription || transcription.trim().length < 50) {
      return new Response(JSON.stringify({ success: false, error: 'Transcrição vazia ou muito curta' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save transcription
    await supabase.from('consulting_sessions').update({ transcription }).eq('id', sessionId);

    // Generate AI summary
    const clientName = (session.consulting_clients as any)?.full_name || '';
    console.log(`[transcribe-recording] Generating AI summary for "${session.title}"...`);
    let summary = '';
    try {
      summary = await generateAISummary(transcription, clientName, session.title);
      if (summary) {
        await supabase.from('consulting_sessions').update({
          ai_summary: summary,
          summary_generated_at: new Date().toISOString(),
        }).eq('id', sessionId);

        // Send summary via WhatsApp automatically (non-blocking)
        if (session.client_id) {
          try {
            await sendSummaryViaWhatsApp(
              supabase,
              session.client_id,
              session.title,
              session.session_date,
              summary,
            );
          } catch (wpErr) {
            console.warn('[transcribe-recording] WhatsApp send error (non-blocking):', wpErr);
          }
        }
      }
    } catch (e) {
      console.warn('[transcribe-recording] Summary generation failed:', e);
    }

    console.log(`[transcribe-recording] Done! Transcription: ${transcription.length} chars, Summary: ${summary.length} chars`);

    return new Response(JSON.stringify({
      success: true,
      transcription_length: transcription.length,
      summary_length: summary.length,
      session_title: session.title,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[transcribe-recording] Error:', error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
