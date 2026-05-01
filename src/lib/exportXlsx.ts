import * as XLSX from 'xlsx'

type XlsxCell = string | number | boolean | null | undefined

export interface XlsxColumn<T> {
  header: string
  value: (row: T) => XlsxCell
  /** When true, force the cell to be stored as text (e.g. for phone numbers like "+41 79 …"). */
  text?: boolean
  /** Optional column width in characters. */
  width?: number
}

export function downloadXlsx<T>(
  filename: string,
  rows: T[],
  columns: XlsxColumn<T>[],
  sheetName = 'Sheet1',
): void {
  const aoa: any[][] = [columns.map(c => c.header)]
  for (const row of rows) {
    aoa.push(columns.map(c => {
      const v = c.value(row)
      if (v === null || v === undefined) return ''
      if (c.text) return String(v)
      return v
    }))
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)

  // Force text-typed cells (e.g. phone) so Excel doesn't reformat or strip leading "+".
  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    if (!columns[colIdx].text) continue
    for (let r = 1; r < aoa.length; r++) {
      const addr = XLSX.utils.encode_cell({ r, c: colIdx })
      const cell = ws[addr]
      if (cell) {
        cell.t = 's'
        cell.v = String(cell.v ?? '')
        cell.z = '@'
      }
    }
  }

  ws['!cols'] = columns.map(c => ({ wch: c.width ?? Math.max(12, c.header.length + 2) }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  const stamp = new Date().toISOString().slice(0, 10)
  const safeName = filename.endsWith('.xlsx') ? filename : `${filename}-${stamp}.xlsx`
  XLSX.writeFile(wb, safeName, { bookType: 'xlsx', compression: true })
}

export const fmtDate = (d?: string | null): string =>
  d ? new Date(d).toISOString().slice(0, 10) : ''

export const fmtDateTime = (d?: string | null): string =>
  d ? new Date(d).toISOString().replace('T', ' ').slice(0, 19) : ''
