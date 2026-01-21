import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to search for updated AI tools information using Perplexity
async function searchPerplexityForAITools(query: string): Promise<string | null> {
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  if (!perplexityApiKey) {
    console.log('Perplexity API key not configured, skipping real-time search');
    return null;
  }
  
  try {
    console.log('Searching Perplexity for:', query);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { 
            role: 'system', 
            content: `Você é um especialista em ferramentas e modelos de IA em 2025. Responda em português brasileiro.
IMPORTANTE: Sempre inclua as ferramentas mais recentes e avançadas:
- Para VÍDEO: Sora 2 (OpenAI), Veo 3 (Google), Runway Gen-4, Kling AI, Minimax
- Para IMAGEM: Midjourney v6, DALL-E 3, Stable Diffusion 3, Ideogram 2.0, Flux
- Para TEXTO: ChatGPT (GPT-5), Claude 4, Gemini 2.5, Llama 4
- Para ÁUDIO: ElevenLabs, Suno AI, Udio
Foque nas TOP 3-5 ferramentas mais bem avaliadas e recentes. Seja conciso (máximo 150 palavras).`
          },
          { 
            role: 'user', 
            content: query 
          }
        ],
        max_tokens: 500,
        temperature: 0.2,
        search_recency_filter: 'week',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Perplexity error:', error);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    const citations = data.citations || [];
    
    console.log('Perplexity response:', aiResponse?.substring(0, 200) + '...');
    
    if (aiResponse) {
      return `[INFORMAÇÃO ATUALIZADA DA WEB - JANEIRO 2025]\n${aiResponse}\n${citations.length > 0 ? `Fontes: ${citations.slice(0, 3).join(', ')}` : ''}`;
    }
    
    return null;
  } catch (error) {
    console.error('Perplexity search error:', error);
    return null;
  }
}

// Detect if the user is asking about AI tools/software recommendations
function shouldSearchForAITools(message: string): boolean {
  const aiToolKeywords = [
    // Perguntas gerais sobre IAs
    'qual melhor', 'qual a melhor', 'quais as melhores', 'melhores ferramentas',
    'qual ferramenta', 'recomenda', 'indicar', 'indicação',
    'qual ia', 'qual inteligência artificial', 'qual software',
    // Ações específicas
    'para transcrever', 'para transcrição', 'para editar', 'para escrever',
    'para pesquisar', 'para criar', 'para gerar', 'para resumir',
    'para fazer vídeo', 'para vídeo', 'para video', 'criar vídeo', 'criar video',
    'gerar vídeo', 'gerar video', 'fazer vídeo', 'fazer video',
    'para imagem', 'criar imagem', 'gerar imagem',
    'para áudio', 'para audio', 'criar música', 'gerar música',
    'para texto', 'para escrever', 'para código', 'para programar',
    // Comparações
    'melhor ia para', 'melhor app para', 'melhor aplicativo',
    'alternativa', 'parecido com', 'similar ao',
    'atualizado', 'novidade', 'lançamento', 'novo', 'recente',
    'ranking', 'top ', 'comparar', 'comparação',
    'bem ranqueado', 'bem avaliado', 'mais usado',
    // Ferramentas específicas (para comparação)
    'sora', 'veo', 'runway', 'midjourney', 'dall-e', 'chatgpt',
    'gemini', 'claude', 'copilot', 'kling', 'pika', 'minimax',
    // Tipos de conteúdo
    'vídeo com ia', 'video com ia', 'imagem com ia', 'música com ia',
    'texto com ia', 'avatar', 'deepfake', 'animação'
  ];
  
  const lowerMessage = message.toLowerCase();
  return aiToolKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Transcribe audio using OpenAI Whisper via Lovable AI
async function transcribeAudio(audioUrl: string, lovableApiKey: string): Promise<string> {
  console.log("Transcribing audio from:", audioUrl);
  
  try {
    // Download the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }
    
    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = base64Encode(audioBuffer);
    
    // Use Lovable AI for transcription with a prompt
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: 'Transcreva o áudio a seguir. Retorne APENAS o texto transcrito, sem explicações ou formatação adicional.'
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: audioBase64,
                  format: 'mp3'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Transcription error:', error);
      throw new Error(`Transcription failed: ${error}`);
    }

    const data = await response.json();
    const transcription = data.choices?.[0]?.message?.content || '';
    console.log("Transcription result:", transcription);
    return transcription;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, messageContent, contactPhone, contactLid, userId, isAudioMessage, audioUrl } = await req.json();

    console.log(`Processing AI response for conversation ${conversationId}, isAudio: ${isAudioMessage}, LID: ${contactLid}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Helper to check if value is a LID
    const isLid = (value: string | null) => value?.includes('@lid') ?? false;

    // Transcribe audio if it's an audio message
    let processedContent = messageContent;
    if (isAudioMessage && audioUrl) {
      try {
        processedContent = await transcribeAudio(audioUrl, lovableApiKey);
        console.log("Using transcribed content:", processedContent);
      } catch (transcriptionError) {
        console.error("Transcription failed, using original content:", transcriptionError);
        processedContent = "[Áudio recebido - transcrição indisponível]";
      }
    }

    // Get AI configuration (pick MOST RECENT row)
    // Some users ended up with multiple rows; without ordering we may fetch an older
    // config (e.g., voice disabled), causing wrong behavior.
    const { data: aiConfig } = await supabase
      .from('ai_assistant_config')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!aiConfig || !aiConfig.is_active) {
      console.log('AI not active, skipping response');
      return new Response(JSON.stringify({ status: 'skipped' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if AI is disabled for this specific conversation
    const { data: conversationData } = await supabase
      .from('whatsapp_conversations')
      .select('ai_disabled')
      .eq('id', conversationId)
      .maybeSingle();

    if (conversationData?.ai_disabled) {
      console.log('AI disabled for this conversation, skipping response');
      return new Response(JSON.stringify({ status: 'skipped', reason: 'ai_disabled_for_conversation' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // RATE LIMITING: Check if we already responded recently (within 5 seconds)
    // This prevents multiple responses when Z-API sends duplicate webhooks
    const { data: recentAIMessages } = await supabase
      .from('whatsapp_messages')
      .select('id, created_at')
      .eq('conversation_id', conversationId)
      .eq('is_ai_response', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (recentAIMessages && recentAIMessages.length > 0) {
      const lastAIMessage = recentAIMessages[0];
      const timeSinceLastAI = Date.now() - new Date(lastAIMessage.created_at).getTime();
      const cooldownMs = 5000; // 5 second cooldown between AI responses
      
      if (timeSinceLastAI < cooldownMs) {
        console.log(`AI cooldown active: last response was ${timeSinceLastAI}ms ago, need ${cooldownMs}ms. Skipping.`);
        return new Response(JSON.stringify({ status: 'skipped', reason: 'cooldown' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Check if bot is disabled for this contact
    const { data: contact } = await supabase
      .from('whatsapp_contacts')
      .select('bot_disabled')
      .eq('user_id', userId)
      .eq('phone', contactPhone)
      .maybeSingle();

    if (contact?.bot_disabled) {
      console.log('Bot disabled for this contact, skipping response');
      return new Response(JSON.stringify({ status: 'skipped', reason: 'bot_disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if this is a simple acknowledgment after a welcome message (don't respond)
    // This prevents AI from responding to "obrigado", "ok", "valeu" after welcome messages
    const simpleAcknowledgments = [
      'obrigado', 'obrigada', 'obg', 'brigado', 'brigada',
      'ok', 'okay', 'blz', 'beleza', 'certo',
      'valeu', 'vlw', 'valew',
      'perfeito', 'top', 'show', 'legal',
      'entendi', 'entendido', 'ta bom', 'tá bom', 'tá', 'ta',
      'sim', 'não', 'nao',
      '👍', '✅', '🙏', '😊', '🤝', '👏'
    ];
    
    const normalizedContent = processedContent.toLowerCase().trim();
    const isSimpleAcknowledgment = simpleAcknowledgments.some(ack => 
      normalizedContent === ack || 
      normalizedContent === ack + '!' ||
      normalizedContent === ack + '.' ||
      normalizedContent.match(new RegExp(`^${ack}[!.,\\s]*$`))
    );
    
    if (isSimpleAcknowledgment) {
      // Check if the last message from us was a welcome/automated message (not AI)
      const { data: lastOurMessage } = await supabase
        .from('whatsapp_messages')
        .select('content, is_ai_response, is_from_contact')
        .eq('conversation_id', conversationId)
        .eq('is_from_contact', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // If the last message from us was NOT an AI response (likely welcome/automated message)
      // and this is just a simple acknowledgment, don't respond
      if (lastOurMessage && !lastOurMessage.is_ai_response) {
        console.log('Simple acknowledgment after automated message, skipping AI response:', normalizedContent);
        return new Response(JSON.stringify({ status: 'skipped', reason: 'simple_acknowledgment' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { data: trainingDocs } = await supabase
      .from('ai_training_documents')
      .select('title, content')
      .eq('user_id', userId)
      .eq('status', 'trained')
      .limit(10);

    // Get intents
    const { data: intents } = await supabase
      .from('ai_intents')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Get recent conversation history
    const { data: recentMessages } = await supabase
      .from('whatsapp_messages')
      .select('content, is_from_contact, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build context from training documents
    let knowledgeBase = '';
    if (trainingDocs && trainingDocs.length > 0) {
      knowledgeBase = trainingDocs.map(doc => `[${doc.title}]\n${doc.content}`).join('\n\n');
    }

    // Search Perplexity for updated AI tools info if the user is asking about tools/software
    let perplexityInfo = '';
    if (shouldSearchForAITools(processedContent)) {
      console.log('User is asking about AI tools, searching Perplexity for updated info...');
      const perplexityResult = await searchPerplexityForAITools(
        `Quais são as melhores ferramentas de IA em 2025 para: ${processedContent}. Foque em ferramentas gratuitas ou com plano gratuito.`
      );
      if (perplexityResult) {
        perplexityInfo = perplexityResult;
        console.log('Got Perplexity info:', perplexityInfo.substring(0, 100) + '...');
      }
    }

    // Build intents context
    let intentsContext = '';
    if (intents && intents.length > 0) {
      intentsContext = intents.map(intent => 
        `- Se o usuário mencionar "${intent.trigger_phrases.join('" ou "')}", ${
          intent.action_type === 'link' 
            ? `forneça o link: ${intent.action_value}`
            : intent.action_type === 'message'
            ? `responda: ${intent.action_value}`
            : `execute a ação: ${intent.action_value}`
        }`
      ).join('\n');
    }

    // Build conversation history - clean content to remove URLs, audio metadata, etc.
    const cleanMessageContent = (content: string): string => {
      if (!content) return '';
      
      // Remove audio metadata and URLs
      let cleaned = content
        // Remove the audio header prefix
        .replace(/🔊\s*\*?Áudio enviado pela IA:?\*?\s*/gi, '')
        // Remove audio URLs in brackets
        .replace(/\[Áudio:\s*https?:\/\/[^\]]+\]/gi, '')
        // Remove any standalone URLs (http/https)
        .replace(/https?:\/\/[^\s\]]+/gi, '')
        // Remove empty lines that result from cleaning
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      return cleaned;
    };

    // Helpers to keep answers cohesive and avoid accidental repetition
    const normalizeWhitespace = (t: string) =>
      (t || '')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    const removeDuplicateParagraphs = (t: string) => {
      const parts = normalizeWhitespace(t)
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);

      const seen = new Set<string>();
      const out: string[] = [];
      for (const p of parts) {
        const key = p.toLowerCase().replace(/\s+/g, ' ').trim();
        if (seen.has(key)) continue;
        if (out.length > 0 && /^ol[áa][!.,\s]/i.test(p) && /^ol[áa][!.,\s]/i.test(out[0])) {
          continue;
        }
        seen.add(key);
        out.push(p);
      }
      return out.join('\n\n');
    };
    
    const conversationHistory = (recentMessages || [])
      .reverse()
      .map(msg => ({
        role: msg.is_from_contact ? 'user' : 'assistant',
        content: cleanMessageContent(msg.content),
      }))
      .filter(msg => msg.content.length > 0); // Remove empty messages after cleaning

    // Extra anti-duplicate guard:
    // If we've already sent an AI response AFTER the latest inbound message and the
    // current payload matches that inbound content, it's likely a delayed/duplicate webhook.
    try {
      const lastInbound = (recentMessages || []).find((m) => m.is_from_contact);
      const lastOutbound = (recentMessages || []).find((m) => !m.is_from_contact);
      if (lastInbound && lastOutbound) {
        const inboundTs = new Date(lastInbound.created_at).getTime();
        const outboundTs = new Date(lastOutbound.created_at).getTime();
        const inboundClean = normalizeWhitespace(cleanMessageContent(lastInbound.content || '')).toLowerCase();
        const payloadClean = normalizeWhitespace(processedContent || '').toLowerCase();
        if (outboundTs > inboundTs && inboundClean && inboundClean === payloadClean) {
          console.log('Duplicate inbound detected (already responded). Skipping.');
          return new Response(JSON.stringify({ status: 'skipped', reason: 'already_responded' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (e) {
      console.log('Duplicate guard check failed (non-fatal):', e);
    }

    // Check if this is a NEW conversation (no prior messages) or ONGOING
    // IMPORTANT: don't rely on cleaned history length (cleaning can strip content).
    const isNewConversation = (recentMessages?.length ?? 0) === 0;
    console.log(`Conversation status: ${isNewConversation ? 'NEW' : 'ONGOING'} (${conversationHistory.length} previous messages)`);

    // Build system prompt
    const communicationStyles: Record<string, string> = {
      formal: 'Responda de forma formal, profissional e respeitosa.',
      normal: 'Responda de forma equilibrada, nem muito formal nem muito informal.',
      descontraida: 'Responda de forma descontraída, amigável e acessível.',
    };

    const styleKey = aiConfig.communication_style || 'descontraida';
    const communicationStyle = communicationStyles[styleKey] || communicationStyles.descontraida;

    // Dynamic introduction rule based on conversation state
    const introductionRule = isNewConversation 
      ? `- Esta é uma NOVA conversa. Você pode se apresentar brevemente UMA VEZ.`
      : `- Esta é uma conversa EM ANDAMENTO. NUNCA se apresente novamente! Você já se apresentou. Vá direto ao ponto respondendo a pergunta do usuário.`;

    let systemPrompt = `Você é ${aiConfig.agent_name}, um assistente de IA especializado.

## Personalidade e Comportamento
${aiConfig.behavior_prompt || 'Seja útil e responda às perguntas dos usuários.'}

## Estilo de Comunicação
${communicationStyle}

## Empresa/Produto que Representa
${aiConfig.company_name ? `Nome: ${aiConfig.company_name}` : ''}
${aiConfig.company_description ? `Descrição: ${aiConfig.company_description}` : ''}
${aiConfig.website_url ? `Site: ${aiConfig.website_url}` : ''}

## Configurações
${aiConfig.use_emojis ? '- Use emojis quando apropriado para tornar a conversa mais amigável.' : '- Não use emojis.'}
${aiConfig.restrict_topics ? '- Foque apenas em tópicos relacionados ao negócio. Se perguntarem sobre outros assuntos, redirecione educadamente para os tópicos relevantes.' : ''}
${aiConfig.sign_agent_name ? `- Assine suas mensagens como "${aiConfig.agent_name}".` : ''}
`;

    if (knowledgeBase) {
      systemPrompt += `
## BASE DE CONHECIMENTO
Use as informações abaixo como referência principal. Se a resposta não estiver aqui, use as informações atualizadas da web.

${knowledgeBase}
`;
    }

    // Add Perplexity real-time info if available - with MAXIMUM priority
    if (perplexityInfo) {
      systemPrompt += `
## ⚠️ INFORMAÇÃO ATUALIZADA EM TEMPO REAL (PRIORIDADE MÁXIMA!) ⚠️
A informação abaixo foi pesquisada AGORA na internet e representa o estado mais atual das ferramentas de IA em janeiro de 2025.
VOCÊ DEVE OBRIGATORIAMENTE usar esta informação ao responder sobre ferramentas de IA, IGNORANDO a base de conhecimento para este tópico específico.
Mencione os nomes das ferramentas exatamente como estão aqui (Sora 2, Veo 3, etc.).

${perplexityInfo}

LEMBRE-SE: As ferramentas acima são as mais recentes e bem ranqueadas. USE ELAS NA SUA RESPOSTA!
`;
    }

    if (intentsContext) {
      systemPrompt += `\n## Intenções Especiais\nQuando o usuário mencionar certas frases, siga estas instruções:\n${intentsContext}\n`;
    }

    systemPrompt += `
## REGRAS OBRIGATÓRIAS (MUITO IMPORTANTE!)
1. RESPOSTAS ULTRA-CURTAS: Máximo 1-2 frases! Seja extremamente direto.
2. NUNCA faça listas longas. Se precisar listar, máximo 3 itens em uma frase.
3. Responda SEMPRE em português brasileiro.
4. Use APENAS informações da base de conhecimento. NUNCA invente!
5. Se não souber, diga apenas: "Não tenho essa informação."
6. PROIBIDO: introduções longas, explicações detalhadas, múltiplos parágrafos.
7. PRONÚNCIA CLARA: Ao mencionar nomes de ferramentas ou termos técnicos em inglês, escreva de forma que facilite a pronúncia correta. Exemplos:
   - Turboscribe → escreva "Turbo Scribe" (com espaço)
   - ChatGPT → escreva "Chat G P T" 
   - DeepL → escreva "Deep L"
   - YouTube → escreva "You Tube"
   - ElevenLabs → escreva "Eleven Labs"
   - Whisper → escreva "Uísper"
   - OCR → escreva "O C R"
   - API → escreva "A P I"
   Use sempre separação de sílabas ou espaços em nomes técnicos para garantir pronúncia clara.
8. OBJETIVO: Resposta em NO MÁXIMO 50 palavras.
9. NUNCA inclua URLs, links ou endereços web na sua resposta.
10. NUNCA mencione "áudio" ou metadados técnicos na sua resposta.

## REGRA CRÍTICA DE APRESENTAÇÃO
${introductionRule}
NUNCA repita apresentações como "Olá, sou [nome]" ou "Prazer em conhecê-lo" se já houver mensagens anteriores na conversa!`;

    const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');
    const zapiToken = Deno.env.get('ZAPI_TOKEN');
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!zapiInstanceId || !zapiToken) {
      throw new Error('Z-API credentials not configured');
    }

    // Build Z-API headers with Client-Token
    const zapiHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (zapiClientToken) {
      zapiHeaders['Client-Token'] = zapiClientToken;
    }

    // LID Support: Use LID if available, otherwise format phone number
    let formattedPhone: string;
    if (contactLid) {
      formattedPhone = contactLid;
      console.log('Using LID for sending:', formattedPhone);
    } else if (isLid(contactPhone)) {
      formattedPhone = contactPhone;
      console.log('Contact phone is LID, using directly:', formattedPhone);
    } else {
      formattedPhone = contactPhone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
      }
      console.log('Using formatted phone:', formattedPhone);
    }

    // Check if we should respond with audio (using ElevenLabs)
    const shouldRespondWithAudio = isAudioMessage && 
      aiConfig.voice_response_enabled && 
      aiConfig.elevenlabs_enabled && 
      elevenlabsApiKey && 
      aiConfig.elevenlabs_voice_id;

    // Helper function to send presence/typing status via Z-API
    // Based on Z-API official documentation: https://developer.z-api.io/
    const sendPresenceStatus = async (action: 'composing' | 'recording' | 'paused') => {
      // Z-API endpoints for presence status - using the correct documented endpoints
      const baseUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}`;
      
      try {
        console.log(`Sending presence action '${action}' to ${formattedPhone}`);
        
        // First, set online status using update-presence endpoint
        const onlineUrl = `${baseUrl}/update-presence`;
        const onlineBody = { 
          phone: formattedPhone,
          presence: 'available' // Mark as online/available
        };
        
        const onlineResponse = await fetch(onlineUrl, {
          method: 'POST',
          headers: zapiHeaders,
          body: JSON.stringify(onlineBody),
        });
        const onlineResult = await onlineResponse.text();
        console.log(`Online presence response:`, onlineResult);
        
        // Now send the specific action (composing/recording)
        if (action === 'paused') {
          // Just stop typing/recording - no additional action needed after setting presence
          return true;
        }
        
        // Use the chat-presence endpoint for typing/recording indicators
        // This is the documented way for Multi-Device instances
        const presenceUrl = `${baseUrl}/chat-presence`;
        const presenceBody = {
          phone: formattedPhone,
          presence: action === 'composing' ? 'composing' : 'recording'
        };
        
        const presenceResponse = await fetch(presenceUrl, {
          method: 'POST',
          headers: zapiHeaders,
          body: JSON.stringify(presenceBody),
        });
        
        const presenceResult = await presenceResponse.text();
        console.log(`Chat presence response for '${action}':`, presenceResult);
        
        if (presenceResponse.ok && !presenceResult.includes('error')) {
          console.log(`✓ Presence action '${action}' sent successfully via chat-presence`);
          return true;
        }
        
        // Fallback: Try send-action-chat endpoint
        console.log(`chat-presence didn't work, trying send-action-chat...`);
        const actionUrl = `${baseUrl}/send-action-chat`;
        const actionBody = {
          phone: formattedPhone,
          action: action
        };
        
        const actionResponse = await fetch(actionUrl, {
          method: 'POST',
          headers: zapiHeaders,
          body: JSON.stringify(actionBody),
        });
        
        const actionResult = await actionResponse.text();
        console.log(`send-action-chat response:`, actionResult);
        
        if (actionResponse.ok && !actionResult.includes('error')) {
          console.log(`✓ Presence action '${action}' sent via send-action-chat`);
          return true;
        }
        
        // Second fallback: Try legacy typing/recording endpoints
        console.log(`send-action-chat didn't work, trying legacy endpoints...`);
        
        const legacyEndpoint = action === 'composing' 
          ? `${baseUrl}/typing`
          : `${baseUrl}/recording`;
        
        const legacyBody = {
          phone: formattedPhone,
          value: true
        };
        
        const legacyResponse = await fetch(legacyEndpoint, {
          method: 'POST',
          headers: zapiHeaders,
          body: JSON.stringify(legacyBody),
        });
        
        const legacyResult = await legacyResponse.text();
        console.log(`Legacy endpoint (${action}) response:`, legacyResult);
        
        if (legacyResponse.ok) {
          console.log(`✓ Presence action '${action}' sent via legacy endpoint`);
          return true;
        }
        
        console.log(`All presence endpoints failed for action '${action}'`);
        return false;
      } catch (e) {
        console.error(`Presence status error:`, e);
        return false;
      }
    };

    // Show typing or recording indicator BEFORE processing (so user sees it immediately)
    // This runs in parallel with AI processing for better UX
    if (shouldRespondWithAudio && aiConfig.show_recording_indicator) {
      // Will respond with audio, show recording indicator
      await sendPresenceStatus('recording');
    } else if (aiConfig.show_typing_indicator) {
      // Will respond with text, show composing indicator
      await sendPresenceStatus('composing');
    }

    // Wait for response delay if configured
    const responseDelay = aiConfig.response_delay_seconds || 0;
    if (responseDelay > 0) {
      console.log(`Waiting ${responseDelay}s before responding...`);
      await new Promise(resolve => setTimeout(resolve, responseDelay * 1000));
    }

    console.log('Calling Lovable AI...');

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: processedContent },
        ],
        // 150 tokens estava truncando mensagens ("ficou cortada").
        // Mantemos o prompt exigindo respostas curtas, mas damos folga para não cortar.
        max_tokens: 450,
        temperature: 0.7, // Reduzir criatividade para respostas mais focadas
      }),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text();
      console.error('Lovable AI error:', errorData);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Payment required. Please add credits to your workspace.');
      }
      throw new Error(`AI gateway error: ${errorData}`);
    }

    const aiData = await aiResponse.json();
    let aiMessage = aiData.choices?.[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('No response from AI');
    }

    // Post-processing to reduce occasional repetition and keep content cohesive
    aiMessage = removeDuplicateParagraphs(aiMessage);

    console.log(`AI response: ${aiMessage.substring(0, 100)}...`);

    if (shouldRespondWithAudio) {
      console.log('Generating audio response with ElevenLabs...');
      
      // Ensure recording status is shown during audio generation
      await sendPresenceStatus('recording');

      try {
        // Generate audio with ElevenLabs - configurações otimizadas para máxima qualidade
        // Using eleven_turbo_v2_5 for better latency and clarity
        const elevenLabsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${aiConfig.elevenlabs_voice_id}?output_format=mp3_44100_128`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': elevenlabsApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: aiMessage,
              model_id: 'eleven_turbo_v2_5', // Modelo mais rápido e com melhor clareza
              voice_settings: {
                stability: 0.75,          // Equilíbrio entre clareza e naturalidade
                similarity_boost: 0.80,   // Mantém características da voz
                style: 0.0,               // Zero para evitar qualquer distorção
                use_speaker_boost: true,  // Melhora clareza
              },
            }),
          }
        );

        if (!elevenLabsResponse.ok) {
          const error = await elevenLabsResponse.text();
          console.error('ElevenLabs error:', error);
          throw new Error('Failed to generate audio');
        }

        const audioBuffer = await elevenLabsResponse.arrayBuffer();
        const audioBase64 = base64Encode(audioBuffer);

        // Upload audio to storage for playback in CRM
        const audioFileName = `ai-audio-${conversationId}-${Date.now()}.mp3`;
        console.log('Uploading audio to storage:', audioFileName);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('ai-audio')
          .upload(audioFileName, audioBuffer, {
            contentType: 'audio/mpeg',
            cacheControl: '3600',
            upsert: false,
          });

        let audioStorageUrl = '';
        if (uploadError) {
          console.error('Error uploading audio to storage:', uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('ai-audio')
            .getPublicUrl(audioFileName);
          audioStorageUrl = publicUrlData.publicUrl;
          console.log('Audio uploaded, public URL:', audioStorageUrl);
        }

        // Send audio via Z-API
        const zapiAudioUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-audio`;
        
        const sendResponse = await fetch(zapiAudioUrl, {
          method: 'POST',
          headers: zapiHeaders,
          body: JSON.stringify({
            phone: formattedPhone,
            audio: `data:audio/mpeg;base64,${audioBase64}`,
          }),
        });

        const sendDataRaw = await sendResponse.text();
        console.log('Z-API audio send response (raw):', sendDataRaw);
        let sendData: any = {};
        try {
          sendData = JSON.parse(sendDataRaw);
        } catch {
          // ignore parse errors, we'll use status code
        }

        if (!sendResponse.ok || (typeof sendDataRaw === 'string' && sendDataRaw.toLowerCase().includes('error'))) {
          throw new Error(`Z-API send-audio failed (${sendResponse.status})`);
        }

        // Save AI message to database - store text and audio URL separately for CRM playback
        // The content field stores ONLY the text message (no URLs) for clean history
        // Audio URL is stored in a separate field or as structured metadata
        await supabase
          .from('whatsapp_messages')
          .insert({
            conversation_id: conversationId,
            user_id: userId,
            message_type: 'audio',
            content: aiMessage, // Store ONLY the clean text - no URLs or metadata
            audio_url: audioStorageUrl || null, // Store audio URL separately
            is_from_contact: false,
            is_ai_response: true,
            zapi_message_id: sendData.messageId || sendData.zapiMessageId,
            status: 'sent',
          });

        // Update conversation
        await supabase
          .from('whatsapp_conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);

        // Clear presence status after sending
        await sendPresenceStatus('paused');

        return new Response(JSON.stringify({ 
          success: true,
          messagesSent: 1,
          type: 'audio',
          audioUrl: audioStorageUrl || null,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (audioError) {
        console.error('Error sending audio, falling back to text:', audioError);
        // Clear recording status before falling back to text
        await sendPresenceStatus('paused');
        // Fall through to text response
      }
    }

    // Show typing status before sending text
    if (aiConfig.show_typing_indicator) {
      await sendPresenceStatus('composing');
    }

    // Send text. If enabled, split long messages to avoid delivery/UI truncation.
    const splitIfNeeded = (text: string) => {
      const maxChunk = 900; // conservative for WhatsApp/Z-API delivery
      const normalized = normalizeWhitespace(text);
      if (!aiConfig.split_long_messages || normalized.length <= maxChunk) return [normalized];

      const chunks: string[] = [];
      let rest = normalized;
      while (rest.length > maxChunk) {
        const slice = rest.slice(0, maxChunk + 1);
        const breakAt = Math.max(
          slice.lastIndexOf('. '),
          slice.lastIndexOf('! '),
          slice.lastIndexOf('? '),
          slice.lastIndexOf('\n')
        );
        const cut = breakAt > 200 ? breakAt + 1 : maxChunk;
        chunks.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
      }
      if (rest) chunks.push(rest);
      return chunks;
    };

    const messagesToSend = splitIfNeeded(aiMessage);
    console.log(
      `Sending ${messagesToSend.length} text message(s) (total ${aiMessage.length} chars). split_long_messages=${aiConfig.split_long_messages}`
    );

    // Send messages via Z-API
    for (let i = 0; i < messagesToSend.length; i++) {
      const msgContent = messagesToSend[i];
      
      // Add small delay between messages
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`;
      
      const sendResponse = await fetch(zapiUrl, {
        method: 'POST',
        headers: zapiHeaders,
        body: JSON.stringify({
          phone: formattedPhone,
          message: msgContent,
        }),
      });

      const sendData = await sendResponse.json();
      console.log(`Z-API send response (${i + 1}/${messagesToSend.length}):`, sendData);

      // Save AI message to database
      await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          message_type: 'text',
          content: msgContent,
          is_from_contact: false,
          is_ai_response: true,
          zapi_message_id: sendData.messageId || sendData.zapiMessageId,
          status: 'sent',
        });
    }

    // Clear presence status after sending all messages
    await sendPresenceStatus('paused');

    // Update conversation
    await supabase
      .from('whatsapp_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Auto-create contact if enabled
    if (aiConfig.auto_create_contacts) {
      const { data: existingContact } = await supabase
        .from('whatsapp_contacts')
        .select('id')
        .eq('user_id', userId)
        .eq('phone', contactPhone)
        .maybeSingle();

      if (!existingContact) {
        await supabase
          .from('whatsapp_contacts')
          .insert({
            user_id: userId,
            phone: contactPhone,
          });
        console.log(`Auto-created contact for ${contactPhone}`);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      messagesSent: messagesToSend.length,
      type: 'text',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI response:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
