import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const manychatApiKey = Deno.env.get('MANYCHAT_API_KEY');
    
    if (!manychatApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'MANYCHAT_API_KEY not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'sync_all';
    const leadId = body.lead_id;

    console.log('Sync action:', action, 'Lead ID:', leadId);

    if (action === 'sync_single' && leadId) {
      // Sync a single lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError || !lead) {
        return new Response(
          JSON.stringify({ success: false, error: 'Lead not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      const result = await syncLeadToManyChat(lead, manychatApiKey);
      
      return new Response(
        JSON.stringify({ success: true, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'import_from_manychat') {
      // Import subscribers from ManyChat as leads
      const result = await importFromManyChat(supabase, manychatApiKey, body.user_id);
      
      return new Response(
        JSON.stringify({ success: true, ...result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_tags') {
      // Get all tags from ManyChat
      const tagsResponse = await fetch('https://api.manychat.com/fb/page/getTags', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${manychatApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const tagsData = await tagsResponse.json();
      
      return new Response(
        JSON.stringify({ success: true, tags: tagsData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default: sync all leads with phone numbers
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .not('phone', 'is', null);

    if (leadsError) {
      throw leadsError;
    }

    console.log(`Found ${leads?.length || 0} leads with phone numbers`);

    const results: { lead_id: string; error?: string; synced?: boolean; subscriber_id?: string; tags_added?: string[]; reason?: string }[] = [];
    for (const lead of leads || []) {
      try {
        const result = await syncLeadToManyChat(lead, manychatApiKey);
        results.push({ lead_id: lead.id, ...result });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ lead_id: lead.id, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function syncLeadToManyChat(lead: any, apiKey: string) {
  const phone = lead.phone?.replace(/\D/g, '');
  
  if (!phone) {
    return { synced: false, reason: 'No phone number' };
  }

  console.log(`Syncing lead ${lead.id} with phone ${phone}`);

  // Try to find subscriber by phone
  const findResponse = await fetch('https://api.manychat.com/fb/subscriber/findBySystemField', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      field_name: 'whatsapp_phone',
      field_value: phone,
    }),
  });

  const findData = await findResponse.json();
  console.log('Find subscriber response:', findData.status);

  if (findData.status !== 'success' || !findData.data?.id) {
    return { synced: false, reason: 'Subscriber not found in ManyChat' };
  }

  const subscriberId = findData.data.id;
  console.log('Found subscriber:', subscriberId);

  // Map lead status to tag
  const statusTagMap: Record<string, string> = {
    'novo': 'crm_novo',
    'em_contato': 'crm_em_contato',
    'qualificado': 'crm_qualificado',
    'proposta_enviada': 'crm_proposta',
    'negociacao': 'crm_negociacao',
    'fechado_ganho': 'crm_cliente',
    'fechado_perdido': 'crm_perdido',
  };

  // Map product to tag
  const productTagMap: Record<string, string> = {
    'consultoria': 'interesse_consultoria',
    'mentoria_coletiva': 'interesse_mentoria_coletiva',
    'mentoria_individual': 'interesse_mentoria_individual',
    'curso_idea': 'interesse_curso_idea',
    'guia_ia': 'interesse_guia_ia',
    'codigo_prompts': 'interesse_codigo_prompts',
    'combo_ebooks': 'interesse_combo_ebooks',
  };

  const tagsToAdd = [];
  
  if (statusTagMap[lead.status]) {
    tagsToAdd.push(statusTagMap[lead.status]);
  }
  
  if (productTagMap[lead.product]) {
    tagsToAdd.push(productTagMap[lead.product]);
  }

  // Add tags
  for (const tagName of tagsToAdd) {
    try {
      await fetch('https://api.manychat.com/fb/subscriber/addTagByName', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriber_id: subscriberId,
          tag_name: tagName,
        }),
      });
      console.log(`Added tag ${tagName} to subscriber ${subscriberId}`);
    } catch (error) {
      console.error(`Failed to add tag ${tagName}:`, error);
    }
  }

  // Set custom fields
  const customFields = [
    { field_name: 'lead_name', field_value: lead.name },
    { field_name: 'lead_email', field_value: lead.email || '' },
    { field_name: 'lead_status', field_value: lead.status },
    { field_name: 'lead_product', field_value: lead.product },
    { field_name: 'lead_source', field_value: lead.source || 'CRM' },
  ];

  for (const field of customFields) {
    try {
      await fetch('https://api.manychat.com/fb/subscriber/setCustomField', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriber_id: subscriberId,
          field_name: field.field_name,
          field_value: field.field_value,
        }),
      });
    } catch (error) {
      console.error(`Failed to set field ${field.field_name}:`, error);
    }
  }

  return { 
    synced: true, 
    subscriber_id: subscriberId,
    tags_added: tagsToAdd,
  };
}

async function importFromManyChat(supabase: any, apiKey: string, userId: string) {
  if (!userId) {
    throw new Error('user_id is required for import');
  }

  // Get subscribers with specific tags (e.g., interested in products)
  // This is a simplified version - ManyChat doesn't have a "get all subscribers" endpoint
  // You would need to use tags to filter subscribers
  
  console.log('Importing subscribers from ManyChat...');
  
  // Get all tags first to find relevant ones
  const tagsResponse = await fetch('https://api.manychat.com/fb/page/getTags', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  const tagsData = await tagsResponse.json();
  
  if (tagsData.status !== 'success') {
    throw new Error('Failed to get tags from ManyChat');
  }

  const tags = tagsData.data || [];
  console.log(`Found ${tags.length} tags in ManyChat`);

  // Look for tags that indicate interest
  const interestTags = tags.filter((t: any) => 
    t.name.toLowerCase().includes('interesse') ||
    t.name.toLowerCase().includes('lead') ||
    t.name.toLowerCase().includes('consultoria') ||
    t.name.toLowerCase().includes('mentoria')
  );

  console.log(`Found ${interestTags.length} interest-related tags`);

  return {
    message: 'ManyChat import requires using specific tag-based flows',
    tags_found: tags.length,
    interest_tags: interestTags.map((t: any) => t.name),
    suggestion: 'Configure a ManyChat flow to send subscriber data to the CRM webhook when they show interest',
  };
}
