/** Canvas pipeline shared by the admin photo and video censor. */

export type CensorEffect = 'blur' | 'pixelate' | 'black'

export type CensorShape =
  | { kind: 'rect'; effect: CensorEffect; strength: number; x: number; y: number; w: number; h: number }
  | { kind: 'brush'; effect: CensorEffect; strength: number; size: number; points: { x: number; y: number }[] }

export type TimedCensorShape = CensorShape & { start: number; end: number }

export type EffectCache = Map<string, HTMLCanvasElement>

type Source = CanvasImageSource & { naturalWidth?: number; naturalHeight?: number; width?: unknown; height?: unknown }
type FilterEffect = Exclude<CensorEffect, 'black'>
type Buffers = { mid: HTMLCanvasElement; small: HTMLCanvasElement }

/** Blur radius and pixel block scale with the image, so a redaction reads the same on any upload size. */
export function blurRadiusFor(strength: number, minDim: number): number {
  return Math.max(4, (strength / 100) * minDim * 0.09)
}

export function blockSizeFor(strength: number, minDim: number): number {
  return Math.max(4, Math.round((strength / 100) * minDim * 0.07))
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return canvas
}

function resize(canvas: HTMLCanvasElement, w: number, h: number) {
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h
}

function makeBuffers(): Buffers {
  return { mid: makeCanvas(1, 1), small: makeCanvas(1, 1) }
}

function sizeOf(img: Source) {
  return { w: Number(img.naturalWidth ?? img.width), h: Number(img.naturalHeight ?? img.height) }
}

function drawEffect(
  out: HTMLCanvasElement,
  buffers: Buffers,
  source: CanvasImageSource,
  effect: FilterEffect,
  strength: number,
) {
  const { width: w, height: h } = out
  const minDim = Math.min(w, h)
  const ctx = out.getContext('2d')!

  if (effect === 'pixelate') {
    const block = blockSizeFor(strength, minDim)
    const sw = Math.max(1, Math.round(w / block))
    const sh = Math.max(1, Math.round(h / block))
    resize(buffers.small, sw, sh)
    buffers.small.getContext('2d')!.drawImage(source, 0, 0, sw, sh)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(buffers.small, 0, 0, sw, sh, 0, 0, w, h)
    return
  }

  // Blur by shrinking and re-enlarging instead of ctx.filter: Safari ignores
  // ctx.filter without an error, which would publish the photo unredacted.
  const factor = Math.max(2, blurRadiusFor(strength, minDim) / 2)
  const sw = Math.max(2, Math.round(w / factor))
  const sh = Math.max(2, Math.round(h / factor))
  const mw = Math.min(w, sw * 4)
  const mh = Math.min(h, sh * 4)
  resize(buffers.mid, mw, mh)
  resize(buffers.small, sw, sh)
  const mid = buffers.mid.getContext('2d')!
  const small = buffers.small.getContext('2d')!
  mid.imageSmoothingQuality = 'high'
  small.imageSmoothingQuality = 'high'
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  mid.drawImage(source, 0, 0, mw, mh)
  small.drawImage(buffers.mid, 0, 0, sw, sh)
  mid.drawImage(buffers.small, 0, 0, mw, mh)
  ctx.drawImage(buffers.mid, 0, 0, w, h)
}

/** Full-image blur/pixelate pass, memoised per effect+strength. */
export function getEffectCanvas(
  img: Source,
  effect: FilterEffect,
  strength: number,
  cache: EffectCache,
): HTMLCanvasElement {
  const key = `${effect}:${strength}`
  const cached = cache.get(key)
  if (cached) return cached
  const { w, h } = sizeOf(img)
  const out = makeCanvas(w, h)
  drawEffect(out, makeBuffers(), img, effect, strength)
  cache.set(key, out)
  return out
}

function traceShape(ctx: CanvasRenderingContext2D, shape: CensorShape) {
  ctx.beginPath()
  if (shape.kind === 'rect') {
    // Normalise: dragging up or left produces negative width/height.
    const x = shape.w < 0 ? shape.x + shape.w : shape.x
    const y = shape.h < 0 ? shape.y + shape.h : shape.y
    ctx.rect(x, y, Math.abs(shape.w), Math.abs(shape.h))
    return
  }
  const dab = (x: number, y: number) => {
    ctx.moveTo(x + shape.size, y)
    ctx.arc(x, y, shape.size, 0, Math.PI * 2)
  }
  // Pointer events are sparse on a fast stroke; without filling the gaps the
  // brush leaves uncensored holes between samples.
  const step = Math.max(1, shape.size / 2)
  shape.points.forEach((p, i) => {
    const prev = shape.points[i - 1]
    if (prev) {
      const distance = Math.hypot(p.x - prev.x, p.y - prev.y)
      for (let d = step; d < distance; d += step) {
        dab(prev.x + ((p.x - prev.x) * d) / distance, prev.y + ((p.y - prev.y) * d) / distance)
      }
    }
    dab(p.x, p.y)
  })
}

function paintShape(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  shape: CensorShape,
  effectFor: (effect: FilterEffect, strength: number) => HTMLCanvasElement,
  coordScale = 1,
) {
  ctx.save()
  ctx.setTransform(coordScale, 0, 0, coordScale, 0, 0)
  traceShape(ctx, shape)
  ctx.clip()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  if (shape.effect === 'black') {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
  } else {
    ctx.drawImage(effectFor(shape.effect, shape.strength), 0, 0, w, h)
  }
  ctx.restore()
}

/** Redacted copy at the image's own resolution; this is what gets uploaded. */
export function composeCensored(img: Source, shapes: CensorShape[], cache: EffectCache): HTMLCanvasElement {
  const { w, h } = sizeOf(img)
  const out = makeCanvas(w, h)
  const ctx = out.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  for (const shape of shapes) {
    paintShape(ctx, w, h, shape, (effect, strength) => getEffectCanvas(img, effect, strength, cache))
  }
  return out
}

/** H.264 needs even dimensions; the long side is capped so phone encoders can keep up. */
export function censorOutputSize(videoWidth: number, videoHeight: number) {
  const scale = Math.min(1, 1920 / Math.max(videoWidth, videoHeight))
  const even = (n: number) => Math.max(2, Math.round((n * scale) / 2) * 2)
  return { width: even(videoWidth), height: even(videoHeight) }
}

/** A shape reaching either end of the clip must also cover frames just past the measured duration. */
export function isShapeActive(shape: TimedCensorShape, time: number, duration: number): boolean {
  const from = shape.start <= 0.01 ? -Infinity : shape.start - 0.04
  const to = shape.end >= duration - 0.01 ? Infinity : shape.end + 0.04
  return time >= from && time <= to
}

/**
 * Reusable per-frame renderer. A clip has thousands of frames, so canvases are
 * pooled rather than allocated per frame, which phones cannot keep up with.
 * `coordScale` maps shape coordinates onto this renderer's size.
 */
export function createFrameRenderer(w: number, h: number, coordScale = 1) {
  const output = makeCanvas(w, h)
  const ctx = output.getContext('2d')!
  const pool = new Map<string, { out: HTMLCanvasElement; buffers: Buffers }>()

  return {
    canvas: output,
    render(source: CanvasImageSource, shapes: CensorShape[]) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(source, 0, 0, w, h)
      const fresh = new Set<string>()
      const effectFor = (effect: FilterEffect, strength: number) => {
        const key = `${effect}:${strength}`
        let entry = pool.get(key)
        if (!entry) {
          entry = { out: makeCanvas(w, h), buffers: makeBuffers() }
          pool.set(key, entry)
        }
        if (!fresh.has(key)) {
          drawEffect(entry.out, entry.buffers, source, effect, strength)
          fresh.add(key)
        }
        return entry.out
      }
      for (const shape of shapes) paintShape(ctx, w, h, shape, effectFor, coordScale)
      return output
    },
  }
}
