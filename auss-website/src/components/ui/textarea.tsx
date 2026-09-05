import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  maxLength?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, maxLength, id, value, ...props }, ref) => {
    const hasRequired = label?.endsWith(' *')
    const displayLabel = hasRequired ? label!.slice(0, -2) : label
    const textareaId = id || displayLabel?.toLowerCase().replace(/\s+/g, '-')
    const currentLength = typeof value === 'string' ? value.length : 0

    return (
      <div className="relative w-full group">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {displayLabel}{hasRequired && <span className="text-red-500"> *</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          value={value}
          maxLength={maxLength}
          className={cn(
            'flex min-h-[100px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400',
            'transition-all duration-200 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'hover:border-gray-300',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
            error && 'border-red-400 focus:ring-red-400/30 focus:border-red-400',
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="flex items-center justify-between mt-1.5">
          {error ? (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          ) : <span />}
          {maxLength && (
            <p className={cn(
              'text-xs',
              currentLength >= maxLength * 0.9 ? 'text-orange-500' : 'text-gray-400'
            )}>
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
