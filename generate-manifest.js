import fs from 'fs'
import path from 'path'

const folders = {
  '7days': './src/assets/7days',
  'month': './src/assets/this-month'
}

const manifest = {}

for (const [key, dir] of Object.entries(folders)) {
  const files = fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .map(f => {
      const stats = fs.statSync(path.join(dir, f))
      return {
        file: f,
        created: stats.birthtimeMs  // Windows creation time
      }
    })
    .sort((a, b) => b.created - a.created)  // newest first
    .map(f => f.file)

  manifest[key] = files
}

fs.writeFileSync('./src/assets/manifest.json', JSON.stringify(manifest, null, 2))
console.log('✅ Manifest generated')
console.log('7days order:', manifest['7days'].slice(0, 3))