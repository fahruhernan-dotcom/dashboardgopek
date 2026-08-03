/**
 * planGating.js — Central config for plan gating across all business verticals.
 *
 * SINGLE SOURCE OF TRUTH for:
 *   - Frontend fallback limits (when plan_configs hasn't loaded)
 *   - Feature availability per tier per vertical
 *   - TODO markers for future RPH implementation
 *
 * Runtime limits (enforced by DB trigger + frontend hook) are read from:
 *   Supabase: plan_configs WHERE config_key = 'transaction_quota'
 *   value shape: { "starter": 30 }
 *
 * To update a limit: change it in AdminPricing → it updates plan_configs → both
 * frontend hook AND DB trigger pick up the new value automatically.
 * Only change FALLBACK_TRANSACTION_QUOTA if the DB row itself is missing.
 */

// ─── Global Fallback ──────────────────────────────────────────────────────────
// Matches FALLBACK_STARTER_LIMIT in useTransactionQuota, useSembakoTransactionQuota,
// useRPATransactionQuota. Update all four if the default ever changes.
export const FALLBACK_TRANSACTION_QUOTA = 30

// ─── RPA ─────────────────────────────────────────────────────────────────────
export const RPA_PLAN_CONFIG = {
  // sub_type: 'rpa' (Rumah Potong Ayam)
  vertical: 'rumah_potong',
  subType: 'rpa',
  accentColor: '#F59E0B',

  starter: {
    // Pages — full access (no gate)
    beranda: true,
    order: true,     // purchase orders to brokers, not limited
    hutang: true,    // supplier debt tracking, not limited

    // Distribusi — quota-limited
    distribusi: { allowed: true, quotaPerMonth: FALLBACK_TRANSACTION_QUOTA },
    distribusiPdf: false,  // InvoicePreviewModal auto-gates this

    // Laporan — blocked
    laporanMargin: false,
  },

  pro: {
    beranda: true,
    order: true,
    hutang: true,
    distribusi: { allowed: true, quotaPerMonth: null }, // unlimited
    distribusiPdf: true,
    laporanMargin: true,
  },

  business: {
    // Identical to Pro for RPA (no Business-exclusive features yet)
    beranda: true,
    order: true,
    hutang: true,
    distribusi: { allowed: true, quotaPerMonth: null },
    distribusiPdf: true,
    laporanMargin: true,
  },

  // AppSidebar planRequired entries — kept here for documentation
  sidebarGating: {
    laporan: 'pro',
  },

  // DB enforcement
  dbTrigger: {
    table: 'rpa_invoices',
    trigger: 'trg_rpa_invoice_quota',
    fn: 'enforce_rpa_invoice_quota',
    configKey: 'transaction_quota',
  },
}

// ─── RPH ─────────────────────────────────────────────────────────────────────
// TODO(RPH): Rumah Potong Hewan plan gating — not yet implemented.
//
// When RPH modules are built:
//  1. Define RPH_PLAN_CONFIG.starter/pro/business below (mirror RPA_PLAN_CONFIG shape)
//  2. Add planRequired fields to AppSidebar for RPH nav items
//  3. Add in-page upgrade walls to RPH pages
//  4. Create useRPHTransactionQuota if RPH has its own transaction table
//  5. Add DB trigger on the relevant RPH table (mirror 20260416_rpa_invoice_quota_trigger.sql)
//  6. Add RPH pricing row to pricing_plans table (role: 'rph')
//
// RPH sub_type check: profile?.sub_type?.startsWith('rph')
// RPH vertical: 'rumah_potong' (same as RPA, split by sub_type in AppSidebar)
export const RPH_PLAN_CONFIG = {
  vertical: 'rumah_potong',
  subType: 'rph',
  accentColor: '#F59E0B', // placeholder — may differ when RPH has its own identity

  starter: {
    // TODO(RPH): fill when RPH pages are implemented
  },
  pro: {
    // TODO(RPH): fill when RPH pages are implemented
  },
  business: {
    // TODO(RPH): fill when RPH pages are implemented
  },

  sidebarGating: {
    // TODO(RPH): add planRequired fields when RPH nav is built out
  },
}

// ─── Poultry Broker ───────────────────────────────────────────────────────────
// Documented here for cross-reference. Implementation lives in broker_ayam pages.
export const POULTRY_BROKER_PLAN_CONFIG = {
  vertical: 'poultry_broker',
  accentColor: '#021a02',

  starter: {
    transaksi: { allowed: true, quotaPerMonth: FALLBACK_TRANSACTION_QUOTA },
    tim: { allowed: false },           // invite blocked, owner-only
    armada: { allowed: true, vehicleLimit: 1, driverLimit: 1 },
    cashFlow: false,                   // planRequired: 'pro' in sidebar + in-page (export locked)
    simulator: false,                  // planRequired: 'pro' in sidebar + upgrade wall
  },
  pro: {
    transaksi: { allowed: true, quotaPerMonth: null },
    tim: { allowed: true, memberLimit: 3 },
    armada: { allowed: true, vehicleLimit: null, driverLimit: null },
    cashFlow: true,
    simulator: true,
  },
  business: {
    transaksi: { allowed: true, quotaPerMonth: null },
    tim: { allowed: true, memberLimit: null },
    armada: { allowed: true, vehicleLimit: null, driverLimit: null },
    cashFlow: true,                    // + PDF/Excel export (Business only)
    simulator: true,
  },
}

// ─── Sembako Broker ───────────────────────────────────────────────────────────
export const SEMBAKO_BROKER_PLAN_CONFIG = {
  vertical: 'sembako_broker',
  accentColor: '#EA580C',

  starter: {
    penjualan: { allowed: true, quotaPerMonth: FALLBACK_TRANSACTION_QUOTA },
    penjualanPdf: false,
    tim: { allowed: false },
    pegawai: false,                    // planRequired: 'pro'
    laporan: false,                    // planRequired: 'pro'
    multiGudang: false,                // planRequired: 'business'
  },
  pro: {
    penjualan: { allowed: true, quotaPerMonth: null },
    penjualanPdf: true,
    tim: { allowed: true, maxMembers: 3 },
    pegawai: true,
    laporan: true,
    multiGudang: false,                // planRequired: 'business'
  },
  business: {
    penjualan: { allowed: true, quotaPerMonth: null },
    penjualanPdf: true,
    tim: { allowed: true, maxMembers: null },  // unlimited
    pegawai: true,
    laporan: true,
    multiGudang: true,
  },
}

// ─── AI Plan Config ───────────────────────────────────────────────────────────
// Single source of truth for AI feature limits and feature flags.
// Read by useAIQuota — do NOT duplicate these numbers elsewhere.
export const AI_PLAN_CONFIG = {
  starter: {
    chat_sessions_per_month: 10,
    features: {
      chat_assistant:    true,
      drafting:          true,
      analisis_performa: false,
      prediksi_hasil:    false,
      ai_audit_logs:     false,
    },
  },
  pro: {
    chat_sessions_per_month: 500,
    features: {
      chat_assistant:    true,
      drafting:          true,
      analisis_performa: true,
      prediksi_hasil:    false,
      ai_audit_logs:     false,
    },
  },
  business: {
    chat_sessions_per_month: Infinity,
    features: {
      chat_assistant:    true,
      drafting:          true,
      analisis_performa: true,
      prediksi_hasil:    true,
      ai_audit_logs:     true,
    },
  },
}

export const PLAN_LABELS = {
  starter:  { name: 'Starter',  badge: null,    color: 'gray' },
  pro:      { name: 'Pro',      badge: 'PRO',   color: 'amber' },
  business: { name: 'Business', badge: 'BIZ',   color: 'emerald' },
}

export const UPGRADE_MESSAGES = {
  analisis_performa: 'Analisis performa tersedia di plan Pro. Pantau ADG dan FCR ternakmu secara otomatis.',
  prediksi_hasil:    'Prediksi waktu jual optimal tersedia di plan Business. Maksimalkan keuntungan tiap siklus.',
  ai_audit_logs:     'Riwayat aksi AI tersedia di plan Business. Audit semua pencatatan staf kapan saja.',
  chat_exceeded:     'Kuota AI bulan ini habis. Upgrade ke Pro untuk 500 sesi/bulan.',
}
