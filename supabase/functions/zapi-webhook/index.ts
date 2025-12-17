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
    const payload = await req.json();
    console.log('Z-API Webhook received:', JSON.stringify(payload, null, 2));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Z-API sends different event types
    // Common events: ReceivedCallback, MessageStatusCallback, etc.
    const eventType = payload.event || payload.type;
    
    // Handle incoming message
    if (eventType === 'ReceivedCallback' || payload.isNewsletter === false) {
      // CRITICAL: Check if message was sent BY the business (fromMe = true)
      // If fromMe is true, this is an outgoing message we sent, NOT an incoming message from contact
      // Skip processing to avoid AI responding to its own messages
      const fromMe = payload.fromMe === true;
      
      if (fromMe) {
        console.log('Message sent by business (fromMe: true), skipping to avoid loop');
        return new Response(JSON.stringify({ status: 'skipped', reason: 'fromMe' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const phone = payload.phone || payload.from?.replace('@c.us', '').replace('@s.whatsapp.net', '');
      
      // Capture profile picture URL from Z-API
      const profilePicUrl = payload.photo || payload.profilePicUrl || payload.senderPhoto || null;
      
      // IMPORTANT: Prioritize pushName (contact's chosen name) over senderName (business contact name)
      // Z-API sends the contact name in different fields depending on the event type
      // pushName is the contact's WhatsApp profile name
      // senderName may be the business contact name in the phone's address book
      // notifyName is another field some Z-API versions use
      const rawPushName = payload.pushName || payload.notifyName || null;
      const rawSenderName = payload.senderName || null;
      const rawContactName = payload.contactName || payload.contact?.name || null;
      const rawName = payload.name || null;
      
      // Priority: pushName > contactName > senderName > name
      // Exclude business names and phone numbers
      const isBusinessName = (n: string | null) => {
        if (!n) return true;
        const lower = n.toLowerCase();
        return lower.includes('mentoria') || lower.includes('idea') || lower.includes('ideia');
      };
      
      const isPhoneNumber = (n: string | null) => {
        if (!n) return true;
        return /^\+?\d{8,15}$/.test(n.replace(/[\s\-\(\)]/g, ''));
      };
      
      let senderName: string | null = null;
      if (rawPushName && !isBusinessName(rawPushName) && !isPhoneNumber(rawPushName)) {
        senderName = rawPushName;
      } else if (rawContactName && !isBusinessName(rawContactName) && !isPhoneNumber(rawContactName)) {
        senderName = rawContactName;
      } else if (rawSenderName && !isBusinessName(rawSenderName) && !isPhoneNumber(rawSenderName)) {
        senderName = rawSenderName;
      } else if (rawName && !isBusinessName(rawName) && !isPhoneNumber(rawName)) {
        senderName = rawName;
      }
      
      console.log('Name fields from Z-API:', { rawPushName, rawSenderName, rawContactName, rawName, resolvedName: senderName, profilePicUrl });
      const zapiMessageId = payload.messageId || payload.id?.id;
      const isGroup = payload.isGroup || payload.chatId?.includes('@g.us') || false;
      
      // Detect message type - Z-API uses different structures for different message types
      // Audio messages come with "audio" or "ptt" object, not "text"
      const hasAudio = payload.audio || payload.ptt;
      const isAudioMessage = hasAudio !== undefined;
      const messageType = isAudioMessage ? (payload.ptt ? 'ptt' : 'audio') : 'text';
      
      // Get audio URL for transcription
      let audioUrl: string | null = null;
      if (isAudioMessage) {
        // Z-API sends audio info in different formats
        const audioData = payload.audio || payload.ptt;
        audioUrl = audioData?.audioUrl || audioData?.pttUrl || audioData?.url || 
                   (typeof audioData === 'string' ? audioData : null);
        console.log('Audio message detected, audioUrl:', audioUrl);
        console.log('Full audio payload:', JSON.stringify(audioData, null, 2));
      }
      
      // Get text content (will be empty for audio messages)
      const messageContent = payload.text?.message || payload.body || payload.message || '';
      
      // For audio messages, we don't require text content
      if (!phone) {
        console.log('Missing phone, skipping');
        return new Response(JSON.stringify({ status: 'skipped' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Skip if no content AND not an audio message
      if (!messageContent && !isAudioMessage) {
        console.log('Missing content and not audio, skipping');
        return new Response(JSON.stringify({ status: 'skipped' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Check for human transfer trigger phrases
      const transferPhrases = [
        'falar com rafael',
        'quero falar com rafael',
        'falar com o rafael',
        'falar com humano',
        'falar com atendente',
        'atendimento humano',
        'atendente humano'
      ];
      const isTransferRequest = transferPhrases.some(phrase => 
        messageContent.toLowerCase().includes(phrase)
      );

      // Check for duplicate message by zapi_message_id
      if (zapiMessageId) {
        const { data: existingMessage } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('zapi_message_id', zapiMessageId)
          .maybeSingle();

        if (existingMessage) {
          console.log(`Duplicate message detected: ${zapiMessageId}, skipping`);
          return new Response(JSON.stringify({ status: 'duplicate' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      console.log(`Processing ${messageType} message from ${phone}: ${isAudioMessage ? '[AUDIO]' : messageContent.substring(0, 50)}...`);

      // Find or create conversation
      // First, we need to find the user who owns this Z-API instance
      // For now, we'll get the first admin user (you may want to improve this logic)
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .single();

      if (!adminRole) {
        console.error('No admin user found');
        return new Response(JSON.stringify({ error: 'No admin found' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userId = adminRole.user_id;

      // Find or create conversation
      let { data: conversation } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('contact_phone', phone)
        .maybeSingle();

      if (!conversation) {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('whatsapp_conversations')
          .insert({
            user_id: userId,
            contact_phone: phone,
            contact_name: senderName,
            profile_picture_url: profilePicUrl,
            last_message_at: new Date().toISOString(),
            unread_count: 1,
          })
          .select()
          .single();

        if (convError) throw convError;
        conversation = newConv;
        console.log('Created new conversation:', conversation.id, 'with name:', senderName, 'photo:', profilePicUrl);
      } else {
        // Update existing conversation
        // Update contact_name if:
        // 1. Current name is null/empty (always update with any valid name)
        // 2. Current name is just the phone number (update with real name)
        // 3. We have a valid name AND it's different from current
        const hasValidName = senderName && senderName.trim() !== '';
        
        const currentNameIsEmpty = !conversation.contact_name || conversation.contact_name.trim() === '';
        const currentNameIsPhone = conversation.contact_name && /^\+?\d{8,15}$/.test(conversation.contact_name.replace(/[\s\-\(\)]/g, ''));
        const shouldUpdateName = hasValidName && (currentNameIsEmpty || currentNameIsPhone);
        
        // Update photo if we have one and current is empty
        const shouldUpdatePhoto = profilePicUrl && !conversation.profile_picture_url;
        
        const updateData: Record<string, unknown> = {
          last_message_at: new Date().toISOString(),
          unread_count: (conversation.unread_count || 0) + 1,
        };
        
        if (shouldUpdateName) {
          updateData.contact_name = senderName;
          console.log(`Updating contact_name from "${conversation.contact_name}" to "${senderName}"`);
        }
        
        if (shouldUpdatePhoto) {
          updateData.profile_picture_url = profilePicUrl;
          console.log(`Updating profile_picture_url to "${profilePicUrl}"`);
        }
        
        await supabase
          .from('whatsapp_conversations')
          .update(updateData)
          .eq('id', conversation.id);
      }

      // Save the message
      const contentToSave = isAudioMessage ? (audioUrl ? `[Áudio: ${audioUrl}]` : '[Áudio recebido]') : messageContent;
      const { data: savedMessage, error: msgError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversation.id,
          user_id: userId,
          message_type: messageType,
          content: contentToSave,
          is_from_contact: true,
          is_ai_response: false,
          zapi_message_id: zapiMessageId,
          status: 'delivered',
        })
        .select()
        .single();

      if (msgError) throw msgError;
      console.log('Saved message:', savedMessage.id);

      // Handle human transfer request
      if (isTransferRequest) {
        console.log('Human transfer requested by:', phone, senderName);
        
        const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
        const zapiToken = Deno.env.get('ZAPI_TOKEN');
        const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
        
        // 1. Disable bot for this contact
        const { data: contact } = await supabase
          .from('whatsapp_contacts')
          .select('id')
          .eq('user_id', userId)
          .eq('phone', phone)
          .maybeSingle();
        
        if (contact) {
          await supabase
            .from('whatsapp_contacts')
            .update({ bot_disabled: true })
            .eq('id', contact.id);
        } else {
          // Create contact with bot disabled
          await supabase
            .from('whatsapp_contacts')
            .insert({
              user_id: userId,
              phone: phone,
              name: senderName,
              bot_disabled: true,
            });
        }
        
        console.log('Bot disabled for contact:', phone);
        
        // 2. Send confirmation message to contact
        if (zapiInstanceId && zapiToken && zapiClientToken) {
          let formattedPhone = phone.replace(/\D/g, '');
          if (!formattedPhone.startsWith('55')) {
            formattedPhone = '55' + formattedPhone;
          }
          
          const confirmMessage = `✅ *Perfeito, ${senderName || 'amigo(a)'}!*\n\n` +
            `O Rafael foi notificado e em breve vai falar diretamente com você.\n\n` +
            `Aguarde só um instante que já retornamos! 🙏`;
          
          await fetch(`https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Client-Token': zapiClientToken,
            },
            body: JSON.stringify({ phone: formattedPhone, message: confirmMessage }),
          });
          
          // Save confirmation message to database
          await supabase
            .from('whatsapp_messages')
            .insert({
              conversation_id: conversation.id,
              user_id: userId,
              message_type: 'text',
              content: confirmMessage,
              is_from_contact: false,
              is_ai_response: false,
              status: 'sent',
            });
        }
        
        // 3. Create in-app notification
        if (conversation.lead_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              lead_id: conversation.lead_id,
              title: '🔔 Transferência Solicitada!',
              message: `${senderName || phone} quer falar diretamente com você. A IA foi desativada para esta conversa.`,
              type: 'transfer_request',
            });
        }
        
        // 4. Send WhatsApp notification to admin's personal phone
        // Get admin's phone from follow_up_settings or profiles
        const { data: followUpSettings } = await supabase
          .from('follow_up_settings')
          .select('manychat_subscriber_id')
          .eq('user_id', userId)
          .maybeSingle();
        
        // Try to get admin notification via own WhatsApp (send to admin conversation)
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        // For now, log the transfer request
        console.log(`Transfer request notification created for user ${userId} from ${senderName || phone}`);
        
        return new Response(JSON.stringify({ 
          status: 'success',
          conversationId: conversation.id,
          messageId: savedMessage.id,
          transferRequested: true,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if AI is enabled and should respond
      const { data: aiConfig } = await supabase
        .from('ai_assistant_config')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Check if should skip groups
      const shouldSkipGroup = isGroup && aiConfig?.disable_group_messages;

      if (aiConfig?.is_active && !shouldSkipGroup) {
        console.log('AI is active, triggering response...');
        
        // Call AI processing function directly via HTTP (bypass invoke issues)
        try {
          const aiResponseUrl = `${supabaseUrl}/functions/v1/zapi-ai-respond`;
          console.log('Calling AI respond function at:', aiResponseUrl);
          
          const aiCallResponse = await fetch(aiResponseUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              conversationId: conversation.id,
              messageContent,
              contactPhone: phone,
              userId,
              isAudioMessage,
              audioUrl,
            }),
          });

          if (!aiCallResponse.ok) {
            const errorText = await aiCallResponse.text();
            console.error('AI respond function error:', aiCallResponse.status, errorText);
          } else {
            const aiResult = await aiCallResponse.json();
            console.log('AI respond result:', aiResult);
          }
        } catch (aiError) {
          console.error('Error calling AI respond function:', aiError);
        }
      } else if (shouldSkipGroup) {
        console.log('Skipping group message (disabled in settings)');
      }

      return new Response(JSON.stringify({ 
        status: 'success',
        conversationId: conversation.id,
        messageId: savedMessage.id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle message status updates
    if (eventType === 'MessageStatusCallback' || payload.status) {
      const status = payload.status?.toLowerCase();
      const zapiMessageId = payload.messageId || payload.id?.id;

      if (zapiMessageId && status) {
        await supabase
          .from('whatsapp_messages')
          .update({ status })
          .eq('zapi_message_id', zapiMessageId);
        
        console.log(`Updated message ${zapiMessageId} status to ${status}`);
      }
    }

    return new Response(JSON.stringify({ status: 'processed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing Z-API webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});