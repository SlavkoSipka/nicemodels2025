/**
 * Seed script: Import Swiss cities from the official PLZ CSV into Supabase.
 *
 * Usage:
 *   node scripts/seed-cities.mjs <path-to-csv>
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * The CSV is semicolon-separated with columns:
 *   Ortschaftsname;PLZ4;Zusatzziffer;ZIP_ID;Gemeindename;BFS-Nr;Kantonskürzel;Adressenanteil;E;N;Sprache;Validity
 *
 * We deduplicate by (Ortschaftsname, PLZ4) and skip internal delivery zones
 * (names like "Lausanne 25" that end with a space + number).
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
try {
  const envPath = join(process.cwd(), '.env.local')
  const env = readFileSync(envPath, 'utf-8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
} catch {
  // .env.local not found, use existing env
}

const CSV_PATH = process.argv[2]
if (!CSV_PATH) {
  console.error('Usage: node scripts/seed-cities.mjs <path-to-csv>')
  console.error('  e.g. node scripts/seed-cities.mjs ./data/AMTOVZ_CSV_LV95.csv')
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const DELIVERY_ZONE_PATTERN = /\s+\d+$/

function parseCSV(filePath) {
  const raw = readFileSync(filePath, 'utf-8')
  const lines = raw.split('\n').filter(l => l.trim())
  const header = lines[0].split(';')
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';')
    if (cols.length < header.length) continue
    rows.push({
      name: cols[0].trim(),
      postal_code: cols[1].trim(),
      zusatzziffer: cols[2].trim(),
      municipality: cols[4].trim(),
      bfs_nr: parseInt(cols[5]) || null,
      canton: cols[6].trim(),
      coordinates_e: parseFloat(cols[8]) || null,
      coordinates_n: parseFloat(cols[9]) || null,
      language: cols[10].trim(),
    })
  }
  return rows
}

function deduplicateAndFilter(rows) {
  const seen = new Map()

  for (const row of rows) {
    if (DELIVERY_ZONE_PATTERN.test(row.name)) continue
    if (!row.postal_code || !row.name) continue

    const key = `${row.name}|${row.postal_code}`
    if (!seen.has(key)) {
      seen.set(key, row)
    }
  }

  return Array.from(seen.values())
}

async function seedCities(cities) {
  console.log(`Deleting existing cities...`)
  const { error: delErr } = await supabase.from('cities').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) {
    console.error('Error deleting existing cities:', delErr)
  }

  const BATCH_SIZE = 500
  let inserted = 0

  for (let i = 0; i < cities.length; i += BATCH_SIZE) {
    const batch = cities.slice(i, i + BATCH_SIZE).map((c, idx) => ({
      name: c.name,
      postal_code: c.postal_code,
      canton: c.canton,
      municipality: c.municipality,
      bfs_nr: c.bfs_nr,
      coordinates_e: c.coordinates_e,
      coordinates_n: c.coordinates_n,
      language: c.language,
      is_active: true,
      display_order: i + idx,
    }))

    const { error } = await supabase.from('cities').insert(batch)
    if (error) {
      console.error(`Error inserting batch at offset ${i}:`, error)
    } else {
      inserted += batch.length
      console.log(`  Inserted ${inserted} / ${cities.length}`)
    }
  }

  return inserted
}

async function main() {
  console.log(`Parsing CSV: ${CSV_PATH}`)
  const rows = parseCSV(CSV_PATH)
  console.log(`  Total rows in CSV: ${rows.length}`)

  const cities = deduplicateAndFilter(rows)
  console.log(`  Unique cities after dedup: ${cities.length}`)

  console.log(`\nSeeding to Supabase...`)
  const count = await seedCities(cities)
  console.log(`\nDone! Inserted ${count} cities.`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
