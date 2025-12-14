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

    const { subscriber_id, message } = await req.json();

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

    console.log(`Testing ManyChat integration for subscriber: ${subscriber_id}`);

    // Send test message via ManyChat API
    // Using message_tag to allow sending after 24h window
    const manychatResponse = await fetch(
      `https://api.manychat.com/fb/sending/sendContent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MANYCHAT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriber_id: subscriber_id,
          message_tag: 'ACCOUNT_UPDATE',
          data: {
            version: 'v2',
            content: {
              messages: [
                {
                  type: 'text',
                  text: message || '🧪 Teste de integração ManyChat-CRM realizado com sucesso!'
                }
              ]
            }
          }
        }),
      }
    );

    const manychatData = await manychatResponse.json();
    console.log('ManyChat API response:', JSON.stringify(manychatData));

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

    console.log('Test message sent successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mensagem de teste enviada com sucesso!',
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
