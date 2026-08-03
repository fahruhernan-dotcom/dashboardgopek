// ─── Constants ────────────────────────────────────────────────

export const VERTICAL_ACCENTS = {
  peternak: { name: 'Peternakan',   base: 'oklch(0.72 0.15 155)', soft: 'oklch(0.72 0.15 155 / 0.16)' },
  sembako:  { name: 'Sembako',      base: 'oklch(0.72 0.16 60)',  soft: 'oklch(0.72 0.16 60  / 0.16)' },
  broker:   { name: 'Broker',       base: 'oklch(0.7  0.15 230)', soft: 'oklch(0.7  0.15 230 / 0.16)' },
  rpa:      { name: 'Rumah Potong', base: 'oklch(0.65 0.20 15)',  soft: 'oklch(0.65 0.20 15  / 0.16)' },
  admin:    { name: 'Administrasi', base: 'oklch(0.65 0.20 290)', soft: 'oklch(0.65 0.20 290 / 0.16)' },
}

export const ROLE_LABELS = {
  owner:        { label: 'Pemilik',       bg: 'oklch(0.78 0.16 80 / 0.18)',  fg: 'oklch(0.82 0.16 80)'  },
  admin:        { label: 'Admin',         bg: 'oklch(0.7  0.18 240 / 0.18)', fg: 'oklch(0.78 0.16 240)' },
  superadmin:   { label: 'Super Admin',   bg: 'oklch(0.65 0.20 290 / 0.18)', fg: 'oklch(0.78 0.16 290)' },
  manajer:      { label: 'Manajer',       bg: 'oklch(0.65 0.18 280 / 0.18)', fg: 'oklch(0.78 0.16 280)' },
  staff:        { label: 'Staff Kandang', bg: 'oklch(0.65 0.16 200 / 0.18)', fg: 'oklch(0.78 0.14 210)' },
  anak_kandang: { label: 'Anak Kandang',  bg: 'oklch(0.62 0.18 155 / 0.18)', fg: 'oklch(0.78 0.16 155)' },
  view_only:    { label: 'Lihat Saja',    bg: 'oklch(0.6  0.02 250 / 0.2)',  fg: 'oklch(0.78 0.02 250)' },
}

export const PERMISSION_MATRIX = {
  owner:        { input: true,  edit: true,  reports: true,  team: true,  billing: true  },
  admin:        { input: true,  edit: true,  reports: true,  team: true,  billing: true  },
  superadmin:   { input: true,  edit: true,  reports: true,  team: true,  billing: true  },
  manajer:      { input: true,  edit: true,  reports: true,  team: true,  billing: false },
  staff:        { input: true,  edit: false, reports: false, team: false, billing: false },
  anak_kandang: { input: true,  edit: false, reports: false, team: false, billing: false },
  view_only:    { input: false, edit: false, reports: true,  team: false, billing: false },
}

export const BILLING_ROLES = ['owner', 'admin', 'superadmin', 'manajer']

export const PLAN_INFO = {
  none:     { label: 'Belum aktif',  price: null,           users: 1,   batches: 1,   history: '30 hari'   },
  starter:  { label: 'Starter',      price: 'Rp 0',         users: 1,   batches: 2,   history: '6 bulan'   },
  pro:      { label: 'Pro',          price: 'Rp 199.000',   users: 3,   batches: 10,  history: '3 tahun',  next: '15 Jun 2026' },
  business: { label: 'Business',     price: 'Rp 499.000',   users: 999, batches: 999, history: 'Selamanya', next: '15 Jun 2026' },
}

export const T = {
  bg:             '#0A0E0C',
  surface:        '#13191A',
  surfaceAlt:     '#0F1416',
  hairline:       'rgba(255,255,255,0.06)',
  hairlineStrong: 'rgba(255,255,255,0.12)',
  text:           '#F2F4F1',
  textDim:        '#9BA29B',
  textMute:       '#5A615C',
  danger:         'oklch(0.7 0.18 25)',
  warn:           'oklch(0.78 0.14 70)',
  ok:             'oklch(0.72 0.15 155)',
  shadow:         '0 1px 2px rgba(0,0,0,0.4), 0 12px 36px rgba(0,0,0,0.18)',
}

export const APP_VERSION = 'v0.9.4 build 2026.05'

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
  // normalize manager → manajer, owner_b2b → owner
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
