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

// Parse gzip compressed response
async function decompressGzip(response: Response): Promise<string> {
  const arrayBuffer = await response.arrayBuffer()
  const decompressedStream = new DecompressionStream('gzip')
  const writer = decompressedStream.writable.getWriter()
  writer.write(new Uint8Array(arrayBuffer))
  writer.close()
  
  const reader = decompressedStream.readable.getReader()
  const chunks: Uint8Array[] = []
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  
  return new TextDecoder().decode(result)
}

// Fetch sales reports from App Store Connect with gzip decompression
async function fetchAndParseSalesReport(jwt: string, vendorId: string, reportDate: string): Promise<{ data: any[], status: string, message: string }> {
  const formattedDate = reportDate.replace(/-/g, '')
  
  const url = `https://api.appstoreconnect.apple.com/v1/salesReports?filter[reportType]=SALES&filter[reportSubType]=SUMMARY&filter[frequency]=DAILY&filter[vendorNumber]=${vendorId}&filter[reportDate]=${formattedDate}`
  
  console.log(`Fetching sales report for ${reportDate}: ${url}`)
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Accept': 'application/a-gzip'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Sales report error for ${reportDate} (${response.status}):`, errorText)
    
    // Parse error to give meaningful feedback
    try {
      const errorJson = JSON.parse(errorText)
      const errorCode = errorJson?.errors?.[0]?.code || 'UNKNOWN'
      const errorDetail = errorJson?.errors?.[0]?.detail || 'No details available'
      
      if (response.status === 404 || errorCode === 'NOT_FOUND') {
        return { data: [], status: 'not_available', message: `Relatório de ${reportDate} ainda não disponível na Apple` }
      }
      
      return { data: [], status: 'error', message: `${errorCode}: ${errorDetail}` }
    } catch {
      return { data: [], status: 'error', message: `HTTP ${response.status}: ${errorText.substring(0, 200)}` }
    }
  }
  
  try {
    const csvText = await decompressGzip(response)
    console.log(`Sales report CSV for ${reportDate} (first 500 chars): ${csvText.substring(0, 500)}`)
    
    const lines = csvText.split('\n').filter(l => l.trim())
    if (lines.length < 2) {
      console.log(`No data rows in sales report for ${reportDate}`)
      return { data: [], status: 'empty', message: 'Relatório vazio - sem vendas/downloads nesta data' }
    }
    
    const headers = lines[0].split('\t')
    console.log(`Sales report headers: ${headers.join(', ')}`)
    
    const results: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t')
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h.trim()] = values[idx]?.trim() || ''
      })
      results.push(row)
    }
    
    console.log(`Parsed ${results.length} sales records for ${reportDate}`)
    return { data: results, status: 'success', message: `${results.length} registros encontrados` }
  } catch (err) {
    console.error('Error parsing sales report:', err)
    return { data: [], status: 'parse_error', message: `Erro ao processar relatório: ${err}` }
  }
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

// Create an analytics report request
async function createAnalyticsReportRequest(jwt: string, appId: string): Promise<string | null> {
  const today = new Date()
  const endDate = today.toISOString().split('T')[0]
  const startDate = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0]
  
  const body = {
    data: {
      type: 'analyticsReportRequests',
      attributes: {
        accessType: 'ONGOING'
      },
      relationships: {
        app: {
          data: {
            type: 'apps',
            id: appId
          }
        }
      }
    }
  }
  
  console.log(`Creating analytics report request for app ${appId}`)
  
  const response = await fetch('https://api.appstoreconnect.apple.com/v1/analyticsReportRequests', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Analytics report request error:', errorText)
    return null
  }
  
  const data = await response.json()
  return data.data?.id || null
}

// Fetch available analytics reports
async function fetchAnalyticsReports(jwt: string, appId: string): Promise<any[]> {
  console.log(`Fetching analytics reports for app ${appId}`)
  
  const response = await fetch(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/analyticsReportRequests?filter[accessType]=ONGOING`, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Analytics reports fetch error:', errorText)
    return []
  }
  
  const data = await response.json()
  return data.data || []
}

// Fetch report instances (actual data)
async function fetchReportInstances(jwt: string, reportRequestId: string): Promise<any[]> {
  console.log(`Fetching report instances for request ${reportRequestId}`)
  
  const response = await fetch(`https://api.appstoreconnect.apple.com/v1/analyticsReportRequests/${reportRequestId}/reports`, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Report instances fetch error:', errorText)
    return []
  }
  
  const data = await response.json()
  return data.data || []
}

// Fetch report segments (detailed data)
async function fetchReportSegments(jwt: string, reportId: string): Promise<any[]> {
  console.log(`Fetching segments for report ${reportId}`)
  
  const response = await fetch(`https://api.appstoreconnect.apple.com/v1/analyticsReports/${reportId}/instances?limit=30`, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Report segments fetch error:', errorText)
    return []
  }
  
  const data = await response.json()
  return data.data || []
}

// Download and parse a report segment
async function downloadReportData(jwt: string, instanceId: string): Promise<any[]> {
  console.log(`Downloading report data for instance ${instanceId}`)
  
  // First get the download URL
  const segmentsResponse = await fetch(`https://api.appstoreconnect.apple.com/v1/analyticsReportInstances/${instanceId}/segments`, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!segmentsResponse.ok) {
    console.error('Segments fetch error:', await segmentsResponse.text())
    return []
  }
  
  const segmentsData = await segmentsResponse.json()
  const segments = segmentsData.data || []
  
  const results: any[] = []
  
  for (const segment of segments) {
    const downloadUrl = segment.attributes?.url
    if (!downloadUrl) continue
    
    console.log(`Downloading from URL: ${downloadUrl.substring(0, 100)}...`)
    
    const dataResponse = await fetch(downloadUrl, {
      headers: {
        'Accept': 'application/a-gzip, text/csv'
      }
    })
    
    if (!dataResponse.ok) {
      console.error('Data download error:', dataResponse.status)
      continue
    }
    
    const csvText = await dataResponse.text()
    const lines = csvText.split('\n').filter(l => l.trim())
    
    if (lines.length < 2) continue
    
    const headers = lines[0].split('\t')
    console.log(`Report headers: ${headers.join(', ')}`)
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t')
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h.trim()] = values[idx]?.trim() || ''
      })
      results.push(row)
    }
  }
  
  return results
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
    let salesReportStatus: { available: number; notAvailable: number; errors: number; messages: string[] } = {
      available: 0,
      notAvailable: 0,
      errors: 0,
      messages: []
    }

    try {
      if (action === 'sync-all' || action === 'sync-sales') {
        console.log('Syncing sales data using Sales Reports API...')
        
        if (!vendorId) {
          console.error('Vendor ID not configured, cannot fetch sales reports')
          salesReportStatus.messages.push('Vendor ID não configurado')
        } else {
          // Fetch sales reports for the last 30 days
          const today = new Date()
          
          for (let i = 1; i <= 30; i++) {
            const reportDate = new Date(today)
            reportDate.setDate(reportDate.getDate() - i)
            const dateStr = reportDate.toISOString().split('T')[0]
            
            try {
              const salesResult = await fetchAndParseSalesReport(jwt, vendorId, dateStr)
              
              console.log(`Sales report ${dateStr}: status=${salesResult.status}, message=${salesResult.message}`)
              
              // Track status
              if (salesResult.status === 'success') {
                salesReportStatus.available++
              } else if (salesResult.status === 'not_available' || salesResult.status === 'empty') {
                salesReportStatus.notAvailable++
              } else {
                salesReportStatus.errors++
                // Only log first few errors to avoid overwhelming
                if (salesReportStatus.messages.length < 3) {
                  salesReportStatus.messages.push(`${dateStr}: ${salesResult.message}`)
                }
              }
              
              if (salesResult.data.length === 0) {
                continue
              }
              
              // Process each sales record
              for (const row of salesResult.data) {
                // Sales report columns: Provider, Provider Country, SKU, Developer, Title, Version, 
                // Product Type Identifier, Units, Developer Proceeds, Begin Date, End Date, 
                // Customer Currency, Country Code, Currency of Proceeds, Apple Identifier, 
                // Customer Price, Promo Code, Parent Identifier, Subscription, Period, Category, CMB
                
                const productName = row['Title'] || row['SKU'] || 'Unknown'
                const units = parseInt(row['Units'] || '0') || 0
                const proceeds = parseFloat(row['Developer Proceeds'] || '0') || 0
                const countryCode = row['Country Code'] || 'ALL'
                const currency = row['Currency of Proceeds'] || 'USD'
                const productType = row['Product Type Identifier'] || 'App'
                
                console.log(`Processing: ${productName}, Units: ${units}, Country: ${countryCode}`)
                
                // Check if record exists
                const { data: existing } = await supabase
                  .from('appstore_sales')
                  .select('id, units, proceeds')
                  .eq('date', dateStr)
                  .eq('product_name', productName)
                  .eq('country_code', countryCode)
                  .maybeSingle()
                
                if (existing) {
                  // Update if values changed
                  if (existing.units !== units || parseFloat(existing.proceeds) !== proceeds) {
                    const { error: updateError } = await supabase
                      .from('appstore_sales')
                      .update({
                        units,
                        proceeds,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', existing.id)
                    
                    if (!updateError) {
                      console.log(`Updated sales for ${productName} on ${dateStr}`)
                      recordsSynced++
                    }
                  }
                } else {
                  const { error: insertError } = await supabase.from('appstore_sales').insert({
                    date: dateStr,
                    product_name: productName,
                    product_type: productType,
                    units,
                    proceeds,
                    country_code: countryCode,
                    currency
                  })
                  
                  if (!insertError) {
                    console.log(`Inserted sales for ${productName} on ${dateStr}`)
                    recordsSynced++
                  } else {
                    console.error('Error inserting sales:', insertError)
                  }
                }
              }
              
              // Also update metrics from sales data - aggregate downloads by date
              const totalUnits = salesResult.data.reduce((sum: number, row: Record<string, string>) => {
                const productType = row['Product Type Identifier'] || ''
                // Count downloads (initial installs) - type codes starting with 1 are downloads
                if (productType.startsWith('1') || productType === 'App' || productType === '1F' || productType === '1T') {
                  return sum + (parseInt(row['Units'] || '0') || 0)
                }
                return sum
              }, 0)
              
              const totalRedownloads = salesResult.data.reduce((sum: number, row: Record<string, string>) => {
                const productType = row['Product Type Identifier'] || ''
                // Type 7 = redownloads
                if (productType.startsWith('7')) {
                  return sum + (parseInt(row['Units'] || '0') || 0)
                }
                return sum
              }, 0)
              
              if (totalUnits > 0 || totalRedownloads > 0) {
                // Check if metrics exist for this date
                const { data: existingMetrics } = await supabase
                  .from('appstore_metrics')
                  .select('id, downloads, redownloads')
                  .eq('date', dateStr)
                  .maybeSingle()
                
                if (existingMetrics) {
                  // Only update if we have new data
                  if (existingMetrics.downloads !== totalUnits || existingMetrics.redownloads !== totalRedownloads) {
                    const { error: updateError } = await supabase
                      .from('appstore_metrics')
                      .update({
                        downloads: totalUnits,
                        redownloads: totalRedownloads,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', existingMetrics.id)
                    
                    if (!updateError) {
                      console.log(`Updated metrics for ${dateStr}: downloads=${totalUnits}, redownloads=${totalRedownloads}`)
                    }
                  }
                } else {
                  const { error: insertError } = await supabase
                    .from('appstore_metrics')
                    .insert({
                      date: dateStr,
                      downloads: totalUnits,
                      redownloads: totalRedownloads,
                      impressions: 0,
                      page_views: 0,
                      sessions: 0,
                      active_devices: 0,
                      crashes: 0
                    })
                  
                  if (!insertError) {
                    console.log(`Inserted metrics for ${dateStr}: downloads=${totalUnits}, redownloads=${totalRedownloads}`)
                  }
                }
              }
              
            } catch (salesError) {
              console.error(`Error fetching sales for ${dateStr}:`, salesError)
            }
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
        console.log('Syncing metrics data from Analytics API...')
        const apps = await fetchApps(jwt)
        
        for (const app of apps) {
          const appId = app.id
          console.log(`Processing metrics for app ${appId}`)
          
          // First, check if we have an ongoing analytics report request
          let reportRequests = await fetchAnalyticsReports(jwt, appId)
          
          if (reportRequests.length === 0) {
            console.log('No existing report request, creating one...')
            const requestId = await createAnalyticsReportRequest(jwt, appId)
            if (requestId) {
              console.log(`Created report request: ${requestId}`)
              // Reports need time to generate, return early
              recordsSynced++
            }
            continue
          }
          
          // Process each report request
          for (const reportRequest of reportRequests) {
            const requestId = reportRequest.id
            console.log(`Processing report request: ${requestId}`)
            
            // Get the reports for this request
            const reports = await fetchReportInstances(jwt, requestId)
            console.log(`Found ${reports.length} reports`)
            
            for (const report of reports) {
              const reportId = report.id
              const reportName = report.attributes?.name || 'Unknown'
              const category = report.attributes?.category || ''
              
              console.log(`Report: ${reportName} (${category})`)
              
              // We're interested in APP_USAGE and APP_STORE_DISCOVERY reports
              if (!['APP_USAGE', 'APP_STORE_DISCOVERY', 'APP_STORE_ENGAGEMENT'].includes(category)) {
                continue
              }
              
              // Get report instances (daily data)
              const instances = await fetchReportSegments(jwt, reportId)
              console.log(`Found ${instances.length} instances for ${reportName}`)
              
              // Download data from recent instances
              for (const instance of instances.slice(0, 30)) {
                const instanceId = instance.id
                const processingDate = instance.attributes?.processingDate
                
                if (!processingDate) continue
                
                const date = processingDate.split('T')[0]
                console.log(`Processing data for date: ${date}`)
                
                const reportData = await downloadReportData(jwt, instanceId)
                
                // Aggregate the data by date
                let totalDownloads = 0
                let totalRedownloads = 0
                let totalImpressions = 0
                let totalPageViews = 0
                let totalSessions = 0
                let totalActiveDevices = 0
                let totalCrashes = 0
                
                for (const row of reportData) {
                  // Different reports have different column names
                  totalDownloads += parseInt(row['First Time Downloads'] || row['Total Downloads'] || '0') || 0
                  totalRedownloads += parseInt(row['Redownloads'] || '0') || 0
                  totalImpressions += parseInt(row['Impressions'] || row['Total Impressions'] || '0') || 0
                  totalPageViews += parseInt(row['Product Page Views'] || row['Page Views'] || '0') || 0
                  totalSessions += parseInt(row['Sessions'] || '0') || 0
                  totalActiveDevices += parseInt(row['Active Devices'] || row['Active In Last 30 Days'] || '0') || 0
                  totalCrashes += parseInt(row['Crashes'] || '0') || 0
                }
                
                console.log(`Aggregated for ${date}: downloads=${totalDownloads}, impressions=${totalImpressions}, sessions=${totalSessions}`)
                
                if (totalDownloads > 0 || totalImpressions > 0 || totalSessions > 0) {
                  // Check if metrics for this date exist
                  const { data: existing } = await supabase
                    .from('appstore_metrics')
                    .select('id')
                    .eq('date', date)
                    .maybeSingle()
                  
                  if (existing) {
                    // Update existing record
                    const { error: updateError } = await supabase
                      .from('appstore_metrics')
                      .update({
                        downloads: totalDownloads,
                        redownloads: totalRedownloads,
                        impressions: totalImpressions,
                        page_views: totalPageViews,
                        sessions: totalSessions,
                        active_devices: totalActiveDevices,
                        crashes: totalCrashes,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', existing.id)
                    
                    if (updateError) {
                      console.error('Error updating metrics:', updateError)
                    } else {
                      console.log(`Updated metrics for ${date}`)
                      recordsSynced++
                    }
                  } else {
                    // Insert new record
                    const { error: insertError } = await supabase
                      .from('appstore_metrics')
                      .insert({
                        date: date,
                        downloads: totalDownloads,
                        redownloads: totalRedownloads,
                        impressions: totalImpressions,
                        page_views: totalPageViews,
                        sessions: totalSessions,
                        active_devices: totalActiveDevices,
                        crashes: totalCrashes,
                      })
                    
                    if (insertError) {
                      console.error('Error inserting metrics:', insertError)
                    } else {
                      console.log(`Inserted metrics for ${date}`)
                      recordsSynced++
                    }
                  }
                }
              }
            }
          }
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
    console.log(`Sales report status: available=${salesReportStatus.available}, notAvailable=${salesReportStatus.notAvailable}, errors=${salesReportStatus.errors}`)

    // Build detailed message
    let detailedMessage = errorMessage || `Sincronizados ${recordsSynced} registros com sucesso`
    if (action === 'sync-all' || action === 'sync-sales') {
      if (salesReportStatus.errors === 30 && salesReportStatus.available === 0) {
        detailedMessage = 'Nenhum relatório de vendas disponível. A Apple pode demorar 24-72h para processar os dados de um app novo, ou o app ainda não teve downloads suficientes para gerar relatórios.'
      } else if (salesReportStatus.notAvailable > 0 && salesReportStatus.available === 0) {
        detailedMessage = `Nenhum dado de vendas encontrado nos últimos 30 dias. Isso pode indicar que não houve downloads ou a Apple ainda está processando.`
      }
    }

    return new Response(JSON.stringify({ 
      success: !errorMessage,
      message: detailedMessage,
      records_synced: recordsSynced,
      sales_status: action === 'sync-all' || action === 'sync-sales' ? salesReportStatus : undefined,
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
