import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONSULTANT_EMAIL = "eggnunes@gmail.com";
const FROM_EMAIL = "Consultoria IDEA <naoresponda@rafaelegg.com>";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json();

    // Action: Send monthly progress reports to all active clients
    if (action === "send-monthly-reports") {
      console.log("Starting monthly reports sending...");

      // Get all active consulting clients
      const { data: clients, error: clientsError } = await supabase
        .from("consulting_clients")
        .select("*")
        .in("status", ["active", "in_progress"]);

      if (clientsError) throw clientsError;

      const results = [];

      for (const client of clients || []) {
        // Get sessions for this client
        const { data: sessions } = await supabase
          .from("consulting_sessions")
          .select("*")
          .eq("client_id", client.id)
          .order("session_date", { ascending: false });

        const completedSessions = sessions?.filter(s => s.status === "completed") || [];
        const scheduledSessions = sessions?.filter(s => s.status === "scheduled") || [];

        // Calculate progress
        const daysSinceStart = Math.floor(
          (Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        const lastSessionDate = completedSessions[0]?.session_date
          ? new Date(completedSessions[0].session_date).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
          : "Nenhuma sessão realizada";

        const nextSteps = completedSessions[0]?.next_steps || "A definir na próxima sessão";

        const siteUrl = Deno.env.get("SITE_URL") || "https://crmidea.lovable.app";

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
              .stats { display: flex; gap: 15px; flex-wrap: wrap; margin: 20px 0; }
              .stat { flex: 1; min-width: 120px; text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .stat-value { font-size: 28px; font-weight: bold; color: #6366f1; }
              .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
              .info-card { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .btn { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
              .highlight { background: #eef2ff; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📊 Relatório Mensal de Progresso</h1>
              <p>Consultoria IDEA - ${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
            </div>
            <div class="content">
              <p>Olá <strong>${client.full_name.split(" ")[0]}</strong>!</p>
              
              <p>Aqui está o resumo do seu progresso na consultoria de implementação de IA.</p>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${daysSinceStart}</div>
                  <div class="stat-label">Dias na consultoria</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${completedSessions.length}</div>
                  <div class="stat-label">Reuniões realizadas</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${scheduledSessions.length}</div>
                  <div class="stat-label">Reuniões agendadas</div>
                </div>
              </div>
              
              <div class="info-card">
                <h3>📅 Última Sessão</h3>
                <p>${lastSessionDate}</p>
              </div>
              
              <div class="info-card">
                <h3>✅ Próximos Passos Acordados</h3>
                <p>${nextSteps}</p>
              </div>
              
              <div class="highlight">
                <strong>💡 Dica:</strong> Mantenha o foco na implementação! Pequenas ações diárias geram grandes resultados ao longo do tempo.
              </div>
              
              <p style="text-align: center;">
                <a href="${siteUrl}/cliente-dashboard" class="btn">📈 Ver Dashboard Completo</a>
              </p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
                Qualquer dúvida, entre em contato!<br><br>
                Abraço,<br>
                <strong>Raphael Wegi - Consultoria IDEA</strong>
              </p>
            </div>
          </body>
          </html>
        `;

        try {
          const emailSubject = `📊 Seu Relatório Mensal - Consultoria IDEA`;
          const emailResponse = await resend.emails.send({
            from: FROM_EMAIL,
            to: [client.email],
            subject: emailSubject,
            html: emailHtml,
          });

          console.log(`Monthly report sent to ${client.email}:`, emailResponse);
          results.push({ clientId: client.id, email: client.email, success: true });

          // Log the sent email
          try {
            await supabase.from("sent_emails_log").insert({
              user_id: client.user_id,
              recipient_email: client.email,
              recipient_name: client.full_name,
              subject: emailSubject,
              email_type: "monthly_report",
              status: "sent",
              metadata: { days_in_consultancy: daysSinceStart, completed_sessions: completedSessions.length }
            });
          } catch (logError) {
            console.error("Error logging email:", logError);
          }
        } catch (emailError) {
          console.error(`Failed to send to ${client.email}:`, emailError);
          results.push({ clientId: client.id, email: client.email, success: false, error: String(emailError) });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: Check for inactive clients (30+ days without dashboard access)
    if (action === "check-inactive-clients") {
      console.log("Checking for inactive clients...");

      // Get all active consulting clients
      const { data: clients, error: clientsError } = await supabase
        .from("consulting_clients")
        .select("*")
        .in("status", ["active", "in_progress"]);

      if (clientsError) throw clientsError;

      const results = [];
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      for (const client of clients || []) {
        // Get last session
        const { data: lastSession } = await supabase
          .from("consulting_sessions")
          .select("session_date")
          .eq("client_id", client.id)
          .eq("status", "completed")
          .order("session_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get client profile last_active_at (tracks dashboard logins)
        const { data: clientProfile } = await supabase
          .from("client_profiles")
          .select("last_active_at, updated_at")
          .eq("email", client.email)
          .maybeSingle();

        // Calculate last activity as MAX of: last session, client updated_at, profile last_active_at
        const candidates = [
          lastSession?.session_date ? new Date(lastSession.session_date) : null,
          client.updated_at ? new Date(client.updated_at) : null,
          clientProfile?.last_active_at ? new Date(clientProfile.last_active_at) : null,
          clientProfile?.updated_at ? new Date(clientProfile.updated_at) : null,
        ].filter(Boolean) as Date[];

        const lastActivityDate = candidates.length > 0
          ? new Date(Math.max(...candidates.map(d => d.getTime())))
          : new Date(client.created_at);

        const daysSinceLastActivity = Math.floor(
          (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check cooldown: skip if inactivity email sent in last 7 days
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const { data: recentEmails } = await supabase
          .from("sent_emails_log")
          .select("id")
          .eq("recipient_email", client.email)
          .eq("email_type", "inactivity_reminder")
          .gte("created_at", sevenDaysAgo.toISOString())
          .limit(1);

        const hasCooldown = recentEmails && recentEmails.length > 0;

        if (daysSinceLastActivity >= 30 && !hasCooldown) {
          console.log(`Client ${client.full_name} inactive for ${daysSinceLastActivity} days`);

          const siteUrl = Deno.env.get("SITE_URL") || "https://crmidea.lovable.app";

          // Send engagement email to client
          const clientEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
                .highlight { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
                .btn { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
                .questions { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .question { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
                .question:last-child { border-bottom: none; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>👋 Sentimos sua falta!</h1>
                <p>Faz ${daysSinceLastActivity} dias desde nossa última interação</p>
              </div>
              <div class="content">
                <p>Olá <strong>${client.full_name.split(" ")[0]}</strong>!</p>
                
                <p>Percebemos que faz um tempo desde nossa última interação na consultoria. Gostaríamos de saber como está a implementação do sistema de IA no seu escritório!</p>
                
                <div class="highlight">
                  <strong>🎯 Seu compromisso é importante!</strong> O sucesso da consultoria depende da implementação contínua das ferramentas e práticas que discutimos.
                </div>
                
                <div class="questions">
                  <h3>📝 Por favor, nos conte:</h3>
                  <div class="question">✅ Como está a implementação do sistema?</div>
                  <div class="question">🤔 Encontrou alguma dificuldade?</div>
                  <div class="question">📊 Já está usando as ferramentas de IA no dia a dia?</div>
                  <div class="question">📅 Podemos agendar uma reunião de acompanhamento?</div>
                </div>
                
                <p>Responda este email ou acesse seu dashboard para agendar uma reunião de acompanhamento. Estou aqui para ajudar!</p>
                
                <p style="text-align: center;">
                  <a href="${siteUrl}/cliente-dashboard" class="btn">📈 Acessar Meu Dashboard</a>
                </p>
                
                <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
                  Aguardo seu retorno!<br><br>
                  Abraço,<br>
                  <strong>Raphael Wegi - Consultoria IDEA</strong>
                </p>
              </div>
            </body>
            </html>
          `;

          try {
            const clientSubject = `👋 Como está a implementação do sistema? - ${daysSinceLastActivity} dias`;
            const clientEmailResponse = await resend.emails.send({
              from: FROM_EMAIL,
              to: [client.email],
              subject: clientSubject,
              html: clientEmailHtml,
            });

            console.log(`Inactivity email sent to ${client.email}:`, clientEmailResponse);

            // Log the sent email to client
            try {
              await supabase.from("sent_emails_log").insert({
                user_id: client.user_id,
                recipient_email: client.email,
                recipient_name: client.full_name,
                subject: clientSubject,
                email_type: "inactivity_reminder",
                status: "sent",
                metadata: { days_since_last_activity: daysSinceLastActivity }
              });
            } catch (logError) {
              console.error("Error logging email:", logError);
            }

            // Also notify consultant
            const consultantSubject = `⚠️ Cliente Inativo: ${client.full_name} (${daysSinceLastActivity} dias)`;
            const consultantEmailHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
                  .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
                </style>
              </head>
              <body>
                <h2>⚠️ Cliente Inativo - ${daysSinceLastActivity} dias</h2>
                
                <div class="alert">
                  <strong>Cliente:</strong> ${client.full_name}<br>
                  <strong>Escritório:</strong> ${client.office_name}<br>
                  <strong>Email:</strong> ${client.email}<br>
                  <strong>Telefone:</strong> ${client.phone}<br>
                  <strong>Última atividade:</strong> ${daysSinceLastActivity} dias atrás
                </div>
                
                <p>Um email de engajamento foi enviado automaticamente para o cliente solicitando atualização sobre a implementação.</p>
                
                <p>Considere entrar em contato diretamente pelo WhatsApp para um acompanhamento mais próximo.</p>
              </body>
              </html>
            `;

            await resend.emails.send({
              from: FROM_EMAIL,
              to: [CONSULTANT_EMAIL],
              subject: consultantSubject,
              html: consultantEmailHtml,
            });

            // Log the sent email to consultant
            try {
              await supabase.from("sent_emails_log").insert({
                user_id: client.user_id,
                recipient_email: CONSULTANT_EMAIL,
                recipient_name: "Consultor",
                subject: consultantSubject,
                email_type: "inactivity_admin_alert",
                status: "sent",
                metadata: { client_name: client.full_name, days_since_last_activity: daysSinceLastActivity }
              });
            } catch (logError) {
              console.error("Error logging email:", logError);
            }

            results.push({
              clientId: client.id,
              email: client.email,
              daysSinceLastActivity,
              notified: true,
            });
          } catch (emailError) {
            console.error(`Failed to send inactivity email to ${client.email}:`, emailError);
            results.push({
              clientId: client.id,
              email: client.email,
              daysSinceLastActivity,
              notified: false,
              error: String(emailError),
            });
          }
        }
      }

      return new Response(JSON.stringify({ success: true, inactiveClients: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in client-monthly-report:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
