import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SalesRecoveryRequest {
  leadId: string;
  leadName: string;
  firstName: string;
  productName: string;
  phone: string;
  userId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, leadName, firstName, productName, phone, userId }: SalesRecoveryRequest = await req.json();
    console.log('Processing AI sales recovery for:', leadName, 'Product:', productName);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
    const zapiToken = Deno.env.get('ZAPI_TOKEN');
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Lovable API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!zapiInstanceId || !zapiToken || !zapiClientToken) {
      console.error('Z-API credentials not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Z-API credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get training documents about the curso IDEA and consultoria
    const { data: trainingDocs } = await supabase
      .from('ai_training_documents')
      .select('title, content')
      .eq('user_id', userId)
      .eq('status', 'trained')
      .or('title.ilike.%idea%,title.ilike.%curso%,title.ilike.%consultoria%,content.ilike.%curso idea%,content.ilike.%consultoria%')
      .limit(10);

    // Build knowledge base from training documents
    let knowledgeBase = '';
    if (trainingDocs && trainingDocs.length > 0) {
      knowledgeBase = trainingDocs.map(doc => `[${doc.title}]\n${doc.content}`).join('\n\n');
    }

    // Determine which product was abandoned
    const isConsultoria = productName.toLowerCase().includes('consultoria');
    const isCursoIDEA = productName.toLowerCase().includes('idea') || productName.toLowerCase().includes('curso');
    
    // Set the appropriate link based on product
    const productLink = isConsultoria 
      ? 'https://rafaelegg.com/consultoria'
      : 'https://kfrfrfe.pay.kiwify.com.br/MNyPobNNqGhOrKM'; // Link curso IDEA na Kiwify
    
    // System prompt for sales recovery
    const systemPrompt = `Você é um assistente de vendas especializado da IDEA (Inteligência de Dados e Artificial). 
Seu objetivo é recuperar um carrinho abandonado de forma natural, empática e persuasiva.

## Contexto
O cliente ${firstName} demonstrou interesse em ${productName} mas não finalizou a compra.

## Conhecimento sobre os produtos
${knowledgeBase || `
O Curso IDEA é um programa completo sobre Inteligência Artificial para advogados, com:
- 11 módulos e mais de 70 aulas práticas
- Foco em aplicações reais na advocacia
- Prompts prontos para usar no dia a dia
- Certificado de conclusão
- Suporte e comunidade exclusiva
- Acesso vitalício às atualizações

A Consultoria IDEA é um serviço de implementação personalizada de IA:
- Análise completa do fluxo de trabalho do escritório
- Chatbot inteligente para atendimento de clientes
- Automação de documentos e processos
- Acompanhamento individual com Rafael
`}

## Regras da Mensagem
1. Seja breve e direto (máximo 3-4 parágrafos curtos)
2. Use o primeiro nome do cliente (${firstName})
3. Não seja agressivo ou insistente demais
4. Mencione 1-2 benefícios chave do produto
5. Ofereça ajuda para tirar dúvidas
6. INCLUA O LINK do produto no final da mensagem: ${productLink}
7. Use emojis moderadamente (2-3 no máximo)
8. Pergunte se há alguma dúvida específica que impediu a compra
9. Finalize oferecendo falar com o Rafael se preferir atendimento humano

## Tom
Amigável, profissional, compreensivo. Como um colega que quer genuinamente ajudar.`;

    // Generate personalized recovery message
    console.log('Generating AI sales recovery message...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Gere uma mensagem de recuperação de carrinho abandonado para ${firstName} que abandonou o carrinho do ${productName}. A mensagem deve ser enviada via WhatsApp.`
          },
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text();
      console.error('Lovable AI error:', errorData);
      throw new Error(`AI gateway error: ${errorData}`);
    }

    const aiData = await aiResponse.json();
    let recoveryMessage = aiData.choices?.[0]?.message?.content;

    if (!recoveryMessage) {
      // Fallback message
      recoveryMessage = `Olá, ${firstName}! 👋\n\nVi que você estava dando uma olhada no Curso IDEA e queria saber se posso ajudar com alguma dúvida!\n\nO curso tem mais de 70 aulas práticas sobre como usar IA na advocacia, com prompts prontos que você pode aplicar no mesmo dia.\n\nFicou com alguma dúvida específica sobre o conteúdo ou funcionamento? Estou aqui pra ajudar! 😊\n\n_Equipe IDEA_`;
    }

    // Add transfer option to message if not already present
    if (!recoveryMessage.includes('falar com Rafael') && !recoveryMessage.includes('falar diretamente')) {
      recoveryMessage += `\n\n💬 Se preferir falar diretamente comigo (Rafael), digite *"falar com Rafael"*.`;
    }

    console.log('Generated recovery message:', recoveryMessage.substring(0, 100) + '...');

    // Send message via Z-API
    const formattedPhone = phone.replace(/\D/g, '').startsWith('55') 
      ? phone.replace(/\D/g, '') 
      : `55${phone.replace(/\D/g, '')}`;

    // Wait a few seconds before sending (to not seem too automated)
    await new Promise(resolve => setTimeout(resolve, 3000));

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
          message: recoveryMessage,
        }),
      }
    );

    const zapiResult = await zapiResponse.json();
    console.log('Recovery message sent via Z-API:', zapiResult);

    // Create/update conversation and save message
    const { data: conversation } = await supabase
      .from('whatsapp_conversations')
      .upsert({
        user_id: userId,
        contact_phone: formattedPhone,
        contact_name: leadName,
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
          content: recoveryMessage,
          is_from_contact: false,
          is_ai_response: true,
          message_type: 'text',
          status: 'sent',
          channel: 'whatsapp',
          zapi_message_id: zapiResult.messageId || null,
        });
    }

    // Log the recovery attempt
    await supabase.from('follow_up_logs').insert({
      user_id: userId,
      lead_id: leadId,
      notification_type: 'ai_sales_recovery',
      status: zapiResult.zapiMessageId ? 'sent' : 'failed',
      error_message: zapiResult.error || null,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'AI sales recovery message sent',
        messageId: zapiResult.zapiMessageId || zapiResult.messageId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('AI sales recovery error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
