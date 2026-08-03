/**
 * Single source of truth untuk status subscription tenant.
 * Gunakan fungsi ini di semua komponen — jangan hitung ulang sendiri.
 */

/**
 * @param {object} tenant — object tenant dari Supabase
 * @returns {{ status, label, daysLeft, expiresAt, isExpiringSoon, plan }}
 *
 * status:
 *   'trial'    — Starter, trial masih aktif
 *   'active'   — Pro/Business, plan berbayar masih aktif
 *   'expired'  — Plan/trial sudah berakhir
 *   'unknown'  — Data tidak tersedia
 */
export function getSubscriptionStatus(tenant) {
  if (!tenant) return { status: 'unknown', label: 'Unknown', daysLeft: 0, plan: null }

  const now = new Date()
  const plan = tenant.plan || 'starter'

  // 1. Check for Paid Plan (Pro/Business) — takes priority over trial
  const planExp = tenant.plan_expires_at ? new Date(tenant.plan_expires_at) : null
  if (planExp && planExp > now && plan !== 'starter') {
    const daysLeft = Math.ceil((planExp - now) / 86400000)
    return {
      status: 'active',
      label: plan === 'pro' ? 'Pro' : 'Business',
      daysLeft,
      expiresAt: planExp,
      isExpiringSoon: daysLeft <= 14,
      plan,
    }
  }

  // 2. Check for Active Trial (only if no active paid plan)
  const trialEnd = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null
  if (trialEnd && trialEnd > now && plan !== 'starter') {
    const daysLeft = Math.ceil((trialEnd - now) / 86400000)
    return {
      status: 'trial',
      label: 'Trial ' + (plan.charAt(0).toUpperCase() + plan.slice(1)),
      daysLeft,
      expiresAt: trialEnd,
      isExpiringSoon: daysLeft <= 3,
      plan,
    }
  }

  // 3. Handle Starter Plan (Free Forever if no trial)
  if (plan === 'starter') {
    return {
      status: 'active',
      label: 'Starter',
      daysLeft: 999, // Infinite
      expiresAt: null,
      isExpiringSoon: false,
      plan,
    }
  }

  // 4. Fallback to Expired
  const lastExpiry = (plan !== 'starter' ? tenant.plan_expires_at : tenant.trial_ends_at) || tenant.created_at
  return { 
    status: 'expired', 
    label: plan === 'starter' ? 'Gratis' : 'Langganan Berakhir', 
    daysLeft: 0, 
    plan, 
    expiresAt: new Date(lastExpiry) 
  }
}

/**
 * Warna badge berdasarkan status
 */
export function getStatusColor(status) {
  switch (status) {
    case 'active':   return { color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.1)', border: 'rgba(74, 222, 128, 0.25)' }
    case 'trial':    return { color: '#6366F1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)' }
    case 'expired':  return { color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' }
    default:         return { color: '#4B6478', bg: 'rgba(75,100,120,0.1)', border: 'rgba(75,100,120,0.25)' }
  }
}

/**
 * Label expiry yang kontekstual
 * Contoh: "Trial berakhir 15 Apr 2026" / "Pro aktif hingga 1 Jul 2026"
 */
/**
 * Returns the plan that should be enforced for feature gating.
 * Returns 'starter' for expired tenants even if tenants.plan is still 'pro'/'business'.
 * Use this everywhere you need to determine feature access — never read tenant.plan directly.
 */
export function getEffectivePlan(tenant) {
  const sub = getSubscriptionStatus(tenant)
  if (sub.status === 'active' || sub.status === 'trial') return sub.plan || 'starter'
  return 'starter'
}

export function getExpiryLabel(tenant) {
  const sub = getSubscriptionStatus(tenant)
  if (!sub.expiresAt) return null

  const dateStr = sub.expiresAt.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  switch (sub.status) {
    case 'trial':   return `Trial berakhir ${dateStr}`
    case 'active':  return `${sub.label} aktif hingga ${dateStr}`
    case 'expired': return `Expired sejak ${dateStr}`
    default:        return null
  }
}
