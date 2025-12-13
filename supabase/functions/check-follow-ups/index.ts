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
  'curso_idea': 'Curso IDEA',
  'guia_ia': 'Guia de IA',
  'codigo_prompts': 'Código dos Prompts',
  'combo_ebooks': 'Combo de E-books',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting follow-up check...');

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

    for (const setting of settings || []) {
      console.log(`Processing user ${setting.user_id}, days_without_interaction: ${setting.days_without_interaction}`);

      // Get all leads for this user that are not closed
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          product,
          status,
          updated_at
        `)
        .eq('user_id', setting.user_id)
        .not('status', 'in', '("fechado_ganho","fechado_perdido")');

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

          // Send WhatsApp notification if enabled and subscriber ID is configured
          if (setting.notify_whatsapp && setting.manychat_subscriber_id) {
            try {
              const whatsappResponse = await fetch(
                `${supabaseUrl}/functions/v1/send-whatsapp-notification`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                  },
                  body: JSON.stringify({
                    leadId: lead.id,
                    leadName: lead.name,
                    subscriberId: setting.manychat_subscriber_id,
                    daysSinceLastInteraction: daysSinceActivity,
                    product: productName,
                  }),
                }
              );

              if (whatsappResponse.ok) {
                whatsappSent.push(lead.id);
                console.log(`Sent WhatsApp notification for lead ${lead.name}`);
              } else {
                const errorData = await whatsappResponse.json();
                console.error('WhatsApp notification failed:', errorData);
              }
            } catch (whatsappError) {
              console.error('Error sending WhatsApp notification:', whatsappError);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsCreated: notificationsCreated.length,
        whatsappSent: whatsappSent.length,
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