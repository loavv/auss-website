import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Eye, Star } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, logActivity } from '@/lib/utils'
import type { Feedback } from '@/types'

export default function FeedbackAdminPage() {
  const [data, setData] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<Feedback | null>(null)
  const { admin } = useAuth()

  useEffect(() => {
    fetchData()

    // Real-time: instantly show new feedback submissions as they arrive
    const channel = supabase
      .channel('feedback-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        () => { fetchData() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data: rows } = await supabase.from('feedback').select('*').order('created_at', { ascending: false })
    setData(rows || [])
    setLoading(false)
  }

  async function handleDelete(row: Feedback) {
    const { error } = await supabase.from('feedback').delete().eq('id', row.id)
    if (error) { toast.error('Failed to delete.'); return }
    await logActivity(admin, `Deleted feedback from ${row.is_anonymous ? 'Anonymous' : (row.name || 'Unknown')}`, 'Feedback', `Category: ${row.category}`)
    toast.success('Feedback deleted.')
    fetchData()
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('feedback').update({ status }).eq('id', id)
    await logActivity(admin, `Updated feedback status to: ${status}`, 'Feedback')
    fetchData()
    if (viewing?.id === id) setViewing(prev => prev ? { ...prev, status: status as any } : null)
  }

  async function openFeedback(row: Feedback) {
    setViewing(row)
    // Auto-mark as read when admin opens it
    if (row.status === 'unread') {
      await supabase.from('feedback').update({ status: 'read' }).eq('id', row.id)
      fetchData()
    }
  }

  const unreadCount = data.filter(f => f.status === 'unread').length

  const columns: Column<Feedback>[] = [
    {
      key: 'name',
      label: 'From',
      render: row => (
        <div>
          <p className="font-medium text-gray-900">{row.is_anonymous ? 'Anonymous' : (row.name || '—')}</p>
          {!row.is_anonymous && row.email && <p className="text-xs text-gray-400">{row.email}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: row => <Badge variant="default" className="text-xs">{row.category}</Badge>,
      width: '120px',
    },
    {
      key: 'rating',
      label: 'Rating',
      render: row => row.rating ? (
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
          <span className="text-sm font-medium">{row.rating}/5</span>
        </div>
      ) : <span className="text-gray-400 text-xs">No rating</span>,
      width: '90px',
    },
    {
      key: 'message',
      label: 'Message',
      render: row => <p className="text-sm text-gray-600 line-clamp-1">{row.message}</p>,
    },
    {
      key: 'status',
      label: 'Status',
      render: row => (
        <Badge variant={row.status === 'unread' ? 'danger' : row.status === 'read' ? 'warning' : 'success'}>
          {row.status}
        </Badge>
      ),
      width: '80px',
    },
    {
      key: 'created_at',
      label: 'Date',
      render: row => <span className="text-xs text-gray-400">{formatDate(row.created_at)}</span>,
      width: '110px',
    },
  ]

  return (
    <>
      <DataTable
        title={
          <span className="flex items-center gap-3">
            Feedback
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                {unreadCount} new
              </span>
            )}
          </span>
        }
        description="View and manage student feedback submissions. New submissions appear automatically."
        data={data}
        columns={columns}
        loading={loading}
        onDelete={handleDelete}
        searchKeys={['name', 'email', 'category', 'message']}
        emptyMessage="No feedback submitted yet"
        emptyIcon={<MessageSquare className="w-10 h-10 opacity-30" />}
        actions={row => (
          <button
            onClick={() => openFeedback(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label="View"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      />

      {/* View Modal */}
      <AnimatePresence>
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewing(null)} />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Feedback Details</h2>
                  <p className="text-sm text-gray-400">{formatDate(viewing.created_at)}</p>
                </div>
                <Badge variant={viewing.status === 'unread' ? 'danger' : viewing.status === 'read' ? 'warning' : 'success'}>
                  {viewing.status}
                </Badge>
              </div>

              {!viewing.is_anonymous && (
                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-400">Name</p>
                    <p className="text-sm font-medium">{viewing.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-medium">{viewing.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Course</p>
                    <p className="text-sm font-medium">{viewing.course || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Year Level</p>
                    <p className="text-sm font-medium">{viewing.year_level || '—'}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <Badge variant="default">{viewing.category}</Badge>
                {viewing.is_anonymous && <Badge variant="info">Anonymous</Badge>}
                {viewing.rating && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < viewing.rating! ? 'text-secondary fill-secondary' : 'text-gray-200'}`} />
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-xl mb-6">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{viewing.message}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Select onValueChange={v => updateStatus(viewing.id, v)} defaultValue={viewing.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setViewing(null)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
