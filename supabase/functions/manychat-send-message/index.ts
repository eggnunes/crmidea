import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Send message via Meta Graph API directly
async function sendViaMetaApi(
  accessToken: string, 
  recipientId: string, 
  message: string
): Promise<{success: boolean, error?: string, messageId?: string}> {
  try {
    console.log('Sending message via Meta API to:', recipientId);
    
    const response = await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: 'RESPONSE',
      }),
    });

    const result = await response.json();
    console.log('Meta API response:', result);

    if (!response.ok || result.error) {
      return { 
        success: false, 
        error: result.error?.message || `HTTP ${response.status}` 
      };
    }

    return { success: true, messageId: result.message_id };
  } catch (error) {
    console.error('Meta API error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get conversation with channel config
    const { data: conversation, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('user_id, manychat_subscriber_id, channel, contact_name, channel_user_id, channel_page_id')
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
    let messageSent = false;
    let sendError = '';

    // Try ManyChat first if subscriber_id exists
    if (finalSubscriberId && manychatApiKey) {
      console.log('Trying ManyChat first, subscriber:', finalSubscriberId, 'channel:', conversation.channel);

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

      if (manychatResponse.ok && manychatResult.status !== 'error') {
        messageSent = true;
      } else {
        sendError = manychatResult.details?.messages?.[0] || manychatResult.message || 'ManyChat error';
        console.log('ManyChat failed, will try Meta API. Error:', sendError);
      }
    }

    // Fallback to Meta API if ManyChat failed or no subscriber_id
    if (!messageSent && conversation.channel_user_id) {
      console.log('Trying Meta API fallback for channel_user_id:', conversation.channel_user_id);
      
      // Get channel config with access token
      const { data: channelConfig } = await supabase
        .from('channel_configs')
        .select('access_token')
        .eq('user_id', conversation.user_id)
        .eq('channel', conversation.channel)
        .eq('is_active', true)
        .single();

      if (channelConfig?.access_token) {
        const metaResult = await sendViaMetaApi(
          channelConfig.access_token,
          conversation.channel_user_id,
          content
        );

        if (metaResult.success) {
          messageSent = true;
          console.log('Message sent via Meta API successfully');
        } else {
          sendError = metaResult.error || 'Meta API error';
          console.error('Meta API also failed:', sendError);
        }
      } else {
        sendError = 'No access token configured for this channel';
        console.error(sendError);
      }
    }

    // If still not sent, return error
    if (!messageSent) {
      // Check if it's a 24-hour policy error
      if (sendError.includes('24') || sendError.includes('window') || sendError.includes('outside')) {
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
          error: sendError || 'Não foi possível enviar a mensagem',
          message: 'Verifique as configurações do canal ou aguarde o contato interagir novamente.'
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
