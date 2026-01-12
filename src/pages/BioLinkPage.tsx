import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Instagram, Youtube, Mail } from "lucide-react";
import logoRE from "@/assets/logo-re.png";
import logoMentoria from "@/assets/logo-mentoria-new.png";
import logoCursoIdea from "@/assets/logo-curso-idea-new.png";
import logoConsultoria from "@/assets/logo-consultoria-new.png";
import logoGuiaIA from "@/assets/logo-guia-ia-new.png";
import logoCodigoPrompts from "@/assets/logo-codigo-prompts-new.png";
import logoComboEbooks from "@/assets/logo-combo-ebooks-new.png";
import logoEggNunes from "@/assets/logo-eggnunes.png";
import logoRobodetoga from "@/assets/logo-robodetoga.png";
import logoVagasjuridicas from "@/assets/logo-vagasjuridicas.png";
import logoAITeleprompter from "@/assets/logo-ai-teleprompter.png";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";

const products = [
  {
    title: "Consultoria IDEA",
    description: "Consultoria personalizada em IA para escritórios de advocacia",
    link: "/consultoria-publica",
    logo: logoConsultoria,
    external: false,
    category: "premium"
  },
  {
    title: "Mentoria",
    description: "Acompanhamento personalizado para advogados que querem dominar a IA",
    link: "https://mentoriarafaelegg.com.br/inscricoes-abertas/",
    logo: logoMentoria,
    external: true,
    category: "premium"
  },
  {
    title: "Curso IDEA",
    description: "Formação completa em Inteligência de Dados e Artificial para advogados",
    link: "https://mentoriarafaelegg.com.br/curso-idea/",
    logo: logoCursoIdea,
    external: true,
    category: "premium"
  },
  {
    title: "Guia de IA",
    description: "Guia prático para começar a usar IA na advocacia",
    link: "https://mentoriarafaelegg.com.br/guia-de-ia/",
    logo: logoGuiaIA,
    external: true,
    category: "ebook"
  },
  {
    title: "Código dos Prompts",
    description: "E-book com os melhores prompts para advogados",
    link: "https://mentoriarafaelegg.com.br/codigo-dos-prompts/",
    logo: logoCodigoPrompts,
    external: true,
    category: "ebook"
  },
  {
    title: "Combo de E-books",
    description: "Pacote completo com todos os e-books sobre IA na advocacia",
    link: "https://mentoriarafaelegg.com.br/combo-de-ebooks/",
    logo: logoComboEbooks,
    external: true,
    category: "ebook"
  }
];

const otherProjects = [
  {
    title: "AI Teleprompter",
    description: "Grave vídeos olhando para a câmera com uma janela flutuante. A IA reconhece sua voz e rola o texto no seu ritmo.",
    link: "https://apps.apple.com/br/app/ai-teleprompter/id6756862906",
    logo: logoAITeleprompter,
    accentColor: "border-cyan-500/50 hover:border-cyan-400",
    buttonColor: "text-cyan-400 hover:text-cyan-300",
    logoBg: "rounded-xl"
  },
  {
    title: "Antigolpe Advogado",
    description: "Plataforma gratuita para consultar e denunciar números de WhatsApp usados no golpe do falso advogado.",
    link: "https://antigolpeadvogado.com.br",
    logo: null,
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    accentColor: "border-blue-500/50 hover:border-blue-400",
    buttonColor: "text-blue-400 hover:text-blue-300",
    logoBg: null
  },
  {
    title: "Vagas Jurídicas",
    description: "Portal especializado em oportunidades no mercado jurídico. Conectamos advogados às melhores vagas.",
    link: "https://vagasjuridicas.com",
    logo: logoVagasjuridicas,
    accentColor: "border-orange-500/50 hover:border-orange-400",
    buttonColor: "text-orange-400 hover:text-orange-300",
    logoBg: "bg-white rounded-lg p-1"
  },
  {
    title: "Robô de Toga",
    description: "Portal completo de IA para advogados com notícias, ferramentas gratuitas, agentes IA e pesquisa jurisprudencial.",
    link: "https://robodetoga.com.br",
    logo: logoRobodetoga,
    accentColor: "border-purple-500/50 hover:border-purple-400",
    buttonColor: "text-purple-400 hover:text-purple-300",
    logoBg: "bg-white rounded-lg p-1"
  },
  {
    title: "Egg Nunes Advogados",
    description: "Escritório de advocacia referência desde 1994, especializado em Direito do Servidor Público.",
    link: "https://eggnunes.com.br",
    logo: logoEggNunes,
    accentColor: "border-amber-500/50 hover:border-amber-400",
    buttonColor: "text-amber-400 hover:text-amber-300",
    logoBg: "bg-slate-100 rounded-lg p-1"
  }
];

const trackClick = async (title: string, url: string, category: string) => {
  try {
    await supabase.from("bio_link_clicks").insert({
      link_title: title,
      link_url: url,
      category: category,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null
    });
  } catch (error) {
    console.error("Error tracking click:", error);
  }
};

export function BioLinkPage() {
  const navigate = useNavigate();

  const handleProductClick = (product: typeof products[0]) => {
    trackClick(product.title, product.link, product.category);
    
    if (product.external) {
      window.open(product.link, "_blank", "noopener,noreferrer");
    } else {
      navigate(product.link);
    }
  };

  const handleProjectClick = (project: typeof otherProjects[0]) => {
    trackClick(project.title, project.link, "projeto");
    window.open(project.link, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Helmet>
        <title>Rafael Egg | Links</title>
        <meta name="description" content="Todos os links, produtos e projetos de Rafael Egg - Mentor em IA para Advocacia" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#0f1419] to-[#1a1f2e]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-transparent" />
        
        <div className="relative z-10 container mx-auto px-4 py-8 max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img 
                src={logoRE} 
                alt="Rafael Egg" 
                className="h-20 w-20 mx-auto mb-3 object-contain hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <h1 className="text-2xl font-bold text-white">Rafael Egg</h1>
            <p className="text-slate-400 text-sm mt-1">Mentor em IA para Advocacia</p>
            
            {/* Social Links */}
            <div className="flex justify-center gap-3 mt-4">
              <a 
                href="https://www.instagram.com/rafaeleggnunes/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-pink-400 hover:bg-slate-700 transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://www.tiktok.com/@rafaeleggnunes" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-300"
                aria-label="TikTok"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a 
                href="https://youtube.com/@rafaeleggnunes"
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-red-400 hover:bg-slate-700 transition-all duration-300"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a 
                href="mailto:contato@rafaelegg.com" 
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-all duration-300"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Products Section */}
          <div className="mb-8">
            <h2 className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4 text-center">
              Soluções para sua Advocacia
            </h2>
            <div className="space-y-3">
              {products.map((product, index) => (
                <Card 
                  key={index}
                  className={`bg-slate-800/60 border-2 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                    product.category === 'premium' 
                      ? 'border-amber-500/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20' 
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => handleProductClick(product)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-14 flex items-center justify-center flex-shrink-0">
                        <img 
                          src={product.logo} 
                          alt={product.title}
                          className="max-h-14 max-w-20 object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm">{product.title}</h3>
                        <p className="text-slate-400 text-xs line-clamp-2">{product.description}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Other Projects Section */}
          <div className="mb-8">
            <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4 text-center">
              Outros Projetos
            </h2>
            <div className="space-y-3">
              {otherProjects.map((project, index) => (
                <Card 
                  key={index}
                  className={`bg-slate-800/60 border-2 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${project.accentColor}`}
                  onClick={() => handleProjectClick(project)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
                        {project.logo ? (
                          <div className={project.logoBg || ""}>
                            <img 
                              src={project.logo} 
                              alt={project.title}
                              className="h-12 w-12 object-contain"
                            />
                          </div>
                        ) : (
                          <div className={`h-12 w-12 rounded-lg ${project.iconBg} flex items-center justify-center`}>
                            <svg className={`h-6 w-6 ${project.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm">{project.title}</h3>
                        <p className="text-slate-400 text-xs line-clamp-2">{project.description}</p>
                      </div>
                      <ExternalLink className={`w-4 h-4 flex-shrink-0 ${project.buttonColor}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Website Link */}
          <div className="text-center">
            <Link 
              to="/"
              className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
            >
              rafaelegg.com
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}