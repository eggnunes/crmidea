import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeAndTrainRequest {
  url: string;
  title: string;
  userId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, title, userId: providedUserId }: ScrapeAndTrainRequest = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from JWT if not provided
    let userId = providedUserId;
    if (!userId) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      }
    }

    // If still no user ID, get the admin user
    if (!userId) {
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1)
        .single();
      
      userId = adminRole?.user_id;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping URL for AI training:', formattedUrl);

    // Scrape the website using Firecrawl
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Failed to scrape website' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapedContent = data.data?.markdown || '';
    
    if (!scrapedContent || scrapedContent.length < 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not enough content extracted from website' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraped content length:', scrapedContent.length);

    // Check if document with same title already exists
    const { data: existingDoc } = await supabase
      .from('ai_training_documents')
      .select('id')
      .eq('user_id', userId)
      .eq('title', title)
      .maybeSingle();

    let docId: string;

    if (existingDoc) {
      // Update existing document
      const { error: updateError } = await supabase
        .from('ai_training_documents')
        .update({
          content: scrapedContent,
          content_type: 'website',
          status: 'trained',
        })
        .eq('id', existingDoc.id);

      if (updateError) {
        throw updateError;
      }
      docId = existingDoc.id;
      console.log('Updated existing training document:', docId);
    } else {
      // Create new training document
      const { data: newDoc, error: insertError } = await supabase
        .from('ai_training_documents')
        .insert({
          user_id: userId,
          title: title,
          content: scrapedContent,
          content_type: 'website',
          status: 'trained',
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }
      docId = newDoc.id;
      console.log('Created new training document:', docId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId: docId,
        contentLength: scrapedContent.length,
        message: `Successfully scraped and saved training document: ${title}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-and-train:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape and train';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
