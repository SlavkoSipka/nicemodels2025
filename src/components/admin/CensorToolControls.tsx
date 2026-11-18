'use client'

import { useTranslations } from 'next-intl'
import { Square, Brush, Droplets, Grid3x3, Ban } from 'lucide-react'
import type { CensorEffect } from '@/lib/censorCanvas'

export type CensorTool = 'rect' | 'brush'

interface Props {
  effect: CensorEffect
  onEffect: (effect: CensorEffect) => void
  tool: CensorTool
  onTool: (tool: CensorTool) => void
  strength: number
  onStrength: (value: number) => void
  brushSize: number
  onBrushSize: (value: number) => void
}

export default function CensorToolControls({
  effect, onEffect, tool, onTool, strength, onStrength, brushSize, onBrushSize,
}: Props) {
  const t = useTranslations('admin.photoCensor')

  const effectBtn = (value: CensorEffect, Icon: typeof Droplets, label: string) => (
    <button
      type="button"
      onClick={() => onEffect(value)}
      className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
        effect === value ? 'bg-brand text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
      }`}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  )

  const toolBtn = (value: CensorTool, Icon: typeof Square, label: string) => (
    <button
      type="button"
      onClick={() => onTool(value)}
      className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
        tool === value ? 'bg-white text-neutral-900' : 'bg-white/10 text-white/70 hover:bg-white/20'
      }`}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  )

  return (
    <>
      <div className="flex gap-1.5">
        {effectBtn('blur', Droplets, t('blur'))}
        {effectBtn('pixelate', Grid3x3, t('pixelate'))}
        {effectBtn('black', Ban, t('blackBar'))}
      </div>

      <div className="flex gap-1.5">
        {toolBtn('rect', Square, t('rectangle'))}
        {toolBtn('brush', Brush, t('brush'))}
      </div>

      {effect !== 'black' && (
        <label className="block">
          <span className="text-[11px] font-semibold text-white/60">{t('strength')}</span>
          <input type="range" min={30} max={100} value={strength}
            onChange={e => onStrength(Number(e.target.value))}
            className="w-full accent-brand" />
        </label>
      )}

      {tool === 'brush' && (
        <label className="block">
          <span className="text-[11px] font-semibold text-white/60">{t('brushSize')}</span>
          <input type="range" min={3} max={40} value={brushSize}
            onChange={e => onBrushSize(Number(e.target.value))}
            className="w-full accent-brand" />
        </label>
      )}
    </>
  )
}
