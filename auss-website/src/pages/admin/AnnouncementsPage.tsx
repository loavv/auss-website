import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Image as ImageIcon, Megaphone } from 'lucide-react'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/utils'
import type { Announcement } from '@/types'

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  content: z.string().min(10, 'Content is required'),
  category: z.string().min(1, 'Category is required'),
  is_featured: z.boolean().default(false),
  status: z.enum(['published', 'draft']),
})

type FormData = z.infer<typeof schema>

const categories = ['Official', 'Event', 'Scholarship', 'Academic', 'Community', 'General', 'Other']

export default function AnnouncementsPage() {
  const [data, setData] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [saving, setSaving] = useState(false)
  const { admin } = useAuth()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'published', is_featured: false },
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: rows } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setData(rows || [])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    reset({ status: 'published', is_featured: false })
    setModalOpen(true)
  }

  function openEdit(row: Announcement) {
    setEditing(row)
    reset({
      title: row.title,
      content: row.content,
      category: row.category,
      is_featured: row.is_featured,
      status: row.status,
    })
    setModalOpen(true)
  }

  async function handleDelete(row: Announcement) {
    const { error } = await supabase.from('announcements').delete().eq('id', row.id)
    if (error) { toast.error('Failed to delete.'); return }
    
    await logActivity(`Deleted announcement: ${row.title}`)
    toast.success('Announcement deleted.')
    fetchData()
  }

  async function onSubmit(formData: FormData) {
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('announcements').update(formData).eq('id', editing.id)
        if (error) throw error
        await logActivity(`Edited announcement: ${formData.title}`)
        toast.success('Announcement updated.')
      } else {
        const { error } = await supabase.from('announcements').insert({
          ...formData,
          created_by: admin?.id,
        })
        if (error) throw error
        await logActivity(`Created announcement: ${formData.title}`)
        toast.success('Announcement created.')
      }
      setModalOpen(false)
      fetchData()
    } catch {
      toast.error('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function logActivity(action: string) {
    if (!admin) return
    await supabase.from('activity_logs').insert({
      admin_id: admin.id,
      admin_name: admin.full_name,
      action,
      module: 'Announcements',
    })
  }

  const columns: Column<Announcement>[] = [
    {
      key: 'title',
      label: 'Title',
      render: row => (
        <div>
          <p className="font-medium text-gray-900 line-clamp-1">{row.title}</p>
          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{row.content}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: row => <Badge variant="default">{row.category}</Badge>,
      width: '120px',
    },
    {
      key: 'status',
      label: 'Status',
      render: row => (
        <Badge variant={row.status === 'published' ? 'success' : 'warning'}>
          {row.status === 'published' ? 'Published' : 'Draft'}
        </Badge>
      ),
      width: '100px',
    },
    {
      key: 'is_featured',
      label: 'Featured',
      render: row => row.is_featured ? <Badge variant="secondary">Featured</Badge> : null,
      width: '90px',
    },
    {
      key: 'created_at',
      label: 'Date',
      render: row => <span className="text-xs text-gray-500">{formatDate(row.created_at)}</span>,
      width: '120px',
    },
  ]

  return (
    <>
      <DataTable
        title="Announcements"
        description="Manage all announcements published on the website."
        data={data}
        columns={columns}
        loading={loading}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
        searchKeys={['title', 'content', 'category']}
        addLabel="New Announcement"
        emptyMessage="No announcements yet"
        emptyIcon={<Megaphone className="w-10 h-10 opacity-30" />}
      />

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editing ? 'Edit Announcement' : 'New Announcement'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Title *"
                  placeholder="Announcement title"
                  {...register('title')}
                  error={errors.title?.message}
                />

                <Textarea
                  label="Content *"
                  placeholder="Announcement content..."
                  rows={4}
                  maxLength={2000}
                  {...register('content')}
                  error={errors.content?.message}
                  value={watch('content') || ''}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                  <Select onValueChange={v => setValue('category', v)} defaultValue={editing?.category}>
                    <SelectTrigger className={errors.category ? 'border-red-400' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <Select onValueChange={v => setValue('status', v as 'published' | 'draft')} defaultValue={editing?.status || 'published'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('is_featured')}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Mark as Featured</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" loading={saving}>
                    {editing ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
