import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Camera, CheckCircle, Sparkles, ArrowRight, Star, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido").max(255, "Email muito longo"),
  phone: z.string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .max(20, "Telefone muito longo")
    .regex(/^[\d\s\(\)\-\+]+$/, "Telefone inválido"),
});

type FormData = z.infer<typeof formSchema>;

export function EbookCapturePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke("send-ebook", {
        body: {
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.replace(/\D/g, ""),
        },
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Sucesso! Verifique seu e-mail para acessar o material.");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Material Enviado!</h2>
            <p className="text-white/80 mb-6">
              Enviamos os prompts para fotos profissionais no seu e-mail. 
              Verifique sua caixa de entrada (e também a pasta de spam, por segurança).
            </p>
            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <p className="text-sm text-white/70">
                📧 Não recebeu? Entre em contato conosco pelo WhatsApp.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => setIsSuccess(false)}
            >
              Voltar ao formulário
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Prompts para Fotos Profissionais
          </h1>
          <p className="text-white/70 text-lg">
            Crie fotos incríveis com Inteligência Artificial
          </p>
        </div>

        {/* Benefits Preview */}
        <div className="bg-white/5 backdrop-blur rounded-xl p-4 mb-6 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span className="text-white font-semibold">O que você vai receber:</span>
          </div>
          <ul className="space-y-2 text-white/80 text-sm">
            <li className="flex items-start gap-2">
              <Star className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>Prompts prontos para criar fotos profissionais de perfil</span>
            </li>
            <li className="flex items-start gap-2">
              <Star className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>Técnicas para poses e iluminação realistas</span>
            </li>
            <li className="flex items-start gap-2">
              <Star className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>Exemplos de uso com ChatGPT, Midjourney e outras IAs</span>
            </li>
            <li className="flex items-start gap-2">
              <Wand2 className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
              <span className="text-violet-300 font-medium">100% Gratuito!</span>
            </li>
          </ul>
        </div>

        {/* Form Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl text-white">
              Preencha para receber o material
            </CardTitle>
            <CardDescription className="text-white/60">
              Enviaremos o PDF diretamente no seu e-mail
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/90">Nome completo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Seu nome"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-violet-400/50 focus:ring-violet-400/30"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/90">E-mail</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="seu@email.com"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-violet-400/50 focus:ring-violet-400/30"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/90">Telefone (WhatsApp)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="(11) 99999-9999"
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            field.onChange(formatted);
                          }}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-violet-400/50 focus:ring-violet-400/30"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-semibold py-6 text-lg shadow-lg shadow-violet-500/30 transition-all hover:shadow-violet-500/50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Quero os Prompts Grátis
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <p className="text-center text-white/50 text-xs mt-4">
              Ao se cadastrar, você concorda em receber comunicações por e-mail.
            </p>
          </CardContent>
        </Card>

        {/* Trust Elements */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-white/70">
            <div className="text-2xl mb-1">📸</div>
            <p className="text-xs">Fotos Incríveis</p>
          </div>
          <div className="text-white/70">
            <div className="text-2xl mb-1">🤖</div>
            <p className="text-xs">Prompts Prontos</p>
          </div>
          <div className="text-white/70">
            <div className="text-2xl mb-1">⚡</div>
            <p className="text-xs">Receba Agora</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs mt-8">
          Evento • Rafael Nunes - Especialista em IA
        </p>
      </div>
    </div>
  );
}
