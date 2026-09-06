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

      // 4. Eksportuj kao WebP — ali NIKAD ne veruj imenu tipa.
      //
      // canvas.toBlob(cb, 'image/webp', q) je po spec-u dozvoljeno da padne
      // nazad na image/png kada enkoder nije dostupan (stariji Safari / iOS
      // < 16.4). Kvalitet se tada ignoriše i dobijamo RGBA PNG od 2–5 MB koji
      // smo ranije slepo imenovali `.webp`. Supabase onda servira PNG sa
      // `content-type: image/webp`, a Netlify image CDN mora da povuče i
      // dekodira te megabajte na svaki cache miss — što je direktno rušilo LCP.
      //
      // Zato proveravamo šta je enkoder STVARNO vratio i, ako to nije WebP,
      // reenkodujemo u JPEG (podržan svuda) i imenujemo fajl po pravom tipu.
      const baseName = file.name.replace(/\.[^.]+$/, '')

      const finish = (blob: Blob | null, mime: string, ext: string) => {
        if (!blob) { reject(new Error('Canvas toBlob failed')); return }
        resolve(new File([blob], `${baseName}.${ext}`, { type: mime }))
      }

      canvas.toBlob(
        (blob) => {
          if (blob && blob.type === 'image/webp') {
            finish(blob, 'image/webp', 'webp')
            return
          }
          // WebP enkoder nedostupan (ili je vratio PNG) — idemo na JPEG.
          canvas.toBlob(
            (jpeg) => finish(jpeg, 'image/jpeg', 'jpg'),
            'image/jpeg',
            quality
          )
        },
        'image/webp',
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

/**
 * Ekstenzija koja odgovara stvarnom tipu fajla koji je vratio `processImage`.
 * Pozivna mesta grade putanju za Supabase storage — ako bi hardkodovala
 * `.webp`, JPEG fallback bi opet završio pod pogrešnim imenom i pogrešnim
 * `content-type`-om.
 */
export function extensionFor(file: File): string {
  return file.type === 'image/webp' ? 'webp' : 'jpg'
}

/**
 * Putanje za galerijske slike su content-adresirane (timestamp + random) i
 * nikad se ne prepisuju, pa smeju da se keširaju zauvek. Ranije `3600` je
 * značilo da Netlify image CDN svakog sata iznova povlači original iz
 * Supabase storage-a pre nego što ga transkodira.
 */
export const IMMUTABLE_CACHE_CONTROL = '31536000'
