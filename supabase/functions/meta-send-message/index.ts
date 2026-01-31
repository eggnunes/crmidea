import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate JWT and get authenticated user
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error('JWT validation failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = claimsData.claims.sub as string;

    const { conversationId, content, channel, recipientId } = await req.json();
    console.log('Meta send message request:', { conversationId, content, channel, recipientId, authenticatedUserId });

    if (!conversationId || !content || !channel || !recipientId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify conversation belongs to authenticated user
    const { data: conversation, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('user_id, channel_page_id')
      .eq('id', conversationId)
      .eq('user_id', authenticatedUserId)
      .single();

    if (convError || !conversation) {
      console.error('Conversation not found or access denied:', convError);
      return new Response(
        JSON.stringify({ error: 'Conversa não encontrada ou acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get channel config for access token (verified user is the owner)
    const { data: channelConfig, error: configError } = await supabase
      .from('channel_configs')
      .select('access_token, page_id')
      .eq('user_id', authenticatedUserId)
      .eq('channel', channel)
      .eq('is_active', true)
      .single();

    if (configError || !channelConfig?.access_token) {
      console.error('Channel config not found:', configError);
      return new Response(
        JSON.stringify({ error: 'Channel not configured or inactive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine the correct API endpoint
    let apiUrl: string;
    let messageBody: Record<string, unknown>;

    if (channel === 'instagram') {
      // Instagram Graph API for sending messages
      apiUrl = `https://graph.facebook.com/v18.0/${channelConfig.page_id}/messages`;
      messageBody = {
        recipient: { id: recipientId },
        message: { text: content },
      };
    } else if (channel === 'facebook') {
      // Facebook Messenger API
      apiUrl = `https://graph.facebook.com/v18.0/${channelConfig.page_id}/messages`;
      messageBody = {
        recipient: { id: recipientId },
        message: { text: content },
        messaging_type: 'RESPONSE',
      };
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported channel' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending message to Meta API:', { apiUrl, messageBody });

    // Send message via Meta API
    const metaResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelConfig.access_token}`,
      },
      body: JSON.stringify(messageBody),
    });

    const metaResult = await metaResponse.json();
    console.log('Meta API response:', metaResult);

    if (!metaResponse.ok) {
      console.error('Meta API error:', metaResult);
      return new Response(
        JSON.stringify({ error: 'Failed to send message via Meta API', details: metaResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save message to database
    const { error: msgError } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversationId,
        user_id: authenticatedUserId,
        content,
        message_type: 'text',
        is_from_contact: false,
        is_ai_response: false,
        status: 'sent',
        channel,
        channel_message_id: metaResult.message_id,
      });

    if (msgError) {
      console.error('Error saving message:', msgError);
    }

    // Update conversation last_message_at
    await supabase
      .from('whatsapp_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', authenticatedUserId);

    return new Response(
      JSON.stringify({ success: true, message_id: metaResult.message_id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in meta-send-message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
