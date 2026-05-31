import fs from 'fs'
import path from 'path'

const folders = {
  '7days': './src/assets/7days',
  'month': './src/assets/this-month'
}

const manifest = {}

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
      
      // On Windows, birthtime is the creation time
      return {
        file: f,
        created: stats.birthtimeMs  // This is the actual file creation time!
      }
    })
    .sort((a, b) => b.created - a.created) // Newest first
    .map(f => f.file)

  manifest[key] = files
  
  console.log(`\n📁 ${key}: ${files.length} images`)
  if (files.length > 0) {
    // Show the latest 3 files with their creation dates
    files.slice(0, 3).forEach((file, i) => {
      const fullPath = path.join(dir, file)
      const stats = fs.statSync(fullPath)
      const date = new Date(stats.birthtimeMs)
      console.log(`   ${i+1}. ${file} - ${date.toLocaleString()}`)
    })
  }
}

fs.writeFileSync('./src/assets/manifest.json', JSON.stringify(manifest, null, 2))
console.log('\n✅ Manifest generated!')