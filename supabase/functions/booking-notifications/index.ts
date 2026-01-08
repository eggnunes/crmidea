import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONSULTANT_EMAIL = "eggnunes@gmail.com";
const FROM_EMAIL = "Consultoria IDEA <naoresponda@rafaelegg.com>";

async function sendWhatsAppMessage(phone: string, message: string) {
  const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
  const zapiToken = Deno.env.get('ZAPI_TOKEN');
  const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

  if (!zapiInstanceId || !zapiToken) {
    console.log('Z-API credentials not configured, skipping WhatsApp notification');
    return false;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (zapiClientToken) {
    headers['Client-Token'] = zapiClientToken;
  }

  // Format phone number
  let formattedPhone = phone.replace(/\D/g, '');
  if (!formattedPhone.startsWith('55')) {
    formattedPhone = '55' + formattedPhone;
  }

  const zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`;

  try {
    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    });

    const data = await response.json();
    console.log(`WhatsApp message sent to ${formattedPhone}:`, data);
    return response.ok;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}

async function getTemplate(supabase: any, userId: string, templateType: string, defaultTemplate: string): Promise<{ template: string; isActive: boolean }> {
  try {
    const { data, error } = await supabase
      .from('booking_reminder_templates')
      .select('message_template, is_active')
      .eq('user_id', userId)
      .eq('template_type', templateType)
      .maybeSingle();

    if (error) {
      console.error('Error fetching template:', error);
      return { template: defaultTemplate, isActive: true };
    }

    if (data) {
      return { template: data.message_template, isActive: data.is_active };
    }

    return { template: defaultTemplate, isActive: true };
  } catch (error) {
    console.error('Error in getTemplate:', error);
    return { template: defaultTemplate, isActive: true };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, bookingData, userId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'booking-confirmation') {
      // Get owner's personal WhatsApp from follow_up_settings
      const { data: settings } = await supabase
        .from('follow_up_settings')
        .select('personal_whatsapp')
        .eq('user_id', userId)
        .maybeSingle();

      const ownerPhone = settings?.personal_whatsapp;
      const clientPhone = bookingData.phone;
      const clientName = bookingData.name;
      const startTime = new Date(bookingData.startTime);
      
      const formattedDate = startTime.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      const formattedTime = startTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const variables = {
        nome: clientName,
        email: bookingData.email || '',
        telefone: clientPhone || 'Não informado',
        data: formattedDate,
        horario: formattedTime,
        observacoes: bookingData.notes ? `📝 *Obs:* ${bookingData.notes}` : '',
      };

      const results = [];

      // Send confirmation to client if phone provided
      if (clientPhone) {
        const { template: clientTemplate, isActive: clientActive } = await getTemplate(
          supabase,
          userId,
          'booking_confirmation',
          `✅ *Agendamento Confirmado!*

Olá {{nome}}! Seu agendamento foi confirmado com sucesso.

📅 *Data:* {{data}}
🕐 *Horário:* {{horario}}

Você receberá um lembrete 30 minutos antes da sessão.

Obrigado por agendar! Nos vemos em breve. 🚀`
        );

        if (clientActive) {
          const clientMessage = replaceTemplateVariables(clientTemplate, variables);
          const clientSent = await sendWhatsAppMessage(clientPhone, clientMessage);
          results.push({ recipient: 'client', sent: clientSent });
        }
      }

      // Send notification to owner
      if (ownerPhone) {
        const { template: ownerTemplate, isActive: ownerActive } = await getTemplate(
          supabase,
          userId,
          'owner_notification',
          `📌 *Novo Agendamento!*

Um novo agendamento foi realizado:

👤 *Cliente:* {{nome}}
📧 *Email:* {{email}}
📱 *WhatsApp:* {{telefone}}
📅 *Data:* {{data}}
🕐 *Horário:* {{horario}}
{{observacoes}}`
        );

        if (ownerActive) {
          const ownerMessage = replaceTemplateVariables(ownerTemplate, variables);
          const ownerSent = await sendWhatsAppMessage(ownerPhone, ownerMessage);
          results.push({ recipient: 'owner', sent: ownerSent });
        }
      }

      // Send email notification to consultant (push notification alternative)
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center; }
              .content { background: #f0fdf4; padding: 20px; border-radius: 0 0 12px 12px; }
              .info { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>📅 Novo Agendamento Realizado!</h2>
            </div>
            <div class="content">
              <div class="info">
                <strong>👤 Cliente:</strong> ${clientName}<br>
                <strong>📧 Email:</strong> ${bookingData.email || 'Não informado'}<br>
                <strong>📱 WhatsApp:</strong> ${clientPhone || 'Não informado'}<br>
                <strong>📅 Data:</strong> ${formattedDate}<br>
                <strong>🕐 Horário:</strong> ${formattedTime}<br>
                ${bookingData.notes ? `<strong>📝 Obs:</strong> ${bookingData.notes}` : ''}
              </div>
              <p>O cliente já recebeu confirmação por WhatsApp (se o número foi informado).</p>
            </div>
          </body>
          </html>
        `;

        await resend.emails.send({
          from: FROM_EMAIL,
          to: [CONSULTANT_EMAIL],
          subject: `📅 Novo Agendamento: ${clientName} - ${formattedDate} às ${formattedTime}`,
          html: emailHtml,
        });

        console.log('Email notification sent to consultant');
        results.push({ recipient: 'consultant_email', sent: true });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        results.push({ recipient: 'consultant_email', sent: false, error: String(emailError) });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        results,
        message: 'Notifications sent'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'send-reminders') {
      // Find bookings that start in 30 minutes (with 5-minute window)
      const now = new Date();
      const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
      const thirtyFiveMinutesFromNow = new Date(now.getTime() + 35 * 60 * 1000);

      console.log(`Checking for bookings between ${thirtyMinutesFromNow.toISOString()} and ${thirtyFiveMinutesFromNow.toISOString()}`);

      const { data: upcomingBookings, error } = await supabase
        .from('calendar_availability')
        .select('*')
        .eq('is_booked', true)
        .gte('start_time', thirtyMinutesFromNow.toISOString())
        .lt('start_time', thirtyFiveMinutesFromNow.toISOString());

      if (error) {
        console.error('Error fetching upcoming bookings:', error);
        throw error;
      }

      console.log(`Found ${upcomingBookings?.length || 0} bookings starting in ~30 minutes`);

      const results = [];

      for (const booking of upcomingBookings || []) {
        const startTime = new Date(booking.start_time);
        const formattedTime = startTime.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        const formattedDate = startTime.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });

        const variables = {
          nome: booking.booked_by_name || '',
          email: booking.booked_by_email || '',
          telefone: booking.booked_by_phone || '',
          data: formattedDate,
          horario: formattedTime,
          observacoes: booking.booking_notes ? `📝 *Obs:* ${booking.booking_notes}` : '',
        };

        // Reminder for client
        if (booking.booked_by_phone) {
          const { template: reminderTemplate, isActive: reminderActive } = await getTemplate(
            supabase,
            booking.user_id,
            'reminder_30min',
            `⏰ *Lembrete de Sessão*

Olá {{nome}}! Sua sessão começa em 30 minutos.

🕐 *Horário:* {{horario}}

Prepare-se! Nos vemos em breve. 🚀`
          );

          if (reminderActive) {
            const reminderMessage = replaceTemplateVariables(reminderTemplate, variables);
            const sent = await sendWhatsAppMessage(booking.booked_by_phone, reminderMessage);
            results.push({ bookingId: booking.id, recipient: 'client', sent });
            console.log(`Reminder sent to ${booking.booked_by_phone}: ${sent}`);
          }
        }

        // Get owner's phone and send reminder
        const { data: settings } = await supabase
          .from('follow_up_settings')
          .select('personal_whatsapp')
          .eq('user_id', booking.user_id)
          .maybeSingle();

        if (settings?.personal_whatsapp) {
          const ownerReminderMessage = `⏰ *Lembrete: Sessão em 30 min*

👤 *Cliente:* ${booking.booked_by_name}
🕐 *Horário:* ${formattedTime}`;

          const sent = await sendWhatsAppMessage(settings.personal_whatsapp, ownerReminderMessage);
          results.push({ bookingId: booking.id, recipient: 'owner', sent });
          console.log(`Owner reminder sent: ${sent}`);
        }
      }

      return new Response(JSON.stringify({ 
        success: true,
        bookingsProcessed: upcomingBookings?.length || 0,
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in booking-notifications:', error);
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
