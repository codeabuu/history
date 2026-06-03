import fs from 'fs'
import path from 'path'

const folders = {
  '7days': './src/assets/7days',
  'month': './src/assets/this-month'
}

const manifest = {}

// Extract a sortable date from WhatsApp-style filenames
// e.g. "WhatsApp Image 2026-06-02 at 18.21.04 (1).jpeg" → "2026-06-02 18:21:04"
function extractDateFromFilename(filename) {
  const match = filename.match(/(\d{4}-\d{2}-\d{2}) at (\d{2})\.(\d{2})\.(\d{2})/)
  if (match) {
    const [, date, hh, mm, ss] = match
    return new Date(`${date}T${hh}:${mm}:${ss}`)
  }
  // Fallback: use mtime (last modified), which is more stable than birthtime on CI
  return null
}

for (const [key, dir] of Object.entries(folders)) {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Folder not found: ${dir}`)
    manifest[key] = []
    continue
  }

  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .map(f => {
      const fullPath = path.join(dir, f)
      const stats = fs.statSync(fullPath)
      const dateFromName = extractDateFromFilename(f)
      return {
        file: f,
        // Prefer date from filename, fall back to mtime
        sortKey: dateFromName ? dateFromName.getTime() : stats.mtimeMs
      }
    })
    .sort((a, b) => b.sortKey - a.sortKey) // Newest first
    .map(f => f.file)

  manifest[key] = files

  console.log(`\n📁 ${key}: ${files.length} images`)
  files.slice(0, 3).forEach((file, i) => {
    console.log(`   ${i + 1}. ${file}`)
  })
}

fs.writeFileSync('./src/assets/manifest.json', JSON.stringify(manifest, null, 2))
console.log('\n✅ Manifest generated!')