// test.js - run with: node test.js
import fs from 'fs'

const files = fs.readdirSync('./src/assets/7days')
  .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))

console.log('Your files:')
files.forEach(f => {
  const match = f.match(/\d+\.(\d+)/)
  const extracted = match ? parseInt(match[1]) : 0
  console.log(`${f} → extracted number: ${extracted}`)
})