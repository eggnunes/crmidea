import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch user profile from Instagram
async function fetchInstagramProfile(userId: string, accessToken: string): Promise<{name?: string, profile_pic?: string}> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${userId}?fields=name,profile_pic&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      console.log('Failed to fetch Instagram profile:', await response.text());
      return {};
    }
    
    const data = await response.json();
    console.log('Instagram profile data:', data);
    return {
      name: data.name,
      profile_pic: data.profile_pic
    };
  } catch (error) {
    console.error('Error fetching Instagram profile:', error);
    return {};
  }
}

// Verify X-Hub-Signature-256 header for POST requests
async function verifySignature(body: string, signature: string | null, appSecret: string): Promise<boolean> {
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );

    const expectedSignature = 'sha256=' + Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Webhook verification (GET request from Meta)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const receivedToken = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('Instagram webhook verification:', { mode, receivedToken: receivedToken ? '[REDACTED]' : null, challenge });

    if (mode !== 'subscribe' || !challenge || !receivedToken) {
      console.log('Missing required parameters for webhook verification');
      return new Response('Forbidden', { status: 403 });
    }

    // Fetch any active Instagram config to get the stored verify token
    const { data: channelConfig, error: configError } = await supabase
      .from('channel_configs')
      .select('webhook_verify_token')
      .eq('channel', 'instagram')
      .eq('is_active', true)
      .not('webhook_verify_token', 'is', null)
      .limit(1)
      .single();

    if (configError || !channelConfig?.webhook_verify_token) {
      console.log('No Instagram config with verify token found');
      return new Response('Forbidden', { status: 403 });
    }

    // Validate the token matches the stored verify token
    if (receivedToken !== channelConfig.webhook_verify_token) {
      console.log('Verify token mismatch');
      return new Response('Forbidden', { status: 403 });
    }

    console.log('Webhook verified successfully');
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Handle incoming messages (POST request)
  if (req.method === 'POST') {
    try {
      // Get raw body for signature verification
      const rawBody = await req.text();
      const signature = req.headers.get('x-hub-signature-256');

      // Get Meta App Secret from environment (required for signature verification)
      const metaAppSecret = Deno.env.get('META_APP_SECRET');

      if (metaAppSecret) {
        // Verify the signature if we have the app secret
        const isValid = await verifySignature(rawBody, signature, metaAppSecret);
        if (!isValid) {
          console.error('Invalid webhook signature');
          return new Response('Unauthorized', { status: 401 });
        }
        console.log('Webhook signature verified successfully');
      } else {
        console.warn('META_APP_SECRET not configured - skipping signature verification');
        // If no app secret is configured, we still process but log a warning
        // This allows the webhook to work during development while encouraging proper setup
      }

      const body = JSON.parse(rawBody);
      console.log('Instagram webhook received:', JSON.stringify(body, null, 2));

      // Process Instagram messaging events
      if (body.object === 'instagram') {
        for (const entry of body.entry || []) {
          const pageId = entry.id;

          // Find the user who owns this Instagram page
          const { data: channelConfig } = await supabase
            .from('channel_configs')
            .select('user_id, access_token')
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

            // Fetch user profile
            const profile = await fetchInstagramProfile(senderId, channelConfig.access_token);

            // Find or create conversation
            let { data: conversation } = await supabase
              .from('whatsapp_conversations')
              .select('*')
              .eq('user_id', userId)
              .eq('channel', 'instagram')
              .eq('channel_user_id', senderId)
              .single();

            if (!conversation) {
              // Create new conversation with profile info
              const { data: newConversation, error: convError } = await supabase
                .from('whatsapp_conversations')
                .insert({
                  user_id: userId,
                  contact_phone: senderId,
                  contact_name: profile.name || `Instagram User ${senderId.slice(-6)}`,
                  channel: 'instagram',
                  channel_user_id: senderId,
                  channel_page_id: pageId,
                  profile_picture_url: profile.profile_pic,
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
              const updates: any = {
                last_message_at: new Date(timestamp).toISOString(),
                unread_count: (conversation.unread_count || 0) + 1
              };
              
              // Update profile if we have new info
              if (profile.name && (!conversation.contact_name || conversation.contact_name.startsWith('Instagram User'))) {
                updates.contact_name = profile.name;
              }
              if (profile.profile_pic && !conversation.profile_picture_url) {
                updates.profile_picture_url = profile.profile_pic;
              }
              
              await supabase
                .from('whatsapp_conversations')
                .update(updates)
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

            // Trigger AI response
            console.log('Triggering AI response for Instagram message');
            try {
              await supabase.functions.invoke('meta-ai-respond', {
                body: {
                  conversationId: conversation.id,
                  messageContent: content,
                  contactId: senderId,
                  userId,
                  channel: 'instagram'
                }
              });
            } catch (aiError) {
              console.error('Error triggering AI response:', aiError);
            }
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
