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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received ManyChat webhook');

    const payload: ManyChatWebhookPayload = await req.json();
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Get subscriber info
    const name = payload.name || `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || 'Lead Instagram';
    const email = payload.email || payload.optin_email || `instagram_${payload.ig_id || payload.id}@lead.local`;
    const phone = payload.whatsapp_phone || payload.optin_phone || payload.phone || null;
    const igUsername = payload.ig_username || null;

    console.log('Subscriber:', { name, email, phone, igUsername });

    if (!payload.id && !payload.ig_id) {
      console.log('No subscriber ID in payload');
      return new Response(
        JSON.stringify({ success: false, error: 'No subscriber ID' }),
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

    const productType = mapTagToProduct(payload.tags, payload.trigger_keyword);
    const source = igUsername ? `Instagram (@${igUsername})` : 'ManyChat';

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
