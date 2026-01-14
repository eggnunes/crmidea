import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EtapaPrompt {
  id: number;
  titulo: string;
  categoria: string;
  prioridade: 'alta' | 'media' | 'baixa';
  ordem: number;
  concluida?: boolean;
  data_conclusao?: string;
}

interface ClientMetrics {
  clientId: string;
  clientName: string;
  email: string;
  officeName: string;
  totalSteps: number;
  completedSteps: number;
  completionPercent: number;
  lastActivity: string | null;
  daysSinceLastActivity: number | null;
  status: 'ativo' | 'inativo' | 'travado' | 'completo';
  nextStep: string | null;
  nextStepOrder: number | null;
  highPriorityPending: number;
  etapas: EtapaPrompt[];
}

interface AdminReportData {
  totalClients: number;
  completedClients: number;
  halfwayClients: number;
  startingClients: number;
  inactiveClients: number;
  stuckClients: number;
  stuckList: ClientMetrics[];
  inactiveList: ClientMetrics[];
  successList: ClientMetrics[];
  averageCompletion: number;
  weekStart: string;
  weekEnd: string;
}

function calculateDaysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getClientStatus(daysSince: number | null, completionPercent: number): 'ativo' | 'inativo' | 'travado' | 'completo' {
  if (completionPercent === 100) return 'completo';
  if (daysSince === null) return 'ativo'; // No activity yet, considered new
  if (daysSince > 14) return 'travado';
  if (daysSince > 7) return 'inativo';
  return 'ativo';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

function generateProgressBar(percent: number): string {
  const filled = Math.round(percent / 6.25);
  const empty = 16 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getWeeklyTip(currentStep: number): string {
  const tips = [
    "💡 Ao colar o prompt no Lovable, aguarde a geração completa antes de fazer modificações.",
    "💡 Salve a URL do seu projeto logo após a Etapa 1 para continuar do mesmo ponto.",
    "💡 Teste cada funcionalidade assim que ela for gerada para identificar ajustes necessários.",
    "💡 Se algo não ficou como esperado, você pode pedir ajustes específicos ao Lovable.",
    "💡 Considere adicionar personalizações visuais após concluir as etapas principais.",
    "💡 Faça backup do seu projeto publicando-o regularmente.",
  ];
  return tips[currentStep % tips.length];
}

function generateAdminEmailHtml(data: AdminReportData): string {
  const stuckHtml = data.stuckList.length > 0 
    ? data.stuckList.map((c, i) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${i + 1}. ${c.clientName}</strong><br>
          <span style="color: #666; font-size: 14px;">
            ${c.completionPercent}% concluído - Travado na Etapa ${c.nextStepOrder || '?'} há ${c.daysSinceLastActivity} dias<br>
            Última atividade: ${c.lastActivity ? formatDate(new Date(c.lastActivity)) : 'Nunca'}<br>
            Próxima etapa: ${c.nextStep || 'N/A'}
          </span>
        </td>
      </tr>
    `).join('')
    : '<tr><td style="padding: 12px; color: #666;">Nenhum cliente travado! 🎉</td></tr>';

  const inactiveHtml = data.inactiveList.length > 0
    ? data.inactiveList.map((c, i) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${i + 1}. ${c.clientName}</strong> - ${c.completionPercent}% concluído - Inativo há ${c.daysSinceLastActivity} dias
        </td>
      </tr>
    `).join('')
    : '<tr><td style="padding: 12px; color: #666;">Nenhum cliente inativo! 🎉</td></tr>';

  const successHtml = data.successList.length > 0
    ? data.successList.map(c => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          ✅ <strong>${c.clientName}</strong> completou 100% da implementação!
        </td>
      </tr>
    `).join('')
    : '<tr><td style="padding: 12px; color: #666;">Nenhuma conclusão nesta semana</td></tr>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #eee; border-radius: 0 0 10px 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .section { margin: 25px 0; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        .danger { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; }
        .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; }
        table { width: 100%; border-collapse: collapse; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">📊 Relatório Semanal - Consultoria IDEA</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Semana de ${data.weekStart} a ${data.weekEnd}</p>
        </div>
        
        <div class="content">
          <div class="section">
            <div class="section-title">📈 VISÃO GERAL</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${data.totalClients}</div>
                <div class="stat-label">Clientes Ativos</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.completedClients}</div>
                <div class="stat-label">100% Concluído</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${Math.round(data.averageCompletion)}%</div>
                <div class="stat-label">Média de Conclusão</div>
              </div>
            </div>
            <table>
              <tr>
                <td style="padding: 8px;">Clientes com 50-99% concluído:</td>
                <td style="padding: 8px; font-weight: bold;">${data.halfwayClients}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">Clientes com 0-49% concluído:</td>
                <td style="padding: 8px; font-weight: bold;">${data.startingClients}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">Clientes inativos (7-14 dias):</td>
                <td style="padding: 8px; font-weight: bold; color: #ffc107;">${data.inactiveClients}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">Clientes travados (14+ dias):</td>
                <td style="padding: 8px; font-weight: bold; color: #dc3545;">${data.stuckClients}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">⚠️ ATENÇÃO NECESSÁRIA</div>
            
            <div class="danger">
              <strong>🔴 TRAVADOS (> 14 dias sem atividade):</strong>
              <table>${stuckHtml}</table>
            </div>
            
            <div class="warning">
              <strong>🟡 INATIVOS (7-14 dias sem atividade):</strong>
              <table>${inactiveHtml}</table>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🎉 SUCESSOS DA SEMANA</div>
            <div class="success">
              <table>${successHtml}</table>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <a href="https://crmidea.lovable.app/consultoria" 
               style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Ver Dashboard Completo
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateClientEmailHtml(metrics: ClientMetrics, tip: string): string {
  const statusEmoji = {
    'ativo': '🟢',
    'inativo': '🟡',
    'travado': '🔴',
    'completo': '🎉'
  };

  const statusText = {
    'ativo': 'Ativo',
    'inativo': 'Inativo',
    'travado': 'Travado',
    'completo': 'Concluído!'
  };

  let statusMessage = '';
  if (metrics.status === 'ativo' && metrics.completionPercent < 100) {
    statusMessage = `
      <div style="background: #d4edda; padding: 20px; border-radius: 8px; text-align: center;">
        🎉 <strong>Parabéns!</strong> Você está fazendo um ótimo progresso!<br>
        Continue assim e sua intranet estará pronta em breve.
      </div>
    `;
  } else if (metrics.status === 'inativo') {
    statusMessage = `
      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; text-align: center;">
        ⏰ Notamos que você não avançou nos últimos ${metrics.daysSinceLastActivity} dias.<br>
        <strong>Precisa de ajuda? Estamos aqui para apoiar!</strong>
      </div>
    `;
  } else if (metrics.status === 'travado') {
    statusMessage = `
      <div style="background: #f8d7da; padding: 20px; border-radius: 8px; text-align: center;">
        ⚠️ Parece que você está com dificuldades na Etapa ${metrics.nextStepOrder}.<br>
        <strong>Vamos resolver isso juntos!</strong>
      </div>
    `;
  } else if (metrics.status === 'completo') {
    statusMessage = `
      <div style="background: #d4edda; padding: 20px; border-radius: 8px; text-align: center;">
        🎉🎉🎉 <strong>PARABÉNS!</strong> 🎉🎉🎉<br>
        Você completou 100% da implementação da sua intranet!
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #fff; padding: 30px; border: 1px solid #eee; border-radius: 0 0 10px 10px; }
        .progress-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .progress-bar { font-family: monospace; font-size: 16px; letter-spacing: 2px; color: #667eea; }
        .next-step { background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .tip { background: #fff8e1; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">📊 Seu Progresso Semanal</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Intranet Personalizada</p>
        </div>
        
        <div class="content">
          <p>Olá <strong>${metrics.clientName}</strong>! 👋</p>
          <p>Aqui está o resumo do seu progresso na implementação da sua intranet:</p>

          <div class="progress-section">
            <h3 style="margin-top: 0;">📊 SEU PROGRESSO</h3>
            <p>
              <strong>Etapas concluídas:</strong> ${metrics.completedSteps} de ${metrics.totalSteps} (${metrics.completionPercent}%)<br>
              <span class="progress-bar">[${generateProgressBar(metrics.completionPercent)}] ${metrics.completionPercent}%</span>
            </p>
            <p>
              <strong>Última atividade:</strong> ${metrics.lastActivity ? `há ${metrics.daysSinceLastActivity} dias` : 'Ainda não iniciou'}<br>
              <strong>Status:</strong> ${statusEmoji[metrics.status]} ${statusText[metrics.status]}
            </p>
          </div>

          ${metrics.nextStep ? `
            <div class="next-step">
              <h3 style="margin-top: 0;">🎯 PRÓXIMA ETAPA</h3>
              <p>
                <strong>ETAPA ${metrics.nextStepOrder}: ${metrics.nextStep}</strong>
              </p>
            </div>
          ` : ''}

          ${statusMessage}

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://crmidea.lovable.app/cliente" class="cta-button">
              Acessar Sistema e Continuar →
            </a>
          </div>

          <div class="tip">
            <strong>💡 DICA DA SEMANA:</strong><br>
            ${tip}
          </div>

          <div class="footer">
            <p>Qualquer dúvida, estou à disposição!</p>
            <p><strong>Rafael Egg</strong><br>Consultoria IDEA</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function processClients(supabase: any): Promise<{ adminData: AdminReportData; clientMetrics: ClientMetrics[] }> {
  // Fetch all active consulting clients with fragmented prompts
  const { data: clients, error } = await supabase
    .from('consulting_clients')
    .select('id, full_name, email, office_name, fragmented_prompts, status')
    .not('fragmented_prompts', 'is', null);

  if (error) {
    throw new Error(`Error fetching clients: ${error.message}`);
  }

  const clientMetrics: ClientMetrics[] = [];
  
  for (const client of clients || []) {
    const etapas: EtapaPrompt[] = client.fragmented_prompts || [];
    const totalSteps = etapas.length;
    const completedSteps = etapas.filter(e => e.concluida).length;
    const completionPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    
    // Find last completed step
    const completedEtapas = etapas.filter(e => e.concluida && e.data_conclusao);
    let lastActivity: string | null = null;
    if (completedEtapas.length > 0) {
      const sorted = completedEtapas.sort((a, b) => 
        new Date(b.data_conclusao!).getTime() - new Date(a.data_conclusao!).getTime()
      );
      lastActivity = sorted[0].data_conclusao!;
    }
    
    const daysSince = calculateDaysSince(lastActivity);
    const status = getClientStatus(daysSince, completionPercent);
    
    // Find next step
    const pendingEtapas = etapas.filter(e => !e.concluida).sort((a, b) => a.ordem - b.ordem);
    const nextStep = pendingEtapas[0]?.titulo || null;
    const nextStepOrder = pendingEtapas[0]?.ordem || null;
    
    // Count high priority pending
    const highPriorityPending = etapas.filter(e => !e.concluida && e.prioridade === 'alta').length;
    
    clientMetrics.push({
      clientId: client.id,
      clientName: client.full_name,
      email: client.email,
      officeName: client.office_name,
      totalSteps,
      completedSteps,
      completionPercent,
      lastActivity,
      daysSinceLastActivity: daysSince,
      status,
      nextStep,
      nextStepOrder,
      highPriorityPending,
      etapas
    });
  }

  // Calculate admin report data
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const adminData: AdminReportData = {
    totalClients: clientMetrics.length,
    completedClients: clientMetrics.filter(c => c.status === 'completo').length,
    halfwayClients: clientMetrics.filter(c => c.completionPercent >= 50 && c.completionPercent < 100).length,
    startingClients: clientMetrics.filter(c => c.completionPercent < 50).length,
    inactiveClients: clientMetrics.filter(c => c.status === 'inativo').length,
    stuckClients: clientMetrics.filter(c => c.status === 'travado').length,
    stuckList: clientMetrics.filter(c => c.status === 'travado'),
    inactiveList: clientMetrics.filter(c => c.status === 'inativo'),
    successList: clientMetrics.filter(c => c.status === 'completo'),
    averageCompletion: clientMetrics.length > 0 
      ? clientMetrics.reduce((acc, c) => acc + c.completionPercent, 0) / clientMetrics.length 
      : 0,
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(now)
  };

  return { adminData, clientMetrics };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");
    const resend = new Resend(resendApiKey);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { sendAdminReport = true, sendClientReports = true, testMode = false } = await req.json().catch(() => ({}));

    console.log("Starting weekly progress report generation...");
    console.log(`Options: sendAdminReport=${sendAdminReport}, sendClientReports=${sendClientReports}, testMode=${testMode}`);

    const { adminData, clientMetrics } = await processClients(supabase);

    console.log(`Processed ${clientMetrics.length} clients`);

    const results = {
      adminReportSent: false,
      clientReportsSent: 0,
      errors: [] as string[]
    };

    // Get admin email from consultant settings
    const { data: settings } = await supabase
      .from('consultant_notification_settings')
      .select('consultant_email, from_email_address, from_email_name')
      .limit(1)
      .single();

    const adminEmail = settings?.consultant_email || 'rafaeloliveiragg@icloud.com';
    const fromEmail = settings?.from_email_address || 'onboarding@resend.dev';
    const fromName = settings?.from_email_name || 'Consultoria IDEA';

    // Send admin report
    if (sendAdminReport && !testMode) {
      try {
        const adminHtml = generateAdminEmailHtml(adminData);
        
        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [adminEmail],
          subject: `📊 Relatório Semanal - Consultoria IDEA (${adminData.weekStart} a ${adminData.weekEnd})`,
          html: adminHtml
        });

        // Save report to database
        await supabase.from('progress_reports').insert({
          client_id: null,
          report_type: 'admin',
          metrics: adminData,
          email_sent: true
        });

        results.adminReportSent = true;
        console.log("Admin report sent successfully");
      } catch (error: unknown) {
        console.error("Error sending admin report:", error);
        const msg = error instanceof Error ? error.message : String(error);
        results.errors.push(`Admin report: ${msg}`);
      }
    }

    // Send client reports
    if (sendClientReports && !testMode) {
      for (const metrics of clientMetrics) {
        if (!metrics.email) {
          console.log(`Skipping client ${metrics.clientName} - no email`);
          continue;
        }

        try {
          const tip = getWeeklyTip(metrics.nextStepOrder || 1);
          const clientHtml = generateClientEmailHtml(metrics, tip);

          await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: [metrics.email],
            subject: `📊 Seu Progresso - Intranet Personalizada (${metrics.completionPercent}% concluído)`,
            html: clientHtml
          });

          // Save report to database
          await supabase.from('progress_reports').insert({
            client_id: metrics.clientId,
            report_type: 'client',
            metrics: metrics,
            email_sent: true
          });

          results.clientReportsSent++;
          console.log(`Client report sent to ${metrics.clientName}`);
        } catch (error: unknown) {
          console.error(`Error sending report to ${metrics.clientName}:`, error);
          const msg = error instanceof Error ? error.message : String(error);
          results.errors.push(`${metrics.clientName}: ${msg}`);
        }
      }
    }

    // Return test data if in test mode
    if (testMode) {
      return new Response(JSON.stringify({
        success: true,
        testMode: true,
        adminData,
        clientMetrics,
        adminEmailHtml: generateAdminEmailHtml(adminData),
        sampleClientEmailHtml: clientMetrics.length > 0 
          ? generateClientEmailHtml(clientMetrics[0], getWeeklyTip(1))
          : null
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      ...results,
      summary: {
        totalClients: adminData.totalClients,
        averageCompletion: Math.round(adminData.averageCompletion),
        stuckClients: adminData.stuckClients,
        inactiveClients: adminData.inactiveClients
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: unknown) {
    console.error("Error in weekly-progress-report:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: msg 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);
