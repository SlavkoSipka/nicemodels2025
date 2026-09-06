#!/usr/bin/env node
/**
 * generate-icons.mjs — pravi favicon.ico i PWA/Apple ikone iz public/logo.webp.
 *
 * Projekat je do sada servirao podrazumevani Next.js favicon (Vercel trougao),
 * a kao apple-touch-icon i PWA ikonu koristio /logo.webp — natpis 1333x278
 * koji se u kvadratnom okviru razvlači.
 *
 * Pokretanje posle promene logotipa:  node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import fs from 'node:fs'

// Monogram "n" iz nicemodels.ch logotipa: beli potez na brend-roze podlozi.
// Ceo natpis (1333x278) je nečitljiv kao kvadratna ikona, pa se koristi
// početno slovo. Granice slova (x 5-162, y 78-268) izmerene skeniranjem
// alfa kanala — slova su spojena plavom konturom pa ih trim() ne razdvaja.
const BG = '#BE185D'
const g = await sharp('public/logo.webp')
  .extract({ left: 5, top: 78, width: 157, height: 191 })
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true })

const { data, info } = g
const { width: W, height: H, channels: C } = info
const mask = Buffer.alloc(W * H * 4)
for (let i = 0; i < W * H; i++) {
  const r = data[i * C], gr = data[i * C + 1], b = data[i * C + 2], a = data[i * C + 3]
  const isBlue = b > gr + 20 && b > r + 20
  const isWhite = r > 205 && gr > 205 && b > 205
  const on = a > 80 && !isBlue && !isWhite
  mask[i * 4] = 255; mask[i * 4 + 1] = 255; mask[i * 4 + 2] = 255
  mask[i * 4 + 3] = on ? 255 : 0
}
const letter = await sharp(mask, { raw: { width: W, height: H, channels: 4 } })
  .blur(1.2).png().toBuffer()

async function square(side, innerRatio = 0.66) {
  const inner = Math.round(side * innerRatio)
  const scaled = await sharp(letter)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  return sharp({ create: { width: side, height: side, channels: 4, background: BG } })
    .composite([{ input: scaled, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

/**
 * Minimalni ICO enkoder. ICO od Viste naovamo sme da nosi PNG umesto BMP-a,
 * pa je dovoljno spakovati zaglavlje + direktorijum + PNG-ove.
 */
function buildIco(pngs) {
  const n = pngs.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)      // reserved
  header.writeUInt16LE(1, 2)      // type: ikona
  header.writeUInt16LE(n, 4)      // broj slika
  const dir = Buffer.alloc(16 * n)
  let offset = 6 + 16 * n
  pngs.forEach(({ size, buf }, i) => {
    const o = i * 16
    dir[o] = size >= 256 ? 0 : size       // sirina (256 se pise kao 0)
    dir[o + 1] = size >= 256 ? 0 : size   // visina
    dir[o + 2] = 0                        // broj boja u paleti
    dir[o + 3] = 0                        // reserved
    dir.writeUInt16LE(1, o + 4)           // color planes
    dir.writeUInt16LE(32, o + 6)          // bita po pikselu
    dir.writeUInt32LE(buf.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += buf.length
  })
  return Buffer.concat([header, dir, ...pngs.map(p => p.buf)])
}

const sizes = [16, 32, 48]
const pngs = []
for (const size of sizes) pngs.push({ size, buf: await square(size) })
fs.writeFileSync('src/app/favicon.ico', buildIco(pngs))
console.log('src/app/favicon.ico ->', fs.statSync('src/app/favicon.ico').size, 'B', `(${sizes.join('/')})`)

// PWA / Apple ikone — layout je ranije za apple-touch-icon koristio logo.webp,
// a to je natpis 1333x278 koji iOS razvlači u kvadrat.
for (const [file, side, ratio] of [
  ['public/apple-touch-icon.png', 180, 0.62],
  ['public/icon-192.png', 192, 0.66],
  ['public/icon-512.png', 512, 0.66],
]) {
  fs.writeFileSync(file, await square(side, ratio))
  console.log(file, '->', fs.statSync(file).size, 'B')
}
