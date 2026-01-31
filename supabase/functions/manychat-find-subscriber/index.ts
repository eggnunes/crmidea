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

    const { conversationId, instagramUserId, fetchNameOnly } = await req.json();
    console.log('ManyChat find subscriber request:', { conversationId, instagramUserId, fetchNameOnly, authenticatedUserId });

    if (!conversationId && !instagramUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing conversationId or instagramUserId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const manychatApiKey = Deno.env.get('MANYCHAT_API_KEY');
    
    if (!manychatApiKey) {
      return new Response(
        JSON.stringify({ error: 'ManyChat API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let convId = conversationId;
    let conversation: Record<string, unknown> | null = null;

    // If conversationId provided, get the conversation details AND verify ownership
    if (conversationId) {
      const { data: conv, error: convError } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', authenticatedUserId)
        .single();

      if (convError || !conv) {
        console.error('Conversation not found or access denied:', convError);
        return new Response(
          JSON.stringify({ error: 'Conversa não encontrada ou acesso negado' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      conversation = conv;

      // Check if we already have a subscriber ID
      const existingSubscriberId = conv.manychat_subscriber_id;
      
      if (existingSubscriberId && fetchNameOnly) {
        // Just fetch the subscriber info to update the name
        console.log('Fetching subscriber info for existing ID:', existingSubscriberId);
        
        const subscriberResponse = await fetch(
          `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${existingSubscriberId}`,
          {
            headers: {
              'Authorization': `Bearer ${manychatApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (subscriberResponse.ok) {
          const subscriberData = await subscriberResponse.json();
          console.log('ManyChat subscriber data:', JSON.stringify(subscriberData, null, 2));

          // Extract name - prefer ig_username for Instagram
          const igUsername = subscriberData?.data?.ig_username;
          const fullName = subscriberData?.data?.name || 
            `${subscriberData?.data?.first_name || ''} ${subscriberData?.data?.last_name || ''}`.trim();
          
          const newName = igUsername || fullName || null;
          
          // Check if name is valid (not a placeholder or template variable)
          const isValidName = newName && 
            !newName.includes('{{') && 
            !newName.toLowerCase().includes('instagram user') &&
            !/^ig\s*\d+$/i.test(newName);

          if (isValidName && newName !== conv.contact_name) {
            // Update conversation with the new name
            const { error: updateError } = await supabase
              .from('whatsapp_conversations')
              .update({ contact_name: newName })
              .eq('id', convId)
              .eq('user_id', authenticatedUserId);

            if (updateError) {
              console.error('Error updating name:', updateError);
            } else {
              console.log(`Updated contact name from "${conv.contact_name}" to "${newName}"`);
            }

            return new Response(
              JSON.stringify({ 
                success: true, 
                subscriberId: existingSubscriberId,
                subscriberData: {
                  id: existingSubscriberId,
                  name: newName,
                  ig_username: igUsername,
                },
                updated: true,
                newName,
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              subscriberId: existingSubscriberId,
              subscriberData: {
                id: existingSubscriberId,
                name: fullName,
                ig_username: igUsername,
              },
              updated: false,
              message: 'Não foi possível encontrar um nome melhor'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Check if we have a manychat_subscriber_id - that's the ONLY valid ID for ManyChat API
      const subscriberId = conv.manychat_subscriber_id;
      
      if (subscriberId) {
        console.log('Found existing manychat_subscriber_id:', subscriberId);
        
        // Fetch subscriber info from ManyChat
        const subscriberResponse = await fetch(
          `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${subscriberId}`,
          {
            headers: {
              'Authorization': `Bearer ${manychatApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (subscriberResponse.ok) {
          const subscriberData = await subscriberResponse.json();
          console.log('ManyChat subscriber data:', JSON.stringify(subscriberData, null, 2));

          const igUsername = subscriberData?.data?.ig_username;
          const fullName = subscriberData?.data?.name || 
            `${subscriberData?.data?.first_name || ''} ${subscriberData?.data?.last_name || ''}`.trim();
          
          const newName = igUsername || fullName || null;
          
          // Check if name is valid
          const isValidName = newName && 
            !newName.includes('{{') && 
            !newName.toLowerCase().includes('instagram user') &&
            !/^ig\s*\d+$/i.test(newName);

          if (isValidName && newName !== conv.contact_name) {
            await supabase
              .from('whatsapp_conversations')
              .update({ contact_name: newName })
              .eq('id', convId)
              .eq('user_id', authenticatedUserId);
            
            console.log(`Updated contact name from "${conv.contact_name}" to "${newName}"`);
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              subscriberId,
              subscriberData: {
                id: subscriberId,
                name: newName || fullName,
                ig_username: igUsername,
              },
              updated: isValidName && newName !== conv.contact_name,
              newName: isValidName ? newName : conv.contact_name,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.log('ManyChat API error:', subscriberResponse.status);
        }
      }
      
      // No manychat_subscriber_id - cannot auto-lookup
      console.log('No manychat_subscriber_id found - cannot auto-lookup');
      
      return new Response(
        JSON.stringify({ 
          error: 'Vinculação automática não disponível', 
          message: 'Esta conversa foi criada antes da integração com ManyChat.\n\nPara vincular automaticamente:\n1. Peça para o contato enviar uma nova mensagem no Instagram\n2. A mensagem será recebida via ManyChat e vinculará automaticamente\n\nOu vincule manualmente:\n1. Abra o ManyChat > Contacts\n2. Encontre o contato pelo username\n3. Copie o ID numérico do subscriber\n4. Cole no campo acima',
          limitation: true,
          requiresNewMessage: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback for missing conversation
    return new Response(
      JSON.stringify({ 
        error: 'Conversa não encontrada', 
        message: 'Não foi possível encontrar a conversa',
        limitation: true
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
