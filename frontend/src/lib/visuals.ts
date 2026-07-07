// Visual fallbacks when a destination has no (or a broken) image:
// a deterministic gradient per destination plus a landmark emoji per tag.

const GRADIENTS = [
  'from-sky-500 to-indigo-600',
  'from-emerald-500 to-teal-700',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-700',
  'from-cyan-500 to-blue-600',
]

const TAG_EMOJI: Record<string, string> = {
  city: '🏙️',
  culture: '🏛️',
  food: '🍜',
  romance: '💫',
  temples: '⛩️',
  history: '🏺',
  adventure: '🧗',
  mountains: '🏔️',
  hiking: '🥾',
  nature: '🌿',
  'northern-lights': '🌌',
  cold: '❄️',
  beach: '🏖️',
  wine: '🍷',
  skiing: '⛷️',
}

export function gradientFor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0
  return GRADIENTS[hash % GRADIENTS.length]
}

export function emojiFor(tags: string[]): string {
  for (const tag of tags) {
    if (TAG_EMOJI[tag]) return TAG_EMOJI[tag]
  }
  return '🌍'
}
