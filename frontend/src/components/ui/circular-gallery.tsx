import { forwardRef, useEffect, useRef, useState, type HTMLAttributes } from 'react'
import { Link } from 'react-router'

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(' ')

export interface GalleryItem {
  title: string
  subtitle: string
  image: string
  href: string
}

interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[]
  /** Distance of the cards from the center of the carousel. */
  radius?: number
  /** Rotation speed while the page is not being scrolled. */
  autoRotateSpeed?: number
}

const CARD_W = 280
const CARD_H = 360

const CircularGallery = forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 600, autoRotateSpeed = 0.03, ...props }, ref) => {
    const [rotation, setRotation] = useState(0)
    const [isScrolling, setIsScrolling] = useState(false)
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const animationFrameRef = useRef<number | null>(null)

    // scroll-linked rotation: page scroll progress maps to a full turn
    useEffect(() => {
      const handleScroll = () => {
        setIsScrolling(true)
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)

        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
        const scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0
        setRotation(scrollProgress * 360)

        scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150)
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        window.removeEventListener('scroll', handleScroll)
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      }
    }, [])

    // gentle auto-rotation while idle
    useEffect(() => {
      const autoRotate = () => {
        if (!isScrolling) setRotation((prev) => prev + autoRotateSpeed)
        animationFrameRef.current = requestAnimationFrame(autoRotate)
      }
      animationFrameRef.current = requestAnimationFrame(autoRotate)
      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      }
    }, [isScrolling, autoRotateSpeed])

    const anglePerItem = 360 / items.length

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Destination carousel"
        className={cn('relative flex h-full w-full items-center justify-center', className)}
        style={{ perspective: '2000px' }}
        {...props}
      >
        <div
          className="relative h-full w-full"
          style={{ transform: `rotateY(${rotation}deg)`, transformStyle: 'preserve-3d' }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem
            const totalRotation = rotation % 360
            const relativeAngle = (itemAngle + totalRotation + 360) % 360
            const normalizedAngle = Math.abs(
              relativeAngle > 180 ? 360 - relativeAngle : relativeAngle,
            )
            const opacity = Math.max(0.25, 1 - normalizedAngle / 180)

            return (
              <div
                key={item.href}
                role="group"
                aria-label={item.title}
                className="absolute"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  left: '50%',
                  top: '50%',
                  marginLeft: -CARD_W / 2,
                  marginTop: -CARD_H / 2,
                  opacity,
                  transition: 'opacity 0.3s linear',
                }}
              >
                <Link
                  to={item.href}
                  tabIndex={normalizedAngle < 90 ? 0 : -1}
                  className="group relative block h-full w-full overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-sky-500 to-indigo-600 shadow-2xl dark:border-gray-800"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                    <h2 className="text-xl font-bold tracking-tight">{item.title}</h2>
                    <p className="text-sm opacity-80">{item.subtitle}</p>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)

CircularGallery.displayName = 'CircularGallery'

export { CircularGallery }
