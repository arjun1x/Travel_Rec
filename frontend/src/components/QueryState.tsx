import { Compass, RefreshCw } from 'lucide-react'

export function ErrorState({ title = 'We couldn’t load this just now.', onRetry }: { title?: string; onRetry: () => void }) {
  return <div className="query-state" role="alert"><RefreshCw size={26} /><h3>{title}</h3>
    <p>Check your connection and try again.</p><button className="button button-light" onClick={onRetry}>Try again <RefreshCw size={14} /></button></div>
}
export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="query-state"><Compass size={32} /><h3>{title}</h3><p>{description}</p>{action}</div>
}
