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
    const { conversationId, content, phone } = await req.json();
    
    const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
    const zapiToken = Deno.env.get('ZAPI_TOKEN');
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
    
    if (!zapiInstanceId || !zapiToken) {
      throw new Error('Z-API credentials not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let targetPhone = phone;
    let conversation;

    // Get conversation and phone if not provided
    if (conversationId && !phone) {
      const { data: conv, error: convError } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;
      conversation = conv;
      targetPhone = conv.contact_phone;
    }

    if (!targetPhone) {
      throw new Error('Phone number is required');
    }

    // Format phone number for Z-API (should be: 5511999999999)
    let formattedPhone = targetPhone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }

    console.log(`Sending message to ${formattedPhone}: ${content.substring(0, 50)}...`);

    // Send via Z-API
    const zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (zapiClientToken) {
      headers['Client-Token'] = zapiClientToken;
    }

    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone: formattedPhone,
        message: content,
      }),
    });

    const responseData = await response.json();
    console.log('Z-API response:', JSON.stringify(responseData));

    if (!response.ok) {
      throw new Error(`Z-API error: ${JSON.stringify(responseData)}`);
    }

    // Get user_id from conversation
    let userId;
    if (conversation) {
      userId = conversation.user_id;
    } else if (conversationId) {
      const { data: conv } = await supabase
        .from('whatsapp_conversations')
        .select('user_id')
        .eq('id', conversationId)
        .single();
      userId = conv?.user_id;
    }

    // Save the sent message
    if (conversationId && userId) {
      const { data: savedMessage, error: msgError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          message_type: 'text',
          content: content,
          is_from_contact: false,
          is_ai_response: false,
          zapi_message_id: responseData.messageId || responseData.zapiMessageId,
          status: 'sent',
        })
        .select()
        .single();

      if (msgError) {
        console.error('Error saving message:', msgError);
      } else {
        console.log('Message saved:', savedMessage.id);
      }

      // Update conversation last_message_at
      await supabase
        .from('whatsapp_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    return new Response(JSON.stringify({ 
      success: true,
      messageId: responseData.messageId || responseData.zapiMessageId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending message via Z-API:', error);
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
