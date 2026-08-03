/**
 * TernakOS — LIVESTOCK TASK REGISTRY
 * Central configuration for task types, report forms, and default templates per livestock type.
 *
 * This is the SINGLE SOURCE OF TRUTH for the universal DailyTask, TaskSettings, and TaskAssign components.
 * To add a new livestock type, simply add a new entry here + create a template file.
 */

import {
  Utensils, Scale, Syringe, Trash2, Activity,
  ClipboardList, Heart, Thermometer, Droplets,
  Eye, Scissors
} from 'lucide-react'

// ── Template imports ──────────────────────────────────────────────────────────
import { TEMPLATE_150_HARI, TEMPLATE_180_HARI } from '../sapiTaskTemplates'
import { TEMPLATE_BROILER_35 } from './broilerTaskTemplates'
import { TEMPLATE_KAMBING_PENGGEMUKAN_90, TEMPLATE_KAMBING_BREEDING } from './kambingTaskTemplates'
import { TEMPLATE_DOMBA_PENGGEMUKAN_90, TEMPLATE_DOMBA_BREEDING } from './dombaTaskTemplates'
import { TEMPLATE_SAPI_PERAH_HARIAN } from './sapiPerahTaskTemplates'

// ── Shared task type definitions ──────────────────────────────────────────────

const COMMON_TYPES = {
  pakan:             { label: 'Pakan',       icon: Utensils,     color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5',   shadow: 'shadow-orange-500/10' },
  pemberian_pakan:   { label: 'Pakan',       icon: Utensils,     color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5',   shadow: 'shadow-orange-500/10' },
  timbang:           { label: 'Timbang',     icon: Scale,        color: 'text-blue-400',   border: 'border-blue-500/20',   bg: 'bg-blue-500/5',     shadow: 'shadow-blue-500/10' },
  vaksinasi:         { label: 'Vaksin',      icon: Syringe,      color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5',   shadow: 'shadow-purple-500/10' },
  obat_cacing:       { label: 'Deworming',   icon: Activity,     color: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'bg-indigo-500/5',   shadow: 'shadow-indigo-500/10' },
  kebersihan_kandang:{ label: 'Kebersihan',  icon: Trash2,       color: 'text-emerald-400',border: 'border-emerald-500/20',bg: 'bg-emerald-500/5',  shadow: 'shadow-emerald-500/10' },
  kebersihan:        { label: 'Kebersihan',  icon: Trash2,       color: 'text-emerald-400',border: 'border-emerald-500/20',bg: 'bg-emerald-500/5',  shadow: 'shadow-emerald-500/10' },
  kesehatan:         { label: 'Kesehatan',   icon: Activity,     color: 'text-rose-400',   border: 'border-rose-500/20',   bg: 'bg-rose-500/5',     shadow: 'shadow-rose-500/10' },
  ceklis_kesehatan:  { label: 'Kesehatan',   icon: Activity,     color: 'text-rose-400',   border: 'border-rose-500/20',   bg: 'bg-rose-500/5',     shadow: 'shadow-rose-500/10' },
  reproduksi:        { label: 'Reproduksi',  icon: Heart,        color: 'text-pink-400',   border: 'border-pink-500/20',   bg: 'bg-pink-500/5',     shadow: 'shadow-pink-400/10' },
  lainnya:           { label: 'Lainnya',     icon: ClipboardList,color: 'text-slate-400',  border: 'border-white/10',      bg: 'bg-white/5',        shadow: 'shadow-white/5' },
}

// Broiler-specific types
const BROILER_TYPES = {
  ...COMMON_TYPES,
  recording_harian:  { label: 'Recording',   icon: ClipboardList,color: 'text-cyan-400',   border: 'border-cyan-500/20',   bg: 'bg-cyan-500/5',     shadow: 'shadow-cyan-500/10' },
  brooding_check:    { label: 'Brooding',    icon: Thermometer,  color: 'text-amber-400',  border: 'border-amber-500/20',  bg: 'bg-amber-500/5',    shadow: 'shadow-amber-500/10' },
}

// Ruminant-specific types (kambing, domba, sapi)
const RUMINANT_TYPES = {
  ...COMMON_TYPES,
  bcs_check:         { label: 'BCS',         icon: Eye,          color: 'text-cyan-400',   border: 'border-cyan-500/20',   bg: 'bg-cyan-500/5',     shadow: 'shadow-cyan-500/10' },
}

// Domba-specific (includes wool)
const DOMBA_TYPES = {
  ...RUMINANT_TYPES,
  wool_check:        { label: 'Cek Bulu',    icon: Scissors,     color: 'text-amber-400',  border: 'border-amber-500/20',  bg: 'bg-amber-500/5',    shadow: 'shadow-amber-500/10' },
}

// Sapi perah-specific
const SAPI_PERAH_TYPES = {
  ...RUMINANT_TYPES,
  perah_susu:        { label: 'Perah',       icon: Droplets,     color: 'text-sky-400',    border: 'border-sky-500/20',    bg: 'bg-sky-500/5',      shadow: 'shadow-sky-500/10' },
  cmt_check:         { label: 'CMT',         icon: Activity,     color: 'text-amber-400',  border: 'border-amber-500/20',  bg: 'bg-amber-500/5',    shadow: 'shadow-amber-500/10' },
}

// ── Container presets for auto-calculation ────────────────────────────────────
// Density references: Hijauan segar ~80-150 kg/m³, Konsentrat ~500-600 kg/m³

export const CONTAINER_PRESETS = [
  { label: 'Ember Kecil (5L)',    hijauan: 0.8,  konsentrat: 2.5  },
  { label: 'Ember Sedang (15L)',  hijauan: 2.0,  konsentrat: 7.5  },
  { label: 'Ember Besar (25L)',   hijauan: 3.5,  konsentrat: 12.5 },
  { label: 'Tong Kecil (50L)',    hijauan: 7.0,  konsentrat: 28   },
  { label: 'Tong Besar (200L)',   hijauan: 25,   konsentrat: 110  },
  { label: 'Gerobak Sorong',      hijauan: 40,   konsentrat: 80   },
  { label: 'Karung (25KG)',       hijauan: 15,   konsentrat: 25   },
  { label: 'Karung (50KG)',       hijauan: 25,   konsentrat: 50   },
]

// ── Shared report field definitions ───────────────────────────────────────────

const COMMON_REPORT = {
  pakan: {
    fields: [
      { id: '_wadah_hijauan', label: 'Hitung dari Wadah (Hijauan)', type: 'container_calc', feedType: 'hijauan',    targetKgField: 'hijauan_kg' },
      { id: 'hijauan_kg',    label: 'Hijauan (KG)',    type: 'number',         suffix: 'KG', placeholder: '0.0' },
      { id: '_wadah_konsentrat', label: 'Hitung dari Wadah (Konsentrat)', type: 'container_calc', feedType: 'konsentrat', targetKgField: 'konsentrat_kg' },
      { id: 'konsentrat_kg', label: 'Konsentrat (KG)', type: 'number',         suffix: 'KG', placeholder: '0.0' },
    ]
  },
  pemberian_pakan: {
    fields: [
      { id: '_wadah_hijauan', label: 'Hitung dari Wadah (Hijauan)', type: 'container_calc', feedType: 'hijauan',    targetKgField: 'hijauan_kg' },
      { id: 'hijauan_kg',    label: 'Hijauan (KG)',    type: 'number',         suffix: 'KG', placeholder: '0.0' },
      { id: '_wadah_konsentrat', label: 'Hitung dari Wadah (Konsentrat)', type: 'container_calc', feedType: 'konsentrat', targetKgField: 'konsentrat_kg' },
      { id: 'konsentrat_kg', label: 'Konsentrat (KG)', type: 'number',         suffix: 'KG', placeholder: '0.0' },
    ]
  },
  vaksinasi: {
    fields: [
      { id: 'vaccine_name', label: 'Nama Vaksin (Batch)', type: 'text', placeholder: 'Contoh: Anthrax B-12', required: true },
      { id: 'dosage_ml', label: 'Dosis (ml)', type: 'number', placeholder: '0.0', suffix: 'ML' }
    ]
  },
  kebersihan: {
    fields: [
      { id: 'areas', label: 'Area Terverifikasi', type: 'multi-checkbox', options: ['Lantai Kandang', 'Tempat Makan', 'Tempat Minum', 'Drainase'], required: true },
      { id: 'condition', label: 'Kondisi Akhir', type: 'select', options: ['Sangat Bersih', 'Bersih', 'Cukup'], required: true }
    ]
  },
  kebersihan_kandang: {
    fields: [
      { id: 'areas', label: 'Area Terverifikasi', type: 'multi-checkbox', options: ['Lantai Kandang', 'Tempat Makan', 'Tempat Minum', 'Drainase'], required: true },
      { id: 'condition', label: 'Kondisi Akhir', type: 'select', options: ['Sangat Bersih', 'Bersih', 'Cukup'], required: true }
    ]
  },
  kesehatan: {
    fields: [
      { id: 'temp', label: 'Suhu Tubuh (°C)', type: 'number', placeholder: '38.5', suffix: '°C' },
      { id: 'symptoms', label: 'Gejala Terpantau', type: 'multi-checkbox', options: ['Nafsu Makan Turun', 'Lemas', 'Batuk', 'Diare', 'Normal'], required: true }
    ]
  },
  ceklis_kesehatan: {
    fields: [
      { id: 'temp', label: 'Suhu Tubuh (°C)', type: 'number', placeholder: '38.5', suffix: '°C' },
      { id: 'symptoms', label: 'Gejala Terpantau', type: 'multi-checkbox', options: ['Nafsu Makan Turun', 'Lemas', 'Batuk', 'Diare', 'Normal'], required: true }
    ]
  },
  reproduksi: {
    fields: [
      { id: 'status', label: 'Status', type: 'select', options: ['Normal', 'Birahi', 'Kawin', 'IB', 'Bunting', 'Post-Partus'], required: true },
      { id: 'notes', label: 'Catatan', type: 'text', placeholder: 'Keterangan tambahan...' }
    ]
  },
}

// Broiler-specific reports
const BROILER_REPORT = {
  ...COMMON_REPORT,
  pakan: {
    fields: [
      { id: 'pakan_kg', label: 'Pakan Terpakai (KG)', type: 'number', placeholder: '0', suffix: 'KG', required: true },
      { id: 'feed_type', label: 'Jenis Pakan', type: 'select', options: ['Starter (Crumble)', 'Grower (Pellet)', 'Finisher (Pellet)'], placeholder: 'Pilih jenis...' }
    ]
  },
  recording_harian: {
    fields: [
      { id: 'mortalitas_ekor', label: 'Mortalitas (ekor)', type: 'number', placeholder: '0', suffix: 'ekor', required: true },
      { id: 'culling_ekor', label: 'Culling (ekor)', type: 'number', placeholder: '0', suffix: 'ekor' },
      { id: 'pakan_kg', label: 'Pakan Terpakai (KG)', type: 'number', placeholder: '0', suffix: 'KG', required: true },
    ]
  },
  brooding_check: {
    fields: [
      { id: 'suhu_brooder_c', label: 'Suhu Brooder (°C)', type: 'number', placeholder: '33', suffix: '°C', required: true },
      { id: 'kelembaban_pct', label: 'Kelembaban (%)', type: 'number', placeholder: '65', suffix: '%' },
      { id: 'kondisi_chick', label: 'Perilaku DOC', type: 'select', options: ['Menyebar Merata', 'Mengumpul Tengah', 'Menjauh Lampu', 'Tidak Aktif'], required: true },
    ]
  },
  timbang: {
    fields: [
      { id: 'sample_bobot_gram', label: 'Bobot Sampel Rata-rata (gram)', type: 'number', placeholder: '0', suffix: 'gram', required: true },
      { id: 'sample_count', label: 'Jumlah Sampel', type: 'number', placeholder: '10', suffix: 'ekor' },
    ]
  },
}

// Kambing report
const KAMBING_REPORT = {
  ...COMMON_REPORT,
  bcs_check: {
    fields: [
      { id: 'bcs_score', label: 'Body Condition Score', type: 'select', options: ['1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0'], required: true },
      { id: 'notes', label: 'Catatan', type: 'text', placeholder: 'Keterangan kondisi...' }
    ]
  },
  timbang: {
    fields: [
      { id: 'weight_kg', label: 'Berat (KG)', type: 'number', placeholder: '0.0', suffix: 'KG', required: true },
      { id: 'lingkar_dada_cm', label: 'Lingkar Dada (CM)', type: 'number', placeholder: '0', suffix: 'CM' },
    ]
  },
  reproduksi: {
    fields: [
      { id: 'status', label: 'Status Reproduksi', type: 'select', options: ['Normal', 'Birahi', 'Kawin Alam', 'IB', 'Bunting', 'Post-Partus'], required: true },
      { id: 'jumlah_anak', label: 'Jumlah Anak Lahir', type: 'number', placeholder: '0', suffix: 'ekor' },
      { id: 'tipe_kelahiran', label: 'Tipe Kelahiran', type: 'select', options: ['Single', 'Kembar 2', 'Kembar 3+'] },
    ]
  },
}

// Domba report (extends kambing + adds wool)
const DOMBA_REPORT = {
  ...KAMBING_REPORT,
  wool_check: {
    fields: [
      { id: 'kondisi_bulu', label: 'Kondisi Bulu', type: 'select', options: ['Bersih & Tebal', 'Normal', 'Tipis/Rontok', 'Ada Kutu/Tungau', 'Ringworm'], required: true },
      { id: 'perlu_cukur', label: 'Perlu Cukur?', type: 'select', options: ['Tidak', 'Ya - Sebagian', 'Ya - Seluruh'] },
    ]
  },
}

// Sapi perah report
const SAPI_PERAH_REPORT = {
  ...COMMON_REPORT,
  perah_susu: {
    fields: [
      { id: 'produksi_liter', label: 'Produksi Susu (Liter)', type: 'number', placeholder: '0.0', suffix: 'L', required: true },
      { id: 'kualitas', label: 'Kualitas Visual', type: 'select', options: ['Normal', 'Berbuih', 'Encer', 'Ada Gumpalan'] },
    ]
  },
  cmt_check: {
    fields: [
      { id: 'hasil_cmt_kiri_depan', label: 'Kiri Depan', type: 'select', options: ['Negatif', 'Trace', '+', '++', '+++'], required: true },
      { id: 'hasil_cmt_kanan_depan', label: 'Kanan Depan', type: 'select', options: ['Negatif', 'Trace', '+', '++', '+++'], required: true },
      { id: 'hasil_cmt_kiri_belakang', label: 'Kiri Belakang', type: 'select', options: ['Negatif', 'Trace', '+', '++', '+++'], required: true },
      { id: 'hasil_cmt_kanan_belakang', label: 'Kanan Belakang', type: 'select', options: ['Negatif', 'Trace', '+', '++', '+++'], required: true },
    ]
  },
  bcs_check: {
    fields: [
      { id: 'bcs_score', label: 'Body Condition Score', type: 'select', options: ['1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0'], required: true },
      { id: 'notes', label: 'Catatan', type: 'text', placeholder: 'Keterangan kondisi...' }
    ]
  },
  timbang: {
    fields: [
      { id: 'produksi_total_liter', label: 'Total Produksi Bulan Ini (Liter)', type: 'number', placeholder: '0', suffix: 'L', required: true },
    ]
  },
}

// Sapi potong report (same as existing)
const SAPI_POTONG_REPORT = {
  ...COMMON_REPORT,
  timbang: {
    fields: [
      { id: 'weight_kg', label: 'Berat (KG)', type: 'number', placeholder: '0.0', suffix: 'KG', required: true },
      { id: 'lingkar_dada_cm', label: 'Lingkar Dada (CM)', type: 'number', placeholder: '0', suffix: 'CM' },
    ]
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// ██ LIVESTOCK TASK REGISTRY
// ══════════════════════════════════════════════════════════════════════════════

export const LIVESTOCK_TASK_REGISTRY = {

  // ── SAPI ────────────────────────────────────────────────────────────────────

  sapi_penggemukan: {
    label: 'Sapi Potong Penggemukan',
    emoji: '🐄',
    animalLabel: 'Sapi',
    animalLabelPlural: 'Sapi',
    usesIndividualAnimals: true,     // Sapi pakai eartag individual
    usesWeighingForm: true,          // Ada form timbang berat
    taskTypeCfg: { ...COMMON_TYPES },
    reportConfig: { ...SAPI_POTONG_REPORT },
    defaultTemplates: {
      '150 Hari (Intensif)': TEMPLATE_150_HARI,
      '180 Hari (Semi-Intensif)': TEMPLATE_180_HARI,
    },
  },

  sapi_breeding: {
    label: 'Sapi Potong Breeding',
    emoji: '🐂',
    animalLabel: 'Sapi',
    animalLabelPlural: 'Sapi',
    usesIndividualAnimals: true,
    usesWeighingForm: true,
    taskTypeCfg: { ...COMMON_TYPES },
    reportConfig: { ...SAPI_POTONG_REPORT },
    defaultTemplates: {
      '150 Hari (Intensif)': TEMPLATE_150_HARI,
      '180 Hari (Semi-Intensif)': TEMPLATE_180_HARI,
    },
  },

  sapi_perah: {
    label: 'Sapi Perah',
    emoji: '🥛',
    animalLabel: 'Sapi',
    animalLabelPlural: 'Sapi',
    usesIndividualAnimals: true,
    usesWeighingForm: false,
    taskTypeCfg: { ...SAPI_PERAH_TYPES },
    reportConfig: { ...SAPI_PERAH_REPORT },
    defaultTemplates: {
      'Siklus Harian Laktasi': TEMPLATE_SAPI_PERAH_HARIAN,
    },
  },

  // ── AYAM ────────────────────────────────────────────────────────────────────

  broiler: {
    label: 'Ayam Broiler',
    emoji: '🐔',
    animalLabel: 'Ayam',
    animalLabelPlural: 'Ayam',
    usesIndividualAnimals: false,    // Ayam tidak pakai eartag individual
    usesWeighingForm: false,         // Pakai sampel bobot, bukan per-ekor
    taskTypeCfg: { ...BROILER_TYPES },
    reportConfig: { ...BROILER_REPORT },
    defaultTemplates: {
      '35 Hari (Standar)': TEMPLATE_BROILER_35,
    },
  },

  layer: {
    label: 'Ayam Petelur',
    emoji: '🥚',
    animalLabel: 'Ayam',
    animalLabelPlural: 'Ayam',
    usesIndividualAnimals: false,
    usesWeighingForm: false,
    taskTypeCfg: { ...BROILER_TYPES },
    reportConfig: { ...BROILER_REPORT },
    defaultTemplates: {},  // Coming soon
  },

  // ── KAMBING ─────────────────────────────────────────────────────────────────

  kambing_penggemukan: {
    label: 'Kambing Penggemukan',
    emoji: '🐐',
    animalLabel: 'Kambing',
    animalLabelPlural: 'Kambing',
    usesIndividualAnimals: true,
    usesWeighingForm: true,
    taskTypeCfg: { ...RUMINANT_TYPES },
    reportConfig: { ...KAMBING_REPORT },
    defaultTemplates: {
      '90 Hari (Standar)': TEMPLATE_KAMBING_PENGGEMUKAN_90,
    },
  },

  kambing_breeding: {
    label: 'Kambing Breeding',
    emoji: '🐐',
    animalLabel: 'Kambing',
    animalLabelPlural: 'Kambing',
    usesIndividualAnimals: true,
    usesWeighingForm: true,
    taskTypeCfg: { ...RUMINANT_TYPES },
    reportConfig: { ...KAMBING_REPORT },
    defaultTemplates: {
      'Siklus Breeding': TEMPLATE_KAMBING_BREEDING,
    },
  },

  // ── DOMBA ───────────────────────────────────────────────────────────────────

  domba_penggemukan: {
    label: 'Domba Penggemukan',
    emoji: '🐑',
    animalLabel: 'Domba',
    animalLabelPlural: 'Domba',
    usesIndividualAnimals: true,
    usesWeighingForm: true,
    taskTypeCfg: { ...DOMBA_TYPES },
    reportConfig: { ...DOMBA_REPORT },
    defaultTemplates: {
      '90 Hari (Standar)': TEMPLATE_DOMBA_PENGGEMUKAN_90,
    },
  },

  domba_breeding: {
    label: 'Domba Breeding',
    emoji: '🐑',
    animalLabel: 'Domba',
    animalLabelPlural: 'Domba',
    usesIndividualAnimals: true,
    usesWeighingForm: true,
    taskTypeCfg: { ...DOMBA_TYPES },
    reportConfig: { ...DOMBA_REPORT },
    defaultTemplates: {
      'Siklus Breeding': TEMPLATE_DOMBA_BREEDING,
    },
  },

  // ── BEBEK (Coming Soon) ─────────────────────────────────────────────────────

  bebek_pedaging: {
    label: 'Bebek Pedaging',
    emoji: '🦆',
    animalLabel: 'Bebek',
    animalLabelPlural: 'Bebek',
    usesIndividualAnimals: false,
    usesWeighingForm: false,
    taskTypeCfg: { ...BROILER_TYPES },
    reportConfig: { ...BROILER_REPORT },
    defaultTemplates: {},
  },

  bebek_layer: {
    label: 'Bebek Petelur',
    emoji: '🥚',
    animalLabel: 'Bebek',
    animalLabelPlural: 'Bebek',
    usesIndividualAnimals: false,
    usesWeighingForm: false,
    taskTypeCfg: { ...BROILER_TYPES },
    reportConfig: { ...BROILER_REPORT },
    defaultTemplates: {},
  },

  // ── BABI (Coming Soon) ──────────────────────────────────────────────────────

  babi_penggemukan: {
    label: 'Babi Penggemukan',
    emoji: '🐷',
    animalLabel: 'Babi',
    animalLabelPlural: 'Babi',
    usesIndividualAnimals: true,
    usesWeighingForm: true,
    taskTypeCfg: { ...RUMINANT_TYPES },
    reportConfig: { ...KAMBING_REPORT },
    defaultTemplates: {},
  },

  babi_breeding: {
    label: 'Babi Breeding',
    emoji: '🐖',
    animalLabel: 'Babi',
    animalLabelPlural: 'Babi',
    usesIndividualAnimals: true,
    usesWeighingForm: true,
    taskTypeCfg: { ...RUMINANT_TYPES },
    reportConfig: { ...KAMBING_REPORT },
    defaultTemplates: {},
  },
}

// ── HELPER: sub_type → livestockType key ──────────────────────────────────────

const SUB_TYPE_MAP = {
  'peternak_sapi_penggemukan':          'sapi_penggemukan',
  'peternak_sapi_breeding':             'sapi_breeding',
  'peternak_sapi_perah':                'sapi_perah',
  'peternak_broiler':                   'broiler',
  'peternak_layer':                     'layer',
  'peternak_kambing_penggemukan':       'kambing_penggemukan',
  'peternak_kambing_breeding':          'kambing_breeding',
  'peternak_domba_penggemukan':         'domba_penggemukan',
  'peternak_domba_breeding':            'domba_breeding',
  'peternak_bebek_pedaging':            'bebek_pedaging',
  'peternak_bebek_layer':               'bebek_layer',
  'peternak_babi_penggemukan':          'babi_penggemukan',
  'peternak_babi_breeding':             'babi_breeding',
  // Legacy aliases (pre-split)
  'peternak_kambing_domba_penggemukan': 'kambing_penggemukan',
  'peternak_kambing_domba_breeding':    'kambing_breeding',
  'peternak':                           'broiler',  // old broiler vertical name
}

/**
 * Convert a sub_type (from DB/URL) to a livestockType key.
 * Example: 'peternak_sapi_penggemukan' → 'sapi_penggemukan'
 */
export function getLivestockTypeFromSubType(subType) {
  return SUB_TYPE_MAP[subType] || 'sapi_penggemukan'
}

/**
 * Get the full config for a livestock type.
 * @param {string} livestockType - Key from LIVESTOCK_TASK_REGISTRY
 * @returns {object} Config object
 */
export function getLivestockConfig(livestockType) {
  return LIVESTOCK_TASK_REGISTRY[livestockType] || LIVESTOCK_TASK_REGISTRY.sapi_penggemukan
}

/**
 * Get all available livestock type keys (for admin/selection UI).
 * @param {boolean} includeComingSoon - Include types with no templates
 */
export function getAvailableLivestockTypes(includeComingSoon = false) {
  return Object.entries(LIVESTOCK_TASK_REGISTRY)
    .filter(([_, cfg]) => includeComingSoon || Object.keys(cfg.defaultTemplates).length > 0)
    .map(([key, cfg]) => ({ key, label: cfg.label, emoji: cfg.emoji }))
}
