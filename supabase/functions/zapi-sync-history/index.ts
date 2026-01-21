import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
    const zapiToken = Deno.env.get('ZAPI_TOKEN');
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!zapiInstanceId || !zapiToken || !zapiClientToken) {
      return new Response(JSON.stringify({ error: 'Z-API credentials not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get admin user
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .single();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: 'No admin user found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = adminRole.user_id;
    const body = await req.json().catch(() => ({}));
    const { phone, limit = 50 } = body;

    let syncedCount = 0;
    let conversationsProcessed = 0;
    const errors: string[] = [];

    // If phone is provided, sync specific conversation
    // Otherwise, sync all recent chats
    const phonesToSync: string[] = [];

    if (phone) {
      phonesToSync.push(phone);
    } else {
      // Get list of recent chats from Z-API
      console.log('Fetching recent chats from Z-API...');
      const chatsResponse = await fetch(
        `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/chats`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': zapiClientToken,
          },
        }
      );

      if (!chatsResponse.ok) {
        const errorText = await chatsResponse.text();
        console.error('Failed to fetch chats:', errorText);
        return new Response(JSON.stringify({ error: 'Failed to fetch chats from Z-API', details: errorText }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const chats = await chatsResponse.json();
      console.log(`Found ${chats.length} chats`);

      // Get phones from chats (filter out groups)
      for (const chat of chats.slice(0, limit)) {
        const chatPhone = chat.phone || chat.id?.replace('@c.us', '').replace('@s.whatsapp.net', '');
        if (chatPhone && !chat.isGroup && !chatPhone.includes('@g.us')) {
          phonesToSync.push(chatPhone);
        }
      }
    }

    console.log(`Will sync ${phonesToSync.length} conversations`);

    // Process each phone
    for (const targetPhone of phonesToSync) {
      try {
        console.log(`Syncing messages for: ${targetPhone}`);
        
        // Format phone for Z-API
        let formattedPhone = targetPhone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('55') && formattedPhone.length <= 11) {
          formattedPhone = '55' + formattedPhone;
        }

        // Get messages from Z-API
        const messagesResponse = await fetch(
          `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/chat-messages/${formattedPhone}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Client-Token': zapiClientToken,
            },
          }
        );

        if (!messagesResponse.ok) {
          const errorText = await messagesResponse.text();
          console.error(`Failed to fetch messages for ${targetPhone}:`, errorText);
          errors.push(`${targetPhone}: ${errorText}`);
          continue;
        }

        const messagesData = await messagesResponse.json();
        const messages = messagesData.messages || messagesData || [];
        
        if (!Array.isArray(messages) || messages.length === 0) {
          console.log(`No messages found for ${targetPhone}`);
          continue;
        }

        console.log(`Found ${messages.length} messages for ${targetPhone}`);

        // Get contact info from first message
        const firstMsg = messages[0];
        const contactName = firstMsg.senderName || firstMsg.pushName || firstMsg.notifyName || null;
        const profilePicUrl = firstMsg.photo || firstMsg.profilePicUrl || null;

        // Find or create conversation
        let { data: conversation } = await supabase
          .from('whatsapp_conversations')
          .select('*')
          .eq('user_id', userId)
          .eq('contact_phone', formattedPhone)
          .maybeSingle();

        if (!conversation) {
          const { data: newConv, error: convError } = await supabase
            .from('whatsapp_conversations')
            .insert({
              user_id: userId,
              contact_phone: formattedPhone,
              contact_name: contactName,
              profile_picture_url: profilePicUrl,
              last_message_at: new Date().toISOString(),
              unread_count: 0,
            })
            .select()
            .single();

          if (convError) {
            console.error(`Failed to create conversation for ${targetPhone}:`, convError);
            errors.push(`${targetPhone}: Failed to create conversation`);
            continue;
          }
          conversation = newConv;
        } else if (contactName && !conversation.contact_name) {
          // Update name if missing
          await supabase
            .from('whatsapp_conversations')
            .update({ contact_name: contactName, profile_picture_url: profilePicUrl })
            .eq('id', conversation.id);
        }

        // Get existing message IDs to avoid duplicates
        const { data: existingMessages } = await supabase
          .from('whatsapp_messages')
          .select('zapi_message_id')
          .eq('conversation_id', conversation.id)
          .not('zapi_message_id', 'is', null);

        const existingIds = new Set((existingMessages || []).map(m => m.zapi_message_id));

        // Insert new messages
        let insertedCount = 0;
        for (const msg of messages) {
          const messageId = msg.messageId || msg.id?.id || msg.id;
          
          if (!messageId || existingIds.has(messageId)) {
            continue;
          }

          const isFromMe = msg.fromMe === true;
          const messageContent = msg.text?.message || msg.body || msg.caption || msg.message || '';
          
          // Skip empty messages (unless audio/image)
          if (!messageContent && !msg.audio && !msg.ptt && !msg.image) {
            continue;
          }

          // Determine message type
          let messageType = 'text';
          let content = messageContent;
          
          if (msg.audio || msg.ptt) {
            messageType = 'audio';
            const audioUrl = msg.audio?.audioUrl || msg.ptt?.pttUrl || msg.audio?.url || msg.ptt?.url;
            content = audioUrl ? `[Áudio: ${audioUrl}]` : '[Áudio]';
          } else if (msg.image) {
            messageType = 'image';
            const imageUrl = msg.image?.imageUrl || msg.image?.url;
            content = imageUrl ? `[Imagem: ${imageUrl}]` : `[Imagem] ${msg.image?.caption || ''}`.trim();
          } else if (msg.document) {
            messageType = 'document';
            content = `[Documento: ${msg.document?.fileName || 'arquivo'}]`;
          }

          // Parse timestamp
          let createdAt = new Date();
          if (msg.momment || msg.timestamp) {
            const ts = msg.momment || msg.timestamp;
            // Z-API can send timestamp as milliseconds or ISO string
            if (typeof ts === 'number') {
              createdAt = new Date(ts < 10000000000 ? ts * 1000 : ts);
            } else if (typeof ts === 'string') {
              createdAt = new Date(ts);
            }
          }

          const { error: insertError } = await supabase
            .from('whatsapp_messages')
            .insert({
              conversation_id: conversation.id,
              user_id: userId,
              message_type: messageType,
              content: content,
              is_from_contact: !isFromMe,
              is_ai_response: false,
              zapi_message_id: messageId,
              status: isFromMe ? 'sent' : 'delivered',
              created_at: createdAt.toISOString(),
            });

          if (insertError) {
            console.error(`Failed to insert message ${messageId}:`, insertError);
          } else {
            insertedCount++;
            syncedCount++;
          }
        }

        // Update last_message_at with most recent message
        if (insertedCount > 0) {
          const { data: latestMsg } = await supabase
            .from('whatsapp_messages')
            .select('created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (latestMsg) {
            await supabase
              .from('whatsapp_conversations')
              .update({ last_message_at: latestMsg.created_at })
              .eq('id', conversation.id);
          }
        }

        console.log(`Synced ${insertedCount} new messages for ${targetPhone}`);
        conversationsProcessed++;

      } catch (error) {
        console.error(`Error processing ${targetPhone}:`, error);
        errors.push(`${targetPhone}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      syncedMessages: syncedCount,
      conversationsProcessed,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in zapi-sync-history:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
