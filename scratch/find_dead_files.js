import fs from 'fs'
import path from 'path'

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir)
  list.forEach(file => {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        getFiles(fullPath, files)
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      files.push(fullPath)
    }
  })
  return files
}

const srcDir = 'src'
const allFiles = getFiles(srcDir)
const fileContents = allFiles.map(f => ({
  path: f,
  name: path.basename(f),
  content: fs.readFileSync(f, 'utf-8')
}))

console.log(`Scanning ${allFiles.length} files...`)

const unimported = []

allFiles.forEach(f => {
  const base = path.basename(f, path.extname(f))
  if (base === 'main' || base === 'index' || base === 'App') return

  // Check if this base name is imported in any other file
  let imported = false
  for (const other of fileContents) {
    if (other.path === f) continue
    if (other.content.includes(base)) {
      imported = true
      break
    }
  }

  if (!imported) {
    unimported.push(f)
  }
})

console.log('Unimported files found:')
unimported.forEach(f => {
  console.log(`- ${f} (${fs.statSync(f).size} bytes, ${fs.readFileSync(f, 'utf-8').split('\n').length} lines)`)
})
