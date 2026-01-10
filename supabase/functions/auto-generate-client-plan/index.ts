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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientEmail, consultantId } = await req.json();
    
    console.log(`[auto-generate-client-plan] Starting for client: ${clientEmail}, consultant: ${consultantId}`);

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

    // Check if already generated
    if (client.generated_prompt) {
      console.log('[auto-generate-client-plan] Prompt already generated for client:', client.id);
      return new Response(
        JSON.stringify({ success: true, message: "Prompt já foi gerado anteriormente" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch feature names from consulting_features table (if exists)
    let selectedFeatureDetails = '';
    const { data: featuresData } = await supabase
      .from("consulting_features")
      .select("id, name, description, category");

    if (featuresData && client.selected_features?.length) {
      selectedFeatureDetails = client.selected_features
        .map((id: number) => {
          const feature = featuresData.find((f: any) => f.id === id);
          return feature ? `- ${feature.name} (${feature.category}): ${feature.description}` : null;
        })
        .filter(Boolean)
        .join("\n");
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        generatedPrompt: !!generatedPrompt
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
