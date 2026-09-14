export interface SseEvent { type: string; [key: string]: unknown }

/** Decode an SSE message; comments and non-data fields are intentionally ignored. */
export function parseSseFrame(frame: string): SseEvent | null {
  const data = frame.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).replace(/^ /, '')).join('\n')
  if (!data.trim() || data.trim() === '[DONE]') return null
  const parsed: unknown = JSON.parse(data)
  if (!parsed || typeof parsed !== 'object' || !('type' in parsed) || typeof parsed.type !== 'string') throw new Error('The planning service returned an invalid response. Please try again.')
  return parsed as SseEvent
}
