import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Step 1: Get available flows to find the correct flow_ns
    console.log('Fetching available flows...');
    const flowsResponse = await fetch(`https://api.manychat.com/fb/page/getFlows`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const flowsData = await flowsResponse.json();
    console.log('Available flows:', JSON.stringify(flowsData));

    // Find the "Follow-up CRM" flow
    let flowNs = null;
    let flowName = null;
    const flows = flowsData.data?.flows || [];
    
    if (flowsData.status === 'success' && flows.length > 0) {
      const followUpFlow = flows.find((flow: { name: string }) => 
        flow.name.toLowerCase().includes('follow-up') || 
        flow.name.toLowerCase().includes('follow up') ||
        flow.name.toLowerCase().includes('crm')
      );
      
      if (followUpFlow) {
        flowNs = followUpFlow.ns;
        flowName = followUpFlow.name;
        console.log(`Found flow: "${followUpFlow.name}" with ns: ${flowNs}`);
      } else {
        console.log('Flow "Follow-up CRM" not found. Available flows:', 
          flows.map((f: { name: string; ns: string }) => `${f.name} (${f.ns})`).join(', ')
        );
        // Use the first available flow as fallback
        flowNs = flows[0].ns;
        flowName = flows[0].name;
        console.log(`Using first available flow: ${flowName} with ns: ${flowNs}`);
      }
    }

    if (!flowNs) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Nenhum flow encontrado na conta ManyChat',
          availableFlows: flows,
          rawResponse: flowsData
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 2: Set Custom Fields with test data
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

    if (setFieldsData.status === 'error') {
      console.error('Failed to set custom fields:', setFieldsData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao definir Custom Fields',
          details: setFieldsData
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 3: Send the Flow with the correct flow_ns
    console.log(`Sending Flow "${flowName}" with ns: ${flowNs}...`);
    const manychatResponse = await fetch(`https://api.manychat.com/fb/sending/sendFlow`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriber_id: parseInt(subscriber_id),
        flow_ns: flowNs
      }),
    });

    const manychatData = await manychatResponse.json();
    console.log('ManyChat sendFlow response:', JSON.stringify(manychatData));

    if (manychatData.status === 'error') {
      console.error('ManyChat API error:', manychatData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro na API do ManyChat',
          details: manychatData,
          flowUsed: { name: flowName, ns: flowNs }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Test Flow sent successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Flow "${flowName}" enviado com sucesso! Verifique seu WhatsApp.`,
        response: manychatData,
        flowUsed: { name: flowName, ns: flowNs }
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
