import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RECOVERY_FLOW_ID = 'ns_lembrete_carrinho'; // Flow para recuperação de carrinho

interface AbandonedCartRequest {
  leadId: string;
  leadName: string;
  subscriberId: string;
  productName: string;
  phone?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const manychatApiKey = Deno.env.get('MANYCHAT_API_KEY');
    
    if (!manychatApiKey) {
      console.error('MANYCHAT_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'ManyChat API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const { leadId, leadName, subscriberId, productName, phone }: AbandonedCartRequest = await req.json();
    console.log('Processing abandoned cart alert for:', leadName, 'Product:', productName);

    let targetSubscriberId = subscriberId;

    // If no subscriber ID but phone provided, try to find subscriber
    if (!targetSubscriberId && phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      console.log('Searching for subscriber by phone:', cleanPhone);
      
      const findResponse = await fetch('https://api.manychat.com/fb/subscriber/findBySystemField', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${manychatApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field_name: 'whatsapp_phone',
          field_value: cleanPhone,
        }),
      });

      const findData = await findResponse.json();
      console.log('Find subscriber response:', findData);

      if (findData.status === 'success' && findData.data?.id) {
        targetSubscriberId = findData.data.id;
      }
    }

    if (!targetSubscriberId) {
      console.log('No subscriber found for abandoned cart alert');
      return new Response(
        JSON.stringify({ success: false, error: 'Subscriber not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Set custom fields for the recovery message
    console.log('Setting custom fields for subscriber:', targetSubscriberId);
    
    const setFieldsResponse = await fetch('https://api.manychat.com/fb/subscriber/setCustomFields', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${manychatApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriber_id: targetSubscriberId,
        fields: [
          { field_name: 'lead_name', field_value: leadName },
          { field_name: 'product_name', field_value: productName },
          { field_name: 'cart_abandoned_at', field_value: new Date().toISOString() },
        ],
      }),
    });

    const setFieldsData = await setFieldsResponse.json();
    console.log('Set custom fields response:', setFieldsData);

    // Send recovery flow
    console.log('Sending recovery flow:', RECOVERY_FLOW_ID);
    
    const sendFlowResponse = await fetch('https://api.manychat.com/fb/sending/sendFlow', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${manychatApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriber_id: targetSubscriberId,
        flow_ns: RECOVERY_FLOW_ID,
      }),
    });

    const sendFlowData = await sendFlowResponse.json();
    console.log('Send flow response:', sendFlowData);

    // Log the notification in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user_id from lead
    const { data: lead } = await supabase
      .from('leads')
      .select('user_id')
      .eq('id', leadId)
      .single();

    if (lead?.user_id) {
      await supabase.from('follow_up_logs').insert({
        user_id: lead.user_id,
        lead_id: leadId,
        notification_type: 'abandoned_cart_recovery',
        status: sendFlowData.status === 'success' ? 'sent' : 'failed',
        error_message: sendFlowData.status !== 'success' ? JSON.stringify(sendFlowData) : null,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: sendFlowData.status === 'success',
        subscriber_id: targetSubscriberId,
        flow_sent: sendFlowData.status === 'success',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Abandoned cart alert error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
