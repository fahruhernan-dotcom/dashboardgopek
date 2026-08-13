// Supabase Edge Function: send-push-notification
// Menerima event notifikasi, mencatat history ke tabel notifications, dan mengirim push via Google FCM v1 API
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Helper: Membuat Google OAuth2 Access Token dari Service Account JSON
async function getGoogleAccessToken(serviceAccount: Record<string, any>): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: "RS256", typ: "JWT" }
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }

  // Base64URL encode
  const encodeB64 = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")

  const unsignedJwt = `${encodeB64(header)}.${encodeB64(claim)}`

  // Import Private Key (PKCS8 format)
  const pem = serviceAccount.private_key
  const pemHeader = "-----BEGIN PRIVATE KEY-----"
  const pemFooter = "-----END PRIVATE KEY-----"
  const pemContents = pem.substring(
    pem.indexOf(pemHeader) + pemHeader.length,
    pem.indexOf(pemFooter)
  ).replace(/\s/g, "")
  
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedJwt)
  )

  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")

  const jwt = `${unsignedJwt}.${base64Signature}`

  // Exchange JWT dengan Google Access Token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token from Google: ${JSON.stringify(tokenData)}`)
  }

  return tokenData.access_token
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const fcmServiceAccountRaw = Deno.env.get("FCM_SERVICE_ACCOUNT")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload = await req.json()
    const {
      tenant_id,
      recipient_user_ids,
      type = "SYSTEM_ALERT",
      title,
      body,
      data = {},
    } = payload

    if (!tenant_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: tenant_id, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 1. Tentukan target user penerima
    let targetUserIds: string[] = recipient_user_ids || []

    // Jika target tidak ditentukan secara spesifik, kirim ke semua anggota tenant
    if (targetUserIds.length === 0) {
      const { data: members, error: memErr } = await supabase
        .from("profiles")
        .select("auth_user_id")
        .eq("tenant_id", tenant_id)

      if (!memErr && members) {
        targetUserIds = members.map((m: any) => m.auth_user_id).filter(Boolean)
      }
    }

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ message: "No recipient users found for tenant" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 2. Simpan ke tabel notifications (In-App Notification Center) untuk setiap user
    const notifRows = targetUserIds.map((uid) => ({
      tenant_id,
      user_id: uid,
      type,
      title,
      body,
      data,
      is_read: false,
    }))

    const { error: notifInsertErr } = await supabase
      .from("notifications")
      .insert(notifRows)

    if (notifInsertErr) {
      console.error("[send-push] Gagal insert notifikasi in-app:", notifInsertErr)
    }

    // 3. Ambil Device Tokens aktif untuk target users
    const { data: tokens, error: tokenErr } = await supabase
      .from("device_tokens")
      .select("id, device_token, user_id")
      .eq("tenant_id", tenant_id)
      .in("user_id", targetUserIds)
      .eq("is_active", true)

    if (tokenErr || !tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          in_app_saved: true,
          fcm_sent_count: 0,
          message: "Saved in-app notification. No active FCM device tokens found.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 4. Jika Service Account FCM tersedia di Supabase Secrets, kirim via FCM v1 API
    let fcmSentCount = 0
    const invalidTokenIds: string[] = []

    if (fcmServiceAccountRaw) {
      const serviceAccount = JSON.parse(fcmServiceAccountRaw)
      const accessToken = await getGoogleAccessToken(serviceAccount)
      const projectId = serviceAccount.project_id || "gopek-mart"
      const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

      for (const t of tokens) {
        const messagePayload = {
          message: {
            token: t.device_token,
            notification: {
              title: title,
              body: body,
            },
            data: {
              route: data?.route || "",
              type: type,
              tenant_id: tenant_id,
            },
            android: {
              priority: "high",
              notification: {
                sound: "default",
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                channel_id: "gopek_main_channel",
              },
            },
          },
        }

        try {
          const res = await fetch(fcmEndpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(messagePayload),
          })

          const resData = await res.json()
          if (res.ok) {
            fcmSentCount++
          } else {
            console.error(`[FCM Error] Token ${t.device_token.slice(0, 10)}... :`, resData)
            // Jika token sudah tidak valid / uninstalled, tandai tidak aktif
            if (
              resData?.error?.details?.some((d: any) =>
                d?.errorCode === "UNREGISTERED" || d?.errorCode === "INVALID_ARGUMENT"
              )
            ) {
              invalidTokenIds.push(t.id)
            }
          }
        } catch (err) {
          console.error("[FCM Fetch Error]:", err)
        }
      }

      // Deactivate invalid/stale tokens
      if (invalidTokenIds.length > 0) {
        await supabase
          .from("device_tokens")
          .update({ is_active: false })
          .in("id", invalidTokenIds)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        in_app_saved: true,
        fcm_sent_count: fcmSentCount,
        total_recipients: targetUserIds.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("[send-push-notification error]:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
