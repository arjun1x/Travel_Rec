import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Loader2, MessageCircle, Send, X } from 'lucide-react'
import { streamSSE } from '../lib/sse'
import { useAuth } from '../lib/auth'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function AssistantWidget() {
  const { isAuthed } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  const send = async () => {
    const content = input.trim()
    if (!content || busy) return
    setInput('')
    setError(null)
    const history: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setBusy(true)
    try {
      for await (const event of streamSSE('/api/assistant/chat', {
        // keep the last 12 turns to bound tokens
        messages: history.slice(-12),
      })) {
        if (event.type === 'delta') {
          setMessages((current) => {
            const next = [...current]
            next[next.length - 1] = {
              role: 'assistant',
              content: next[next.length - 1].content + (event.text as string),
            }
            return next
          })
        } else if (event.type === 'error') {
          throw new Error(String(event.detail))
        }
      }
    } catch (err) {
      setMessages((current) => current.slice(0, -1))
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close travel assistant' : 'Open travel assistant'}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-xl transition hover:scale-105 dark:bg-white dark:text-gray-900"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 flex h-[480px] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3.5 dark:border-gray-800 dark:bg-gray-950">
            <p className="font-bold tracking-tight">Travel assistant</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ask about destinations, seasons, budgets…
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <p>Try one of these:</p>
                {['Is Kyoto good in November?', 'Beach trip under $1000?', 'Cheaper alternative to Banff?'].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="block rounded-xl border border-gray-200 px-3 py-2 text-left transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      {suggestion}
                    </button>
                  ),
                )}
              </div>
            )}
            {messages.map((message, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'ml-auto bg-sky-600 text-white'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                }`}
              >
                {message.content}
                {message.role === 'assistant' && message.content === '' && busy && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden />
                )}
              </div>
            ))}
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {isAuthed ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void send()
              }}
              className="flex items-center gap-2 border-t border-gray-200 p-3 dark:border-gray-800"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything travel…"
                aria-label="Message the travel assistant"
                className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-sky-500 dark:border-gray-700 dark:bg-gray-950"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="border-t border-gray-200 p-4 text-center text-sm dark:border-gray-800">
              <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400">
                Sign in
              </Link>{' '}
              <span className="text-gray-500 dark:text-gray-400">to chat with the assistant.</span>
            </div>
          )}
        </div>
      )}
    </>
  )
}
