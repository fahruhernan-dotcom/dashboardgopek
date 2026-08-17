#!/usr/bin/env node

/**
 * ==============================================================================
 * SCRIPT: Production APK Release Publisher for Gopek / Sembako OS
 * ==============================================================================
 * 
 * Fitur:
 * 1. Mendeteksi file APK release terbaru dari direktori android/
 * 2. Membaca versi & build_number dari constants.js atau argumen CLI
 * 3. Mengunggah file APK ke Supabase Storage (bucket: 'apk-releases', file: 'app-latest.apk')
 * 4. Menyimpan record rilis ke tabel 'app_releases' (memicu trigger notifikasi otomatis)
 * 
 * Penggunaan:
 *   node scripts/publish-release.mjs
 *   node scripts/publish-release.mjs --version="v0.9.6" --build=20260519 --notes="Perbaikan fitur kasir"
 *   node scripts/publish-release.mjs --apk="./my-build.apk" --mandatory
 *   node scripts/publish-release.mjs --dry-run
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

// Helper format console
const log = {
  info: (msg) => console.log(`\x1b[36mℹ\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m✔\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m⚠\x1b[0m ${msg}`),
  error: (msg) => console.error(`\x1b[31m✖\x1b[0m ${msg}`),
  header: (msg) => console.log(`\n\x1b[1m\x1b[35m=== ${msg} ===\x1b[0m\n`),
}

// 1. Baca .env file sederhana
function loadEnv() {
  const envFiles = ['.env.local', '.env']
  for (const file of envFiles) {
    const fullPath = path.join(ROOT_DIR, file)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim()
          let val = trimmed.slice(eqIdx + 1).trim()
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1)
          }
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  }
}

// 2. Baca konstanta versi default dari constants.js
function getConstantsVersion() {
  try {
    const constantsPath = path.join(ROOT_DIR, 'src/dashboard/_shared/pages/akun_page/constants.js')
    if (fs.existsSync(constantsPath)) {
      const content = fs.readFileSync(constantsPath, 'utf8')
      const versionMatch = content.match(/export const APP_VERSION\s*=\s*['"]([^'"]+)['"]/)
      const buildMatch = content.match(/export const APP_BUILD_NUMBER\s*=\s*([0-9]+)/)
      return {
        version: versionMatch ? versionMatch[1] : 'v0.9.5',
        buildNumber: buildMatch ? parseInt(buildMatch[1], 10) : 20260518,
      }
    }
  } catch (err) {
    log.warn(`Gagal membaca constants.js: ${err.message}`)
  }
  return { version: 'v0.9.5', buildNumber: 20260518 }
}

// 3. Parse argumen CLI
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--version=')) options.version = arg.split('=')[1]
    else if (arg === '--version' && args[i + 1]) options.version = args[++i]
    else if (arg.startsWith('--build=')) options.buildNumber = parseInt(arg.split('=')[1], 10)
    else if (arg === '--build' && args[i + 1]) options.buildNumber = parseInt(args[++i], 10)
    else if (arg.startsWith('--notes=')) options.notes = arg.split('=')[1]
    else if (arg === '--notes' && args[i + 1]) options.notes = args[++i]
    else if (arg.startsWith('--apk=')) options.apkPath = arg.split('=')[1]
    else if (arg === '--apk' && args[i + 1]) options.apkPath = args[++i]
    else if (arg.startsWith('--notes-file=')) {
      const p = path.resolve(ROOT_DIR, arg.split('=')[1])
      if (fs.existsSync(p)) options.notes = fs.readFileSync(p, 'utf8')
    }
    else if (arg === '--mandatory') options.isMandatory = true
    else if (arg === '--dry-run') options.dryRun = true
    else if (arg.startsWith('--min-build=')) options.minSupportedBuild = parseInt(arg.split('=')[1], 10)
    else if (arg === '--help' || arg === '-h') {
      console.log(`
Penggunaan:
  node scripts/publish-release.mjs [opsi]

Opsi:
  --version <string>       Versi rilis (contoh: v0.9.6)
  --build <number>         Build number integer (contoh: 20260519)
  --notes <string>         Catatan rilis / changelog
  --notes-file <path>      Path file markdown berisi catatan rilis
  --apk <path>             Path spesifik file .apk yang ingin diunggah
  --mandatory              Tandai sebagai update wajib (forced update)
  --min-build <number>     Minimum build number yang masih didukung
  --dry-run                Simulasikan alur tanpa upload ke database/storage
  --help, -h               Tampilkan bantuan ini
      `)
      process.exit(0)
    }
  }
  return options
}

// 4. Cari file APK secara otomatis
function findApkFile(customPath) {
  if (customPath) {
    const resolved = path.resolve(ROOT_DIR, customPath)
    if (fs.existsSync(resolved)) return resolved
    throw new Error(`File APK di path '${customPath}' tidak ditemukan!`)
  }

  const candidatePaths = [
    path.join(ROOT_DIR, 'android/app/build/outputs/apk/release/app-release.apk'),
    path.join(ROOT_DIR, 'android/app/build/outputs/apk/release/app-release-unsigned.apk'),
    path.join(ROOT_DIR, 'android/app/build/outputs/apk/release/app-release-aligned.apk'),
    path.join(ROOT_DIR, 'android/app/build/outputs/apk/debug/app-debug.apk'),
    path.join(ROOT_DIR, 'app-latest.apk'),
    path.join(ROOT_DIR, 'app-release.apk'),
  ]

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p
  }

  return null
}

async function main() {
  const startTime = Date.now()
  log.header('🚀 Gopek Release Automation Publisher')

  loadEnv()
  const cliArgs = parseArgs()
  const defaults = getConstantsVersion()

  const version = cliArgs.version || defaults.version
  const buildNumber = cliArgs.buildNumber || defaults.buildNumber
  const isMandatory = Boolean(cliArgs.isMandatory)
  const minSupportedBuild = cliArgs.minSupportedBuild || 0
  const isDryRun = Boolean(cliArgs.dryRun)

  const defaultNotes = [
    '• Peningkatan performa aplikasi dan kestabilan sistem',
    '• Perbaikan sistem sinkronisasi nota & kasir',
    '• Optimasi kecepatan loading data dan notifikasi',
  ].join('\n')

  const releaseNotes = cliArgs.notes || defaultNotes

  log.info(`Target Versi     : \x1b[1m${version}\x1b[0m`)
  log.info(`Build Number     : \x1b[1m${buildNumber}\x1b[0m`)
  log.info(`Wajib Update     : ${isMandatory ? '\x1b[31mYA (Mandatory)\x1b[0m' : 'TIDAK (Opsional)'}`)

  // 1. Lokasi file APK
  const apkPath = findApkFile(cliArgs.apkPath)
  if (!apkPath) {
    log.error('File APK tidak ditemukan!')
    log.info('Pastikan Anda sudah mengompilasi APK Android terlebih dahulu:')
    console.log('  cd android && ./gradlew assembleRelease\n')
    process.exit(1)
  }

  const fileStats = fs.statSync(apkPath)
  const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2)
  log.success(`File APK ditemukan: ${path.relative(ROOT_DIR, apkPath)} (${fileSizeMB} MB)`)

  // 2. Setup Supabase Client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kqbxzokrpcwuxrfjshuf.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY

  // === DEBUG: Tampilkan info env tanpa mengekspos nilai secret ===
  console.log('\n🔍 === DEBUG ENV INFO ===')
  console.log(`  VITE_SUPABASE_URL        : ${supabaseUrl}`)
  console.log(`  SUPABASE_SERVICE_ROLE_KEY : ${process.env.SUPABASE_SERVICE_ROLE_KEY ? `SET (${process.env.SUPABASE_SERVICE_ROLE_KEY.length} chars, starts: ${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...)` : '❌ NOT SET'}`)
  console.log(`  VITE_SUPABASE_SERVICE_ROLE_KEY : ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? `SET (${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY.length} chars)` : '❌ NOT SET'}`)
  console.log(`  VITE_SUPABASE_ANON_KEY   : ${process.env.VITE_SUPABASE_ANON_KEY ? `SET (${process.env.VITE_SUPABASE_ANON_KEY.length} chars, starts: ${process.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...)` : '❌ NOT SET'}`)
  
  // Decode JWT payload to check role
  try {
    const payload = JSON.parse(Buffer.from(supabaseKey.split('.')[1], 'base64').toString())
    console.log(`  🔑 Key Role (JWT)        : ${payload.role}`)
    if (payload.role === 'anon') {
      console.log('  ⚠️  WARNING: Menggunakan ANON key! Upload akan GAGAL karena RLS!')
      console.log('  ℹ️  Pastikan SUPABASE_SERVICE_ROLE_KEY di GitHub Secrets berisi service_role key, BUKAN anon key!')
    } else if (payload.role === 'service_role') {
      console.log('  ✅ Menggunakan SERVICE_ROLE key - RLS akan di-bypass')
    }
  } catch (e) {
    console.log(`  ⚠️  Gagal decode JWT: ${e.message}`)
  }
  console.log('========================\n')

  if (!supabaseKey) {
    log.error('SUPABASE_SERVICE_ROLE_KEY atau VITE_SUPABASE_ANON_KEY tidak ditemukan di environment!')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  if (isDryRun) {
    log.warn('MODE DRY-RUN: Melewati proses upload ke Supabase Storage dan Database.')
    log.success(`Simulasi rilis ${version} (${buildNumber}) selesai dalam ${Date.now() - startTime}ms.`)
    return
  }

  // 3. Upload APK ke Storage Bucket 'apk-releases'
  log.info(`Mengunggah APK ke Supabase Storage (bucket: 'apk-releases')...`)
  const fileBuffer = fs.readFileSync(apkPath)
  const targetFileName = 'app-latest.apk'

  const { error: uploadError } = await supabase.storage
    .from('apk-releases')
    .upload(targetFileName, fileBuffer, {
      contentType: 'application/vnd.android.package-archive',
      upsert: true,
    })

  if (uploadError) {
    log.error(`Gagal mengunggah file APK ke Storage: ${uploadError.message}`)
    log.error(`Detail error: ${JSON.stringify(uploadError)}`)
    process.exit(1)
  }

  const publicDownloadUrl = `${supabaseUrl}/storage/v1/object/public/apk-releases/${targetFileName}`
  log.success(`APK berhasil diunggah ke Storage!`)
  log.info(`Public Download URL: ${publicDownloadUrl}`)

  // Opsi: Upload juga salinan versi (e.g. app-v0.9.6.apk) untuk arsip rilis
  const versionedFileName = `app-${version}.apk`
  await supabase.storage
    .from('apk-releases')
    .upload(versionedFileName, fileBuffer, {
      contentType: 'application/vnd.android.package-archive',
      upsert: true,
    })
    .catch(() => null)

  // 4. Masukkan baris baru ke tabel public.app_releases
  log.info(`Mencatat rilis baru ke tabel 'public.app_releases'...`)
  const { data: releaseRecord, error: dbError } = await supabase
    .from('app_releases')
    .insert({
      version,
      build_number: buildNumber,
      release_notes: releaseNotes,
      apk_download_url: publicDownloadUrl,
      is_mandatory: isMandatory,
      min_supported_build: minSupportedBuild,
    })
    .select()
    .single()

  if (dbError) {
    log.error(`Gagal mencatat rilis di database: ${dbError.message}`)
    process.exit(1)
  }

  log.success(`Record rilis berhasil disimpan di database! (ID: ${releaseRecord?.id || 'OK'})`)
  log.success(`Trigger otomatis 'tr_notify_on_new_app_release' telah menyiarkan notifikasi ke semua user! 🔔`)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`\n\x1b[32m🎉 RILIS BERHASIL DIPUBLIKASIKAN DALAM ${elapsed} DETIK!\x1b[0m\n`)
}

main().catch((err) => {
  log.error(`Terjadi kesalahan tak terduga: ${err.message}`)
  console.error(err)
  process.exit(1)
})
