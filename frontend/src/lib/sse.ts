import { authFetch } from './auth'
import { parseSseFrame, type SseEvent } from './sse-parser'
export type { SseEvent } from './sse-parser'

export async function* streamSSE(url: string, body: unknown, signal?: AbortSignal): AsyncGenerator<SseEvent> {
  const res = await authFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal })
  if (!res.ok || !res.body) {
    const parsed = await res.json().catch(() => null)
    throw new Error(typeof parsed?.detail === 'string' ? parsed.detail : `The service couldn’t complete this request (${res.status}).`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      let boundary: RegExpExecArray | null
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const event = parseSseFrame(buffer.slice(0, boundary.index))
        buffer = buffer.slice(boundary.index + boundary[0].length)
        if (event) yield event
      }
      if (done) {
        const trailing = parseSseFrame(buffer)
        if (trailing) yield trailing
        break
      }
    }
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
