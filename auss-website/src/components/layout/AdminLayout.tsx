import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Megaphone, Calendar, Users, Trophy,
  MessageSquare, Mail, Settings, LogOut, Menu, X, Bell, Search,
  Shield, BookOpen, ChevronDown
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import aussLogo from '@/assets/auss-logo.png'

type NotificationItem = {
  id: string
  type: 'feedback' | 'inquiry'
  title: string
  message: string
  created_at: string
  href: string
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchNotifications() {
    const [feedbackRes, inquiriesRes] = await Promise.all([
      supabase
        .from('feedback')
        .select('id, category, message, created_at')
        .eq('status', 'unread')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('inquiries')
        .select('id, subject, message, created_at')
        .eq('status', 'unread')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const feedbackItems: NotificationItem[] = (feedbackRes.data || []).map(f => ({
      id: f.id,
      type: 'feedback',
      title: `New Feedback — ${f.category}`,
      message: f.message,
      created_at: f.created_at,
      href: '/admin/feedback',
    }))

    const inquiryItems: NotificationItem[] = (inquiriesRes.data || []).map(i => ({
      id: i.id,
      type: 'inquiry',
      title: i.subject,
      message: i.message,
      created_at: i.created_at,
      href: '/admin/inquiries',
    }))

    const merged = [...feedbackItems, ...inquiryItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 8)

    setItems(merged)
    setTotalUnread(feedbackItems.length + inquiryItems.length)
  }

  function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  function handleItemClick(item: NotificationItem) {
    setOpen(false)
    navigate(item.href)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications() }}
        className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
              {totalUnread > 0 && (
                <span className="text-xs text-white bg-red-500 rounded-full px-2 py-0.5 font-semibold">
                  {totalUnread} unread
                </span>
              )}
            </div>

            {/* Items */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No new notifications</p>
                </div>
              ) : (
                items.map(item => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleItemClick(item)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3"
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                      item.type === 'feedback' ? 'bg-blue-100' : 'bg-green-100'
                    )}>
                      {item.type === 'feedback'
                        ? <MessageSquare className="w-4 h-4 text-blue-600" />
                        : <Mail className="w-4 h-4 text-green-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(item.created_at)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100">
              <button
                onClick={() => { setOpen(false); navigate('/admin/feedback') }}
                className="py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
              >
                View Feedback
              </button>
              <button
                onClick={() => { setOpen(false); navigate('/admin/inquiries') }}
                className="py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors"
              >
                View Inquiries
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const sidebarSections = [
  {
    title: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    ],
  },
  {
    title: 'Content',
    items: [
      { icon: Megaphone, label: 'Announcements', href: '/admin/announcements' },
      { icon: Calendar, label: 'Events', href: '/admin/events' },
      { icon: Trophy, label: 'Achievements', href: '/admin/achievements' },
    ],
  },
  {
    title: 'People',
    items: [
      { icon: Users, label: 'Officers', href: '/admin/officers' },
      { icon: Shield, label: 'Administrators', href: '/admin/administrators' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { icon: MessageSquare, label: 'Feedback', href: '/admin/feedback' },
      { icon: Mail, label: 'Inquiries', href: '/admin/inquiries' },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: BookOpen, label: 'Activity Logs', href: '/admin/activity-logs' },
      { icon: Settings, label: 'Settings', href: '/admin/settings' },
    ],
  },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { admin, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const Sidebar = ({ mobile = false }) => (
    <div className={cn(
      'flex flex-col h-full bg-navy text-white',
      mobile ? 'w-72' : (sidebarOpen ? 'w-64' : 'w-16'),
      'transition-all duration-300'
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 p-4 border-b border-white/10 min-h-[64px]',
        !sidebarOpen && !mobile ? 'flex-col justify-center' : 'flex-row'
      )}>
        {/* Collapsed: logo centered */}
        {!sidebarOpen && !mobile ? (
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-full overflow-hidden shrink-0 hover:ring-2 hover:ring-white/30 transition-all"
            aria-label="Expand sidebar"
          >
            <img src={aussLogo} alt="AUSS Logo" className="w-full h-full object-cover" />
          </button>
        ) : (
          <>
            <button
              onClick={() => !mobile && setSidebarOpen(false)}
              className={cn(
                'w-9 h-9 rounded-full overflow-hidden shrink-0 transition-all',
                !mobile && 'hover:ring-2 hover:ring-white/30 cursor-pointer'
              )}
              aria-label="Collapse sidebar"
            >
              <img src={aussLogo} alt="AUSS Logo" className="w-full h-full object-cover" />
            </button>
            {(sidebarOpen || mobile) && (
              <div className="overflow-hidden flex-1">
                <div className="font-bold text-white text-sm leading-none">AUSS Admin</div>
                <div className="text-xs text-white/40 mt-0.5">Management Portal</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {sidebarSections.map(section => (
          <div key={section.title} className="mb-4">
            {(sidebarOpen || mobile) && (
              <div className="px-4 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                  {section.title}
                </span>
              </div>
            )}
            {section.items.map(item => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 transition-all duration-200 relative group',
                    !sidebarOpen && !mobile && 'justify-center px-3',
                    isActive
                      ? 'bg-primary/20 text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  )}
                  title={!sidebarOpen && !mobile ? item.label : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r" />
                  )}
                  <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
                  {(sidebarOpen || mobile) && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                  {/* Tooltip for collapsed */}
                  {!sidebarOpen && !mobile && (
                    <div className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* User Profile */}
      <div className={cn(
        'p-4 border-t border-white/10',
        !sidebarOpen && !mobile && 'flex justify-center'
      )}>
        {(sidebarOpen || mobile) ? (
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarImage src={admin?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/20 text-white text-sm">
                {admin ? getInitials(admin.full_name) : 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{admin?.full_name || 'Admin'}</p>
              <p className="text-xs text-white/40 truncate">{admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center gap-4 px-4 sm:px-6 shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-900">
              {sidebarSections.flatMap(s => s.items).find(i => i.href === location.pathname)?.label || 'Dashboard'}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Notifications bell */}
            <NotificationBell />

            {/* Admin info */}
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-100">
              <Avatar className="w-8 h-8">
                <AvatarImage src={admin?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {admin ? getInitials(admin.full_name) : 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-gray-900">{admin?.full_name}</p>
                <p className="text-xs text-gray-400">{admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
