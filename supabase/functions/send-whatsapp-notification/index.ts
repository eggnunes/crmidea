import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FollowUpRequest {
  leadId: string;
  leadName: string;
  subscriberId: string;
  daysSinceLastInteraction: number;
  product: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const manychatApiKey = Deno.env.get('MANYCHAT_API_KEY');
    if (!manychatApiKey) {
      console.error('MANYCHAT_API_KEY not configured');
      throw new Error('ManyChat API key not configured');
    }

    const { leadId, leadName, subscriberId, daysSinceLastInteraction, product }: FollowUpRequest = await req.json();
    
    console.log(`Sending WhatsApp notification for lead ${leadId} (${leadName})`);
    console.log(`Days since last interaction: ${daysSinceLastInteraction}`);
    console.log(`Product: ${product}`);
    console.log(`Subscriber ID: ${subscriberId}`);

    // Send message via ManyChat API
    // Using the sendContent endpoint to trigger a flow or send a message
    const response = await fetch(`https://api.manychat.com/fb/sending/sendContent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${manychatApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriber_id: subscriberId,
        data: {
          version: "v2",
          content: {
            messages: [
              {
                type: "text",
                text: `🔔 Lembrete de Follow-up\n\nO lead "${leadName}" está há ${daysSinceLastInteraction} dias sem interação.\n\nProduto de interesse: ${product}\n\nNão esqueça de fazer o acompanhamento!`
              }
            ]
          }
        }
      }),
    });

    const responseData = await response.json();
    console.log('ManyChat API response:', JSON.stringify(responseData));

    if (!response.ok) {
      console.error('ManyChat API error:', responseData);
      throw new Error(`ManyChat API error: ${JSON.stringify(responseData)}`);
    }

    // Log the notification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // We need to get the user_id from the lead
    const { data: lead } = await supabase
      .from('leads')
      .select('user_id')
      .eq('id', leadId)
      .single();

    if (lead) {
      await supabase.from('follow_up_logs').insert({
        lead_id: leadId,
        user_id: lead.user_id,
        notification_type: 'whatsapp',
        status: 'sent',
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});