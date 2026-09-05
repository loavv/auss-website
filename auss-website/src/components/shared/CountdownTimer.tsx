import { useState, useEffect } from 'react'
import { getCountdown } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  targetDate: string | Date
  large?: boolean
}

export default function CountdownTimer({ targetDate, large = false }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(getCountdown(targetDate))

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(targetDate))
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (countdown.expired) {
    return (
      <div className={cn(
        'text-center text-gray-400 text-sm font-medium',
        large && 'text-base'
      )}>
        Event has started or passed
      </div>
    )
  }

  const units = [
    { label: 'Days', value: countdown.days },
    { label: 'Hours', value: countdown.hours },
    { label: 'Mins', value: countdown.minutes },
    { label: 'Secs', value: countdown.seconds },
  ]

  return (
    <div className="flex items-center gap-2">
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-2">
          <div className={cn(
            'flex flex-col items-center justify-center rounded-xl bg-primary/5 border border-primary/10',
            large ? 'w-16 h-16' : 'w-12 h-12'
          )}>
            <span className={cn(
              'font-bold text-primary tabular-nums',
              large ? 'text-2xl' : 'text-lg'
            )}>
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="text-xs text-gray-400 leading-none">{unit.label}</span>
          </div>
          {i < units.length - 1 && (
            <span className="text-primary font-bold text-lg">:</span>
          )}
        </div>
      ))}
    </div>
  )
}
