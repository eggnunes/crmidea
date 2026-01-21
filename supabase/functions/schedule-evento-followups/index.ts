import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Follow-up messages for Safe Experience leads
const FOLLOWUP_MESSAGES = [
  {
    template: `Oi [NOME], tudo bem?

Foi muito bom encontrar com você no Safe Experience! 

Estava pensando aqui... você deve ter visto no evento, inclusive lá no estande, como a IA pode transformar completamente um escritório de advocacia, né?

Eu criei a Consultoria IDEA justamente para ajudar advogados a implementarem isso de forma prática e personalizada. Não é curso genérico, é consultoria hands-on onde eu te acompanho na implementação real.

*Estendemos as condições especiais do evento para quem se cadastrou no estande, mas só até sexta-feira!*

Se quiser saber mais: www.rafaelegg.com/consultoria

Abraço!
Rafael`,
    dayOffset: 0, // Today
  },
  {
    template: `[NOME], e aí?

Qual a maior dor do seu escritório hoje? Captação de clientes? Gestão financeira? Controle de equipe?

Pergunto porque na Consultoria IDEA eu te ajudo a implementar um sistema completo e personalizado que resolve exatamente as dores do SEU escritório.

Não é solução pronta de prateleira... é feito sob medida para você.

*As condições do Safe Experience ainda estão valendo para quem se cadastrou no estande, mas só até amanhã!*

Dá uma olhada: www.rafaelegg.com/consultoria

Abraço!
Rafael`,
    dayOffset: 2, // Friday (2 days from today - Wednesday)
  },
  {
    template: `[NOME]!

Não quero encher o saco, mas também não queria que você perdesse essa oportunidade.

A Consultoria IDEA não é para todo mundo... é para quem realmente quer sair do operacional e escalar o escritório com inteligência artificial.

Se esse é o seu momento, a porta está aberta: www.rafaelegg.com/consultoria

Se não for agora, sem problema! Quando estiver pronto, me chama. 😊

Abraço e sucesso!
Rafael Egg`,
    dayOffset: 5, // Monday (5 days from today - Wednesday Jan 21 -> Monday Jan 26)
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get admin user ID
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .single();

    if (!adminRole) {
      throw new Error('No admin user found');
    }

    const userId = adminRole.user_id;
    console.log('Using admin user ID:', userId);

    // Get all leads with tag "evento" and valid phone
    const { data: leadsWithTag, error: tagsError } = await supabase
      .from('lead_tags')
      .select('lead_id')
      .eq('tag', 'evento');

    if (tagsError) throw tagsError;

    const leadIds = leadsWithTag?.map(t => t.lead_id) || [];
    console.log(`Found ${leadIds.length} leads with "evento" tag`);

    if (leadIds.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No leads with "evento" tag found',
        scheduled: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get lead details
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, phone')
      .in('id', leadIds)
      .not('phone', 'is', null);

    if (leadsError) throw leadsError;

    console.log(`Found ${leads?.length || 0} leads with valid phone numbers`);

    // Calculate schedule times (BRT = UTC-3, so 15:00 BRT = 18:00 UTC)
    const now = new Date();
    const scheduleTimes = [
      // Today at 15:00 BRT (18:00 UTC) - Jan 21, 2026
      new Date(Date.UTC(2026, 0, 21, 18, 0, 0)),
      // Friday Jan 24 at 15:00 BRT (18:00 UTC) - 2026
      new Date(Date.UTC(2026, 0, 24, 18, 0, 0)),
      // Monday Jan 27 at 15:00 BRT (18:00 UTC) - 2026  
      new Date(Date.UTC(2026, 0, 27, 18, 0, 0)),
    ];

    // If today's time has already passed, schedule for the next occurrence
    if (scheduleTimes[0] < now) {
      scheduleTimes[0].setTime(scheduleTimes[0].getTime() + 5 * 60 * 1000); // 5 minutes from now
    }

    console.log('Schedule times:', scheduleTimes.map(t => t.toISOString()));

    let scheduledCount = 0;
    const scheduledMessages: any[] = [];

    for (const lead of leads || []) {
      if (!lead.phone) continue;

      // Format phone number
      let phone = lead.phone.replace(/\D/g, '');
      if (!phone.startsWith('55')) {
        phone = '55' + phone;
      }

      // Get first name for personalization
      const firstName = lead.name?.split(' ')[0] || 'Advogado(a)';

      for (let i = 0; i < FOLLOWUP_MESSAGES.length; i++) {
        const followup = FOLLOWUP_MESSAGES[i];
        const scheduledAt = scheduleTimes[i];

        // Replace [NOME] placeholder with first name
        const message = followup.template.replace(/\[NOME\]/g, firstName);

        // Check if already scheduled for this lead and this message
        const { data: existing } = await supabase
          .from('scheduled_messages')
          .select('id')
          .eq('contact_phone', phone)
          .eq('message', message)
          .eq('status', 'pending')
          .single();

        if (existing) {
          console.log(`Message ${i + 1} already scheduled for ${lead.name}`);
          continue;
        }

        // Schedule the message
        const { data: scheduled, error: scheduleError } = await supabase
          .from('scheduled_messages')
          .insert({
            user_id: userId,
            contact_phone: phone,
            message: message,
            scheduled_at: scheduledAt.toISOString(),
            status: 'pending',
          })
          .select()
          .single();

        if (scheduleError) {
          console.error(`Error scheduling message for ${lead.name}:`, scheduleError);
          continue;
        }

        scheduledMessages.push({
          leadName: lead.name,
          phone: phone,
          messageNumber: i + 1,
          scheduledAt: scheduledAt.toISOString(),
        });

        scheduledCount++;
        console.log(`Scheduled message ${i + 1} for ${lead.name} at ${scheduledAt.toISOString()}`);
      }
    }

    // Also add AI intents for handling common objections
    const objectionIntents = [
      {
        intent_name: 'Objeção: Preço Alto',
        trigger_phrases: ['caro', 'muito caro', 'está caro', 'não tenho dinheiro', 'preço alto', 'investimento alto'],
        action_type: 'message',
        action_value: 'Entendo! Mas pensa assim: quanto você está perdendo por mês sem ter controle financeiro? Sem saber qual processo dá lucro? Sem captar clientes de forma estratégica? O investimento se paga em poucos meses. Posso te mostrar como outros advogados já recuperaram esse valor?',
        description: 'Resposta para objeção de preço no follow-up Safe Experience',
        is_active: true,
      },
      {
        intent_name: 'Objeção: Falta de Tempo',
        trigger_phrases: ['não tenho tempo', 'sem tempo', 'muito ocupado', 'corrido', 'agenda cheia'],
        action_type: 'message',
        action_value: 'Justamente por isso você precisa! A consultoria te ajuda a ganhar tempo automatizando o que toma seu dia hoje. Meus clientes economizam 10-15 horas por semana depois da implementação. Quer que eu te mostre como funciona na prática?',
        description: 'Resposta para objeção de tempo no follow-up Safe Experience',
        is_active: true,
      },
      {
        intent_name: 'Objeção: Vou Pensar',
        trigger_phrases: ['vou pensar', 'preciso pensar', 'deixa eu pensar', 'vou analisar'],
        action_type: 'message',
        action_value: 'Claro! Mas não deixa passar as condições do evento. Se quiser, posso te mandar mais informações para você avaliar com calma? Ou prefere tirar alguma dúvida agora?',
        description: 'Resposta para "vou pensar" no follow-up Safe Experience',
        is_active: true,
      },
      {
        intent_name: 'Objeção: Falar com Sócio',
        trigger_phrases: ['falar com meu sócio', 'preciso falar com sócio', 'consultar meu sócio', 'decidir com sócio'],
        action_type: 'message',
        action_value: 'Perfeito! Quer que eu envie um resumo para vocês avaliarem juntos? Ou prefere agendar uma call rápida com vocês dois? Assim eu explico tudo de uma vez e vocês podem tomar a decisão juntos.',
        description: 'Resposta para objeção de consultar sócio',
        is_active: true,
      },
      {
        intent_name: 'Interesse: Quero Saber Mais',
        trigger_phrases: ['quero saber mais', 'me conta mais', 'como funciona', 'interessado', 'tenho interesse', 'gostaria de saber'],
        action_type: 'message',
        action_value: 'Ótimo! A Consultoria IDEA é um acompanhamento personalizado de 3 meses onde eu te ajudo a implementar IA no seu escritório. Não é curso gravado, são encontros ao vivo comigo onde a gente constrói juntos as soluções para as dores do SEU escritório. Quer que eu te explique o passo a passo de como funciona?',
        description: 'Resposta para interesse no follow-up Safe Experience',
        is_active: true,
      },
      {
        intent_name: 'Interesse: Agendar Reunião',
        trigger_phrases: ['agendar', 'marcar reunião', 'call', 'conversar', 'quero conversar', 'podemos conversar'],
        action_type: 'link',
        action_value: 'https://rafaelegg.com/consultoria',
        description: 'Direcionar para página de consultoria quando quer agendar',
        is_active: true,
      },
    ];

    // Check and insert AI intents
    for (const intent of objectionIntents) {
      const { data: existing } = await supabase
        .from('ai_intents')
        .select('id')
        .eq('user_id', userId)
        .eq('intent_name', intent.intent_name)
        .single();

      if (!existing) {
        await supabase.from('ai_intents').insert({
          user_id: userId,
          ...intent,
        });
        console.log(`Created AI intent: ${intent.intent_name}`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `Scheduled ${scheduledCount} messages for ${leads?.length || 0} leads`,
      scheduledCount,
      leadsCount: leads?.length || 0,
      scheduleTimes: scheduleTimes.map(t => t.toISOString()),
      details: scheduledMessages,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error scheduling follow-ups:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
