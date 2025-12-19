import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StartConversationButtonProps {
  phone: string;
  name?: string;
  onConversationStarted?: (conversationId: string) => void;
}

export function StartConversationButton({
  phone,
  name,
  onConversationStarted,
}: StartConversationButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleStartConversation = async () => {
    if (!user || !phone) return;

    setLoading(true);
    try {
      const normalizedPhone = phone.replace(/\D/g, "");

      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from("whatsapp_conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("contact_phone", normalizedPhone)
        .maybeSingle();

      let conversationId: string;

      if (existingConversation) {
        conversationId = existingConversation.id;
        toast({
          title: "Conversa encontrada",
          description: `Abrindo conversa com ${name || normalizedPhone}`,
        });
      } else {
        // Create new conversation
        const { data: newConversation, error } = await supabase
          .from("whatsapp_conversations")
          .insert({
            user_id: user.id,
            contact_phone: normalizedPhone,
            contact_name: name || null,
            channel: "whatsapp",
          })
          .select()
          .single();

        if (error) throw error;

        conversationId = newConversation.id;
        toast({
          title: "Conversa criada",
          description: `Nova conversa com ${name || normalizedPhone} iniciada`,
        });
      }

      if (onConversationStarted) {
        onConversationStarted(conversationId);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a conversa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStartConversation}
            disabled={loading}
            className="h-8 w-8"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Iniciar conversa</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
