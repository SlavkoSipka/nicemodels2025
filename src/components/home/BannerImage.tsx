'use client'

import Image from 'next/image'

interface BannerImageProps {
  src: string
  alt: string
  /** next/image sizes hint (ignored when `plain`). */
  sizes?: string
  priority?: boolean
  quality?: number
  blurDataURL?: string
  /** Use a plain <img> instead of next/image (for blob/object-URL previews). */
  plain?: boolean
  /** Apply a subtle hover zoom on the foreground image. */
  hoverScale?: boolean
}

/**
 * Banner image that ALWAYS shows the full picture (never cropped):
 *  - background layer: same image, cover + heavy blur, fills the slot
 *  - foreground layer: same image, contain, fully visible and centered
 *
 * The parent element must be `relative`, `overflow-hidden`, and define the
 * slot size (e.g. via aspect-ratio). This component fills that parent.
 */
export default function BannerImage({
  src,
  alt,
  sizes,
  priority = false,
  quality = 85,
  blurDataURL,
  plain = false,
  hoverScale = false,
}: BannerImageProps) {
  const fgClass = `object-contain transition-transform duration-500${
    hoverScale ? ' group-hover:scale-[1.02]' : ''
  }`

  if (plain) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={`absolute inset-0 w-full h-full ${fgClass}`} />
      </>
    )
  }

  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes={sizes}
        quality={40}
        className="object-cover scale-110 blur-xl opacity-60"
      />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={quality}
        placeholder={blurDataURL ? 'blur' : undefined}
        blurDataURL={blurDataURL}
        className={fgClass}
      />
    </>
  )
}
