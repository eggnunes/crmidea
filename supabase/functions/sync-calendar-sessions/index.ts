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

// Default consultant ID
const DEFAULT_CONSULTANT_ID = "e850e3e3-1682-4cb0-af43-d7dade2aff9e";

async function getValidAccessToken(supabase: any, userId: string): Promise<string | null> {
  const { data: tokenData, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) {
    console.error('[sync-calendar-sessions] No tokens found:', error);
    return null;
  }

  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();

  // Token still valid
  if (expiresAt > now) {
    return tokenData.access_token;
  }

  // Refresh token
  console.log('[sync-calendar-sessions] Refreshing token...');
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
    console.error('[sync-calendar-sessions] Refresh error:', tokens);
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

// Helper function to sync a single client's calendar
async function syncClientCalendar(
  supabase: any, 
  consultingClient: { id: string; full_name: string; email: string }, 
  accessToken: string, 
  consultantId: string
): Promise<{ synced: number; events: any[] }> {
  const now = new Date();
  const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const futureDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const clientEmail = consultingClient.email;

  const params = new URLSearchParams({
    timeMin: pastDate.toISOString(),
    timeMax: futureDate.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
    q: clientEmail,
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const data = await response.json();

  if (data.error) {
    console.error('[sync-calendar-sessions] Calendar API error:', data.error);
    return { synced: 0, events: [] };
  }

  const events = data.items || [];
  console.log(`[sync-calendar-sessions] Found ${events.length} events for ${clientEmail}`);

  let syncedCount = 0;
  const syncedEvents: any[] = [];

  for (const event of events) {
    const hasClientEmail = event.attendees?.some((a: any) => 
      a.email?.toLowerCase() === clientEmail.toLowerCase()
    ) || event.description?.toLowerCase().includes(clientEmail.toLowerCase());

    const hasClientName = event.summary?.toLowerCase().includes(
      consultingClient.full_name.split(' ')[0].toLowerCase()
    );

    if (!hasClientEmail && !hasClientName) {
      continue;
    }

    const eventStart = event.start?.dateTime || event.start?.date;
    if (!eventStart) continue;

    const { data: existingSession } = await supabase
      .from('consulting_sessions')
      .select('id')
      .eq('client_id', consultingClient.id)
      .eq('title', event.summary || 'Reunião')
      .gte('session_date', new Date(new Date(eventStart).getTime() - 60000).toISOString())
      .lte('session_date', new Date(new Date(eventStart).getTime() + 60000).toISOString())
      .maybeSingle();

    if (existingSession) {
      continue;
    }

    let durationMinutes = 60;
    if (event.end?.dateTime && event.start?.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    }

    const eventDate = new Date(eventStart);
    const status = eventDate < now ? 'completed' : 'scheduled';

    const { error: insertError } = await supabase
      .from('consulting_sessions')
      .insert({
        client_id: consultingClient.id,
        user_id: consultantId,
        title: event.summary || 'Reunião de Consultoria',
        session_date: eventStart,
        duration_minutes: durationMinutes,
        session_type: event.hangoutLink ? 'online' : 'presential',
        status: status,
        notes: event.description || null,
        summary: event.hangoutLink ? `Link: ${event.hangoutLink}` : null,
      });

    if (insertError) {
      console.error('[sync-calendar-sessions] Insert error:', insertError);
      continue;
    }

    syncedCount++;
    syncedEvents.push({
      title: event.summary,
      date: eventStart,
      status,
    });

    console.log(`[sync-calendar-sessions] Created session: ${event.summary}`);
  }

  // Also search by client name if no events found
  if (syncedCount === 0) {
    const nameParams = new URLSearchParams({
      timeMin: pastDate.toISOString(),
      timeMax: futureDate.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50',
      q: consultingClient.full_name.split(' ')[0],
    });

    const nameResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${nameParams}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const nameData = await nameResponse.json();
    const nameEvents = nameData.items || [];

    for (const event of nameEvents) {
      const eventStart = event.start?.dateTime || event.start?.date;
      if (!eventStart) continue;

      const { data: existingSession } = await supabase
        .from('consulting_sessions')
        .select('id')
        .eq('client_id', consultingClient.id)
        .eq('title', event.summary || 'Reunião')
        .maybeSingle();

      if (existingSession) continue;

      let durationMinutes = 60;
      if (event.end?.dateTime && event.start?.dateTime) {
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      }

      const eventDate = new Date(eventStart);
      const status = eventDate < now ? 'completed' : 'scheduled';

      const { error: insertError } = await supabase
        .from('consulting_sessions')
        .insert({
          client_id: consultingClient.id,
          user_id: consultantId,
          title: event.summary || 'Reunião de Consultoria',
          session_date: eventStart,
          duration_minutes: durationMinutes,
          session_type: event.hangoutLink ? 'online' : 'presential',
          status: status,
          notes: event.description || null,
          summary: event.hangoutLink ? `Link: ${event.hangoutLink}` : null,
        });

      if (!insertError) {
        syncedCount++;
        syncedEvents.push({
          title: event.summary,
          date: eventStart,
          status,
        });
      }
    }
  }

  return { synced: syncedCount, events: syncedEvents };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const body = await req.json();
    const { clientEmail, consultantId, syncAll } = body;
    const targetConsultantId = consultantId || DEFAULT_CONSULTANT_ID;
    
    // If syncAll is true, sync all clients for this consultant
    if (syncAll) {
      console.log(`[sync-calendar-sessions] Syncing ALL clients for consultant: ${targetConsultantId}`);
      
      const accessToken = await getValidAccessToken(supabase, targetConsultantId);
      
      if (!accessToken) {
        return new Response(JSON.stringify({ 
          error: 'Google Calendar não conectado',
          synced: 0 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Get all clients for this consultant
      const { data: allClients, error: clientsError } = await supabase
        .from('consulting_clients')
        .select('id, full_name, email')
        .eq('user_id', targetConsultantId);
      
      if (clientsError || !allClients?.length) {
        console.log('[sync-calendar-sessions] No clients found');
        return new Response(JSON.stringify({ 
          message: 'Nenhum cliente encontrado',
          synced: 0 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      let totalSynced = 0;
      const allSyncedEvents: any[] = [];
      
      for (const client of allClients) {
        const result = await syncClientCalendar(supabase, client, accessToken, targetConsultantId);
        totalSynced += result.synced;
        allSyncedEvents.push(...result.events);
      }
      
      console.log(`[sync-calendar-sessions] Total synced for all clients: ${totalSynced}`);
      
      return new Response(JSON.stringify({ 
        success: true,
        synced: totalSynced,
        clientsProcessed: allClients.length,
        events: allSyncedEvents,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`[sync-calendar-sessions] Syncing for client: ${clientEmail}, consultant: ${targetConsultantId}`);

    const accessToken = await getValidAccessToken(supabase, targetConsultantId);

    if (!accessToken) {
      return new Response(JSON.stringify({ 
        error: 'Google Calendar não conectado',
        synced: 0 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: consultingClient, error: clientError } = await supabase
      .from('consulting_clients')
      .select('id, full_name, email')
      .eq('email', clientEmail)
      .eq('user_id', targetConsultantId)
      .maybeSingle();

    if (clientError || !consultingClient) {
      console.log('[sync-calendar-sessions] Client not found:', clientEmail);
      return new Response(JSON.stringify({ 
        error: 'Cliente não encontrado',
        synced: 0 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const result = await syncClientCalendar(supabase, consultingClient, accessToken, targetConsultantId);
    
    return new Response(JSON.stringify({ 
      success: true,
      synced: result.synced,
      events: result.events,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[sync-calendar-sessions] Error:', error);
    return new Response(JSON.stringify({ error: errorMessage, synced: 0 }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});