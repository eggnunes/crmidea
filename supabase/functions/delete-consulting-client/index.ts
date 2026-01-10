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

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const consultantId = user.id;

    const { clientId, clientEmail } = await req.json();

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "Client ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the client belongs to this consultant
    const { data: client, error: clientError } = await supabaseAdmin
      .from("consulting_clients")
      .select("id, email, user_id")
      .eq("id", clientId)
      .eq("user_id", consultantId)
      .maybeSingle();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: "Client not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const deletionResults: string[] = [];

    // 1. Delete related records in consulting tables
    await supabaseAdmin.from("consulting_sessions").delete().eq("client_id", clientId);
    deletionResults.push("consulting_sessions");

    await supabaseAdmin.from("consulting_client_reminders").delete().eq("client_id", clientId);
    deletionResults.push("consulting_client_reminders");

    await supabaseAdmin.from("consulting_client_documents").delete().eq("client_id", clientId);
    deletionResults.push("consulting_client_documents");

    await supabaseAdmin.from("client_progress_feedback").delete().eq("client_id", clientId);
    deletionResults.push("client_progress_feedback");

    await supabaseAdmin.from("client_earned_badges").delete().eq("client_id", clientId);
    deletionResults.push("client_earned_badges");

    // 2. Find the auth user associated with this client (by email)
    const clientEmailToDelete = clientEmail || client.email;
    let authUserDeleted = false;

    if (clientEmailToDelete) {
      // Find user in auth.users by email
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(u => u.email === clientEmailToDelete);

      if (authUser) {
        // Check if this user is a consulting client (has the metadata)
        const isConsultingClient = authUser.user_metadata?.is_consulting_client === true;
        const linkedConsultantId = authUser.user_metadata?.consultant_id;

        // Only delete if it's a consulting client linked to this consultant
        if (isConsultingClient && linkedConsultantId === consultantId) {
          // Delete diagnostic_form_progress
          await supabaseAdmin
            .from("diagnostic_form_progress")
            .delete()
            .eq("client_user_id", authUser.id);
          deletionResults.push("diagnostic_form_progress");

          // Delete client_profiles
          await supabaseAdmin
            .from("client_profiles")
            .delete()
            .eq("user_id", authUser.id);
          deletionResults.push("client_profiles");

          // Delete client_meeting_notes
          await supabaseAdmin
            .from("client_meeting_notes")
            .delete()
            .eq("client_user_id", authUser.id);
          deletionResults.push("client_meeting_notes");

          // Delete client_timeline_events
          await supabaseAdmin
            .from("client_timeline_events")
            .delete()
            .eq("client_user_id", authUser.id);
          deletionResults.push("client_timeline_events");

          // Delete the auth user
          const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
          if (!deleteUserError) {
            authUserDeleted = true;
            deletionResults.push("auth.users");
          } else {
            console.error("Error deleting auth user:", deleteUserError);
          }
        }
      }
    }

    // 3. Finally, delete the consulting_clients record
    const { error: deleteClientError } = await supabaseAdmin
      .from("consulting_clients")
      .delete()
      .eq("id", clientId);

    if (deleteClientError) {
      throw deleteClientError;
    }
    deletionResults.push("consulting_clients");

    console.log(`Client ${clientId} deleted. Cleaned up: ${deletionResults.join(", ")}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Cliente excluído com sucesso",
        deletedFrom: deletionResults,
        authUserDeleted,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in delete-consulting-client:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao excluir cliente" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
