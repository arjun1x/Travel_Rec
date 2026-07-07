// POST + Server-Sent-Events reader on top of authFetch (EventSource can't
// send Authorization headers or bodies, so we parse the stream ourselves).

import { authFetch } from './auth'

export interface SseEvent {
  type: string
  [key: string]: unknown
}

export async function* streamSSE(url: string, body: unknown): AsyncGenerator<SseEvent> {
  const res = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok || !res.body) {
    const parsed = await res.json().catch(() => null)
    throw new Error(parsed?.detail ?? `Request failed (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''
    for (const chunk of chunks) {
      const dataLine = chunk.split('\n').find((line) => line.startsWith('data: '))
      if (dataLine) yield JSON.parse(dataLine.slice(6)) as SseEvent
    }
  }
}
