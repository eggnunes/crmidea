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
      const phone = payload.phone || payload.from?.replace('@c.us', '').replace('@s.whatsapp.net', '');
      const messageContent = payload.text?.message || payload.body || payload.message;
      const messageType = payload.type || 'text';
      const senderName = payload.senderName || payload.pushName || null;
      const zapiMessageId = payload.messageId || payload.id?.id;
      const isGroup = payload.isGroup || payload.chatId?.includes('@g.us') || false;
      const isAudioMessage = messageType === 'audio' || messageType === 'ptt';
      // Get audio URL for transcription
      const audioUrl = isAudioMessage ? (payload.audio?.audioUrl || payload.audio || payload.url || null) : null;

      if (!phone || !messageContent) {
        console.log('Missing phone or content, skipping');
        return new Response(JSON.stringify({ status: 'skipped' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Processing ${messageType} message from ${phone}: ${messageContent.substring(0, 50)}...`);

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
            last_message_at: new Date().toISOString(),
            unread_count: 1,
          })
          .select()
          .single();

        if (convError) throw convError;
        conversation = newConv;
        console.log('Created new conversation:', conversation.id);
      } else {
        // Update existing conversation
        await supabase
          .from('whatsapp_conversations')
          .update({
            contact_name: senderName || conversation.contact_name,
            last_message_at: new Date().toISOString(),
            unread_count: (conversation.unread_count || 0) + 1,
          })
          .eq('id', conversation.id);
      }

      // Save the message
      const { data: savedMessage, error: msgError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversation.id,
          user_id: userId,
          message_type: messageType,
          content: messageContent,
          is_from_contact: true,
          is_ai_response: false,
          zapi_message_id: zapiMessageId,
          status: 'delivered',
        })
        .select()
        .single();

      if (msgError) throw msgError;
      console.log('Saved message:', savedMessage.id);

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
        
        // Call AI processing function
        try {
          await supabase.functions.invoke('zapi-ai-respond', {
            body: {
              conversationId: conversation.id,
              messageContent,
              contactPhone: phone,
              userId,
              isAudioMessage,
              audioUrl,
            },
          });
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