#!/usr/bin/env node
/**
 * fix-mislabeled-photos.mjs
 *
 * Sanira prevelike slike u Supabase storage-u, sa naglaskom na fajlove kod
 * kojih SADRŽAJ NE ODGOVARA EKSTENZIJI.
 *
 * Uzrok: `canvas.toBlob(cb, 'image/webp', q)` po spec-u sme da padne na
 * `image/png` kada enkoder nije dostupan (stariji Safari / iOS < 16.4).
 * `src/lib/imageProcessor.ts` je taj blob slepo imenovao `.webp`, pa su
 * fotografije od 2–5 MB (RGBA PNG) završavale u galerijama. Netlify Image CDN
 * mora da povuče i dekodira ceo original na svaki cache miss — to je direktno
 * rušilo LCP. Popravka za NOVE uploade je već u `imageProcessor.ts`; ova
 * skripta sređuje ono što je već u storage-u.
 *
 * ─── ŠTA OVA SKRIPTA NE RADI ────────────────────────────────────────────────
 * Ne dodiruje bazu. Nema nijednog `.from(tabela)` poziva — samo
 * `storage.list`, `storage.download`, `storage.upload`. Fajl se prepisuje na
 * ISTOJ putanji, pa `file_path` / `file_name` / `media_url` ostaju validni.
 * Tabele fotografija ionako ne čuvaju ni veličinu ni MIME ni dimenzije.
 *
 * ─── SIGURNOSNA PRAVILA ─────────────────────────────────────────────────────
 * 1. Svaki original se PRE prepisivanja snimi lokalno u --backup-dir.
 *    `--restore` vraća sve nazad iz tog foldera.
 * 2. Sadržaj se uvek enkoduje u format koji ekstenzija već obećava, da se ne
 *    napravi novi nesklad.
 * 3. Slike sa alfa kanalom se NIKAD ne konvertuju u JPEG (gubitak providnosti).
 * 4. PNG se ne kvantizuje na paletu (banding na fotografijama).
 * 5. Podrazumevano se diraju SAMO fajlovi sa neskladom sadržaj/ekstenzija.
 *    `--include-oversized` dodaje i ispravno zavedene ali velike fajlove —
 *    to je kompromis kvaliteta, ne ispravka buga, pa je eksplicitan.
 * 6. Posle svakog upload-a `list()` vraća stvarni eTag objekta (MD5 sadržaja),
 *    koji se poredi sa MD5-om poslatog bafera. `download()` se NE koristi za
 *    verifikaciju — servira se kroz keš i ume da vrati staru verziju odmah
 *    posle upisa. Neuspela verifikacija odmah vraća original.
 *
 * Pokretanje:
 *   node scripts/fix-mislabeled-photos.mjs                     # dry-run
 *   node scripts/fix-mislabeled-photos.mjs --apply             # samo neskladi
 *   node scripts/fix-mislabeled-photos.mjs --apply --include-oversized
 *   node scripts/fix-mislabeled-photos.mjs --restore           # vrati sve nazad
 *
 * Zahteva SUPABASE_SERVICE_ROLE_KEY i NEXT_PUBLIC_SUPABASE_URL (.env.local).
 */

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

// ── env ───────────────────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_ || !KEY) {
  console.error('Nedostaje NEXT_PUBLIC_SUPABASE_URL ili SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const argv = process.argv.slice(2)
const has = f => argv.includes(f)
const val = (f, d) => { const i = argv.indexOf(f); return i !== -1 ? argv[i + 1] : d }

const APPLY = has('--apply')
const RESTORE = has('--restore')
const INCLUDE_OVERSIZED = has('--include-oversized')
const BACKUP_DIR = path.resolve(val('--backup-dir', './.photo-backup'))
const BUCKETS = val('--bucket') ? [val('--bucket')] : ['model-photos', 'club-photos', 'job-listing-photos', 'model-stories']

const MAX_WIDTH = 1600
const QUALITY = 82
const MIN_SIZE = 400 * 1024
const IMMUTABLE = '31536000'

const supabase = createClient(URL_, KEY, { auth: { persistSession: false } })

const mb = n => (n / 1048576).toFixed(2)
const backupPath = (bucket, p) => path.join(BACKUP_DIR, bucket, p)

function sniff(b) {
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  if (b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP') return 'webp'
  return 'unknown'
}

// ── restore ───────────────────────────────────────────────────────────────
if (RESTORE) {
  if (!fs.existsSync(BACKUP_DIR)) { console.error(`Nema backup foldera: ${BACKUP_DIR}`); process.exit(1) }
  let n = 0, bad = 0
  for (const bucket of fs.readdirSync(BACKUP_DIR)) {
    const root = path.join(BACKUP_DIR, bucket)
    if (!fs.statSync(root).isDirectory()) continue
    const stack = [root]
    while (stack.length) {
      const d = stack.pop()
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name)
        if (e.isDirectory()) { stack.push(full); continue }
        const rel = path.relative(root, full)
        const buf = fs.readFileSync(full)
        const ext = (rel.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase()
        const ct = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
        const { error } = await supabase.storage.from(bucket).upload(rel, buf, { contentType: ct, upsert: true })
        if (error) { console.error(`  ✗ ${bucket}/${rel}: ${error.message}`); bad++ }
        else { console.log(`  ← ${bucket}/${rel}`); n++ }
      }
    }
  }
  console.log(`\nVraćeno ${n} fajlova, grešaka: ${bad}`)
  process.exit(bad ? 1 : 0)
}

// ── list ──────────────────────────────────────────────────────────────────
async function walk(bucket, prefix = '') {
  const out = []
  let offset = 0
  for (;;) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } })
    if (error) { console.error(`  list ${bucket}/${prefix}: ${error.message}`); break }
    if (!data?.length) break
    for (const entry of data) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.id === null || entry.metadata === null) out.push(...await walk(bucket, full))
      else out.push({ path: full, size: entry.metadata?.size ?? 0 })
    }
    if (data.length < 100) break
    offset += data.length
  }
  return out
}

let scanned = 0, mismatched = 0, oversized = 0, fixed = 0, failed = 0, skipped = 0
let bytesBefore = 0, bytesAfter = 0

for (const bucket of BUCKETS) {
  console.log(`\n=== ${bucket} ===`)
  const images = (await walk(bucket)).filter(f => /\.(webp|jpe?g|png)$/i.test(f.path))
  console.log(`  ${images.length} slika`)

  for (const file of images) {
    scanned++
    if (file.size < MIN_SIZE) continue

    const { data, error } = await supabase.storage.from(bucket).download(file.path)
    if (error || !data) { console.error(`  ✗ download ${file.path}: ${error?.message}`); failed++; continue }
    const buf = Buffer.from(await data.arrayBuffer())

    const real = sniff(buf)
    if (real === 'unknown') continue

    const ext = (file.path.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase()
    const target = ext === 'webp' ? 'webp' : ext === 'png' ? 'png' : 'jpeg'
    const isMismatch = real !== target

    if (isMismatch) mismatched++; else oversized++
    // Pravilo 5: ispravno zavedene fajlove diramo samo na izričit zahtev.
    if (!isMismatch && !INCLUDE_OVERSIZED) { skipped++; continue }

    let meta
    try { meta = await sharp(buf).metadata() } catch (e) {
      console.error(`  ✗ nečitljiva slika ${file.path}: ${e.message}`); failed++; continue
    }

    // Pravilo 3: providnost se ne sme izgubiti.
    if (meta.hasAlpha && target === 'jpeg') {
      console.log(`  ⊘ ${file.path} — ima alfa kanal, JPEG bi ga obrisao. Preskačem.`)
      skipped++; continue
    }

    let out
    try {
      const pipe = sharp(buf).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true })
      out = await (
        target === 'webp' ? pipe.webp({ quality: QUALITY })
        // Pravilo 4: bez `palette: true` — kvantizacija na 256 boja pravi banding.
        : target === 'png' ? pipe.png({ compressionLevel: 9 })
        : pipe.jpeg({ quality: QUALITY, mozjpeg: true })
      ).toBuffer()
    } catch (e) {
      console.error(`  ✗ reenkodiranje ${file.path}: ${e.message}`); failed++; continue
    }

    if (out.length >= buf.length) { skipped++; continue }

    bytesBefore += buf.length
    bytesAfter += out.length
    const tag = isMismatch ? `${real} pod .${ext}` : `${real}, prevelik`
    console.log(`  ${APPLY ? '→' : '·'} ${file.path}  [${tag}]  ${mb(buf.length)} MB → ${mb(out.length)} MB`)
    if (!APPLY) continue

    // Pravilo 1: backup PRE upisa.
    const bp = backupPath(bucket, file.path)
    fs.mkdirSync(path.dirname(bp), { recursive: true })
    fs.writeFileSync(bp, buf)

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(file.path, out, { contentType: `image/${target}`, cacheControl: IMMUTABLE, upsert: true })
    if (upErr) { console.error(`    ✗ upload: ${upErr.message}`); failed++; continue }

    // Pravilo 6: verifikuj preko `list()` metapodataka, NE preko `download()`.
    //
    // Supabase storage servira `download()` kroz keš (`cache-control` na samom
    // objektu), pa čitanje odmah posle upisa ume da vrati staru verziju iako je
    // upis prošao. Prva verzija ove skripte je zbog toga proglašavala svaki
    // upis neuspelim i vraćala original. `list()` vraća stvarni `eTag` objekta,
    // a to je MD5 sadržaja — poređenje sa MD5-om onoga što smo poslali je
    // verifikacija bajt po bajt bez dodirivanja keširane putanje.
    const dir = path.posix.dirname(file.path)
    const name = path.posix.basename(file.path)
    const { data: listed } = await supabase.storage.from(bucket).list(dir === '.' ? '' : dir, { limit: 100 })
    const objMeta = listed?.find(x => x.name === name)?.metadata
    const etag = String(objMeta?.eTag ?? '').replace(/"/g, '')
    const expected = crypto.createHash('md5').update(out).digest('hex')

    if (etag !== expected || objMeta?.size !== out.length) {
      console.error(`    ✗ verifikacija pala (eTag ${etag || '?'} != ${expected}) — vraćam original`)
      await supabase.storage.from(bucket)
        .upload(file.path, buf, { contentType: `image/${real}`, cacheControl: IMMUTABLE, upsert: true })
      failed++; continue
    }
    fixed++
  }
}

console.log(`\n─────────────────────────────────────────`)
console.log(`skenirano: ${scanned}`)
console.log(`nesklad sadržaj/ekstenzija: ${mismatched}   ispravni ali veliki: ${oversized}`)
console.log(`prepisano: ${fixed}   preskočeno: ${skipped}   grešaka: ${failed}`)
console.log(`ušteda: ${mb(bytesBefore - bytesAfter)} MB  (${mb(bytesBefore)} MB → ${mb(bytesAfter)} MB)`)
if (APPLY) console.log(`\nbackup originala: ${BACKUP_DIR}\nvraćanje: node scripts/fix-mislabeled-photos.mjs --restore`)
else console.log(`\nDRY-RUN — ništa nije promenjeno.${INCLUDE_OVERSIZED ? '' : '\n(bez --include-oversized diraju se samo neskladi)'}`)
