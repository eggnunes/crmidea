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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting weekly report generation...');

    // Get date range for last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Get all users with admin or moderator roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['admin', 'moderator']);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      throw rolesError;
    }

    const userIds = userRoles?.map(r => r.user_id) || [];
    console.log(`Found ${userIds.length} users to send reports to`);

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ message: 'No users to send reports to' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch metrics for each user
    for (const userId of userIds) {
      console.log(`Generating report for user: ${userId}`);

      // Get leads stats
      const { data: newLeads } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      const { data: closedWon } = await supabase
        .from('leads')
        .select('id, value', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'fechado_ganho')
        .gte('updated_at', startDateStr)
        .lte('updated_at', endDateStr);

      const { data: closedLost } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'fechado_perdido')
        .gte('updated_at', startDateStr)
        .lte('updated_at', endDateStr);

      // Get conversations stats
      const { data: conversations } = await supabase
        .from('whatsapp_conversations')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      // Get messages stats
      const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('id, is_ai_response, channel')
        .eq('user_id', userId)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      // Get interactions
      const { data: interactions } = await supabase
        .from('interactions')
        .select('id, lead_id')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      // Filter interactions by user's leads
      const { data: userLeadIds } = await supabase
        .from('leads')
        .select('id')
        .eq('user_id', userId);

      const userLeadIdSet = new Set(userLeadIds?.map(l => l.id) || []);
      const userInteractions = interactions?.filter(i => userLeadIdSet.has(i.lead_id)) || [];

      // Calculate metrics
      const newLeadsCount = newLeads?.length || 0;
      const closedWonCount = closedWon?.length || 0;
      const closedLostCount = closedLost?.length || 0;
      const totalRevenue = closedWon?.reduce((sum, l) => sum + (l.value || 0), 0) || 0;
      const conversationsCount = conversations?.length || 0;
      const messagesCount = messages?.length || 0;
      const aiResponsesCount = messages?.filter(m => m.is_ai_response).length || 0;
      const interactionsCount = userInteractions.length;

      // Calculate channel distribution
      const channelCounts: Record<string, number> = {};
      messages?.forEach(m => {
        channelCounts[m.channel] = (channelCounts[m.channel] || 0) + 1;
      });

      const channelDistribution = Object.entries(channelCounts)
        .map(([channel, count]) => `${channel}: ${count}`)
        .join(', ') || 'Nenhuma mensagem';

      // Format the report message
      const reportMessage = `📊 **Relatório Semanal de Desempenho**

📅 Período: ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}

**Leads:**
• Novos leads: ${newLeadsCount}
• Fechados (ganhos): ${closedWonCount}
• Fechados (perdidos): ${closedLostCount}
• Receita gerada: R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

**Conversas:**
• Novas conversas: ${conversationsCount}
• Total de mensagens: ${messagesCount}
• Respostas da IA: ${aiResponsesCount}
• Interações com leads: ${interactionsCount}

**Distribuição por Canal:**
${channelDistribution}

**Taxa de Conversão:**
${newLeadsCount > 0 ? ((closedWonCount / newLeadsCount) * 100).toFixed(1) : 0}%`;

      // Get a random lead ID for the notification link (or null if no leads)
      const { data: anyLead } = await supabase
        .from('leads')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      // Create in-app notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: '📊 Relatório Semanal',
          message: reportMessage,
          type: 'weekly_report',
          lead_id: anyLead?.id || null,
          is_read: false
        });

      if (notifError) {
        console.error(`Error creating notification for user ${userId}:`, notifError);
      } else {
        console.log(`Report notification sent to user ${userId}`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Weekly reports sent to ${userIds.length} users` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in weekly-report function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
