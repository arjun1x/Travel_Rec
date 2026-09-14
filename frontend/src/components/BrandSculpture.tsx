import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import BrandMark from './BrandMark'

/** Original extruded compass, rendered locally with no model or texture requests. */
export default function BrandSculpture() {
  const host = useRef<HTMLDivElement>(null)
  const rotation = useRef({ x: 0, y: 0 })
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el) return
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches) return
    let disposed = false
    let cleanup = () => {}
    void import('three').then((THREE) => {
      if (disposed) return
      let renderer: InstanceType<typeof THREE.WebGLRenderer>
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      } catch { return }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
      renderer.setClearColor(0x000000, 0)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.setSize(el.clientWidth, el.clientHeight)
      el.appendChild(renderer.domElement)
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(35, el.clientWidth / el.clientHeight, 0.1, 30)
      camera.position.set(0, 0, 8.3)
      scene.add(new THREE.HemisphereLight(0xfff6e6, 0x624733, 3))
      const key = new THREE.DirectionalLight(0xfff7ed, 5)
      key.position.set(-3, 5, 5)
      scene.add(key)
      const fill = new THREE.DirectionalLight(0xffba83, 2)
      fill.position.set(4, -2, 3)
      scene.add(fill)
      const model = new THREE.Group()
      const material = new THREE.MeshStandardMaterial({ color: 0xd85637, metalness: 0.38, roughness: 0.3 })
      const brass = new THREE.MeshStandardMaterial({ color: 0x8c7250, metalness: 0.7, roughness: 0.34 })
      const shape = new THREE.Shape()
      shape.moveTo(0, 1.6); shape.lineTo(0.45, 0.35)
      shape.lineTo(0, 0.57); shape.lineTo(-0.45, 0.35); shape.closePath()
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.22, bevelEnabled: true, bevelSize: 0.055, bevelThickness: 0.06, bevelSegments: 4, steps: 1,
      })
      geometry.translate(0, 0, -0.11)
      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(geometry, material)
        blade.rotation.z = i * Math.PI / 2
        model.add(blade)
      }
      const hubGeometry = new THREE.SphereGeometry(0.2, 24, 24)
      const hub = new THREE.Mesh(hubGeometry, material)
      hub.scale.z = 0.8
      model.add(hub)
      const ringGeometry = new THREE.TorusGeometry(1.91, 0.025, 12, 100)
      model.add(new THREE.Mesh(ringGeometry, brass))
      scene.add(model)
      let frame = 0
      let visible = true
      let elapsed = 0
      let previous = 0
      const draw = (time: number) => {
        frame = requestAnimationFrame(draw)
        if (document.hidden || !visible || time - previous < 30) return
        previous = time
        if (!pausedRef.current && !motion.matches) elapsed += 0.009
        model.rotation.x += ((-0.18 + rotation.current.x) - model.rotation.x) * 0.07
        model.rotation.y += ((Math.sin(elapsed) * 0.38 + rotation.current.y) - model.rotation.y) * 0.07
        model.rotation.z = -0.17 + Math.sin(elapsed * 0.65) * 0.05
        renderer.render(scene, camera)
      }
      const ro = new ResizeObserver(() => {
        if (!el.clientWidth || !el.clientHeight) return
        camera.aspect = el.clientWidth / el.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(el.clientWidth, el.clientHeight)
      })
      const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
      ro.observe(el); io.observe(el)
      const contextLost = (event: Event) => { event.preventDefault(); setReady(false); cancelAnimationFrame(frame) }
      renderer.domElement.addEventListener('webglcontextlost', contextLost)
      draw(0)
      setReady(true)
      cleanup = () => {
        cancelAnimationFrame(frame); ro.disconnect(); io.disconnect()
        renderer.domElement.removeEventListener('webglcontextlost', contextLost)
        geometry.dispose(); ringGeometry.dispose(); hubGeometry.dispose(); material.dispose(); brass.dispose()
        renderer.dispose(); renderer.domElement.remove()
      }
    }).catch(() => { /* The vector mark remains when WebGL or the chunk is unavailable. */ })
    return () => { disposed = true; cleanup() }
  }, [])

  return <div className="compass-sculpture">
    <div className="compass-cardinal north">N</div><div className="compass-cardinal south">S</div>
    <div className="compass-cardinal east">E</div><div className="compass-cardinal west">W</div>
    <div className="sculpture-stage" ref={host} role="img" aria-label="Travel Rec's three-dimensional copper compass logo"
      onPointerMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect()
        rotation.current = { x: (event.clientY - box.top - box.height / 2) / box.height, y: (event.clientX - box.left - box.width / 2) / box.width }
      }} onPointerLeave={() => { rotation.current = { x: 0, y: 0 } }}>
      {!ready && <BrandMark className="sculpture-fallback" />}
    </div>
    {ready && <button className="sculpture-pause" aria-label={paused ? 'Animate compass' : 'Pause compass animation'}
      onClick={() => { pausedRef.current = !paused; setPaused(!paused) }}>{paused ? <Play size={13} /> : <Pause size={13} />}</button>}
  </div>
}
