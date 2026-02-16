import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
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

async function findFolderByName(accessToken: string, folderName: string, parentId?: string): Promise<string | null> {
  const q = parentId
    ? `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`
    : `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and trashed=false`;
  
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'files(id,name)');
  url.searchParams.set('pageSize', '5');

  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

async function listFilesInFolder(accessToken: string, folderId: string, mimeFilter?: string): Promise<any[]> {
  let q = `'${folderId}' in parents and trashed=false`;
  if (mimeFilter) q += ` and ${mimeFilter}`;

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'files(id,name,createdTime,mimeType,webViewLink)');
  url.searchParams.set('pageSize', '200');
  url.searchParams.set('orderBy', 'createdTime desc');

  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  return data.files || [];
}

async function downloadFileContent(accessToken: string, fileId: string, mimeType: string): Promise<string> {
  let url: string;
  if (mimeType === 'application/vnd.google-apps.document') {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
  } else {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  }

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Failed to download file ${fileId}: ${res.status}`);
  return await res.text();
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
    console.error('[batch-import] AI error:', errText);
    throw new Error('Erro ao gerar resumo com IA');
  }

  const aiData = await aiResponse.json();
  return aiData.choices?.[0]?.message?.content || '';
}

function normalizeForMatch(str: string): string {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
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

    const body = await req.json().catch(() => ({}));
    const { clientId } = body;

    console.log(`[batch-import] Starting for userId=${user.id}, clientId=${clientId || 'ALL'}`);

    const accessToken = await getValidAccessToken(supabase, user.id);

    // Get sessions that need transcription or summary
    let sessQuery = supabase
      .from('consulting_sessions')
      .select('*, consulting_clients!client_id(full_name)')
      .eq('user_id', user.id);

    if (clientId) {
      sessQuery = sessQuery.eq('client_id', clientId);
    }

    const { data: sessions, error: sessErr } = await sessQuery;
    if (sessErr) throw sessErr;

    if (!sessions || sessions.length === 0) {
      return new Response(JSON.stringify({ transcriptions: 0, summaries: 0, message: 'Nenhuma sessão encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[batch-import] Found ${sessions.length} sessions`);

    // Find Meet Recordings folder
    const meetFolderId = await findFolderByName(accessToken, 'Meet Recordings');
    if (!meetFolderId) {
      return new Response(JSON.stringify({ error: 'Pasta "Meet Recordings" não encontrada no Google Drive' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[batch-import] Meet Recordings folder: ${meetFolderId}`);

    // List all transcript files in Meet Recordings
    const transcriptFiles = await listFilesInFolder(accessToken, meetFolderId,
      "(mimeType='text/plain' or mimeType='application/vnd.google-apps.document' or mimeType='text/vtt' or mimeType='application/x-subrip')");

    console.log(`[batch-import] Found ${transcriptFiles.length} transcript files in Meet Recordings`);

    let transcriptionsImported = 0;
    let summariesGenerated = 0;
    const results: any[] = [];

    // For each session without transcription, try to find a matching transcript
    const sessionsNeedingTranscript = sessions.filter((s: any) => !s.transcription);
    
    for (const session of sessionsNeedingTranscript) {
      const sessionDate = new Date(session.session_date);
      const sessionDateStr = sessionDate.toISOString().split('T')[0];
      const clientName = (session.consulting_clients as any)?.full_name || '';
      const normalizedClient = normalizeForMatch(clientName);

      // Find transcripts created on the same day
      const sameDayTranscripts = transcriptFiles.filter((f: any) => {
        const fDateStr = new Date(f.createdTime).toISOString().split('T')[0];
        return fDateStr === sessionDateStr;
      });

      if (sameDayTranscripts.length === 0) continue;

      let match = null;

      // Priority 1: Client name in file name
      if (normalizedClient) {
        const clientParts = normalizedClient.split(/\s+/).filter((p: string) => p.length > 2);
        match = sameDayTranscripts.find((f: any) => {
          const normalizedFile = normalizeForMatch(f.name);
          return clientParts.some((part: string) => normalizedFile.includes(part));
        });
      }

      // Priority 2: Closest time match
      if (!match && sameDayTranscripts.length > 1) {
        const sessionTime = sessionDate.getTime();
        let bestDiff = Infinity;
        for (const f of sameDayTranscripts) {
          const fTime = new Date(f.createdTime).getTime();
          const diff = Math.abs(fTime - sessionTime);
          if (diff < 4 * 60 * 60 * 1000 && diff < bestDiff) {
            bestDiff = diff;
            match = f;
          }
        }
      }

      // Priority 3: Only one transcript that day
      if (!match && sameDayTranscripts.length === 1) {
        match = sameDayTranscripts[0];
      }

      if (match) {
        try {
          console.log(`[batch-import] Matched "${session.title}" → "${match.name}"`);
          const content = await downloadFileContent(accessToken, match.id, match.mimeType);

          if (content && content.trim().length > 50) {
            await supabase
              .from('consulting_sessions')
              .update({ transcription: content })
              .eq('id', session.id);

            session.transcription = content;
            transcriptionsImported++;
            results.push({ session: session.title, action: 'transcription', file: match.name });

            // Remove matched file to avoid reuse
            const idx = transcriptFiles.findIndex((f: any) => f.id === match.id);
            if (idx >= 0) transcriptFiles.splice(idx, 1);
          }
        } catch (e) {
          console.warn(`[batch-import] Error downloading transcript for "${session.title}":`, e);
        }
      }
    }

    // Now generate AI summaries for all sessions that have transcription but no summary
    const sessionsNeedingSummary = sessions.filter((s: any) => s.transcription && !s.ai_summary);

    for (const session of sessionsNeedingSummary) {
      try {
        const clientName = (session.consulting_clients as any)?.full_name || '';
        console.log(`[batch-import] Generating summary for "${session.title}"`);

        const summary = await generateAISummary(session.transcription, clientName, session.title);
        
        if (summary) {
          await supabase
            .from('consulting_sessions')
            .update({
              ai_summary: summary,
              summary_generated_at: new Date().toISOString(),
            })
            .eq('id', session.id);

          summariesGenerated++;
          results.push({ session: session.title, action: 'summary' });
        }
      } catch (e) {
        console.warn(`[batch-import] Error generating summary for "${session.title}":`, e);
        results.push({ session: session.title, action: 'summary_error', error: String(e) });
      }
    }

    console.log(`[batch-import] Done: ${transcriptionsImported} transcriptions, ${summariesGenerated} summaries`);

    return new Response(JSON.stringify({
      transcriptions: transcriptionsImported,
      summaries: summariesGenerated,
      totalSessions: sessions.length,
      details: results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[batch-import] Error:', error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
