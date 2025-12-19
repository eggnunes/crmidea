import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const productMap: Record<string, string> = {
  'consultoria': 'Consultoria IDEA',
  'mentoria_coletiva': 'Mentoria Coletiva',
  'mentoria_individual': 'Mentoria Individual',
  'mentoria-coletiva': 'Mentoria Coletiva',
  'mentoria-individual': 'Mentoria Individual',
  'curso_idea': 'Curso IDEA',
  'curso-idea': 'Curso IDEA',
  'guia_ia': 'Guia de IA',
  'guia-ia': 'Guia de IA',
  'codigo_prompts': 'Código dos Prompts',
  'codigo-prompts': 'Código dos Prompts',
  'combo_ebooks': 'Combo de E-books',
  'combo-ebooks': 'Combo de E-books',
  'imersao-idea': 'Imersão IDEA',
  'fraternidade-safe-black': 'Fraternidade Safe Black',
  'clube-mqp': 'Clube MQP',
  'fraternidade-safe-pro': 'Fraternidade Safe Pró',
  'safe-skills': 'Safe Skills',
  'safe-experience': 'Safe Experience',
  'mentoria-marcello-safe': 'Mentoria Marcello Safe',
};

// Intelligent follow-up message templates based on days and product
function getFollowUpMessage(leadName: string, daysSinceActivity: number, product: string, status: string): string {
  const firstName = leadName.split(' ')[0];
  const productName = productMap[product] || product;
  
  // Different templates based on lead status
  if (status === 'novo' || status === 'contato-inicial' || status === 'contato_inicial') {
    if (daysSinceActivity <= 3) {
      return `Olá ${firstName}! 👋\n\nVi que você demonstrou interesse no ${productName}. Posso te ajudar com alguma dúvida?\n\nFico à disposição! 🚀`;
    } else if (daysSinceActivity <= 7) {
      return `Oi ${firstName}, tudo bem? 😊\n\nPassando pra saber se você teve oportunidade de avaliar o ${productName}.\n\nSe quiser, podemos agendar uma call rápida pra eu te explicar melhor. O que acha?`;
    } else {
      return `${firstName}, como você está? 🙂\n\nFaz alguns dias que não conversamos sobre o ${productName}. Sei que a rotina é corrida!\n\nSe ainda tiver interesse, estou por aqui. Qualquer dúvida, é só chamar!`;
    }
  } else if (status === 'negociacao') {
    return `Oi ${firstName}! 💼\n\nEstou passando para dar continuidade à nossa conversa sobre o ${productName}.\n\nPosso te ajudar a avançar na decisão? Estou à disposição para esclarecer qualquer ponto!`;
  } else if (status === 'proposta-enviada' || status === 'proposta_enviada') {
    if (daysSinceActivity <= 5) {
      return `${firstName}, você conseguiu analisar a proposta do ${productName}? 📋\n\nFico à disposição para qualquer dúvida ou ajuste que precise!`;
    } else {
      return `Oi ${firstName}! ⏰\n\nSei que pode estar ocupado, mas queria saber se precisa de mais informações sobre a proposta do ${productName}.\n\nPosso ajudar em algo?`;
    }
  }
  
  // Default message
  return `Olá ${firstName}! 👋\n\nPassando para saber como você está. Caso tenha interesse em retomar nossa conversa sobre ${productName}, estou à disposição!\n\nAbraços! 🤝`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Z-API credentials
    const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
    const zapiToken = Deno.env.get('ZAPI_TOKEN');
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    console.log('Starting intelligent follow-up check...');
    console.log('Z-API configured:', !!zapiInstanceId && !!zapiToken);

    // Get all users with their follow-up settings
    const { data: settings, error: settingsError } = await supabase
      .from('follow_up_settings')
      .select('*');

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw settingsError;
    }

    console.log(`Found ${settings?.length || 0} users with follow-up settings`);

    const notificationsCreated: string[] = [];
    const whatsappSent: string[] = [];
    const errors: string[] = [];

    for (const setting of settings || []) {
      console.log(`Processing user ${setting.user_id}, days_without_interaction: ${setting.days_without_interaction}`);

      // Get all leads for this user that are not closed
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          product,
          status,
          updated_at
        `)
        .eq('user_id', setting.user_id)
        .not('status', 'in', '("fechado_ganho","fechado_perdido","fechado-ganho","fechado-perdido")');

      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        continue;
      }

      console.log(`Found ${leads?.length || 0} active leads for user ${setting.user_id}`);

      for (const lead of leads || []) {
        // Get the last interaction for this lead
        const { data: lastInteraction } = await supabase
          .from('interactions')
          .select('date')
          .eq('lead_id', lead.id)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        // Use last interaction date or lead updated_at as reference
        const lastActivityDate = lastInteraction?.date || lead.updated_at;
        const daysSinceActivity = Math.floor(
          (Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        console.log(`Lead ${lead.name}: ${daysSinceActivity} days since last activity`);

        if (daysSinceActivity >= setting.days_without_interaction) {
          // Check if we already sent a notification today
          const today = new Date().toISOString().split('T')[0];
          const { data: existingLog } = await supabase
            .from('follow_up_logs')
            .select('id')
            .eq('lead_id', lead.id)
            .gte('sent_at', `${today}T00:00:00`)
            .limit(1);

          if (existingLog && existingLog.length > 0) {
            console.log(`Notification already sent today for lead ${lead.name}`);
            continue;
          }

          const productName = productMap[lead.product] || lead.product;

          // Create in-app notification if enabled
          if (setting.notify_in_app) {
            const { error: notifError } = await supabase
              .from('notifications')
              .insert({
                user_id: setting.user_id,
                lead_id: lead.id,
                title: `Follow-up necessário: ${lead.name}`,
                message: `Este lead está há ${daysSinceActivity} dias sem interação. Produto: ${productName}`,
                type: 'follow_up',
              });

            if (notifError) {
              console.error('Error creating notification:', notifError);
            } else {
              notificationsCreated.push(lead.id);
              console.log(`Created in-app notification for lead ${lead.name}`);

              // Log the notification
              await supabase.from('follow_up_logs').insert({
                lead_id: lead.id,
                user_id: setting.user_id,
                notification_type: 'in_app',
                status: 'sent',
              });
            }
          }

          // Send WhatsApp message via Z-API if enabled and phone is available
          if (setting.notify_whatsapp && lead.phone && zapiInstanceId && zapiToken) {
            try {
              // Get intelligent message based on context
              const message = getFollowUpMessage(lead.name, daysSinceActivity, lead.product, lead.status);
              
              // Format phone number
              let formattedPhone = lead.phone.replace(/\D/g, '');
              if (!formattedPhone.startsWith('55')) {
                formattedPhone = '55' + formattedPhone;
              }

              const headers: Record<string, string> = {
                'Content-Type': 'application/json',
              };
              if (zapiClientToken) {
                headers['Client-Token'] = zapiClientToken;
              }

              const zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`;
              
              console.log(`Sending follow-up WhatsApp to ${lead.name} (${formattedPhone})`);
              
              const whatsappResponse = await fetch(zapiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  phone: formattedPhone,
                  message: message,
                }),
              });

              const responseData = await whatsappResponse.json();

              if (whatsappResponse.ok) {
                whatsappSent.push(lead.id);
                console.log(`Sent WhatsApp follow-up to ${lead.name}`, responseData);

                // Log the WhatsApp notification
                await supabase.from('follow_up_logs').insert({
                  lead_id: lead.id,
                  user_id: setting.user_id,
                  notification_type: 'whatsapp_zapi',
                  status: 'sent',
                });

                // Register as interaction
                await supabase.from('interactions').insert({
                  lead_id: lead.id,
                  type: 'whatsapp',
                  description: `[Follow-up automático] ${message.substring(0, 100)}...`,
                  date: new Date().toISOString().split('T')[0],
                });

                // Check if conversation exists, if not create one
                const { data: existingConv } = await supabase
                  .from('whatsapp_conversations')
                  .select('id')
                  .eq('user_id', setting.user_id)
                  .eq('contact_phone', formattedPhone)
                  .single();

                if (!existingConv) {
                  // Create conversation
                  const { data: newConv } = await supabase
                    .from('whatsapp_conversations')
                    .insert({
                      user_id: setting.user_id,
                      contact_phone: formattedPhone,
                      contact_name: lead.name,
                      lead_id: lead.id,
                      channel: 'whatsapp',
                      last_message_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                  if (newConv) {
                    // Save message to conversation
                    await supabase.from('whatsapp_messages').insert({
                      conversation_id: newConv.id,
                      user_id: setting.user_id,
                      content: message,
                      is_from_contact: false,
                      is_ai_response: false,
                      message_type: 'text',
                      status: 'sent',
                      zapi_message_id: responseData.messageId || responseData.zapiMessageId,
                    });
                  }
                } else {
                  // Save message to existing conversation
                  await supabase.from('whatsapp_messages').insert({
                    conversation_id: existingConv.id,
                    user_id: setting.user_id,
                    content: message,
                    is_from_contact: false,
                    is_ai_response: false,
                    message_type: 'text',
                    status: 'sent',
                    zapi_message_id: responseData.messageId || responseData.zapiMessageId,
                  });

                  // Update last_message_at
                  await supabase
                    .from('whatsapp_conversations')
                    .update({ last_message_at: new Date().toISOString() })
                    .eq('id', existingConv.id);
                }

              } else {
                console.error('Z-API error:', responseData);
                errors.push(`Lead ${lead.name}: ${JSON.stringify(responseData)}`);
                
                await supabase.from('follow_up_logs').insert({
                  lead_id: lead.id,
                  user_id: setting.user_id,
                  notification_type: 'whatsapp_zapi',
                  status: 'failed',
                  error_message: JSON.stringify(responseData),
                });
              }
            } catch (whatsappError) {
              console.error('Error sending WhatsApp via Z-API:', whatsappError);
              const errorMsg = whatsappError instanceof Error ? whatsappError.message : 'Unknown error';
              errors.push(`Lead ${lead.name}: ${errorMsg}`);
              
              await supabase.from('follow_up_logs').insert({
                lead_id: lead.id,
                user_id: setting.user_id,
                notification_type: 'whatsapp_zapi',
                status: 'failed',
                error_message: errorMsg,
              });
            }
          }
        }
      }
    }

    console.log(`Follow-up complete. Notifications: ${notificationsCreated.length}, WhatsApp: ${whatsappSent.length}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        notificationsCreated: notificationsCreated.length,
        whatsappSent: whatsappSent.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-follow-ups:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
