'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  X, Undo2, Trash2, Save, RotateCcw, Loader2, AlertCircle, Play, Pause, CornerDownRight, CornerDownLeft, Maximize2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  createFrameRenderer, isShapeActive, type CensorEffect, type CensorShape, type TimedCensorShape,
  censorOutputSize,
} from '@/lib/censorCanvas'
import CensorToolControls, { type CensorTool } from './CensorToolControls'

interface Props {
  ownerType: 'model' | 'club'
  mediaId: string
  onClose: () => void
  onSaved: (url: string, filePath: string) => void
}

type Phase = 'idle' | 'processing' | 'uploading' | 'finishing' | 'restoring'

const API = '/api/admin/video-censor'

function formatTime(seconds: number) {
  const s = Math.max(0, seconds)
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`
}

async function postJson(body: Record<string, unknown>, fallback: string) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || fallback)
  return json
}

export default function AdminVideoCensorModal({ ownerType, mediaId, onClose, onSaved }: Props) {
  const t = useTranslations('admin.videoCensor')
  const tp = useTranslations('admin.photoCensor')

  const [blob, setBlob] = useState<Blob | null>(null)
  const [objectUrl, setObjectUrl] = useState('')
  const [fileName, setFileName] = useState('video')
  const [hasOriginal, setHasOriginal] = useState(false)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const [duration, setDuration] = useState(0)
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)

  const [shapes, setShapes] = useState<TimedCensorShape[]>([])
  const [rangeStart, setRangeStart] = useState(0)
  const [rangeEnd, setRangeEnd] = useState<number | null>(null)
  const [tool, setTool] = useState<CensorTool>('rect')
  const [effect, setEffect] = useState<CensorEffect>('blur')
  const [strength, setStrength] = useState(75)
  const [brushSize, setBrushSize] = useState(12)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const draftRef = useRef<TimedCensorShape | null>(null)
  const drawingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const rendererRef = useRef<{ key: string; renderer: ReturnType<typeof createFrameRenderer>; scale: number } | null>(null)

  const end = rangeEnd ?? duration
  const busy = phase !== 'idle'

  useEffect(() => {
    let cancelled = false
    let created = ''
    ;(async () => {
      try {
        const metaRes = await fetch(`${API}?ownerType=${ownerType}&mediaId=${mediaId}`, { cache: 'no-store' })
        const meta = await metaRes.json().catch(() => ({}))
        if (!metaRes.ok) throw new Error(meta.error || t('loadFailed'))
        // A local copy makes seeking exact and keeps the canvas untainted.
        const fileRes = await fetch(meta.url, { cache: 'no-store' })
        if (!fileRes.ok) throw new Error(t('loadFailed'))
        const data = await fileRes.blob()
        if (cancelled) return
        created = URL.createObjectURL(data)
        setBlob(data)
        setObjectUrl(created)
        setFileName(meta.fileName || 'video')
        setHasOriginal(Boolean(meta.hasOriginal))
      } catch (e: any) {
        if (!cancelled) { setError(e?.message || t('loadFailed')); setLoading(false) }
      }
    })()
    return () => { cancelled = true; if (created) URL.revokeObjectURL(created) }
  }, [ownerType, mediaId, t])

  const render = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const stage = stageRef.current
    if (!video || !canvas || !stage || !size || video.readyState < 2) return

    const box = stage.getBoundingClientRect()
    const fit = Math.min((box.width - 8) / size.width, (box.height - 8) / size.height)
    const cssW = Math.max(1, Math.floor(size.width * fit))
    const cssH = Math.max(1, Math.floor(size.height * fit))
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const pw = Math.max(2, Math.floor(cssW * dpr))
    const ph = Math.max(2, Math.floor(cssH * dpr))
    const key = `${pw}x${ph}`
    if (rendererRef.current?.key !== key) {
      rendererRef.current = { key, renderer: createFrameRenderer(pw, ph, pw / size.width), scale: pw / size.width }
    }
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`
    if (canvas.width !== pw) canvas.width = pw
    if (canvas.height !== ph) canvas.height = ph

    const now = video.currentTime
    const list: CensorShape[] = shapes.filter(s => isShapeActive(s, now, video.duration))
    if (draftRef.current) list.push(draftRef.current)
    const { renderer, scale } = rendererRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(renderer.render(video, list), 0, 0)

    const draft = draftRef.current
    if (draft?.kind === 'rect') {
      ctx.save()
      ctx.strokeStyle = '#ec4899'
      ctx.lineWidth = 2 * dpr
      ctx.setLineDash([6 * dpr, 4 * dpr])
      ctx.strokeRect(draft.x * scale, draft.y * scale, draft.w * scale, draft.h * scale)
      ctx.restore()
    }
  }, [shapes, size])

  useEffect(() => { render() }, [render])

  useEffect(() => {
    window.addEventListener('resize', render)
    return () => window.removeEventListener('resize', render)
  }, [render])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    const tick = () => {
      render()
      if (videoRef.current) setTime(videoRef.current.currentTime)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, render])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  useEffect(() => {
    if (!busy) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [busy])

  useEffect(() => () => abortRef.current?.abort(), [])

  const seek = (value: number) => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    video.currentTime = Math.min(value, Math.max(0, video.duration - 0.001))
    setTime(value)
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play()
    else video.pause()
  }

  const toCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * size!.width,
      y: ((e.clientY - rect.top) / rect.height) * size!.height,
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const video = videoRef.current
    if (!video || !size || busy) return
    video.pause()
    // A shape drawn outside its own time range would be invisible while drawing.
    if (video.currentTime < rangeStart - 0.05 || video.currentTime > end + 0.05) {
      seek(rangeStart)
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const { x, y } = toCoords(e)
    const range = { start: rangeStart, end }
    draftRef.current = tool === 'rect'
      ? { kind: 'rect', effect, strength, x, y, w: 0, h: 0, ...range }
      : {
          kind: 'brush', effect, strength, points: [{ x, y }], ...range,
          size: (brushSize / 100) * Math.min(size.width, size.height) * 0.5,
        }
    render()
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const draft = draftRef.current
    if (!drawingRef.current || !draft) return
    const { x, y } = toCoords(e)
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
    if (draft && !(draft.kind === 'rect' && (Math.abs(draft.w) < 4 || Math.abs(draft.h) < 4))) {
      setShapes(prev => [...prev, draft])
    } else {
      render()
    }
  }

  const handleSave = async () => {
    if (!blob || !size || shapes.length === 0) return
    setPhase('processing'); setProgress(0); setError('')
    const controller = new AbortController()
    abortRef.current = controller
    let wakeLock: { release: () => Promise<void> } | null = null
    try {
      videoRef.current?.pause()
      wakeLock = await (navigator as any).wakeLock?.request('screen').catch(() => null)
      const { censorVideo } = await import('@/lib/censorVideo')
      const { file, audioDropped } = await censorVideo({
        blob, ...size, duration, shapes, fileName, signal: controller.signal, onProgress: setProgress,
      })
      if (audioDropped && !confirm(t('audioLost'))) { setPhase('idle'); return }

      setPhase('uploading')
      const slot = await postJson({ action: 'prepare', ownerType, mediaId }, t('saveFailed'))
      const { error: uploadError } = await createClient().storage
        .from(slot.bucket)
        .uploadToSignedUrl(slot.path, slot.token, file, { contentType: 'video/mp4', cacheControl: '31536000' })
      if (uploadError) throw new Error(uploadError.message)

      setPhase('finishing')
      const done = await postJson({ action: 'commit', ownerType, mediaId, path: slot.path }, t('saveFailed'))
      onSaved(done.url, done.filePath)
    } catch (e: any) {
      setPhase('idle')
      if (controller.signal.aborted) return
      const code = e?.code as string | undefined
      setError(code === 'encoder' ? t('unsupportedBrowser')
        : code === 'format' ? t('unsupportedVideo')
        : code === 'tooLarge' ? t('tooLarge')
        : e?.message || t('saveFailed'))
    } finally {
      abortRef.current = null
      void wakeLock?.release().catch(() => {})
    }
  }

  const handleRestore = async () => {
    if (!confirm(t('confirmRestore'))) return
    setPhase('restoring'); setError('')
    try {
      const res = await fetch(API, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerType, mediaId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || tp('restoreFailed'))
      onSaved(json.url, json.filePath)
    } catch (e: any) {
      setError(e?.message || tp('restoreFailed'))
      setPhase('idle')
    }
  }

  const percent = Math.round(progress * 100)
  const pct = (value: number) => (duration ? `${(value / duration) * 100}%` : '0%')
  const wholeClip = rangeStart <= 0.01 && end >= duration - 0.01
  const rangeBtn = 'flex-1 flex items-center justify-center gap-1 px-1.5 py-2 rounded-lg text-[11px] font-bold bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-30'

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col bg-neutral-900">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/10 shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{t('title')}</p>
          <p className="text-[11px] text-white/50 truncate">{t('subtitle')}</p>
        </div>
        <button type="button" onClick={onClose} disabled={busy} aria-label={t('close')}
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

      <div ref={stageRef} className="relative flex-1 min-h-[140px] flex items-center justify-center p-1 overflow-hidden">
        {objectUrl && (
          <video
            ref={videoRef}
            src={objectUrl}
            muted
            playsInline
            preload="auto"
            className="absolute w-px h-px opacity-0 pointer-events-none"
            onLoadedMetadata={e => {
              const v = e.currentTarget
              setSize(censorOutputSize(v.videoWidth, v.videoHeight))
              setDuration(v.duration)
            }}
            onLoadedData={() => { setLoading(false); render() }}
            onSeeked={render}
            onPlay={() => setPlaying(true)}
            onPause={() => { setPlaying(false); render() }}
            onEnded={() => setPlaying(false)}
            onError={() => { setError(t('unsupportedVideo')); setLoading(false) }}
          />
        )}
        {loading && (
          <div className="flex flex-col items-center gap-2 text-white/60">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-xs">{t('loading')}</p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          hidden={loading || !size}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="touch-none rounded-lg shadow-2xl cursor-crosshair"
        />
        {busy && phase !== 'restoring' && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
            <p className="text-sm font-bold text-white">
              {phase === 'processing' ? t('processing', { percent }) : phase === 'uploading' ? t('uploading') : t('finishing')}
            </p>
            {phase === 'processing' && (
              <div className="w-full max-w-xs h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full bg-brand transition-[width]" style={{ width: `${percent}%` }} />
              </div>
            )}
            <p className="text-xs text-white/60">{t('keepOpen')}</p>
            {phase === 'processing' && (
              <button type="button" onClick={() => abortRef.current?.abort()}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/15 text-white hover:bg-white/25">
                {t('cancel')}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 max-h-[52vh] overflow-y-auto border-t border-white/10 bg-neutral-900 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2.5">
        <div className="flex items-center gap-2">
          <button type="button" onClick={togglePlay} disabled={loading || busy} aria-label={playing ? t('pause') : t('play')}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 shrink-0">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-white/10 pointer-events-none overflow-hidden">
              {shapes.map((s, i) => (
                <span key={i} className="absolute inset-y-0 bg-amber-400/50"
                  style={{ left: pct(s.start), width: `calc(${pct(s.end)} - ${pct(s.start)})` }} />
              ))}
              <span className="absolute inset-y-0 bg-brand/70"
                style={{ left: pct(rangeStart), width: `calc(${pct(end)} - ${pct(rangeStart)})` }} />
            </div>
            <input type="range" min={0} max={duration || 0} step={0.04} value={Math.min(time, duration || 0)}
              disabled={loading || busy} aria-label={t('timeline')}
              onChange={e => seek(Number(e.target.value))}
              className="relative w-full bg-transparent accent-white" />
          </div>
          <span className="text-[11px] tabular-nums text-white/60 shrink-0">{formatTime(time)}</span>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-white/60 mb-1">
            {wholeClip ? t('rangeWhole') : t('rangePart', { from: formatTime(rangeStart), to: formatTime(end) })}
          </p>
          <div className="flex gap-1.5">
            <button type="button" className={rangeBtn} disabled={loading || busy || time >= end}
              onClick={() => setRangeStart(time)}>
              <CornerDownRight className="w-3.5 h-3.5" /> {t('setStart')}
            </button>
            <button type="button" className={rangeBtn} disabled={loading || busy || time <= rangeStart}
              onClick={() => setRangeEnd(time)}>
              <CornerDownLeft className="w-3.5 h-3.5" /> {t('setEnd')}
            </button>
            <button type="button" className={rangeBtn} disabled={loading || busy || wholeClip}
              onClick={() => { setRangeStart(0); setRangeEnd(null) }}>
              <Maximize2 className="w-3.5 h-3.5" /> {t('wholeVideo')}
            </button>
          </div>
        </div>

        <CensorToolControls
          effect={effect} onEffect={setEffect}
          tool={tool} onTool={setTool}
          strength={strength} onStrength={setStrength}
          brushSize={brushSize} onBrushSize={setBrushSize}
        />

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setShapes(prev => prev.slice(0, -1))} disabled={shapes.length === 0 || busy}
            className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-30">
            <Undo2 className="w-3.5 h-3.5" /> {tp('undo')}
          </button>
          <button type="button" onClick={() => setShapes([])} disabled={shapes.length === 0 || busy}
            className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-30">
            <Trash2 className="w-3.5 h-3.5" /> {tp('clear')}
          </button>
          {hasOriginal && (
            <button type="button" onClick={handleRestore} disabled={busy}
              className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 disabled:opacity-40">
              {phase === 'restoring' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              {tp('restore')}
            </button>
          )}
          <button type="button" onClick={handleSave} disabled={shapes.length === 0 || busy || loading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-hover disabled:opacity-40">
            <Save className="w-4 h-4" /> {tp('save')}
          </button>
        </div>

        <p className="text-[10px] text-white/40 text-center">
          {shapes.length === 0 ? t('hintEmpty') : t('hintCount', { count: shapes.length })}
        </p>
      </div>
    </div>
  )
}
