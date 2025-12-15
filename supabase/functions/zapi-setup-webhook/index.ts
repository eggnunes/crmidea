import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
    const zapiToken = Deno.env.get('ZAPI_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (!zapiInstanceId || !zapiToken) {
      throw new Error('Z-API credentials not configured');
    }

    // Get the webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/zapi-webhook`;
    
    console.log(`Setting up Z-API webhook: ${webhookUrl}`);

    // Configure Z-API webhook
    const configUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/update-webhook-received`;
    
    const response = await fetch(configUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: webhookUrl,
      }),
    });

    const responseData = await response.json();
    console.log('Z-API webhook config response:', JSON.stringify(responseData));

    if (!response.ok) {
      throw new Error(`Z-API error: ${JSON.stringify(responseData)}`);
    }

    // Also configure delivery callback
    const deliveryUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/update-webhook-delivery`;
    
    const deliveryResponse = await fetch(deliveryUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: webhookUrl,
      }),
    });

    const deliveryData = await deliveryResponse.json();
    console.log('Z-API delivery webhook config response:', JSON.stringify(deliveryData));

    // Configure message status callback
    const statusUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/update-webhook-message-status`;
    
    const statusResponse = await fetch(statusUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: webhookUrl,
      }),
    });

    const statusData = await statusResponse.json();
    console.log('Z-API status webhook config response:', JSON.stringify(statusData));

    return new Response(JSON.stringify({ 
      success: true,
      webhookUrl,
      message: 'Webhooks configured successfully',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error configuring Z-API webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
