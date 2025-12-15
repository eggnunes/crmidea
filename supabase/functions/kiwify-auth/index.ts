import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KiwifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('KIWIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('KIWIFY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Kiwify credentials not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Kiwify credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Requesting Kiwify OAuth token...');

    // Get OAuth token from Kiwify
    const tokenResponse = await fetch('https://public-api.kiwify.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData: KiwifyTokenResponse = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Kiwify token error:', tokenData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get Kiwify token', details: tokenData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Kiwify token obtained successfully. Scope:', tokenData.scope);

    return new Response(
      JSON.stringify({ 
        success: true, 
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
