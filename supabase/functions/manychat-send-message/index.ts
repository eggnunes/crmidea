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
    console.log('Send message request:', { conversationId, content, subscriberId });

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
      console.error('MANYCHAT_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'ManyChat API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('user_id, manychat_subscriber_id, channel, contact_name, channel_user_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('Conversation not found:', convError);
      return new Response(
        JSON.stringify({ error: 'Conversa não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use provided subscriberId or get from conversation
    const finalSubscriberId = subscriberId || conversation.manychat_subscriber_id;
    
    // ManyChat subscriber_id is REQUIRED for Instagram/Facebook
    if (!finalSubscriberId) {
      console.error('No manychat_subscriber_id for conversation:', conversationId);
      return new Response(
        JSON.stringify({ 
          error: 'ID do ManyChat não encontrado',
          message: 'Este contato não possui ID do ManyChat vinculado. Para resolver:\n\n1. Configure o "Default Reply" no ManyChat para Instagram com HTTP POST para o webhook do CRM\n2. Peça ao contato enviar uma nova mensagem\n3. Ou adicione o subscriber_id manualmente na conversa',
          requiresSubscriberId: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending via ManyChat, subscriber:', finalSubscriberId, 'channel:', conversation.channel);

    // Determine content type based on channel
    const contentType = conversation.channel === 'facebook' ? 'facebook' : 'instagram';
    
    const requestBody = {
      subscriber_id: parseInt(finalSubscriberId),
      data: {
        version: 'v2',
        content: {
          type: contentType,
          messages: [{ type: 'text', text: content }],
        },
      },
    };

    console.log('ManyChat request body:', JSON.stringify(requestBody));
    
    const manychatResponse = await fetch(
      `https://api.manychat.com/fb/sending/sendContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${manychatApiKey}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    const manychatResult = await manychatResponse.json();
    console.log('ManyChat API response:', manychatResult);

    if (!manychatResponse.ok || manychatResult.status === 'error') {
      const errorMessage = manychatResult.details?.messages?.[0] || manychatResult.message || 'Erro do ManyChat';
      
      // Check if it's a 24-hour policy error
      if (errorMessage.includes('24') || errorMessage.includes('window') || errorMessage.includes('outside') || errorMessage.includes('policy')) {
        return new Response(
          JSON.stringify({ 
            error: 'Janela de 24 horas expirada',
            message: 'Não é possível enviar mensagens para este contato. A última interação foi há mais de 24 horas. Aguarde o contato enviar uma nova mensagem.',
            is24HourPolicy: true
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          message: `Erro ao enviar via ManyChat: ${errorMessage}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    console.error('Error in send-message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
