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
  if (!tenant) {
    return {
      status: 'unknown',
      label: 'Unknown',
      daysLeft: 0,
      expiresAt: null,
      isExpiringSoon: false,
      plan: 'starter',
    }
  }

  if (!tenant.plan_expires_at) {
    return {
      status: 'expired',
      label: 'Starter (Expired)',
      daysLeft: 0,
      expiresAt: null,
      isExpiringSoon: false,
      plan: 'starter',
    }
  }

  const expiresAt = new Date(tenant.plan_expires_at)
  const now = new Date()

  const diffTime = expiresAt - now
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const isExpired = daysLeft <= 0

  return {
    status: isExpired ? 'expired' : 'active',
    label: tenant.plan === 'business' ? 'Business' : tenant.plan === 'pro' ? 'Pro' : 'Starter',
    daysLeft: isExpired ? 0 : daysLeft,
    expiresAt,
    isExpiringSoon: !isExpired && daysLeft <= 5,
    plan: tenant.plan || 'starter',
  }
}

/**
 * Warna badge berdasarkan status
 */
export function getStatusColor(status) {
  if (status === 'active') {
    return { color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.1)', border: 'rgba(74, 222, 128, 0.25)' }
  }
  return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)' }
}

export function getEffectivePlan(tenant) {
  return tenant?.plan || 'starter'
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
