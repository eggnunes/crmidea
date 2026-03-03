import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoRE from "@/assets/logo-re.png";
import { SEOHead } from "@/components/seo/SEOHead";
import { JsonLd, generateFAQSchema, generateBreadcrumbSchema } from "@/components/seo/JsonLd";

const faqCategories = [
  {
    title: "IA para Advogados",
    items: [
      {
        question: "O que é Inteligência Artificial aplicada à advocacia?",
        answer: "É o uso de ferramentas como ChatGPT, Gemini e outras IAs generativas para automatizar tarefas jurídicas repetitivas, como elaboração de peças, pesquisa de jurisprudência, análise de contratos e atendimento ao cliente. Isso permite que o advogado foque no que realmente importa: a estratégia jurídica."
      },
      {
        question: "Preciso ter conhecimento prévio em tecnologia para usar IA?",
        answer: "Não! Todos os nossos produtos são projetados para advogados de qualquer nível de familiaridade com tecnologia. Começamos do básico e evoluímos juntos, sempre respeitando seu ritmo de aprendizado."
      },
      {
        question: "A IA vai substituir os advogados?",
        answer: "Não. A IA é uma ferramenta que potencializa o trabalho do advogado, não o substitui. Advogados que usam IA serão mais produtivos, competitivos e terão mais tempo para atender melhor seus clientes. Quem não se adaptar, ficará para trás."
      },
      {
        question: "Quais resultados posso esperar ao usar IA no meu escritório?",
        answer: "Nossos clientes relatam aumento de até 60% na produtividade, redução significativa no tempo de elaboração de peças, melhoria no atendimento ao cliente e maior organização do escritório com o uso de IA."
      },
      {
        question: "É ético usar IA na advocacia?",
        answer: "Sim, desde que utilizada como ferramenta de apoio, com supervisão humana e respeitando as normas da OAB. A IA auxilia na produtividade, mas a responsabilidade técnica e ética permanece sempre com o advogado."
      },
    ],
  },
  {
    title: "Consultoria IDEA",
    items: [
      {
        question: "O que é a Consultoria IDEA?",
        answer: "A Consultoria IDEA é um programa de implementação personalizada de Inteligência Artificial no seu escritório de advocacia. Trabalhamos a quatro mãos para diagnosticar necessidades, criar fluxos automatizados e treinar sua equipe no uso das melhores ferramentas de IA."
      },
      {
        question: "Quanto tempo dura a Consultoria IDEA?",
        answer: "O programa tem duração média de 3 a 6 meses, dependendo do tamanho do escritório e da complexidade das implementações. O acompanhamento é contínuo durante todo o período contratado."
      },
      {
        question: "A consultoria é presencial ou online?",
        answer: "A consultoria é 100% online, com reuniões por videoconferência, o que permite atender escritórios de todo o Brasil. As sessões são agendadas de acordo com a disponibilidade do cliente."
      },
      {
        question: "Qual o investimento para a Consultoria IDEA?",
        answer: "O valor varia conforme o porte do escritório e as necessidades identificadas no diagnóstico inicial. Entre em contato para receber uma proposta personalizada. Oferecemos diversas formas de pagamento, incluindo parcelamento."
      },
    ],
  },
  {
    title: "Mentoria",
    items: [
      {
        question: "Qual a diferença entre consultoria e mentoria?",
        answer: "A Consultoria é a implementação prática e personalizada de IA diretamente no seu escritório. A Mentoria oferece acompanhamento em grupo ou individual para tirar dúvidas, trocar experiências e evoluir no uso de IA, com encontros periódicos."
      },
      {
        question: "Como funciona a Mentoria Coletiva?",
        answer: "A Mentoria Coletiva reúne um grupo seleto de advogados em encontros periódicos online, onde discutimos cases, novas ferramentas, prompts avançados e estratégias de implementação de IA. É ideal para quem busca networking e aprendizado contínuo."
      },
      {
        question: "Existe mentoria individual?",
        answer: "Sim! A Mentoria Individual oferece acompanhamento personalizado, com sessões one-on-one focadas nas necessidades específicas do seu escritório. É a opção ideal para quem quer atenção exclusiva."
      },
    ],
  },
  {
    title: "Curso IDEA",
    items: [
      {
        question: "O que é o Curso IDEA?",
        answer: "O Curso IDEA é uma formação completa em Inteligência Artificial para advogados. Com módulos estruturados, você aprende desde os fundamentos até técnicas avançadas de uso de IA na prática jurídica, incluindo prompts, automações e ferramentas específicas."
      },
      {
        question: "O curso tem certificado?",
        answer: "Sim! Ao concluir todos os módulos, você recebe um certificado de conclusão que pode ser utilizado como horas complementares e para demonstrar sua qualificação em IA jurídica."
      },
      {
        question: "Por quanto tempo tenho acesso ao curso?",
        answer: "O acesso ao Curso IDEA é vitalício. Você pode assistir às aulas quantas vezes quiser, no seu ritmo, e terá acesso a todas as atualizações futuras sem custo adicional."
      },
    ],
  },
  {
    title: "E-books e Materiais",
    items: [
      {
        question: "Quais e-books estão disponíveis?",
        answer: "Oferecemos o Guia de IA para Advogados (guia completo para começar), o Código de Prompts (coletânea de prompts jurídicos prontos) e o Combo de E-books com desconto especial. Cada material é projetado para diferentes níveis de conhecimento."
      },
      {
        question: "Os e-books podem ser adquiridos separadamente?",
        answer: "Sim! Os e-books estão disponíveis tanto individualmente quanto em combo com desconto. São excelentes para quem quer começar a estudar IA na advocacia de forma autodidata e no seu próprio ritmo."
      },
      {
        question: "Como escolher o produto ideal para mim?",
        answer: "Para iniciantes, recomendamos os e-books ou o Curso IDEA. Para quem quer acompanhamento, a Mentoria é ideal. Para implementação completa e personalizada, a Consultoria IDEA oferece o melhor custo-benefício a longo prazo."
      },
    ],
  },
  {
    title: "Pagamento e Suporte",
    items: [
      {
        question: "Como funciona o pagamento?",
        answer: "Oferecemos diversas formas de pagamento, incluindo cartão de crédito parcelado, PIX e boleto. Para consultorias e mentorias, também trabalhamos com planos mensais."
      },
      {
        question: "Vocês oferecem suporte?",
        answer: "Sim! Todos os produtos incluem canais de suporte para tirar dúvidas. Na consultoria e mentoria, o acompanhamento é contínuo durante todo o período contratado."
      },
      {
        question: "Posso pedir reembolso?",
        answer: "Sim, oferecemos garantia de satisfação conforme o Código de Defesa do Consumidor. Os detalhes sobre prazos e condições de reembolso são informados no momento da compra de cada produto."
      },
    ],
  },
];

const allFaqItems = faqCategories.flatMap((c) => c.items);

export function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <SEOHead
        title="Perguntas Frequentes (FAQ) | Rafael Egg - IA para Advogados"
        description="Tire suas dúvidas sobre Inteligência Artificial para advogados, Consultoria IDEA, mentoria, Curso IDEA, e-books e muito mais. Respostas completas para as perguntas mais comuns."
        canonical="https://rafaelegg.com/faq"
        ogType="website"
      />
      <JsonLd data={generateFAQSchema(allFaqItems)} />
      <JsonLd
        data={generateBreadcrumbSchema([
          { name: "Início", url: "https://rafaelegg.com" },
          { name: "FAQ", url: "https://rafaelegg.com/faq" },
        ])}
      />

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoRE} alt="Rafael Egg" className="h-10 w-auto" loading="eager" />
            <span className="text-lg font-bold text-white hidden sm:inline">Rafael Egg</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" className="text-slate-300 hover:text-amber-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-6">
            <HelpCircle className="w-3 h-3 mr-1" />
            Perguntas Frequentes
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Tire suas <span className="text-amber-400">Dúvidas</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Respostas para as perguntas mais comuns sobre IA para advogados, consultoria, mentoria, cursos e e-books.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="pb-20">
        <div className="container mx-auto px-6 max-w-3xl space-y-12">
          {faqCategories.map((category, catIdx) => (
            <div key={catIdx}>
              <h2 className="text-2xl font-bold text-white mb-4 border-l-4 border-amber-400 pl-4">
                {category.title}
              </h2>
              <Accordion type="single" collapsible className="space-y-3">
                {category.items.map((item, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`cat${catIdx}-item${idx}`}
                    className="border border-slate-700/50 rounded-xl bg-slate-800/30 backdrop-blur-sm px-6 transition-all duration-300 hover:border-amber-500/30"
                  >
                    <AccordionTrigger className="text-left text-white hover:text-amber-400 hover:no-underline py-5 text-base font-medium">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-300 leading-relaxed pb-5">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900/50 border-t border-slate-800/50">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ainda tem dúvidas?
          </h2>
          <p className="text-slate-400 mb-8">
            Entre em contato diretamente ou agende uma conversa para tirar todas as suas dúvidas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/#contato">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 py-3">
                Fale Conosco
              </Button>
            </Link>
            <Link to="/consultoria">
              <Button variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 px-8 py-3">
                Conheça a Consultoria
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} Rafael Egg - IA para Advogados. Todos os direitos reservados.</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link to="/privacidade" className="hover:text-amber-400 transition-colors">Política de Privacidade</Link>
            <Link to="/blog" className="hover:text-amber-400 transition-colors">Blog</Link>
            <Link to="/" className="hover:text-amber-400 transition-colors">Início</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
