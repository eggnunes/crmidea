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
    const contactName = name?.trim() || ig_username || 'Instagram User';
    const contactPhone = `ig_${subscriber_id}`;

    // Find or create conversation
    // First, try to find by manychat_subscriber_id
    let { data: conversation } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('manychat_subscriber_id', subscriber_id)
      .maybeSingle();

    if (!conversation) {
      // Try to find existing Instagram conversation without manychat_subscriber_id
      // This handles cases where conversation was created via Meta API
      const { data: existingInstagramConvs } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('channel', 'instagram')
        .is('manychat_subscriber_id', null)
        .order('last_message_at', { ascending: false });

      // Try to match by ig_username in contact_name or by recent activity
      let matchedConv = null;
      if (existingInstagramConvs && existingInstagramConvs.length > 0) {
        // First try to match by username
        if (ig_username) {
          matchedConv = existingInstagramConvs.find(c => 
            c.contact_name?.toLowerCase().includes(ig_username.toLowerCase()) ||
            c.contact_phone?.includes(ig_username)
          );
        }
        // If no match by username, try by name
        if (!matchedConv && name) {
          matchedConv = existingInstagramConvs.find(c => 
            c.contact_name?.toLowerCase().includes(name.toLowerCase())
          );
        }
        // If still no match, use the most recent one (best effort)
        if (!matchedConv && existingInstagramConvs.length === 1) {
          matchedConv = existingInstagramConvs[0];
        }
      }

      if (matchedConv) {
        // Update with manychat_subscriber_id
        console.log('Found existing Instagram conversation, updating with subscriber_id:', matchedConv.id);
        const { data: updatedConv } = await supabase
          .from('whatsapp_conversations')
          .update({ 
            manychat_subscriber_id: subscriber_id,
            contact_name: contactName || matchedConv.contact_name,
            profile_picture_url: profile_pic || matchedConv.profile_picture_url 
          })
          .eq('id', matchedConv.id)
          .select()
          .single();
        conversation = updatedConv;
      } else {
        // Try to find by contact_phone (ig_ prefix format)
        const { data: existingConv } = await supabase
          .from('whatsapp_conversations')
          .select('*')
          .eq('user_id', userId)
          .eq('contact_phone', contactPhone)
          .maybeSingle();

        if (existingConv) {
          // Update with manychat_subscriber_id
          const { data: updatedConv } = await supabase
            .from('whatsapp_conversations')
            .update({ 
              manychat_subscriber_id: subscriber_id,
              contact_name: contactName,
              profile_picture_url: profile_pic || existingConv.profile_picture_url 
            })
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
              manychat_subscriber_id: subscriber_id,
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
