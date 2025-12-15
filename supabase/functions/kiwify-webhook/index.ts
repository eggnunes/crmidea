import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kiwify-webhook-token',
};

interface KiwifyWebhookPayload {
  order_id: string;
  order_ref: string;
  order_status: string;
  product_id: string;
  product_name: string;
  Customer: {
    full_name: string;
    email: string;
    mobile?: string;
    CPF?: string;
  };
  created_at: string;
  updated_at: string;
  approved_date?: string;
  refunded_at?: string;
  Commissions?: {
    charge_amount: number;
    product_base_price: number;
  };
  Subscription?: {
    id: string;
    status: string;
  };
  webhook_event_type: string;
}

// Map Kiwify product names to CRM product types
function mapProductName(productName: string): string {
  const lowerName = productName.toLowerCase();
  
  if (lowerName.includes('consultoria')) return 'consultoria';
  if (lowerName.includes('mentoria coletiva') || lowerName.includes('mentoria_coletiva')) return 'mentoria_coletiva';
  if (lowerName.includes('mentoria individual') || lowerName.includes('mentoria_individual')) return 'mentoria_individual';
  if (lowerName.includes('idea') || lowerName.includes('curso')) return 'curso_idea';
  if (lowerName.includes('guia') || lowerName.includes('ia para advogados')) return 'guia_ia';
  if (lowerName.includes('prompt') || lowerName.includes('código')) return 'codigo_prompts';
  if (lowerName.includes('combo') || lowerName.includes('ebook')) return 'combo_ebooks';
  
  // Default to guia_ia if no match
  return 'guia_ia';
}

// Map Kiwify events to lead statuses
function mapEventToStatus(eventType: string): string {
  switch (eventType) {
    case 'pix_gerado':
    case 'boleto_gerado':
      return 'qualificado'; // They showed intent to buy
    case 'carrinho_abandonado':
      return 'em_contato';
    case 'compra_aprovada':
      return 'fechado_ganho';
    case 'compra_recusada':
      return 'negociacao';
    case 'compra_reembolsada':
    case 'chargeback':
      return 'fechado_perdido';
    case 'subscription_renewed':
      return 'fechado_ganho';
    case 'subscription_canceled':
    case 'subscription_late':
      return 'fechado_perdido';
    default:
      return 'novo';
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookToken = req.headers.get('x-kiwify-webhook-token');
    console.log('Received Kiwify webhook. Token present:', !!webhookToken);

    const payload: KiwifyWebhookPayload = await req.json();
    console.log('Webhook event type:', payload.webhook_event_type);
    console.log('Customer:', payload.Customer?.full_name, payload.Customer?.email);
    console.log('Product:', payload.product_name);

    if (!payload.Customer?.email) {
      console.log('No customer email in payload');
      return new Response(
        JSON.stringify({ success: false, error: 'No customer email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the admin user (owner of the CRM) to associate leads
    // We'll get the first admin user from user_roles
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
    console.log('Using admin user_id:', userId);

    // Check if lead already exists by email
    const { data: existingLead, error: findError } = await supabase
      .from('leads')
      .select('*')
      .eq('email', payload.Customer.email)
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) {
      console.error('Error finding lead:', findError);
    }

    const newStatus = mapEventToStatus(payload.webhook_event_type);
    const productType = mapProductName(payload.product_name);
    const value = payload.Commissions?.charge_amount || payload.Commissions?.product_base_price || null;

    let leadId: string;
    let leadAction: 'created' | 'updated';

    if (existingLead) {
      // Update existing lead
      console.log('Updating existing lead:', existingLead.id);
      
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          status: newStatus,
          product: productType,
          value: value,
          notes: `${existingLead.notes || ''}\n\n[Kiwify ${new Date().toISOString()}] ${payload.webhook_event_type}: ${payload.product_name}`.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id);

      if (updateError) {
        console.error('Error updating lead:', updateError);
        throw updateError;
      }

      leadId = existingLead.id;
      leadAction = 'updated';
    } else {
      // Create new lead
      console.log('Creating new lead for:', payload.Customer.email);
      
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({
          user_id: userId,
          name: payload.Customer.full_name,
          email: payload.Customer.email,
          phone: payload.Customer.mobile || null,
          status: newStatus,
          product: productType,
          value: value,
          source: 'Kiwify',
          notes: `[Kiwify ${new Date().toISOString()}] ${payload.webhook_event_type}: ${payload.product_name}`,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating lead:', insertError);
        throw insertError;
      }

      leadId = newLead.id;
      leadAction = 'created';
    }

    // Add interaction for this event
    const interactionType = payload.webhook_event_type === 'compra_aprovada' ? 'venda' : 
                           payload.webhook_event_type.includes('pix') || payload.webhook_event_type.includes('boleto') ? 'pagamento' :
                           'outro';
    
    const interactionDescription = `Evento Kiwify: ${payload.webhook_event_type} - Produto: ${payload.product_name}${value ? ` - Valor: R$ ${(value / 100).toFixed(2)}` : ''}`;

    const { error: interactionError } = await supabase
      .from('interactions')
      .insert({
        lead_id: leadId,
        type: interactionType,
        description: interactionDescription,
        date: new Date().toISOString(),
      });

    if (interactionError) {
      console.error('Error creating interaction:', interactionError);
    }

    // If it's a pix_gerado or carrinho_abandonado, create a notification for follow-up
    if (['pix_gerado', 'boleto_gerado', 'carrinho_abandonado'].includes(payload.webhook_event_type)) {
      const title = payload.webhook_event_type === 'carrinho_abandonado' 
        ? 'Carrinho abandonado!' 
        : 'PIX/Boleto gerado!';
      
      const message = payload.webhook_event_type === 'carrinho_abandonado'
        ? `${payload.Customer.full_name} abandonou o carrinho para ${payload.product_name}. Faça follow-up!`
        : `${payload.Customer.full_name} gerou pagamento para ${payload.product_name}. Acompanhe se concluir!`;

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          lead_id: leadId,
          title: title,
          message: message,
          type: 'kiwify_event',
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      }

      // For abandoned carts, schedule WhatsApp recovery message (within 30 minutes)
      if (payload.webhook_event_type === 'carrinho_abandonado' && payload.Customer.mobile) {
        console.log('Triggering abandoned cart WhatsApp alert for:', payload.Customer.full_name);
        
        // Call abandoned cart alert function immediately (will be sent via ManyChat Flow)
        try {
          const alertResponse = await fetch(`${supabaseUrl}/functions/v1/abandoned-cart-alert`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              leadId: leadId,
              leadName: payload.Customer.full_name,
              productName: payload.product_name,
              phone: payload.Customer.mobile,
            }),
          });
          
          const alertResult = await alertResponse.json();
          console.log('Abandoned cart alert result:', alertResult);
        } catch (alertError) {
          console.error('Error sending abandoned cart alert:', alertError);
        }
      }
    }

    // Trigger ManyChat sync if applicable
    try {
      const manychatApiKey = Deno.env.get('MANYCHAT_API_KEY');
      if (manychatApiKey && payload.Customer.mobile) {
        // Try to find subscriber by phone and update tags
        const phone = payload.Customer.mobile.replace(/\D/g, '');
        
        const findResponse = await fetch(`https://api.manychat.com/fb/subscriber/findBySystemField`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${manychatApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            field_name: 'whatsapp_phone',
            field_value: phone,
          }),
        });

        const findData = await findResponse.json();
        console.log('ManyChat find subscriber response:', findData);

        if (findData.status === 'success' && findData.data?.id) {
          const subscriberId = findData.data.id;
          
          // Add tag based on event
          const tagName = `kiwify_${payload.webhook_event_type}`;
          await fetch(`https://api.manychat.com/fb/subscriber/addTagByName`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${manychatApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subscriber_id: subscriberId,
              tag_name: tagName,
            }),
          });
          console.log(`Added tag ${tagName} to ManyChat subscriber ${subscriberId}`);
        }
      }
    } catch (manychatError) {
      console.error('ManyChat sync error (non-blocking):', manychatError);
    }

    console.log(`Lead ${leadAction} successfully:`, leadId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        lead_id: leadId, 
        action: leadAction,
        status: newStatus,
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
