import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProgressNotification {
  clientId: string;
  clientName: string;
  implementationStatus: string;
  achievements?: string;
  mainChallenges?: string;
  needsHelp?: boolean;
  helpDetails?: string;
}

const statusLabels: Record<string, string> = {
  "not_started": "Ainda não comecei",
  "in_progress": "Em andamento",
  "completed": "Implementação concluída",
  "blocked": "Travado/Preciso de ajuda",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
    const zapiToken = Deno.env.get('ZAPI_TOKEN');
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!zapiInstanceId || !zapiToken) {
      console.error('Z-API credentials not configured');
      return new Response(JSON.stringify({ success: false, error: 'Z-API not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      clientId, 
      clientName, 
      implementationStatus, 
      achievements, 
      mainChallenges, 
      needsHelp, 
      helpDetails 
    }: ProgressNotification = await req.json();

    console.log(`Sending progress notification for client ${clientName}`);

    // Get admin's personal WhatsApp from follow_up_settings
    const { data: settings, error: settingsError } = await supabase
      .from('follow_up_settings')
      .select('personal_whatsapp, user_id')
      .limit(1)
      .single();

    if (settingsError || !settings?.personal_whatsapp) {
      console.error('No personal WhatsApp configured:', settingsError);
      return new Response(JSON.stringify({ success: false, error: 'No personal WhatsApp configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format phone number
    let formattedPhone = settings.personal_whatsapp.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }

    // Build message
    const statusLabel = statusLabels[implementationStatus] || implementationStatus;
    
    let message = `🔔 *Atualização de Progresso*\n\n`;
    message += `👤 *Cliente:* ${clientName}\n`;
    message += `📊 *Status:* ${statusLabel}\n`;
    
    if (achievements) {
      message += `\n✅ *Conquistas:*\n${achievements}\n`;
    }
    
    if (mainChallenges) {
      message += `\n⚠️ *Desafios:*\n${mainChallenges}\n`;
    }
    
    if (needsHelp) {
      message += `\n🚨 *PRECISA DE AJUDA URGENTE!*\n`;
      if (helpDetails) {
        message += `${helpDetails}\n`;
      }
    }

    // Send via Z-API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (zapiClientToken) {
      headers['Client-Token'] = zapiClientToken;
    }

    const zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`;
    
    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    });

    const responseData = await response.json();
    console.log('Z-API response:', JSON.stringify(responseData));

    if (!response.ok) {
      throw new Error(`Z-API error: ${JSON.stringify(responseData)}`);
    }

    // Also create a timeline event for this
    const { data: client } = await supabase
      .from('consulting_clients')
      .select('email')
      .eq('id', clientId)
      .single();

    if (client) {
      // Find the client profile to get user_id
      const { data: profile } = await supabase
        .from('client_profiles')
        .select('user_id')
        .eq('email', client.email)
        .maybeSingle();

      if (profile) {
        await supabase.from('client_timeline_events').insert({
          client_user_id: profile.user_id,
          consultant_id: settings.user_id,
          event_type: 'progress_update',
          title: `Atualização de progresso: ${statusLabel}`,
          description: achievements || mainChallenges || 'Cliente enviou atualização de progresso',
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Notification sent successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending progress notification:', error);
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
