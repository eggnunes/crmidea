import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify authentication - must be admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin (the main consultant)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Access denied - not an admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userEmail } = await req.json();

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "User email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the orphaned user
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const orphanedUser = authUsers?.users?.find(u => u.email === userEmail);

    if (!orphanedUser) {
      return new Response(
        JSON.stringify({ error: "User not found", email: userEmail }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify this is a consulting client, not the main admin
    const isConsultingClient = orphanedUser.user_metadata?.is_consulting_client === true;
    if (!isConsultingClient) {
      return new Response(
        JSON.stringify({ error: "Cannot delete - not a consulting client account" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete associated records
    await supabaseAdmin.from("diagnostic_form_progress").delete().eq("client_user_id", orphanedUser.id);
    await supabaseAdmin.from("client_profiles").delete().eq("user_id", orphanedUser.id);
    await supabaseAdmin.from("client_meeting_notes").delete().eq("client_user_id", orphanedUser.id);
    await supabaseAdmin.from("client_timeline_events").delete().eq("client_user_id", orphanedUser.id);

    // Delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(orphanedUser.id);
    
    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Orphaned user deleted",
        deletedUserId: orphanedUser.id,
        deletedEmail: userEmail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete user" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
