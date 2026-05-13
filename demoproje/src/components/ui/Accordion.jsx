import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function Accordion({ items, className = '' }) {
  const [openIndex, setOpenIndex] = useState(null)

  function toggle(index) {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className={cn('divide-y divide-border-subtle', className)}>
      {items.map((item, index) => (
        <div key={index}>
          <button
            onClick={() => toggle(index)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-card-alt transition-colors duration-150"
          >
            <span>{item.title}</span>
            <ChevronDown
              size={16}
              className={cn(
                'text-text-secondary transition-transform duration-150',
                openIndex === index && 'rotate-180'
              )}
            />
          </button>
          {openIndex === index && (
            <div className="px-4 pb-4 text-sm text-text-secondary animate-fade-in">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
