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
      throw new Error('Z-API credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending messages that should be sent now
    const now = new Date().toISOString();
    
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now);

    if (fetchError) throw fetchError;

    console.log(`Found ${pendingMessages?.length || 0} pending messages to send`);

    if (!pendingMessages || pendingMessages.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        messagesSent: 0,
        message: 'No pending messages to send' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const msg of pendingMessages) {
      try {
        // Ensure there is a conversation so we can persist history in whatsapp_messages
        const normalizedPhone = msg.contact_phone.replace(/\D/g, '');
        let formattedPhone = normalizedPhone;
        if (!formattedPhone.startsWith('55')) {
          formattedPhone = '55' + formattedPhone;
        }

        // Find or create conversation (per user)
        let conversationId: string | null = null;
        const { data: existingConv, error: convFindError } = await supabase
          .from('whatsapp_conversations')
          .select('id')
          .eq('user_id', msg.user_id)
          .eq('contact_phone', formattedPhone)
          .maybeSingle();

        if (convFindError) {
          console.error('Error finding conversation for scheduled message:', convFindError);
        }

        if (existingConv?.id) {
          conversationId = existingConv.id;
        } else {
          const { data: createdConv, error: convCreateError } = await supabase
            .from('whatsapp_conversations')
            .insert({
              user_id: msg.user_id,
              contact_phone: formattedPhone,
              contact_name: null,
              unread_count: 0,
              last_message_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (convCreateError) {
            console.error('Error creating conversation for scheduled message:', convCreateError);
          } else {
            conversationId = createdConv?.id || null;
          }
        }

        // Format phone number
        // Send via Z-API
        const zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`;
        
        const sendResponse = await fetch(zapiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': zapiClientToken,
          },
          body: JSON.stringify({
            phone: formattedPhone,
            message: msg.message,
          }),
        });

        const sendData = await sendResponse.json();
        console.log(`Z-API send response for ${msg.id}:`, sendData);

        if (sendResponse.ok && (sendData.messageId || sendData.zapiMessageId)) {
          const zapiMessageId = sendData.messageId || sendData.zapiMessageId;

          // Persist into whatsapp_messages so it shows up in the client's history
          if (conversationId) {
            const { error: saveMsgError } = await supabase
              .from('whatsapp_messages')
              .insert({
                conversation_id: conversationId,
                user_id: msg.user_id,
                message_type: 'text',
                content: msg.message,
                is_from_contact: false,
                is_ai_response: false,
                zapi_message_id: zapiMessageId,
                status: 'sent',
              });

            if (saveMsgError) {
              console.error('Error saving scheduled WhatsApp message to history:', saveMsgError);
            }

            await supabase
              .from('whatsapp_conversations')
              .update({ last_message_at: new Date().toISOString() })
              .eq('id', conversationId);
          }

          // Update message as sent
          await supabase
            .from('scheduled_messages')
            .update({ 
              status: 'sent', 
              sent_at: new Date().toISOString() 
            })
            .eq('id', msg.id);

          sentCount++;
          console.log(`Message ${msg.id} sent successfully`);
        } else {
          throw new Error(sendData.error || 'Failed to send message');
        }
      } catch (error) {
        console.error(`Error sending scheduled message ${msg.id}:`, error);
        
        // Update message as failed
        await supabase
          .from('scheduled_messages')
          .update({ 
            status: 'failed', 
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', msg.id);

        failedCount++;
      }

      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return new Response(JSON.stringify({ 
      success: true,
      messagesSent: sentCount,
      messagesFailed: failedCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-scheduled-messages:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
