import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-manychat-signature',
};

interface ManyChatWebhookPayload {
  // Subscriber info
  id?: string;
  key?: string;
  page_id?: string;
  status?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  gender?: string;
  profile_pic?: string;
  locale?: string;
  language?: string;
  timezone?: string;
  live_chat_url?: string;
  last_input_text?: string;
  subscribed?: string;
  last_interaction?: string;
  last_seen?: string;
  is_followup_enabled?: boolean;
  ig_username?: string;
  ig_id?: string;
  whatsapp_phone?: string;
  optin_phone?: string;
  phone?: string;
  optin_email?: string;
  email?: string;
  // Custom fields
  custom_fields?: Record<string, string | number | boolean>;
  // Tags
  tags?: Array<{ id: string; name: string }>;
  // Trigger info
  trigger_keyword?: string;
  comment_text?: string;
  post_id?: string;
}

// Map ManyChat tags/keywords to CRM products
function mapTagToProduct(tags: Array<{ name: string }> | undefined, keyword?: string): string {
  const allText = [
    ...(tags?.map(t => t.name.toLowerCase()) || []),
    keyword?.toLowerCase() || ''
  ].join(' ');
  
  if (allText.includes('consultoria')) return 'consultoria';
  if (allText.includes('mentoria coletiva') || allText.includes('coletiva')) return 'mentoria_coletiva';
  if (allText.includes('mentoria individual') || allText.includes('individual')) return 'mentoria_individual';
  if (allText.includes('idea') || allText.includes('curso')) return 'curso_idea';
  if (allText.includes('guia') || allText.includes('ia para advogados')) return 'guia_ia';
  if (allText.includes('prompt') || allText.includes('código')) return 'codigo_prompts';
  if (allText.includes('combo') || allText.includes('ebook')) return 'combo_ebooks';
  
  return 'guia_ia'; // Default
}

// Normalize product name to valid enum value
function normalizeProductType(product: string | undefined): string {
  if (!product) return 'guia_ia';
  
  const normalized = product.toLowerCase().trim()
    .replace(/\s+/g, '_')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove accents
  
  const validProducts = ['consultoria', 'mentoria_coletiva', 'mentoria_individual', 'curso_idea', 'guia_ia', 'codigo_prompts', 'combo_ebooks'];
  
  // Direct match
  if (validProducts.includes(normalized)) return normalized;
  
  // Partial match
  if (normalized.includes('consultoria')) return 'consultoria';
  if (normalized.includes('coletiva')) return 'mentoria_coletiva';
  if (normalized.includes('individual')) return 'mentoria_individual';
  if (normalized.includes('idea') || normalized.includes('curso')) return 'curso_idea';
  if (normalized.includes('guia') || normalized.includes('ia')) return 'guia_ia';
  if (normalized.includes('prompt') || normalized.includes('codigo')) return 'codigo_prompts';
  if (normalized.includes('combo') || normalized.includes('ebook')) return 'combo_ebooks';
  
  return 'guia_ia';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received ManyChat webhook');

    const payload: ManyChatWebhookPayload = await req.json();
    console.log('Payload:', JSON.stringify(payload, null, 2));

  // Get subscriber info - support both ManyChat format and direct JSON
  const subscriberId = (payload as Record<string, unknown>).subscriber_id as string | undefined;
  const name = payload.name || `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || 'Lead Instagram';
  const email = payload.email || payload.optin_email || (subscriberId ? `manychat_${subscriberId}@lead.local` : `instagram_${payload.ig_id || payload.id || Date.now()}@lead.local`);
  const phone = payload.whatsapp_phone || payload.optin_phone || payload.phone || null;
  const igUsername = payload.ig_username || null;
  const directProduct = (payload as Record<string, unknown>).product as string | undefined;
  const directSource = (payload as Record<string, unknown>).source as string | undefined;

  console.log('Subscriber:', { name, email, phone, igUsername, subscriberId, directProduct, directSource });

  // Accept request if we have at least name or email (for direct flow calls)
  if (!payload.id && !payload.ig_id && !subscriberId && !name && !email) {
    console.log('No subscriber info in payload');
    return new Response(
      JSON.stringify({ success: false, error: 'No subscriber info provided' }),
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

    // Check if lead already exists
    const { data: existingLead } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .or(`email.eq.${email},phone.eq.${phone}`)
      .maybeSingle();

    const productType = normalizeProductType(directProduct) || mapTagToProduct(payload.tags, payload.trigger_keyword);
    const source = directSource || (igUsername ? `Instagram (@${igUsername})` : 'ManyChat');

    let leadId: string;
    let leadAction: 'created' | 'updated';

    if (existingLead) {
      console.log('Updating existing lead:', existingLead.id);
      
      const notes = [
        existingLead.notes || '',
        `\n[ManyChat ${new Date().toISOString()}]`,
        payload.trigger_keyword ? `Keyword: ${payload.trigger_keyword}` : '',
        payload.comment_text ? `Comentário: "${payload.comment_text}"` : '',
        payload.tags?.length ? `Tags: ${payload.tags.map(t => t.name).join(', ')}` : '',
      ].filter(Boolean).join(' ').trim();

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id);

      if (updateError) throw updateError;

      leadId = existingLead.id;
      leadAction = 'updated';
    } else {
      console.log('Creating new lead from ManyChat');
      
      const notes = [
        `[ManyChat ${new Date().toISOString()}]`,
        igUsername ? `Instagram: @${igUsername}` : '',
        payload.trigger_keyword ? `Keyword: ${payload.trigger_keyword}` : '',
        payload.comment_text ? `Comentário: "${payload.comment_text}"` : '',
        payload.tags?.length ? `Tags: ${payload.tags.map(t => t.name).join(', ')}` : '',
      ].filter(Boolean).join(' ').trim();

      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({
          user_id: userId,
          name,
          email,
          phone,
          status: 'novo',
          product: productType,
          source,
          notes,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      leadId = newLead.id;
      leadAction = 'created';
    }

    // Add interaction
    const interactionDescription = [
      'Lead capturado via ManyChat/Instagram.',
      payload.trigger_keyword ? `Keyword: ${payload.trigger_keyword}` : '',
      payload.comment_text ? `Comentário: "${payload.comment_text}"` : '',
    ].filter(Boolean).join(' ');

    await supabase
      .from('interactions')
      .insert({
        lead_id: leadId,
        type: 'outro',
        description: interactionDescription,
        date: new Date().toISOString(),
      });

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        lead_id: leadId,
        title: 'Novo lead do Instagram! 📸',
        message: `${name} interagiu${payload.trigger_keyword ? ` com "${payload.trigger_keyword}"` : ''} no Instagram.`,
        type: 'instagram_lead',
      });

    // Try to find and update matching Instagram conversation with ManyChat subscriber_id
    const manychatSubscriberId = subscriberId || payload.id;
    if (manychatSubscriberId && (igUsername || name)) {
      console.log('Trying to link ManyChat subscriber to conversation:', { manychatSubscriberId, igUsername, name });
      
      // Try to find conversation by contact name (Instagram username or name)
      const { data: conversations } = await supabase
        .from('whatsapp_conversations')
        .select('id, contact_name, contact_phone')
        .eq('user_id', userId)
        .eq('channel', 'instagram')
        .is('manychat_subscriber_id', null);
      
      if (conversations && conversations.length > 0) {
        // Try to match by name or username
        const matchingConv = conversations.find(conv => {
          const convName = (conv.contact_name || '').toLowerCase();
          const searchName = name.toLowerCase();
          const searchUsername = igUsername?.toLowerCase() || '';
          return convName.includes(searchName) || 
                 convName.includes(searchUsername) || 
                 searchName.includes(convName.split(' ')[0]);
        });
        
        if (matchingConv) {
          console.log('Found matching conversation:', matchingConv.id);
          await supabase
            .from('whatsapp_conversations')
            .update({ manychat_subscriber_id: manychatSubscriberId })
            .eq('id', matchingConv.id);
        }
      }
    }

    console.log(`Lead ${leadAction}:`, leadId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        lead_id: leadId,
        action: leadAction,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
