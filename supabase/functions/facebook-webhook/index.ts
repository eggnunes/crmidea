import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Webhook verification (GET request from Meta)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('Facebook webhook verification:', { mode, token, challenge });

    if (mode === 'subscribe' && challenge) {
      console.log('Webhook verified successfully');
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return new Response('Forbidden', { status: 403 });
  }

  // Handle incoming messages (POST request)
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('Facebook webhook received:', JSON.stringify(body, null, 2));

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Process Facebook Messenger events
      if (body.object === 'page') {
        for (const entry of body.entry || []) {
          const pageId = entry.id;

          // Find the user who owns this Facebook page
          const { data: channelConfig } = await supabase
            .from('channel_configs')
            .select('user_id')
            .eq('channel', 'facebook')
            .eq('page_id', pageId)
            .eq('is_active', true)
            .single();

          if (!channelConfig) {
            console.log('No active Facebook config found for page:', pageId);
            continue;
          }

          const userId = channelConfig.user_id;

          for (const messaging of entry.messaging || []) {
            const senderId = messaging.sender?.id;
            const recipientId = messaging.recipient?.id;
            const timestamp = messaging.timestamp;
            const message = messaging.message;

            if (!message || !senderId) continue;

            // Skip echo messages (messages sent by the page)
            if (message.is_echo) continue;

            console.log('Processing Facebook message:', {
              senderId,
              recipientId,
              messageText: message.text,
              messageId: message.mid
            });

            // Find or create conversation
            let { data: conversation } = await supabase
              .from('whatsapp_conversations')
              .select('*')
              .eq('user_id', userId)
              .eq('channel', 'facebook')
              .eq('channel_user_id', senderId)
              .single();

            if (!conversation) {
              // Create new conversation
              const { data: newConversation, error: convError } = await supabase
                .from('whatsapp_conversations')
                .insert({
                  user_id: userId,
                  contact_phone: senderId,
                  contact_name: `Facebook User ${senderId.slice(-6)}`,
                  channel: 'facebook',
                  channel_user_id: senderId,
                  channel_page_id: pageId,
                  last_message_at: new Date(timestamp).toISOString(),
                  unread_count: 1
                })
                .select()
                .single();

              if (convError) {
                console.error('Error creating conversation:', convError);
                continue;
              }

              conversation = newConversation;
              console.log('Created new Facebook conversation:', conversation.id);
            } else {
              // Update existing conversation
              await supabase
                .from('whatsapp_conversations')
                .update({
                  last_message_at: new Date(timestamp).toISOString(),
                  unread_count: (conversation.unread_count || 0) + 1
                })
                .eq('id', conversation.id);
            }

            // Determine message type
            let messageType = 'text';
            let content = message.text || '';

            if (message.attachments) {
              const attachment = message.attachments[0];
              if (attachment.type === 'image') {
                messageType = 'image';
                content = attachment.payload?.url || '[Imagem]';
              } else if (attachment.type === 'video') {
                messageType = 'video';
                content = attachment.payload?.url || '[Vídeo]';
              } else if (attachment.type === 'audio') {
                messageType = 'audio';
                content = attachment.payload?.url || '[Áudio]';
              } else if (attachment.type === 'file') {
                messageType = 'document';
                content = attachment.payload?.url || '[Arquivo]';
              }
            }

            // Save the incoming message
            const { error: msgError } = await supabase
              .from('whatsapp_messages')
              .insert({
                conversation_id: conversation.id,
                user_id: userId,
                content,
                message_type: messageType,
                is_from_contact: true,
                is_ai_response: false,
                status: 'received',
                channel: 'facebook',
                channel_message_id: message.mid
              });

            if (msgError) {
              console.error('Error saving message:', msgError);
            } else {
              console.log('Facebook message saved successfully');
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error processing Facebook webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
