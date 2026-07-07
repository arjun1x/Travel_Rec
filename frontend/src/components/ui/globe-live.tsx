import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import createGlobe from 'cobe'

export interface GlobeMarker {
  id: string
  location: [number, number] // [lat, lng]
  size?: number
}

interface GlobeLiveProps {
  markers?: GlobeMarker[]
  className?: string
  speed?: number
  /** When set, front-facing markers become clickable hotspots (CSS Anchor
   *  Positioning — cobe v2 publishes a `--cobe-{id}` anchor per marker). */
  onMarkerClick?: (id: string) => void
  getMarkerLabel?: (id: string) => string
  showLiveBadge?: boolean
}

const supportsAnchors =
  typeof CSS !== 'undefined' &&
  CSS.supports('anchor-name: --a') &&
  CSS.supports('top: anchor(top)')

const DEFAULT_MARKERS: GlobeMarker[] = [
  { id: 'sf', location: [37.78, -122.44] },
  { id: 'london', location: [51.51, -0.13] },
  { id: 'tokyo', location: [35.68, 139.65] },
  { id: 'paris', location: [48.86, 2.35] },
  { id: 'sydney', location: [-33.87, 151.21] },
  { id: 'nyc', location: [40.71, -74.01] },
]

function usePrefersDark(): boolean {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setIsDark(e.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return isDark
}

export function GlobeLive({
  markers = DEFAULT_MARKERS,
  className = '',
  speed = 0.004,
  onMarkerClick,
  getMarkerLabel,
  showLiveBadge = true,
}: GlobeLiveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragStart = useRef<{ x: number; phi: number } | null>(null)
  const phiExtra = useRef(0)
  const pausedRef = useRef(false)
  const isDark = usePrefersDark()
  const [viewers, setViewers] = useState(2847)

  // playful "live travelers" counter — random walk, clamped
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers((v) => Math.max(500, v + Math.floor(Math.random() * 31) - 14))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const onPointerDown = (e: ReactPointerEvent) => {
    dragStart.current = { x: e.clientX, phi: phiExtra.current }
    pausedRef.current = true
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
  }

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (dragStart.current !== null) {
        phiExtra.current = dragStart.current.phi + (e.clientX - dragStart.current.x) / 200
      }
    }
    const onPointerUp = () => {
      dragStart.current = null
      pausedRef.current = false
      if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId = 0
    let phi = 0

    const init = () => {
      if (globe || canvas.offsetWidth === 0) return
      const width = canvas.offsetWidth
      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width: width * 2,
        height: width * 2,
        phi: 0,
        theta: 0.22,
        dark: isDark ? 1 : 0,
        diffuse: 1.4,
        mapSamples: 16000,
        mapBrightness: isDark ? 7 : 10,
        baseColor: isDark ? [0.25, 0.31, 0.44] : [0.94, 0.95, 0.97],
        markerColor: isDark ? [0.25, 0.75, 1] : [0.05, 0.55, 0.92],
        glowColor: isDark ? [0.06, 0.1, 0.18] : [0.9, 0.94, 1],
        markers: markers.map((m) => ({
          location: m.location,
          size: m.size ?? 0.04,
          id: m.id,
        })),
      })
      const animate = () => {
        if (!pausedRef.current) phi += speed
        globe!.update({ phi: phi + phiExtra.current })
        animationId = requestAnimationFrame(animate)
      }
      animate()
      requestAnimationFrame(() => {
        canvas.style.opacity = '1'
      })
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const ro = new ResizeObserver((entries) => {
        if ((entries[0]?.contentRect.width ?? 0) > 0) {
          ro.disconnect()
          init()
        }
      })
      ro.observe(canvas)
    }

    return () => {
      cancelAnimationFrame(animationId)
      globe?.destroy()
    }
  }, [markers, speed, isDark])

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        aria-label="Interactive globe showing destinations"
        className="h-full w-full cursor-grab rounded-full opacity-0 transition-opacity duration-1000 [touch-action:none]"
      />
      {onMarkerClick &&
        supportsAnchors &&
        markers.map((m) => (
          <button
            key={m.id}
            aria-label={getMarkerLabel?.(m.id) ?? m.id}
            title={getMarkerLabel?.(m.id)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onMarkerClick(m.id)}
            className="absolute cursor-pointer rounded-full transition-colors duration-150 hover:bg-sky-400/40 hover:ring-2 hover:ring-sky-400"
            style={
              {
                positionAnchor: `--cobe-${m.id}`,
                left: 'anchor(center)',
                top: 'anchor(center)',
                translate: '-50% -50%',
                width: 22,
                height: 22,
                // cobe sets --cobe-visible-{id} to an intentionally-invalid value
                // while the marker faces the camera (property → initial = shown)
                // and deletes it when it rotates behind (fallback → none)
                display: `var(--cobe-visible-${m.id}, none)`,
              } as React.CSSProperties
            }
          />
        ))}
      {showLiveBadge && (
        <div className="pointer-events-none absolute right-2 top-4 flex items-center gap-2 rounded-full bg-gray-900/90 px-3.5 py-1.5 shadow-lg backdrop-blur dark:bg-gray-800/90 sm:right-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-red-400">
            Live
          </span>
          <span className="border-l border-white/20 pl-2 text-xs text-gray-200">
            {viewers.toLocaleString()} exploring now
          </span>
        </div>
      )}
    </div>
  )
}
