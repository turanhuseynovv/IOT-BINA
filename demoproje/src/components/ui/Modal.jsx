import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function Modal({ isOpen, onClose, title, children, className = '' }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
    }
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        className={cn(
          'bg-bg-card border border-border-subtle rounded-card w-full max-w-lg max-h-[90vh] overflow-y-auto',
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-btn flex items-center justify-center hover:bg-bg-card-alt transition-colors duration-150"
          >
            <X size={16} className="text-text-secondary" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
