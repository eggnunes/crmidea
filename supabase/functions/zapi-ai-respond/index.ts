import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get AI configuration
    const { data: aiConfig } = await supabase
      .from('ai_assistant_config')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!aiConfig || !aiConfig.is_active) {
      console.log('AI not active, skipping response');
      return new Response(JSON.stringify({ status: 'skipped' }), {
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

    // Build conversation history
    const conversationHistory = (recentMessages || [])
      .reverse()
      .map(msg => ({
        role: msg.is_from_contact ? 'user' : 'assistant',
        content: msg.content,
      }));

    // Build system prompt
    const communicationStyles: Record<string, string> = {
      formal: 'Responda de forma formal, profissional e respeitosa.',
      normal: 'Responda de forma equilibrada, nem muito formal nem muito informal.',
      descontraida: 'Responda de forma descontraída, amigável e acessível.',
    };

    const styleKey = aiConfig.communication_style || 'descontraida';
    const communicationStyle = communicationStyles[styleKey] || communicationStyles.descontraida;

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
## BASE DE CONHECIMENTO (OBRIGATÓRIO)
ATENÇÃO: Você DEVE usar EXCLUSIVAMENTE as informações abaixo para responder. NÃO invente informações!
Se a resposta não estiver na base de conhecimento, diga: "Não tenho essa informação específica na minha base de conhecimento."

${knowledgeBase}
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
7. OBJETIVO: Resposta em NO MÁXIMO 50 palavras.`;

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

    // Show typing or recording indicator BEFORE processing (so user sees it immediately)
    // Using Z-API's update-chat-status endpoint for presence indicators
    const presenceState = shouldRespondWithAudio && aiConfig.show_recording_indicator ? 'recording' : 
                          aiConfig.show_typing_indicator ? 'composing' : null;
    
    if (presenceState) {
      try {
        console.log(`Sending ${presenceState} indicator...`);
        const presenceResponse = await fetch(`https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/update-chat-status`, {
          method: 'POST',
          headers: zapiHeaders,
          body: JSON.stringify({ 
            phone: formattedPhone,
            presence: presenceState
          }),
        });
        const presenceResult = await presenceResponse.text();
        console.log('Presence indicator response:', presenceResult);
      } catch (e) {
        console.log('Failed to send presence indicator:', e);
      }
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
        max_tokens: 150, // Limitar para respostas bem mais curtas
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
    const aiMessage = aiData.choices?.[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('No response from AI');
    }

    console.log(`AI response: ${aiMessage.substring(0, 100)}...`);

    if (shouldRespondWithAudio) {
      console.log('Generating audio response with ElevenLabs...');

      try {
        // Generate audio with ElevenLabs - configurações otimizadas para máxima clareza
        const elevenLabsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${aiConfig.elevenlabs_voice_id}?output_format=mp3_44100_192`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': elevenlabsApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: aiMessage,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.85,          // Alto para pronúncia mais consistente e clara
                similarity_boost: 0.70,   // Ligeiramente menor para priorizar clareza
                style: 0.10,              // Mínimo para evitar distorções
                use_speaker_boost: true,
                speed: 0.90,              // Mais lento para melhor articulação
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

        const sendData = await sendResponse.json();
        console.log('Z-API audio send response:', sendData);

        // Save AI message to database with audio URL for CRM playback
        const messageContent = audioStorageUrl 
          ? `🔊 *Áudio enviado pela IA:*\n\n${aiMessage}\n\n[Áudio: ${audioStorageUrl}]`
          : `🔊 *Áudio enviado pela IA:*\n\n${aiMessage}`;
        
        await supabase
          .from('whatsapp_messages')
          .insert({
            conversation_id: conversationId,
            user_id: userId,
            message_type: 'audio',
            content: messageContent,
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
        // Fall through to text response
      }
    }

    // ALWAYS send ONE complete message - never split to avoid incomplete responses
    // The AI is already instructed to keep responses short and complete
    const messagesToSend = [aiMessage];
    console.log(`Sending 1 complete message (${aiMessage.length} chars)`);

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
