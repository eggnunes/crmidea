import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// App Store Server API endpoints
const PRODUCTION_URL = "https://api.storekit.itunes.apple.com";
const SANDBOX_URL = "https://api.storekit-sandbox.itunes.apple.com";

function base64urlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateSubscriptionJWT(): Promise<string> {
  const privateKeyPem = Deno.env.get("APPSTORE_SUBSCRIPTION_KEY");
  const keyId = Deno.env.get("APPSTORE_SUBSCRIPTION_KEY_ID");
  const issuerId = Deno.env.get("APPSTORE_ISSUER_ID");
  const bundleId = Deno.env.get("APPSTORE_BUNDLE_ID") || "com.eggnunes.aiteleprompter";

  if (!privateKeyPem || !keyId || !issuerId) {
    throw new Error("Missing subscription API credentials");
  }

  // JWT Header
  const header = {
    alg: "ES256",
    kid: keyId,
    typ: "JWT"
  };

  // JWT Payload for App Store Server API
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 3600, // 1 hour
    aud: "appstoreconnect-v1",
    bid: bundleId
  };

  // Encode header and payload
  const encodedHeader = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  // Parse PEM and sign
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(dataToSign)
  );

  const encodedSignature = base64urlEncode(new Uint8Array(signature));

  return `${dataToSign}.${encodedSignature}`;
}

async function getTransactionHistory(
  jwt: string, 
  originalTransactionId: string, 
  environment: "production" | "sandbox"
): Promise<any> {
  const baseUrl = environment === "production" ? PRODUCTION_URL : SANDBOX_URL;
  const url = `${baseUrl}/inApps/v1/history/${originalTransactionId}`;

  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Transaction history failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function getSubscriptionStatus(
  jwt: string, 
  originalTransactionId: string, 
  environment: "production" | "sandbox"
): Promise<any> {
  const baseUrl = environment === "production" ? PRODUCTION_URL : SANDBOX_URL;
  const url = `${baseUrl}/inApps/v1/subscriptions/${originalTransactionId}`;

  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Subscription status failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function lookupOrder(
  jwt: string, 
  orderId: string, 
  environment: "production" | "sandbox"
): Promise<any> {
  const baseUrl = environment === "production" ? PRODUCTION_URL : SANDBOX_URL;
  const url = `${baseUrl}/inApps/v1/lookup/${orderId}`;

  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Order lookup failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function getRefundHistory(
  jwt: string, 
  originalTransactionId: string, 
  environment: "production" | "sandbox"
): Promise<any> {
  const baseUrl = environment === "production" ? PRODUCTION_URL : SANDBOX_URL;
  const url = `${baseUrl}/inApps/v2/refund/lookup/${originalTransactionId}`;

  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Refund history failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function requestConsumption(
  jwt: string, 
  originalTransactionId: string, 
  environment: "production" | "sandbox"
): Promise<any> {
  const baseUrl = environment === "production" ? PRODUCTION_URL : SANDBOX_URL;
  const url = `${baseUrl}/inApps/v1/transactions/consumption/${originalTransactionId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      customerConsented: true,
      consumptionStatus: 0,
      platform: 1, // Apple
      sampleContentProvided: false,
      deliveryStatus: 0,
      appAccountToken: "",
      accountTenure: 0,
      playTime: 0,
      lifetimeDollarsRefunded: 0,
      lifetimeDollarsPurchased: 0,
      userStatus: 0,
      refundPreference: 0
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Consumption request failed: ${response.status} - ${errorText}`);
  }

  return { success: true, status: response.status };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, transactionId, orderId, environment = "production" } = await req.json();

    console.log(`Processing IAP validation: action=${action}, env=${environment}`);

    const jwt = await generateSubscriptionJWT();

    let result;

    switch (action) {
      case "validate_transaction":
        if (!transactionId) {
          throw new Error("transactionId is required");
        }
        result = await getTransactionHistory(jwt, transactionId, environment);
        break;

      case "subscription_status":
        if (!transactionId) {
          throw new Error("transactionId is required");
        }
        result = await getSubscriptionStatus(jwt, transactionId, environment);
        break;

      case "lookup_order":
        if (!orderId) {
          throw new Error("orderId is required");
        }
        result = await lookupOrder(jwt, orderId, environment);
        break;

      case "refund_history":
        if (!transactionId) {
          throw new Error("transactionId is required");
        }
        result = await getRefundHistory(jwt, transactionId, environment);
        break;

      case "request_consumption":
        if (!transactionId) {
          throw new Error("transactionId is required");
        }
        result = await requestConsumption(jwt, transactionId, environment);
        break;

      default:
        throw new Error(`Unknown action: ${action}. Available actions: validate_transaction, subscription_status, lookup_order, refund_history, request_consumption`);
    }

    // Log the validation
    console.log(`IAP validation successful for action: ${action}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        environment 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("IAP validation error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
