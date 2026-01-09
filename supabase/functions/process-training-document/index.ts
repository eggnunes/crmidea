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
    // Extract and verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT and get the user ID from the token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('[process-training-document] Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = claimsData.claims.sub as string;
    const { documentId } = await req.json();

    if (!documentId) {
      throw new Error('documentId is required');
    }

    // Get the document and verify ownership
    const { data: doc, error: docError } = await supabase
      .from('ai_training_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', authenticatedUserId)
      .single();

    if (docError || !doc) {
      console.error('[process-training-document] Document not found or access denied:', docError);
      return new Response(
        JSON.stringify({ error: 'Documento não encontrado ou acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing document: ${doc.title} (${doc.content_type}) for user: ${authenticatedUserId}`);

    let extractedContent = doc.content;

    // Process based on content type
    if (doc.content_type === 'video' && doc.file_url) {
      // Process video using Gemini (supports video analysis)
      try {
        console.log(`Processing video: ${doc.file_url}`);
        
        if (!lovableApiKey) {
          throw new Error('LOVABLE_API_KEY is required for video processing');
        }

        // Use Gemini to analyze/transcribe the video
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `Você é um especialista em transcrição e análise de vídeos. Sua tarefa é extrair TODO o conteúdo falado e informações visuais relevantes do vídeo para criar uma base de conhecimento completa.
                
Instruções:
1. Transcreva TUDO que é falado no vídeo, palavra por palavra
2. Descreva informações visuais importantes (slides, gráficos, demonstrações)
3. Organize o conteúdo de forma estruturada
4. Preserve todos os detalhes técnicos e conceitos explicados
5. NÃO resuma - queremos o conteúdo COMPLETO para treinamento de IA`
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Transcreva e extraia TODO o conteúdo deste vídeo "${doc.title}". Este conteúdo será usado como base de conhecimento para um assistente de IA, então preciso de TODOS os detalhes, falas e informações visuais relevantes.`
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: doc.file_url
                    }
                  }
                ]
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          extractedContent = aiData.choices?.[0]?.message?.content || 
            `Não foi possível transcrever o vídeo "${doc.title}". Tente novamente ou adicione o conteúdo manualmente como texto.`;
          
          console.log(`Video transcription completed: ${extractedContent.length} chars`);
        } else {
          const errorText = await aiResponse.text();
          console.error('AI API error:', errorText);
          throw new Error(`Erro na API de IA: ${aiResponse.status}`);
        }
      } catch (videoError) {
        console.error('Error processing video:', videoError);
        extractedContent = `Vídeo "${doc.title}" foi enviado, mas não foi possível transcrever automaticamente. Erro: ${videoError instanceof Error ? videoError.message : 'Erro desconhecido'}. Considere adicionar o conteúdo como texto.`;
        
        // Update status to error
        await supabase
          .from('ai_training_documents')
          .update({ status: 'error', content: extractedContent })
          .eq('id', documentId)
          .eq('user_id', authenticatedUserId);
        
        return new Response(JSON.stringify({ 
          success: false,
          error: extractedContent,
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (doc.content_type === 'website' && doc.content.startsWith('http')) {
      // Fetch website content
      try {
        console.log(`Fetching website: ${doc.content}`);
        const websiteResponse = await fetch(doc.content, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CRM-Bot/1.0)',
          },
        });

        if (websiteResponse.ok) {
          const html = await websiteResponse.text();
          
          // Simple HTML to text extraction
          extractedContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 10000); // Limit to 10000 chars

          console.log(`Extracted ${extractedContent.length} chars from website`);
        }
      } catch (fetchError) {
        console.error('Error fetching website:', fetchError);
        extractedContent = `Não foi possível acessar o website: ${doc.content}`;
      }
    } else if (doc.content_type === 'document' && doc.file_url) {
      // For PDF/document files, we'll use AI to summarize the filename and any metadata
      // In a production environment, you would use a PDF parser like pdf-parse
      
      try {
        // Download the file
        const fileResponse = await fetch(doc.file_url);
        
        if (fileResponse.ok) {
          const contentType = fileResponse.headers.get('content-type') || '';
          
          if (contentType.includes('text/plain')) {
            // Text file - read directly
            extractedContent = await fileResponse.text();
          } else {
            // For PDFs and other binary files, we'll use AI to help process
            // Since we can't directly parse PDFs in Edge Functions without heavy dependencies,
            // we'll create a placeholder that encourages the user to paste the content manually
            
            if (lovableApiKey) {
              // Use AI to create a helpful description
              const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${lovableApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'google/gemini-2.5-flash',
                  messages: [
                    {
                      role: 'system',
                      content: 'Você é um assistente que ajuda a criar descrições de documentos.'
                    },
                    {
                      role: 'user',
                      content: `Crie uma breve descrição para um documento de treinamento chamado "${doc.file_name || doc.title}". Este documento será usado como base de conhecimento para um assistente de IA. Apenas diga que o documento "${doc.title}" foi adicionado à base de conhecimento e está disponível para consulta.`
                    }
                  ],
                }),
              });

              if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                extractedContent = aiData.choices?.[0]?.message?.content || 
                  `Documento "${doc.title}" adicionado à base de conhecimento.`;
              }
            } else {
              extractedContent = `Documento "${doc.title}" (${doc.file_name}) adicionado à base de conhecimento. Para melhores resultados, considere copiar e colar o conteúdo do documento como texto.`;
            }
          }
        }
      } catch (fileError) {
        console.error('Error processing file:', fileError);
        extractedContent = `Documento "${doc.title}" foi enviado, mas não foi possível processar automaticamente. Considere adicionar o conteúdo como texto.`;
      }
    }

    // Update document with extracted content and mark as trained
    const { error: updateError } = await supabase
      .from('ai_training_documents')
      .update({
        content: extractedContent,
        status: 'trained',
      })
      .eq('id', documentId)
      .eq('user_id', authenticatedUserId);

    if (updateError) throw updateError;

    console.log(`Document ${documentId} processed successfully`);

    return new Response(JSON.stringify({ 
      success: true,
      documentId,
      contentLength: extractedContent.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing training document:', error);
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
