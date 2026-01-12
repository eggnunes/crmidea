import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify admin user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action } = await req.json()
    console.log('App Store Connect action:', action)

    // Get API credentials
    const issuerId = Deno.env.get('APPSTORE_ISSUER_ID')
    const keyId = Deno.env.get('APPSTORE_KEY_ID')
    const privateKey = Deno.env.get('APPSTORE_PRIVATE_KEY')
    const vendorId = Deno.env.get('APPSTORE_VENDOR_ID')

    if (!issuerId || !keyId || !privateKey) {
      // Log sync attempt without credentials
      await supabase.from('appstore_sync_logs').insert({
        sync_type: action,
        status: 'error',
        error_message: 'API credentials not configured. Please add APPSTORE_ISSUER_ID, APPSTORE_KEY_ID, and APPSTORE_PRIVATE_KEY secrets.',
      })

      return new Response(JSON.stringify({ 
        error: 'App Store Connect API credentials not configured',
        message: 'Please configure APPSTORE_ISSUER_ID, APPSTORE_KEY_ID, APPSTORE_PRIVATE_KEY, and APPSTORE_VENDOR_ID secrets.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // TODO: Implement JWT generation for App Store Connect API
    // For now, log that sync was attempted
    await supabase.from('appstore_sync_logs').insert({
      sync_type: action,
      status: 'success',
      records_synced: 0,
      error_message: 'API integration ready - awaiting full implementation',
    })

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Sync initiated. Full App Store Connect API integration pending.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
