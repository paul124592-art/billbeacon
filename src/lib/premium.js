// Server-verified Premium for BillBeacon.
//
// The Supabase "premium" edge function is the ONLY authority on whether
// this browser has Premium. localStorage only holds the Stripe checkout
// session id (the token) — it is never trusted on its own. On every app
// load the token is re-checked with the server, and Premium stays on only
// while the server answers premium: true.
//
// If VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing, every call
// fails closed: Premium stays locked and the rest of the app works normally.
// No URL or key is hardcoded here — the same env vars the bills database
// client already uses.

const TOKEN_KEY = 'billbeacon_premium_token'
const PRODUCT = 'billbeacon'

function premiumConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return {
    endpoint: `${String(url).replace(/\/$/, '')}/functions/v1/premium`,
    anonKey,
  }
}

async function callPremium(action, payload) {
  const cfg = premiumConfig()
  if (!cfg) return false
  try {
    const res = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    })
    if (!res.ok) return false
    const data = await res.json()
    if (data?.premium !== true) return false
    // The token must belong to this app, not another app on the same backend.
    if (data.product && data.product !== PRODUCT) return false
    return true
  } catch {
    // Network / server error: fail closed, Premium stays off.
    return false
  }
}

// Verify a checkout session that just came back from Stripe.
// Returns true only if the server confirms that session really paid.
export async function verifyPremiumSession(sessionId) {
  return callPremium('verify', { session_id: sessionId })
}

// Re-check a stored token against the server.
// Returns true only while the server still says the entitlement is active.
export async function checkPremiumToken(token) {
  return callPremium('check', { token })
}

export function getStoredPremiumToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function storePremiumToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Storage unavailable — Premium simply won't persist across loads.
  }
}
