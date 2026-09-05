import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Megaphone, Calendar, MessageSquare, Mail, Users, Trophy,
  Activity, ArrowRight, Plus, Clock, FlaskConical
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatRelativeTime } from '@/lib/utils'

const FEEDBACK_COLORS: Record<string, string> = {
  Suggestion: '#0056D2',
  Complaint: '#ef4444',
  Inquiry: '#F4C430',
  Appreciation: '#10b981',
  General: '#8b5cf6',
  Other: '#6b7280',
}

/** Returns the last N calendar months as { key: 'YYYY-MM', label: 'Mon' } */
function getLastNMonths(n: number) {
  const months = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('default', { month: 'short' }),
    })
  }
  return months
}

interface DashStats {
  announcements: number
  events: number
  feedback: number
  inquiries: number
  officers: number
  achievements: number
}

interface RecentActivity {
  id: string
  admin_name: string
  action: string
  module: string
  created_at: string
}

interface ActivityChartPoint {
  month: string
  events: number
}

interface FeedbackPiePoint {
  name: string
  value: number
  count: number
  color: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [activityData, setActivityData] = useState<ActivityChartPoint[]>([])
  const [feedbackPieData, setFeedbackPieData] = useState<FeedbackPiePoint[]>([])
  const [loading, setLoading] = useState(true)
  const { admin, isDemo } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const months = getLastNMonths(6)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      sixMonthsAgo.setDate(1)
      const cutoff = sixMonthsAgo.toISOString()

      const [
        { count: announcements },
        { count: events },
        { count: feedback },
        { count: inquiries },
        { count: officers },
        { count: achievements },
        { data: logs },
        { data: eventsRaw },
        { data: feedbackRaw },
      ] = await Promise.all([
        supabase.from('announcements').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('feedback').select('*', { count: 'exact', head: true }),
        supabase.from('inquiries').select('*', { count: 'exact', head: true }),
        supabase.from('officers').select('*', { count: 'exact', head: true }),
        supabase.from('achievements').select('*', { count: 'exact', head: true }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(8),
        supabase.from('events').select('date').gte('date', cutoff),
        supabase.from('feedback').select('category'),
      ])

      setStats({
        announcements: announcements || 0,
        events: events || 0,
        feedback: feedback || 0,
        inquiries: inquiries || 0,
        officers: officers || 0,
        achievements: achievements || 0,
      })
      setActivities(logs || [])

      // ── Build line chart data (events by month) ──
      const eventsByMonth: Record<string, number> = {}
      months.forEach(m => { eventsByMonth[m.key] = 0 })

      ;(eventsRaw || []).forEach(e => {
        const key = e.date.slice(0, 7) // 'YYYY-MM'
        if (key in eventsByMonth) eventsByMonth[key]++
      })

      setActivityData(
        months.map(m => ({
          month: m.label,
          events: eventsByMonth[m.key],
        }))
      )

      // ── Build donut chart data (feedback by category) ──
      const categoryCounts: Record<string, number> = {}
      ;(feedbackRaw || []).forEach(f => {
        const cat = f.category || 'Other'
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
      })
      const total = Object.values(categoryCounts).reduce((a, b) => a + b, 0)
      setFeedbackPieData(
        Object.entries(categoryCounts).map(([name, count]) => ({
          name,
          count,
          value: total > 0 ? Math.round((count / total) * 100) : 0,
          color: FEEDBACK_COLORS[name] ?? '#6b7280',
        }))
      )
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Announcements', value: stats?.announcements, icon: Megaphone, href: '/admin/announcements', color: 'blue', change: '+3 this month' },
    { label: 'Events', value: stats?.events, icon: Calendar, href: '/admin/events', color: 'purple', change: '+2 upcoming' },
    { label: 'Feedback', value: stats?.feedback, icon: MessageSquare, href: '/admin/feedback', color: 'green', change: '+12 this week' },
    { label: 'Inquiries', value: stats?.inquiries, icon: Mail, href: '/admin/inquiries', color: 'orange', change: '+5 unread' },
    { label: 'Officers', value: stats?.officers, icon: Users, href: '/admin/officers', color: 'teal', change: 'A.Y. 2025-2026' },
    { label: 'Achievements', value: stats?.achievements, icon: Trophy, href: '/admin/achievements', color: 'yellow', change: '+1 recently' },
  ]

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    teal: 'bg-teal-50 text-teal-600',
    yellow: 'bg-amber-50 text-amber-600',
  }

  const quickActions = [
    { label: 'New Announcement', href: '/admin/announcements', icon: Megaphone },
    { label: 'Add Event', href: '/admin/events', icon: Calendar },
    { label: 'Add Officer', href: '/admin/officers', icon: Users },
    { label: 'Add Achievement', href: '/admin/achievements', icon: Trophy },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Demo mode banner */}
      {isDemo && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <FlaskConical className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Demo Mode</p>
            <p className="text-xs text-amber-600">
              You are logged in with demo credentials. Data shown is static. Connect Supabase to enable live data, real CRUD, and file uploads.
            </p>
          </div>
        </div>
      )}
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0056D2 0%, #003A8C 100%)' }}
      >
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-4 border-white" />
          <div className="absolute bottom-4 right-16 w-20 h-20 rounded-full border-4 border-white" />
        </div>
        <div className="relative">
          <p className="text-white/70 text-sm mb-1">Good {getGreeting()}</p>
          <h1 className="text-2xl font-bold mb-1">Welcome back, {admin?.full_name?.split(' ')[0] || 'Admin'}</h1>
          <p className="text-white/60 text-sm">
            Here's what's happening on the AUSS website today.
          </p>
        </div>
        <div className="flex gap-3 mt-4">
          {quickActions.map(action => {
            const Icon = action.icon
            return (
              <Link key={action.label} to={action.href}>
                <Button size="sm" variant="glass" className="text-xs">
                  <Plus className="w-3 h-3" />
                  {action.label}
                </Button>
              </Link>
            )
          })}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={stat.href}>
                <Card className="p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
                  <div className={`w-9 h-9 rounded-xl ${colorMap[stat.color]} flex items-center justify-center mb-3`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-12 mb-1" />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</div>
                  )}
                  <div className="text-xs font-medium text-gray-500">{stat.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{stat.change}</div>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-2 p-6">
          <CardHeader className="p-0 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity Overview</CardTitle>
                <p className="text-sm text-gray-400 mt-1">Events added over the last 6 months</p>
              </div>
              <Badge variant="default">6 Months</Badge>
            </div>
          </CardHeader>
          {loading ? (
            <Skeleton className="w-full h-[220px] rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorEv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4C430" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F4C430" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="events" name="Events" stroke="#F4C430" fill="url(#colorEv)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Feedback Distribution */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle>Feedback Types</CardTitle>
            <p className="text-sm text-gray-400">Distribution by category</p>
          </CardHeader>
          {loading ? (
            <Skeleton className="w-full h-[180px] rounded-xl" />
          ) : feedbackPieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[180px] text-gray-300">
              <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No feedback yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={feedbackPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {feedbackPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} submission${value !== 1 ? 's' : ''}`, name]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-2 mt-4">
            {feedbackPieData.length === 0 && !loading ? (
              <p className="text-xs text-gray-400 text-center">Data will appear once feedback is submitted.</p>
            ) : (
              feedbackPieData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{item.count}</span>
                    <span className="font-semibold text-gray-900">{item.value}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <CardHeader className="p-0 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-sm text-gray-400">Latest admin actions</p>
            </div>
            <Link to="/admin/activity-logs">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-48 mb-1.5" />
                  <Skeleton className="h-2 w-24" />
                </div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            activities.map(log => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{log.admin_name}</span>
                    {' '}{log.action.toLowerCase()} in {' '}
                    <span className="font-medium text-primary">{log.module}</span>
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(log.created_at)}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
