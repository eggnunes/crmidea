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

    // Get sessions to sync
    let query = supabase
      .from('consulting_sessions')
      .select('*')
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

    // Search Meet Recordings folder in Drive
    const driveSearchUrl = new URL('https://www.googleapis.com/drive/v3/files');
    driveSearchUrl.searchParams.set('q', "mimeType='video/mp4' and name contains 'Meet'");
    driveSearchUrl.searchParams.set('fields', 'files(id,name,createdTime,webViewLink,mimeType)');
    driveSearchUrl.searchParams.set('orderBy', 'createdTime desc');
    driveSearchUrl.searchParams.set('pageSize', '100');

    const driveResponse = await fetch(driveSearchUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const driveData = await driveResponse.json();
    if (driveData.error) {
      console.error('[sync-meet-recordings] Drive API error:', driveData.error);
      throw new Error(driveData.error.message || 'Erro ao acessar Google Drive');
    }

    const recordings = driveData.files || [];
    console.log(`[sync-meet-recordings] Found ${recordings.length} recordings in Drive`);

    let synced = 0;

    for (const session of sessions) {
      const sessionDate = new Date(session.session_date);
      const sessionDateStr = sessionDate.toISOString().split('T')[0];

      // Match by date (same day) 
      const match = recordings.find((rec: any) => {
        const recDate = new Date(rec.createdTime);
        const recDateStr = recDate.toISOString().split('T')[0];
        return recDateStr === sessionDateStr;
      });

      if (match) {
        console.log(`[sync-meet-recordings] Matched session "${session.title}" with recording "${match.name}"`);

        // Make file viewable by anyone with link
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

        if (!updateErr) synced++;
      }
    }

    // Also search for transcript files (.sbv, .vtt, .txt, .docx)
    const transcriptSearchUrl = new URL('https://www.googleapis.com/drive/v3/files');
    transcriptSearchUrl.searchParams.set('q', "name contains 'Meet' and (mimeType='text/plain' or mimeType='application/vnd.google-apps.document' or name contains '.sbv' or name contains '.vtt')");
    transcriptSearchUrl.searchParams.set('fields', 'files(id,name,createdTime,mimeType)');
    transcriptSearchUrl.searchParams.set('orderBy', 'createdTime desc');
    transcriptSearchUrl.searchParams.set('pageSize', '50');

    const transcriptResponse = await fetch(transcriptSearchUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const transcriptData = await transcriptResponse.json();
    const transcripts = transcriptData.files || [];
    console.log(`[sync-meet-recordings] Found ${transcripts.length} transcript files`);

    return new Response(JSON.stringify({ 
      synced, 
      total: sessions.length,
      recordingsFound: recordings.length,
      transcriptsFound: transcripts.length,
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
