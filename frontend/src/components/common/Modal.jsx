import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  const boxRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return

    const resetScroll = () => {
      if (boxRef.current) boxRef.current.scrollTop = 0
    }

    resetScroll()
    const frame = requestAnimationFrame(resetScroll)
    return () => cancelAnimationFrame(frame)
  }, [open, title])

  if (!open) return null

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div ref={boxRef} className={`modal-box ${maxWidth} page-in mx-auto`}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white rounded-t-2xl">
          <h3 className="font-display text-xl font-bold text-dark">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}
