import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, content, subscriberId } = await req.json();
    console.log('ManyChat send message request:', { conversationId, content, subscriberId });

    if (!conversationId || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const manychatApiKey = Deno.env.get('MANYCHAT_API_KEY');
    
    if (!manychatApiKey) {
      return new Response(
        JSON.stringify({ error: 'ManyChat API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get conversation to find user_id and subscriber_id
    const { data: conversation, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('user_id, manychat_subscriber_id, channel, contact_name')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('Conversation not found:', convError);
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use provided subscriberId or get from conversation
    const finalSubscriberId = subscriberId || conversation.manychat_subscriber_id;
    
    if (!finalSubscriberId) {
      console.error('No ManyChat subscriber ID available for this conversation');
      return new Response(
        JSON.stringify({ 
          error: 'No ManyChat subscriber ID available', 
          message: 'Este contato ainda não interagiu via ManyChat. Não é possível enviar mensagens.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending message via ManyChat to subscriber:', finalSubscriberId);

    // Send message via ManyChat API
    // ManyChat uses the sendContent endpoint for Instagram
    const manychatResponse = await fetch(
      `https://api.manychat.com/fb/sending/sendContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${manychatApiKey}`,
        },
        body: JSON.stringify({
          subscriber_id: parseInt(finalSubscriberId),
          data: {
            version: 'v2',
            content: {
              messages: [
                {
                  type: 'text',
                  text: content,
                },
              ],
            },
          },
        }),
      }
    );

    const manychatResult = await manychatResponse.json();
    console.log('ManyChat API response:', manychatResult);

    if (!manychatResponse.ok || manychatResult.status === 'error') {
      console.error('ManyChat API error:', manychatResult);
      
      // Check for 24-hour window policy error (code 3011)
      if (manychatResult.code === 3011) {
        return new Response(
          JSON.stringify({ 
            error: 'Janela de 24 horas expirada',
            message: 'Não é possível enviar mensagens para este contato. A última interação foi há mais de 24 horas. Aguarde o contato enviar uma nova mensagem para poder responder.',
            is24HourPolicy: true
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send message via ManyChat', 
          details: manychatResult 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save message to database
    const { error: msgError } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversationId,
        user_id: conversation.user_id,
        content,
        message_type: 'text',
        is_from_contact: false,
        is_ai_response: false,
        status: 'sent',
        channel: conversation.channel || 'instagram',
      });

    if (msgError) {
      console.error('Error saving message:', msgError);
    }

    // Update conversation last_message_at
    await supabase
      .from('whatsapp_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manychat-send-message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
