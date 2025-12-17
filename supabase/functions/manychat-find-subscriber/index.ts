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
    const { conversationId, instagramUserId, fetchNameOnly } = await req.json();
    console.log('ManyChat find subscriber request:', { conversationId, instagramUserId, fetchNameOnly });

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
    let conversation: Record<string, unknown> | null = null;

    // If conversationId provided, get the conversation details
    if (conversationId) {
      const { data: conv, error: convError } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError || !conv) {
        console.error('Conversation not found:', convError);
        return new Response(
          JSON.stringify({ error: 'Conversation not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
              .eq('id', convId);

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

      // Try to extract subscriber ID from various sources
      igUserId = conv.channel_user_id;
      
      // If no channel_user_id, try to extract from contact_phone
      if (!igUserId) {
        const contactPhone = conv.contact_phone as string;
        
        // contact_phone could be: "2913251505525012" or "ig_1919197228" or "590561846900755"
        if (contactPhone?.startsWith('ig_')) {
          igUserId = contactPhone.replace('ig_', '');
        } else if (contactPhone && /^\d{10,}$/.test(contactPhone)) {
          // If it's purely numeric with 10+ digits, could be a subscriber_id
          igUserId = contactPhone;
        }
      }
    }

    // If we have a potential subscriber ID, try to fetch info directly
    if (igUserId && /^\d+$/.test(igUserId)) {
      console.log('Trying to fetch subscriber info directly for ID:', igUserId);
      
      const subscriberResponse = await fetch(
        `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${igUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${manychatApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (subscriberResponse.ok) {
        const subscriberData = await subscriberResponse.json();
        console.log('Direct subscriber lookup result:', JSON.stringify(subscriberData, null, 2));

        if (subscriberData?.data?.id) {
          const subscriberId = subscriberData.data.id.toString();
          const igUsername = subscriberData?.data?.ig_username;
          const fullName = subscriberData?.data?.name || 
            `${subscriberData?.data?.first_name || ''} ${subscriberData?.data?.last_name || ''}`.trim();
          
          const newName = igUsername || fullName || null;

          // Update the conversation
          if (convId && newName) {
            const updateData: Record<string, unknown> = { manychat_subscriber_id: subscriberId };
            
            // Check if name should be updated
            const currentName = conversation?.contact_name as string | null;
            const currentIsPlaceholder = !currentName || 
              /^ig\s*\d*$/i.test(currentName.trim()) ||
              currentName.toLowerCase().includes('instagram user');
            
            if (currentIsPlaceholder && !newName.includes('{{') && !/^ig\s*\d+$/i.test(newName)) {
              updateData.contact_name = newName;
            }

            const { error: updateError } = await supabase
              .from('whatsapp_conversations')
              .update(updateData)
              .eq('id', convId);

            if (updateError) {
              console.error('Error updating conversation:', updateError);
            } else {
              console.log('Updated conversation with subscriber ID and name:', subscriberId, newName);
            }
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
              updated: true,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.log('Direct subscriber lookup failed:', subscriberResponse.status);
      }
    }

    // Fallback: explain the limitation
    console.log('Could not find subscriber, ManyChat API limitation');
    
    return new Response(
      JSON.stringify({ 
        error: 'Busca automática não disponível', 
        message: 'Não foi possível encontrar o subscriber automaticamente. Para vincular o contato:\n\n1. Abra o ManyChat\n2. Vá em Contacts e encontre o contato pelo nome\n3. Copie o ID numérico do subscriber\n4. Cole no campo acima',
        limitation: true
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
