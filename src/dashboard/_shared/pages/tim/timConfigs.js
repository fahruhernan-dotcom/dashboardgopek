/**
 * Konfigurasi per-role untuk halaman Tim & Manajemen.
 * 
 * Setiap role (peternak, broker, rpa) punya config sendiri yang mengatur:
 * - Warna aksen UI
 * - Daftar role yang bisa diundang
 * - Badge styling per role
 * - Style kartu & input
 */

// ── PETERNAK ─────────────────────────────────────────────────────────────────
export const PETERNAK_TIM_CONFIG = {
  // Warna
  accent: '#10B981',
  accentHover: '#059669',
  accentRgb: '16, 185, 129',

  // Role badge map
  roleBadgeMap: {
    owner:     { label: 'Owner',             class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    manajer:   { label: 'Manajer',           class: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    staff:     { label: 'Staff Kandang',     class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    anak_buah: { label: 'Anak Buah Kandang', class: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    view_only: { label: 'Lihat Saja',        class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  },

  // Role options di InviteSheet
  inviteRoles: [
    { value: 'manajer',   label: 'Manajer Kandang',    desc: 'Kelola semua data transaksi & siklus, tidak bisa akses profil bisnis.' },
    { value: 'staff',     label: 'Staff Kandang',      desc: 'Input data harian & tugas. Tidak bisa melihat keuangan.' },
    { value: 'anak_buah', label: 'Anak Buah Kandang',  desc: 'Hanya bisa melihat & menyelesaikan tugas yang ditugaskan padanya.' },
    { value: 'view_only', label: 'Lihat Saja',         desc: 'Akses terbatas: hanya melihat statistik & laporan.' },
  ],
  defaultInviteRole: 'staff',

  // UI tokens
  cardBg: '#0C1319',
  cardRadius: '16px',
  inputBg: '#111C24',
  inviteCodeTitle: 'Kode Undangan Tim',
}

// ── BROKER SEMBAKO ───────────────────────────────────────────────────────────
export const BROKER_SEMBAKO_TIM_CONFIG = {
  accent: '#EA580C',
  accentHover: '#D44E0A',
  accentRgb: '234, 88, 12',

  roleBadgeMap: {
    owner:   { label: 'Owner',         class: 'bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/20' },
    admin:   { label: 'Admin',         class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    sales:   { label: 'Sales',         class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    gudang:  { label: 'Gudang',        class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    kurir:   { label: 'Kurir / Sopir', class: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    lainnya: { label: 'Lainnya',       class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  },

  inviteRoles: [
    { value: 'admin',   label: 'Admin',         desc: 'Akses penuh ke operasional, keuangan, dan laporan.' },
    { value: 'sales',   label: 'Sales',         desc: 'Mengelola penjualan, pelanggan, dan pesanan baru.' },
    { value: 'gudang',  label: 'Gudang',        desc: 'Mengelola stok, inventori, masuk & keluar barang.' },
    { value: 'kurir',   label: 'Kurir / Sopir', desc: 'Akses melihat rute dan update status pengiriman/logistik.' },
    { value: 'lainnya', label: 'Lainnya',       desc: 'Akses khusus atau jabatan lainnya di dalam operasional.' },
  ],
  defaultInviteRole: 'admin',

  cardBg: '#111C24',
  cardRadius: '28px',
  inputBg: '#0C1319',
  inviteCodeTitle: 'Kode Undangan Sembako',
}

// ── BROKER POULTRY (Ayam) ────────────────────────────────────────────────────
export const BROKER_POULTRY_TIM_CONFIG = {
  accent: '#0EA5E9',
  accentHover: '#0284C7',
  accentRgb: '14, 165, 233',

  roleBadgeMap: {
    owner:     { label: 'Owner',             class: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
    manajer:   { label: 'Manajer',           class: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    sales:     { label: 'Sales / Marketing', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    supir:     { label: 'Supir / Driver',    class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    staff:     { label: 'Staff',             class: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    view_only: { label: 'Lihat Saja',        class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  },

  inviteRoles: [
    { value: 'manajer',   label: 'Manajer',           desc: 'Akses penuh operasional & transaksi.' },
    { value: 'sales',     label: 'Sales / Marketing', desc: 'Kelola transaksi penjualan & pelanggan.' },
    { value: 'supir',     label: 'Supir / Driver',    desc: 'Akses lihat jadwal pengiriman.' },
    { value: 'staff',     label: 'Staff',             desc: 'Input data & tugas operasional.' },
    { value: 'view_only', label: 'Lihat Saja',        desc: 'Akses terbatas laporan & statistik.' },
  ],
  defaultInviteRole: 'staff',

  cardBg: '#0C1319',
  cardRadius: '16px',
  inputBg: '#111C24',
  inviteCodeTitle: 'Kode Undangan Broker Ayam',
}

// ── BROKER TELUR ─────────────────────────────────────────────────────────────
export const BROKER_TELUR_TIM_CONFIG = {
  accent: '#F59E0B',
  accentHover: '#D97706',
  accentRgb: '245, 158, 11',

  roleBadgeMap: {
    owner:     { label: 'Owner',         class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    admin:     { label: 'Admin',         class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    sales:     { label: 'Sales',         class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    gudang:    { label: 'Gudang',        class: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    kurir:     { label: 'Kurir / Sopir', class: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    view_only: { label: 'Lihat Saja',    class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  },

  inviteRoles: [
    { value: 'admin',     label: 'Admin',         desc: 'Akses penuh operasional & keuangan.' },
    { value: 'sales',     label: 'Sales',         desc: 'Kelola penjualan & pelanggan telur.' },
    { value: 'gudang',    label: 'Gudang',        desc: 'Manajemen stok & inventori telur.' },
    { value: 'kurir',     label: 'Kurir / Sopir', desc: 'Akses lihat jadwal pengiriman.' },
    { value: 'view_only', label: 'Lihat Saja',    desc: 'Akses terbatas laporan.' },
  ],
  defaultInviteRole: 'admin',

  cardBg: '#0C1319',
  cardRadius: '16px',
  inputBg: '#111C24',
  inviteCodeTitle: 'Kode Undangan Broker Telur',
}

// ── RPA (Placeholder) ────────────────────────────────────────────────────────
export const RPA_TIM_CONFIG = {
  accent: '#8B5CF6',
  accentHover: '#7C3AED',
  accentRgb: '139, 92, 246',

  roleBadgeMap: {
    owner:      { label: 'Owner',           class: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
    admin_rpa:  { label: 'Admin RPA',       class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    operator:   { label: 'Operator',        class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    qc:         { label: 'Quality Control', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    gudang_rpa: { label: 'Gudang',          class: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  },

  inviteRoles: [
    { value: 'admin_rpa',  label: 'Admin RPA',       desc: 'Akses penuh ke operasional RPA dan laporan.' },
    { value: 'operator',   label: 'Operator',        desc: 'Mengelola proses pemotongan dan produksi.' },
    { value: 'qc',         label: 'Quality Control', desc: 'Inspeksi kualitas produk dan standar kebersihan.' },
    { value: 'gudang_rpa', label: 'Gudang',          desc: 'Mengelola stok hasil produksi dan distribusi.' },
  ],
  defaultInviteRole: 'operator',

  cardBg: '#0C1319',
  cardRadius: '16px',
  inputBg: '#111C24',
  inviteCodeTitle: 'Kode Undangan RPA',
}
