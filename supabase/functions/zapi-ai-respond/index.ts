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
    const { conversationId, messageContent, contactPhone, userId, isAudioMessage, audioUrl } = await req.json();

    console.log(`Processing AI response for conversation ${conversationId}, isAudio: ${isAudioMessage}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Get training documents for context
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

    let systemPrompt = `Você é ${aiConfig.agent_name}, um assistente de IA.

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
${aiConfig.split_long_messages ? '- Se a resposta for muito longa, divida em partes menores e mais fáceis de ler.' : ''}
${aiConfig.sign_agent_name ? `- Assine suas mensagens como "${aiConfig.agent_name}".` : ''}
`;

    if (knowledgeBase) {
      systemPrompt += `\n## Base de Conhecimento\nUse as seguintes informações para responder às perguntas:\n\n${knowledgeBase}\n`;
    }

    if (intentsContext) {
      systemPrompt += `\n## Intenções Especiais\nQuando o usuário mencionar certas frases, siga estas instruções:\n${intentsContext}\n`;
    }

    systemPrompt += `\n## Instruções Finais
- Responda sempre em português brasileiro.
- Seja conciso mas completo.
- Se não souber a resposta, diga que não tem essa informação e ofereça ajuda com outras questões.`;

    // Wait for response delay if configured
    const responseDelay = aiConfig.response_delay_seconds || 0;
    if (responseDelay > 0) {
      console.log(`Waiting ${responseDelay}s before responding...`);
      await new Promise(resolve => setTimeout(resolve, responseDelay * 1000));
    }

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

    let formattedPhone = contactPhone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }

    // Show typing indicator if enabled
    if (aiConfig.show_typing_indicator) {
      try {
        await fetch(`https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-typing`, {
          method: 'POST',
          headers: zapiHeaders,
          body: JSON.stringify({ phone: formattedPhone }),
        });
      } catch (e) {
        console.log('Failed to send typing indicator:', e);
      }
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
        max_tokens: 1000,
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

    // Check if we should respond with audio (using ElevenLabs)
    const shouldRespondWithAudio = isAudioMessage && 
      aiConfig.voice_response_enabled && 
      aiConfig.elevenlabs_enabled && 
      elevenlabsApiKey && 
      aiConfig.elevenlabs_voice_id;

    if (shouldRespondWithAudio) {
      console.log('Generating audio response with ElevenLabs...');

      // Show recording indicator if enabled
      if (aiConfig.show_recording_indicator) {
        try {
          await fetch(`https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-recording`, {
            method: 'POST',
            headers: zapiHeaders,
            body: JSON.stringify({ phone: formattedPhone }),
          });
        } catch (e) {
          console.log('Failed to send recording indicator:', e);
        }
      }

      try {
        // Generate audio with ElevenLabs
        const elevenLabsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${aiConfig.elevenlabs_voice_id}`,
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
                stability: 0.5,
                similarity_boost: 0.75,
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

        // Send audio via Z-API
        const audioUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-audio`;
        
        const sendResponse = await fetch(audioUrl, {
          method: 'POST',
          headers: zapiHeaders,
          body: JSON.stringify({
            phone: formattedPhone,
            audio: `data:audio/mpeg;base64,${audioBase64}`,
          }),
        });

        const sendData = await sendResponse.json();
        console.log('Z-API audio send response:', sendData);

        // Save AI message to database
        await supabase
          .from('whatsapp_messages')
          .insert({
            conversation_id: conversationId,
            user_id: userId,
            message_type: 'audio',
            content: aiMessage,
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
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (audioError) {
        console.error('Error sending audio, falling back to text:', audioError);
        // Fall through to text response
      }
    }

    // Split message if needed
    let messagesToSend = [aiMessage];
    if (aiConfig.split_long_messages && aiMessage.length > 1000) {
      // Split by paragraphs or sentences
      const paragraphs = aiMessage.split('\n\n').filter((p: string) => p.trim());
      if (paragraphs.length > 1) {
        messagesToSend = paragraphs;
      } else {
        // Split by sentences
        const sentences = aiMessage.match(/[^.!?]+[.!?]+/g) || [aiMessage];
        messagesToSend = [];
        let currentChunk = '';
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > 800) {
            if (currentChunk) messagesToSend.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += sentence;
          }
        }
        if (currentChunk) messagesToSend.push(currentChunk.trim());
      }
    }

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
