import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, logActivity } from '@/lib/utils'
import type { Inquiry } from '@/types'

export default function InquiriesPage() {
  const [data, setData] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<Inquiry | null>(null)
  const { admin } = useAuth()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: rows } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false })
    setData(rows || [])
    setLoading(false)
  }

  async function handleDelete(row: Inquiry) {
    const { error } = await supabase.from('inquiries').delete().eq('id', row.id)
    if (error) { toast.error('Failed to delete.'); return }
    await logActivity(admin, `Deleted inquiry from ${row.name}`, 'Inquiries', `Subject: ${row.subject}`)
    toast.success('Inquiry deleted.')
    fetchData()
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('inquiries').update({ status }).eq('id', id)
    await logActivity(admin, `Updated inquiry status to: ${status}`, 'Inquiries')
    fetchData()
    if (viewing?.id === id) setViewing(prev => prev ? { ...prev, status: status as any } : null)
  }

  const statusMap = {
    unread: 'danger',
    read: 'warning',
    replied: 'success',
  } as const

  const columns: Column<Inquiry>[] = [
    {
      key: 'name',
      label: 'From',
      render: row => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-400">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: row => <p className="text-sm text-gray-700 line-clamp-1">{row.subject}</p>,
    },
    {
      key: 'status',
      label: 'Status',
      render: row => <Badge variant={statusMap[row.status]}>{row.status}</Badge>,
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
        title="Inquiries"
        description="View and respond to contact inquiries."
        data={data}
        columns={columns}
        loading={loading}
        onDelete={handleDelete}
        searchKeys={['name', 'email', 'subject']}
        emptyMessage="No inquiries yet"
        emptyIcon={<Mail className="w-10 h-10 opacity-30" />}
        actions={row => (
          <button
            onClick={() => setViewing(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      />

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
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Inquiry Details</h2>
                <Badge variant={statusMap[viewing.status]}>{viewing.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-400">Name</p>
                  <p className="text-sm font-medium">{viewing.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <a href={`mailto:${viewing.email}`} className="text-sm text-primary font-medium hover:underline">{viewing.email}</a>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Date Received</p>
                  <p className="text-sm font-medium">{formatDate(viewing.created_at)}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-1">Subject</p>
                <p className="font-semibold text-gray-900">{viewing.subject}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl mb-6">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{viewing.message}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Select onValueChange={v => updateStatus(viewing.id, v)} defaultValue={viewing.status}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <a href={`mailto:${viewing.email}?subject=Re: ${viewing.subject}`}>
                  <Button variant="outline">
                    <Mail className="w-4 h-4" />
                    Reply
                  </Button>
                </a>
                <Button onClick={() => setViewing(null)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
