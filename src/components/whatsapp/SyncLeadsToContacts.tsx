import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function SyncLeadsToContacts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const syncLeadsToContacts = async () => {
    if (!user) return;

    setSyncing(true);
    try {
      // Get all leads with phone numbers
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("id, name, phone")
        .eq("user_id", user.id)
        .not("phone", "is", null);

      if (leadsError) throw leadsError;

      if (!leads || leads.length === 0) {
        toast({
          title: "Info",
          description: "Nenhum lead com telefone encontrado",
        });
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
      const newContacts = leads.filter(lead => {
        if (!lead.phone) return false;
        const normalizedPhone = lead.phone.replace(/\D/g, "");
        return !existingPhones.has(normalizedPhone);
      });

      if (newContacts.length === 0) {
        toast({
          title: "Info",
          description: "Todos os leads já estão cadastrados como contatos",
        });
        return;
      }

      // Insert new contacts
      const contactsToInsert = newContacts.map(lead => ({
        user_id: user.id,
        phone: lead.phone!.replace(/\D/g, ""),
        name: lead.name,
      }));

      const { error: insertError } = await supabase
        .from("whatsapp_contacts")
        .insert(contactsToInsert);

      if (insertError) throw insertError;

      toast({
        title: "Sucesso",
        description: `${newContacts.length} lead(s) sincronizado(s) como contatos`,
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
