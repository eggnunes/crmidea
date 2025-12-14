import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FLOW_ID = 'content20251214024458_954194';

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

    // Step 1: Set Custom Fields for the subscriber
    console.log('Setting custom fields...');
    const setFieldsResponse = await fetch(`https://api.manychat.com/fb/subscriber/setCustomFields`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${manychatApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriber_id: parseInt(subscriberId),
        fields: [
          { field_name: 'lead_name', field_value: leadName },
          { field_name: 'days_inactive', field_value: String(daysSinceLastInteraction) },
          { field_name: 'product_name', field_value: product }
        ]
      }),
    });

    const setFieldsData = await setFieldsResponse.json();
    console.log('Set Custom Fields response:', JSON.stringify(setFieldsData));

    if (!setFieldsResponse.ok) {
      console.error('Failed to set custom fields:', setFieldsData);
      throw new Error(`Failed to set custom fields: ${JSON.stringify(setFieldsData)}`);
    }

    // Step 2: Send the Flow with the approved template
    console.log('Sending Flow...');
    const response = await fetch(`https://api.manychat.com/fb/sending/sendFlow`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${manychatApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriber_id: parseInt(subscriberId),
        flow_ns: FLOW_ID
      }),
    });

    const responseData = await response.json();
    console.log('ManyChat sendFlow response:', JSON.stringify(responseData));

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