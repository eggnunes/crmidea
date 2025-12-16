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

    // Note: ManyChat's findBySystemField only supports 'phone' or 'email'
    // It doesn't support searching by ig_id directly
    // We'll try to use findByCustomField if the user has configured an instagram_id custom field
    
    // First try with a custom field (if configured)
    const customFieldUrl = new URL('https://api.manychat.com/fb/subscriber/findByCustomField');
    customFieldUrl.searchParams.append('field_name', 'instagram_id');
    customFieldUrl.searchParams.append('field_value', igUserId);
    
    let searchResponse = await fetch(customFieldUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${manychatApiKey}`,
      },
    });

    let searchResult = await searchResponse.json();
    console.log('ManyChat custom field search response:', JSON.stringify(searchResult));

    // If custom field search fails or returns no data, explain the limitation
    if (!searchResponse.ok || searchResult.status === 'error' || !searchResult.data?.id) {
      console.log('Custom field search failed, ManyChat API limitation');
      
      return new Response(
        JSON.stringify({ 
          error: 'Busca automática não disponível', 
          message: 'A API do ManyChat não permite buscar por Instagram ID. Para vincular o contato:\n\n1. Abra o ManyChat\n2. Vá em Contacts e encontre o contato pelo nome\n3. Copie o ID numérico do subscriber\n4. Cole no campo acima',
          limitation: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract subscriber data from successful response
    const subscriberData = searchResult.data;
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
