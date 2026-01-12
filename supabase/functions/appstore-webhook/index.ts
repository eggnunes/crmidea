import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Notification types from App Store Server Notifications V2
const NOTIFICATION_TYPES = {
  CONSUMPTION_REQUEST: "CONSUMPTION_REQUEST",
  DID_CHANGE_RENEWAL_PREF: "DID_CHANGE_RENEWAL_PREF",
  DID_CHANGE_RENEWAL_STATUS: "DID_CHANGE_RENEWAL_STATUS",
  DID_FAIL_TO_RENEW: "DID_FAIL_TO_RENEW",
  DID_RENEW: "DID_RENEW",
  EXPIRED: "EXPIRED",
  EXTERNAL_PURCHASE_TOKEN: "EXTERNAL_PURCHASE_TOKEN",
  GRACE_PERIOD_EXPIRED: "GRACE_PERIOD_EXPIRED",
  OFFER_REDEEMED: "OFFER_REDEEMED",
  ONE_TIME_CHARGE: "ONE_TIME_CHARGE",
  PRICE_INCREASE: "PRICE_INCREASE",
  REFUND: "REFUND",
  REFUND_DECLINED: "REFUND_DECLINED",
  REFUND_REVERSED: "REFUND_REVERSED",
  RENEWAL_EXTENDED: "RENEWAL_EXTENDED",
  RENEWAL_EXTENSION: "RENEWAL_EXTENSION",
  REVOKE: "REVOKE",
  SUBSCRIBED: "SUBSCRIBED",
  TEST: "TEST",
};

// Subscription status mapping
const SUBSCRIPTION_STATUS = {
  1: "active",
  2: "expired",
  3: "billing_retry",
  4: "billing_grace_period",
  5: "revoked",
};

function base64UrlDecode(str: string): string {
  // Add padding if needed
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  return atob(base64);
}

function decodeJWTPayload(jwt: string): any {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    const payload = base64UrlDecode(parts[1]);
    return JSON.parse(payload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

function parseSignedPayload(signedPayload: string): any {
  const decoded = decodeJWTPayload(signedPayload);
  if (!decoded) return null;
  
  // Recursively decode any nested signed data
  if (decoded.data?.signedTransactionInfo) {
    decoded.data.transactionInfo = decodeJWTPayload(decoded.data.signedTransactionInfo);
  }
  if (decoded.data?.signedRenewalInfo) {
    decoded.data.renewalInfo = decodeJWTPayload(decoded.data.signedRenewalInfo);
  }
  
  return decoded;
}

function determineSubscriptionStatus(notificationType: string, subtype?: string): string {
  switch (notificationType) {
    case NOTIFICATION_TYPES.SUBSCRIBED:
      return subtype === "INITIAL_BUY" ? "active" : "resubscribed";
    case NOTIFICATION_TYPES.DID_RENEW:
      return "active";
    case NOTIFICATION_TYPES.EXPIRED:
      return "expired";
    case NOTIFICATION_TYPES.DID_FAIL_TO_RENEW:
      return subtype === "GRACE_PERIOD" ? "grace_period" : "billing_retry";
    case NOTIFICATION_TYPES.GRACE_PERIOD_EXPIRED:
      return "expired";
    case NOTIFICATION_TYPES.REFUND:
      return "refunded";
    case NOTIFICATION_TYPES.REVOKE:
      return "revoked";
    case NOTIFICATION_TYPES.DID_CHANGE_RENEWAL_STATUS:
      return subtype === "AUTO_RENEW_DISABLED" ? "will_expire" : "active";
    default:
      return "unknown";
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Note: App Store Server Notifications V2 uses signed JWTs (signedPayload)
  // The security is provided by Apple's JWT signature, not a shared secret header
  // The "Secret" field in App Store Connect is used by Apple internally for signing
  // To fully verify, you would validate the JWT signature against Apple's public keys
  // For now, we rely on the obscurity of the webhook URL and HTTPS
  console.log("📥 Received App Store webhook request");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    console.log("Received App Store webhook notification");
    console.log("Request body:", JSON.stringify(body));

    // Handle Apple's webhook ping/test (different format from actual notifications)
    if (body.data?.type === "webhookPingCreated") {
      console.log("✅ Webhook ping test received successfully");
      console.log("Ping ID:", body.data.id);
      console.log("Timestamp:", body.data.attributes?.timestamp);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Webhook ping received successfully",
          pingId: body.data.id 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The actual notification is wrapped in a signedPayload JWT
    const signedPayload = body.signedPayload;
    if (!signedPayload) {
      console.error("No signedPayload in webhook body - body structure:", Object.keys(body));
      return new Response(
        JSON.stringify({ error: "Missing signedPayload", receivedKeys: Object.keys(body) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode the signed payload
    const decoded = parseSignedPayload(signedPayload);
    if (!decoded) {
      console.error("Failed to decode signedPayload");
      return new Response(
        JSON.stringify({ error: "Failed to decode payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notificationType = decoded.notificationType;
    const subtype = decoded.subtype;
    const notificationUUID = decoded.notificationUUID;
    const data = decoded.data;
    const transactionInfo = data?.transactionInfo;
    const renewalInfo = data?.renewalInfo;

    console.log(`Processing notification: ${notificationType} (${subtype || 'no subtype'})`);
    console.log(`Notification UUID: ${notificationUUID}`);

    // Extract transaction details
    const originalTransactionId = transactionInfo?.originalTransactionId || data?.originalTransactionId;
    const transactionId = transactionInfo?.transactionId;
    const productId = transactionInfo?.productId;
    const bundleId = data?.bundleId || transactionInfo?.bundleId;
    const environment = data?.environment || decoded.environment;
    const appAccountToken = transactionInfo?.appAccountToken;
    const expiresDate = transactionInfo?.expiresDate ? new Date(transactionInfo.expiresDate) : null;
    const purchaseDate = transactionInfo?.purchaseDate ? new Date(transactionInfo.purchaseDate) : null;

    // Store the webhook event
    const { error: eventError } = await supabase
      .from("appstore_webhook_events")
      .insert({
        notification_type: notificationType,
        subtype: subtype,
        notification_uuid: notificationUUID,
        transaction_id: transactionId,
        original_transaction_id: originalTransactionId,
        product_id: productId,
        bundle_id: bundleId,
        environment: environment,
        signed_date: decoded.signedDate ? new Date(decoded.signedDate) : null,
        raw_payload: body,
        decoded_payload: decoded,
      });

    if (eventError) {
      console.error("Error storing webhook event:", eventError);
      // Continue processing even if storage fails
    }

    // Handle TEST notification
    if (notificationType === NOTIFICATION_TYPES.TEST) {
      console.log("Test notification received successfully");
      return new Response(
        JSON.stringify({ success: true, message: "Test notification processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update or create subscription record
    if (originalTransactionId) {
      const status = determineSubscriptionStatus(notificationType, subtype);
      
      const subscriptionData = {
        original_transaction_id: originalTransactionId,
        product_id: productId,
        bundle_id: bundleId,
        status: status,
        expires_date: expiresDate?.toISOString(),
        purchase_date: purchaseDate?.toISOString(),
        renewal_info: renewalInfo,
        last_transaction_id: transactionId,
        environment: environment,
        app_account_token: appAccountToken,
        updated_at: new Date().toISOString(),
      };

      // Upsert subscription
      const { error: subError } = await supabase
        .from("appstore_subscriptions")
        .upsert(subscriptionData, {
          onConflict: "original_transaction_id",
        });

      if (subError) {
        console.error("Error upserting subscription:", subError);
      } else {
        console.log(`Subscription ${originalTransactionId} updated to status: ${status}`);
      }
    }

    // Handle specific notification types
    switch (notificationType) {
      case NOTIFICATION_TYPES.REFUND:
        console.log(`Refund processed for transaction: ${originalTransactionId}`);
        break;
        
      case NOTIFICATION_TYPES.DID_FAIL_TO_RENEW:
        console.log(`Renewal failed for: ${originalTransactionId}, subtype: ${subtype}`);
        break;
        
      case NOTIFICATION_TYPES.EXPIRED:
        console.log(`Subscription expired: ${originalTransactionId}`);
        break;
        
      case NOTIFICATION_TYPES.DID_RENEW:
        console.log(`Subscription renewed: ${originalTransactionId}`);
        break;
        
      case NOTIFICATION_TYPES.SUBSCRIBED:
        console.log(`New subscription: ${originalTransactionId}, type: ${subtype}`);
        break;

      case NOTIFICATION_TYPES.REVOKE:
        console.log(`Subscription revoked (family sharing removed): ${originalTransactionId}`);
        break;

      case NOTIFICATION_TYPES.CONSUMPTION_REQUEST:
        console.log(`Consumption request for: ${originalTransactionId}`);
        break;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationType,
        subtype,
        originalTransactionId 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook processing error:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});