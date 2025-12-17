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
  const event = eventType.toLowerCase();
  
  switch (event) {
    // Pagamento gerado - demonstrou intenção de compra
    case 'pix_gerado':
    case 'boleto_gerado':
      return 'qualificado';
    
    // Carrinho abandonado
    case 'carrinho_abandonado':
      return 'em_contato';
    
    // Compra aprovada - ganhou!
    case 'compra_aprovada':
      return 'fechado_ganho';
    
    // Compra recusada - ainda em negociação
    case 'compra_recusada':
      return 'negociacao';
    
    // Reembolso e chargeback - perdeu
    case 'reembolso':
    case 'compra_reembolsada':
    case 'chargeback':
      return 'fechado_perdido';
    
    // Assinaturas
    case 'assinatura_renovada':
      return 'fechado_ganho';
    case 'assinatura_cancelada':
    case 'assinatura_atrasada':
      return 'fechado_perdido';
    
    default:
      return 'novo';
  }
}

// Map event to interaction type
function mapEventToInteractionType(eventType: string): string {
  const event = eventType.toLowerCase();
  
  switch (event) {
    case 'compra_aprovada':
    case 'assinatura_renovada':
      return 'venda';
    case 'pix_gerado':
    case 'boleto_gerado':
      return 'pagamento';
    case 'carrinho_abandonado':
      return 'carrinho';
    case 'reembolso':
    case 'compra_reembolsada':
      return 'reembolso';
    case 'chargeback':
      return 'chargeback';
    case 'compra_recusada':
      return 'recusado';
    case 'assinatura_cancelada':
      return 'cancelamento';
    case 'assinatura_atrasada':
      return 'atraso';
    default:
      return 'outro';
  }
}

// Get notification details based on event type
function getNotificationDetails(eventType: string, customerName: string, productName: string): { title: string; message: string } | null {
  const event = eventType.toLowerCase();
  
  switch (event) {
    case 'pix_gerado':
      return {
        title: '💰 PIX Gerado!',
        message: `${customerName} gerou um PIX para ${productName}. Acompanhe se concluir o pagamento!`
      };
    case 'boleto_gerado':
      return {
        title: '📄 Boleto Gerado!',
        message: `${customerName} gerou um boleto para ${productName}. Acompanhe se concluir o pagamento!`
      };
    case 'carrinho_abandonado':
      return {
        title: '🛒 Carrinho Abandonado!',
        message: `${customerName} abandonou o carrinho para ${productName}. Faça follow-up urgente!`
      };
    case 'compra_aprovada':
      return {
        title: '🎉 Venda Realizada!',
        message: `${customerName} comprou ${productName}! Parabéns pela venda!`
      };
    case 'compra_recusada':
      return {
        title: '❌ Compra Recusada',
        message: `Pagamento de ${customerName} foi recusado para ${productName}. Entre em contato!`
      };
    case 'reembolso':
    case 'compra_reembolsada':
      return {
        title: '💸 Reembolso Solicitado',
        message: `${customerName} solicitou reembolso de ${productName}. Verifique o motivo!`
      };
    case 'chargeback':
      return {
        title: '⚠️ Chargeback!',
        message: `${customerName} abriu disputa (chargeback) para ${productName}. Ação urgente necessária!`
      };
    case 'assinatura_cancelada':
      return {
        title: '📛 Assinatura Cancelada',
        message: `${customerName} cancelou a assinatura de ${productName}. Tente recuperar!`
      };
    case 'assinatura_atrasada':
      return {
        title: '⏰ Assinatura Atrasada',
        message: `${customerName} está com pagamento atrasado de ${productName}. Entre em contato!`
      };
    case 'assinatura_renovada':
      return {
        title: '🔄 Assinatura Renovada!',
        message: `${customerName} renovou a assinatura de ${productName}!`
      };
    default:
      return null;
  }
}

// Generate product-specific welcome messages
function getProductWelcomeMessage(firstName: string, productName: string, productType: string, isRenewal: boolean = false): string {
  const transferNote = `\n\n💬 Se precisar falar diretamente comigo, digite *"falar com Rafael"* a qualquer momento.`;
  
  if (isRenewal) {
    return `🔄 *Olá, ${firstName}!*\n\n` +
      `Obrigado por renovar sua assinatura do *${productName}*! 🎉\n\n` +
      `Sua confiança é muito importante para nós. Continue aproveitando todo o conteúdo!\n\n` +
      `_Equipe IDEA_${transferNote}`;
  }
  
  switch (productType) {
    case 'consultoria':
      return `🎯 *Parabéns pela decisão, ${firstName}!*\n\n` +
        `Seja muito bem-vindo(a) à *Consultoria de IA para Escritórios de Advocacia*! 🚀\n\n` +
        `Esta é uma jornada de transformação digital personalizada para seu escritório. Em breve, entrarei em contato para agendar nossa primeira reunião estratégica.\n\n` +
        `Prepare-se para revolucionar a forma como você trabalha! 💼\n\n` +
        `_Rafael Nogueira - IDEA_${transferNote}`;
    
    case 'mentoria_coletiva':
    case 'mentoria_individual':
      const mentoringType = productType === 'mentoria_individual' ? 'Individual' : 'Coletiva';
      return `🌟 *Bem-vindo(a) à Mentoria ${mentoringType}, ${firstName}!*\n\n` +
        `Parabéns pela sua decisão de investir no seu desenvolvimento profissional! 🎓\n\n` +
        `${productType === 'mentoria_individual' 
          ? 'Você terá acompanhamento exclusivo e personalizado para dominar a IA na advocacia.'
          : 'Você faz parte agora de um grupo seleto de advogados que estão na vanguarda da tecnologia.'}\n\n` +
        `Em breve você receberá todos os detalhes de acesso e nosso cronograma.\n\n` +
        `_Equipe IDEA_${transferNote}`;
    
    case 'curso_idea':
      return `🎉 *Parabéns, ${firstName}!*\n\n` +
        `Seja muito bem-vindo(a) ao *Curso IDEA* - 11 módulos e mais de 70 aulas sobre Inteligência Artificial na Advocacia! 📚\n\n` +
        `Você está prestes a descobrir como a IA pode transformar sua prática jurídica. Seu acesso será liberado em instantes!\n\n` +
        `Prepare-se para uma jornada incrível de aprendizado! 🚀\n\n` +
        `_Equipe IDEA_${transferNote}`;
    
    case 'guia_ia':
      return `📖 *Excelente escolha, ${firstName}!*\n\n` +
        `Seja bem-vindo(a) ao *Guia de IA para Advogados*! ⚖️\n\n` +
        `Este e-book vai te dar uma visão completa de como aplicar Inteligência Artificial no seu dia a dia jurídico.\n\n` +
        `Seu acesso será enviado em instantes. Boa leitura! 📱\n\n` +
        `_Equipe IDEA_${transferNote}`;
    
    case 'codigo_prompts':
      return `🔑 *Parabéns pela aquisição, ${firstName}!*\n\n` +
        `Seja bem-vindo(a) ao *Código de Prompts*! 💡\n\n` +
        `Você agora tem acesso a uma biblioteca de prompts prontos e otimizados para advogados. Prepare-se para acelerar seu trabalho com IA!\n\n` +
        `Seu acesso será enviado em instantes.\n\n` +
        `_Equipe IDEA_${transferNote}`;
    
    case 'combo_ebooks':
      return `📚 *Incrível, ${firstName}!*\n\n` +
        `Você adquiriu o *Combo Completo de E-books*! 🎁\n\n` +
        `Guia de IA para Advogados + Código de Prompts + bônus exclusivos. Tudo que você precisa para dominar a IA na advocacia!\n\n` +
        `Seus acessos serão enviados em instantes. Aproveite! 🚀\n\n` +
        `_Equipe IDEA_${transferNote}`;
    
    default:
      return `🎉 *Parabéns pela sua compra, ${firstName}!*\n\n` +
        `Seja muito bem-vindo(a) ao *${productName}*! 🚀\n\n` +
        `Estamos muito felizes em ter você conosco nessa jornada de transformação com Inteligência Artificial na advocacia.\n\n` +
        `Em breve você receberá todas as informações de acesso. Se tiver qualquer dúvida, estou aqui para ajudar! 💬\n\n` +
        `_Equipe IDEA_${transferNote}`;
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
    // Convert from centavos to reais (Kiwify sends values in centavos)
    const valueInCentavos = payload.Commissions?.charge_amount || payload.Commissions?.product_base_price || null;
    const value = valueInCentavos ? valueInCentavos / 100 : null;

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
    const interactionType = mapEventToInteractionType(payload.webhook_event_type);
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

    // Create notification for ALL events
    const notificationDetails = getNotificationDetails(
      payload.webhook_event_type, 
      payload.Customer.full_name, 
      payload.product_name
    );

    if (notificationDetails) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          lead_id: leadId,
          title: notificationDetails.title,
          message: notificationDetails.message,
          type: 'kiwify_event',
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }

    // For abandoned carts, schedule WhatsApp recovery message (within 30 minutes)
    if (payload.webhook_event_type.toLowerCase() === 'carrinho_abandonado' && payload.Customer.mobile) {
      console.log('Triggering abandoned cart WhatsApp alert for:', payload.Customer.full_name);
      
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

    // For successful purchases, send welcome message via WhatsApp
    if ((payload.webhook_event_type.toLowerCase() === 'compra_aprovada' || 
         payload.webhook_event_type.toLowerCase() === 'assinatura_renovada') && payload.Customer.mobile) {
      console.log('Sending welcome message for purchase:', payload.Customer.full_name);
      
      try {
        const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
        const zapiToken = Deno.env.get('ZAPI_TOKEN');
        const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
        
        if (zapiInstanceId && zapiToken && zapiClientToken) {
          const phone = payload.Customer.mobile.replace(/\D/g, '');
          const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;
          
          // Get product-specific welcome message
          const welcomeMessage = getProductWelcomeMessage(
            payload.Customer.full_name.split(' ')[0],
            payload.product_name,
            productType,
            payload.webhook_event_type.toLowerCase() === 'assinatura_renovada'
          );
          
          const zapiResponse = await fetch(
            `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Client-Token': zapiClientToken,
              },
              body: JSON.stringify({
                phone: formattedPhone,
                message: welcomeMessage,
              }),
            }
          );
          
          const zapiResult = await zapiResponse.json();
          console.log('Welcome message sent via Z-API:', zapiResult);
          
          // Also create a whatsapp conversation and message record
          const { data: conversation } = await supabase
            .from('whatsapp_conversations')
            .upsert({
              user_id: userId,
              contact_phone: formattedPhone,
              contact_name: payload.Customer.full_name,
              channel: 'whatsapp',
              last_message_at: new Date().toISOString(),
              lead_id: leadId,
            }, {
              onConflict: 'user_id,contact_phone,channel',
            })
            .select()
            .single();
          
          if (conversation) {
            await supabase
              .from('whatsapp_messages')
              .insert({
                user_id: userId,
                conversation_id: conversation.id,
                content: welcomeMessage,
                is_from_contact: false,
                is_ai_response: false,
                message_type: 'text',
                status: 'sent',
                channel: 'whatsapp',
                zapi_message_id: zapiResult.messageId || null,
              });
          }
        } else {
          console.log('Z-API credentials not configured, skipping welcome message');
        }
      } catch (welcomeError) {
        console.error('Error sending welcome message:', welcomeError);
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
