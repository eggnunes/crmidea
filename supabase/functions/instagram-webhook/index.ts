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

    console.log('Instagram webhook verification:', { mode, token, challenge });

    // For now, accept any verification (in production, verify the token)
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
      console.log('Instagram webhook received:', JSON.stringify(body, null, 2));

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Process Instagram messaging events
      if (body.object === 'instagram') {
        for (const entry of body.entry || []) {
          const pageId = entry.id;

          // Find the user who owns this Instagram page
          const { data: channelConfig } = await supabase
            .from('channel_configs')
            .select('user_id')
            .eq('channel', 'instagram')
            .eq('page_id', pageId)
            .eq('is_active', true)
            .single();

          if (!channelConfig) {
            console.log('No active Instagram config found for page:', pageId);
            continue;
          }

          const userId = channelConfig.user_id;

          for (const messaging of entry.messaging || []) {
            const senderId = messaging.sender?.id;
            const recipientId = messaging.recipient?.id;
            const timestamp = messaging.timestamp;
            const message = messaging.message;

            if (!message || !senderId) continue;

            // Skip messages sent by the page itself
            if (senderId === pageId) continue;

            console.log('Processing Instagram message:', {
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
              .eq('channel', 'instagram')
              .eq('channel_user_id', senderId)
              .single();

            if (!conversation) {
              // Create new conversation
              const { data: newConversation, error: convError } = await supabase
                .from('whatsapp_conversations')
                .insert({
                  user_id: userId,
                  contact_phone: senderId, // Using sender ID as identifier
                  contact_name: `Instagram User ${senderId.slice(-6)}`,
                  channel: 'instagram',
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
              console.log('Created new Instagram conversation:', conversation.id);
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
                channel: 'instagram',
                channel_message_id: message.mid
              });

            if (msgError) {
              console.error('Error saving message:', msgError);
            } else {
              console.log('Instagram message saved successfully');
            }

            // TODO: Trigger AI response if enabled for Instagram channel
            // For now, just log that we would trigger AI
            console.log('Would trigger AI response for Instagram message');
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error processing Instagram webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
