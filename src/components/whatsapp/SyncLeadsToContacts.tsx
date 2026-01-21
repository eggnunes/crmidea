import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const BATCH_SIZE = 500;

export function SyncLeadsToContacts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const syncLeadsToContacts = async () => {
    if (!user) return;

    setSyncing(true);
    try {
      // Get all leads with phone numbers using pagination to bypass 1000 row limit
      let allLeads: { id: string; name: string; phone: string | null }[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: leads, error: leadsError } = await supabase
          .from("leads")
          .select("id, name, phone")
          .eq("user_id", user.id)
          .not("phone", "is", null)
          .range(from, from + BATCH_SIZE - 1);

        if (leadsError) throw leadsError;

        if (leads && leads.length > 0) {
          allLeads = [...allLeads, ...leads];
          from += BATCH_SIZE;
          hasMore = leads.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      if (allLeads.length === 0) {
        toast({
          title: "Info",
          description: "Nenhum lead com telefone encontrado",
        });
        setSyncing(false);
        return;
      }

      // Get existing contacts
      const { data: existingContacts, error: contactsError } = await supabase
        .from("whatsapp_contacts")
        .select("phone")
        .eq("user_id", user.id);

      if (contactsError) throw contactsError;

      const existingPhones = new Set(
        existingContacts?.map(c => c.phone.replace(/\D/g, "")) || []
      );

      // Filter leads that are not yet contacts
      const newContacts = allLeads.filter(lead => {
        if (!lead.phone) return false;
        const normalizedPhone = lead.phone.replace(/\D/g, "");
        return !existingPhones.has(normalizedPhone);
      });

      if (newContacts.length === 0) {
        toast({
          title: "Info",
          description: "Todos os leads já estão cadastrados como contatos",
        });
        setSyncing(false);
        return;
      }

      // Insert new contacts in batches
      const contactsToInsert = newContacts.map(lead => ({
        user_id: user.id,
        phone: lead.phone!.replace(/\D/g, ""),
        name: lead.name,
      }));

      // Insert in batches of 100 to avoid payload size issues
      const insertBatchSize = 100;
      let insertedCount = 0;
      
      for (let i = 0; i < contactsToInsert.length; i += insertBatchSize) {
        const batch = contactsToInsert.slice(i, i + insertBatchSize);
        const { error: insertError } = await supabase
          .from("whatsapp_contacts")
          .insert(batch);

        if (insertError) {
          console.error("Error inserting batch:", insertError);
          // Continue with other batches even if one fails
        } else {
          insertedCount += batch.length;
        }
      }

      toast({
        title: "Sucesso",
        description: `${insertedCount} lead(s) sincronizado(s) como contatos`,
      });
    } catch (error) {
      console.error("Error syncing leads to contacts:", error);
      toast({
        title: "Erro",
        description: "Não foi possível sincronizar os leads",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={syncLeadsToContacts}
      disabled={syncing}
      className="gap-2"
    >
      {syncing ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      Sincronizar Leads
    </Button>
  );
}
