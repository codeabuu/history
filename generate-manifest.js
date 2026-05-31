import fs from 'fs'
import path from 'path'

const folders = {
  '7days': './src/assets/7days',
  'month': './src/assets/this-month'
}

const manifest = {}

// Function to extract timestamp from WhatsApp format: "WhatsApp Image 2026-05-30 at 12.54.48.jpeg"
function extractWhatsAppTimestamp(filename) {
  // Pattern: WhatsApp Image YYYY-MM-DD at HH.MM.SS
  const match = filename.match(/WhatsApp Image (\d{4}-\d{2}-\d{2}) at (\d{2})\.(\d{2})\.(\d{2})/)
  if (match) {
    const [_, date, hour, minute, second] = match
    return new Date(`${date}T${hour}:${minute}:${second}`).getTime()
  }
  return null
}

// Function to extract timestamp from simple numbers like "1.1.png", "1.12.png"
// Assuming format: day.version.png (e.g., 1.1 = May 1st, version 1)
function extractNumberTimestamp(filename) {
  const match = filename.match(/^(\d+)\.(\d+)\.(png|jpeg|jpg)$/i)
  if (match) {
    const [_, dayNum, version] = match
    // This is ambiguous - we need current month/year
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    // Create date using current month/year + day number
    const date = new Date(year, month, parseInt(dayNum))
    // Add version as milliseconds to differentiate same-day uploads
    return date.getTime() + parseInt(version)
  }
  return null
}

// Function to extract timestamp from any filename
function getImageTimestamp(filename, filePath) {
  // Priority 1: Use file system creation time (MOST ACCURATE)
  try {
    const stats = fs.statSync(filePath)
    if (stats.birthtimeMs && stats.birthtimeMs > 0) {
      return stats.birthtimeMs
    }
  } catch(e) {}
  
  // Priority 2: Extract from WhatsApp format
  const whatsappTime = extractWhatsAppTimestamp(filename)
  if (whatsappTime) return whatsappTime
  
  // Priority 3: Extract from number format
  const numberTime = extractNumberTimestamp(filename)
  if (numberTime) return numberTime
  
  // Priority 4: Use modification time as fallback
  try {
    const stats = fs.statSync(filePath)
    return stats.mtimeMs || stats.ctimeMs || 0
  } catch(e) {
    return 0
  }
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
      const timestamp = getImageTimestamp(f, fullPath)
      
      return {
        file: f,
        timestamp: timestamp
      }
    })
    .sort((a, b) => b.timestamp - a.timestamp) // Newest FIRST
    .map(f => f.file)

  manifest[key] = files
  
  // Debug output
  console.log(`\n📁 ${key}: ${files.length} images`)
  if (files.length > 0) {
    console.log(`   🥇 LATEST: ${files[0]}`)
    console.log(`   🥈 Second: ${files[1] || 'N/A'}`)
    console.log(`   🥉 Third: ${files[2] || 'N/A'}`)
  }
}

fs.writeFileSync('./src/assets/manifest.json', JSON.stringify(manifest, null, 2))
console.log('\n✅ Manifest generated with correct sorting!')
console.log('\n📋 First 5 images in manifest (7days):')
console.log(manifest['7days'].slice(0, 5))