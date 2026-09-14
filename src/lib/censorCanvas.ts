/**
 * Canvas pipeline behind the admin photo censor.
 *
 * Kept out of the modal so the redaction maths can be exercised on its own —
 * a wrong blur radius or a clip that leaks is only visible in pixels.
 */

export type CensorEffect = 'blur' | 'pixelate' | 'black'

export type CensorShape =
  | { kind: 'rect'; effect: CensorEffect; strength: number; x: number; y: number; w: number; h: number }
  | { kind: 'brush'; effect: CensorEffect; strength: number; size: number; points: { x: number; y: number }[] }

/** Blur radius and pixel block scale with the image, so a redaction reads the same on any upload size. */
export function blurRadiusFor(strength: number, minDim: number): number {
  return Math.max(4, (strength / 100) * minDim * 0.09)
}

export function blockSizeFor(strength: number, minDim: number): number {
  return Math.max(4, Math.round((strength / 100) * minDim * 0.07))
}

export type EffectCache = Map<string, HTMLCanvasElement>

/**
 * Full-image blur/pixelate pass, memoised per effect+strength. Rendering then
 * clips it to each shape, which keeps a photo with twelve redactions as cheap
 * as one and avoids `filter` bleeding pixels across region borders.
 */
export function getEffectCanvas(
  img: CanvasImageSource & { naturalWidth?: number; naturalHeight?: number; width?: number; height?: number },
  effect: Exclude<CensorEffect, 'black'>,
  strength: number,
  cache: EffectCache,
): HTMLCanvasElement {
  const key = `${effect}:${strength}`
  const cached = cache.get(key)
  if (cached) return cached

  const w = (img.naturalWidth ?? img.width) as number
  const h = (img.naturalHeight ?? img.height) as number
  const minDim = Math.min(w, h)

  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')!

  if (effect === 'blur') {
    const radius = blurRadiusFor(strength, minDim)
    ctx.filter = `blur(${radius}px)`
    // Overdraw by the blur radius: sampling past the edge otherwise pulls in
    // transparent pixels and leaves a washed-out frame around the photo.
    const pad = Math.ceil(radius * 2)
    ctx.drawImage(img, -pad, -pad, w + pad * 2, h + pad * 2)
    ctx.filter = 'none'
  } else {
    const block = blockSizeFor(strength, minDim)
    const sw = Math.max(1, Math.round(w / block))
    const sh = Math.max(1, Math.round(h / block))
    const small = document.createElement('canvas')
    small.width = sw
    small.height = sh
    small.getContext('2d')!.drawImage(img, 0, 0, sw, sh)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(small, 0, 0, sw, sh, 0, 0, w, h)
  }

  cache.set(key, out)
  return out
}

export function paintCensorShape(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { naturalWidth?: number; naturalHeight?: number; width?: number; height?: number },
  shape: CensorShape,
  cache: EffectCache,
): void {
  const w = (img.naturalWidth ?? img.width) as number
  const h = (img.naturalHeight ?? img.height) as number

  ctx.save()
  ctx.beginPath()
  if (shape.kind === 'rect') {
    // Normalise: dragging up or left produces negative width/height.
    const x = shape.w < 0 ? shape.x + shape.w : shape.x
    const y = shape.h < 0 ? shape.y + shape.h : shape.y
    ctx.rect(x, y, Math.abs(shape.w), Math.abs(shape.h))
  } else {
    for (const p of shape.points) {
      ctx.moveTo(p.x + shape.size, p.y)
      ctx.arc(p.x, p.y, shape.size, 0, Math.PI * 2)
    }
  }
  ctx.clip()

  if (shape.effect === 'black') {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
  } else {
    ctx.drawImage(getEffectCanvas(img, shape.effect, shape.strength, cache), 0, 0)
  }
  ctx.restore()
}

/** Redacted copy at the image's own resolution — what actually gets uploaded. */
export function composeCensored(
  img: CanvasImageSource & { naturalWidth?: number; naturalHeight?: number; width?: number; height?: number },
  shapes: CensorShape[],
  cache: EffectCache,
): HTMLCanvasElement {
  const w = (img.naturalWidth ?? img.width) as number
  const h = (img.naturalHeight ?? img.height) as number

  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  for (const shape of shapes) paintCensorShape(ctx, img, shape, cache)
  return out
}
