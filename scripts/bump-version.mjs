#!/usr/bin/env node

/**
 * ==============================================================================
 * SCRIPT: Automated Version & Build Number Bumper for GPK / Sembako OS
 * ==============================================================================
 * 
 * Mengupdate versi dan build number secara sinkron di:
 * 1. src/dashboard/_shared/pages/akun_page/constants.js (APP_VERSION, APP_BUILD_NUMBER, APP_VERSION_LABEL)
 * 2. package.json (version)
 * 3. android/app/build.gradle (versionCode, versionName)
 * 4. README.md (Badge version)
 * 
 * Penggunaan:
 *   npm run bump               -> Auto bump build number (hari ini) & patch version
 *   npm run bump patch         -> v0.9.5 -> v0.9.6 (build number hari ini)
 *   npm run bump minor         -> v0.9.5 -> v0.10.0 (build number hari ini)
 *   npm run bump major         -> v0.9.5 -> v1.0.0 (build number hari ini)
 *   npm run bump v1.0.0 20260817 -> Custom version & build number
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

const log = {
  info: (msg) => console.log(`\x1b[36mℹ\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m✔\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m⚠\x1b[0m ${msg}`),
  header: (msg) => console.log(`\n\x1b[1m\x1b[35m=== ${msg} ===\x1b[0m\n`),
}

// 1. Generate Build Number dari Tanggal Hari Ini (YYYYMMDD)
function generateBuildNumber() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return parseInt(`${year}${month}${day}`, 10)
}

// 2. Baca versi saat ini dari constants.js
function getCurrentVersion() {
  const constantsPath = path.join(ROOT_DIR, 'src/dashboard/_shared/pages/akun_page/constants.js')
  if (!fs.existsSync(constantsPath)) {
    return { version: 'v0.9.5', buildNumber: generateBuildNumber() }
  }

  const content = fs.readFileSync(constantsPath, 'utf8')
  const versionMatch = content.match(/export const APP_VERSION\s*=\s*['"]([^'"]+)['"]/)
  const buildMatch = content.match(/export const APP_BUILD_NUMBER\s*=\s*([0-9]+)/)

  return {
    version: versionMatch ? versionMatch[1] : 'v0.9.5',
    buildNumber: buildMatch ? parseInt(buildMatch[1], 10) : generateBuildNumber(),
  }
}

// 3. Parse semver increment
function incrementVersion(currentVer, type = 'patch') {
  const clean = currentVer.replace(/^v/, '')
  const parts = clean.split('.').map((p) => parseInt(p, 10) || 0)
  while (parts.length < 3) parts.push(0)

  if (type === 'major') {
    parts[0] += 1
    parts[1] = 0
    parts[2] = 0
  } else if (type === 'minor') {
    parts[1] += 1
    parts[2] = 0
  } else {
    // patch / default
    parts[2] += 1
  }

  return `v${parts.join('.')}`
}

function main() {
  log.header('🚀 GPK Version Bumper')

  const current = getCurrentVersion()
  log.info(`Versi saat ini     : ${current.version} (Build: ${current.buildNumber})`)

  const args = process.argv.slice(2)
  let targetVersion = ''
  let targetBuild = generateBuildNumber()

  if (args.length > 0) {
    const firstArg = args[0].toLowerCase()
    if (['patch', 'minor', 'major'].includes(firstArg)) {
      targetVersion = incrementVersion(current.version, firstArg)
    } else if (firstArg.startsWith('v') || /^[0-9]+\.[0-9]+/.test(firstArg)) {
      targetVersion = firstArg.startsWith('v') ? firstArg : `v${firstArg}`
    } else {
      targetVersion = incrementVersion(current.version, 'patch')
    }

    if (args[1] && /^[0-9]+$/.test(args[1])) {
      targetBuild = parseInt(args[1], 10)
    }
  } else {
    targetVersion = incrementVersion(current.version, 'patch')
  }

  // Jika build number sama dengan hari ini dan versi sama, tambahkan sub-increment
  if (targetBuild === current.buildNumber && targetVersion === current.version) {
    targetVersion = incrementVersion(current.version, 'patch')
  }

  const cleanVersion = targetVersion.replace(/^v/, '')
  const now = new Date()
  const yearMonth = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`
  const targetVersionLabel = `${targetVersion} build ${yearMonth}`

  log.info(`Versi BARU target  : \x1b[32m${targetVersion}\x1b[0m`)
  log.info(`Build Number target: \x1b[32m${targetBuild}\x1b[0m`)
  log.info(`Version Label      : \x1b[32m${targetVersionLabel}\x1b[0m\n`)

  const updatedFiles = []

  // A. Update constants.js
  const constantsPath = path.join(ROOT_DIR, 'src/dashboard/_shared/pages/akun_page/constants.js')
  if (fs.existsSync(constantsPath)) {
    let content = fs.readFileSync(constantsPath, 'utf8')
    content = content.replace(/export const APP_VERSION = ['"][^'"]+['"]/, `export const APP_VERSION = '${targetVersion}'`)
    content = content.replace(/export const APP_BUILD_NUMBER = [0-9]+/, `export const APP_BUILD_NUMBER = ${targetBuild}`)
    content = content.replace(/export const APP_VERSION_LABEL = ['"][^'"]+['"]/, `export const APP_VERSION_LABEL = '${targetVersionLabel}'`)
    fs.writeFileSync(constantsPath, content, 'utf8')
    updatedFiles.push('src/dashboard/_shared/pages/akun_page/constants.js')
  }

  // B. Update package.json
  const pkgPath = path.join(ROOT_DIR, 'package.json')
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    pkg.version = cleanVersion
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
    updatedFiles.push('package.json')
  }

  // C. Update android/app/build.gradle
  const gradlePath = path.join(ROOT_DIR, 'android/app/build.gradle')
  if (fs.existsSync(gradlePath)) {
    let content = fs.readFileSync(gradlePath, 'utf8')
    content = content.replace(/versionCode\s+[0-9]+/, `versionCode ${targetBuild}`)
    content = content.replace(/versionName\s+['"][^'"]+['"]/, `versionName "${cleanVersion}"`)
    fs.writeFileSync(gradlePath, content, 'utf8')
    updatedFiles.push('android/app/build.gradle')
  }

  // D. Update README.md badge
  const readmePath = path.join(ROOT_DIR, 'README.md')
  if (fs.existsSync(readmePath)) {
    let content = fs.readFileSync(readmePath, 'utf8')
    content = content.replace(/badge\/version-[0-9a-zA-Z\.\-]+-emerald/, `badge/version-${cleanVersion}-emerald`)
    fs.writeFileSync(readmePath, content, 'utf8')
    updatedFiles.push('README.md')
  }

  log.success(`Berhasil memperbarui ${updatedFiles.length} file:`)
  for (const f of updatedFiles) {
    console.log(`  - \x1b[36m${f}\x1b[0m`)
  }

  console.log(`\n🎉 Tag Artifact ZIP di GitHub Actions nanti akan otomatis bernama:`)
  console.log(`  📦 \x1b[1m\x1b[32mGPK-APK-${targetVersion}-b${targetBuild}.zip\x1b[0m\n`)
  console.log(`💡 Langkah selanjutnya:`)
  console.log(`  git add .`)
  console.log(`  git commit -m "chore(release): bump version to ${targetVersion} (build ${targetBuild})"`)
  console.log(`  git push origin main\n`)
}

main()
