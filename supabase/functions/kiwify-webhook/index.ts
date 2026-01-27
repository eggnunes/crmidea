import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kiwify-webhook-token',
};

// The webhook can come in two formats:
// 1. Direct format: { order_id, Customer, product_name, ... }
// 2. Nested format: { order: { order_id, Customer, Product: { product_name }, ... } }
interface KiwifyWebhookPayload {
  // Direct fields (old format)
  order_id?: string;
  order_ref?: string;
  order_status?: string;
  product_id?: string;
  product_name?: string;
  Customer?: {
    full_name: string;
    first_name?: string;
    email: string;
    mobile?: string;
    CPF?: string;
  };
  created_at?: string;
  updated_at?: string;
  approved_date?: string;
  refunded_at?: string;
  Commissions?: {
    charge_amount: number;
    product_base_price: number;
    my_commission?: number;  // This is the value the producer receives (for co-productions)
  };
  Subscription?: {
    id: string;
    status: string;
  };
  webhook_event_type?: string;
  
  // Nested format (new format from Kiwify)
  order?: {
    order_id: string;
    order_ref: string;
    order_status: string;
    webhook_event_type: string;
    Product?: {
      product_id: string;
      product_name: string;
      product_offer_id?: string;
      product_offer_name?: string;
    };
    Customer?: {
      full_name: string;
      first_name?: string;
      email: string;
      mobile?: string;
      CPF?: string;
    };
    Commissions?: {
      charge_amount: number;
      product_base_price: number;
      my_commission?: number;  // This is the value the producer receives (for co-productions)
    };
    Subscription?: {
      id: string;
      status: string;
    };
    created_at: string;
    updated_at: string;
    approved_date?: string;
    refunded_at?: string;
  };
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
    case 'order_approved':  // Kiwify also sends this event name
      return 'fechado_ganho';
    
    // Compra recusada - ainda em negociação
    case 'compra_recusada':
    case 'order_refused':
      return 'negociacao';
    
    // Reembolso e chargeback - perdeu
    case 'reembolso':
    case 'compra_reembolsada':
    case 'order_refunded':
    case 'chargeback':
      return 'fechado_perdido';
    
    // Assinaturas
    case 'assinatura_renovada':
    case 'subscription_renewed':
      return 'fechado_ganho';
    case 'assinatura_cancelada':
    case 'assinatura_atrasada':
    case 'subscription_canceled':
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
    case 'order_approved':
    case 'assinatura_renovada':
    case 'subscription_renewed':
      return 'venda';
    case 'pix_gerado':
    case 'boleto_gerado':
      return 'pagamento';
    case 'carrinho_abandonado':
      return 'carrinho';
    case 'reembolso':
    case 'compra_reembolsada':
    case 'order_refunded':
      return 'reembolso';
    case 'chargeback':
      return 'chargeback';
    case 'compra_recusada':
    case 'order_refused':
      return 'recusado';
    case 'assinatura_cancelada':
    case 'subscription_canceled':
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
      // Mensagem completa para clientes de consultoria com link de cadastro
      return `Olá, ${firstName}! 🎉\n\n` +
        `Tenho uma excelente notícia para você que é cliente da *Consultoria IDEA*!\n\n` +
        `Como parte do seu plano de consultoria, você tem direito a implementar uma *intranet personalizada completa* para seu escritório — isso já está incluído no investimento que você fez!\n\n` +
        `Para dar início ao desenvolvimento da sua intranet, criamos um *Sistema de Consultoria* que vai organizar todo o processo de forma profissional e eficiente.\n\n` +
        `*O que é a Intranet Personalizada?*\n\n` +
        `Uma plataforma completa desenvolvida sob medida para seu escritório, com mais de 50 funcionalidades integradas de IA, incluindo:\n\n` +
        `✅ Geração automática de petições, contratos e documentos jurídicos\n` +
        `✅ Chatbot jurídico 24/7 para atendimento aos clientes\n` +
        `✅ Gestão de processos e prazos automatizada\n` +
        `✅ Dashboard de performance e relatórios inteligentes\n` +
        `✅ Sistema de marketing com geração de conteúdo por IA\n` +
        `✅ Integração com seu sistema de gestão processual\n` +
        `✅ E muito mais!\n\n` +
        `*Como funciona o processo:*\n\n` +
        `1️⃣ *Cadastro no Sistema de Consultoria*\n` +
        `Acesse o sistema e faça seu cadastro. É rápido e simples!\n\n` +
        `2️⃣ *Preenchimento do Formulário Detalhado*\n` +
        `Você responderá um questionário completo sobre seu escritório: estrutura, processos, fluxos de trabalho, áreas de atuação, sistema de gestão processual, nível de conhecimento em IA da equipe e, principalmente, quais funcionalidades você deseja na sua intranet.\n\n` +
        `3️⃣ *Análise e Planejamento Personalizado*\n` +
        `Com todas as informações organizadas, vamos criar um planejamento sob medida para desenvolver a intranet perfeita para seu escritório.\n\n` +
        `4️⃣ *Desenvolvimento e Implementação*\n` +
        `Agendaremos nossas reuniões para desenvolver e implementar sua intranet, com você acompanhando cada etapa do processo.\n\n` +
        `*Por que usar o Sistema de Consultoria?*\n\n` +
        `✅ Já está incluído no seu plano — aproveite esse benefício!\n` +
        `✅ Organização total: Todas as informações centralizadas\n` +
        `✅ Intranet sob medida: Desenvolvida exatamente para suas necessidades\n` +
        `✅ Acompanhamento completo: Histórico de reuniões e evolução do projeto\n` +
        `✅ Suporte especializado: 6 meses de acompanhamento incluso\n\n` +
        `🔗 *Acesse o Sistema de Consultoria e comece agora:*\n` +
        `https://rafaelegg.com/consultoria/login\n\n` +
        `Não deixe esse benefício incrível sem uso! Sua intranet personalizada está esperando por você. 🚀\n\n` +
        `Qualquer dúvida, estou à disposição!\n\n` +
        `Vamos construir juntos a transformação digital do seu escritório!\n\n` +
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

    const rawPayload = await req.json();
    
    console.log('Raw payload keys:', Object.keys(rawPayload));
    console.log('Full raw payload:', JSON.stringify(rawPayload, null, 2));
    
    // Normalize payload - handle THREE possible formats from Kiwify:
    // 1. Nested: { url, signature, order: { Customer, Product, ... } }
    // 2. Direct with capitalized: { Customer, Product, webhook_event_type, ... }
    // 3. Direct with lowercase (new format): { name, email, phone, product_name, status, ... }
    const orderData = rawPayload.order;
    const hasOrderWrapper = !!(orderData && typeof orderData === 'object');
    console.log('Has order wrapper:', hasOrderWrapper);
    
    // Use the order data if wrapped, otherwise use rawPayload directly
    const payloadData = hasOrderWrapper ? orderData : rawPayload;
    
    // Check for the new lowercase format (format 3)
    const isNewLowercaseFormat = !!(payloadData.email && payloadData.name && !payloadData.Customer);
    console.log('Is new lowercase format:', isNewLowercaseFormat);
    
    // Extract data - handle both old capitalized format and new lowercase format
    let customer;
    let productName;
    let eventType;
    let commissions;
    let orderId;
    
    if (isNewLowercaseFormat) {
      // New Kiwify format with lowercase fields directly in payload
      customer = {
        full_name: payloadData.name || payloadData.first_name || '',
        first_name: payloadData.first_name || payloadData.name?.split(' ')[0] || '',
        email: payloadData.email,
        mobile: payloadData.phone,
        CPF: payloadData.cpf || payloadData.cnpj
      };
      productName = payloadData.product_name || payloadData.offer_name;
      // Map status to event type
      const statusLower = (payloadData.status || '').toLowerCase();
      if (statusLower === 'paid' || statusLower === 'approved') {
        eventType = 'compra_aprovada';
      } else if (statusLower === 'refunded') {
        eventType = 'reembolso';
      } else if (statusLower === 'waiting_payment') {
        eventType = 'pix_gerado';
      } else if (statusLower === 'abandoned') {
        eventType = 'carrinho_abandonado';
      } else if (statusLower === 'refused' || statusLower === 'declined') {
        eventType = 'compra_recusada';
      } else {
        eventType = payloadData.status || 'unknown';
      }
      orderId = payloadData.id;
      commissions = null;
      console.log('Mapped status to event:', payloadData.status, '->', eventType);
    } else {
      // Old format with capitalized Customer and Product objects
      customer = payloadData.Customer;
      productName = payloadData.Product?.product_name;
      eventType = payloadData.webhook_event_type;
      commissions = payloadData.Commissions;
      orderId = payloadData.order_id;
    }
    
    console.log('Order ID:', orderId);
    console.log('Event type:', eventType);
    console.log('Customer:', JSON.stringify(customer));
    console.log('Product name:', productName);

    if (!customer?.email) {
      console.log('No customer email in payload');
      return new Response(
        JSON.stringify({ success: false, error: 'No customer email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!eventType) {
      console.log('No event type in payload - using status field or default');
      // For new format, try to use status directly if eventType mapping failed
      if (payloadData.status) {
        eventType = payloadData.status;
      } else {
        return new Response(
          JSON.stringify({ success: false, error: 'No event type' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    if (!productName) {
      console.log('No product name in payload - full payload:', JSON.stringify(payloadData));
      return new Response(
        JSON.stringify({ success: false, error: 'No product name' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client here to check for duplicates
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate webhook by order_id AND event type - avoid processing same event twice
    // But allow different events for the same order (e.g., pix_gerado -> compra_aprovada)
    const eventLowerForDupe = eventType.toLowerCase();
    if (orderId) {
      const { data: existingInteraction } = await supabase
        .from('interactions')
        .select('id, description')
        .ilike('description', `%${orderId}%`)
        .limit(10);
      
      // Check if this specific event type was already processed for this order
      const eventAlreadyProcessed = existingInteraction?.some(interaction => {
        const desc = interaction.description?.toLowerCase() || '';
        // Check if this exact event type is already recorded
        return desc.includes(eventLowerForDupe) || 
               (eventLowerForDupe === 'order_approved' && desc.includes('compra_aprovada')) ||
               (eventLowerForDupe === 'compra_aprovada' && desc.includes('order_approved'));
      });
      
      if (eventAlreadyProcessed) {
        console.log('Duplicate event detected for order_id:', orderId, 'event:', eventType, '- skipping');
        return new Response(
          JSON.stringify({ success: true, message: 'Duplicate event ignored', order_id: orderId, event: eventType }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      console.log('New event for existing order:', orderId, 'event:', eventType, '- processing');
    }

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

    // Check if lead already exists by email - get the one with best status to avoid duplicates
    // Priority order: fechado_ganho > negociacao > proposta_enviada > em_contato > qualificado > novo > fechado_perdido
    const { data: existingLeads, error: findError } = await supabase
      .from('leads')
      .select('*')
      .eq('email', customer.email.toLowerCase().trim())
      .eq('user_id', userId);

    if (findError) {
      console.error('Error finding lead:', findError);
    }

    // If multiple leads exist, pick the one with best status
    let existingLead = null;
    if (existingLeads && existingLeads.length > 0) {
      const statusPriority: Record<string, number> = {
        'fechado_ganho': 1,
        'negociacao': 2,
        'proposta_enviada': 3,
        'em_contato': 4,
        'qualificado': 5,
        'novo': 6,
        'fechado_perdido': 7
      };
      
      existingLead = existingLeads.sort((a, b) => {
        const priorityA = statusPriority[a.status] || 99;
        const priorityB = statusPriority[b.status] || 99;
        return priorityA - priorityB;
      })[0];
      
      console.log('Found', existingLeads.length, 'existing leads, using best one:', existingLead.id, 'with status:', existingLead.status);
    }

    const newStatus = mapEventToStatus(eventType);
    const productType = mapProductName(productName);
    
    // Log commissions for debugging
    console.log('Commissions object:', JSON.stringify(commissions));
    
    // Convert from centavos to reais (Kiwify sends values in centavos)
    // Priority: my_commission (producer's share for co-productions) > charge_amount > product_base_price
    const valueInCentavos = commissions?.my_commission || commissions?.charge_amount || commissions?.product_base_price || null;
    const value = valueInCentavos ? valueInCentavos / 100 : null;
    
    console.log('Value extracted:', value, 'from centavos:', valueInCentavos);

    let leadId: string;
    let leadAction: 'created' | 'updated';

    // Status priority - lower number = better status (should not be downgraded)
    const statusPriority: Record<string, number> = {
      'fechado_ganho': 1,
      'negociacao': 2,
      'proposta_enviada': 3,
      'em_contato': 4,
      'qualificado': 5,
      'novo': 6,
      'fechado_perdido': 7
    };

    if (existingLead) {
      // Update existing lead - but DON'T downgrade status
      console.log('Updating existing lead:', existingLead.id);
      
      const currentPriority = statusPriority[existingLead.status] || 99;
      const newPriority = statusPriority[newStatus] || 99;
      
      // Only update status if the new one is better (lower priority number)
      const finalStatus = newPriority < currentPriority ? newStatus : existingLead.status;
      console.log(`Status decision: current=${existingLead.status}(${currentPriority}), new=${newStatus}(${newPriority}), final=${finalStatus}`);
      
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          status: finalStatus,
          product: productType,
          value: value || existingLead.value, // Keep existing value if new one is null
          notes: `${existingLead.notes || ''}\n\n[Kiwify ${new Date().toISOString()}] ${eventType}: ${productName}`.trim(),
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
      console.log('Creating new lead for:', customer.email);
      
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({
          user_id: userId,
          name: customer.full_name,
          email: customer.email.toLowerCase().trim(), // Normalize email to prevent duplicates
          phone: customer.mobile || null,
          status: newStatus,
          product: productType,
          value: value,
          source: 'Kiwify',
          notes: `[Kiwify ${new Date().toISOString()}] ${eventType}: ${productName}`,
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

    // Add interaction for this event - include order_id for duplicate detection
    const interactionType = mapEventToInteractionType(eventType);
    const interactionDescription = `Evento Kiwify: ${eventType} - Produto: ${productName}${value ? ` - Valor: R$ ${value.toFixed(2)}` : ''}${orderId ? ` [Order: ${orderId}]` : ''}`;

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
      eventType, 
      customer.full_name, 
      productName
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

    // Send WhatsApp notification to admin for important events (purchases, refunds, abandoned carts)
    const importantEvents = [
      'compra_aprovada', 
      'order_approved', 
      'reembolso', 
      'compra_reembolsada', 
      'carrinho_abandonado',
      'chargeback'
    ];
    
    const eventLower = eventType.toLowerCase();
    if (importantEvents.includes(eventLower)) {
      console.log('Important event detected, sending WhatsApp to admin:', eventLower);
      
      try {
        // Get admin's personal WhatsApp from follow_up_settings
        const { data: followUpSettings } = await supabase
          .from('follow_up_settings')
          .select('personal_whatsapp')
          .eq('user_id', userId)
          .single();
        
        const adminPhone = followUpSettings?.personal_whatsapp;
        console.log('Admin personal WhatsApp:', adminPhone);
        
        if (adminPhone) {
          const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
          const zapiToken = Deno.env.get('ZAPI_TOKEN');
          const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
          
          if (zapiInstanceId && zapiToken && zapiClientToken) {
            // Format admin phone
            const formattedAdminPhone = adminPhone.replace(/\D/g, '').startsWith('55') 
              ? adminPhone.replace(/\D/g, '') 
              : `55${adminPhone.replace(/\D/g, '')}`;
            
            // Create message based on event type
            let adminMessage = '';
            const valueText = value ? `R$ ${value.toFixed(2)}` : 'Valor não informado';
            
            if (eventLower === 'compra_aprovada' || eventLower === 'order_approved') {
              adminMessage = `🎉 *NOVA VENDA KIWIFY!*\n\n` +
                `👤 *Cliente:* ${customer.full_name}\n` +
                `📧 *Email:* ${customer.email}\n` +
                `📱 *Telefone:* ${customer.mobile || 'Não informado'}\n` +
                `📦 *Produto:* ${productName}\n` +
                `💰 *Valor:* ${valueText}\n\n` +
                `🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
            } else if (eventLower === 'reembolso' || eventLower === 'compra_reembolsada') {
              adminMessage = `💸 *PEDIDO DE REEMBOLSO!*\n\n` +
                `👤 *Cliente:* ${customer.full_name}\n` +
                `📧 *Email:* ${customer.email}\n` +
                `📦 *Produto:* ${productName}\n` +
                `💰 *Valor:* ${valueText}\n\n` +
                `⚠️ Verifique o motivo e entre em contato!\n\n` +
                `🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
            } else if (eventLower === 'carrinho_abandonado') {
              adminMessage = `🛒 *CARRINHO ABANDONADO!*\n\n` +
                `👤 *Cliente:* ${customer.full_name}\n` +
                `📧 *Email:* ${customer.email}\n` +
                `📱 *Telefone:* ${customer.mobile || 'Não informado'}\n` +
                `📦 *Produto:* ${productName}\n` +
                `💰 *Valor:* ${valueText}\n\n` +
                `🔥 Faça follow-up urgente!\n\n` +
                `🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
            } else if (eventLower === 'chargeback') {
              adminMessage = `⚠️ *ALERTA DE CHARGEBACK!*\n\n` +
                `👤 *Cliente:* ${customer.full_name}\n` +
                `📧 *Email:* ${customer.email}\n` +
                `📦 *Produto:* ${productName}\n` +
                `💰 *Valor:* ${valueText}\n\n` +
                `🚨 AÇÃO URGENTE NECESSÁRIA!\n\n` +
                `🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
            }
            
            if (adminMessage) {
              const adminZapiResponse = await fetch(
                `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Client-Token': zapiClientToken,
                  },
                  body: JSON.stringify({
                    phone: formattedAdminPhone,
                    message: adminMessage,
                  }),
                }
              );
              
              const adminZapiResult = await adminZapiResponse.json();
              console.log('Admin WhatsApp notification sent:', adminZapiResult);
            }
          } else {
            console.log('Z-API credentials not configured for admin notification');
          }
        } else {
          console.log('No personal WhatsApp configured for admin');
        }
      } catch (adminNotifError) {
        console.error('Error sending admin WhatsApp notification:', adminNotifError);
      }
    }
    if (eventType.toLowerCase() === 'carrinho_abandonado' && customer.mobile) {
      console.log('Checking if customer already purchased this product before sending abandoned cart alert...');
      
      // Check if customer already purchased this same product
      const { data: existingPurchase } = await supabase
        .from('interactions')
        .select('id')
        .eq('lead_id', leadId)
        .eq('type', 'venda')
        .ilike('description', `%${productName}%`)
        .limit(1)
        .maybeSingle();
      
      if (existingPurchase) {
        console.log('Customer already purchased this product, skipping abandoned cart alert for:', customer.full_name);
      } else {
        console.log('No previous purchase found, triggering abandoned cart WhatsApp alert for:', customer.full_name);
        
        try {
          // First, trigger the standard abandoned cart alert (ManyChat flow)
          const alertResponse = await fetch(`${supabaseUrl}/functions/v1/abandoned-cart-alert`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              leadId: leadId,
              leadName: customer.full_name,
              productName: productName,
              phone: customer.mobile,
            }),
          });
          
          const alertResult = await alertResponse.json();
          console.log('Abandoned cart alert result:', alertResult);
          
          // Trigger AI sales recovery for ALL products (not just curso_idea)
          console.log('Triggering AI sales recovery for:', productName, '(type:', productType, ')');
          
          try {
            const recoveryResponse = await fetch(`${supabaseUrl}/functions/v1/ai-sales-recovery`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                leadId: leadId,
                leadName: customer.full_name,
                firstName: customer.first_name || customer.full_name.split(' ')[0],
                productName: productName,
                phone: customer.mobile,
                userId: userId,
              }),
            });
            
            const recoveryResult = await recoveryResponse.json();
            console.log('AI sales recovery result:', recoveryResult);
          } catch (recoveryError) {
            console.error('Error triggering AI sales recovery:', recoveryError);
          }
        } catch (alertError) {
          console.error('Error sending abandoned cart alert:', alertError);
        }
      }
    }

    // For refunds, send a message to the customer
    if ((eventType.toLowerCase() === 'reembolso' || 
         eventType.toLowerCase() === 'compra_reembolsada') && customer.mobile) {
      console.log('Sending refund confirmation message to:', customer.full_name);
      
      try {
        const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
        const zapiToken = Deno.env.get('ZAPI_TOKEN');
        const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
        
        if (zapiInstanceId && zapiToken && zapiClientToken) {
          const phone = customer.mobile.replace(/\D/g, '');
          const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;
          const firstName = customer.first_name || customer.full_name.split(' ')[0];
          
          const refundMessage = `Olá, ${firstName}! 👋\n\n` +
            `Recebemos sua solicitação de reembolso do produto *${productName}*.\n\n` +
            `O processamento já foi iniciado e você receberá o valor conforme o prazo da sua forma de pagamento.\n\n` +
            `Se tiver alguma dúvida ou quiser compartilhar o motivo da sua decisão (isso nos ajuda a melhorar!), fique à vontade para responder esta mensagem.\n\n` +
            `Obrigado pela confiança e esperamos te ver em breve! 🙏\n\n` +
            `_Equipe IDEA_`;
          
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
                message: refundMessage,
              }),
            }
          );
          
          const zapiResult = await zapiResponse.json();
          console.log('Refund message sent via Z-API:', zapiResult);
          
          // Create conversation and message record
          const { data: conversation } = await supabase
            .from('whatsapp_conversations')
            .upsert({
              user_id: userId,
              contact_phone: formattedPhone,
              contact_name: customer.full_name,
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
                content: refundMessage,
                is_from_contact: false,
                is_ai_response: false,
                message_type: 'text',
                status: 'sent',
                channel: 'whatsapp',
                zapi_message_id: zapiResult.messageId || null,
              });
          }
        }
      } catch (refundMsgError) {
        console.error('Error sending refund message:', refundMsgError);
      }
    }

    if ((eventType.toLowerCase() === 'compra_aprovada' || 
         eventType.toLowerCase() === 'assinatura_renovada' ||
         eventType.toLowerCase() === 'order_approved') && customer.mobile) {
      console.log('Sending welcome message for purchase:', customer.full_name);
      
      try {
        const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
        const zapiToken = Deno.env.get('ZAPI_TOKEN');
        const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
        
        if (zapiInstanceId && zapiToken && zapiClientToken) {
          const phone = customer.mobile.replace(/\D/g, '');
          const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;
          
          // Get product-specific welcome message
          const welcomeMessage = getProductWelcomeMessage(
            customer.first_name || customer.full_name.split(' ')[0],
            productName,
            productType,
            eventType.toLowerCase() === 'assinatura_renovada'
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
              contact_name: customer.full_name,
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
      if (manychatApiKey && customer.mobile) {
        // Try to find subscriber by phone and update tags
        const phone = customer.mobile.replace(/\D/g, '');
        
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
          const tagName = `kiwify_${eventType}`;
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
