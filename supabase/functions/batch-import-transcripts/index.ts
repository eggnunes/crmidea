import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY') || '';

const PREPOSITIONS = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);
const TEXT_MIME_FILTER = "(mimeType='text/plain' or mimeType='application/vnd.google-apps.document' or mimeType='text/vtt' or mimeType='application/x-subrip')";
const RECORDING_MIME_FILTER = "(mimeType='video/mp4' or mimeType='video/webm' or mimeType='audio/mpeg' or mimeType='audio/mp4' or mimeType='audio/webm' or mimeType='audio/x-m4a' or mimeType='video/x-matroska')";

// ==================== Google Token ====================

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

// ==================== Drive Helpers ====================

async function findFolderByName(accessToken: string, name: string, parentId?: string): Promise<string | null> {
  const q = parentId
    ? `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`
    : `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and trashed=false`;
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'files(id,name)');
  url.searchParams.set('pageSize', '5');
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

async function findFolderContains(accessToken: string, term: string, parentId: string): Promise<{ id: string; name: string } | null> {
  const q = `mimeType='application/vnd.google-apps.folder' and name contains '${term.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`;
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'files(id,name)');
  url.searchParams.set('pageSize', '10');
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  return data.files?.[0] ? { id: data.files[0].id, name: data.files[0].name } : null;
}

async function listSubfolders(accessToken: string, parentId: string): Promise<any[]> {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`);
  url.searchParams.set('fields', 'files(id,name)');
  url.searchParams.set('pageSize', '100');
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  return data.files || [];
}

async function listFilesInFolder(accessToken: string, folderId: string, mimeFilter?: string): Promise<any[]> {
  let q = `'${folderId}' in parents and trashed=false`;
  if (mimeFilter) q += ` and ${mimeFilter}`;
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'files(id,name,createdTime,mimeType,webViewLink,size)');
  url.searchParams.set('pageSize', '200');
  url.searchParams.set('orderBy', 'createdTime asc');
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  return data.files || [];
}

async function collectFilesRecursive(accessToken: string, folderId: string): Promise<{ textFiles: any[]; recordingFiles: any[] }> {
  const [textFiles, recordingFiles, subfolders] = await Promise.all([
    listFilesInFolder(accessToken, folderId, TEXT_MIME_FILTER),
    listFilesInFolder(accessToken, folderId, RECORDING_MIME_FILTER),
    listSubfolders(accessToken, folderId),
  ]);
  for (const sub of subfolders) {
    const [subText, subRec] = await Promise.all([
      listFilesInFolder(accessToken, sub.id, TEXT_MIME_FILTER),
      listFilesInFolder(accessToken, sub.id, RECORDING_MIME_FILTER),
    ]);
    textFiles.push(...subText);
    recordingFiles.push(...subRec);
  }
  return { textFiles, recordingFiles };
}

// ==================== Consultoria Folder ====================

async function findConsultoriaFolder(accessToken: string): Promise<string | null> {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', `mimeType='application/vnd.google-apps.folder' and name contains 'Mentoria' and trashed=false`);
  url.searchParams.set('fields', 'files(id,name)');
  url.searchParams.set('pageSize', '20');
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  const mentoriaFolders = (await res.json()).files || [];

  for (const mentoria of mentoriaFolders) {
    const turma = await findFolderContains(accessToken, 'Turma', mentoria.id);
    if (turma) {
      const c1 = await findFolderByName(accessToken, 'Consultoria', turma.id);
      if (c1) return c1;
      const c2 = await findFolderContains(accessToken, 'Consultoria', turma.id);
      if (c2) return c2.id;
    }
    const direct = await findFolderByName(accessToken, 'Consultoria', mentoria.id);
    if (direct) return direct;
  }
  return null;
}

// ==================== Tactiq Detection ====================

const AUTO_SIGNATURES = ['tactiq', 'tactiq.io', 'tactiq ai', 'transcrevendo esta chamada com minha extensão', 'otter.ai', 'fireflies.ai'];

function isTactiqOrAutoTranscript(content: string): boolean {
  const lower = content.toLowerCase().substring(0, 3000);
  for (const sig of AUTO_SIGNATURES) {
    if (lower.includes(sig)) return true;
  }
  return /\d{2}:\d{2}:\d{2}[.,]\d{3}[\s,]*(?:-->|,)\s*\d{2}:\d{2}:\d{2}/m.test(content.substring(0, 2000));
}

async function downloadFileContent(accessToken: string, fileId: string, mimeType: string): Promise<string> {
  const url = mimeType === 'application/vnd.google-apps.document'
    ? `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`
    : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Failed to download file ${fileId}: ${res.status}`);
  return await res.text();
}

// ==================== Name Matching ====================

function normalizeForMatch(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
}

function fileMatchesClient(fileName: string, clientName: string): boolean {
  const normalizedFile = normalizeForMatch(fileName);
  const parts = normalizeForMatch(clientName).split(/\s+/).filter(p => !PREPOSITIONS.has(p) && p.length > 2);
  if (parts.length < 2) return false;
  return parts.filter(p => normalizedFile.includes(p)).length >= 2;
}

// ==================== AI Summary ====================

async function generateAISummary(transcription: string, clientName: string, sessionTitle: string): Promise<string> {
  const prompt = `Você é um assistente especializado em consultoria de IA para advogados. Analise a transcrição desta reunião de consultoria e gere um resumo estruturado em português brasileiro.

Cliente: ${clientName}
Reunião: ${sessionTitle}

Transcrição:
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

Seja conciso mas completo. Use bullet points.`;

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!aiResponse.ok) throw new Error('Erro ao gerar resumo com IA');
  const aiData = await aiResponse.json();
  return aiData.choices?.[0]?.message?.content || '';
}

// ==================== Main Handler ====================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) userId = user.id;
    }

    const body = await req.json().catch(() => ({}));
    if (!userId && body.userId) userId = body.userId;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { clientId, action } = body;
    console.log(`[batch-import] userId=${userId}, clientId=${clientId || 'ALL'}, action=${action || 'import'}`);

    // ===== ACTION: clean =====
    if (action === 'clean') {
      let cleanQuery = supabase
        .from('consulting_sessions')
        .update({ transcription: null, ai_summary: null, summary_generated_at: null })
        .eq('user_id', userId);
      if (clientId) cleanQuery = cleanQuery.eq('client_id', clientId);
      const { data, error } = await cleanQuery.select('id');
      if (error) throw error;
      const count = data?.length || 0;
      return new Response(JSON.stringify({ cleaned: count }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await getValidAccessToken(supabase, userId);

    // ===== ACTION: import (default) =====
  let sessQuery = supabase
      .from('consulting_sessions')
      .select('*, consulting_clients!client_id(id, full_name, meet_display_name)')
      .eq('user_id', userId);
    if (clientId) sessQuery = sessQuery.eq('client_id', clientId);

    const { data: sessions, error: sessErr } = await sessQuery;
    if (sessErr) throw sessErr;

    if (!sessions || sessions.length === 0) {
      return new Response(JSON.stringify({ transcriptions: 0, summaries: 0, message: 'Nenhuma sessão encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[batch-import] Found ${sessions.length} sessions`);

    // Gather files from Meet Recordings
    const meetFolderId = await findFolderByName(accessToken, 'Meet Recordings');
    let meetTranscriptFiles: any[] = [];
    let meetRecordingFiles: any[] = [];
    if (meetFolderId) {
      [meetTranscriptFiles, meetRecordingFiles] = await Promise.all([
        listFilesInFolder(accessToken, meetFolderId, TEXT_MIME_FILTER),
        listFilesInFolder(accessToken, meetFolderId, RECORDING_MIME_FILTER),
      ]);
      console.log(`[batch-import] Meet Recordings: ${meetTranscriptFiles.length} text, ${meetRecordingFiles.length} video`);
    }

    // Gather client folders from Consultoria
    const consultoriaFolderId = body.consultoriaFolderId || await findConsultoriaFolder(accessToken);
    let clientFolders: any[] = [];
    if (consultoriaFolderId) {
      clientFolders = await listSubfolders(accessToken, consultoriaFolderId);
      console.log(`[batch-import] ${clientFolders.length} client folders in Consultoria`);
    }

    let transcriptionsImported = 0;
    let summariesGenerated = 0;
    const results: any[] = [];
    const skipped: any[] = [];
    const allPendingRecordings: any[] = [];

    // Group sessions by client
    const sessionsByClient = new Map<string, any[]>();
    for (const session of sessions) {
      const key = session.client_id;
      if (!sessionsByClient.has(key)) sessionsByClient.set(key, []);
      sessionsByClient.get(key)!.push(session);
    }

    for (const [clientIdKey, clientSessions] of sessionsByClient) {
      const clientData = clientSessions[0]?.consulting_clients as any;
      const clientName = clientData?.full_name || '';
      const meetDisplayName = clientData?.meet_display_name || '';
      if (!clientName) { skipped.push({ client_id: clientIdKey, reason: 'no_client_name' }); continue; }

      const needsTranscript = clientSessions
        .filter((s: any) => !s.transcription)
        .sort((a: any, b: any) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());

      if (needsTranscript.length === 0) continue;

      console.log(`[batch-import] "${clientName}"${meetDisplayName ? ` (alias: "${meetDisplayName}")` : ''}: ${needsTranscript.length} sessions need transcription`);

      const availableFiles: { file: any; source: string; type: 'text' | 'recording' }[] = [];

      // Source 1: Meet Recordings text files matching client name OR alias
      for (const f of meetTranscriptFiles) {
        if (fileMatchesClient(f.name, clientName) || (meetDisplayName && fileMatchesClient(f.name, meetDisplayName))) {
          availableFiles.push({ file: f, source: 'meet_recordings', type: 'text' });
        }
      }

      // Source 1b: Meet Recordings VIDEO files matching client name OR alias (name-based only, NO date-only matching)
      for (const f of meetRecordingFiles) {
        if (fileMatchesClient(f.name, clientName) || (meetDisplayName && fileMatchesClient(f.name, meetDisplayName))) {
          availableFiles.push({ file: f, source: 'meet_recordings', type: 'recording' });
        }
      }

      // Source 2: Consultoria client folder (match by full_name or alias)
      let clientFolder: any = null;
      for (const folder of clientFolders) {
        if (fileMatchesClient(folder.name, clientName) || (meetDisplayName && fileMatchesClient(folder.name, meetDisplayName))) {
          clientFolder = folder; break;
        }
      }

      if (clientFolder) {
        const { textFiles, recordingFiles } = await collectFilesRecursive(accessToken, clientFolder.id);
        for (const f of textFiles) availableFiles.push({ file: f, source: 'consultoria', type: 'text' });
        for (const f of recordingFiles) availableFiles.push({ file: f, source: 'consultoria', type: 'recording' });
        console.log(`[batch-import] Consultoria "${clientFolder.name}": ${textFiles.length} text, ${recordingFiles.length} recordings`);
      }

      if (availableFiles.length === 0) {
        skipped.push({ client: clientName, sessions: needsTranscript.length, reason: 'no_files_found' });
        continue;
      }

      // Recordings have priority
      availableFiles.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'recording' ? -1 : 1;
        return new Date(a.file.createdTime).getTime() - new Date(b.file.createdTime).getTime();
      });

      const recordingFilesForClient = availableFiles.filter(f => f.type === 'recording');
      const textFilesForClient = availableFiles.filter(f => f.type === 'text');
      const sessionsWithRecording = new Set<string>();
      let sessionIdx = 0;

      // Queue recordings for transcription (priority)
      for (const entry of recordingFilesForClient) {
        if (sessionIdx >= needsTranscript.length) break;
        const session = needsTranscript[sessionIdx];
        const fileSize = parseInt(entry.file.size || '0', 10);
        const fileSizeMB = Math.round(fileSize / 1024 / 1024);

        if (fileSize > 1000 * 1024 * 1024) {
          skipped.push({ session: session.title, client: clientName, reason: 'file_too_large', size_mb: fileSizeMB });
          continue;
        }

        allPendingRecordings.push({
          sessionId: session.id,
          sessionTitle: session.title,
          client: clientName,
          fileId: entry.file.id,
          fileName: entry.file.name,
          sizeMB: fileSizeMB,
          source: entry.source,
        });
        sessionsWithRecording.add(session.id);
        sessionIdx++;
      }

      // For sessions without recordings, try manual text files
      for (const entry of textFilesForClient) {
        const session = needsTranscript.find((s: any) => !sessionsWithRecording.has(s.id) && !s.transcription);
        if (!session) break;

        try {
          const content = await downloadFileContent(accessToken, entry.file.id, entry.file.mimeType);
          if (!content || content.trim().length < 50) continue;

          if (isTactiqOrAutoTranscript(content)) {
            console.log(`[batch-import] Skipping auto-transcript "${entry.file.name}"`);
            results.push({ session: session.title, client: clientName, action: 'skipped_auto_transcript', file: entry.file.name });
            continue;
          }

          await supabase.from('consulting_sessions').update({ transcription: content }).eq('id', session.id);
          session.transcription = content;
          transcriptionsImported++;
          sessionsWithRecording.add(session.id);
          results.push({ session: session.title, client: clientName, action: 'transcription_manual_text', file: entry.file.name });
        } catch (e) {
          results.push({ session: session.title, action: 'transcription_error', error: String(e) });
        }
      }

      for (const s of needsTranscript) {
        if (!sessionsWithRecording.has(s.id) && !s.transcription) {
          skipped.push({ session: s.title, client: clientName, reason: 'no_files' });
        }
      }
    }

    // Generate AI summaries for sessions that have transcription but no summary
    const needsSummary = sessions.filter((s: any) => s.transcription && !s.ai_summary);
    for (const session of needsSummary) {
      try {
        const clientName = (session.consulting_clients as any)?.full_name || '';
        const summary = await generateAISummary(session.transcription, clientName, session.title);
        if (summary) {
          await supabase.from('consulting_sessions')
            .update({ ai_summary: summary, summary_generated_at: new Date().toISOString() })
            .eq('id', session.id);
          summariesGenerated++;
          results.push({ session: session.title, action: 'summary' });
        }
      } catch (e) {
        results.push({ session: session.title, action: 'summary_error', error: String(e) });
      }
    }

    console.log(`[batch-import] Done: ${transcriptionsImported} transcriptions, ${summariesGenerated} summaries, ${allPendingRecordings.length} recordings queued`);

    return new Response(JSON.stringify({
      transcriptions: transcriptionsImported,
      summaries: summariesGenerated,
      totalSessions: sessions.length,
      pending_recordings: allPendingRecordings,
      pending_count: allPendingRecordings.length,
      details: results,
      skipped,
      message: allPendingRecordings.length > 0
        ? `${allPendingRecordings.length} gravações encontradas para transcrever via "transcribe-recording".`
        : 'Importação concluída.',
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
