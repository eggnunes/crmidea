import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Share2,
  Instagram,
  Youtube,
  BookOpen
} from "lucide-react";
import { Link, useParams, Navigate } from "react-router-dom";
import logoRE from "@/assets/logo-re.png";
import blogIaDireito from "@/assets/blog-ia-direito.jpg";
import blogFerramentasIa from "@/assets/blog-ferramentas-ia.jpg";
import blogPrompts from "@/assets/blog-prompts.jpg";
import blogEticaIa from "@/assets/blog-etica-ia.jpg";
import blogContratos from "@/assets/blog-contratos.jpg";
import blogChatgptAdvogados from "@/assets/blog-chatgpt-advogados.jpg";
import blogPesquisaJuridica from "@/assets/blog-pesquisa-juridica.jpg";
import blogProdutividade from "@/assets/blog-produtividade.jpg";
import { Helmet } from "react-helmet";

interface Article {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  excerpt: string;
  category: string;
  read_time_minutes: number;
  published_at: string;
  image: string;
  content: string;
}

const articles: Article[] = [
  {
    id: "1",
    slug: "ia-transformando-direito-2025",
    title: "Como a IA está Transformando o Direito em 2025",
    metaDescription: "Descubra as principais tendências de inteligência artificial que estão revolucionando a prática jurídica no Brasil. Saiba como advogados estão usando IA para aumentar produtividade.",
    excerpt: "Descubra as principais tendências de inteligência artificial que estão revolucionando a prática jurídica no Brasil e no mundo.",
    category: "Tendências",
    read_time_minutes: 8,
    published_at: "2025-01-05",
    image: blogIaDireito,
    content: `
## A Revolução da Inteligência Artificial no Direito

O ano de 2025 marca um ponto de inflexão na história da advocacia brasileira. A inteligência artificial deixou de ser uma promessa futurista para se tornar uma realidade presente em escritórios de todos os tamanhos. **Advogados que dominam essas ferramentas estão experimentando aumentos de produtividade de até 60%**, enquanto aqueles que resistem à mudança veem sua competitividade diminuir a cada dia.

### As Principais Tendências de IA na Advocacia

#### 1. Análise Preditiva de Decisões Judiciais

Uma das aplicações mais transformadoras da IA no Direito é a capacidade de prever resultados de processos com base em dados históricos. Sistemas avançados analisam milhares de decisões anteriores para identificar padrões e calcular probabilidades de sucesso em diferentes estratégias processuais.

**Benefícios práticos:**
- Orientação mais precisa aos clientes sobre chances de êxito
- Decisões estratégicas baseadas em dados, não apenas intuição
- Economia de tempo e recursos em causas com baixa probabilidade de sucesso

#### 2. Automação na Elaboração de Peças Processuais

O ChatGPT e ferramentas similares revolucionaram a forma como advogados elaboram petições, contratos e pareceres. Com os prompts certos, é possível gerar minutas completas em minutos, permitindo que o advogado foque na análise crítica e personalização.

> "A IA não substitui o advogado – ela amplifica sua capacidade de entregar valor ao cliente." - Rafael Egg

#### 3. Pesquisa Jurisprudencial Inteligente

Sistemas de IA estão transformando a pesquisa jurídica. Em vez de passar horas buscando precedentes, advogados agora utilizam ferramentas que:

- Entendem linguagem natural e contexto jurídico
- Identificam precedentes relevantes automaticamente
- Sugerem argumentos baseados em decisões anteriores
- Destacam divergências jurisprudenciais

#### 4. Atendimento ao Cliente 24/7

Chatbots jurídicos avançados agora podem:
- Responder dúvidas frequentes dos clientes
- Coletar informações preliminares para consultas
- Agendar reuniões automaticamente
- Atualizar clientes sobre andamento processual

### O Impacto nos Escritórios Brasileiros

Dados recentes mostram que escritórios que adotaram IA de forma estratégica apresentam:

| Métrica | Melhoria Média |
|---------|----------------|
| Tempo de elaboração de peças | -50% |
| Satisfação do cliente | +35% |
| Capacidade de atendimento | +40% |
| Redução de erros | -45% |

### Como Começar a Implementar IA no Seu Escritório

**Passo 1: Diagnóstico**
Identifique os gargalos do seu escritório. Onde você e sua equipe perdem mais tempo? Quais tarefas são repetitivas?

**Passo 2: Ferramentas Básicas**
Comece com ferramentas acessíveis como ChatGPT Plus, que oferece recursos avançados por um investimento mensal acessível.

**Passo 3: Capacitação**
Invista em aprendizado. Dominar a arte de criar prompts eficientes é fundamental para extrair o máximo valor das ferramentas de IA.

**Passo 4: Escala Gradual**
Após dominar o básico, explore ferramentas especializadas para o Direito e considere automações mais complexas.

### Conclusão

A transformação digital do Direito não é mais uma escolha – é uma necessidade competitiva. Os advogados que abraçam a IA hoje serão os líderes do mercado amanhã. A boa notícia é que nunca foi tão acessível começar essa jornada.

**Quer aprofundar seus conhecimentos em IA para advocacia?** Conheça nossa [Mentoria em IA para Advogados](/produtos) e transforme sua prática jurídica.
    `
  },
  {
    id: "2",
    slug: "ferramentas-ia-essenciais-advogados",
    title: "5 Ferramentas de IA Essenciais para Advogados",
    metaDescription: "Conheça as 5 ferramentas de inteligência artificial que todo advogado moderno precisa dominar. ChatGPT, pesquisa jurídica e muito mais.",
    excerpt: "Conheça as ferramentas que todo advogado moderno precisa dominar para aumentar sua produtividade e competitividade.",
    category: "Ferramentas",
    read_time_minutes: 6,
    published_at: "2025-01-03",
    image: blogFerramentasIa,
    content: `
## As 5 Ferramentas de IA que Todo Advogado Precisa Conhecer

No mercado jurídico atual, dominar ferramentas de inteligência artificial não é mais um diferencial – é uma necessidade. Advogados que utilizam IA corretamente conseguem **entregar mais valor em menos tempo**, conquistando a preferência dos clientes.

Neste artigo, apresento as 5 ferramentas essenciais que recomendo a todos os meus mentorados.

### 1. ChatGPT (OpenAI)

O ChatGPT revolucionou a forma como trabalhamos com texto. Para advogados, suas aplicações são praticamente infinitas:

**Principais usos na advocacia:**
- Elaboração de minutas de petições e contratos
- Revisão e aprimoramento de textos jurídicos
- Pesquisa sobre temas jurídicos
- Criação de resumos de documentos extensos
- Tradução de documentos jurídicos

**Dica profissional:** O ChatGPT Plus (versão paga) oferece o modelo GPT-4, muito mais preciso e capaz de seguir instruções complexas. O investimento se paga rapidamente com o tempo economizado.

### 2. Claude (Anthropic)

O Claude é especialmente forte em tarefas que exigem análise detalhada de documentos longos. Sua capacidade de processar até 100.000 tokens permite:

- Análise de contratos extensos em segundos
- Revisão de autos processuais completos
- Síntese de documentos volumosos

**Vantagem competitiva:** O Claude é excelente para tarefas que exigem nuance e precisão, como análise de cláusulas contratuais ambíguas.

### 3. Perplexity AI

Para pesquisa jurídica rápida com fontes atualizadas, o Perplexity é imbatível:

- Pesquisa em tempo real na internet
- Citação automática de fontes
- Interface simples e intuitiva
- Respostas diretas e objetivas

**Caso de uso:** Quando preciso verificar rapidamente uma lei recente ou jurisprudência atualizada, o Perplexity me economiza horas de pesquisa manual.

### 4. Otter.ai (Transcrição)

Transforme reuniões com clientes e audiências em texto:

- Transcrição automática em tempo real
- Identificação de diferentes falantes
- Exportação para diversos formatos
- Busca por palavras-chave

**Aplicação prática:** Grave reuniões com clientes e obtenha automaticamente uma ata detalhada, eliminando a necessidade de anotações manuais.

### 5. Notion AI

Para organização e gestão do escritório:

- Organização de casos e prazos
- Templates inteligentes para documentos
- Resumos automáticos de anotações
- Busca avançada em toda base de conhecimento

### Comparativo Rápido

| Ferramenta | Melhor Para | Custo Mensal |
|------------|-------------|--------------|
| ChatGPT Plus | Elaboração de textos | ~R$ 100 |
| Claude Pro | Análise de documentos longos | ~R$ 100 |
| Perplexity Pro | Pesquisa atualizada | ~R$ 100 |
| Otter.ai | Transcrição | ~R$ 50 |
| Notion AI | Organização | ~R$ 50 |

### Como Maximizar o Retorno do Investimento

O segredo não está apenas em ter as ferramentas, mas em **saber utilizá-las eficientemente**. Isso significa:

1. **Dominar a arte dos prompts** - Instruções claras e detalhadas geram resultados muito melhores
2. **Integrar ao fluxo de trabalho** - A ferramenta deve se encaixar naturalmente na sua rotina
3. **Treinar a equipe** - Todos no escritório devem saber usar as ferramentas básicas
4. **Revisar sempre** - IA é uma assistente, não uma substituta do julgamento profissional

### Conclusão

O investimento total em todas essas ferramentas gira em torno de R$ 400 por mês. Compare isso com o custo de um estagiário ou as horas que você desperdiça em tarefas manuais. O retorno sobre investimento é indiscutível.

**Quer aprender a usar essas ferramentas de forma profissional?** Conheça o [Curso IDEA](/produtos) e domine a IA na advocacia.
    `
  },
  {
    id: "3",
    slug: "prompts-juridicos-guia-completo",
    title: "Prompts Jurídicos: O Guia Completo para Advogados",
    metaDescription: "Aprenda a criar prompts eficientes para ChatGPT e outras IAs. Guia completo com exemplos práticos para elaboração de peças processuais.",
    excerpt: "Aprenda a criar prompts eficientes para ChatGPT e outras IAs, otimizando a elaboração de peças processuais.",
    category: "Tutorial",
    read_time_minutes: 10,
    published_at: "2025-01-01",
    image: blogPrompts,
    content: `
## Dominando a Arte dos Prompts Jurídicos

Se você está usando ChatGPT ou qualquer outra IA para auxiliar no trabalho jurídico, provavelmente já percebeu: **a qualidade da resposta depende diretamente da qualidade da pergunta**. Isso é o que chamamos de "engenharia de prompts".

Neste guia completo, vou ensinar as técnicas que uso diariamente e que ensino na minha mentoria.

### O que é um Prompt?

Prompt é a instrução que você fornece à IA. Quanto mais claro, específico e contextualizado, melhor será o resultado.

### A Estrutura do Prompt Perfeito

Um prompt jurídico eficiente geralmente contém:

1. **Contexto** - Quem você é e qual a situação
2. **Tarefa** - O que você quer que a IA faça
3. **Formato** - Como o resultado deve ser apresentado
4. **Restrições** - O que deve ser evitado ou incluído
5. **Exemplos** - Quando aplicável, modelos a seguir

### Prompts Práticos para Advogados

#### Prompt 1: Elaboração de Petição Inicial

\`\`\`
Atue como um advogado especialista em Direito do Consumidor com 20 anos de experiência. 

CONTEXTO: Meu cliente adquiriu um veículo que apresentou defeito de fábrica 3 meses após a compra. A concessionária se recusa a fazer o reparo alegando mau uso.

TAREFA: Elabore uma petição inicial de ação de obrigação de fazer cumulada com indenização por danos morais.

FORMATO: 
- Use linguagem formal jurídica
- Estruture em: Dos Fatos, Do Direito, Do Dano Moral, Dos Pedidos
- Cite jurisprudência do STJ quando possível
- Inclua valor de causa de R$ 30.000,00

RESTRIÇÕES:
- Não invente números de processos ou citações
- Mantenha tom profissional e objetivo
\`\`\`

#### Prompt 2: Análise de Contrato

\`\`\`
Atue como um advogado especialista em Direito Contratual.

TAREFA: Analise o contrato abaixo e identifique:
1. Cláusulas potencialmente abusivas
2. Riscos para o contratante
3. Pontos de negociação recomendados
4. Sugestões de alteração

FORMATO: Organize em tópicos numerados com análise objetiva de cada ponto.

[COLE O CONTRATO AQUI]
\`\`\`

#### Prompt 3: Resumo de Processo

\`\`\`
TAREFA: Faça um resumo executivo do seguinte processo para apresentação ao cliente.

FORMATO:
- Máximo 1 página
- Linguagem acessível (não técnica)
- Destaque: situação atual, próximos passos, expectativas
- Use bullet points

[COLE OS AUTOS AQUI]
\`\`\`

#### Prompt 4: Pesquisa Jurisprudencial

\`\`\`
Atue como um pesquisador jurídico especializado.

TEMA: Responsabilidade civil de plataformas digitais por conteúdo publicado por usuários

TAREFA:
1. Explique a evolução do entendimento do STJ sobre o tema
2. Identifique os principais argumentos a favor e contra a responsabilização
3. Cite os leading cases mais relevantes
4. Indique a tendência atual da jurisprudência

FORMATO: Texto acadêmico estruturado com subtítulos
\`\`\`

### Técnicas Avançadas

#### 1. Chain of Thought (Cadeia de Pensamento)

Peça para a IA explicar seu raciocínio passo a passo:

\`\`\`
Antes de responder, explique seu raciocínio jurídico passo a passo, considerando os diferentes posicionamentos doutrinários sobre o tema.
\`\`\`

#### 2. Role Playing Avançado

\`\`\`
Você é o Dr. João, um advogado com 30 anos de experiência exclusivamente em Direito Tributário, autor de 5 livros sobre o tema. Você é conhecido por encontrar soluções criativas dentro da legalidade.
\`\`\`

#### 3. Few-Shot Learning

Forneça exemplos do que você quer:

\`\`\`
Elabore uma cláusula de confidencialidade seguindo este modelo:

EXEMPLO:
"As partes comprometem-se a manter sigilo absoluto sobre todas as informações..."

Agora crie uma cláusula similar para um contrato de prestação de serviços de tecnologia.
\`\`\`

### Erros Comuns a Evitar

❌ **Prompts vagos**: "Faça uma petição"
✅ **Prompts específicos**: "Elabore uma petição inicial de ação de cobrança de honorários advocatícios..."

❌ **Falta de contexto**: "Analise este contrato"
✅ **Com contexto**: "Atue como advogado do locatário e analise este contrato de locação comercial..."

❌ **Sem formato definido**: "Me explique sobre LGPD"
✅ **Com formato**: "Elabore um parecer sobre LGPD com: resumo executivo, análise, conclusão e recomendações"

### Conclusão

Dominar prompts é uma habilidade que se desenvolve com prática. Quanto mais você usar, melhor ficará em obter resultados precisos e úteis.

**Quer uma biblioteca completa de prompts prontos para uso?** Conheça o [Código dos Prompts](/produtos), meu e-book com centenas de prompts testados para advogados.
    `
  },
  {
    id: "4",
    slug: "etica-ia-advocacia",
    title: "Ética e IA na Advocacia: O que Você Precisa Saber",
    metaDescription: "Análise completa das questões éticas envolvendo o uso de inteligência artificial na prática jurídica. Limites, responsabilidades e boas práticas.",
    excerpt: "Uma análise das questões éticas envolvendo o uso de inteligência artificial na prática jurídica.",
    category: "Ética",
    read_time_minutes: 7,
    published_at: "2024-12-28",
    image: blogEticaIa,
    content: `
## A Dimensão Ética do Uso de IA na Advocacia

O uso de inteligência artificial na advocacia levanta questões éticas fundamentais que todo advogado precisa compreender. **Não basta saber usar as ferramentas – é preciso usá-las de forma ética e responsável.**

### O Código de Ética e a IA

O Código de Ética da OAB não menciona especificamente a inteligência artificial, mas seus princípios fundamentais se aplicam diretamente:

**Art. 2º** - O advogado deve exercer a advocacia com diligência e competência.

Isso significa que o uso de IA não pode comprometer a qualidade do serviço prestado. O advogado continua responsável por todo o trabalho, mesmo quando assistido por ferramentas tecnológicas.

### Questões Éticas Fundamentais

#### 1. Responsabilidade Profissional

**A IA pode errar.** E quando erra, quem responde é o advogado.

Casos reais já mostram advogados punidos por citar jurisprudência inexistente gerada por ChatGPT. Isso reforça uma regra fundamental: **toda informação gerada por IA deve ser verificada**.

**Boas práticas:**
- Sempre verifique citações e referências
- Confirme a existência de leis e jurisprudência citadas
- Revise criticamente todo texto gerado

#### 2. Sigilo Profissional

O sigilo é um dos pilares da advocacia. Ao usar ferramentas de IA, você está potencialmente compartilhando informações confidenciais com terceiros.

**Cuidados necessários:**
- Não compartilhe dados pessoais identificáveis de clientes
- Anonimize informações sensíveis antes de inserir em prompts
- Prefira versões empresariais das ferramentas com políticas de privacidade adequadas
- Verifique as políticas de dados das plataformas utilizadas

#### 3. Transparência com o Cliente

Deve o advogado informar ao cliente que utiliza IA? Esta é uma questão em debate.

**Argumentos a favor da transparência:**
- O cliente tem direito de saber como seu caso é tratado
- Previne questionamentos futuros
- Demonstra modernização do escritório

**Argumentos contra a obrigatoriedade:**
- O advogado usa diversas ferramentas sem informar cada uma
- O que importa é a qualidade do resultado
- Pode gerar insegurança desnecessária

**Minha recomendação:** Seja transparente quando perguntado e quando a IA tiver papel significativo na estratégia.

#### 4. Competência Técnica

O advogado que usa IA precisa entender suas limitações:

- **Alucinações**: IAs podem inventar informações com aparência de verdade
- **Vieses**: O treinamento pode conter preconceitos
- **Desatualização**: O conhecimento pode estar defasado
- **Contexto limitado**: A IA não entende nuances específicas do caso

### Casos Reais: O que Não Fazer

**Caso 1 - EUA (2023):** Advogados citaram 6 decisões inexistentes geradas por ChatGPT. Resultado: multa e dano reputacional severo.

**Caso 2 - Brasil (2024):** Advogado teve petição rejeitada por conter argumentação claramente artificial e inconsistente.

**Lição aprendida:** A pressa de entregar trabalho pode custar muito mais caro do que o tempo economizado.

### Framework Ético para Uso de IA

Desenvolvi um framework simples que uso e ensino:

#### V.E.R.I.F.Y.

- **V**erifique toda informação factual
- **E**limine dados pessoais antes de inserir
- **R**evise criticamente o conteúdo gerado
- **I**nforme quando apropriado
- **F**oque na qualidade, não na velocidade
- **Y** (whY) - Questione se o uso faz sentido

### O Futuro da Regulamentação

A OAB e o CNJ já estudam regulamentações específicas para IA na advocacia. Tendências indicam:

- Obrigatoriedade de revisão humana
- Transparência sobre uso em peças processuais
- Padrões de segurança de dados
- Certificações específicas

### Conclusão

A IA é uma ferramenta poderosa que, usada corretamente, eleva a prática jurídica. Usada irresponsavelmente, pode destruir carreiras e prejudicar clientes.

**O advogado ético do futuro é aquele que domina a tecnologia sem ser dominado por ela.**

Quer se aprofundar em práticas éticas e seguras de IA na advocacia? Conheça nossa [Consultoria IDEA](/produtos).
    `
  },
  {
    id: "5",
    slug: "automatizando-contratos-ia",
    title: "Automatizando Contratos com Inteligência Artificial",
    metaDescription: "Guia prático sobre como usar IA para acelerar a análise e elaboração de contratos. Reduza erros e aumente a eficiência do seu escritório.",
    excerpt: "Veja como a IA pode acelerar a análise e elaboração de contratos, reduzindo erros e aumentando a eficiência.",
    category: "Prática",
    read_time_minutes: 9,
    published_at: "2024-12-25",
    image: blogContratos,
    content: `
## Revolucione sua Prática Contratual com IA

A elaboração e análise de contratos consomem uma parte significativa do tempo de qualquer advogado. A boa notícia é que **a inteligência artificial pode reduzir esse tempo em até 70%**, mantendo a qualidade e reduzindo erros.

### O Estado Atual: Por que Contratos Consomem Tanto Tempo?

Advogados gastam em média:
- **3-4 horas** para revisar um contrato comercial médio
- **8-12 horas** para elaborar um contrato complexo do zero
- **2-3 horas** para identificar inconsistências entre versões

Multiplique isso pela quantidade de contratos que seu escritório processa mensalmente. O potencial de economia é imenso.

### Como a IA Transforma o Trabalho Contratual

#### 1. Análise Rápida de Riscos

A IA pode analisar um contrato em segundos e identificar:
- Cláusulas potencialmente abusivas
- Termos ambíguos que podem gerar disputas
- Ausência de proteções importantes
- Inconsistências internas

**Exemplo de prompt para análise de riscos:**

\`\`\`
Atue como um advogado contratualista experiente.

Analise o contrato abaixo e identifique:

1. RISCOS ALTOS (podem causar prejuízo significativo)
2. RISCOS MÉDIOS (merecem atenção)
3. RISCOS BAIXOS (pontos de melhoria)

Para cada risco:
- Descreva o problema
- Explique a consequência potencial
- Sugira redação alternativa

[CONTRATO]
\`\`\`

#### 2. Geração de Minutas

Criar contratos do zero fica muito mais rápido:

\`\`\`
Elabore um contrato de prestação de serviços de marketing digital com as seguintes características:

PARTES:
- Contratante: Empresa de advocacia
- Contratada: Agência de marketing

OBJETO: Gestão de redes sociais e produção de conteúdo

VALORES: R$ 5.000,00/mês

PRAZO: 12 meses com renovação automática

INCLUA:
- Cláusula de confidencialidade
- Propriedade intelectual (conteúdo pertence ao contratante)
- SLA de atendimento (24h para resposta)
- Multa por rescisão antecipada (2 mensalidades)
- Foro da comarca de São Paulo
\`\`\`

#### 3. Comparativo de Versões

Quando há negociação com alterações:

\`\`\`
Compare as duas versões do contrato abaixo e liste:

1. Cláusulas alteradas (destaque o que mudou)
2. Cláusulas removidas
3. Cláusulas adicionadas
4. Avaliação: as mudanças favorecem qual parte?

VERSÃO 1: [...]
VERSÃO 2: [...]
\`\`\`

### Fluxo de Trabalho Otimizado

**Antes (sem IA):**
1. Receber demanda do cliente ➜ 10 min
2. Pesquisar modelos similares ➜ 30 min
3. Elaborar primeira versão ➜ 4 horas
4. Revisar ➜ 1 hora
5. Ajustar conforme feedback ➜ 2 horas
**Total: ~8 horas**

**Depois (com IA):**
1. Receber demanda do cliente ➜ 10 min
2. Gerar minuta com IA ➜ 15 min
3. Revisar e personalizar ➜ 1 hora
4. Ajustar conforme feedback ➜ 30 min
**Total: ~2 horas**

### Tipos de Contratos Ideais para Automação

**Alta automação possível:**
- Termos de uso e políticas de privacidade
- NDAs (acordos de confidencialidade)
- Contratos de prestação de serviços simples
- Contratos de locação padrão
- Distrato e aditivos simples

**Automação parcial (exigem mais personalização):**
- Contratos societários
- Acordos de acionistas
- Contratos de M&A
- Licenciamentos complexos

### Ferramentas Especializadas

Além do ChatGPT, existem ferramentas específicas para contratos:

| Ferramenta | Especialidade | Indicação |
|------------|---------------|-----------|
| Claude | Análise de documentos longos | Contratos complexos |
| ChatGPT + Custom GPT | Geração personalizada | Escritórios com templates próprios |
| Notion AI | Organização e gestão | Acompanhamento de contratos |

### Cuidados Essenciais

⚠️ **Sempre revise o resultado**
A IA pode gerar cláusulas tecnicamente corretas mas inadequadas para o caso específico.

⚠️ **Personalize para o contexto**
Contratos são documentos que refletem negociações específicas. O template genérico raramente é suficiente.

⚠️ **Mantenha-se atualizado**
Leis mudam. Verifique se as cláusulas sugeridas estão em conformidade com a legislação atual.

### ROI: Retorno sobre Investimento

Considere um advogado que cobra R$ 400/hora:

- **Economia média por contrato:** 6 horas
- **Valor da economia:** R$ 2.400
- **Custo das ferramentas:** ~R$ 150/mês
- **Retorno:** Mais de 1.500% ao mês

### Conclusão

A automação de contratos com IA não é sobre substituir o advogado, mas sobre **liberá-lo para tarefas de maior valor**: negociação, estratégia e relacionamento com clientes.

**Quer implementar essas técnicas no seu escritório?** Conheça a [Consultoria IDEA](/produtos) e transforme sua prática contratual.
    `
  },
  {
    id: "6",
    slug: "chatgpt-para-advogados-guia-iniciantes",
    title: "ChatGPT para Advogados: Guia para Iniciantes",
    metaDescription: "Guia completo para advogados começarem a usar o ChatGPT. Passo a passo, dicas práticas e exemplos de uso na advocacia.",
    excerpt: "O guia definitivo para advogados que querem começar a usar o ChatGPT de forma prática e eficiente.",
    category: "Tutorial",
    read_time_minutes: 12,
    published_at: "2024-12-20",
    image: blogChatgptAdvogados,
    content: `
## ChatGPT para Advogados: Seu Guia de Início Rápido

Se você ainda não começou a usar o ChatGPT no seu trabalho jurídico, este é o seu ponto de partida. Vou guiá-lo **passo a passo**, do zero ao uso profissional.

### O que é o ChatGPT?

O ChatGPT é uma inteligência artificial conversacional desenvolvida pela OpenAI. Ele entende linguagem natural e pode:

- Redigir textos de diversos tipos
- Resumir documentos
- Responder perguntas
- Analisar informações
- Traduzir conteúdos
- E muito mais

### Primeiros Passos: Criando sua Conta

**Passo 1:** Acesse chat.openai.com

**Passo 2:** Clique em "Sign up" e crie sua conta

**Passo 3:** Escolha entre:
- **ChatGPT Gratuito** - Funcional, mas limitado
- **ChatGPT Plus (US$ 20/mês)** - Acesso ao GPT-4, mais rápido e preciso

**Minha recomendação:** Para uso profissional, invista no Plus. A diferença de qualidade justifica o investimento.

### Interface Básica

A interface é simples:
- **Caixa de texto:** onde você digita suas perguntas
- **Histórico:** conversas anteriores ficam salvas
- **Nova conversa:** para iniciar um novo tema

### Seus Primeiros Comandos Jurídicos

#### 1. Resumo de Texto

\`\`\`
Resuma o seguinte texto jurídico em 5 bullet points principais:

[Cole o texto aqui]
\`\`\`

#### 2. Explicação de Conceito

\`\`\`
Explique o conceito de "teoria da perda de uma chance" de forma simples, como se estivesse explicando para um cliente leigo.
\`\`\`

#### 3. Elaboração de Email

\`\`\`
Escreva um email profissional para um cliente informando que o processo dele teve sentença favorável. Tom: formal mas acolhedor. Inclua próximos passos.
\`\`\`

#### 4. Revisão de Texto

\`\`\`
Revise o texto abaixo, corrigindo erros gramaticais e melhorando a clareza:

[Seu texto aqui]
\`\`\`

### Comandos Intermediários

#### Petição Inicial

\`\`\`
Atue como um advogado especialista em Direito do Trabalho.

Elabore os fundamentos jurídicos para uma petição inicial de ação trabalhista com os seguintes fatos:

- Funcionário: João Silva
- Empresa: XYZ Ltda
- Período: 2020-2024
- Função: Vendedor
- Problemas: Horas extras não pagas, ausência de registro correto

Foque nos argumentos jurídicos, citando a CLT quando aplicável.
\`\`\`

#### Parecer Jurídico

\`\`\`
Elabore um parecer jurídico sobre a seguinte consulta:

"Empresa quer saber se pode monitorar emails corporativos dos funcionários sem aviso prévio."

Estruture em: 
1. Síntese da Consulta
2. Análise Legal
3. Jurisprudência Aplicável
4. Conclusão
5. Recomendações
\`\`\`

### 10 Dicas para Resultados Melhores

1. **Seja específico:** "Elabore uma petição" é pior que "Elabore uma contestação em ação de cobrança no valor de R$ 50.000"

2. **Defina o papel:** "Atue como um advogado especialista em..." orienta a IA

3. **Forneça contexto:** Quanto mais informação, melhor o resultado

4. **Peça formato específico:** "Em bullet points", "Em formato de tabela", "Com subtítulos"

5. **Itere:** Se o resultado não foi bom, peça ajustes em vez de recomeçar

6. **Use exemplos:** "Siga este modelo: ..."

7. **Defina tom:** "Formal", "Acessível", "Técnico"

8. **Limite extensão:** "Máximo 500 palavras" ou "Em uma página"

9. **Peça alternativas:** "Dê 3 opções de argumentação"

10. **Revise sempre:** Nunca use texto sem revisão

### O que o ChatGPT NÃO Pode Fazer

❌ Acessar jurisprudência em tempo real (versão gratuita)
❌ Garantir precisão absoluta em citações
❌ Substituir o julgamento profissional
❌ Acessar seus documentos automaticamente
❌ Manter sigilo absoluto (dados passam pela OpenAI)

### Erros Comuns de Iniciantes

**Erro 1:** Confiar cegamente nas respostas
**Solução:** Sempre verifique informações importantes

**Erro 2:** Prompts muito vagos
**Solução:** Adicione contexto e seja específico

**Erro 3:** Não iterar
**Solução:** Peça ajustes, refinamentos, alternativas

**Erro 4:** Copiar e colar sem adaptar
**Solução:** Personalize para cada caso

### Rotina Diária Sugerida

**Manhã:**
- Resumo de emails importantes
- Organização de tarefas do dia

**Durante o trabalho:**
- Minutas de petições
- Pesquisas rápidas
- Emails para clientes

**Final do dia:**
- Resumos de reuniões
- Planejamento do dia seguinte

### Próximos Passos

Depois de dominar o básico:

1. **Explore Custom GPTs** - Assistentes especializados
2. **Aprenda prompts avançados** - Chain of thought, few-shot learning
3. **Integre ao fluxo** - Crie templates próprios
4. **Considere outras ferramentas** - Claude, Perplexity

### Conclusão

O ChatGPT é uma ferramenta transformadora para advogados. Comece aos poucos, experimente, e logo você não conseguirá imaginar trabalhar sem ele.

**Quer acelerar seu aprendizado?** Conheça o [Guia de IA para Advogados](/produtos), meu e-book prático para iniciantes.
    `
  },
  {
    id: "7",
    slug: "pesquisa-jurisprudencial-ia",
    title: "Pesquisa Jurisprudencial com IA: Técnicas Avançadas",
    metaDescription: "Aprenda técnicas avançadas de pesquisa jurisprudencial usando inteligência artificial. Encontre precedentes relevantes em minutos.",
    excerpt: "Técnicas avançadas para encontrar jurisprudência relevante usando IA e economizar horas de pesquisa.",
    category: "Tutorial",
    read_time_minutes: 8,
    published_at: "2024-12-15",
    image: blogPesquisaJuridica,
    content: `
## Pesquisa Jurisprudencial Turbinada por IA

A pesquisa jurisprudencial é uma das tarefas mais importantes e demoradas na advocacia. Com as técnicas certas de IA, você pode **reduzir horas de trabalho para minutos** sem sacrificar a qualidade.

### O Problema da Pesquisa Tradicional

Advogados frequentemente enfrentam:
- **Excesso de resultados**: Milhares de decisões para filtrar
- **Dificuldade de encontrar precedentes específicos**
- **Tempo excessivo**: Horas navegando em bancos de dados
- **Risco de perder decisões importantes**

### Estratégia 1: Pesquisa Contextualizada com ChatGPT

O ChatGPT pode ajudar a estruturar sua pesquisa:

\`\`\`
Preciso pesquisar jurisprudência sobre o seguinte tema:

TEMA: Responsabilidade civil de hospitais por erro médico em cirurgia estética

AJUDE-ME A:
1. Identificar os termos de busca mais efetivos
2. Listar os argumentos jurídicos principais de cada lado
3. Sugerir tribunais onde devo priorizar a busca
4. Indicar os leading cases mais importantes sobre o tema
\`\`\`

### Estratégia 2: Análise de Decisões com Claude

O Claude é excelente para analisar decisões longas:

\`\`\`
Analise a decisão abaixo e extraia:

1. TESE PRINCIPAL: Qual o entendimento firmado?
2. RATIO DECIDENDI: Qual a fundamentação central?
3. OBITER DICTUM: Há considerações relevantes secundárias?
4. APLICABILIDADE: Em quais situações esse precedente se aplica?
5. DISTINÇÕES: Quais fatos poderiam afastar a aplicação?

[COLE A DECISÃO]
\`\`\`

### Estratégia 3: Pesquisa Atualizada com Perplexity

Para verificar entendimentos recentes:

\`\`\`
Qual o entendimento atual do STJ sobre responsabilidade de plataformas digitais por conteúdo de terceiros após a Lei 14.533/2023?

Cite decisões recentes.
\`\`\`

### Fluxo de Pesquisa Otimizado

**Etapa 1: Mapeamento do Tema**
Use ChatGPT para entender o panorama:
\`\`\`
Faça um mapa mental dos aspectos jurídicos relevantes sobre [TEMA], incluindo:
- Fundamentos legais
- Correntes doutrinárias
- Tribunais relevantes
- Questões controversas
\`\`\`

**Etapa 2: Geração de Termos de Busca**
\`\`\`
Gere 10 combinações de termos de busca para encontrar jurisprudência sobre [TEMA] nos seguintes tribunais:
- STF
- STJ
- TRFs
- TJs estaduais

Considere sinônimos e variações terminológicas.
\`\`\`

**Etapa 3: Triagem Rápida**
\`\`\`
Tenho 15 ementas sobre [TEMA]. Classifique-as por relevância para meu caso, considerando que preciso provar [OBJETIVO]:

[EMENTAS]
\`\`\`

**Etapa 4: Análise Profunda**
Use as estratégias anteriores para analisar as decisões selecionadas.

### Criando sua Base de Conhecimento

Mantenha uma biblioteca de precedentes organizados:

\`\`\`
Crie uma ficha de jurisprudência para esta decisão:

TRIBUNAL:
PROCESSO:
DATA:
RELATOR:
TEMA (3 palavras):
TESE (1 parágrafo):
PALAVRAS-CHAVE:
CITAÇÕES RELEVANTES:

[DECISÃO]
\`\`\`

### Verificando Atualidade de Precedentes

Antes de usar um precedente:

\`\`\`
Analise se este precedente ainda é válido:

1. Houve mudança legislativa que afete a tese?
2. O tribunal modificou seu entendimento posteriormente?
3. Há decisões mais recentes sobre o mesmo tema?
4. Existe repercussão geral ou recurso repetitivo sobre a matéria?

[PRECEDENTE]
\`\`\`

### Comparativo de Ferramentas para Pesquisa

| Tarefa | Melhor Ferramenta |
|--------|-------------------|
| Estruturar pesquisa | ChatGPT |
| Analisar decisões longas | Claude |
| Verificar atualizações | Perplexity |
| Organizar achados | Notion AI |

### Dicas Avançadas

#### 1. Pesquisa por Similaridade
\`\`\`
Tenho esta decisão favorável. Encontre os argumentos que posso usar para distingui-la de um caso onde [SITUAÇÃO DIFERENTE]:

[DECISÃO]
\`\`\`

#### 2. Contra-argumentação
\`\`\`
Identifiquei esta jurisprudência contrária. Quais argumentos posso usar para afastá-la do meu caso?

[DECISÃO CONTRÁRIA]
[MEU CASO]
\`\`\`

#### 3. Tendência Jurisprudencial
\`\`\`
Com base nestas 5 decisões em ordem cronológica, identifique se há uma tendência de mudança no entendimento do tribunal:

[DECISÕES]
\`\`\`

### Armadilhas a Evitar

⚠️ **Citações inventadas**: Sempre verifique se o precedente existe
⚠️ **Decisões desatualizadas**: Confirme a atualidade do entendimento  
⚠️ **Contexto diferente**: Certifique-se de que o precedente se aplica ao seu caso

### Conclusão

A IA não substitui o conhecimento jurídico, mas amplifica a capacidade de encontrar e analisar precedentes. O advogado que domina essas técnicas tem uma vantagem competitiva significativa.

**Quer dominar todas essas técnicas?** Conheça o [Curso IDEA](/produtos) e transforme sua pesquisa jurídica.
    `
  },
  {
    id: "8",
    slug: "produtividade-escritorio-advocacia-ia",
    title: "Como Aumentar a Produtividade do Escritório com IA",
    metaDescription: "Estratégias práticas para aumentar a produtividade do seu escritório de advocacia usando inteligência artificial. Cases reais e resultados.",
    excerpt: "Estratégias práticas para aumentar a produtividade do seu escritório de advocacia usando inteligência artificial.",
    category: "Produtividade",
    read_time_minutes: 7,
    published_at: "2024-12-10",
    image: blogProdutividade,
    content: `
## Transforme a Produtividade do Seu Escritório com IA

Escritórios de advocacia que implementam IA estrategicamente reportam **aumentos de produtividade de 40% a 60%**. Neste artigo, compartilho as estratégias que recomendo aos meus clientes de consultoria.

### Diagnóstico: Onde Está o Tempo Perdido?

Antes de implementar IA, identifique os gargalos:

**Tarefas que mais consomem tempo:**
1. Elaboração de peças processuais (30%)
2. Pesquisa jurídica (25%)
3. Comunicação com clientes (20%)
4. Tarefas administrativas (15%)
5. Gestão de prazos (10%)

### Estratégia 1: Automatize a Elaboração de Documentos

**Impacto:** Redução de 50% no tempo

**Como implementar:**
1. Crie templates padronizados para peças frequentes
2. Use IA para gerar primeiras versões
3. Desenvolva prompts específicos para cada tipo de documento
4. Treine a equipe para revisar e personalizar

**Prompt modelo para petição:**
\`\`\`
Você é meu assistente jurídico especializado em [ÁREA].

Template a seguir:
[MODELO DO ESCRITÓRIO]

Dados do caso:
[INFORMAÇÕES]

Gere a peça seguindo nosso padrão.
\`\`\`

### Estratégia 2: Acelere a Comunicação com Clientes

**Impacto:** Redução de 60% no tempo de comunicação

**Implementações:**
- **Emails de atualização:** IA gera texto base
- **Explicações de decisões:** Tradução de "juridiquês" para linguagem acessível
- **FAQs automáticas:** Respostas para perguntas frequentes

**Exemplo prático:**
\`\`\`
Traduza a decisão abaixo para linguagem acessível a um cliente leigo. 
Destaque: o que aconteceu, o que significa para ele, e próximos passos.

[DECISÃO]
\`\`\`

### Estratégia 3: Otimize a Gestão do Escritório

**Impacto:** 30% mais eficiência administrativa

**Ferramentas integradas:**
- **Notion AI:** Organização de casos e tarefas
- **ChatGPT:** Atas de reunião e relatórios
- **Calendário IA:** Otimização de agendamentos

**Rotinas automatizáveis:**
- Resumo diário de prazos
- Relatório semanal de produtividade
- Atas de reunião automáticas

### Estratégia 4: Treinamento da Equipe

**Fundamental:** A IA só gera resultados se a equipe souber usar.

**Programa de capacitação:**
- **Semana 1:** Fundamentos de IA e ChatGPT básico
- **Semana 2:** Prompts jurídicos específicos
- **Semana 3:** Integração ao fluxo de trabalho
- **Semana 4:** Práticas avançadas e revisão

### Métricas de Sucesso

**Acompanhe estes indicadores:**

| Métrica | Antes da IA | Meta com IA |
|---------|-------------|-------------|
| Tempo médio por petição | 4 horas | 2 horas |
| Peças produzidas/semana | 15 | 25 |
| Tempo resposta cliente | 48h | 24h |
| Retrabalho | 20% | 8% |
| Satisfação da equipe | 70% | 85% |

### Cases Reais

**Escritório de Família (3 advogados):**
- Antes: 12 petições/semana
- Depois: 22 petições/semana
- Crescimento: 83%

**Escritório Trabalhista (5 advogados):**
- Antes: Pesquisa média 3h
- Depois: Pesquisa média 45min
- Economia: 75%

**Escritório Empresarial (8 advogados):**
- Antes: Contrato médio 6h
- Depois: Contrato médio 2h
- Economia: 67%

### Implementação em 30 Dias

**Semana 1:** Diagnóstico e planejamento
- Identifique tarefas repetitivas
- Escolha ferramentas iniciais
- Defina metas

**Semana 2:** Primeiras implementações
- Comece com ChatGPT para elaboração de textos
- Teste em tarefas de baixo risco
- Documente resultados

**Semana 3:** Expansão
- Treine mais membros da equipe
- Adicione novas aplicações
- Refine processos

**Semana 4:** Consolidação
- Padronize melhores práticas
- Crie biblioteca de prompts
- Defina rotinas de uso

### Erros a Evitar

❌ **Implementar tudo de uma vez**
Comece pequeno e expanda gradualmente.

❌ **Ignorar a resistência da equipe**
Envolva todos no processo e mostre benefícios.

❌ **Não medir resultados**
Sem métricas, você não sabe se está funcionando.

❌ **Esquecer a revisão humana**
IA acelera, mas não substitui a verificação.

### Investimento vs. Retorno

**Custos mensais aproximados:**
- Ferramentas de IA: R$ 500
- Treinamento inicial: R$ 2.000 (único)

**Economia mensal estimada:**
- Horas economizadas: 40h
- Valor das horas (R$ 400/h): R$ 16.000
- **ROI: 3.200%**

### Conclusão

A implementação de IA não é mais opcional – é uma necessidade competitiva. Escritórios que adotam agora terão vantagem significativa nos próximos anos.

**Quer uma implementação guiada e personalizada?** Conheça nossa [Consultoria IDEA](/produtos) e transforme seu escritório.
    `
  }
];

export function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  
  const article = articles.find(a => a.slug === slug);
  
  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const relatedArticles = articles.filter(a => a.id !== article.id).slice(0, 3);

  return (
    <>
      <Helmet>
        <title>{article.title} | Rafael Egg - IA na Advocacia</title>
        <meta name="description" content={article.metaDescription} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.metaDescription} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#0f1419] to-[#1a1f2e]">
        {/* Header */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/20 via-transparent to-transparent" />
          
          <nav className="relative z-10 container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3 group">
                <img src={logoRE} alt="Rafael Egg" className="h-20 w-20 object-contain transition-transform duration-300 group-hover:scale-110" />
                <span className="text-2xl font-bold text-white tracking-tight">Rafael Egg</span>
              </Link>
              <Button variant="ghost" className="text-slate-300 hover:text-amber-400" asChild>
                <Link to="/blog">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Blog
                </Link>
              </Button>
            </div>
          </nav>
        </header>

        {/* Article Hero */}
        <section className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">
              {article.category}
            </Badge>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-slate-400 mb-8">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Rafael Egg
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(article.published_at).toLocaleDateString('pt-BR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {article.read_time_minutes} min de leitura
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden mb-12">
              <img 
                src={article.image} 
                alt={article.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="container mx-auto px-6 pb-16">
          <article className="max-w-4xl mx-auto">
            <div 
              className="prose prose-lg prose-invert prose-amber max-w-none
                prose-headings:text-white prose-headings:font-bold
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-3
                prose-p:text-slate-300 prose-p:leading-relaxed
                prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-amber-400
                prose-blockquote:border-amber-500 prose-blockquote:bg-slate-800/50 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-lg
                prose-code:text-amber-400 prose-code:bg-slate-800 prose-code:px-2 prose-code:py-1 prose-code:rounded
                prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700
                prose-ul:text-slate-300 prose-ol:text-slate-300
                prose-li:marker:text-amber-500
                prose-table:text-slate-300
                prose-th:text-amber-400 prose-th:border-slate-600
                prose-td:border-slate-700"
              dangerouslySetInnerHTML={{ 
                __html: article.content
                  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                  .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
                  .replace(/^- (.*$)/gm, '<li>$1</li>')
                  .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
                  .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                  .replace(/`([^`]+)`/g, '<code>$1</code>')
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/^(?!<[hbupol])/gm, '<p>')
                  .replace(/(?<![>])$/gm, '</p>')
                  .replace(/<p><\/p>/g, '')
                  .replace(/<p>(<[hbupol])/g, '$1')
                  .replace(/(<\/[hbupol][^>]*>)<\/p>/g, '$1')
                  .replace(/\|(.+)\|/g, (match) => {
                    const cells = match.split('|').filter(c => c.trim());
                    if (cells.some(c => c.includes('---'))) return '';
                    const isHeader = !match.includes('<td>');
                    const tag = isHeader ? 'th' : 'td';
                    return `<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('')}</tr>`;
                  })
              }}
            />

            {/* Share */}
            <div className="flex items-center gap-4 mt-12 pt-8 border-t border-slate-700">
              <span className="text-slate-400">Compartilhar:</span>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-amber-400">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </article>
        </section>

        {/* Related Articles */}
        <section className="container mx-auto px-6 py-16 border-t border-slate-800">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Artigos Relacionados</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {relatedArticles.map(related => (
              <Link 
                key={related.id} 
                to={`/blog/${related.slug}`}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-amber-500/50 transition-all duration-300 group"
              >
                <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg mb-4 overflow-hidden">
                  <img src={related.image} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 mb-2">
                  {related.category}
                </Badge>
                <h3 className="text-white font-semibold group-hover:text-amber-400 transition-colors line-clamp-2">
                  {related.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-amber-600/20 to-orange-600/20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Quer dominar a IA na advocacia?
            </h2>
            <p className="text-slate-300 mb-6 max-w-xl mx-auto">
              Conheça nossos produtos e transforme sua prática jurídica
            </p>
            <Button 
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              asChild
            >
              <Link to="/#produtos">
                <BookOpen className="mr-2 h-4 w-4" />
                Ver Produtos
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-slate-900 border-t border-slate-800">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <Link to="/" className="flex items-center gap-2">
                <img src={logoRE} alt="Rafael Egg" className="h-12 w-12 object-contain" />
                <span className="text-xl font-bold text-white">Rafael Egg</span>
              </Link>
              <div className="flex gap-3">
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
              </div>
            </div>
            <div className="mt-8 text-center text-slate-400 text-sm">
              <p>&copy; {new Date().getFullYear()} Rafael Egg. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
