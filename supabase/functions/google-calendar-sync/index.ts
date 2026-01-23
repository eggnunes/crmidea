import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function getValidAccessToken(supabase: any, userId: string): Promise<string | null> {
  const { data: tokenData, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) {
    console.error('[google-calendar-sync] No tokens found:', error);
    return null;
  }

  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();

  // Token still valid
  if (expiresAt > now) {
    return tokenData.access_token;
  }

  // Refresh token
  console.log('[google-calendar-sync] Refreshing token...');
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

  if (tokens.error) {
    console.error('[google-calendar-sync] Refresh error:', tokens);
    
    // If token is permanently invalid, delete it so user can reconnect
    if (tokens.error === 'invalid_grant') {
      console.log('[google-calendar-sync] Token revoked, deleting from database...');
      await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', userId);
    }
    
    return null;
  }

  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase
    .from('google_calendar_tokens')
    .update({
      access_token: tokens.access_token,
      expires_at: newExpiresAt,
    })
    .eq('user_id', userId);

  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the JWT and get the user ID from the token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('[google-calendar-sync] Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the user ID from the verified JWT token, NOT from request body
    const authenticatedUserId = claimsData.claims.sub as string;
    
    const { action, session, eventId, calendarId, timeMin, timeMax, maxResults, includeHidden } = await req.json();
    console.log(`[google-calendar-sync] Action: ${action}, userId: ${authenticatedUserId}`);

    const accessToken = await getValidAccessToken(supabase, authenticatedUserId);

    if (!accessToken) {
      return new Response(JSON.stringify({ 
        error: 'Google Calendar não conectado ou token expirado' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const targetCalendarId = calendarId || 'primary';

    if (action === 'list-calendars') {
      // includeHidden=true é crucial para calendários de “página de agendamento/appointment schedule”,
      // que podem ficar ocultos na lista padrão.
      const params = new URLSearchParams();
      if (includeHidden === true) params.set('showHidden', 'true');

      const response = await fetch(`https://www.googleapis.com/calendar/v3/users/me/calendarList?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      return new Response(JSON.stringify({ 
        calendars: data.items?.map((cal: any) => ({
          id: cal.id,
          summary: cal.summary,
          primary: cal.primary,
          hidden: cal.hidden,
        })) || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create-event') {
      // Create a calendar event from a session
      const startDate = new Date(session.session_date);
      const endDate = new Date(startDate.getTime() + (session.duration_minutes || 60) * 60 * 1000);

      const attendees = Array.isArray(session.attendees)
        ? session.attendees
            .filter((email: unknown) => typeof email === 'string' && email.includes('@'))
            .map((email: string) => ({ email }))
        : undefined;

      const event = {
        summary: session.title,
        description: [
          session.summary || '',
          session.notes ? `\nNotas: ${session.notes}` : '',
          session.topics?.length ? `\nTópicos: ${session.topics.join(', ')}` : '',
          session.next_steps ? `\nPróximos passos: ${session.next_steps}` : '',
        ].filter(Boolean).join(''),
        ...(attendees && attendees.length ? { attendees } : {}),
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'email', minutes: 60 },
          ],
        },
        // Attempt to create a Google Meet link when possible
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      console.log('[google-calendar-sync] Creating event:', event.summary);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events?conferenceDataVersion=1`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      const data = await response.json();

      if (data.error) {
        console.error('[google-calendar-sync] Create event error:', data.error);
        throw new Error(data.error.message);
      }

      console.log('[google-calendar-sync] Event created:', data.id);

      return new Response(JSON.stringify({ 
        success: true,
        eventId: data.id,
        eventLink: data.htmlLink,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update-event') {
      const startDate = new Date(session.session_date);
      const endDate = new Date(startDate.getTime() + (session.duration_minutes || 60) * 60 * 1000);

      const event = {
        summary: session.title,
        description: [
          session.summary || '',
          session.notes ? `\nNotas: ${session.notes}` : '',
          session.topics?.length ? `\nTópicos: ${session.topics.join(', ')}` : '',
          session.next_steps ? `\nPróximos passos: ${session.next_steps}` : '',
        ].filter(Boolean).join(''),
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
      };

      console.log('[google-calendar-sync] Updating event:', eventId);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete-event') {
      console.log('[google-calendar-sync] Deleting event:', eventId);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.status !== 204 && response.status !== 200) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Erro ao deletar evento');
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list-events') {
      const now = new Date();
      const defaultTimeMin = now.toISOString();
      const defaultTimeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const safeTimeMin = typeof timeMin === 'string' && timeMin ? timeMin : defaultTimeMin;
      const safeTimeMax = typeof timeMax === 'string' && timeMax ? timeMax : defaultTimeMax;
      const safeMaxResults =
        typeof maxResults === 'number' && Number.isFinite(maxResults)
          ? String(Math.min(Math.max(Math.floor(maxResults), 1), 250))
          : '50';

      const params = new URLSearchParams({
        timeMin: safeTimeMin,
        timeMax: safeTimeMax,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: safeMaxResults,
      });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events?${params}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return new Response(JSON.stringify({ 
        events: data.items?.map((event: any) => ({
          id: event.id,
          summary: event.summary,
          description: event.description,
          attendees: (event.attendees || []).map((a: any) => ({
            email: a.email,
            displayName: a.displayName,
            responseStatus: a.responseStatus,
            organizer: a.organizer,
            self: a.self,
          })),
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          htmlLink: event.htmlLink,
        })) || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[google-calendar-sync] Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
