import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Loader2, Camera, CheckCircle, Sparkles, ArrowRight, Star, Wand2, Instagram, Linkedin, Youtube, Home, Briefcase, ExternalLink } from "lucide-react";
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
import logoRe from "@/assets/logo-re.png";

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

  const socialLinks = [
    { icon: Instagram, href: "https://instagram.com/rafaelegg", label: "Instagram" },
    { icon: Linkedin, href: "https://linkedin.com/in/rafaelegg", label: "LinkedIn" },
    { icon: Youtube, href: "https://youtube.com/@rafaelegg", label: "YouTube" },
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSIjZmZhNTAwIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img src={logoRe} alt="Rafael Egg" className="h-20 w-auto" />
            </div>

            <Card className="bg-slate-900/80 backdrop-blur-xl border-amber-500/20 shadow-2xl shadow-amber-500/10">
              <CardContent className="pt-10 pb-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-white">Material Enviado!</h2>
                <p className="text-slate-300 mb-6">
                  Enviamos os prompts para fotos profissionais no seu e-mail. 
                  Verifique sua caixa de entrada (e também a pasta de spam, por segurança).
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-200">
                    📧 Não recebeu? Entre em contato pelo Instagram @rafaelegg
                  </p>
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col gap-3 mb-6">
                  <Link to="/">
                    <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">
                      <Home className="w-4 h-4 mr-2" />
                      Página Inicial
                    </Button>
                  </Link>
                  <Link to="/consultoria-ia">
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900 font-semibold">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Conheça a Consultoria
                    </Button>
                  </Link>
                </div>

                {/* Social Links */}
                <div className="flex justify-center gap-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-slate-800 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/50 flex items-center justify-center transition-all duration-300 group"
                    >
                      <social.icon className="w-5 h-5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Prompts para Fotos Profissionais com IA | Rafael Egg</title>
        <meta name="description" content="Baixe gratuitamente prompts testados para criar fotos profissionais de perfil usando Inteligência Artificial. Material exclusivo para advogados." />
        <meta name="keywords" content="prompts fotos IA, fotos profissionais inteligência artificial, ChatGPT fotos, IA para advogados, Rafael Egg ebook" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://rafaelegg.com/ebook" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://rafaelegg.com/ebook" />
        <meta property="og:title" content="Prompts para Fotos Profissionais com IA | Rafael Egg" />
        <meta property="og:description" content="Baixe gratuitamente prompts para criar fotos profissionais usando IA." />
        <meta property="og:image" content="https://rafaelegg.com/og-image.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Prompts para Fotos Profissionais com IA" />
        <meta name="twitter:description" content="Baixe gratuitamente prompts para criar fotos profissionais usando IA." />
      </Helmet>
      
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSIjZmZhNTAwIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
      
      {/* Circuit Lines Effect */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-40 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
        <div className="absolute top-40 right-20 w-60 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"></div>
        <div className="absolute bottom-40 left-1/4 w-32 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
        <div className="absolute top-1/3 right-10 w-px h-40 bg-gradient-to-b from-transparent via-amber-500/30 to-transparent"></div>
        <div className="absolute bottom-1/4 left-20 w-px h-32 bg-gradient-to-b from-transparent via-orange-500/20 to-transparent"></div>
      </div>

      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]"></div>
      
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-3xl blur-xl"></div>
                <img src={logoRe} alt="Rafael Egg" className="relative h-24 w-auto drop-shadow-2xl" />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">Material Exclusivo • Gratuito</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Prompts para{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Fotos Profissionais
              </span>
              {" "}com IA
            </h1>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
              Transforme suas fotos de perfil usando Inteligência Artificial com prompts testados e aprovados
            </p>
          </div>

          {/* Benefits Card */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Camera className="w-4 h-4 text-slate-900" />
              </div>
              <span className="text-white font-semibold">O que você vai receber:</span>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Star className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-slate-300">Prompts prontos para criar fotos profissionais de perfil</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Star className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-slate-300">Técnicas para poses e iluminação realistas</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Star className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-slate-300">Exemplos de uso com ChatGPT e outras IAs de imagem</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <Wand2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-emerald-400 font-medium">100% Gratuito!</span>
              </li>
            </ul>
          </div>

          {/* Form Card */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-amber-500/20 shadow-2xl shadow-amber-500/10">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl text-white">
                Preencha para receber o material
              </CardTitle>
              <CardDescription className="text-slate-400">
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
                        <FormLabel className="text-slate-300">Nome completo</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Seu nome"
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/30"
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
                        <FormLabel className="text-slate-300">E-mail</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="seu@email.com"
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/30"
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
                        <FormLabel className="text-slate-300">Telefone (WhatsApp)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="(11) 99999-9999"
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              field.onChange(formatted);
                            }}
                            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/30"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900 font-bold py-6 text-lg shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 hover:scale-[1.02]"
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

              <p className="text-center text-slate-500 text-xs mt-4">
                Ao se cadastrar, você concorda em receber comunicações por e-mail.
              </p>
            </CardContent>
          </Card>

          {/* Trust Elements */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800">
              <div className="text-3xl mb-2">📸</div>
              <p className="text-xs text-slate-400">Fotos Incríveis</p>
            </div>
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800">
              <div className="text-3xl mb-2">🤖</div>
              <p className="text-xs text-slate-400">Prompts Prontos</p>
            </div>
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800">
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-xs text-slate-400">Receba Agora</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <Home className="w-4 h-4 mr-2" />
                Página Inicial
              </Button>
            </Link>
            <Link to="/consultoria-ia">
              <Button variant="ghost" className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10">
                <Briefcase className="w-4 h-4 mr-2" />
                Conheça a Consultoria
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Social Links */}
          <div className="mt-8 flex justify-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-slate-900/60 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/50 flex items-center justify-center transition-all duration-300 group"
                title={social.label}
              >
                <social.icon className="w-5 h-5 text-slate-400 group-hover:text-amber-400 transition-colors" />
              </a>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm mb-2">
              Rafael Egg • Especialista em IA para Advogados
            </p>
            <p className="text-slate-600 text-xs">
              © 2025 Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
