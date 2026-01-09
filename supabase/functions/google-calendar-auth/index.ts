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
      console.error('[google-calendar-auth] Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the user ID from the verified JWT token, NOT from request body
    const authenticatedUserId = claimsData.claims.sub as string;
    
    const { action, code, redirectUri } = await req.json();
    console.log(`[google-calendar-auth] Action: ${action}, userId: ${authenticatedUserId}`);

    if (action === 'get-auth-url') {
      // Generate OAuth URL
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ].join(' ');

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopes);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      console.log('[google-calendar-auth] Generated auth URL');

      return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'exchange-code') {
      // Exchange code for tokens
      console.log('[google-calendar-auth] Exchanging code for tokens');

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        console.error('[google-calendar-auth] Token exchange error:', tokens);
        throw new Error(tokens.error_description || tokens.error);
      }

      console.log('[google-calendar-auth] Tokens received successfully');

      // Calculate expiry time
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Store tokens in database using authenticated user ID
      const { error: upsertError } = await supabase
        .from('google_calendar_tokens')
        .upsert({
          user_id: authenticatedUserId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_type: tokens.token_type || 'Bearer',
          expires_at: expiresAt,
          scope: tokens.scope,
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('[google-calendar-auth] Error storing tokens:', upsertError);
        throw upsertError;
      }

      console.log('[google-calendar-auth] Tokens stored successfully');

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'refresh-token') {
      // Get current tokens for authenticated user
      const { data: tokenData, error: fetchError } = await supabase
        .from('google_calendar_tokens')
        .select('*')
        .eq('user_id', authenticatedUserId)
        .single();

      if (fetchError || !tokenData) {
        throw new Error('No tokens found for user');
      }

      console.log('[google-calendar-auth] Refreshing token');

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
        console.error('[google-calendar-auth] Refresh error:', tokens);
        throw new Error(tokens.error_description || tokens.error);
      }

      // Update tokens
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      const { error: updateError } = await supabase
        .from('google_calendar_tokens')
        .update({
          access_token: tokens.access_token,
          expires_at: expiresAt,
        })
        .eq('user_id', authenticatedUserId);

      if (updateError) {
        throw updateError;
      }

      console.log('[google-calendar-auth] Token refreshed successfully');

      return new Response(JSON.stringify({ 
        success: true, 
        access_token: tokens.access_token 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disconnect') {
      const { error: deleteError } = await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', authenticatedUserId);

      if (deleteError) {
        throw deleteError;
      }

      console.log('[google-calendar-auth] Disconnected Google Calendar');

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[google-calendar-auth] Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
