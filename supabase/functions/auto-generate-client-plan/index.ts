import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Mapeamento de motivações para português
const MOTIVATIONS_MAP: Record<string, string> = {
  "efficiency": "Aumentar a eficiência do escritório",
  "cost_reduction": "Reduzir custos operacionais",
  "costs": "Reduzir custos operacionais",
  "quality": "Melhorar a qualidade do trabalho",
  "competitive": "Manter competitividade no mercado",
  "innovation": "Inovar e modernizar o escritório",
  "client_experience": "Melhorar a experiência do cliente",
  "team_productivity": "Aumentar a produtividade da equipe",
  "time": "Economizar tempo",
};

// Mapeamento de resultados esperados para português
const EXPECTED_RESULTS_MAP: Record<string, string> = {
  "time_saving": "Economia de tempo em tarefas repetitivas",
  "error_reduction": "Redução de erros e retrabalho",
  "better_decisions": "Melhores decisões baseadas em dados",
  "client_satisfaction": "Maior satisfação dos clientes",
  "revenue_growth": "Aumento de receita",
  "process_organization": "Melhor organização dos processos",
  "team_alignment": "Maior alinhamento da equipe",
  "less_manual_work": "Menos trabalho manual",
  "faster_petitions": "Petições mais rápidas",
  "organized_processes": "Processos mais organizados",
};

// Lista completa de funcionalidades da consultoria
const CONSULTING_FEATURES: Record<number, { name: string; description: string; category: string }> = {
  // Inteligência Artificial (1-10)
  1: { name: "RotaDoc - Processamento Inteligente de Documentos", description: "Sistema de IA para processamento automatizado de documentos jurídicos com correção de orientação, identificação de tipos e organização automática.", category: "IA" },
  2: { name: "Assistente de IA Personalizado", description: "Assistente inteligente treinado para responder perguntas, auxiliar na redação de peças e automatizar tarefas.", category: "IA" },
  3: { name: "Agentes de IA Especializados", description: "Múltiplos agentes para análise de contratos, pesquisa jurisprudencial, elaboração de pareceres e revisão de peças.", category: "IA" },
  4: { name: "Pesquisa de Jurisprudência Inteligente", description: "Busca avançada em jurisprudência com filtros inteligentes, análise de tendências e sumarização automática.", category: "IA" },
  5: { name: "Geração de Peças Jurídicas com IA", description: "Criação automatizada de petições, contestações, recursos e outras peças processuais usando inteligência artificial.", category: "IA" },
  6: { name: "Análise de Contratos com IA", description: "Revisão automatizada de contratos identificando cláusulas de risco, sugestões de melhoria e comparação com padrões.", category: "IA" },
  7: { name: "Chatbot de Atendimento Inicial", description: "Bot inteligente para triagem de clientes, agendamento de consultas e coleta de informações preliminares.", category: "IA" },
  8: { name: "Sumarização Automática de Processos", description: "IA que lê e resume automaticamente andamentos processuais, decisões e despachos.", category: "IA" },
  9: { name: "Transcrição de Áudios e Vídeos", description: "Conversão automática de audiências, reuniões e gravações em texto com identificação de falantes.", category: "IA" },
  10: { name: "Análise Preditiva de Processos", description: "IA que analisa chances de êxito, tempo estimado de tramitação e valores de condenação.", category: "IA" },
  // Documentos Automáticos (11-18)
  11: { name: "Geração de Contratos de Honorários", description: "Criação automática de contratos de honorários personalizados com cláusulas padrão e valores configuráveis.", category: "Documentos" },
  12: { name: "Geração de Procurações", description: "Criação automática de procurações ad judicia e outras, com dados do cliente já preenchidos.", category: "Documentos" },
  13: { name: "Declarações de Justiça Gratuita", description: "Geração automática de declarações de hipossuficiência para pedidos de gratuidade de justiça.", category: "Documentos" },
  14: { name: "Geração de Substabelecimentos", description: "Criação automática de substabelecimentos com e sem reservas de poderes.", category: "Documentos" },
  15: { name: "Templates de Contratos Diversos", description: "Biblioteca de modelos de contratos (prestação de serviços, compra e venda, locação, etc.).", category: "Documentos" },
  16: { name: "Geração de Recibos e Notas", description: "Emissão automática de recibos de pagamento e notas de honorários.", category: "Documentos" },
  17: { name: "Cartas e Notificações Extrajudiciais", description: "Templates para notificações, interpelações e cartas formais com preenchimento automático.", category: "Documentos" },
  18: { name: "Termos de Acordo e Transação", description: "Geração de termos de acordo, quitação e transação com cálculos automáticos.", category: "Documentos" },
  // Jurídico e Processual (19-24)
  19: { name: "Integração com Sistema de Gestão Processual", description: "Sincronização bidirecional com seu sistema de gestão processual atual (Projuris, Astrea, Themis, GOJUR, SAJ ou outro).", category: "Jurídico" },
  20: { name: "Analytics Processual Avançado", description: "Dashboards de produtividade, tempo de tramitação, taxa de sucesso e identificação de gargalos.", category: "Jurídico" },
  21: { name: "Gestão Inteligente de Tarefas Processuais", description: "Atribuição automática, priorização por urgência, notificações de prazos e relatórios de produtividade.", category: "Jurídico" },
  22: { name: "Banco de Decisões Favoráveis", description: "Repositório de decisões favoráveis com categorização, busca avançada e compartilhamento de estratégias.", category: "Jurídico" },
  23: { name: "Controle de Prazos Automatizado", description: "Sistema de alertas de prazos processuais com notificações por e-mail, WhatsApp e push.", category: "Jurídico" },
  24: { name: "Calculadora Jurídica Integrada", description: "Cálculos trabalhistas, correção monetária, juros, honorários sucumbenciais e custas.", category: "Jurídico" },
  // Gestão e Produtividade (25-31)
  25: { name: "CRM - Gestão de Relacionamento com Clientes", description: "Cadastro de clientes, histórico de interações, gestão de oportunidades e análise de rentabilidade.", category: "Gestão" },
  26: { name: "Lead Tracking - Rastreamento de Leads", description: "Captura automatizada, funil de vendas visual, pontuação de leads e automação de follow-up.", category: "Gestão" },
  27: { name: "Dashboard Comercial Completo", description: "Pipeline de vendas, taxa de conversão, ticket médio, metas vs. realizado e alertas.", category: "Gestão" },
  28: { name: "Relatórios de Produtividade", description: "Produtividade individual e por equipe, tempo dedicado, análise de capacidade e benchmarks.", category: "Gestão" },
  29: { name: "Dashboard Principal Executivo", description: "Visão 360º com indicadores financeiros, processuais, comerciais e de RH.", category: "Gestão" },
  30: { name: "Gestão de Projetos e Tarefas", description: "Kanban, Gantt, checklists, dependências entre tarefas e acompanhamento de progresso.", category: "Gestão" },
  31: { name: "OKRs e Metas do Escritório", description: "Definição e acompanhamento de objetivos e resultados-chave do escritório.", category: "Gestão" },
  // Financeiro e Comercial (32-38)
  32: { name: "Módulo Financeiro Integrado", description: "Contas a pagar/receber, fluxo de caixa, conciliação bancária, centros de custo e emissão de boletos.", category: "Financeiro" },
  33: { name: "Integração Asaas (Gestão de Cobranças)", description: "Geração automática de boletos e PIX, lembretes de vencimento e controle de inadimplência.", category: "Financeiro" },
  34: { name: "Collection Management - Gestão de Cobranças", description: "Workflow de cobrança, negociação de dívidas, histórico de contatos e relatórios de recuperação.", category: "Financeiro" },
  35: { name: "Relatórios Financeiros Avançados", description: "DRE, balanço patrimonial, fluxo de caixa detalhado e indicadores financeiros.", category: "Financeiro" },
  36: { name: "Controle de Time Sheet", description: "Registro de horas trabalhadas por processo/cliente para cobrança de honorários.", category: "Financeiro" },
  37: { name: "Gestão de Custas e Despesas", description: "Controle de custas processuais, despesas reembolsáveis e adiantamentos.", category: "Financeiro" },
  38: { name: "Faturamento Automático", description: "Geração automática de faturas com base em contratos e horas trabalhadas.", category: "Financeiro" },
  // Recursos Humanos (39-46)
  39: { name: "Sistema Completo de Recrutamento e Seleção", description: "Publicação de vagas, análise de currículos com IA, pipeline Kanban e banco de talentos.", category: "RH" },
  40: { name: "Onboarding - Integração de Novos Colaboradores", description: "Checklist por cargo, distribuição de materiais, acompanhamento de progresso e avaliação.", category: "RH" },
  41: { name: "Gestão de Equipe e Organograma", description: "Cadastro completo, organograma visual, histórico profissional e diretório interno.", category: "RH" },
  42: { name: "Gestão de Férias e Ausências", description: "Solicitação e aprovação, calendário de disponibilidade, controle de saldo e licenças.", category: "RH" },
  43: { name: "Gestão de Home Office e Trabalho Híbrido", description: "Solicitação de home office, escala híbrida, registro de ponto remoto e produtividade.", category: "RH" },
  44: { name: "Calendário de Aniversários", description: "Notificações automáticas, envio de mensagens personalizadas e integração com relacionamento.", category: "RH" },
  45: { name: "Avaliação de Desempenho", description: "Ciclos de avaliação, feedback 360°, PDI e acompanhamento de metas individuais.", category: "RH" },
  46: { name: "Treinamento e Desenvolvimento", description: "Catálogo de cursos, trilhas de aprendizado, certificações e controle de horas.", category: "RH" },
  // Comunicação e Colaboração (47-56)
  47: { name: "Sistema de Mensagens Internas", description: "Mensagens diretas e em grupo, notificações em tempo real e compartilhamento de arquivos.", category: "Comunicação" },
  48: { name: "Mensagens Encaminhadas e Atribuição", description: "Triagem de mensagens de clientes, atribuição de responsáveis e SLA de atendimento.", category: "Comunicação" },
  49: { name: "Central de Notificações", description: "Alertas de prazos, lembretes de tarefas, avisos do sistema e preferências personalizadas.", category: "Comunicação" },
  50: { name: "Mural de Avisos", description: "Comunicados para equipe, categorização por tipo, fixação de avisos e confirmação de leitura.", category: "Comunicação" },
  51: { name: "Feed de Publicações Internas", description: "Rede social corporativa com compartilhamento de conquistas e reconhecimento.", category: "Comunicação" },
  52: { name: "Fórum de Discussões", description: "Tópicos por área temática, votação de respostas e base de conhecimento colaborativa.", category: "Comunicação" },
  53: { name: "Caixinha de Desabafo Anônima", description: "Canal confidencial de feedback, análise de clima e ações de melhoria.", category: "Comunicação" },
  54: { name: "Sistema de Sugestões e Inovação", description: "Envio de sugestões, votação da equipe, acompanhamento de implementação e reconhecimento.", category: "Comunicação" },
  55: { name: "Integração com WhatsApp Business", description: "Atendimento centralizado, respostas automáticas, chatbot e histórico de conversas.", category: "Comunicação" },
  56: { name: "Portal do Cliente", description: "Área exclusiva para clientes acompanharem processos, documentos e comunicação.", category: "Comunicação" },
  // Utilidades e Ferramentas (57-68)
  57: { name: "Gestão de Documentos e Templates", description: "Biblioteca de modelos, versionamento, busca avançada e controle de acesso.", category: "Utilidades" },
  58: { name: "Arquivos Teams e Integração Microsoft", description: "Acesso a arquivos do Teams/OneDrive, sincronização e colaboração em tempo real.", category: "Utilidades" },
  59: { name: "Gerador de QR Code", description: "Criação de QR Codes para URLs, textos e contatos com personalização visual.", category: "Utilidades" },
  60: { name: "Reserva de Salas de Reunião", description: "Calendário de disponibilidade, reserva de recursos, check-in e relatórios de ocupação.", category: "Utilidades" },
  61: { name: "Solicitações Administrativas", description: "Chamados de materiais, manutenção, TI e serviços com acompanhamento de status.", category: "Utilidades" },
  62: { name: "Gestão de Copa/Cozinha", description: "Controle de estoque, solicitação de reposição e escala de limpeza.", category: "Utilidades" },
  63: { name: "Galeria de Eventos", description: "Álbum digital de eventos, upload de fotos/vídeos e compartilhamento.", category: "Utilidades" },
  64: { name: "Sobre o Escritório - Página Institucional", description: "História, missão/visão/valores, equipe, áreas de atuação e prêmios.", category: "Utilidades" },
  65: { name: "Gestão de Parceiros e Fornecedores", description: "Cadastro de parceiros, avaliação de desempenho e controle de pagamentos.", category: "Utilidades" },
  66: { name: "Agenda e Calendário Integrado", description: "Agenda compartilhada, sincronização com Google/Outlook, lembretes e convites.", category: "Utilidades" },
  67: { name: "Controle de Patrimônio", description: "Inventário de equipamentos, atribuição de responsáveis e manutenções.", category: "Utilidades" },
  68: { name: "Base de Conhecimento Interna", description: "Wiki do escritório com procedimentos, políticas e manuais.", category: "Utilidades" },
  // Segurança e Administração (69-76)
  69: { name: "Sistema de Autenticação e Controle de Acesso", description: "Login seguro, autenticação multifator, controle de sessões e logs de acesso.", category: "Segurança" },
  70: { name: "Gestão de Perfis e Permissões", description: "Perfis de usuário, permissões por módulo e auditoria de acessos.", category: "Segurança" },
  71: { name: "Códigos de Autenticação 2FA", description: "Configuração de 2FA, múltiplos métodos e códigos de backup.", category: "Segurança" },
  72: { name: "Painel Administrativo Completo", description: "Gestão de usuários, configurações globais, backup e manutenção.", category: "Segurança" },
  73: { name: "Sistema de Logs e Auditoria", description: "Registro de ações, identificação de usuário, conformidade LGPD.", category: "Segurança" },
  74: { name: "Histórico de Uso do Sistema", description: "Ferramentas utilizadas por usuário, tempo de uso e métricas de engajamento.", category: "Segurança" },
  75: { name: "Backup e Recuperação de Dados", description: "Backups automáticos, versionamento de arquivos e recuperação de dados.", category: "Segurança" },
  76: { name: "Conformidade LGPD", description: "Gestão de consentimentos, anonimização de dados e relatórios de compliance.", category: "Segurança" },
  // Integrações (77-85)
  77: { name: "Central de Integrações", description: "Configuração de APIs e webhooks, sincronização de dados e monitoramento.", category: "Integrações" },
  78: { name: "Integração com Redes Sociais", description: "Publicação automatizada, monitoramento de menções e captação de leads.", category: "Integrações" },
  79: { name: "Integração com E-mail Marketing", description: "Campanhas automatizadas, segmentação de contatos e análise de métricas.", category: "Integrações" },
  80: { name: "Integração com Assinatura Eletrônica", description: "Envio de documentos para assinatura digital, acompanhamento e armazenamento.", category: "Integrações" },
  81: { name: "Integração com Tribunais (PJe, e-SAJ)", description: "Consulta automática de andamentos, download de documentos e protocolo.", category: "Integrações" },
  82: { name: "Integração com Google Workspace", description: "Sincronização com Gmail, Drive, Agenda e Meet.", category: "Integrações" },
  83: { name: "Integração com Microsoft 365", description: "Sincronização com Outlook, OneDrive, Teams e calendário.", category: "Integrações" },
  84: { name: "Integração com Contabilidade", description: "Exportação de dados financeiros para sistemas contábeis.", category: "Integrações" },
  85: { name: "API para Integrações Personalizadas", description: "API REST documentada para integrações customizadas com outros sistemas.", category: "Integrações" },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientEmail, consultantId, regenerate } = await req.json();
    
    console.log(`[auto-generate-client-plan] Starting for client: ${clientEmail}, consultant: ${consultantId}, regenerate: ${regenerate}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find the client by email and consultant
    const { data: client, error: clientError } = await supabase
      .from("consulting_clients")
      .select("*")
      .eq("email", clientEmail)
      .eq("user_id", consultantId)
      .maybeSingle();

    if (clientError || !client) {
      console.error('[auto-generate-client-plan] Client not found:', clientError);
      return new Response(
        JSON.stringify({ error: "Cliente não encontrado", success: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already generated (skip if regenerate is true)
    if (client.generated_prompt && !regenerate) {
      console.log('[auto-generate-client-plan] Prompt already generated for client:', client.id);
      return new Response(
        JSON.stringify({ success: true, message: "Prompt já foi gerado anteriormente" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build selected features details using local CONSULTING_FEATURES
    let selectedFeatureDetails = '';
    if (client.selected_features?.length) {
      const featuresByCategory: Record<string, string[]> = {};
      
      client.selected_features.forEach((id: number) => {
        const feature = CONSULTING_FEATURES[id];
        if (feature) {
          if (!featuresByCategory[feature.category]) {
            featuresByCategory[feature.category] = [];
          }
          featuresByCategory[feature.category].push(`- ${feature.name}: ${feature.description}`);
        }
      });

      // Format by category
      selectedFeatureDetails = Object.entries(featuresByCategory)
        .map(([category, features]) => `\n### ${category}\n${features.join('\n')}`)
        .join('\n');
        
      console.log(`[auto-generate-client-plan] Found ${client.selected_features.length} selected features`);
    } else {
      console.log('[auto-generate-client-plan] No selected features found');
    }

    // Traduzir motivações
    const motivationsTranslated = client.motivations?.map((m: string) => MOTIVATIONS_MAP[m] || m).join(", ") || 'Não informado';
    
    // Traduzir resultados esperados
    const expectedResultsTranslated = client.expected_results?.map((r: string) => EXPECTED_RESULTS_MAP[r] || r).join(", ") || 'Não informado';

    // Generate the Lovable Prompt with ALL form information
    console.log('[auto-generate-client-plan] Generating Lovable prompt with complete form data...');
    
    const promptSystemPrompt = `Você é um especialista em criar prompts COMPLETOS e DETALHADOS para o Lovable.dev, focando em intranets para escritórios de advocacia.

REGRAS IMPORTANTES:
1. O prompt DEVE ser em português brasileiro
2. O prompt DEVE incluir TODAS as funcionalidades selecionadas pelo cliente
3. O prompt DEVE ser extremamente detalhado e pronto para copiar e colar
4. O prompt DEVE mencionar integração com Supabase para autenticação e banco de dados
5. O prompt DEVE especificar o design visual moderno e profissional
6. O prompt DEVE ser específico sobre a estrutura de páginas e componentes
7. O prompt DEVE mencionar responsividade para mobile e desktop
8. O prompt DEVE levar em consideração o nível de experiência do cliente com IA
9. O prompt DEVE abordar as necessidades específicas do escritório
10. O prompt DEVE ser completo o suficiente para gerar um sistema funcional

Crie um prompt que possa ser usado diretamente no Lovable.dev sem necessidade de edição.`;

    const promptUserPrompt = `Crie um prompt COMPLETO e DETALHADO para o Lovable.dev para o seguinte escritório de advocacia:

========== DADOS DO ESCRITÓRIO ==========
- Nome do Escritório: ${client.office_name}
- Responsável: ${client.full_name}
- E-mail: ${client.email}
- Telefone: ${client.phone}
- OAB: ${client.oab_number || 'Não informado'}
- CPF/CNPJ: ${client.cpf_cnpj || 'Não informado'}
- Website: ${client.website || 'Não possui'}

========== LOCALIZAÇÃO ==========
- Endereço: ${client.office_address}${client.address_number ? `, ${client.address_number}` : ''}${client.address_complement ? ` - ${client.address_complement}` : ''}
- Bairro: ${client.bairro || 'Não informado'}
- Cidade/Estado: ${client.cidade || 'Não informado'} / ${client.estado || 'Não informado'}

========== ESTRUTURA DO ESCRITÓRIO ==========
- Número de Advogados: ${client.num_lawyers}
- Número de Funcionários: ${client.num_employees}
- Ano de Fundação: ${client.foundation_year || 'Não informado'}
- Áreas de Atuação: ${client.practice_areas || 'Diversas áreas do direito'}

========== EXPERIÊNCIA COM INTELIGÊNCIA ARTIFICIAL ==========
- Já usou IA: ${client.has_used_ai ? 'Sim' : 'Não'}
- Já usou ChatGPT: ${client.has_used_chatgpt ? 'Sim' : 'Não'}
- Tem ChatGPT Pago: ${client.has_chatgpt_paid ? 'Sim' : 'Não'}
- Tem App no Celular: ${client.has_chatgpt_app ? 'Sim' : 'Não'}
- Nível de Familiaridade com IA: ${client.ai_familiarity_level || 'Iniciante'}
- Frequência de Uso de IA: ${client.ai_usage_frequency || 'Raramente'}
- Tarefas que usa IA: ${client.ai_tasks_used || 'Nenhuma especificada'}
- Dificuldades com IA: ${client.ai_difficulties || 'Nenhuma especificada'}
- Outras ferramentas de IA: ${client.other_ai_tools || 'Nenhuma'}
- Confortável com tecnologia: ${client.comfortable_with_tech ? 'Sim' : 'Não/Não informado'}

========== GESTÃO ATUAL DO ESCRITÓRIO ==========
- Sistema de Gestão Processual: ${client.case_management_system === 'other' ? client.case_management_other : (client.case_management_system || 'Nenhum')}
- Fluxo de Gestão de Processos: ${client.case_management_flow || 'Não descrito'}
- Fluxo de Atendimento ao Cliente: ${client.client_service_flow || 'Não descrito'}

========== FUNCIONALIDADES SELECIONADAS ==========
${selectedFeatureDetails || 'Funcionalidades padrão: Dashboard, Gestão de processos, Controle financeiro básico'}

========== FUNCIONALIDADES PERSONALIZADAS ==========
${client.custom_features || 'Nenhuma funcionalidade personalizada solicitada'}

========== MOTIVAÇÕES PARA ADOTAR IA ==========
${motivationsTranslated}
${client.motivations_other ? `Outras motivações: ${client.motivations_other}` : ''}

========== RESULTADOS ESPERADOS ==========
${expectedResultsTranslated}
${client.expected_results_other ? `Outros resultados esperados: ${client.expected_results_other}` : ''}

========== TAREFAS QUE DESEJA AUTOMATIZAR ==========
${client.tasks_to_automate || 'Não especificado'}

========== INSTRUÇÕES PARA O PROMPT ==========
Com base em TODAS as informações acima, crie um prompt COMPLETO e DETALHADO que inclua:

1. Descrição geral do sistema (intranet para escritório de advocacia)
2. TODAS as funcionalidades selecionadas pelo cliente, descritas em detalhes
3. Especificações técnicas (Supabase, autenticação, RLS)
4. Design visual moderno adequado para escritório de advocacia
5. Estrutura de navegação e páginas
6. Requisitos de responsividade
7. Integrações necessárias baseadas nas funcionalidades escolhidas
8. Sistema de permissões e perfis de usuário
9. Considerações especiais baseadas no nível de experiência com IA do cliente

O prompt deve ser tão completo que o Lovable consiga criar o sistema inteiro apenas com ele.`;

    const promptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: promptSystemPrompt },
          { role: 'user', content: promptUserPrompt }
        ],
        max_tokens: 8000,
        temperature: 0.7,
      }),
    });

    let generatedPrompt = '';
    if (promptResponse.ok) {
      const promptData = await promptResponse.json();
      generatedPrompt = promptData.choices?.[0]?.message?.content || '';
      console.log('[auto-generate-client-plan] Prompt generated successfully, length:', generatedPrompt.length);
    } else {
      console.error('[auto-generate-client-plan] Error generating prompt:', await promptResponse.text());
    }

    // Update the client with the generated prompt
    if (generatedPrompt) {
      const { error: updateError } = await supabase
        .from("consulting_clients")
        .update({
          generated_prompt: generatedPrompt,
          updated_at: new Date().toISOString()
        })
        .eq("id", client.id);

      if (updateError) {
        console.error("[auto-generate-client-plan] Error updating client:", updateError);
      } else {
        console.log('[auto-generate-client-plan] Client updated successfully');
      }
    }

    // Generate implementation plan (with priorities if available)
    console.log('[auto-generate-client-plan] Generating implementation plan...');
    
    // Get feature priorities
    const featurePriorities = client.feature_priorities || {};
    
    // Organize features by priority
    const highPriorityFeatures: string[] = [];
    const mediumPriorityFeatures: string[] = [];
    const lowPriorityFeatures: string[] = [];
    
    if (client.selected_features?.length) {
      client.selected_features.forEach((id: number) => {
        const feature = CONSULTING_FEATURES[id];
        if (feature) {
          const priority = featurePriorities[id] || 'media';
          const featureText = `- ${feature.name} (${feature.category}): ${feature.description}`;
          
          if (priority === 'alta') {
            highPriorityFeatures.push(featureText);
          } else if (priority === 'baixa') {
            lowPriorityFeatures.push(featureText);
          } else {
            mediumPriorityFeatures.push(featureText);
          }
        }
      });
    }
    
    const prioritizedFeatures = `
**🔴 ALTA PRIORIDADE (implementar primeiro):**
${highPriorityFeatures.length > 0 ? highPriorityFeatures.join('\n') : 'Nenhuma funcionalidade de alta prioridade'}

**🟡 MÉDIA PRIORIDADE:**
${mediumPriorityFeatures.length > 0 ? mediumPriorityFeatures.join('\n') : 'Nenhuma funcionalidade de média prioridade'}

**🟢 BAIXA PRIORIDADE (implementar por último):**
${lowPriorityFeatures.length > 0 ? lowPriorityFeatures.join('\n') : 'Nenhuma funcionalidade de baixa prioridade'}`;

    const planSystemPrompt = `Você é um especialista em criar planos de implementação para sistemas de intranet de escritórios de advocacia no Lovable.dev.

Sua tarefa é criar um PLANO DE IMPLEMENTAÇÃO GRADUAL com prompts que o cliente pode copiar e colar diretamente no Lovable.dev.

REGRAS IMPORTANTES:
1. Crie no MÁXIMO 5 etapas (ideal são 3-4 etapas)
2. Cada etapa deve ter um prompt COMPLETO e PRONTO para colar no Lovable
3. Os prompts devem ser em português brasileiro
4. O primeiro prompt deve criar a estrutura base do sistema
5. Os prompts seguintes devem adicionar funcionalidades de forma incremental
6. RESPEITE AS PRIORIDADES: funcionalidades de ALTA prioridade devem vir PRIMEIRO
7. Seja específico e detalhado nos prompts para evitar erros
8. Inclua requisitos de design, cores e UX em cada prompt
9. Mencione integrações e autenticação quando necessário

FORMATO DE SAÍDA (JSON):
{
  "etapas": [
    {
      "numero": 1,
      "titulo": "Título da Etapa",
      "descricao": "Breve descrição do que será implementado",
      "prompt": "O prompt completo para colar no Lovable"
    }
  ]
}`;

    const planUserPrompt = `Crie um plano de implementação gradual para o seguinte escritório de advocacia:

**INFORMAÇÕES DO ESCRITÓRIO:**
- Nome: ${client.office_name}
- Responsável: ${client.full_name}
- Número de advogados: ${client.num_lawyers}
- Número de colaboradores: ${client.num_employees}
- Áreas de atuação: ${client.practice_areas || 'Não informado'}

**NÍVEL DE FAMILIARIDADE COM IA:** ${client.ai_familiarity_level || 'Iniciante'}

**SISTEMA DE GESTÃO ATUAL:** ${client.case_management_system || 'Não utiliza'}

**FUNCIONALIDADES ORGANIZADAS POR PRIORIDADE:**
${prioritizedFeatures}

**FUNCIONALIDADES PERSONALIZADAS:** ${client.custom_features || 'Nenhuma'}

Crie um plano com no máximo 5 etapas, onde cada etapa tem um prompt completo que o cliente pode copiar e colar no Lovable.dev para implementar sua intranet de forma gradual.

IMPORTANTE: Respeite as prioridades! Funcionalidades de ALTA prioridade devem ser implementadas nas PRIMEIRAS etapas. Funcionalidades de BAIXA prioridade podem ficar para as ÚLTIMAS etapas.

O primeiro prompt deve criar a base do sistema com autenticação, layout e estrutura principal, junto com as funcionalidades de ALTA prioridade.`;

    let implementationPlan = null;
    
    const planResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: planSystemPrompt },
          { role: 'user', content: planUserPrompt }
        ],
        max_tokens: 8000,
        temperature: 0.7,
      }),
    });

    if (planResponse.ok) {
      const planData = await planResponse.json();
      const planContent = planData.choices?.[0]?.message?.content || '';
      
      try {
        const jsonMatch = planContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          implementationPlan = JSON.parse(jsonMatch[0]);
          console.log('[auto-generate-client-plan] Implementation plan generated successfully');
        }
      } catch (parseError) {
        console.error('[auto-generate-client-plan] Error parsing plan:', parseError);
        implementationPlan = {
          etapas: [{
            numero: 1,
            titulo: "Prompt Completo",
            descricao: "Prompt gerado para implementação",
            prompt: planContent
          }]
        };
      }
      
      // Update client with implementation plan
      if (implementationPlan) {
        const { error: planUpdateError } = await supabase
          .from("consulting_clients")
          .update({
            implementation_plan: implementationPlan,
            updated_at: new Date().toISOString()
          })
          .eq("id", client.id);

        if (planUpdateError) {
          console.error('[auto-generate-client-plan] Error saving plan:', planUpdateError);
        } else {
          console.log('[auto-generate-client-plan] Implementation plan saved successfully');
        }
      }
    } else {
      console.error('[auto-generate-client-plan] Error generating plan:', await planResponse.text());
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        generatedPrompt: !!generatedPrompt,
        generatedPlan: !!implementationPlan
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[auto-generate-client-plan] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
