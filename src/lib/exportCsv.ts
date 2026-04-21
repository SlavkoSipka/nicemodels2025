type CsvCell = string | number | boolean | null | undefined

export interface CsvColumn<T> {
  header: string
  value: (row: T) => CsvCell
}

const escapeCell = (val: CsvCell): string => {
  if (val === null || val === undefined) return ''
  let s = String(val)
  // Prevent CSV injection
  if (/^[=+\-@]/.test(s)) s = "'" + s
  if (/[",\n;]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map(c => escapeCell(c.header)).join(',')
  const body = rows
    .map(r => columns.map(c => escapeCell(c.value(r))).join(','))
    .join('\n')
  return head + '\n' + body
}

export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const csv = buildCsv(rows, columns)
  // BOM so Excel detects UTF-8 (umlauts etc.)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}-${stamp}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const fmtDate = (d?: string | null): string =>
  d ? new Date(d).toISOString().slice(0, 10) : ''

export const fmtDateTime = (d?: string | null): string =>
  d ? new Date(d).toISOString().replace('T', ' ').slice(0, 19) : ''
