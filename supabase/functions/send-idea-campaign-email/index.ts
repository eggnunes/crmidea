import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email pessoal para receber cópia
const COPY_EMAIL = "eggnunes@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Get today's scheduled email
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Checking for scheduled emails for date: ${today}`);

    const { data: scheduledEmail, error: fetchError } = await supabase
      .from('scheduled_campaign_emails')
      .select('*')
      .eq('scheduled_date', today)
      .eq('status', 'pending')
      .single();

    if (fetchError || !scheduledEmail) {
      console.log('No scheduled email found for today');
      return new Response(
        JSON.stringify({ success: true, message: "No email scheduled for today" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found scheduled email #${scheduledEmail.email_number}: ${scheduledEmail.subject}`);

    // Mark as processing
    await supabase
      .from('scheduled_campaign_emails')
      .update({ status: 'processing' })
      .eq('id', scheduledEmail.id);

    // Get ALL leads with email (paginated to avoid 1000 row limit)
    let allLeads: { id: string; name: string; email: string }[] = [];
    let offset = 0;
    const PAGE_SIZE = 1000;
    
    while (true) {
      const { data: leadsPage, error: leadsError } = await supabase
        .from('leads')
        .select('id, name, email')
        .not('email', 'is', null)
        .neq('email', '')
        .range(offset, offset + PAGE_SIZE - 1);
      
      if (leadsError) {
        throw new Error(`Error fetching leads: ${leadsError.message}`);
      }
      
      if (!leadsPage || leadsPage.length === 0) break;
      
      allLeads = [...allLeads, ...leadsPage];
      
      if (leadsPage.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
    
    const leads = allLeads;

    console.log(`Found ${leads?.length || 0} leads with email`);

    // Get unsubscribed emails
    const { data: unsubscribed } = await supabase
      .from('email_unsubscribes')
      .select('email');

    const unsubscribedEmails = new Set(
      (unsubscribed || []).map(u => u.email.toLowerCase())
    );

    // Filter out unsubscribed
    const validLeads = (leads || []).filter(
      lead => lead.email && !unsubscribedEmails.has(lead.email.toLowerCase())
    );

    console.log(`${validLeads.length} valid leads after filtering unsubscribed`);

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Base URL for images
    const baseUrl = "https://crmidea.lovable.app";

    // Build HTML email
    const buildEmailHtml = (leadName: string, content: string, subject: string, imageUrl: string | null, ctaText: string | null, ctaUrl: string, leadEmail: string) => {
      const personalizedContent = content
        .replace(/\[NOME\]/gi, leadName || 'Advogado(a)')
        .replace(/\{nome\}/gi, leadName || 'Advogado(a)');

      // Parse content sections
      const lines = personalizedContent.split('\n');
      let htmlContent = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          htmlContent += '<br/>';
        } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          // Bold paragraph
          htmlContent += `<p style="margin: 15px 0; font-weight: bold; color: #1a1a2e;">${trimmedLine.replace(/\*\*/g, '')}</p>`;
        } else if (trimmedLine.startsWith('- ')) {
          // List item
          htmlContent += `<li style="margin: 8px 0; color: #333;">${trimmedLine.substring(2)}</li>`;
        } else if (trimmedLine.startsWith('✅')) {
          // Checkmark item
          htmlContent += `<p style="margin: 8px 0; color: #333;">${trimmedLine}</p>`;
        } else {
          htmlContent += `<p style="margin: 10px 0; color: #333; line-height: 1.6;">${trimmedLine}</p>`;
        }
      }

      // Generate unsubscribe link
      const encodedEmail = btoa(leadEmail);
      const unsubscribeUrl = `${supabaseUrl}/functions/v1/email-unsubscribe?email=${encodedEmail}`;

      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          
          ${imageUrl ? `
          <!-- Header Image -->
          <tr>
            <td style="padding: 0;">
              <img src="${baseUrl}${imageUrl}" alt="${subject}" style="width: 100%; height: auto; display: block; border-radius: 12px 12px 0 0;" />
            </td>
          </tr>
          ` : ''}
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <div style="font-size: 16px; line-height: 1.7; color: #333;">
                ${htmlContent}
              </div>
              
              ${ctaText ? `
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 15px rgba(102,126,234,0.4);">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>
          
          <!-- Consultoria Link -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 8px; padding: 20px;">
                <tr>
                  <td align="center" style="padding: 20px;">
                    <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 14px;">Quer transformar seu escritório com IA?</p>
                    <a href="https://rafaelegg.com/consultoria" style="color: #667eea; font-weight: bold; font-size: 16px; text-decoration: none;">
                      rafaelegg.com/consultoria
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">
                      <strong>Rafael Egg</strong><br/>
                      Consultoria IDEA - Inteligência de Dados e Artificial<br/>
                      Prêmio Melhor Escritório em IA do Brasil 2025
                    </p>
                    <p style="margin: 0; color: #999; font-size: 12px;">
                      Você está recebendo este e-mail porque se inscreveu em nossa lista.
                    </p>
                    <p style="margin: 10px 0 0 0;">
                      <a href="${unsubscribeUrl}" style="color: #999; font-size: 12px; text-decoration: underline;">
                        Cancelar inscrição
                      </a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    };

    // Send emails in batches
    const BATCH_SIZE = 50;
    const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds

    for (let i = 0; i < validLeads.length; i += BATCH_SIZE) {
      const batch = validLeads.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map(async (lead) => {
        try {
          const html = buildEmailHtml(
            lead.name,
            scheduledEmail.content,
            scheduledEmail.subject,
            scheduledEmail.image_url,
            scheduledEmail.cta_text,
            scheduledEmail.cta_url,
            lead.email
          );

          const encodedEmail = btoa(lead.email);
          const unsubscribeUrl = `${supabaseUrl}/functions/v1/email-unsubscribe?email=${encodedEmail}`;

          await resend.emails.send({
            from: "Rafael Egg <contato@rafaelegg.com>",
            to: [lead.email],
            subject: scheduledEmail.subject,
            html: html,
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          });

          return { success: true };
        } catch (error) {
          console.error(`Error sending to ${lead.email}:`, error);
          return { success: false, email: lead.email, error: String(error) };
        }
      });

      const results = await Promise.all(promises);
      
      for (const result of results) {
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          if (result.email) {
            errors.push(`${result.email}: ${result.error}`);
          }
        }
      }

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < validLeads.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    // Send copy to personal email
    try {
      const copyHtml = buildEmailHtml(
        "Rafael (CÓPIA)",
        scheduledEmail.content,
        scheduledEmail.subject,
        scheduledEmail.image_url,
        scheduledEmail.cta_text,
        scheduledEmail.cta_url,
        COPY_EMAIL
      );

      await resend.emails.send({
        from: "Rafael Egg <contato@rafaelegg.com>",
        to: [COPY_EMAIL],
        subject: `[CÓPIA] ${scheduledEmail.subject}`,
        html: copyHtml,
      });

      console.log(`Copy sent to ${COPY_EMAIL}`);
    } catch (copyError) {
      console.error(`Error sending copy to ${COPY_EMAIL}:`, copyError);
    }

    // Update scheduled email status
    await supabase
      .from('scheduled_campaign_emails')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        recipients_count: validLeads.length,
        success_count: successCount,
        failed_count: failedCount,
      })
      .eq('id', scheduledEmail.id);

    console.log(`Campaign email #${scheduledEmail.email_number} completed: ${successCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email #${scheduledEmail.email_number} sent`,
        stats: {
          total: validLeads.length,
          success: successCount,
          failed: failedCount,
        },
        errors: errors.slice(0, 10), // Limit error details
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-idea-campaign-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
