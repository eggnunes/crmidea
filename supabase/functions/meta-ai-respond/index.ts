import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch user profile from Meta API
async function fetchMetaProfile(userId: string, accessToken: string): Promise<{name?: string, profile_pic?: string}> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${userId}?fields=name,profile_pic&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      console.log('Failed to fetch Meta profile:', await response.text());
      return {};
    }
    
    const data = await response.json();
    console.log('Meta profile data:', data);
    return {
      name: data.name,
      profile_pic: data.profile_pic
    };
  } catch (error) {
    console.error('Error fetching Meta profile:', error);
    return {};
  }
}

// Send message via Meta API
async function sendMetaMessage(
  pageId: string, 
  recipientId: string, 
  message: string, 
  accessToken: string,
  channel: 'instagram' | 'facebook'
): Promise<{success: boolean, messageId?: string}> {
  try {
    const apiUrl = `https://graph.facebook.com/v18.0/${pageId}/messages`;
    
    const body: any = {
      recipient: { id: recipientId },
      message: { text: message },
    };
    
    // Facebook requires messaging_type
    if (channel === 'facebook') {
      body.messaging_type = 'RESPONSE';
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Meta API error:', result);
      return { success: false };
    }
    
    return { success: true, messageId: result.message_id };
  } catch (error) {
    console.error('Error sending Meta message:', error);
    return { success: false };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, messageContent, contactId, userId, channel } = await req.json();

    console.log(`Processing AI response for ${channel} conversation ${conversationId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get channel config
    const { data: channelConfig } = await supabase
      .from('channel_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('channel', channel)
      .eq('is_active', true)
      .single();

    if (!channelConfig?.access_token) {
      console.log(`${channel} not configured or inactive`);
      return new Response(JSON.stringify({ status: 'skipped', reason: 'channel_not_configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get conversation details
    const { data: conversation } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Fetch and update user profile if not already done
    if (!conversation.contact_name || conversation.contact_name.startsWith('Instagram User') || conversation.contact_name.startsWith('Facebook User')) {
      const profile = await fetchMetaProfile(contactId, channelConfig.access_token);
      
      if (profile.name || profile.profile_pic) {
        await supabase
          .from('whatsapp_conversations')
          .update({
            contact_name: profile.name || conversation.contact_name,
            profile_picture_url: profile.profile_pic
          })
          .eq('id', conversationId);
        
        console.log('Updated conversation with profile:', profile);
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

    // Get training documents
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

    // Build context
    let knowledgeBase = '';
    if (trainingDocs && trainingDocs.length > 0) {
      knowledgeBase = trainingDocs.map(doc => `[${doc.title}]\n${doc.content}`).join('\n\n');
    }

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

    const channelName = channel === 'instagram' ? 'Instagram Direct' : 'Facebook Messenger';
    const styleKey = aiConfig.communication_style || 'descontraida';
    const communicationStyle = communicationStyles[styleKey] || communicationStyles.descontraida;

    let systemPrompt = `Você é ${aiConfig.agent_name}, um assistente de IA respondendo via ${channelName}.

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
      systemPrompt += `\n## Base de Conhecimento\nUse as seguintes informações para responder às perguntas:\n\n${knowledgeBase}\n`;
    }

    if (intentsContext) {
      systemPrompt += `\n## Intenções Especiais\nQuando o usuário mencionar certas frases, siga estas instruções:\n${intentsContext}\n`;
    }

    systemPrompt += `\n## Instruções Finais
- Responda sempre em português brasileiro.
- Seja conciso mas completo.
- Lembre-se que está respondendo via ${channelName}, então mantenha as mensagens adequadas para este canal.
- Se não souber a resposta, diga que não tem essa informação e ofereça ajuda com outras questões.`;

    // Response delay
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
          { role: 'user', content: messageContent },
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

    // Send message via Meta API
    const sendResult = await sendMetaMessage(
      channelConfig.page_id,
      contactId,
      aiMessage,
      channelConfig.access_token,
      channel
    );

    if (!sendResult.success) {
      throw new Error('Failed to send message via Meta API');
    }

    // Save AI message to database
    await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        message_type: 'text',
        content: aiMessage,
        is_from_contact: false,
        is_ai_response: true,
        channel,
        channel_message_id: sendResult.messageId,
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
      type: 'text',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in Meta AI response:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
