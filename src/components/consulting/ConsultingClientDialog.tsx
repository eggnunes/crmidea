import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface ConsultingClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ConsultingClientDialog({ open, onOpenChange, onSuccess }: ConsultingClientDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    office_name: "",
    office_address: "",
    num_lawyers: 1,
    num_employees: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('consulting_clients')
        .insert({
          ...formData,
          user_id: user.id,
        });

      if (error) throw error;

      toast.success('Cliente adicionado com sucesso!');
      onSuccess();
      onOpenChange(false);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        office_name: "",
        office_address: "",
        num_lawyers: 1,
        num_employees: 1,
      });
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Erro ao adicionar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Cliente de Consultoria</DialogTitle>
          <DialogDescription>
            Adicione as informações básicas do cliente. Ele poderá completar o formulário depois.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="office_name">Nome do Escritório *</Label>
              <Input
                id="office_name"
                value={formData.office_name}
                onChange={(e) => setFormData({ ...formData, office_name: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="office_address">Endereço *</Label>
              <Textarea
                id="office_address"
                value={formData.office_address}
                onChange={(e) => setFormData({ ...formData, office_address: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="num_lawyers">Nº de Advogados</Label>
              <Input
                id="num_lawyers"
                type="number"
                min={1}
                value={formData.num_lawyers}
                onChange={(e) => setFormData({ ...formData, num_lawyers: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div>
              <Label htmlFor="num_employees">Nº de Colaboradores</Label>
              <Input
                id="num_employees"
                type="number"
                min={1}
                value={formData.num_employees}
                onChange={(e) => setFormData({ ...formData, num_employees: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
