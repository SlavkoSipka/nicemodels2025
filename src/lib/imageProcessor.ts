/**
 * processImage — kompresija + watermark za sve upload lokacije
 *
 * Koristi samo Canvas API (nema eksternih biblioteka).
 * Vraća File spreman za Supabase upload.
 */

export interface ProcessImageOptions {
  maxWidthPx?: number   // default 1600
  quality?: number      // 0–1, default 0.82
  watermark?: string    // default 'nicemodels.ch'
  addWatermark?: boolean // default true
}

export async function processImage(
  file: File,
  options: ProcessImageOptions = {}
): Promise<File> {
  const {
    maxWidthPx = 1600,
    quality = 0.82,
    watermark = 'nicemodels.ch',
    addWatermark = true,
  } = options

  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // 1. Izračunaj dimenzije (max maxWidthPx, čuvaj aspect ratio)
      let { width, height } = img
      if (width > maxWidthPx) {
        height = Math.round((height * maxWidthPx) / width)
        width = maxWidthPx
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!

      // 2. Nacrtaj sliku
      ctx.drawImage(img, 0, 0, width, height)

      // 3. Watermark
      if (addWatermark) {
        const fontSize = Math.max(22, Math.round(width * 0.045))

        ctx.save()

        ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // Pozicija — centar slike
        const x = width / 2
        const y = height / 2

        // Jak drop-shadow da tekst bude čitljiv na svakoj pozadini
        ctx.shadowColor = 'rgba(0,0,0,0.75)'
        ctx.shadowBlur  = 8
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1

        // Tekst — beli, 55% providnost (jasno vidljiv, ne uništava sliku)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
        ctx.fillText(watermark, x, y)

        ctx.restore()
      }

      // 4. Eksportuj kao WebP (fallback JPEG)
      const mimeType = 'image/webp'
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return }
          const baseName = file.name.replace(/\.[^.]+$/, '')
          const processed = new File([blob], `${baseName}.webp`, { type: mimeType })
          resolve(processed)
        },
        mimeType,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}
