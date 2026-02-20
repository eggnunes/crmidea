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

// ─── Token Management ────────────────────────────────────────────────────────

async function getValidAccessToken(supabase: any, userId: string): Promise<string> {
  const { data: tokenData, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) throw new Error('Google não conectado');

  if (new Date(tokenData.expires_at) < new Date()) {
    console.log('[sync-meet-recordings] Refreshing expired token');
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

// ─── Drive Helpers ────────────────────────────────────────────────────────────

/** List items inside a Drive folder (files or subfolders) */
async function listDriveItems(
  accessToken: string,
  parentId: string,
  mimeTypeFilter?: string
): Promise<any[]> {
  let q = `'${parentId}' in parents and trashed=false`;
  if (mimeTypeFilter) q += ` and mimeType='${mimeTypeFilter}'`;

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'files(id,name,createdTime,modifiedTime,webViewLink,mimeType)');
  url.searchParams.set('pageSize', '200');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (data.error) {
    console.warn('[sync-meet-recordings] Drive list error:', data.error.message);
    return [];
  }
  return data.files || [];
}

/** Find a folder by exact or case-insensitive name inside a parent */
async function findFolder(
  accessToken: string,
  parentId: string,
  name: string
): Promise<string | null> {
  const folders = await listDriveItems(accessToken, parentId, 'application/vnd.google-apps.folder');
  const normalized = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const target = normalized(name);
  const found = folders.find(f => normalized(f.name) === target || normalized(f.name).includes(target) || target.includes(normalized(f.name)));
  return found ? found.id : null;
}

/** Navigate folder path: e.g. ['Minha Mentoria', 'Turma 2', 'Consultoria'] */
async function navigatePath(
  accessToken: string,
  path: string[]
): Promise<string | null> {
  // Start from root
  let currentId = 'root';
  for (const segment of path) {
    const found = await findFolder(accessToken, currentId, segment);
    if (!found) {
      console.warn(`[sync-meet-recordings] Folder not found: "${segment}" inside ${currentId}`);
      return null;
    }
    console.log(`[sync-meet-recordings] Navigated to "${segment}" (${found})`);
    currentId = found;
  }
  return currentId;
}

/** Get all MP4 files recursively inside a folder (checks subfolders one level deep) */
async function getRecordingsInFolder(
  accessToken: string,
  folderId: string,
  folderName: string
): Promise<any[]> {
  // MP4 files directly in folder
  const mp4Files = await listDriveItems(accessToken, folderId, 'video/mp4');

  // Also check subfolders (e.g. "Gravações das Reuniões")
  const subfolders = await listDriveItems(accessToken, folderId, 'application/vnd.google-apps.folder');
  for (const sub of subfolders) {
    const subFiles = await listDriveItems(accessToken, sub.id, 'video/mp4');
    mp4Files.push(...subFiles);
  }

  console.log(`[sync-meet-recordings] Folder "${folderName}": ${mp4Files.length} MP4(s) found`);
  return mp4Files;
}

// ─── Name Matching ────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
}

function nameParts(name: string): string[] {
  return normalize(name).split(/\s+/).filter(p => p.length > 2 && !['de','da','do','dos','das','e'].includes(p));
}

/** Returns true if the folder name matches the client name (flexible) */
function folderMatchesClient(folderName: string, clientName: string, alias?: string): boolean {
  const folderNorm = normalize(folderName);
  const clientParts = nameParts(clientName);

  // At least 1 meaningful part of client name appears in folder name
  const clientMatch = clientParts.filter(p => folderNorm.includes(p)).length >= 1;
  if (clientMatch) return true;

  // Also check alias
  if (alias) {
    const aliasParts = nameParts(alias);
    const aliasMatch = aliasParts.filter(p => folderNorm.includes(p)).length >= 1;
    if (aliasMatch) return true;
  }

  return false;
}

// ─── Session Helpers ──────────────────────────────────────────────────────────

async function findSessionForRecording(
  supabase: any,
  clientId: string,
  fileTime: Date,
  windowHours = 3
): Promise<any | null> {
  const windowMs = windowHours * 60 * 60 * 1000;
  const windowStart = new Date(fileTime.getTime() - windowMs).toISOString();
  const windowEnd = new Date(fileTime.getTime() + windowMs).toISOString();

  const { data } = await supabase
    .from('consulting_sessions')
    .select('id, recording_url, recording_drive_id, ai_summary, transcription')
    .eq('client_id', clientId)
    .gte('session_date', windowStart)
    .lte('session_date', windowEnd)
    .order('session_date', { ascending: true });

  if (!data || data.length === 0) return null;
  return data[0];
}

async function makeFilePublic(accessToken: string, fileId: string): Promise<void> {
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });
  } catch (e) {
    console.warn('[sync-meet-recordings] Could not set sharing permission:', e);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

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
    const { clientId, sessionId } = body;
    console.log(`[sync-meet-recordings] userId=${user.id}, clientId=${clientId}, sessionId=${sessionId}`);

    const accessToken = await getValidAccessToken(supabase, user.id);

    // Load all consulting clients for this user (we need full_name and meet_display_name)
    const clientQuery = supabase
      .from('consulting_clients')
      .select('id, full_name, email, meet_display_name')
      .eq('user_id', user.id);
    if (clientId) clientQuery.eq('id', clientId);

    const { data: allClients, error: clientsErr } = await clientQuery;
    if (clientsErr || !allClients?.length) {
      return new Response(JSON.stringify({ synced: 0, message: 'Nenhum cliente encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Step 1: Navigate Minha Mentoria > Turma 2 > Consultoria ──────────────
    console.log('[sync-meet-recordings] Navigating Drive hierarchy...');
    const consultoriaFolderId = await navigatePath(accessToken, ['Minha Mentoria', 'Turma 2', 'Consultoria']);

    let synced = 0;
    let created = 0;
    const processedFileIds = new Set<string>();

    if (consultoriaFolderId) {
      // List all client folders inside Consultoria
      const clientFolders = await listDriveItems(accessToken, consultoriaFolderId, 'application/vnd.google-apps.folder');
      console.log(`[sync-meet-recordings] Found ${clientFolders.length} client folders in Consultoria`);

      // Match each folder to a client in the DB
      for (const folder of clientFolders) {
        // Find matching client(s)
        const matchedClients = allClients.filter(c =>
          folderMatchesClient(folder.name, c.full_name, c.meet_display_name)
        );

        if (matchedClients.length === 0) {
          console.log(`[sync-meet-recordings] No client match for folder "${folder.name}"`);
          continue;
        }

        // Use the first match (most cases there's only one)
        const client = matchedClients[0];
        console.log(`[sync-meet-recordings] Folder "${folder.name}" → client "${client.full_name}"`);

        // Get all MP4s in this folder (recursive)
        const recordings = await getRecordingsInFolder(accessToken, folder.id, folder.name);

        for (const rec of recordings) {
          if (processedFileIds.has(rec.id)) continue;
          processedFileIds.add(rec.id);

          const fileTime = new Date(rec.createdTime);

          // Check if already linked to a session via drive_id
          const { data: alreadyLinked } = await supabase
            .from('consulting_sessions')
            .select('id')
            .eq('recording_drive_id', rec.id)
            .maybeSingle();

          if (alreadyLinked) {
            console.log(`[sync-meet-recordings] "${rec.name}" already linked, skipping`);
            continue;
          }

          // Find an existing session for this date/time
          let session = null;
          if (sessionId) {
            // If syncing a specific session, only check that one
            const { data: sp } = await supabase
              .from('consulting_sessions')
              .select('id, recording_url, recording_drive_id')
              .eq('id', sessionId)
              .maybeSingle();
            if (sp && !sp.recording_drive_id) session = sp;
          } else {
            session = await findSessionForRecording(supabase, client.id, fileTime);
          }

          // If no session found → create one automatically
          if (!session) {
            console.log(`[sync-meet-recordings] No session for "${rec.name}" on ${fileTime.toISOString().split('T')[0]} — creating automatically`);
            const { data: newSession, error: insertErr } = await supabase
              .from('consulting_sessions')
              .insert({
                client_id: client.id,
                user_id: user.id,
                title: `Reunião de Consultoria – ${fileTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`,
                session_date: rec.createdTime,
                duration_minutes: 60,
                session_type: 'online',
                status: 'completed',
              })
              .select('id')
              .single();

            if (insertErr || !newSession) {
              console.error('[sync-meet-recordings] Failed to create session:', insertErr);
              continue;
            }
            session = newSession;
            created++;
          }

          // Make file public and link it
          await makeFilePublic(accessToken, rec.id);

          const { error: updateErr } = await supabase
            .from('consulting_sessions')
            .update({
              recording_url: rec.webViewLink,
              recording_drive_id: rec.id,
            })
            .eq('id', session.id);

          if (!updateErr) {
            synced++;
            console.log(`[sync-meet-recordings] Linked "${rec.name}" → session ${session.id}`);
          }
        }
      }
    } else {
      console.log('[sync-meet-recordings] Consultoria folder not found, falling back to generic search');
    }

    // ── Step 2: Fallback — generic search in Meet Recordings ─────────────────
    // For any client that still has sessions without recordings
    const { data: pendingSessions } = await supabase
      .from('consulting_sessions')
      .select('id, client_id, session_date, title, consulting_clients!client_id(full_name, meet_display_name)')
      .is('recording_drive_id', null)
      .eq('user_id', user.id)
      .eq(sessionId ? 'id' : 'user_id', sessionId || user.id);

    if (pendingSessions && pendingSessions.length > 0) {
      // Search generic Meet recordings
      const driveSearchUrl = new URL('https://www.googleapis.com/drive/v3/files');
      driveSearchUrl.searchParams.set('q', "mimeType='video/mp4' and (name contains 'Meet' or name contains 'GMT' or name contains 'Grava')");
      driveSearchUrl.searchParams.set('fields', 'files(id,name,createdTime,webViewLink,mimeType)');
      driveSearchUrl.searchParams.set('orderBy', 'createdTime desc');
      driveSearchUrl.searchParams.set('pageSize', '200');

      const driveRes = await fetch(driveSearchUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const driveData = await driveRes.json();
      const genericRecordings = (driveData.files || []).filter((r: any) => !processedFileIds.has(r.id));

      console.log(`[sync-meet-recordings] Fallback: ${genericRecordings.length} generic recordings, ${pendingSessions.length} pending sessions`);

      // Build map: sessionDate → pending sessions on that day
      const sessionsByDay = new Map<string, any[]>();
      for (const s of pendingSessions) {
        const day = new Date(s.session_date).toISOString().split('T')[0];
        if (!sessionsByDay.has(day)) sessionsByDay.set(day, []);
        sessionsByDay.get(day)!.push(s);
      }

      for (const rec of genericRecordings) {
        if (processedFileIds.has(rec.id)) continue;
        const recDay = new Date(rec.createdTime).toISOString().split('T')[0];
        const daySessions = sessionsByDay.get(recDay) || [];

        if (daySessions.length === 0) continue;

        const clientName = ((daySessions[0].consulting_clients as any)?.full_name || '').toLowerCase();
        const alias = ((daySessions[0].consulting_clients as any)?.meet_display_name || '').toLowerCase();

        // Only link if name appears in file name
        const recNorm = normalize(rec.name);
        const parts = nameParts(clientName);
        const aliasParts2 = alias ? nameParts(alias) : [];
        const nameHit = parts.filter(p => recNorm.includes(p)).length >= 2
          || aliasParts2.filter(p => recNorm.includes(p)).length >= 1;

        if (!nameHit && daySessions.length > 1) continue; // ambiguous, skip

        // If only one session that day, allow with 1 name part
        const singleDayHit = daySessions.length === 1 && parts.filter(p => recNorm.includes(p)).length >= 1;
        if (!nameHit && !singleDayHit) continue;

        const session = daySessions[0];
        await makeFilePublic(accessToken, rec.id);

        const { error: updateErr } = await supabase
          .from('consulting_sessions')
          .update({
            recording_url: rec.webViewLink,
            recording_drive_id: rec.id,
          })
          .eq('id', session.id);

        if (!updateErr) {
          synced++;
          processedFileIds.add(rec.id);
          sessionsByDay.delete(recDay); // avoid double-linking same day
          console.log(`[sync-meet-recordings] Fallback linked "${rec.name}" → session ${session.id}`);
        }
      }
    }

    return new Response(JSON.stringify({
      synced,
      created,
      message: `${synced} gravação(ões) vinculada(s), ${created} sessão(ões) criada(s) automaticamente`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[sync-meet-recordings] Error:', error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
