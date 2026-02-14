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
const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!;

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

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error('sessionId é obrigatório');

    console.log(`[transcribe-meeting] sessionId=${sessionId}`);

    // Get session
    const { data: session, error: sessErr } = await supabase
      .from('consulting_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessErr || !session) throw new Error('Sessão não encontrada');

    if (session.transcription) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Transcrição já existe',
        transcription: session.transcription 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!session.recording_drive_id) {
      throw new Error('Nenhuma gravação vinculada a esta sessão. Sincronize primeiro.');
    }

    const accessToken = await getValidAccessToken(supabase, user.id);

    // Try to find a transcript file in Drive with same date
    const sessionDate = new Date(session.session_date).toISOString().split('T')[0];
    const transcriptSearchUrl = new URL('https://www.googleapis.com/drive/v3/files');
    transcriptSearchUrl.searchParams.set('q', `name contains 'Meet' and (mimeType='text/plain' or mimeType='application/vnd.google-apps.document') and createdTime >= '${sessionDate}T00:00:00' and createdTime <= '${sessionDate}T23:59:59'`);
    transcriptSearchUrl.searchParams.set('fields', 'files(id,name,mimeType)');

    const searchResp = await fetch(transcriptSearchUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const searchData = await searchResp.json();
    const transcriptFiles = searchData.files || [];

    let transcription = '';

    if (transcriptFiles.length > 0) {
      console.log(`[transcribe-meeting] Found transcript file: ${transcriptFiles[0].name}`);
      const file = transcriptFiles[0];

      // Download transcript content
      let downloadUrl: string;
      if (file.mimeType === 'application/vnd.google-apps.document') {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
      } else {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      }

      const contentResp = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      transcription = await contentResp.text();
      console.log(`[transcribe-meeting] Got transcript from Drive, length=${transcription.length}`);
    } else {
      // No transcript file found - use ElevenLabs STT
      console.log('[transcribe-meeting] No transcript file, using ElevenLabs STT');

      // Download audio from Drive
      const audioResp = await fetch(
        `https://www.googleapis.com/drive/v3/files/${session.recording_drive_id}?alt=media`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!audioResp.ok) {
        throw new Error('Não foi possível baixar a gravação do Drive');
      }

      const audioBlob = await audioResp.blob();
      
      // Check file size - ElevenLabs has limits
      if (audioBlob.size > 100 * 1024 * 1024) {
        throw new Error('Gravação muito grande (>100MB). Use a transcrição automática do Google Meet.');
      }

      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.mp4');
      formData.append('model_id', 'scribe_v2');
      formData.append('language_code', 'por');
      formData.append('diarize', 'true');

      const sttResp = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': ELEVENLABS_API_KEY },
        body: formData,
      });

      if (!sttResp.ok) {
        const errBody = await sttResp.text();
        console.error('[transcribe-meeting] ElevenLabs error:', errBody);
        throw new Error('Erro na transcrição via ElevenLabs');
      }

      const sttResult = await sttResp.json();
      transcription = sttResult.text || '';
      console.log(`[transcribe-meeting] ElevenLabs transcription length=${transcription.length}`);
    }

    // Save transcription
    const { error: updateErr } = await supabase
      .from('consulting_sessions')
      .update({ transcription })
      .eq('id', sessionId);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true, transcription }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[transcribe-meeting] Error:', error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
