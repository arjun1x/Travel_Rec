import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

/** Native dialog supplies focus trapping, Escape handling, and an inert background. */
export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = dialog.current
    el?.showModal()
    return () => { el?.close() }
  }, [])
  return <dialog ref={dialog} className="modal-dialog" aria-label={title} onCancel={onClose} onClick={(event) => {
    if (event.target !== event.currentTarget) return
    const r = event.currentTarget.getBoundingClientRect()
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose()
  }}><div className="modal-heading"><h2>{title}</h2><button onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>{children}</dialog>
}
