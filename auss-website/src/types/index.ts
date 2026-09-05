export * from './database'

export interface NavItem {
  label: string
  href: string
  icon?: string
}

export interface StatItem {
  label: string
  value: number
  suffix?: string
  icon: string
  color: string
}

export interface CountdownState {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}
