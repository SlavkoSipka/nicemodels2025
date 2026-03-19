'use client'

import { useEffect, useRef } from 'react'

const UPDATE_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes
const MIN_DISTANCE_M = 500 // only send update if moved >500 m

function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function sendLocation(lat: number, lng: number) {
  try {
    await fetch('/api/update-live-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
    })
  } catch {
    // network error – will retry on next cycle
  }
}

export default function LiveLocationWatcher() {
  const lastSent = useRef<{ lat: number; lng: number; ts: number } | null>(null)

  useEffect(() => {
    if (!('geolocation' in navigator)) return

    let watchId: number | null = null

    const handlePosition = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords
      const now = Date.now()
      const prev = lastSent.current

      const movedEnough =
        !prev || haversineMeters(prev.lat, prev.lng, latitude, longitude) > MIN_DISTANCE_M
      const timedOut = !prev || now - prev.ts > UPDATE_INTERVAL_MS

      if (movedEnough || timedOut) {
        lastSent.current = { lat: latitude, lng: longitude, ts: now }
        sendLocation(latitude, longitude)
      }
    }

    try {
      watchId = navigator.geolocation.watchPosition(handlePosition, () => {}, {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 30_000,
      })
    } catch {
      // geolocation not available
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return null
}
