'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  X, Square, Brush, Undo2, Trash2, Save, RotateCcw, Loader2, AlertCircle, Droplets, Grid3x3, Ban,
} from 'lucide-react'
import { encodeCanvas } from '@/lib/imageProcessor'
import {
  composeCensored, type CensorEffect, type CensorShape, type EffectCache,
} from '@/lib/censorCanvas'

type Effect = CensorEffect
type Tool = 'rect' | 'brush'
type Shape = CensorShape

interface Props {
  ownerType: 'model' | 'club'
  mediaId: string
  fileName: string
  onClose: () => void
  onSaved: (url: string, filePath: string) => void
}

export default function AdminPhotoCensorModal({ ownerType, mediaId, fileName, onClose, onSaved }: Props) {
  const t = useTranslations('admin.photoCensor')

  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState('')
  const [hasOriginal, setHasOriginal] = useState(false)

  const [shapes, setShapes] = useState<Shape[]>([])
  const [tool, setTool] = useState<Tool>('rect')
  const [effect, setEffect] = useState<Effect>('blur')
  const [strength, setStrength] = useState(75)
  const [brushSize, setBrushSize] = useState(12)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const draftRef = useRef<Shape | null>(null)
  const drawingRef = useRef(false)
  // One blur/pixelate pass per effect+strength, shared by every shape.
  const effectCacheRef = useRef<EffectCache>(new Map())

  // ── Load the image same-origin so the canvas stays untainted ──
  useEffect(() => {
    let revoked = ''
    let cancelled = false
    const load = async () => {
      try {
        const [imgRes, metaRes] = await Promise.all([
          fetch(`/api/admin/photo-censor?ownerType=${ownerType}&mediaId=${mediaId}`, { cache: 'no-store' }),
          fetch(`/api/admin/photo-censor?ownerType=${ownerType}&mediaId=${mediaId}&meta=1`, { cache: 'no-store' }),
        ])
        if (!imgRes.ok) throw new Error((await imgRes.json().catch(() => ({}))).error || t('loadFailed'))
        const meta = metaRes.ok ? await metaRes.json() : { hasOriginal: false }
        const blob = await imgRes.blob()
        const url = URL.createObjectURL(blob)
        revoked = url
        const img = new window.Image()
        img.onload = () => {
          if (cancelled) return
          setImage(img)
          setHasOriginal(Boolean(meta.hasOriginal))
          setLoading(false)
        }
        img.onerror = () => { if (!cancelled) { setError(t('loadFailed')); setLoading(false) } }
        img.src = url
      } catch (e: any) {
        if (!cancelled) { setError(e?.message || t('loadFailed')); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true; if (revoked) URL.revokeObjectURL(revoked) }
  }, [ownerType, mediaId, t])

  // ── Render to the visible canvas ──
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!canvas || !stage || !image) return

    const { naturalWidth: iw, naturalHeight: ih } = image
    const box = stage.getBoundingClientRect()
    const scale = Math.min(box.width / iw, box.height / ih)
    const cssW = Math.max(1, Math.floor(iw * scale))
    const cssH = Math.max(1, Math.floor(ih * scale))
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`
    canvas.width = Math.floor(cssW * dpr)
    canvas.height = Math.floor(cssH * dpr)

    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cssW, cssH)

    const all = draftRef.current ? [...shapes, draftRef.current] : shapes
    const composed = composeCensored(image, all, effectCacheRef.current)
    ctx.drawImage(composed, 0, 0, cssW, cssH)

    // Outline the rectangle being dragged so the admin sees the target area.
    const draft = draftRef.current
    if (draft?.kind === 'rect') {
      ctx.save()
      ctx.strokeStyle = '#ec4899'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(draft.x * scale, draft.y * scale, draft.w * scale, draft.h * scale)
      ctx.restore()
    }
  }, [image, shapes])

  useEffect(() => { render() }, [render])

  useEffect(() => {
    const onResize = () => render()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [render])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // ── Pointer drawing (mouse + touch through the same path) ──
  const toImageCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const img = image!
    return {
      x: ((e.clientX - rect.left) / rect.width) * img.naturalWidth,
      y: ((e.clientY - rect.top) / rect.height) * img.naturalHeight,
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!image || saving) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const { x, y } = toImageCoords(e)
    const minDim = Math.min(image.naturalWidth, image.naturalHeight)
    draftRef.current = tool === 'rect'
      ? { kind: 'rect', effect, strength, x, y, w: 0, h: 0 }
      : { kind: 'brush', effect, strength, size: (brushSize / 100) * minDim * 0.5, points: [{ x, y }] }
    render()
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !draftRef.current || !image) return
    const { x, y } = toImageCoords(e)
    const draft = draftRef.current
    if (draft.kind === 'rect') {
      draft.w = x - draft.x
      draft.h = y - draft.y
    } else {
      draft.points.push({ x, y })
    }
    render()
  }

  const onPointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const draft = draftRef.current
    draftRef.current = null
    if (!draft) { render(); return }
    // Ignore stray taps that would otherwise stack invisible shapes.
    const tooSmall = draft.kind === 'rect' && (Math.abs(draft.w) < 4 || Math.abs(draft.h) < 4)
    if (tooSmall) { render(); return }
    setShapes(prev => [...prev, draft])
  }

  const handleSave = async () => {
    if (!image || shapes.length === 0) return
    setSaving(true); setError('')
    try {
      const composed = composeCensored(image, shapes, effectCacheRef.current)
      const base = fileName.replace(/\.[^.]+$/, '') || 'photo'
      const file = await encodeCanvas(composed, base)
      const fd = new FormData()
      fd.append('ownerType', ownerType)
      fd.append('mediaId', mediaId)
      fd.append('file', file)
      const res = await fetch('/api/admin/photo-censor', { method: 'POST', body: fd })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || t('saveFailed'))
      onSaved(json.url, json.filePath)
    } catch (e: any) {
      setError(e?.message || t('saveFailed'))
      setSaving(false)
    }
  }

  const handleRestore = async () => {
    if (!confirm(t('confirmRestore'))) return
    setRestoring(true); setError('')
    try {
      const res = await fetch('/api/admin/photo-censor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerType, mediaId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || t('restoreFailed'))
      onSaved(json.url, json.filePath)
    } catch (e: any) {
      setError(e?.message || t('restoreFailed'))
      setRestoring(false)
    }
  }

  const effectBtn = (value: Effect, Icon: typeof Droplets, label: string) => (
    <button
      type="button"
      onClick={() => setEffect(value)}
      className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
        effect === value ? 'bg-brand text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
      }`}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  )

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{t('title')}</p>
          <p className="text-[11px] text-white/50 truncate">{t('subtitle')}</p>
        </div>
        <button type="button" onClick={onClose} disabled={saving || restoring}
          className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mx-3 mt-2 flex items-start gap-2 rounded-lg bg-red-500/15 border border-red-500/30 px-3 py-2 shrink-0">
          <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
          <p className="text-xs text-red-100">{error}</p>
        </div>
      )}

      {/* Canvas stage */}
      <div ref={stageRef} className="flex-1 min-h-0 flex items-center justify-center p-2 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-white/60">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-xs">{t('loading')}</p>
          </div>
        ) : image ? (
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="touch-none rounded-lg shadow-2xl cursor-crosshair"
          />
        ) : null}
      </div>

      {/* Toolbar */}
      <div className="shrink-0 border-t border-white/10 bg-neutral-900 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2.5">
        <div className="flex gap-1.5">
          {effectBtn('blur', Droplets, t('blur'))}
          {effectBtn('pixelate', Grid3x3, t('pixelate'))}
          {effectBtn('black', Ban, t('blackBar'))}
        </div>

        <div className="flex gap-1.5">
          <button type="button" onClick={() => setTool('rect')}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
              tool === 'rect' ? 'bg-white text-neutral-900' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}>
            <Square className="w-3.5 h-3.5" /> {t('rectangle')}
          </button>
          <button type="button" onClick={() => setTool('brush')}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
              tool === 'brush' ? 'bg-white text-neutral-900' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}>
            <Brush className="w-3.5 h-3.5" /> {t('brush')}
          </button>
        </div>

        {effect !== 'black' && (
          <label className="block">
            <span className="text-[11px] font-semibold text-white/60">{t('strength')}</span>
            <input type="range" min={30} max={100} value={strength}
              onChange={e => setStrength(Number(e.target.value))}
              className="w-full accent-brand" />
          </label>
        )}

        {tool === 'brush' && (
          <label className="block">
            <span className="text-[11px] font-semibold text-white/60">{t('brushSize')}</span>
            <input type="range" min={3} max={40} value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              className="w-full accent-brand" />
          </label>
        )}

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setShapes(prev => prev.slice(0, -1))}
            disabled={shapes.length === 0 || saving}
            className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-30">
            <Undo2 className="w-3.5 h-3.5" /> {t('undo')}
          </button>
          <button type="button" onClick={() => setShapes([])}
            disabled={shapes.length === 0 || saving}
            className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-30">
            <Trash2 className="w-3.5 h-3.5" /> {t('clear')}
          </button>
          {hasOriginal && (
            <button type="button" onClick={handleRestore} disabled={saving || restoring}
              className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 disabled:opacity-40">
              {restoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              {t('restore')}
            </button>
          )}
          <button type="button" onClick={handleSave}
            disabled={shapes.length === 0 || saving || restoring || loading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-hover disabled:opacity-40">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? t('saving') : t('save')}
          </button>
        </div>

        <p className="text-[10px] text-white/40 text-center">
          {shapes.length === 0 ? t('hintEmpty') : t('hintCount', { count: shapes.length })}
        </p>
      </div>
    </div>
  )
}
