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
    console.log('Starting Instagram names update from ManyChat API');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const manychatApiKey = Deno.env.get('MANYCHAT_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!manychatApiKey) {
      throw new Error('MANYCHAT_API_KEY not configured');
    }

    // Get all Instagram conversations with placeholder names (IG XXXXXX format)
    const { data: conversations, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('channel', 'instagram');

    if (convError) throw convError;

    console.log(`Found ${conversations?.length || 0} Instagram conversations to check`);

    const results: { id: string; oldName: string | null; newName: string | null; status: string }[] = [];

    for (const conv of conversations || []) {
      // Check if name is a placeholder (IG XXXXXX format or null)
      const isPlaceholder = !conv.contact_name || 
        /^IG\s*\d*$/i.test(conv.contact_name.trim()) ||
        conv.contact_name === 'Instagram User';

      if (!isPlaceholder) {
        console.log(`Skipping ${conv.id} - already has good name: ${conv.contact_name}`);
        results.push({ id: conv.id, oldName: conv.contact_name, newName: conv.contact_name, status: 'skipped' });
        continue;
      }

      // Try to get subscriber_id from various sources
      let subscriberId = conv.manychat_subscriber_id;
      
      // If not in manychat_subscriber_id, try to extract from contact_phone
      if (!subscriberId) {
        // contact_phone could be: "2913251505525012" or "ig_1919197228" or "590561846900755"
        const phoneValue = conv.contact_phone || '';
        
        // If it's in ig_ format, extract the number after ig_
        if (phoneValue.startsWith('ig_')) {
          subscriberId = phoneValue.replace('ig_', '');
        } else if (/^\d+$/.test(phoneValue)) {
          // If it's purely numeric, it might be a subscriber_id
          subscriberId = phoneValue;
        }
        
        // Also check channel_user_id
        if (!subscriberId && conv.channel_user_id && /^\d+$/.test(conv.channel_user_id)) {
          subscriberId = conv.channel_user_id;
        }
      }

      if (!subscriberId || subscriberId === 'ID do contato') {
        console.log(`No valid subscriber_id found for ${conv.id}`);
        results.push({ id: conv.id, oldName: conv.contact_name, newName: null, status: 'no_subscriber_id' });
        continue;
      }

      console.log(`Fetching ManyChat info for subscriber ${subscriberId}`);

      try {
        // Fetch subscriber info from ManyChat
        const response = await fetch(
          `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${subscriberId}`,
          {
            headers: {
              'Authorization': `Bearer ${manychatApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          console.log(`ManyChat API error for ${subscriberId}: ${response.status}`);
          results.push({ id: conv.id, oldName: conv.contact_name, newName: null, status: `api_error_${response.status}` });
          continue;
        }

        const data = await response.json();
        console.log(`ManyChat response for ${subscriberId}:`, JSON.stringify(data, null, 2));

        // Extract name from ManyChat response
        // ManyChat returns different fields for Instagram: ig_username, name, first_name, last_name
        const igUsername = data?.data?.ig_username;
        const fullName = data?.data?.name || `${data?.data?.first_name || ''} ${data?.data?.last_name || ''}`.trim();
        
        // Prefer ig_username for Instagram, fallback to name
        let newName = igUsername || fullName || null;

        // Validate the name is not a placeholder
        if (newName && (
          newName.includes('{{') || 
          newName.toLowerCase().includes('instagram user') ||
          /^ig\s*\d+$/i.test(newName)
        )) {
          newName = null;
        }

        if (newName && newName !== conv.contact_name) {
          console.log(`Updating ${conv.id} from "${conv.contact_name}" to "${newName}"`);
          
          // Update conversation
          const updateData: Record<string, unknown> = { contact_name: newName };
          
          // Also update manychat_subscriber_id if not set
          if (!conv.manychat_subscriber_id) {
            updateData.manychat_subscriber_id = subscriberId;
          }
          
          await supabase
            .from('whatsapp_conversations')
            .update(updateData)
            .eq('id', conv.id);

          results.push({ id: conv.id, oldName: conv.contact_name, newName, status: 'updated' });
        } else {
          results.push({ id: conv.id, oldName: conv.contact_name, newName, status: 'no_better_name_found' });
        }

      } catch (fetchError) {
        console.error(`Error fetching ManyChat data for ${subscriberId}:`, fetchError);
        results.push({ id: conv.id, oldName: conv.contact_name, newName: null, status: 'fetch_error' });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const updatedCount = results.filter(r => r.status === 'updated').length;
    console.log(`Update complete: ${updatedCount} conversations updated`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: results.length,
        updated: updatedCount,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error updating Instagram names:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
