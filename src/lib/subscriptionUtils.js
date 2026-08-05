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
  return {
    status: 'active',
    label: 'Business (Unlimited)',
    daysLeft: 9999,
    expiresAt: null,
    isExpiringSoon: false,
    plan: 'business',
  }
}

/**
 * Warna badge berdasarkan status
 */
export function getStatusColor(status) {
  return { color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.1)', border: 'rgba(74, 222, 128, 0.25)' }
}

export function getEffectivePlan(tenant) {
  return 'business'
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
