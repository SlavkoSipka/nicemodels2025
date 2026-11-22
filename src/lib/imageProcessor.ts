/**
 * Client-side image preparation for every upload: resize, watermark and
 * re-encode with the Canvas API, returning a File ready for Supabase Storage.
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

      // Scale down to maxWidthPx, keeping the aspect ratio.
      let { width, height } = img
      if (width > maxWidthPx) {
        height = Math.round((height * maxWidthPx) / width)
        width = maxWidthPx
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!

      ctx.drawImage(img, 0, 0, width, height)

      if (addWatermark) {
        const fontSize = Math.max(22, Math.round(width * 0.045))

        ctx.save()

        ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const x = width / 2
        const y = height / 2

        // A strong shadow keeps the text legible on any background.
        ctx.shadowColor = 'rgba(0,0,0,0.75)'
        ctx.shadowBlur  = 8
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1

        // Semi-transparent white: clearly visible without spoiling the photo.
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
        ctx.fillText(watermark, x, y)

        ctx.restore()
      }

      const baseName = file.name.replace(/\.[^.]+$/, '')
      encodeCanvas(canvas, baseName, quality).then(resolve, reject)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

/**
 * Encode a canvas as WebP, falling back to JPEG.
 *
 * `canvas.toBlob(cb, 'image/webp', q)` may return a PNG where no WebP encoder
 * exists (older Safari / iOS < 16.4), ignoring the quality setting. The
 * returned type is therefore checked, and the file is named after it, so a
 * multi-megabyte PNG is never stored and served as `image/webp`.
 */
export function encodeCanvas(
  canvas: HTMLCanvasElement,
  baseName: string,
  quality = 0.82,
): Promise<File> {
  return new Promise((resolve, reject) => {
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
        canvas.toBlob((jpeg) => finish(jpeg, 'image/jpeg', 'jpg'), 'image/jpeg', quality)
      },
      'image/webp',
      quality,
    )
  })
}

/**
 * File extension matching the type `processImage` actually produced, for
 * building storage paths. A hard-coded `.webp` would mislabel the JPEG fallback.
 */
export function extensionFor(file: File): string {
  return file.type === 'image/webp' ? 'webp' : 'jpg'
}

/**
 * Gallery paths are content-addressed (timestamp + random suffix) and never
 * overwritten, so they can be cached indefinitely.
 */
export const IMMUTABLE_CACHE_CONTROL = '31536000'
