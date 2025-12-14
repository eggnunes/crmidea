import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FLOW_ID = 'content20251214024458_954194';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MANYCHAT_API_KEY = Deno.env.get('MANYCHAT_API_KEY');
    
    if (!MANYCHAT_API_KEY) {
      console.error('MANYCHAT_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'MANYCHAT_API_KEY não configurada' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { subscriber_id } = await req.json();

    if (!subscriber_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'subscriber_id é obrigatório' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Testing ManyChat Flow integration for subscriber: ${subscriber_id}`);

    // Step 1: Set Custom Fields with test data
    console.log('Setting custom fields for test...');
    const setFieldsResponse = await fetch(`https://api.manychat.com/fb/subscriber/setCustomFields`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriber_id: parseInt(subscriber_id),
        fields: [
          { field_name: 'lead_name', field_value: 'Lead Teste' },
          { field_name: 'days_inactive', field_value: '5' },
          { field_name: 'product_name', field_value: 'Consultoria' }
        ]
      }),
    });

    const setFieldsData = await setFieldsResponse.json();
    console.log('Set Custom Fields response:', JSON.stringify(setFieldsData));

    if (!setFieldsResponse.ok) {
      console.error('Failed to set custom fields:', setFieldsData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao definir Custom Fields',
          details: setFieldsData
        }),
        { 
          status: setFieldsResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 2: Send the Flow with the approved template
    console.log('Sending Flow...');
    const manychatResponse = await fetch(`https://api.manychat.com/fb/sending/sendFlow`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriber_id: parseInt(subscriber_id),
        flow_ns: FLOW_ID
      }),
    });

    const manychatData = await manychatResponse.json();
    console.log('ManyChat sendFlow response:', JSON.stringify(manychatData));

    if (!manychatResponse.ok) {
      console.error('ManyChat API error:', manychatData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro na API do ManyChat',
          details: manychatData
        }),
        { 
          status: manychatResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Test Flow sent successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Flow de teste enviado com sucesso! Verifique seu WhatsApp.',
        response: manychatData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in test-manychat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});