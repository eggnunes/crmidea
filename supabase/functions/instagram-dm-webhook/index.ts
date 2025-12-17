import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstagramDMPayload {
  subscriber_id: string;
  name?: string;
  ig_username?: string;
  message?: string;
  profile_pic?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received Instagram DM webhook from ManyChat');

    const payload: InstagramDMPayload = await req.json();
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const { subscriber_id, name, ig_username, message, profile_pic } = payload;

    if (!subscriber_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'subscriber_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the admin user
    const { data: adminRole, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (adminError || !adminRole) {
      console.error('No admin user found:', adminError);
      return new Response(
        JSON.stringify({ success: false, error: 'No admin user configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const userId = adminRole.user_id;
    
    // Check if values are literal template variables (ManyChat not resolving them)
    const isTemplateVariable = (value?: string) => {
      if (!value) return true;
      return value.includes('{{') || value.includes('}}') || value.trim() === '';
    };
    
    // Check if value is a generic placeholder
    const isGenericPlaceholder = (value?: string) => {
      if (!value) return true;
      const lower = value.toLowerCase().trim();
      return lower.includes('instagram user') || 
             lower.includes('usuário instagram') ||
             lower === 'user' ||
             lower === 'instagram' ||
             /^ig\s*\d+$/i.test(lower); // Matches "IG 123456" format
    };
    
    // Use ig_username as primary identifier, but only if it's not a template variable
    const resolvedUsername = !isTemplateVariable(ig_username) && !isGenericPlaceholder(ig_username) 
      ? ig_username?.trim() 
      : null;
    const resolvedName = !isTemplateVariable(name) && !isGenericPlaceholder(name) 
      ? name?.trim() 
      : null;
    
    // Try to fetch subscriber info from ManyChat to get real Instagram username
    let manychatUsername: string | null = null;
    const manychatApiKey = Deno.env.get('MANYCHAT_API_KEY');
    
    if (!resolvedUsername && manychatApiKey && subscriber_id) {
      try {
        console.log('Fetching subscriber info from ManyChat for:', subscriber_id);
        const subscriberResponse = await fetch(
          `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${subscriber_id}`,
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
          
          // ManyChat returns ig_username in subscriber data
          const mcUsername = subscriberData?.data?.ig_username;
          const mcName = subscriberData?.data?.name || subscriberData?.data?.first_name;
          
          if (mcUsername && !isTemplateVariable(mcUsername) && !isGenericPlaceholder(mcUsername)) {
            manychatUsername = mcUsername;
            console.log('Got Instagram username from ManyChat API:', manychatUsername);
          } else if (mcName && !isTemplateVariable(mcName) && !isGenericPlaceholder(mcName)) {
            manychatUsername = mcName;
            console.log('Got name from ManyChat API:', manychatUsername);
          }
        } else {
          console.log('ManyChat API error:', subscriberResponse.status);
        }
      } catch (e) {
        console.error('Error fetching ManyChat subscriber info:', e);
      }
    }
    
    // Build best possible contact name - prioritize actual username over generic fallbacks
    let contactName: string;
    if (resolvedUsername) {
      contactName = resolvedUsername;
    } else if (manychatUsername) {
      contactName = manychatUsername;
    } else if (resolvedName) {
      contactName = resolvedName;
    } else {
      // Last resort: use subscriber_id but make it shorter and cleaner
      const shortId = subscriber_id.slice(-6);
      contactName = `IG ${shortId}`;
    }
    
    const contactPhone = `ig_${subscriber_id}`;
    
    console.log('Processing Instagram DM:', { subscriber_id, name, ig_username, resolvedUsername, resolvedName, manychatUsername, contactName });
    
    // Helper to check if a name is a placeholder (IG XXXXXX format)
    const isPlaceholderName = (n?: string | null) => {
      if (!n) return true;
      return /^IG\s*\d*$/i.test(n.trim()) || /^ig_\d+$/.test(n.trim());
    };
    
    // Helper to determine best name: prefer real name over placeholder
    const getBestName = (newName: string, existingName?: string | null) => {
      const existingIsPlaceholder = isPlaceholderName(existingName);
      const newIsPlaceholder = isPlaceholderName(newName);
      
      // If new name is real, always use it
      if (!newIsPlaceholder) return newName;
      // If existing is real, keep it
      if (!existingIsPlaceholder && existingName) return existingName;
      // Both are placeholders or existing is empty, use new
      return newName;
    };

    // Find or create conversation
    // First, try to find by manychat_subscriber_id
    let { data: conversation } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('manychat_subscriber_id', subscriber_id)
      .maybeSingle();

    // If found by subscriber_id, check if name needs updating
    if (conversation) {
      const bestName = getBestName(contactName, conversation.contact_name);
      if (bestName !== conversation.contact_name) {
        console.log(`Updating existing conversation name from "${conversation.contact_name}" to "${bestName}"`);
        const { data: updatedConv } = await supabase
          .from('whatsapp_conversations')
          .update({ 
            contact_name: bestName,
            profile_picture_url: profile_pic || conversation.profile_picture_url 
          })
          .eq('id', conversation.id)
          .select()
          .single();
        conversation = updatedConv;
      }
    }

    if (!conversation) {
      // Check if this is a valid subscriber_id (not a test/admin ID)
      // Don't update existing conversations if ig_username shows as template variable
      const isTestRequest = ig_username?.includes('{{') || !ig_username;
      
      if (!isTestRequest) {
        // Try to find existing Instagram conversation by ig_username
        const { data: existingByUsername } = await supabase
          .from('whatsapp_conversations')
          .select('*')
          .eq('user_id', userId)
          .eq('channel', 'instagram')
          .ilike('contact_name', `%${ig_username}%`)
          .maybeSingle();
        
        if (existingByUsername) {
          console.log('Found existing Instagram conversation by username, updating:', existingByUsername.id);
          const bestName = getBestName(contactName, existingByUsername.contact_name);
          const { data: updatedConv } = await supabase
            .from('whatsapp_conversations')
            .update({ 
              manychat_subscriber_id: subscriber_id,
              contact_name: bestName,
              profile_picture_url: profile_pic || existingByUsername.profile_picture_url 
            })
            .eq('id', existingByUsername.id)
            .select()
            .single();
          conversation = updatedConv;
        }
      }
      
      // If still no conversation, try by contact_phone (ig_ prefix format)
      if (!conversation) {
        const { data: existingConv } = await supabase
          .from('whatsapp_conversations')
          .select('*')
          .eq('user_id', userId)
          .eq('contact_phone', contactPhone)
          .maybeSingle();

        if (existingConv) {
          // Only update subscriber_id if not a test request
          const bestName = getBestName(contactName, existingConv.contact_name);
          const updateData: Record<string, unknown> = {
            contact_name: bestName,
            profile_picture_url: profile_pic || existingConv.profile_picture_url 
          };
          if (!isTestRequest) {
            updateData.manychat_subscriber_id = subscriber_id;
          }
          
          console.log(`Updating Instagram conversation name from "${existingConv.contact_name}" to "${bestName}"`);
          
          const { data: updatedConv } = await supabase
            .from('whatsapp_conversations')
            .update(updateData)
            .eq('id', existingConv.id)
            .select()
            .single();
          conversation = updatedConv;
        } else {
          // Create new conversation
          const { data: newConv, error: convError } = await supabase
            .from('whatsapp_conversations')
            .insert({
              user_id: userId,
              contact_phone: contactPhone,
              contact_name: contactName,
              channel: 'instagram',
              manychat_subscriber_id: isTestRequest ? null : subscriber_id,
              profile_picture_url: profile_pic || null,
              last_message_at: new Date().toISOString(),
              unread_count: 1,
            })
            .select()
            .single();

          if (convError) throw convError;
          conversation = newConv;
        }
      }
    }

    // If there's a message, save it
    if (message && conversation) {
      // Check for duplicate message
      const { data: existingMsg } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('conversation_id', conversation.id)
        .eq('content', message)
        .eq('is_from_contact', true)
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last 60 seconds
        .maybeSingle();

      if (!existingMsg) {
        await supabase
          .from('whatsapp_messages')
          .insert({
            user_id: userId,
            conversation_id: conversation.id,
            content: message,
            is_from_contact: true,
            is_ai_response: false,
            message_type: 'text',
            status: 'received',
            channel: 'instagram',
          });

        // Update conversation
        await supabase
          .from('whatsapp_conversations')
          .update({
            last_message_at: new Date().toISOString(),
            unread_count: (conversation.unread_count || 0) + 1,
          })
          .eq('id', conversation.id);
      }
    }

    console.log('Instagram DM processed successfully:', { conversationId: conversation?.id, subscriberId: subscriber_id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        conversation_id: conversation?.id,
        subscriber_id: subscriber_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Instagram DM webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
