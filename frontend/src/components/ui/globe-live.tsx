import { useEffect, useRef, useState, type CSSProperties } from 'react'
import createGlobe from 'cobe'
import { Globe2, Pause, Play } from 'lucide-react'

export interface GlobeMarker { id: string; location: [number, number]; size?: number }
interface Props { markers?: GlobeMarker[]; className?: string; speed?: number; onMarkerClick?: (id: string) => void; getMarkerLabel?: (id: string) => string; showLiveBadge?: boolean }
const EMPTY: GlobeMarker[] = []
const anchors = typeof CSS !== 'undefined' && CSS.supports('anchor-name: --a') && CSS.supports('top: anchor(top)')

export function GlobeLive({ markers = EMPTY, className = '', speed = 0.0015, onMarkerClick, getMarkerLabel }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const rotation = useRef(0)
  const dragging = useRef<{ x: number; phi: number } | null>(null)
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const element = canvas.current
    if (!element) return
    let globe: ReturnType<typeof createGlobe> | null = null
    let frame = 0
    let visible = true
    let previous = 0
    let phi = 0
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const size = () => Math.max(element.clientWidth, 1) * Math.min(devicePixelRatio, 1.5)
    try {
      globe = createGlobe(element, { devicePixelRatio: Math.min(devicePixelRatio, 1.5), width: size(), height: size(), phi: 0, theta: 0.25, dark: 0, diffuse: 1.2, mapSamples: 14000, mapBrightness: 5, baseColor: [0.78, 0.8, 0.66], markerColor: [0.78, 0.27, 0.15], glowColor: [0.93, 0.935, 0.89], markers: markers.map((m) => ({ ...m, size: m.size ?? 0.035 })) })
    } catch { setFailed(true); return }
    const render = (time: number) => {
      frame = requestAnimationFrame(render)
      if (!visible || document.hidden || time - previous < 30) return
      previous = time
      if (!pausedRef.current && !dragging.current && !motion.matches) phi += speed
      globe?.update({ phi: phi + rotation.current })
    }
    const resize = new ResizeObserver(() => globe?.update({ width: size(), height: size() }))
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    resize.observe(element); intersection.observe(element)
    const contextLost = (e: Event) => { e.preventDefault(); setFailed(true); cancelAnimationFrame(frame) }
    element.addEventListener('webglcontextlost', contextLost)
    frame = requestAnimationFrame(render)
    return () => { cancelAnimationFrame(frame); resize.disconnect(); intersection.disconnect(); element.removeEventListener('webglcontextlost', contextLost); globe?.destroy() }
  }, [markers, speed])
  return <div className={`relative aspect-square ${className}`}>
    {failed ? <div className="flex h-full flex-col items-center justify-center text-gray-500"><Globe2 size={120} strokeWidth={0.5} /><p className="mt-4 text-xs">The globe isn’t supported by this browser.<br />You can still choose any destination below.</p></div> : <canvas ref={canvas} className="h-full w-full cursor-grab rounded-full [touch-action:pan-y]" tabIndex={0} role="img" aria-label="Interactive destination globe. Drag horizontally or use left and right arrow keys to rotate."
      onKeyDown={(e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); rotation.current += e.key === 'ArrowLeft' ? -0.2 : 0.2 } }}
      onPointerDown={(e) => { dragging.current = { x: e.clientX, phi: rotation.current }; e.currentTarget.setPointerCapture(e.pointerId) }}
      onPointerMove={(e) => { if (dragging.current) rotation.current = dragging.current.phi + (e.clientX - dragging.current.x) / 180 }}
      onPointerUp={() => { dragging.current = null }} onPointerCancel={() => { dragging.current = null }} />}
    {!failed && onMarkerClick && anchors && markers.map((m) => <button key={m.id} aria-label={getMarkerLabel?.(m.id) ?? m.id} onClick={() => onMarkerClick(m.id)} className="absolute h-6 w-6 rounded-full hover:ring-2 hover:ring-sky-500" style={{ positionAnchor: `--cobe-${m.id}`, left: 'anchor(center)', top: 'anchor(center)', translate: '-50% -50%', display: `var(--cobe-visible-${m.id}, none)` } as CSSProperties} />)}
    {!failed && <button className="absolute bottom-0 right-0 rounded-full border border-gray-300 p-2 text-gray-500" aria-label={paused ? 'Animate globe' : 'Pause globe animation'} onClick={() => { pausedRef.current = !paused; setPaused(!paused) }}>{paused ? <Play size={12} /> : <Pause size={12} />}</button>}
  </div>
}
