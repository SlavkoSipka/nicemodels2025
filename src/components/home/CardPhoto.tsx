'use client'

import { useState, type ReactNode } from 'react'
import Image from 'next/image'

const BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFERIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqd2uUi3zVNNJSpCk5BKiQc+eMCrLSLFHiulDzilEeKlE4/p4oopVJGKXY//Z'

interface CardPhotoProps {
  src: string
  alt: string
  sizes: string
  quality: number
  className: string
  priority?: boolean
  /** Shown when the photo cannot be loaded at all. */
  fallback: ReactNode
}

/**
 * Card photo that recovers from a failed load. next/image does not retry, so
 * on error it loads the storage URL directly (bypassing the image CDN) and,
 * if that fails too, renders the fallback.
 */
export default function CardPhoto({ src, alt, sizes, quality, className, priority = false, fallback }: CardPhotoProps) {
  const [attempt, setAttempt] = useState<'optimized' | 'direct' | 'failed'>('optimized')

  if (attempt === 'failed') return <>{fallback}</>

  return (
    <Image
      key={attempt}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      fetchPriority={priority ? 'high' : 'auto'}
      quality={quality}
      unoptimized={attempt === 'direct'}
      placeholder="blur"
      blurDataURL={BLUR}
      className={className}
      onError={() => setAttempt(a => (a === 'optimized' ? 'direct' : 'failed'))}
    />
  )
}
