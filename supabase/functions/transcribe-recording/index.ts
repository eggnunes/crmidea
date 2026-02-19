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
      console.log('[transcribe-recording] force=true: clearing existing transcription and reprocessing from recording...');
      await supabase.from('consulting_sessions').update({
        transcription: null,
        ai_summary: null,
        summary_generated_at: null,
      }).eq('id', sessionId);
    }

    const accessToken = await getValidAccessToken(supabase, userId);

    // Download file from Drive as blob (we need the full file for ElevenLabs)
    console.log(`[transcribe-recording] Downloading ${fileName || fileId} from Drive...`);
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const driveResp = await fetch(driveUrl, { headers: { Authorization: `Bearer ${accessToken}` } });

    if (!driveResp.ok) {
      throw new Error(`Drive download failed: ${driveResp.status}`);
    }

    // Read file into memory - Edge Functions have ~150MB memory on Supabase
    // For files >150MB, we stream to ElevenLabs using manual multipart
    const contentLength = parseInt(driveResp.headers.get('content-length') || '0', 10);
    const sizeMB = Math.round(contentLength / 1024 / 1024);
    console.log(`[transcribe-recording] File size: ${sizeMB}MB`);

    let transcription = '';

    if (contentLength > 0 && contentLength < 120 * 1024 * 1024) {
      // Small enough to fit in memory - use standard FormData
      console.log('[transcribe-recording] Using standard upload (fits in memory)');
      const blob = await driveResp.blob();

      const formData = new FormData();
      formData.append('file', blob, fileName || 'recording.mp4');
      formData.append('model_id', 'scribe_v2');
      formData.append('language_code', 'por');
      formData.append('diarize', 'true');

      const sttResp = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': ELEVENLABS_API_KEY },
        body: formData,
      });

      if (!sttResp.ok) {
        const errText = await sttResp.text();
        console.error('[transcribe-recording] ElevenLabs error:', errText);
        throw new Error(`ElevenLabs STT failed: ${sttResp.status}`);
      }

      const result = await sttResp.json();
      transcription = result.text || '';
    } else {
      // Large file - use streaming multipart upload
      console.log('[transcribe-recording] Using streaming multipart upload');
      
      const boundary = '----ElevenLabsBoundary' + Date.now();
      const encoder = new TextEncoder();

      const fields: Record<string, string> = {
        model_id: 'scribe_v2',
        language_code: 'por',
        diarize: 'true',
        tag_audio_events: 'false',
      };

      let preamble = '';
      for (const [key, value] of Object.entries(fields)) {
        preamble += `--${boundary}\r\n`;
        preamble += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
        preamble += `${value}\r\n`;
      }

      const ext = (fileName || 'mp4').split('.').pop()?.toLowerCase() || 'mp4';
      const mimeMap: Record<string, string> = {
        mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg',
        m4a: 'audio/mp4', mkv: 'video/x-matroska',
      };
      preamble += `--${boundary}\r\n`;
      preamble += `Content-Disposition: form-data; name="file"; filename="${fileName || 'recording.mp4'}"\r\n`;
      preamble += `Content-Type: ${mimeMap[ext] || 'application/octet-stream'}\r\n\r\n`;

      const epilogue = `\r\n--${boundary}--\r\n`;
      const preambleBytes = encoder.encode(preamble);
      const epilogueBytes = encoder.encode(epilogue);
      const driveReader = driveResp.body!.getReader();

      let phase: 'preamble' | 'file' | 'done' = 'preamble';

      const combinedStream = new ReadableStream({
        async pull(controller) {
          if (phase === 'preamble') {
            controller.enqueue(preambleBytes);
            phase = 'file';
            return;
          }
          if (phase === 'file') {
            const { done, value } = await driveReader.read();
            if (done) {
              controller.enqueue(epilogueBytes);
              phase = 'done';
              controller.close();
              return;
            }
            controller.enqueue(value);
            return;
          }
          controller.close();
        },
      });

      const sttResp = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: combinedStream,
      });

      if (!sttResp.ok) {
        const errText = await sttResp.text();
        console.error('[transcribe-recording] ElevenLabs streaming error:', errText);
        throw new Error(`ElevenLabs STT streaming failed: ${sttResp.status}`);
      }

      const result = await sttResp.json();
      transcription = result.text || '';
    }

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
