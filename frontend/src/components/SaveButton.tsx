import type { MouseEvent } from 'react'
import { Heart } from 'lucide-react'
import { useShortlist } from '../lib/shortlist'

interface Props {
  destinationId: number
  size?: 'sm' | 'lg'
}

export default function SaveButton({ destinationId, size = 'sm' }: Props) {
  const { has, toggle } = useShortlist()
  const saved = has(destinationId)

  const onClick = (e: MouseEvent) => {
    // cards wrap this button in a <Link> — don't navigate on save
    e.preventDefault()
    e.stopPropagation()
    toggle(destinationId)
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved trips' : 'Save destination'}
      title={saved ? 'Remove from saved' : 'Save for later'}
      className={`inline-flex items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-110 dark:bg-gray-900/80 ${
        size === 'lg' ? 'h-11 w-11' : 'h-8 w-8'
      }`}
    >
      <Heart
        aria-hidden
        className={`${size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} ${
          saved ? 'fill-red-500 text-red-500' : 'text-gray-500 dark:text-gray-300'
        }`}
      />
    </button>
  )
}
