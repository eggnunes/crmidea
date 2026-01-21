import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64UrlEncode } from 'https://deno.land/std@0.208.0/encoding/base64url.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate JWT for App Store Connect API
async function generateJWT(): Promise<string> {
  const issuerId = Deno.env.get('APPSTORE_ISSUER_ID')!
  const keyId = Deno.env.get('APPSTORE_KEY_ID')!
  const privateKeyPem = Deno.env.get('APPSTORE_PRIVATE_KEY')!

  const now = Math.floor(Date.now() / 1000)
  const exp = now + 20 * 60 // 20 minutes

  const header = {
    alg: 'ES256',
    kid: keyId,
    typ: 'JWT'
  }

  const payload = {
    iss: issuerId,
    iat: now,
    exp: exp,
    aud: 'appstoreconnect-v1'
  }

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)))
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)))

  // Parse PEM private key - handle different formats
  let pemContents = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\\n/g, '')  // Handle escaped newlines
    .replace(/\r?\n/g, '')  // Handle actual newlines
    .replace(/\s/g, '')
  
  console.log('Private key parsed, length:', pemContents.length)
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  const signatureInput = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    signatureInput
  )

  const encodedSignature = base64UrlEncode(new Uint8Array(signature))

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

// Fetch data from App Store Connect API
async function fetchFromAPI(endpoint: string, jwt: string): Promise<Response> {
  const baseUrl = 'https://api.appstoreconnect.apple.com/v1'
  console.log(`Fetching from: ${baseUrl}${endpoint}`)
  
  return await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    }
  })
}

// Fetch sales reports from App Store Connect
async function fetchSalesReports(jwt: string, vendorId: string): Promise<any> {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const reportDate = yesterday.toISOString().split('T')[0].replace(/-/g, '')
  
  const url = `https://api.appstoreconnect.apple.com/v1/salesReports?filter[reportType]=SALES&filter[reportSubType]=SUMMARY&filter[frequency]=DAILY&filter[vendorNumber]=${vendorId}&filter[reportDate]=${reportDate}`
  
  console.log(`Fetching sales report: ${url}`)
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Accept': 'application/a-gzip'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Sales report error:', errorText)
    throw new Error(`Failed to fetch sales report: ${response.status} - ${errorText}`)
  }
  
  return response
}

// Fetch app analytics
async function fetchApps(jwt: string): Promise<any[]> {
  const response = await fetchFromAPI('/apps', jwt)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Apps fetch error:', errorText)
    throw new Error(`Failed to fetch apps: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
}

// Fetch customer reviews
async function fetchReviews(jwt: string, appId: string): Promise<any[]> {
  const response = await fetchFromAPI(`/apps/${appId}/customerReviews?sort=-createdDate&limit=50`, jwt)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Reviews fetch error:', errorText)
    throw new Error(`Failed to fetch reviews: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data || []
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
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
    
    if (!roleData) {
      console.log('User is not admin:', user.id)
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    console.log('Admin verified:', user.id)

    const { action } = await req.json()
    console.log('App Store Connect action:', action)

    // Get API credentials
    const issuerId = Deno.env.get('APPSTORE_ISSUER_ID')
    const keyId = Deno.env.get('APPSTORE_KEY_ID')
    const privateKey = Deno.env.get('APPSTORE_PRIVATE_KEY')
    const vendorId = Deno.env.get('APPSTORE_VENDOR_ID')

    if (!issuerId || !keyId || !privateKey) {
      await supabase.from('appstore_sync_logs').insert({
        sync_type: action,
        status: 'error',
        error_message: 'API credentials not configured.',
      })

      return new Response(JSON.stringify({ 
        error: 'App Store Connect API credentials not configured',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate JWT token
    console.log('Generating JWT token...')
    const jwt = await generateJWT()
    console.log('JWT generated successfully')

    let recordsSynced = 0
    let errorMessage: string | null = null

    try {
      if (action === 'sync-all' || action === 'sync-sales') {
        console.log('Syncing sales data...')
        const apps = await fetchApps(jwt)
        console.log(`Found ${apps.length} apps`)
        
        for (const app of apps) {
          const appName = app.attributes?.name || 'Unknown App'
          const today = new Date().toISOString().split('T')[0]
          
          // Check if record exists first
          const { data: existing } = await supabase
            .from('appstore_sales')
            .select('id')
            .eq('date', today)
            .eq('product_name', appName)
            .eq('country_code', 'ALL')
            .maybeSingle()
          
          if (!existing) {
            const { error: insertError } = await supabase.from('appstore_sales').insert({
              date: today,
              product_name: appName,
              product_type: 'App',
              units: 0,
              proceeds: 0,
              country_code: 'ALL',
              currency: 'USD'
            })
            
            if (insertError) {
              console.error('Error inserting sales record:', insertError)
            } else {
              console.log(`Inserted sales record for ${appName}`)
              recordsSynced++
            }
          } else {
            console.log(`Sales record already exists for ${appName} on ${today}`)
          }
        }
      }

      if (action === 'sync-all' || action === 'sync-reviews') {
        console.log('Syncing reviews data...')
        const apps = await fetchApps(jwt)
        
        for (const app of apps) {
          const appId = app.id
          try {
            const reviews = await fetchReviews(jwt, appId)
            console.log(`Found ${reviews.length} reviews for app ${appId}`)
            
            for (const review of reviews) {
              const attrs = review.attributes || {}
              const appleId = review.id
              
              console.log('Processing review:', appleId, 'Title:', attrs.title)
              
              // Check if review already exists
              const { data: existing } = await supabase
                .from('appstore_reviews')
                .select('id')
                .eq('apple_id', appleId)
                .maybeSingle()
              
              if (!existing) {
                const reviewData = {
                  apple_id: appleId,
                  author_name: attrs.reviewerNickname || 'Anonymous',
                  title: attrs.title || '',
                  body: attrs.body || '',
                  rating: attrs.rating || 0,
                  review_date: attrs.createdDate || new Date().toISOString(),
                  country_code: attrs.territory || 'US',
                }
                
                console.log('Inserting review:', JSON.stringify(reviewData))
                
                const { error: insertError } = await supabase
                  .from('appstore_reviews')
                  .insert(reviewData)
                
                if (insertError) {
                  console.error('Error inserting review:', insertError)
                } else {
                  console.log(`Inserted review ${appleId}`)
                  recordsSynced++
                }
              } else {
                console.log(`Review ${appleId} already exists`)
              }
            }
          } catch (reviewError) {
            console.error(`Error fetching reviews for app ${appId}:`, reviewError)
          }
        }
      }

      if (action === 'sync-all' || action === 'sync-metrics') {
        console.log('Syncing metrics data...')
        const today = new Date().toISOString().split('T')[0]
        
        // Check if metrics for today exist
        const { data: existing } = await supabase
          .from('appstore_metrics')
          .select('id')
          .eq('date', today)
          .maybeSingle()
        
        if (!existing) {
          const { error: insertError } = await supabase.from('appstore_metrics').insert({
            date: today,
            downloads: 0,
            redownloads: 0,
            impressions: 0,
            page_views: 0,
            active_devices: 0,
            sessions: 0,
            crashes: 0,
          })
          
          if (insertError) {
            console.error('Error inserting metrics:', insertError)
          } else {
            console.log(`Inserted metrics for ${today}`)
            recordsSynced++
          }
        } else {
          console.log(`Metrics for ${today} already exist`)
        }
      }

    } catch (apiError: unknown) {
      console.error('API Error:', apiError)
      errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error'
    }

    // Log sync result
    await supabase.from('appstore_sync_logs').insert({
      sync_type: action,
      status: errorMessage ? 'error' : 'success',
      records_synced: recordsSynced,
      error_message: errorMessage,
    })

    console.log(`Sync completed. Records synced: ${recordsSynced}, Error: ${errorMessage}`)

    return new Response(JSON.stringify({ 
      success: !errorMessage,
      message: errorMessage || `Synced ${recordsSynced} records successfully`,
      records_synced: recordsSynced,
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
