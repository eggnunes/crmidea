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
        // Format phone number
        let formattedPhone = msg.contact_phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('55')) {
          formattedPhone = '55' + formattedPhone;
        }

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
