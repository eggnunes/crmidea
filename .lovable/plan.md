

# Plano de Implementacao - PRD como Primeira Etapa na Geracao de Prompts

## Resumo

O objetivo e modificar o sistema de geracao de prompts por etapas para que, antes de criar as etapas de implementacao, a IA primeiro gere um **PRD (Product Requirements Document)** completo baseado em TODAS as informacoes do formulario de diagnostico. Esse PRD sera incluido como **Etapa 0** (ou integrado na primeira etapa), facilitando a criacao do projeto no Lovable com uma documentacao completa de requisitos.

---

## O Que e um PRD?

O PRD (Product Requirements Document) e um documento que define:
- **Visao do Produto**: O que o sistema faz e para quem
- **Objetivos de Negocio**: Por que o cliente precisa desse sistema
- **Requisitos Funcionais**: Lista detalhada de funcionalidades
- **Requisitos Nao-Funcionais**: Performance, seguranca, usabilidade
- **Personas/Usuarios**: Quem vai usar o sistema
- **Arquitetura de Alto Nivel**: Estrutura basica do projeto
- **Prioridades e Fases**: Como o projeto sera implementado

---

## Arquivos a Modificar

| Arquivo | Mudanca | Impacto |
|---------|---------|---------|
| `supabase/functions/auto-generate-client-plan/index.ts` | Adicionar geracao de PRD antes das etapas | Critico - etapa automatica |
| `src/components/consulting/FragmentedPromptsGenerator.tsx` | Adicionar geracao de PRD como Etapa 0 | Critico - regeneracao manual |
| `src/integrations/supabase/types.ts` | (Nao modificar - campo `fragmented_prompts` ja e JSONB) | N/A |

---

## Estrutura da Nova Etapa 0 - PRD

A primeira etapa passara a conter um PRD completo que inclui:

```text
# PRD - Product Requirements Document
## [Nome do Escritorio] - Sistema de Intranet

### 1. Visao Geral do Projeto
- Descricao do escritorio e contexto
- Objetivos principais

### 2. Stakeholders e Usuarios
- Perfis de usuarios (advogados, funcionarios, gestores)
- Permissoes por perfil

### 3. Requisitos Funcionais
- Lista de todas as funcionalidades organizadas por modulo
- Detalhes de cada funcionalidade

### 4. Requisitos Nao-Funcionais
- Performance esperada
- Seguranca (LGPD, dados sensiveis)
- Responsividade e acessibilidade

### 5. Arquitetura Tecnica
- Stack tecnologica (React, Supabase, etc.)
- Estrutura de banco de dados
- Autenticacao e autorizacao

### 6. Roadmap de Implementacao
- Fases ordenadas por prioridade
- Dependencias entre modulos

### 7. Criterios de Aceite
- Como validar cada funcionalidade
```

---

## Fluxo de Implementacao

```text
1. Cliente preenche formulario de diagnostico
         |
         v
2. Ao submeter, dispara auto-generate-client-plan
         |
         v
3. [NOVO] IA gera PRD completo baseado em TODOS os dados do formulario
         |
         v
4. PRD e salvo como Etapa 0 (ou integrado na Etapa 1)
         |
         v
5. Etapas subsequentes sao geradas normalmente
         |
         v
6. Cliente ve PRD + Etapas no dashboard
```

---

## Secao Tecnica: Detalhes de Implementacao

### 1. Nova Funcao generatePRD no auto-generate-client-plan/index.ts

Criar uma funcao que gera o PRD usando TODAS as informacoes do formulario:

```typescript
function generatePRDPrompt(client: any, selectedFeatureDetails: string, prioritizedFeatures: string): { system: string; user: string } {
  const systemPrompt = `Voce e um especialista em criar PRDs (Product Requirements Documents) para sistemas de intranet de escritorios de advocacia.

Sua tarefa e criar um PRD COMPLETO e PROFISSIONAL em portugues brasileiro que serve como:
1. Documentacao do projeto para o cliente
2. Contexto inicial para o Lovable.dev criar o sistema
3. Referencia para todas as etapas de implementacao

O PRD deve ser estruturado, detalhado e incluir TODAS as informacoes fornecidas pelo cliente.

FORMATO OBRIGATORIO:
# PRD - Product Requirements Document

## 1. Visao Geral do Projeto
(descricao do sistema e objetivos)

## 2. Contexto do Escritorio
(detalhes sobre o escritorio cliente)

## 3. Perfis de Usuario e Permissoes
(quem usa o sistema e o que pode fazer)

## 4. Requisitos Funcionais
(lista de TODAS as funcionalidades organizadas por categoria)

## 5. Requisitos Nao-Funcionais
(performance, seguranca, LGPD, responsividade)

## 6. Arquitetura Tecnica
(stack, banco de dados, autenticacao)

## 7. Roadmap de Implementacao
(fases ordenadas por prioridade)

## 8. Criterios de Aceite
(como validar o sistema)

## 9. Prompt Inicial para Lovable.dev
(um prompt otimizado para comecar o projeto no Lovable)`;

  const userPrompt = `Crie um PRD completo para o seguinte escritorio de advocacia:

========== DADOS DO ESCRITORIO ==========
- Nome: ${client.office_name}
- Responsavel: ${client.full_name}
- E-mail: ${client.email}
- Telefone: ${client.phone}
- OAB: ${client.oab_number || 'Nao informado'}
- Website: ${client.website || 'Nao possui'}
- Ano de Fundacao: ${client.foundation_year || 'Nao informado'}

========== ESTRUTURA ==========
- Advogados: ${client.num_lawyers}
- Funcionarios: ${client.num_employees}
- Areas de Atuacao: ${client.practice_areas || 'Diversas areas'}
- Cidade/Estado: ${client.cidade || 'Nao informado'} / ${client.estado || 'Nao informado'}

========== EXPERIENCIA COM IA ==========
- Nivel de Familiaridade: ${client.ai_familiarity_level || 'Iniciante'}
- Ja usou IA: ${client.has_used_ai ? 'Sim' : 'Nao'}
- Ja usou ChatGPT: ${client.has_used_chatgpt ? 'Sim' : 'Nao'}
- Frequencia de Uso: ${client.ai_usage_frequency || 'Raramente'}
- Confortavel com tecnologia: ${client.comfortable_with_tech ? 'Sim' : 'Nao'}
- Dificuldades com IA: ${client.ai_difficulties || 'Nenhuma especificada'}

========== GESTAO ATUAL ==========
- Sistema de Gestao: ${client.case_management_system || 'Nenhum'}
- Fluxo de Processos: ${client.case_management_flow || 'Nao descrito'}
- Fluxo de Atendimento: ${client.client_service_flow || 'Nao descrito'}

========== FUNCIONALIDADES POR PRIORIDADE ==========
${prioritizedFeatures}

========== FUNCIONALIDADES DETALHADAS ==========
${selectedFeatureDetails || 'Funcionalidades padrao'}

========== FUNCIONALIDADES PERSONALIZADAS ==========
${client.custom_features || 'Nenhuma'}

========== TAREFAS A AUTOMATIZAR ==========
${client.tasks_to_automate || 'Nao especificado'}

Crie um PRD completo e profissional seguindo a estrutura definida.`;

  return { system: systemPrompt, user: userPrompt };
}
```

### 2. Modificacao na funcao generateFragmentedPromptsForClient

Antes de gerar as etapas, chamar a geracao do PRD e adiciona-lo como primeira etapa:

```typescript
// Dentro de generateFragmentedPromptsForClient, ANTES de gerar a estrutura base:

// ========== GERAR PRD PRIMEIRO ==========
const prdPrompts = generatePRDPrompt(client, selectedFeatureDetails, prioritizedFeatures);
const prdResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: prdPrompts.system },
      { role: 'user', content: prdPrompts.user }
    ],
    max_tokens: 10000,
    temperature: 0.7,
  }),
});

let prdContent = '';
if (prdResponse.ok) {
  const prdData = await prdResponse.json();
  prdContent = prdData.choices?.[0]?.message?.content || '';
}

// Adicionar PRD como Etapa 0
generatedEtapas.push({
  id: etapaId++,
  titulo: "PRD - DOCUMENTACAO DO PROJETO",
  descricao: "Product Requirements Document completo com todos os requisitos e especificacoes do sistema",
  prompt: prdContent || "PRD nao gerado. Regenere as etapas.",
  categoria: "prd",
  prioridade: "alta",
  funcionalidades: [
    "Visao Geral do Projeto",
    "Perfis de Usuario",
    "Requisitos Funcionais",
    "Requisitos Nao-Funcionais",
    "Arquitetura Tecnica",
    "Roadmap de Implementacao"
  ],
  ordem: 0,
  concluida: false
});
```

### 3. Atualizacao da Estrutura de Categorias

Adicionar a categoria "prd" no mapeamento de categorias:

```typescript
const CATEGORY_ORDER = [
  { id: 'prd', name: 'PRD - Documentacao' },
  { id: 'base', name: 'Estrutura Base' },
  // ... demais categorias
];
```

### 4. Atualizacao no Frontend (FragmentedPromptsGenerator.tsx)

Adicionar a mesma logica de geracao de PRD quando o usuario clica em "Regenerar Etapas":

```typescript
const generatePRD = async (effectiveClient: ConsultingClient): Promise<string> => {
  const systemPrompt = `Voce e um especialista em criar PRDs...`;
  const userPrompt = `Crie um PRD completo para...`;
  
  const { data, error } = await supabase.functions.invoke("generate-consulting-prompt", {
    body: { systemPrompt, userPrompt },
  });
  
  return data?.prompt || "";
};

// No inicio de generateFragmentedPrompts, antes de gerar estrutura base:
const prdContent = await generatePRD(effectiveClient);
generatedEtapas.push({
  id: etapaId++,
  titulo: "PRD - DOCUMENTACAO DO PROJETO",
  descricao: "Product Requirements Document completo",
  prompt: prdContent,
  categoria: "prd",
  prioridade: "alta",
  funcionalidades: ["Documentacao completa do projeto"],
  ordem: 0,
  concluida: false
});
```

---

## Visualizacao no Dashboard do Cliente

Com a implementacao, o cliente vera:

| Etapa | Titulo | Descricao |
|-------|--------|-----------|
| 0 | PRD - DOCUMENTACAO DO PROJETO | Product Requirements Document completo |
| 1 | ESTRUTURA BASE | Autenticacao, dashboard, navegacao |
| 2 | INTELIGENCIA ARTIFICIAL | Funcionalidades de IA selecionadas |
| 3 | DOCUMENTOS | Modulos de documentos |
| ... | ... | ... |

---

## Beneficios

1. **Contexto Completo**: O Lovable.dev tera todas as informacoes do projeto na primeira etapa
2. **Documentacao Profissional**: Cliente recebe um documento formal do projeto
3. **Melhor Qualidade**: Prompts subsequentes podem referenciar o PRD
4. **Transparencia**: Cliente ve exatamente o que sera implementado
5. **Facilita Customizacao**: PRD pode ser editado antes de comecar

---

## Resumo das Mudancas

1. **Edge Function**: Adicionar geracao de PRD antes das etapas fragmentadas
2. **Frontend**: Incluir PRD na regeneracao manual de etapas
3. **Estrutura**: PRD como Etapa 0 com categoria propria
4. **UI**: Exibir PRD de forma destacada no dashboard

