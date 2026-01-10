import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    if (client.generated_prompt && client.implementation_plan) {
      console.log('[auto-generate-client-plan] Plan already generated for client:', client.id);
      return new Response(
        JSON.stringify({ success: true, message: "Plano já foi gerado anteriormente" }),
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

    // Generate the Lovable Prompt
    console.log('[auto-generate-client-plan] Generating Lovable prompt...');
    
    const promptSystemPrompt = `Você é um especialista em criar prompts para o Lovable.dev, focando em intranets para escritórios de advocacia.
    
Crie um prompt COMPLETO e DETALHADO que o usuário pode copiar e colar diretamente no Lovable.dev para criar sua intranet personalizada.

O prompt deve:
1. Ser em português brasileiro
2. Incluir todas as funcionalidades selecionadas
3. Mencionar integração com Supabase para autenticação e banco de dados
4. Especificar o design visual desejado
5. Ser específico sobre a estrutura de páginas e componentes
6. Mencionar responsividade para mobile`;

    const promptUserPrompt = `Crie um prompt para o Lovable.dev para o seguinte escritório:

**ESCRITÓRIO:**
- Nome: ${client.office_name}
- Responsável: ${client.full_name}
- Advogados: ${client.num_lawyers}
- Colaboradores: ${client.num_employees}
- Áreas: ${client.practice_areas || 'Diversas'}
- Cidade/Estado: ${client.cidade || 'Não informado'} / ${client.estado || 'Não informado'}

**NÍVEL DE FAMILIARIDADE COM IA:** ${client.ai_familiarity_level || 'Iniciante'}

**SISTEMA DE GESTÃO ATUAL:** ${client.case_management_system || 'Não utiliza'}

**TAREFAS A AUTOMATIZAR:** ${client.tasks_to_automate || 'Não especificado'}

**FUNCIONALIDADES SELECIONADAS:**
${selectedFeatureDetails || 'Dashboard, Gestão de processos, Controle financeiro'}

**FUNCIONALIDADES PERSONALIZADAS:** ${client.custom_features || 'Nenhuma'}

Crie o prompt mais completo e detalhado possível para que o Lovable gere uma intranet perfeita para este escritório.`;

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
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    let generatedPrompt = '';
    if (promptResponse.ok) {
      const promptData = await promptResponse.json();
      generatedPrompt = promptData.choices?.[0]?.message?.content || '';
      console.log('[auto-generate-client-plan] Prompt generated successfully');
    } else {
      console.error('[auto-generate-client-plan] Error generating prompt:', await promptResponse.text());
    }

    // Generate Implementation Plan
    console.log('[auto-generate-client-plan] Generating implementation plan...');
    
    const planSystemPrompt = `Você é um especialista em criar planos de implementação para sistemas de intranet de escritórios de advocacia no Lovable.dev.

Sua tarefa é criar um PLANO DE IMPLEMENTAÇÃO GRADUAL com prompts que o cliente pode copiar e colar diretamente no Lovable.dev.

REGRAS IMPORTANTES:
1. Crie no MÁXIMO 5 etapas (ideal são 3-4 etapas)
2. Cada etapa deve ter um prompt COMPLETO e PRONTO para colar no Lovable
3. Os prompts devem ser em português brasileiro
4. O primeiro prompt deve criar a estrutura base do sistema
5. Os prompts seguintes devem adicionar funcionalidades de forma incremental
6. Seja específico e detalhado nos prompts para evitar erros
7. Inclua requisitos de design, cores e UX em cada prompt
8. Mencione integrações e autenticação quando necessário

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
- Cidade/Estado: ${client.cidade || 'Não informado'} / ${client.estado || 'Não informado'}

**NÍVEL DE FAMILIARIDADE COM IA:** ${client.ai_familiarity_level || 'Iniciante'}

**SISTEMA DE GESTÃO ATUAL:** ${client.case_management_system || 'Não utiliza'}

**TAREFAS QUE DESEJA AUTOMATIZAR:** ${client.tasks_to_automate || 'Não especificado'}

**FUNCIONALIDADES SELECIONADAS:**
${selectedFeatureDetails || 'Dashboard, Gestão de processos, Controle financeiro'}

**FUNCIONALIDADES PERSONALIZADAS:** ${client.custom_features || 'Nenhuma'}

Crie um plano com no máximo 5 etapas, onde cada etapa tem um prompt completo que o cliente pode copiar e colar no Lovable.dev para implementar sua intranet de forma gradual.

O primeiro prompt deve criar a base do sistema com autenticação, layout e estrutura principal.
Os próximos prompts devem adicionar as funcionalidades selecionadas de forma incremental.`;

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

    let implementationPlan = null;
    if (planResponse.ok) {
      const planData = await planResponse.json();
      const content = planData.choices?.[0]?.message?.content || '';
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          implementationPlan = JSON.parse(jsonMatch[0]);
        } else {
          implementationPlan = {
            etapas: [{
              numero: 1,
              titulo: "Prompt Completo",
              descricao: "Prompt gerado para implementação",
              prompt: content
            }]
          };
        }
        console.log('[auto-generate-client-plan] Plan generated successfully');
      } catch (parseError) {
        console.error("[auto-generate-client-plan] Error parsing plan:", parseError);
        implementationPlan = {
          etapas: [{
            numero: 1,
            titulo: "Prompt Completo",
            descricao: "Prompt gerado para implementação",
            prompt: content
          }]
        };
      }
    } else {
      console.error('[auto-generate-client-plan] Error generating plan:', await planResponse.text());
    }

    // Update the client with the generated content
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (generatedPrompt) {
      updateData.generated_prompt = generatedPrompt;
    }
    
    if (implementationPlan) {
      updateData.implementation_plan = implementationPlan;
    }

    const { error: updateError } = await supabase
      .from("consulting_clients")
      .update(updateData)
      .eq("id", client.id);

    if (updateError) {
      console.error("[auto-generate-client-plan] Error updating client:", updateError);
    } else {
      console.log('[auto-generate-client-plan] Client updated successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        generatedPrompt: !!generatedPrompt,
        implementationPlan: !!implementationPlan 
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