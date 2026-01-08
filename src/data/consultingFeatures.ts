export interface ConsultingFeature {
  id: number;
  name: string;
  description: string;
  category: string;
}

export const CONSULTING_FEATURES: ConsultingFeature[] = [
  // Inteligência Artificial (1-4)
  { id: 1, name: "RotaDoc - Processamento Inteligente de Documentos", description: "Sistema de IA para processamento automatizado de documentos jurídicos com correção de orientação, identificação de tipos e organização automática.", category: "IA" },
  { id: 2, name: "Assistente de IA Personalizado", description: "Assistente inteligente treinado para responder perguntas, auxiliar na redação de peças e automatizar tarefas.", category: "IA" },
  { id: 3, name: "Agentes de IA Especializados", description: "Múltiplos agentes para análise de contratos, pesquisa jurisprudencial, elaboração de pareceres e revisão de peças.", category: "IA" },
  { id: 4, name: "Pesquisa de Jurisprudência Inteligente", description: "Busca avançada em jurisprudência com filtros inteligentes, análise de tendências e sumarização automática.", category: "IA" },

  // Jurídico e Processual (5-8)
  { id: 5, name: "Integração com Sistema de Gestão Processual", description: "Sincronização bidirecional com Advbox, Projuris, Astrea ou outro sistema de gestão processual.", category: "Jurídico" },
  { id: 6, name: "Analytics Processual Avançado", description: "Dashboards de produtividade, tempo de tramitação, taxa de sucesso e identificação de gargalos.", category: "Jurídico" },
  { id: 7, name: "Gestão Inteligente de Tarefas Processuais", description: "Atribuição automática, priorização por urgência, notificações de prazos e relatórios de produtividade.", category: "Jurídico" },
  { id: 8, name: "Banco de Decisões Favoráveis", description: "Repositório de decisões favoráveis com categorização, busca avançada e compartilhamento de estratégias.", category: "Jurídico" },

  // Gestão e Produtividade (9-13)
  { id: 9, name: "CRM - Gestão de Relacionamento com Clientes", description: "Cadastro de clientes, histórico de interações, gestão de oportunidades e análise de rentabilidade.", category: "Gestão" },
  { id: 10, name: "Lead Tracking - Rastreamento de Leads", description: "Captura automatizada, funil de vendas visual, pontuação de leads e automação de follow-up.", category: "Gestão" },
  { id: 11, name: "Dashboard Comercial Completo", description: "Pipeline de vendas, taxa de conversão, ticket médio, metas vs. realizado e alertas.", category: "Gestão" },
  { id: 12, name: "Relatórios de Produtividade", description: "Produtividade individual e por equipe, tempo dedicado, análise de capacidade e benchmarks.", category: "Gestão" },
  { id: 13, name: "Dashboard Principal Executivo", description: "Visão 360º com indicadores financeiros, processuais, comerciais e de RH.", category: "Gestão" },

  // Financeiro e Comercial (14-17)
  { id: 14, name: "Módulo Financeiro Integrado", description: "Contas a pagar/receber, fluxo de caixa, conciliação bancária, centros de custo e emissão de boletos.", category: "Financeiro" },
  { id: 15, name: "Integração Asaas (Gestão de Cobranças)", description: "Geração automática de boletos e PIX, lembretes de vencimento e controle de inadimplência.", category: "Financeiro" },
  { id: 16, name: "Collection Management - Gestão de Cobranças", description: "Workflow de cobrança, negociação de dívidas, histórico de contatos e relatórios de recuperação.", category: "Financeiro" },
  { id: 17, name: "Relatórios Financeiros Avançados", description: "DRE, balanço patrimonial, fluxo de caixa detalhado e indicadores financeiros.", category: "Financeiro" },

  // Recursos Humanos (18-23)
  { id: 18, name: "Sistema Completo de Recrutamento e Seleção", description: "Publicação de vagas, análise de currículos com IA, pipeline Kanban e banco de talentos.", category: "RH" },
  { id: 19, name: "Onboarding - Integração de Novos Colaboradores", description: "Checklist por cargo, distribuição de materiais, acompanhamento de progresso e avaliação.", category: "RH" },
  { id: 20, name: "Gestão de Equipe e Organograma", description: "Cadastro completo, organograma visual, histórico profissional e diretório interno.", category: "RH" },
  { id: 21, name: "Gestão de Férias e Ausências", description: "Solicitação e aprovação, calendário de disponibilidade, controle de saldo e licenças.", category: "RH" },
  { id: 22, name: "Gestão de Home Office e Trabalho Híbrido", description: "Solicitação de home office, escala híbrida, registro de ponto remoto e produtividade.", category: "RH" },
  { id: 23, name: "Calendário de Aniversários", description: "Notificações automáticas, envio de mensagens personalizadas e integração com relacionamento.", category: "RH" },

  // Comunicação e Colaboração (24-31)
  { id: 24, name: "Sistema de Mensagens Internas", description: "Mensagens diretas e em grupo, notificações em tempo real e compartilhamento de arquivos.", category: "Comunicação" },
  { id: 25, name: "Mensagens Encaminhadas e Atribuição", description: "Triagem de mensagens de clientes, atribuição de responsáveis e SLA de atendimento.", category: "Comunicação" },
  { id: 26, name: "Central de Notificações", description: "Alertas de prazos, lembretes de tarefas, avisos do sistema e preferências personalizadas.", category: "Comunicação" },
  { id: 27, name: "Mural de Avisos", description: "Comunicados para equipe, categorização por tipo, fixação de avisos e confirmação de leitura.", category: "Comunicação" },
  { id: 28, name: "Feed de Publicações Internas", description: "Rede social corporativa com compartilhamento de conquistas e reconhecimento.", category: "Comunicação" },
  { id: 29, name: "Fórum de Discussões", description: "Tópicos por área temática, votação de respostas e base de conhecimento colaborativa.", category: "Comunicação" },
  { id: 30, name: "Caixinha de Desabafo Anônima", description: "Canal confidencial de feedback, análise de clima e ações de melhoria.", category: "Comunicação" },
  { id: 31, name: "Sistema de Sugestões e Inovação", description: "Envio de sugestões, votação da equipe, acompanhamento de implementação e reconhecimento.", category: "Comunicação" },

  // Utilidades e Ferramentas (32-40)
  { id: 32, name: "Gestão de Documentos e Templates", description: "Biblioteca de modelos, versionamento, busca avançada e controle de acesso.", category: "Utilidades" },
  { id: 33, name: "Arquivos Teams e Integração Microsoft", description: "Acesso a arquivos do Teams/OneDrive, sincronização e colaboração em tempo real.", category: "Utilidades" },
  { id: 34, name: "Gerador de QR Code", description: "Criação de QR Codes para URLs, textos e contatos com personalização visual.", category: "Utilidades" },
  { id: 35, name: "Reserva de Salas de Reunião", description: "Calendário de disponibilidade, reserva de recursos, check-in e relatórios de ocupação.", category: "Utilidades" },
  { id: 36, name: "Solicitações Administrativas", description: "Chamados de materiais, manutenção, TI e serviços com acompanhamento de status.", category: "Utilidades" },
  { id: 37, name: "Gestão de Copa/Cozinha", description: "Controle de estoque, solicitação de reposição e escala de limpeza.", category: "Utilidades" },
  { id: 38, name: "Galeria de Eventos", description: "Álbum digital de eventos, upload de fotos/vídeos e compartilhamento.", category: "Utilidades" },
  { id: 39, name: "Sobre o Escritório - Página Institucional", description: "História, missão/visão/valores, equipe, áreas de atuação e prêmios.", category: "Utilidades" },
  { id: 40, name: "Gestão de Parceiros e Fornecedores", description: "Cadastro de parceiros, avaliação de desempenho e controle de pagamentos.", category: "Utilidades" },

  // Segurança e Administração (41-46)
  { id: 41, name: "Sistema de Autenticação e Controle de Acesso", description: "Login seguro, autenticação multifator, controle de sessões e logs de acesso.", category: "Segurança" },
  { id: 42, name: "Gestão de Perfis e Permissões", description: "Perfis de usuário, permissões por módulo e auditoria de acessos.", category: "Segurança" },
  { id: 43, name: "Códigos de Autenticação 2FA", description: "Configuração de 2FA, múltiplos métodos e códigos de backup.", category: "Segurança" },
  { id: 44, name: "Painel Administrativo Completo", description: "Gestão de usuários, configurações globais, backup e manutenção.", category: "Segurança" },
  { id: 45, name: "Sistema de Logs e Auditoria", description: "Registro de ações, identificação de usuário, conformidade LGPD.", category: "Segurança" },
  { id: 46, name: "Histórico de Uso do Sistema", description: "Ferramentas utilizadas por usuário, tempo de uso e métricas de engajamento.", category: "Segurança" },

  // Integrações (47-50)
  { id: 47, name: "Central de Integrações", description: "Configuração de APIs e webhooks, sincronização de dados e monitoramento.", category: "Integrações" },
  { id: 48, name: "Integração com Redes Sociais", description: "Publicação automatizada, monitoramento de menções e captação de leads.", category: "Integrações" },
  { id: 49, name: "Integração com E-mail Marketing", description: "Campanhas automatizadas, segmentação de contatos e análise de métricas.", category: "Integrações" },
  { id: 50, name: "Integração com Assinatura Eletrônica", description: "Envio de documentos para assinatura digital, acompanhamento e armazenamento.", category: "Integrações" },
];

export const FEATURE_CATEGORIES = [
  { id: "IA", name: "Inteligência Artificial", icon: "🤖" },
  { id: "Jurídico", name: "Jurídico e Processual", icon: "⚖️" },
  { id: "Gestão", name: "Gestão e Produtividade", icon: "📊" },
  { id: "Financeiro", name: "Financeiro e Comercial", icon: "💰" },
  { id: "RH", name: "Recursos Humanos", icon: "👥" },
  { id: "Comunicação", name: "Comunicação e Colaboração", icon: "💬" },
  { id: "Utilidades", name: "Utilidades e Ferramentas", icon: "🛠️" },
  { id: "Segurança", name: "Segurança e Administração", icon: "🔐" },
  { id: "Integrações", name: "Integrações", icon: "🔗" },
];
