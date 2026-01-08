import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch client data
    const { data: client, error: clientError } = await supabase
      .from("consulting_clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      throw new Error("Cliente não encontrado");
    }

    // Fetch feature names
    const { data: featuresData } = await supabase
      .from("consulting_features")
      .select("id, name, description, category");

    // Map selected features to their names
    const selectedFeatureDetails = (client.selected_features || [])
      .map((id: number) => {
        const feature = featuresData?.find((f: any) => f.id === id);
        return feature ? `- ${feature.name} (${feature.category}): ${feature.description}` : null;
      })
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `Você é um especialista em criar planos de implementação para sistemas de intranet de escritórios de advocacia no Lovable.dev.

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

    const userPrompt = `Crie um plano de implementação gradual para o seguinte escritório de advocacia:

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
${selectedFeatureDetails || 'Nenhuma funcionalidade específica selecionada'}

**FUNCIONALIDADES PERSONALIZADAS:** ${client.custom_features || 'Nenhuma'}

Crie um plano com no máximo 5 etapas, onde cada etapa tem um prompt completo que o cliente pode copiar e colar no Lovable.dev para implementar sua intranet de forma gradual.

O primeiro prompt deve criar a base do sistema com autenticação, layout e estrutura principal.
Os próximos prompts devem adicionar as funcionalidades selecionadas de forma incremental.`;

    console.log("Generating implementation plan for client:", clientId);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 8000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API Error:', error);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the JSON from the response
    let plan;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.log("Raw content:", content);
      
      // Return raw content as fallback
      plan = {
        etapas: [{
          numero: 1,
          titulo: "Prompt Completo",
          descricao: "Prompt gerado para implementação",
          prompt: content
        }]
      };
    }

    // Save the plan to the database
    const { error: updateError } = await supabase
      .from("consulting_clients")
      .update({ 
        implementation_plan: plan,
        updated_at: new Date().toISOString()
      })
      .eq("id", clientId);

    if (updateError) {
      console.error("Error saving plan:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, plan }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating implementation plan:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
