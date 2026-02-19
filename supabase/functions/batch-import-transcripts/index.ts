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
const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY') || '';

const PREPOSITIONS = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);
const TEXT_MIME_FILTER = "(mimeType='text/plain' or mimeType='application/vnd.google-apps.document' or mimeType='text/vtt' or mimeType='application/x-subrip')";
const RECORDING_MIME_FILTER = "(mimeType='video/mp4' or mimeType='video/webm' or mimeType='audio/mpeg' or mimeType='audio/mp4' or mimeType='audio/webm' or mimeType='audio/x-m4a' or mimeType='video/x-matroska')";
const MAX_STT_TRANSCRIPTIONS = 1; // max recordings to transcribe per run (large files need time)

// ==================== Google Drive Helpers ====================

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

async function findFolderByNameContains(accessToken: string, searchTerm: string, parentId: string): Promise<{ id: string; name: string } | null> {
  const q = `mimeType='application/vnd.google-apps.folder' and name contains '${searchTerm.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`;

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'files(id,name)');
  url.searchParams.set('pageSize', '10');

  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  return data.files?.[0] ? { id: data.files[0].id, name: data.files[0].name } : null;
}

async function listSubfolders(accessToken: string, parentId: string): Promise<any[]> {
  const q = `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'files(id,name)');
  url.searchParams.set('pageSize', '100');
  url.searchParams.set('orderBy', 'name');

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

// ==================== Tactiq Detection ====================

/** Signatures that indicate an auto-generated transcript (Tactiq, Otter, etc.) */
const AUTO_TRANSCRIPT_SIGNATURES = [
  'tactiq',
  'tactiq.io',
  'tactiq ai',
  'transcrevendo esta chamada com minha extensão',
  'otter.ai',
  'fireflies.ai',
  // VTT/SRT timestamp patterns like "00:00:00.000 --> 00:00:05.000"
];

function isTactiqOrAutoTranscript(content: string): boolean {
  const lower = content.toLowerCase().substring(0, 3000); // check first 3KB only
  for (const sig of AUTO_TRANSCRIPT_SIGNATURES) {
    if (lower.includes(sig)) return true;
  }
  // Detect VTT/SRT format: lines like "00:00:01.000,00:00:05.000" or "00:00:01.000 --> 00:00:05.000"
  const vttPattern = /\d{2}:\d{2}:\d{2}[.,]\d{3}[\s,]*(?:-->|,)\s*\d{2}:\d{2}:\d{2}/m;
  if (vttPattern.test(content.substring(0, 2000))) return true;
  return false;
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

/** Stream a recording from Google Drive directly to ElevenLabs STT without buffering the whole file in memory */
async function streamTranscribeFromDrive(accessToken: string, fileId: string, fileName: string, fileSizeMB: number): Promise<string> {
  console.log(`[batch-import] Streaming "${fileName}" (${fileSizeMB}MB) from Drive to ElevenLabs STT...`);

  // Step 1: Start downloading from Google Drive as a stream
  const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const driveResp = await fetch(driveUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!driveResp.ok || !driveResp.body) {
    throw new Error(`Failed to download recording ${fileId}: ${driveResp.status}`);
  }

  // Step 2: Build multipart/form-data body manually with streaming
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
  const ext = fileName.split('.').pop()?.toLowerCase() || 'mp4';
  const mimeMap: Record<string, string> = {
    mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg',
    m4a: 'audio/mp4', mkv: 'video/x-matroska', wav: 'audio/wav',
  };
  const contentType = mimeMap[ext] || 'application/octet-stream';
  preamble += `--${boundary}\r\n`;
  preamble += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
  preamble += `Content-Type: ${contentType}\r\n\r\n`;

  const epilogue = `\r\n--${boundary}--\r\n`;
  const preambleBytes = encoder.encode(preamble);
  const epilogueBytes = encoder.encode(epilogue);
  const driveReader = driveResp.body.getReader();

  let phase: 'preamble' | 'file' | 'epilogue' | 'done' = 'preamble';

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
          return;
        }
        controller.enqueue(value);
        return;
      }
      controller.close();
    },
  });

  // Step 3: Send to ElevenLabs with streaming body
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
    console.error(`[batch-import] ElevenLabs STT error: ${sttResp.status}`, errText);
    throw new Error(`ElevenLabs STT failed (${sttResp.status}): ${errText.substring(0, 200)}`);
  }

  const result = await sttResp.json();
  console.log(`[batch-import] ElevenLabs STT success for "${fileName}": ${result.text?.length || 0} chars`);
  return result.text || '';
}

// ==================== AI Summary ====================

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

// ==================== Name Matching ====================

function normalizeForMatch(str: string): string {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function extractNameParts(fullName: string): { firstName: string; surname: string; allParts: string[] } {
  const normalized = normalizeForMatch(fullName);
  const parts = normalized.split(/\s+/).filter(p => p.length > 0);
  const significantParts = parts.filter(p => !PREPOSITIONS.has(p) && p.length > 2);

  const firstName = significantParts[0] || '';
  const surname = significantParts.length > 1 ? significantParts[significantParts.length - 1] : '';

  return { firstName, surname, allParts: significantParts };
}

function fileMatchesClient(fileName: string, clientName: string): boolean {
  const normalizedFile = normalizeForMatch(fileName);
  const { allParts } = extractNameParts(clientName);

  if (allParts.length < 2) return false;

  const matchingParts = allParts.filter(part => normalizedFile.includes(part));
  return matchingParts.length >= 2;
}

// ==================== Navigate to Consultoria Folder ====================

async function findAllFoldersByName(accessToken: string, folderName: string): Promise<{ id: string; name: string }[]> {
  const q = `mimeType='application/vnd.google-apps.folder' and name contains '${folderName.replace(/'/g, "\\'")}' and trashed=false`;
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'files(id,name)');
  url.searchParams.set('pageSize', '20');
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  return data.files || [];
}

async function findConsultoriaFolder(accessToken: string): Promise<string | null> {
  // Find ALL folders containing "Mentoria" and check each for Turma > Consultoria
  const mentoriaFolders = await findAllFoldersByName(accessToken, 'Mentoria');
  console.log(`[batch-import] Found ${mentoriaFolders.length} folders containing "Mentoria"`);

  for (const mentoria of mentoriaFolders) {
    console.log(`[batch-import] Checking "${mentoria.name}" (${mentoria.id})...`);

    // Look for "Turma" subfolder
    const turmaFolder = await findFolderByNameContains(accessToken, 'Turma', mentoria.id);
    if (turmaFolder) {
      console.log(`[batch-import] Found "${turmaFolder.name}" inside "${mentoria.name}"`);
      const consultoriaId = await findFolderByName(accessToken, 'Consultoria', turmaFolder.id);
      if (consultoriaId) {
        console.log(`[batch-import] Found "Consultoria" at ${consultoriaId}`);
        return consultoriaId;
      }
      const consultoriaAlt = await findFolderByNameContains(accessToken, 'Consultoria', turmaFolder.id);
      if (consultoriaAlt) {
        console.log(`[batch-import] Found "${consultoriaAlt.name}" at ${consultoriaAlt.id}`);
        return consultoriaAlt.id;
      }
    }

    // Try "Consultoria" directly inside this mentoria folder
    const directConsultoria = await findFolderByName(accessToken, 'Consultoria', mentoria.id);
    if (directConsultoria) {
      console.log(`[batch-import] Found "Consultoria" directly in "${mentoria.name}": ${directConsultoria}`);
      return directConsultoria;
    }
  }

  console.log('[batch-import] Could not find "Consultoria" folder');
  return null;
}

/** Collect all text and recording files from a folder AND its subfolders (1 level deep) */
async function collectFilesRecursive(accessToken: string, folderId: string): Promise<{ textFiles: any[]; recordingFiles: any[] }> {
  const [textFiles, recordingFiles, subfolders] = await Promise.all([
    listFilesInFolder(accessToken, folderId, TEXT_MIME_FILTER),
    listFilesInFolder(accessToken, folderId, RECORDING_MIME_FILTER),
    listSubfolders(accessToken, folderId),
  ]);

  // Also check subfolders (e.g. "Vídeos das reuniões", "Gravação das reuniões")
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
      console.log(`[batch-import] Cleaned ${count} sessions`);
      return new Response(JSON.stringify({ cleaned: count, message: `${count} sessões limpas` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await getValidAccessToken(supabase, userId);

    // ===== ACTION: explore-path =====
    if (action === 'explore-path') {
      const path: string[] = body.path || [];
      let currentFolderId: string | null = body.folderId || null;

      // Navigate the path level by level
      for (const folderName of path) {
        if (!currentFolderId) {
          currentFolderId = await findFolderByName(accessToken, folderName);
        } else {
          // Try exact match first, then contains
          let nextId = await findFolderByName(accessToken, folderName, currentFolderId);
          if (!nextId) {
            const found = await findFolderByNameContains(accessToken, folderName, currentFolderId);
            nextId = found?.id || null;
          }
          currentFolderId = nextId;
        }

        if (!currentFolderId) {
          return new Response(JSON.stringify({
            error: `Pasta "${folderName}" não encontrada no caminho`,
            path_so_far: path.slice(0, path.indexOf(folderName)),
          }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (!currentFolderId) {
        // No path given, list root
        const url = new URL('https://www.googleapis.com/drive/v3/files');
        url.searchParams.set('q', "mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false");
        url.searchParams.set('fields', 'files(id,name)');
        url.searchParams.set('pageSize', '50');
        const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await res.json();
        return new Response(JSON.stringify({ path: [], folders: data.files || [], files: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const [subfolders, textFiles, recordingFiles] = await Promise.all([
        listSubfolders(accessToken, currentFolderId),
        listFilesInFolder(accessToken, currentFolderId, TEXT_MIME_FILTER),
        listFilesInFolder(accessToken, currentFolderId, RECORDING_MIME_FILTER),
      ]);

      return new Response(JSON.stringify({
        path,
        folderId: currentFolderId,
        subfolders: subfolders.map((f: any) => ({ id: f.id, name: f.name })),
        textFiles: textFiles.map((f: any) => ({ id: f.id, name: f.name, mimeType: f.mimeType, createdTime: f.createdTime, size: f.size })),
        recordingFiles: recordingFiles.map((f: any) => ({ id: f.id, name: f.name, mimeType: f.mimeType, createdTime: f.createdTime, size: f.size })),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== ACTION: list-files =====
    if (action === 'list-files') {
      const meetFolderId = await findFolderByName(accessToken, 'Meet Recordings');
      if (!meetFolderId) {
        return new Response(JSON.stringify({ error: 'Pasta "Meet Recordings" não encontrada' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const files = await listFilesInFolder(accessToken, meetFolderId, TEXT_MIME_FILTER);

      return new Response(JSON.stringify({
        folderId: meetFolderId,
        totalFiles: files.length,
        files: files.map((f: any) => ({ id: f.id, name: f.name, createdTime: f.createdTime, mimeType: f.mimeType })),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== ACTION: import (default) =====
    let sessQuery = supabase
      .from('consulting_sessions')
      .select('*, consulting_clients!client_id(id, full_name)')
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

    // Gather files from Meet Recordings (both text AND recordings)
    const meetFolderId = await findFolderByName(accessToken, 'Meet Recordings');
    let meetTranscriptFiles: any[] = [];
    let meetRecordingFiles: any[] = [];
    if (meetFolderId) {
      [meetTranscriptFiles, meetRecordingFiles] = await Promise.all([
        listFilesInFolder(accessToken, meetFolderId, TEXT_MIME_FILTER),
        listFilesInFolder(accessToken, meetFolderId, RECORDING_MIME_FILTER),
      ]);
      console.log(`[batch-import] Meet Recordings: ${meetTranscriptFiles.length} text, ${meetRecordingFiles.length} video files`);
    }

    // Gather client folders from Consultoria (accept body.consultoriaFolderId to skip slow search)
    const consultoriaFolderId = body.consultoriaFolderId || await findConsultoriaFolder(accessToken);
    let clientFolders: any[] = [];
    if (consultoriaFolderId) {
      console.log(`[batch-import] Using Consultoria folder: ${consultoriaFolderId}`);
      clientFolders = await listSubfolders(accessToken, consultoriaFolderId);
      console.log(`[batch-import] Found ${clientFolders.length} client folders in Consultoria`);
    }

    let transcriptionsImported = 0;
    let summariesGenerated = 0;
    let sttTranscriptions = 0;
    const results: any[] = [];
    const skipped: any[] = [];
    const allPendingRecordings: any[] = [];

    // Group sessions by client
    const sessionsByClient = new Map<string, any[]>();
    for (const session of sessions) {
      const clientIdKey = session.client_id;
      if (!sessionsByClient.has(clientIdKey)) {
        sessionsByClient.set(clientIdKey, []);
      }
      sessionsByClient.get(clientIdKey)!.push(session);
    }

    // Process each client
    for (const [clientIdKey, clientSessions] of sessionsByClient) {
      const clientName = (clientSessions[0]?.consulting_clients as any)?.full_name || '';
      if (!clientName) {
        skipped.push({ client_id: clientIdKey, reason: 'no_client_name' });
        continue;
      }

      // Get sessions that need transcription, sorted by date
      const needsTranscript = clientSessions
        .filter((s: any) => !s.transcription)
        .sort((a: any, b: any) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());

      if (needsTranscript.length === 0) continue;

      console.log(`[batch-import] Client "${clientName}": ${needsTranscript.length} sessions need transcription`);

      // Collect all available files for this client
      const availableFiles: { file: any; source: string; type: 'text' | 'recording' }[] = [];

      // Source 1: Meet Recordings — text files matching client name
      for (const f of meetTranscriptFiles) {
        if (fileMatchesClient(f.name, clientName)) {
          availableFiles.push({ file: f, source: 'meet_recordings', type: 'text' });
        }
      }

      // Source 1b: Meet Recordings — video files matching session date (any day with a scheduled session)
      const clientSessionDates = new Set(
        needsTranscript.map((s: any) => new Date(s.session_date).toISOString().split('T')[0])
      );
      for (const f of meetRecordingFiles) {
        const fileDate = new Date(f.createdTime).toISOString().split('T')[0];
        if (clientSessionDates.has(fileDate)) {
          availableFiles.push({ file: f, source: 'meet_recordings', type: 'recording' });
        }
      }

      // Source 2: Consultoria client folder
      let clientFolder: any = null;
      for (const folder of clientFolders) {
        if (fileMatchesClient(folder.name, clientName)) {
          clientFolder = folder;
          break;
        }
      }

      if (clientFolder) {
        console.log(`[batch-import] Found Consultoria folder "${clientFolder.name}" for "${clientName}"`);

        // Get text and recording files recursively (including subfolders like "Vídeos das reuniões")
        const { textFiles, recordingFiles } = await collectFilesRecursive(accessToken, clientFolder.id);
        for (const f of textFiles) {
          availableFiles.push({ file: f, source: 'consultoria', type: 'text' });
        }
        for (const f of recordingFiles) {
          availableFiles.push({ file: f, source: 'consultoria', type: 'recording' });
        }

        console.log(`[batch-import] Consultoria folder "${clientFolder.name}": ${textFiles.length} text, ${recordingFiles.length} recordings (incl. subfolders)`);
      }

      if (availableFiles.length === 0) {
        skipped.push({ client: clientName, sessions: needsTranscript.length, reason: 'no_files_found' });
        continue;
      }

      // Sort files by createdTime (oldest first) - RECORDINGS HAVE PRIORITY over text files
      availableFiles.sort((a, b) => {
        // Recordings first (real audio → ElevenLabs STT is the gold standard)
        if (a.type !== b.type) return a.type === 'recording' ? -1 : 1;
        return new Date(a.file.createdTime).getTime() - new Date(b.file.createdTime).getTime();
      });

      // Separate files
      const textFilesForClient = availableFiles.filter(f => f.type === 'text');
      const recordingFilesForClient = availableFiles.filter(f => f.type === 'recording');

      // Sessions that have a recording assigned (won't receive text import)
      const sessionsWithRecording = new Set<string>();

      // Associate: recordings first, then manual text files for remaining sessions
      let sessionIdx = 0;

      // Step 1: Queue recordings for async transcription (PRIORITY — real audio)
      const pendingRecordings: any[] = [];
      for (const entry of recordingFilesForClient) {
        if (sessionIdx >= needsTranscript.length) break;

        const session = needsTranscript[sessionIdx];
        const fileSize = parseInt(entry.file.size || '0', 10);
        const fileSizeMB = Math.round(fileSize / 1024 / 1024);

        if (fileSize > 1000 * 1024 * 1024) {
          skipped.push({
            session: session.title,
            client: clientName,
            reason: 'file_too_large_1gb',
            file: entry.file.name,
            size_mb: fileSizeMB,
          });
          continue;
        }

        pendingRecordings.push({
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
      allPendingRecordings.push(...pendingRecordings);

      // Step 2: For sessions WITHOUT a recording, try manual text files (skip Tactiq/auto)
      for (const entry of textFilesForClient) {
        if (sessionIdx >= needsTranscript.length) break;

        // Find the next session that doesn't already have a recording queued
        const session = needsTranscript.find((s, idx) => idx >= sessionIdx - pendingRecordings.length && !sessionsWithRecording.has(s.id));
        if (!session) break;

        try {
          const content = await downloadFileContent(accessToken, entry.file.id, entry.file.mimeType);
          if (!content || content.trim().length < 50) continue;

          // Skip auto-generated transcripts (Tactiq, Otter, etc.)
          if (isTactiqOrAutoTranscript(content)) {
            console.log(`[batch-import] Skipping auto-transcript file "${entry.file.name}" (Tactiq/auto-generated)`);
            results.push({
              session: session.title,
              client: clientName,
              action: 'skipped_auto_transcript',
              file: entry.file.name,
            });
            continue;
          }

          await supabase
            .from('consulting_sessions')
            .update({ transcription: content })
            .eq('id', session.id);

          session.transcription = content;
          transcriptionsImported++;
          sessionsWithRecording.add(session.id); // mark as handled
          results.push({
            session: session.title,
            client: clientName,
            action: 'transcription_manual_text',
            source: entry.source,
            file: entry.file.name,
          });
        } catch (e) {
          console.warn(`[batch-import] Error downloading text for "${session.title}":`, e);
          results.push({ session: session.title, action: 'transcription_error', error: String(e) });
        }
      }

      // Remaining sessions without any match
      for (let i = 0; i < needsTranscript.length; i++) {
        const s = needsTranscript[i];
        if (!sessionsWithRecording.has(s.id) && !s.transcription) {
          skipped.push({
            session: s.title,
            client: clientName,
            reason: 'no_remaining_files',
          });
        }
      }
    }

    // Generate AI summaries for all sessions that have transcription but no summary
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

    console.log(`[batch-import] Done: ${transcriptionsImported} transcriptions, ${summariesGenerated} summaries, ${allPendingRecordings.length} recordings pending, ${skipped.length} skipped`);

    return new Response(JSON.stringify({
      transcriptions: transcriptionsImported,
      summaries: summariesGenerated,
      totalSessions: sessions.length,
      pending_recordings: allPendingRecordings,
      pending_count: allPendingRecordings.length,
      details: results,
      skipped,
      message: allPendingRecordings.length > 0
        ? `${allPendingRecordings.length} gravações encontradas para transcrever. Use a function "transcribe-recording" para processar cada uma individualmente.`
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
