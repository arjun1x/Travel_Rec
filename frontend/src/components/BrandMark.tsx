export default function BrandMark({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true">
    <path d="M32 2 41 25 32 21 23 25Z" />
    <path d="M62 32 39 41 43 32 39 23Z" />
    <path d="M32 62 23 39 32 43 41 39Z" />
    <path d="M2 32 25 23 21 32 25 41Z" />
    <circle cx="32" cy="32" r="5" />
  </svg>
}
