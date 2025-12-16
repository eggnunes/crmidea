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
    const { conversationId, content, phone, type, audio, image, document, fileName, action } = await req.json();
    
    const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
    const zapiToken = Deno.env.get('ZAPI_TOKEN');
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
    
    if (!zapiInstanceId || !zapiToken) {
      // If checking status and no credentials, return disconnected
      if (action === 'check-status') {
        return new Response(JSON.stringify({ connected: false, reason: 'credentials_missing' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('Z-API credentials not configured');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (zapiClientToken) {
      headers['Client-Token'] = zapiClientToken;
    }

    // Check connection status
    if (action === 'check-status') {
      try {
        const statusUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/status`;
        const statusResponse = await fetch(statusUrl, { headers });
        const statusData = await statusResponse.json();
        
        console.log('Z-API status:', JSON.stringify(statusData));
        
        // Z-API returns connected: true when WhatsApp is connected
        const isConnected = statusData.connected === true || statusData.status === 'connected';
        
        return new Response(JSON.stringify({ 
          connected: isConnected,
          status: statusData.status || statusData,
          message: isConnected ? 'WhatsApp conectado' : 'WhatsApp desconectado. Acesse o painel Z-API para escanear o QR Code.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (statusError) {
        console.error('Error checking Z-API status:', statusError);
        return new Response(JSON.stringify({ 
          connected: false, 
          reason: 'status_check_failed',
          message: 'Não foi possível verificar o status. Verifique suas credenciais Z-API.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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


    let zapiUrl: string;
    let body: Record<string, any>;
    let messageType = type || 'text';

    if (type === 'audio' && audio) {
      // Send audio message
      zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-audio`;
      body = {
        phone: formattedPhone,
        audio: `data:audio/ogg;base64,${audio}`,
      };
      console.log(`Sending audio to ${formattedPhone}`);
    } else if (type === 'image' && image) {
      // Send image message
      zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-image`;
      body = {
        phone: formattedPhone,
        image: `data:image/jpeg;base64,${image}`,
      };
      console.log(`Sending image to ${formattedPhone}`);
    } else if (type === 'document' && document) {
      // Send document message
      zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-document/pdf`;
      body = {
        phone: formattedPhone,
        document: `data:application/pdf;base64,${document}`,
        fileName: fileName || 'document.pdf',
      };
      console.log(`Sending document to ${formattedPhone}: ${fileName}`);
    } else {
      // Send text message
      zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`;
      body = {
        phone: formattedPhone,
        message: content,
      };
      console.log(`Sending text to ${formattedPhone}: ${content?.substring(0, 50)}...`);
    }

    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
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
      let msgContent = content;
      if (type === 'audio') msgContent = '[Áudio enviado]';
      if (type === 'image') msgContent = '[Imagem enviada]';
      if (type === 'document') msgContent = `[Documento enviado: ${fileName || 'arquivo'}]`;

      const { data: savedMessage, error: msgError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          message_type: messageType,
          content: msgContent,
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
