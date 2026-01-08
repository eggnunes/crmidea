export interface ConsultingFeature {
  id: number;
  name: string;
  description: string;
  category: string;
}

export const CONSULTING_FEATURES: ConsultingFeature[] = [
  // Inteligência Artificial (1-10)
  { id: 1, name: "RotaDoc - Processamento Inteligente de Documentos", description: "Sistema de IA para processamento automatizado de documentos jurídicos com correção de orientação, identificação de tipos e organização automática.", category: "IA" },
  { id: 2, name: "Assistente de IA Personalizado", description: "Assistente inteligente treinado para responder perguntas, auxiliar na redação de peças e automatizar tarefas.", category: "IA" },
  { id: 3, name: "Agentes de IA Especializados", description: "Múltiplos agentes para análise de contratos, pesquisa jurisprudencial, elaboração de pareceres e revisão de peças.", category: "IA" },
  { id: 4, name: "Pesquisa de Jurisprudência Inteligente", description: "Busca avançada em jurisprudência com filtros inteligentes, análise de tendências e sumarização automática.", category: "IA" },
  { id: 5, name: "Geração de Peças Jurídicas com IA", description: "Criação automatizada de petições, contestações, recursos e outras peças processuais usando inteligência artificial.", category: "IA" },
  { id: 6, name: "Análise de Contratos com IA", description: "Revisão automatizada de contratos identificando cláusulas de risco, sugestões de melhoria e comparação com padrões.", category: "IA" },
  { id: 7, name: "Chatbot de Atendimento Inicial", description: "Bot inteligente para triagem de clientes, agendamento de consultas e coleta de informações preliminares.", category: "IA" },
  { id: 8, name: "Sumarização Automática de Processos", description: "IA que lê e resume automaticamente andamentos processuais, decisões e despachos.", category: "IA" },
  { id: 9, name: "Transcrição de Áudios e Vídeos", description: "Conversão automática de audiências, reuniões e gravações em texto com identificação de falantes.", category: "IA" },
  { id: 10, name: "Análise Preditiva de Processos", description: "IA que analisa chances de êxito, tempo estimado de tramitação e valores de condenação.", category: "IA" },

  // Documentos Automáticos (11-18)
  { id: 11, name: "Geração de Contratos de Honorários", description: "Criação automática de contratos de honorários personalizados com cláusulas padrão e valores configuráveis.", category: "Documentos" },
  { id: 12, name: "Geração de Procurações", description: "Criação automática de procurações ad judicia e outras, com dados do cliente já preenchidos.", category: "Documentos" },
  { id: 13, name: "Declarações de Justiça Gratuita", description: "Geração automática de declarações de hipossuficiência para pedidos de gratuidade de justiça.", category: "Documentos" },
  { id: 14, name: "Geração de Substabelecimentos", description: "Criação automática de substabelecimentos com e sem reservas de poderes.", category: "Documentos" },
  { id: 15, name: "Templates de Contratos Diversos", description: "Biblioteca de modelos de contratos (prestação de serviços, compra e venda, locação, etc.).", category: "Documentos" },
  { id: 16, name: "Geração de Recibos e Notas", description: "Emissão automática de recibos de pagamento e notas de honorários.", category: "Documentos" },
  { id: 17, name: "Cartas e Notificações Extrajudiciais", description: "Templates para notificações, interpelações e cartas formais com preenchimento automático.", category: "Documentos" },
  { id: 18, name: "Termos de Acordo e Transação", description: "Geração de termos de acordo, quitação e transação com cálculos automáticos.", category: "Documentos" },

  // Jurídico e Processual (19-24)
  { id: 19, name: "Integração com Sistema de Gestão Processual", description: "Sincronização bidirecional com seu sistema de gestão processual atual (Projuris, Astrea, Themis, GOJUR, SAJ ou outro).", category: "Jurídico" },
  { id: 20, name: "Analytics Processual Avançado", description: "Dashboards de produtividade, tempo de tramitação, taxa de sucesso e identificação de gargalos.", category: "Jurídico" },
  { id: 21, name: "Gestão Inteligente de Tarefas Processuais", description: "Atribuição automática, priorização por urgência, notificações de prazos e relatórios de produtividade.", category: "Jurídico" },
  { id: 22, name: "Banco de Decisões Favoráveis", description: "Repositório de decisões favoráveis com categorização, busca avançada e compartilhamento de estratégias.", category: "Jurídico" },
  { id: 23, name: "Controle de Prazos Automatizado", description: "Sistema de alertas de prazos processuais com notificações por e-mail, WhatsApp e push.", category: "Jurídico" },
  { id: 24, name: "Calculadora Jurídica Integrada", description: "Cálculos trabalhistas, correção monetária, juros, honorários sucumbenciais e custas.", category: "Jurídico" },

  // Gestão e Produtividade (25-31)
  { id: 25, name: "CRM - Gestão de Relacionamento com Clientes", description: "Cadastro de clientes, histórico de interações, gestão de oportunidades e análise de rentabilidade.", category: "Gestão" },
  { id: 26, name: "Lead Tracking - Rastreamento de Leads", description: "Captura automatizada, funil de vendas visual, pontuação de leads e automação de follow-up.", category: "Gestão" },
  { id: 27, name: "Dashboard Comercial Completo", description: "Pipeline de vendas, taxa de conversão, ticket médio, metas vs. realizado e alertas.", category: "Gestão" },
  { id: 28, name: "Relatórios de Produtividade", description: "Produtividade individual e por equipe, tempo dedicado, análise de capacidade e benchmarks.", category: "Gestão" },
  { id: 29, name: "Dashboard Principal Executivo", description: "Visão 360º com indicadores financeiros, processuais, comerciais e de RH.", category: "Gestão" },
  { id: 30, name: "Gestão de Projetos e Tarefas", description: "Kanban, Gantt, checklists, dependências entre tarefas e acompanhamento de progresso.", category: "Gestão" },
  { id: 31, name: "OKRs e Metas do Escritório", description: "Definição e acompanhamento de objetivos e resultados-chave do escritório.", category: "Gestão" },

  // Financeiro e Comercial (32-38)
  { id: 32, name: "Módulo Financeiro Integrado", description: "Contas a pagar/receber, fluxo de caixa, conciliação bancária, centros de custo e emissão de boletos.", category: "Financeiro" },
  { id: 33, name: "Integração Asaas (Gestão de Cobranças)", description: "Geração automática de boletos e PIX, lembretes de vencimento e controle de inadimplência.", category: "Financeiro" },
  { id: 34, name: "Collection Management - Gestão de Cobranças", description: "Workflow de cobrança, negociação de dívidas, histórico de contatos e relatórios de recuperação.", category: "Financeiro" },
  { id: 35, name: "Relatórios Financeiros Avançados", description: "DRE, balanço patrimonial, fluxo de caixa detalhado e indicadores financeiros.", category: "Financeiro" },
  { id: 36, name: "Controle de Time Sheet", description: "Registro de horas trabalhadas por processo/cliente para cobrança de honorários.", category: "Financeiro" },
  { id: 37, name: "Gestão de Custas e Despesas", description: "Controle de custas processuais, despesas reembolsáveis e adiantamentos.", category: "Financeiro" },
  { id: 38, name: "Faturamento Automático", description: "Geração automática de faturas com base em contratos e horas trabalhadas.", category: "Financeiro" },

  // Recursos Humanos (39-46)
  { id: 39, name: "Sistema Completo de Recrutamento e Seleção", description: "Publicação de vagas, análise de currículos com IA, pipeline Kanban e banco de talentos.", category: "RH" },
  { id: 40, name: "Onboarding - Integração de Novos Colaboradores", description: "Checklist por cargo, distribuição de materiais, acompanhamento de progresso e avaliação.", category: "RH" },
  { id: 41, name: "Gestão de Equipe e Organograma", description: "Cadastro completo, organograma visual, histórico profissional e diretório interno.", category: "RH" },
  { id: 42, name: "Gestão de Férias e Ausências", description: "Solicitação e aprovação, calendário de disponibilidade, controle de saldo e licenças.", category: "RH" },
  { id: 43, name: "Gestão de Home Office e Trabalho Híbrido", description: "Solicitação de home office, escala híbrida, registro de ponto remoto e produtividade.", category: "RH" },
  { id: 44, name: "Calendário de Aniversários", description: "Notificações automáticas, envio de mensagens personalizadas e integração com relacionamento.", category: "RH" },
  { id: 45, name: "Avaliação de Desempenho", description: "Ciclos de avaliação, feedback 360°, PDI e acompanhamento de metas individuais.", category: "RH" },
  { id: 46, name: "Treinamento e Desenvolvimento", description: "Catálogo de cursos, trilhas de aprendizado, certificações e controle de horas.", category: "RH" },

  // Comunicação e Colaboração (47-56)
  { id: 47, name: "Sistema de Mensagens Internas", description: "Mensagens diretas e em grupo, notificações em tempo real e compartilhamento de arquivos.", category: "Comunicação" },
  { id: 48, name: "Mensagens Encaminhadas e Atribuição", description: "Triagem de mensagens de clientes, atribuição de responsáveis e SLA de atendimento.", category: "Comunicação" },
  { id: 49, name: "Central de Notificações", description: "Alertas de prazos, lembretes de tarefas, avisos do sistema e preferências personalizadas.", category: "Comunicação" },
  { id: 50, name: "Mural de Avisos", description: "Comunicados para equipe, categorização por tipo, fixação de avisos e confirmação de leitura.", category: "Comunicação" },
  { id: 51, name: "Feed de Publicações Internas", description: "Rede social corporativa com compartilhamento de conquistas e reconhecimento.", category: "Comunicação" },
  { id: 52, name: "Fórum de Discussões", description: "Tópicos por área temática, votação de respostas e base de conhecimento colaborativa.", category: "Comunicação" },
  { id: 53, name: "Caixinha de Desabafo Anônima", description: "Canal confidencial de feedback, análise de clima e ações de melhoria.", category: "Comunicação" },
  { id: 54, name: "Sistema de Sugestões e Inovação", description: "Envio de sugestões, votação da equipe, acompanhamento de implementação e reconhecimento.", category: "Comunicação" },
  { id: 55, name: "Integração com WhatsApp Business", description: "Atendimento centralizado, respostas automáticas, chatbot e histórico de conversas.", category: "Comunicação" },
  { id: 56, name: "Portal do Cliente", description: "Área exclusiva para clientes acompanharem processos, documentos e comunicação.", category: "Comunicação" },

  // Utilidades e Ferramentas (57-68)
  { id: 57, name: "Gestão de Documentos e Templates", description: "Biblioteca de modelos, versionamento, busca avançada e controle de acesso.", category: "Utilidades" },
  { id: 58, name: "Arquivos Teams e Integração Microsoft", description: "Acesso a arquivos do Teams/OneDrive, sincronização e colaboração em tempo real.", category: "Utilidades" },
  { id: 59, name: "Gerador de QR Code", description: "Criação de QR Codes para URLs, textos e contatos com personalização visual.", category: "Utilidades" },
  { id: 60, name: "Reserva de Salas de Reunião", description: "Calendário de disponibilidade, reserva de recursos, check-in e relatórios de ocupação.", category: "Utilidades" },
  { id: 61, name: "Solicitações Administrativas", description: "Chamados de materiais, manutenção, TI e serviços com acompanhamento de status.", category: "Utilidades" },
  { id: 62, name: "Gestão de Copa/Cozinha", description: "Controle de estoque, solicitação de reposição e escala de limpeza.", category: "Utilidades" },
  { id: 63, name: "Galeria de Eventos", description: "Álbum digital de eventos, upload de fotos/vídeos e compartilhamento.", category: "Utilidades" },
  { id: 64, name: "Sobre o Escritório - Página Institucional", description: "História, missão/visão/valores, equipe, áreas de atuação e prêmios.", category: "Utilidades" },
  { id: 65, name: "Gestão de Parceiros e Fornecedores", description: "Cadastro de parceiros, avaliação de desempenho e controle de pagamentos.", category: "Utilidades" },
  { id: 66, name: "Agenda e Calendário Integrado", description: "Agenda compartilhada, sincronização com Google/Outlook, lembretes e convites.", category: "Utilidades" },
  { id: 67, name: "Controle de Patrimônio", description: "Inventário de equipamentos, atribuição de responsáveis e manutenções.", category: "Utilidades" },
  { id: 68, name: "Base de Conhecimento Interna", description: "Wiki do escritório com procedimentos, políticas e manuais.", category: "Utilidades" },

  // Segurança e Administração (69-76)
  { id: 69, name: "Sistema de Autenticação e Controle de Acesso", description: "Login seguro, autenticação multifator, controle de sessões e logs de acesso.", category: "Segurança" },
  { id: 70, name: "Gestão de Perfis e Permissões", description: "Perfis de usuário, permissões por módulo e auditoria de acessos.", category: "Segurança" },
  { id: 71, name: "Códigos de Autenticação 2FA", description: "Configuração de 2FA, múltiplos métodos e códigos de backup.", category: "Segurança" },
  { id: 72, name: "Painel Administrativo Completo", description: "Gestão de usuários, configurações globais, backup e manutenção.", category: "Segurança" },
  { id: 73, name: "Sistema de Logs e Auditoria", description: "Registro de ações, identificação de usuário, conformidade LGPD.", category: "Segurança" },
  { id: 74, name: "Histórico de Uso do Sistema", description: "Ferramentas utilizadas por usuário, tempo de uso e métricas de engajamento.", category: "Segurança" },
  { id: 75, name: "Backup e Recuperação de Dados", description: "Backups automáticos, versionamento de arquivos e recuperação de dados.", category: "Segurança" },
  { id: 76, name: "Conformidade LGPD", description: "Gestão de consentimentos, anonimização de dados e relatórios de compliance.", category: "Segurança" },

  // Integrações (77-85)
  { id: 77, name: "Central de Integrações", description: "Configuração de APIs e webhooks, sincronização de dados e monitoramento.", category: "Integrações" },
  { id: 78, name: "Integração com Redes Sociais", description: "Publicação automatizada, monitoramento de menções e captação de leads.", category: "Integrações" },
  { id: 79, name: "Integração com E-mail Marketing", description: "Campanhas automatizadas, segmentação de contatos e análise de métricas.", category: "Integrações" },
  { id: 80, name: "Integração com Assinatura Eletrônica", description: "Envio de documentos para assinatura digital, acompanhamento e armazenamento.", category: "Integrações" },
  { id: 81, name: "Integração com Tribunais (PJe, e-SAJ)", description: "Consulta automática de andamentos, download de documentos e protocolo.", category: "Integrações" },
  { id: 82, name: "Integração com Google Workspace", description: "Sincronização com Gmail, Drive, Agenda e Meet.", category: "Integrações" },
  { id: 83, name: "Integração com Microsoft 365", description: "Sincronização com Outlook, OneDrive, Teams e calendário.", category: "Integrações" },
  { id: 84, name: "Integração com Contabilidade", description: "Exportação de dados financeiros para sistemas contábeis.", category: "Integrações" },
  { id: 85, name: "API para Integrações Personalizadas", description: "API REST documentada para integrações customizadas com outros sistemas.", category: "Integrações" },
];

export const FEATURE_CATEGORIES = [
  { id: "IA", name: "Inteligência Artificial", icon: "🤖" },
  { id: "Documentos", name: "Documentos Automáticos", icon: "📄" },
  { id: "Jurídico", name: "Jurídico e Processual", icon: "⚖️" },
  { id: "Gestão", name: "Gestão e Produtividade", icon: "📊" },
  { id: "Financeiro", name: "Financeiro e Comercial", icon: "💰" },
  { id: "RH", name: "Recursos Humanos", icon: "👥" },
  { id: "Comunicação", name: "Comunicação e Colaboração", icon: "💬" },
  { id: "Utilidades", name: "Utilidades e Ferramentas", icon: "🛠️" },
  { id: "Segurança", name: "Segurança e Administração", icon: "🔐" },
  { id: "Integrações", name: "Integrações", icon: "🔗" },
];
