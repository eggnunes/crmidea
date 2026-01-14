import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting diagnostic reminders check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
    const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN");
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
      console.log("Z-API credentials not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Z-API not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    // Find approved clients who:
    // 1. Don't have a corresponding consulting_client record (haven't filled the form)
    // 2. OR have a consulting_client record without selected_features (form not completed)
    // 3. Haven't received a reminder in the last 5 days

    // First, get all approved client_profiles
    const { data: approvedClients, error: clientsError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('is_approved', true);

    if (clientsError) {
      console.error("Error fetching approved clients:", clientsError);
      throw clientsError;
    }

    console.log(`Found ${approvedClients?.length || 0} approved clients`);

    // Get all consulting_clients to check form completion
    const { data: consultingClients, error: ccError } = await supabase
      .from('consulting_clients')
      .select('id, email, selected_features, last_reminder_sent_at');

    if (ccError) {
      console.error("Error fetching consulting clients:", ccError);
      throw ccError;
    }

    // Create a map of emails to consulting_clients
    const consultingClientMap = new Map(
      (consultingClients || []).map(cc => [cc.email.toLowerCase(), cc])
    );

    const remindersToSend: Array<{
      name: string;
      phone: string;
      email: string;
      type: 'not_started' | 'incomplete';
    }> = [];

    for (const client of approvedClients || []) {
      if (!client.phone) {
        console.log(`Skipping ${client.full_name}: no phone number`);
        continue;
      }

      const consultingClient = consultingClientMap.get(client.email.toLowerCase());

      // Check if they need a reminder
      let needsReminder = false;
      let reminderType: 'not_started' | 'incomplete' = 'not_started';

      if (!consultingClient) {
        // No consulting_client record - form not started
        needsReminder = true;
        reminderType = 'not_started';
        console.log(`${client.full_name}: No form record found`);
      } else if (!consultingClient.selected_features || (Array.isArray(consultingClient.selected_features) && consultingClient.selected_features.length === 0)) {
        // Has record but no features selected - form incomplete
        needsReminder = true;
        reminderType = 'incomplete';
        console.log(`${client.full_name}: Form incomplete`);
      }

      if (needsReminder) {
        // Check if we've sent a reminder recently
        const lastReminderDate = consultingClient?.last_reminder_sent_at 
          ? new Date(consultingClient.last_reminder_sent_at)
          : null;

        if (lastReminderDate && lastReminderDate > fiveDaysAgo) {
          console.log(`Skipping ${client.full_name}: reminder sent ${lastReminderDate.toISOString()}`);
          continue;
        }

        remindersToSend.push({
          name: client.full_name,
          phone: client.phone,
          email: client.email,
          type: reminderType
        });
      }
    }

    console.log(`Sending ${remindersToSend.length} reminders`);

    let sentCount = 0;
    let errorCount = 0;

    for (const reminder of remindersToSend) {
      try {
        // Format phone
        let formattedPhone = reminder.phone.replace(/\D/g, "");
        if (!formattedPhone.startsWith("55")) {
          formattedPhone = "55" + formattedPhone;
        }

        // Create personalized message
        const firstName = reminder.name.split(" ")[0];
        const message = reminder.type === 'not_started'
          ? `👋 Olá, ${firstName}!

Notei que você ainda não iniciou o preenchimento do seu *Formulário de Diagnóstico* da Consultoria IDEA.

📋 *Por que é importante?*
O diagnóstico nos ajuda a entender seu escritório e criar uma intranet jurídica 100% personalizada para suas necessidades.

⏱️ Leva apenas 10-15 minutos e já pode ser preenchido pelo celular!

🚀 Acesse seu dashboard e comece agora:
Faça login e clique em "Preencher Diagnóstico"

Estou à disposição para qualquer dúvida!

_Rafael Egg - Consultoria IDEA_`
          : `👋 Olá, ${firstName}!

Vi que você começou a preencher seu *Formulário de Diagnóstico*, mas ainda não finalizou.

📋 *Seu progresso está salvo!*
Você pode continuar de onde parou a qualquer momento.

⏱️ Faltam poucos minutos para você ter acesso a:
✅ Intranet personalizada
✅ Prompts exclusivos para seu escritório
✅ Plano de implementação passo a passo

🚀 Continue agora pelo seu dashboard!

Qualquer dúvida, estou aqui para ajudar.

_Rafael Egg - Consultoria IDEA_`;

        // Send WhatsApp message
        const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
        
        const response = await fetch(zapiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(ZAPI_CLIENT_TOKEN && { "Client-Token": ZAPI_CLIENT_TOKEN }),
          },
          body: JSON.stringify({
            phone: formattedPhone,
            message: message,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          console.log(`Reminder sent to ${reminder.name}: ${result.messageId}`);
          sentCount++;

          // Update last_reminder_sent_at
          if (consultingClientMap.has(reminder.email.toLowerCase())) {
            const cc = consultingClientMap.get(reminder.email.toLowerCase())!;
            await supabase
              .from('consulting_clients')
              .update({ last_reminder_sent_at: now.toISOString() })
              .eq('id', cc.id);
          } else {
            // Create a basic consulting_clients record to track reminders
            // This will be updated when they actually fill the form
            await supabase
              .from('consulting_clients')
              .insert({
                email: reminder.email,
                full_name: reminder.name,
                phone: reminder.phone,
                office_name: 'Pendente',
                office_address: 'Pendente',
                num_lawyers: 1,
                num_employees: 1,
                user_id: '00000000-0000-0000-0000-000000000000', // placeholder
                last_reminder_sent_at: now.toISOString(),
                status: 'aguardando_diagnostico'
              });
          }
        } else {
          console.error(`Failed to send reminder to ${reminder.name}:`, result);
          errorCount++;
        }

        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error sending reminder to ${reminder.name}:`, error);
        errorCount++;
      }
    }

    console.log(`Reminders complete: ${sentCount} sent, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        errors: errorCount,
        total: remindersToSend.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-diagnostic-reminders:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
