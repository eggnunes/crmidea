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

async function getValidAccessToken(supabase: any, userId: string): Promise<string> {
  const { data: tokenData, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) throw new Error('Google não conectado');

  // Check if token is expired
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

    const { clientId, sessionId } = await req.json();
    console.log(`[sync-meet-recordings] userId=${user.id}, clientId=${clientId}, sessionId=${sessionId}`);

    const accessToken = await getValidAccessToken(supabase, user.id);

    // Get sessions to sync (include client name for matching)
    let query = supabase
      .from('consulting_sessions')
      .select('*, consulting_clients!client_id(name)')
      .eq('user_id', user.id)
      .is('recording_url', null);

    if (sessionId) {
      query = query.eq('id', sessionId);
    } else if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: sessions, error: sessError } = await query;
    if (sessError) throw sessError;

    if (!sessions || sessions.length === 0) {
      return new Response(JSON.stringify({ synced: 0, message: 'Nenhuma sessão pendente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-meet-recordings] Found ${sessions.length} sessions to sync`);

    // 1. Search Meet Recordings folder in Drive
    const driveSearchUrl = new URL('https://www.googleapis.com/drive/v3/files');
    driveSearchUrl.searchParams.set('q', "mimeType='video/mp4' and (name contains 'Meet' or name contains 'meet' or name contains 'GMT')");
    driveSearchUrl.searchParams.set('fields', 'files(id,name,createdTime,webViewLink,mimeType)');
    driveSearchUrl.searchParams.set('orderBy', 'createdTime desc');
    driveSearchUrl.searchParams.set('pageSize', '200');

    const driveResponse = await fetch(driveSearchUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const driveData = await driveResponse.json();
    if (driveData.error) {
      console.error('[sync-meet-recordings] Drive API error:', driveData.error);
      throw new Error(driveData.error.message || 'Erro ao acessar Google Drive');
    }

    let recordings = driveData.files || [];
    console.log(`[sync-meet-recordings] Found ${recordings.length} recordings in Meet Recordings`);

    // 2. Search client-specific folders
    const clientNames = [...new Set(sessions.map((s: any) => s.consulting_clients?.name).filter(Boolean))] as string[];
    
    for (const clientName of clientNames) {
      try {
        // Find folders containing client name
        const folderUrl = new URL('https://www.googleapis.com/drive/v3/files');
        folderUrl.searchParams.set('q', `mimeType='application/vnd.google-apps.folder' and name contains '${clientName.replace(/'/g, "\\'")}'`);
        folderUrl.searchParams.set('fields', 'files(id,name)');
        folderUrl.searchParams.set('pageSize', '10');

        const folderRes = await fetch(folderUrl.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const folderData = await folderRes.json();
        const folders = folderData.files || [];

        for (const folder of folders) {
          const filesUrl = new URL('https://www.googleapis.com/drive/v3/files');
          filesUrl.searchParams.set('q', `'${folder.id}' in parents and mimeType='video/mp4'`);
          filesUrl.searchParams.set('fields', 'files(id,name,createdTime,webViewLink,mimeType)');
          filesUrl.searchParams.set('pageSize', '50');

          const filesRes = await fetch(filesUrl.toString(), {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const filesData = await filesRes.json();
          if (filesData.files) {
            // Tag these recordings with the folder/client name for matching priority
            const taggedFiles = filesData.files.map((f: any) => ({ ...f, _folderClientName: clientName }));
            recordings = recordings.concat(taggedFiles);
          }
        }
      } catch (e) {
        console.warn(`[sync-meet-recordings] Error searching folders for "${clientName}":`, e);
      }
    }

    // Deduplicate by id
    const seen = new Set<string>();
    recordings = recordings.filter((r: any) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    console.log(`[sync-meet-recordings] Total unique recordings: ${recordings.length}`);

    let synced = 0;

    for (const session of sessions) {
      const sessionDate = new Date(session.session_date);
      const sessionDateStr = sessionDate.toISOString().split('T')[0];
      const clientName = (session.consulting_clients?.name || '').toLowerCase();

      // Filter recordings from same day
      const sameDayRecs = recordings.filter((rec: any) => {
        const recDateStr = new Date(rec.createdTime).toISOString().split('T')[0];
        return recDateStr === sessionDateStr;
      });

      if (sameDayRecs.length === 0) continue;

      let match = null;

      // Priority 1: Recording in client-specific folder
      if (clientName) {
        match = sameDayRecs.find((rec: any) => 
          rec._folderClientName && rec._folderClientName.toLowerCase() === clientName
        );
      }

      // Priority 2: Client name appears in recording title
      if (!match && clientName) {
        match = sameDayRecs.find((rec: any) => 
          rec.name.toLowerCase().includes(clientName)
        );
      }

      // Priority 3: Closest time match (within 2 hours)
      if (!match && sameDayRecs.length > 1) {
        const sessionTime = sessionDate.getTime();
        let bestDiff = Infinity;
        for (const rec of sameDayRecs) {
          const recTime = new Date(rec.createdTime).getTime();
          const diff = Math.abs(recTime - sessionTime);
          if (diff < 2 * 60 * 60 * 1000 && diff < bestDiff) {
            bestDiff = diff;
            match = rec;
          }
        }
      }

      // Priority 4: Only one recording that day — use it
      if (!match && sameDayRecs.length === 1) {
        match = sameDayRecs[0];
      }

      if (match) {
        console.log(`[sync-meet-recordings] Matched "${session.title}" → "${match.name}"`);

        // Set sharing permission
        try {
          await fetch(`https://www.googleapis.com/drive/v3/files/${match.id}/permissions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: 'reader', type: 'anyone' }),
          });
        } catch (permErr) {
          console.warn('[sync-meet-recordings] Could not set sharing permission:', permErr);
        }

        const { error: updateErr } = await supabase
          .from('consulting_sessions')
          .update({
            recording_url: match.webViewLink,
            recording_drive_id: match.id,
          })
          .eq('id', session.id);

        if (!updateErr) {
          synced++;
          // Remove matched recording so it's not reused
          recordings = recordings.filter((r: any) => r.id !== match.id);
        }
      }
    }

    return new Response(JSON.stringify({ 
      synced, 
      total: sessions.length,
      recordingsFound: recordings.length,
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
