// ─── Constants ────────────────────────────────────────────────

export const VERTICAL_ACCENTS = {
  peternak: { name: 'Peternakan',   base: '#16A34A', soft: 'rgba(22, 163, 74, 0.12)' },
  sembako:  { name: 'Sembako',      base: '#0c3d0c', soft: 'rgba(12, 61, 12, 0.12)' },
  broker:   { name: 'Broker',       base: '#0284C7', soft: 'rgba(2, 132, 199, 0.12)' },
  rpa:      { name: 'Rumah Potong', base: '#DC2626', soft: 'rgba(220, 38, 38, 0.12)' },
  admin:    { name: 'Administrasi', base: '#7C3AED', soft: 'rgba(124, 58, 237, 0.12)' },
}

export const ROLE_LABELS = {
  dev:          { label: 'Developer',        bg: 'rgba(124, 58, 237, 0.12)', fg: '#7C3AED' },
  owner:        { label: 'Pemilik (Owner)',  bg: 'rgba(217, 119, 6, 0.12)',  fg: '#D97706'  },
  admin:        { label: 'Admin (Operator)', bg: 'rgba(2, 132, 199, 0.12)', fg: '#0284C7' },
  superadmin:   { label: 'Developer',        bg: 'rgba(124, 58, 237, 0.12)', fg: '#7C3AED' },
  manajer:      { label: 'Manajer',          bg: 'rgba(147, 51, 234, 0.12)', fg: '#9333EA' },
  staff:        { label: 'Staff Gudang',     bg: 'rgba(13, 148, 136, 0.12)', fg: '#0D9488' },
  anak_kandang: { label: 'Anak Kandang',     bg: 'rgba(22, 163, 74, 0.12)', fg: '#16A34A' },
  view_only:    { label: 'Lihat Saja',       bg: 'rgba(100, 116, 139, 0.12)', fg: '#64748B' },
}

export const PERMISSION_MATRIX = {
  dev:          { input: true,  edit: true,  reports: true,  team: true,  billing: true  },
  owner:        { input: true,  edit: true,  reports: true,  team: true,  billing: true  },
  admin:        { input: true,  edit: false, reports: false, team: false, billing: false },
  superadmin:   { input: true,  edit: true,  reports: true,  team: true,  billing: true  },
  manajer:      { input: true,  edit: true,  reports: true,  team: true,  billing: false },
  staff:        { input: true,  edit: false, reports: false, team: false, billing: false },
  anak_kandang: { input: true,  edit: false, reports: false, team: false, billing: false },
  view_only:    { input: false, edit: false, reports: true,  team: false, billing: false },
}

export const BILLING_ROLES = ['owner', 'dev', 'superadmin']

export const PLAN_INFO = {
  none:     { label: 'Belum aktif',  price: null,           users: 1,   batches: 1,   history: '30 hari'   },
  starter:  { label: 'Starter',      price: 'Rp 0',         users: 1,   batches: 2,   history: '6 bulan'   },
  pro:      { label: 'Pro',          price: 'Rp 199.000',   users: 3,   batches: 10,  history: '3 tahun',  next: '15 Jun 2026' },
  business: { label: 'Business',     price: 'Rp 499.000',   users: 999, batches: 999, history: 'Selamanya', next: '15 Jun 2026' },
}

export const T = {
  bg:             'var(--bg-page, #FBFCF8)',
  surface:        'var(--bg-surface, #FFFFFF)',
  surfaceAlt:     'var(--bg-subtle, #F8FAFC)',
  hairline:       'var(--border-soft, #E2E8F0)',
  hairlineStrong: 'var(--border-muted, #CBD5E1)',
  text:           'var(--text-primary, #0F172A)',
  textDim:        'var(--text-secondary, #475569)',
  textMute:       'var(--text-muted, #64748B)',
  danger:         '#EF4444',
  warn:           '#F59E0B',
  ok:             '#16A34A',
  shadow:         '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.03)',
}

export const APP_VERSION = 'v0.9.7'
export const APP_BUILD_NUMBER = 20260820
export const APP_VERSION_LABEL = 'v0.9.7 build 2026.08'

export const INDONESIA_PROVINCES = [
  'Aceh','Bali','Banten','Bengkulu','DI Yogyakarta','DKI Jakarta',
  'Gorontalo','Jambi','Jawa Barat','Jawa Tengah','Jawa Timur',
  'Kalimantan Barat','Kalimantan Selatan','Kalimantan Tengah',
  'Kalimantan Timur','Kalimantan Utara','Kepulauan Bangka Belitung',
  'Kepulauan Riau','Lampung','Maluku','Maluku Utara',
  'Nusa Tenggara Barat','Nusa Tenggara Timur','Papua','Papua Barat',
  'Papua Barat Daya','Papua Pegunungan','Papua Selatan','Papua Tengah',
  'Riau','Sulawesi Barat','Sulawesi Selatan','Sulawesi Tengah',
  'Sulawesi Tenggara','Sulawesi Utara','Sumatera Barat',
  'Sumatera Selatan','Sumatera Utara',
]

// ─── Helpers ──────────────────────────────────────────────────

export function getUserRole(profile) {
  if (!profile) return 'view_only'
  const raw = (
    profile.role ||
    profile.app_role ||
    profile.business_role ||
    profile.user_type ||
    'view_only'
  ).toLowerCase()
  if (raw === 'dev' || raw === 'superadmin') return 'dev'
  if (raw === 'manager') return 'manajer'
  if (raw === 'owner_b2b') return 'owner'
  return PERMISSION_MATRIX[raw] ? raw : 'view_only'
}

export function normalizeVertical(v) {
  if (!v) return 'peternak'
  if (v.startsWith('peternak_') || v === 'peternak') return 'peternak'
  if (v === 'sembako_broker' || v === 'distributor_sembako') return 'sembako'
  if (v === 'poultry_broker') return 'broker'
  if (v.startsWith('rumah_potong')) return 'rpa'
  if (v === 'admin' || v === 'superadmin') return 'admin'
  return 'peternak'
}

export function cardStyle() {
  return {
    background: T.surface,
    border: `1px solid ${T.hairline}`,
    borderRadius: 16,
    padding: 14,
    boxShadow: T.shadow,
  }
}
