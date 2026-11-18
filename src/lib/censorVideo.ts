import {
  ALL_FORMATS, BlobSource, BufferTarget, Conversion, ConversionCanceledError, Input, Mp4OutputFormat, Output,
  canEncodeVideo,
} from 'mediabunny'
import { createFrameRenderer, isShapeActive, type TimedCensorShape } from '@/lib/censorCanvas'

const MAX_OUTPUT_BYTES = 50 * 1024 * 1024
const AUDIO_ALLOWANCE_BPS = 192_000

export class VideoCensorError extends Error {
  constructor(public code: 'encoder' | 'format' | 'tooLarge') {
    super(code)
  }
}

export { ConversionCanceledError }

function targetBitrate(sourceBytes: number, duration: number) {
  const seconds = Math.max(duration, 1)
  const sourceRate = (sourceBytes * 8) / seconds
  const budget = ((MAX_OUTPUT_BYTES * 0.9) * 8) / seconds - AUDIO_ALLOWANCE_BPS
  return Math.round(Math.max(500_000, Math.min(sourceRate * 1.15, budget, 8_000_000)))
}

export async function censorVideo(options: {
  blob: Blob
  width: number
  height: number
  duration: number
  shapes: TimedCensorShape[]
  fileName: string
  signal: AbortSignal
  onProgress: (fraction: number) => void
}) {
  const { blob, width, height, duration, shapes, fileName, signal, onProgress } = options
  const bitrate = targetBitrate(blob.size, duration)
  if (!(await canEncodeVideo('avc', { width, height, bitrate }))) throw new VideoCensorError('encoder')

  const input = new Input({ source: new BlobSource(blob), formats: ALL_FORMATS })
  const target = new BufferTarget()
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target })

  const base = document.createElement('canvas')
  base.width = width
  base.height = height
  const baseCtx = base.getContext('2d')!
  const renderer = createFrameRenderer(width, height)
  let firstTimestamp: number | null = null

  const conversion = await Conversion.init({
    input,
    output,
    tracks: 'primary',
    showWarnings: false,
    video: {
      codec: 'avc',
      bitrate,
      width,
      height,
      fit: 'fill',
      forceTranscode: true,
      // Rotation must be baked into the pixels or the shapes would land rotated.
      allowTransformationMetadata: false,
      processedWidth: width,
      processedHeight: height,
      process: (sample) => {
        firstTimestamp ??= sample.timestamp
        const time = sample.timestamp - firstTimestamp
        sample.draw(baseCtx, 0, 0, width, height)
        return renderer.render(base, shapes.filter(s => isShapeActive(s, time, duration)))
      },
    },
  })

  if (!conversion.isValid || !conversion.utilizedTracks.some(t => t.isVideoTrack())) {
    throw new VideoCensorError('format')
  }
  const audioDropped = conversion.discardedTracks.some(d => d.track.isAudioTrack())

  const cancel = () => { void conversion.cancel() }
  if (signal.aborted) cancel()
  signal.addEventListener('abort', cancel, { once: true })
  conversion.onProgress = onProgress
  try {
    await conversion.execute()
  } finally {
    signal.removeEventListener('abort', cancel)
    input.dispose()
  }

  const buffer = target.buffer
  if (!buffer) throw new VideoCensorError('format')
  if (buffer.byteLength > MAX_OUTPUT_BYTES) throw new VideoCensorError('tooLarge')
  const baseName = fileName.replace(/\.[^.]+$/, '') || 'video'
  return { file: new File([buffer], `${baseName}.mp4`, { type: 'video/mp4' }), audioDropped }
}
