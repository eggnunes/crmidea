import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserCheck, Building2, Mail, Phone } from "lucide-react";
import { Lead } from "@/types/crm";

interface Props {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConvertLeadToClientDialog({ lead, open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    office_name: "",
    office_address: "",
    num_lawyers: 1,
    num_employees: 1,
  });

  const handleConvert = async () => {
    if (!formData.office_name) {
      toast.error("Nome do escritório é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Check if client already exists with this email
      const { data: existingClient } = await supabase
        .from("consulting_clients")
        .select("id")
        .eq("email", lead.email)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingClient) {
        toast.error("Já existe um cliente cadastrado com este email");
        setLoading(false);
        return;
      }

      // Create consulting client
      const { data: newClient, error } = await supabase
        .from("consulting_clients")
        .insert({
          user_id: user.id,
          lead_id: lead.id,
          full_name: lead.name,
          email: lead.email,
          phone: lead.phone || "",
          office_name: formData.office_name,
          office_address: formData.office_address || "A definir",
          num_lawyers: formData.num_lawyers,
          num_employees: formData.num_employees,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        const code = (error as any)?.code;
        if (code === "23505") {
          toast.error("Já existe um cliente cadastrado com este email");
          setLoading(false);
          return;
        }
        throw error;
      }

      // Send welcome email with form link
      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: {
            clientName: lead.name,
            clientEmail: lead.email,
            officeName: formData.office_name,
            consultantId: user.id,
            checkFormFilled: false, // New client, hasn't filled form yet
          },
        });
        toast.success("Lead convertido e email de boas-vindas enviado!");
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        toast.success("Lead convertido para cliente de consultoria!");
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error converting lead:", error);
      toast.error("Erro ao converter lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Converter para Cliente de Consultoria
          </DialogTitle>
          <DialogDescription>
            Transforme este lead em um cliente da consultoria IDEA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Lead Info Preview */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{lead.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              {lead.email}
            </div>
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                {lead.phone}
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="office_name">Nome do Escritório *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="office_name"
                  value={formData.office_name}
                  onChange={(e) => setFormData({ ...formData, office_name: e.target.value })}
                  placeholder="Nome do escritório"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="office_address">Endereço</Label>
              <Input
                id="office_address"
                value={formData.office_address}
                onChange={(e) => setFormData({ ...formData, office_address: e.target.value })}
                placeholder="Endereço do escritório (opcional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="num_lawyers">Advogados</Label>
                <Input
                  id="num_lawyers"
                  type="number"
                  min={1}
                  value={formData.num_lawyers}
                  onChange={(e) => setFormData({ ...formData, num_lawyers: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="num_employees">Colaboradores</Label>
                <Input
                  id="num_employees"
                  type="number"
                  min={0}
                  value={formData.num_employees}
                  onChange={(e) => setFormData({ ...formData, num_employees: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConvert} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            Converter para Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
