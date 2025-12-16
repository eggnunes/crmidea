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
    const { conversationId, instagramUserId } = await req.json();
    console.log('ManyChat find subscriber request:', { conversationId, instagramUserId });

    if (!conversationId && !instagramUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing conversationId or instagramUserId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const manychatApiKey = Deno.env.get('MANYCHAT_API_KEY');
    
    if (!manychatApiKey) {
      return new Response(
        JSON.stringify({ error: 'ManyChat API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let igUserId = instagramUserId;
    let convId = conversationId;

    // If conversationId provided, get the channel_user_id from the conversation
    if (conversationId && !instagramUserId) {
      const { data: conversation, error: convError } = await supabase
        .from('whatsapp_conversations')
        .select('channel_user_id, channel')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        console.error('Conversation not found:', convError);
        return new Response(
          JSON.stringify({ error: 'Conversation not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (conversation.channel !== 'instagram') {
        return new Response(
          JSON.stringify({ error: 'This feature only works for Instagram conversations' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      igUserId = conversation.channel_user_id;
    }

    if (!igUserId) {
      return new Response(
        JSON.stringify({ error: 'No Instagram user ID available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching ManyChat for Instagram user:', igUserId);

    // Try to find subscriber by Instagram user ID using ManyChat API
    // The findBySystemField endpoint uses GET with query parameters
    const searchUrl = new URL('https://api.manychat.com/fb/subscriber/findBySystemField');
    searchUrl.searchParams.append('field_name', 'ig_id');
    searchUrl.searchParams.append('field_value', igUserId);
    
    const searchResponse = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${manychatApiKey}`,
      },
    });

    const searchResult = await searchResponse.json();
    console.log('ManyChat search response:', JSON.stringify(searchResult));

    if (!searchResponse.ok || searchResult.status === 'error') {
      // Try alternative: search by name (if we have contact name)
      console.log('findBySystemField failed, trying getInfo with subscriber list...');
      
      return new Response(
        JSON.stringify({ 
          error: 'Subscriber not found', 
          message: 'Este contato não foi encontrado no ManyChat. O contato precisa interagir via ManyChat primeiro.',
          details: searchResult
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract subscriber ID from response
    const subscriberData = searchResult.data;
    
    if (!subscriberData || !subscriberData.id) {
      return new Response(
        JSON.stringify({ 
          error: 'Subscriber not found', 
          message: 'Este contato não foi encontrado no ManyChat.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subscriberId = subscriberData.id.toString();
    console.log('Found ManyChat subscriber ID:', subscriberId);

    // Update the conversation with the subscriber ID
    if (convId) {
      const { error: updateError } = await supabase
        .from('whatsapp_conversations')
        .update({ manychat_subscriber_id: subscriberId })
        .eq('id', convId);

      if (updateError) {
        console.error('Error updating conversation:', updateError);
      } else {
        console.log('Updated conversation with subscriber ID');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscriberId,
        subscriberData: {
          id: subscriberData.id,
          name: subscriberData.name,
          first_name: subscriberData.first_name,
          last_name: subscriberData.last_name,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manychat-find-subscriber:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
