import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('KIWIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('KIWIFY_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Kiwify credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Getting Kiwify OAuth token...');

    // Get OAuth token
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

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token error:', tokenData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get token', details: tokenData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const accessToken = tokenData.access_token;
    console.log('Token obtained successfully');

    // Parse request body for account_id
    const body = await req.json().catch(() => ({}));
    const accountId = body.account_id || Deno.env.get('KIWIFY_ACCOUNT_ID');

    if (!accountId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'account_id is required. Pass it in the request body or set KIWIFY_ACCOUNT_ID secret' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check existing webhooks first
    console.log('Checking existing webhooks...');
    const listResponse = await fetch('https://public-api.kiwify.com/v1/webhooks?page_number=1&page_size=50', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-kiwify-account-id': accountId,
      },
    });

    const listData = await listResponse.json();
    console.log('Existing webhooks:', JSON.stringify(listData, null, 2));

    const webhookUrl = `${supabaseUrl}/functions/v1/kiwify-webhook`;
    
    // Check if webhook already exists
    const existingWebhook = listData.data?.find((w: any) => w.url === webhookUrl);
    
    if (existingWebhook) {
      console.log('Webhook already exists:', existingWebhook.id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook already configured',
          webhook: existingWebhook,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the webhook
    console.log('Creating webhook at:', webhookUrl);
    
    const webhookToken = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    
    const createResponse = await fetch('https://public-api.kiwify.com/v1/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-kiwify-account-id': accountId,
      },
      body: JSON.stringify({
        name: 'CRM Integration',
        url: webhookUrl,
        products: 'all',
        triggers: [
          'boleto_gerado',
          'pix_gerado',
          'carrinho_abandonado',
          'compra_recusada',
          'compra_aprovada',
          'compra_reembolsada',
          'chargeback',
          'subscription_canceled',
          'subscription_late',
          'subscription_renewed',
        ],
        token: webhookToken,
      }),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      console.error('Create webhook error:', createData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create webhook', details: createData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Webhook created successfully:', createData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook created successfully',
        webhook: createData,
        webhook_token: webhookToken,
        note: 'Save this token! Kiwify will send it in the x-kiwify-webhook-token header',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Setup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
