import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1x1 transparent GIF
const TRANSPARENT_GIF = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0));

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get('c');
    const encodedEmail = url.searchParams.get('e');
    
    if (campaignId && encodedEmail) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const email = atob(encodedEmail);
      const userAgent = req.headers.get('user-agent') || null;
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || null;

      // Record the open
      await supabase.from('email_opens').insert({
        campaign_id: campaignId,
        lead_email: email,
        user_agent: userAgent,
        ip_address: ip,
      });

      // Also update campaign_recipients if exists
      const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .eq('email', email)
        .single();

      if (lead) {
        await supabase
          .from('campaign_recipients')
          .update({ opened_at: new Date().toISOString(), status: 'aberto' })
          .eq('campaign_id', campaignId)
          .eq('lead_id', lead.id);
      }

      console.log(`Email open tracked: campaign=${campaignId}, email=${email}`);
    }

    // Return transparent 1x1 GIF
    return new Response(TRANSPARENT_GIF, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error tracking email open:', error);
    // Still return the GIF to not break email display
    return new Response(TRANSPARENT_GIF, {
      headers: { 'Content-Type': 'image/gif' },
    });
  }
});