import type { DayPlan } from '../types/itinerary'

// The planner streams one JSON document. These helpers read it while it is still
// incomplete so finished days can be shown before the last one is written.

/** Day objects that have fully arrived, in order. Stops at the first unfinished one. */
export function extractCompletedDays(partial: string): DayPlan[] {
  const key = partial.indexOf('"days"')
  const start = key === -1 ? -1 : partial.indexOf('[', key)
  if (start === -1) return []
  const days: DayPlan[] = []
  let i = start + 1
  while (i < partial.length) {
    const ch = partial[i]
    if (ch === '{') {
      const end = closingBrace(partial, i)
      if (end === -1) break
      try {
        const day = JSON.parse(partial.slice(i, end + 1)) as Partial<DayPlan>
        if (typeof day.date === 'string' && typeof day.title === 'string' && Array.isArray(day.activities)) days.push(day as DayPlan)
      } catch {
        break
      }
      i = end + 1
    } else if (ch === ']') {
      break
    } else {
      i++
    }
  }
  return days
}

/** Days the model has begun writing, finished or not. */
export function countStartedDays(partial: string): number {
  return (partial.match(/"date"\s*:/g) ?? []).length
}

/** Index of the brace that closes the object opening at `open`, or -1 while it is still streaming. */
function closingBrace(text: string, open: number): number {
  let depth = 0
  let inString = false
  for (let i = open; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (ch === '\\') i++
      else if (ch === '"') inString = false
    } else if (ch === '"') inString = true
    else if (ch === '{') depth++
    else if (ch === '}' && --depth === 0) return i
  }
  return -1
}
