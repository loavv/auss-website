import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Calendar, ExternalLink, ImagePlus, X } from 'lucide-react'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase, uploadFile, STORAGE_BUCKETS } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, logActivity } from '@/lib/utils'
import type { Event } from '@/types'

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  venue: z.string().min(3),
  organizer: z.string().optional(),
  category: z.string().min(1),
  registration_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  registration_deadline: z.string().optional(),
  registration_status: z.enum(['open', 'closed', 'coming_soon']),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']),
  is_featured: z.boolean().default(false),
})

type FormData = z.infer<typeof schema>

const categories = ['Foundation', 'Academic', 'Community', 'Leadership', 'Recognition', 'Sports', 'Cultural', 'Other']

const regStatusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'coming_soon', label: 'Coming Soon' },
]

const statusOptions = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const regColors = {
  open: 'success',
  closed: 'danger',
  coming_soon: 'warning',
} as const

const statusColors = {
  upcoming: 'default',
  ongoing: 'success',
  completed: 'outline',
  cancelled: 'danger',
} as const

export default function EventsAdminPage() {
  const [data, setData] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)
  const [saving, setSaving] = useState(false)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { admin, isDemo } = useAuth()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'upcoming', registration_status: 'coming_soon', is_featured: false },
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: rows } = await supabase.from('events').select('*').order('date', { ascending: false })
    setData(rows || [])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    reset({ status: 'upcoming', registration_status: 'coming_soon', is_featured: false })
    setBannerFile(null)
    setBannerPreview(null)
    setExistingBannerUrl(null)
    setModalOpen(true)
  }

  function openEdit(row: Event) {
    setEditing(row)
    reset({
      title: row.title,
      description: row.description,
      date: row.date,
      time: row.time || '',
      venue: row.venue,
      organizer: row.organizer || '',
      category: row.category,
      registration_link: row.registration_link || '',
      registration_deadline: row.registration_deadline || '',
      registration_status: row.registration_status,
      status: row.status,
      is_featured: row.is_featured,
    })
    setBannerFile(null)
    setBannerPreview(null)
    setExistingBannerUrl(row.banner_url || null)
    setModalOpen(true)
  }

  async function handleDelete(row: Event) {
    const { error } = await supabase.from('events').delete().eq('id', row.id)
    if (error) { toast.error('Failed to delete.'); return }
    await logActivity(admin, `Deleted event: ${row.title}`, 'Events', `Category: ${row.category}`)
    toast.success('Event deleted.')
    fetchData()
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB.')
      return
    }
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  function removeBanner() {
    setBannerFile(null)
    setBannerPreview(null)
    setExistingBannerUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function onSubmit(formData: FormData) {
    setSaving(true)
    try {
      // Upload banner image if a new file was selected
      let bannerUrl: string | null = existingBannerUrl

      if (bannerFile) {
        // Demo login has no real Supabase auth session — skip upload
        if (isDemo) {
          throw new Error('Image upload is not available in demo mode. Please log in with a real Supabase admin account to upload images.')
        }
        const ext = bannerFile.name.split('.').pop()
        const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { url, error: uploadError } = await uploadFile(STORAGE_BUCKETS.EVENTS, bannerFile, path)
        if (!url) throw new Error(`Image upload failed: ${uploadError ?? 'Unknown error'}. Make sure the "events" storage bucket exists and has an upload policy for authenticated users.`)
        bannerUrl = url
      }

      const payload = {
        ...formData,
        banner_url: bannerUrl,
        registration_link: formData.registration_link || null,
        registration_deadline: formData.registration_deadline || null,
        organizer: formData.organizer || null,
        time: formData.time || null,
      }

      if (editing) {
        const { error } = await supabase.from('events').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity(admin, `Edited event: ${formData.title}`, 'Events', `Category: ${formData.category}, Date: ${formData.date}`)
        toast.success('Event updated.')
      } else {
        const { error } = await supabase.from('events').insert({ ...payload, created_by: admin?.id })
        if (error) throw error
        await logActivity(admin, `Created event: ${formData.title}`, 'Events', `Category: ${formData.category}, Date: ${formData.date}`)
        toast.success('Event created.')
      }
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<Event>[] = [
    {
      key: 'title',
      label: 'Event',
      render: row => (
        <div>
          <p className="font-medium text-gray-900 line-clamp-1">{row.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.venue}</p>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: row => <span className="text-xs text-gray-600">{formatDate(row.date)}</span>,
      width: '120px',
    },
    {
      key: 'category',
      label: 'Category',
      render: row => <Badge variant="default" className="text-xs">{row.category}</Badge>,
      width: '110px',
    },
    {
      key: 'status',
      label: 'Status',
      render: row => <Badge variant={statusColors[row.status]}>{row.status}</Badge>,
      width: '100px',
    },
    {
      key: 'registration_status',
      label: 'Registration',
      render: row => <Badge variant={regColors[row.registration_status]}>{row.registration_status.replace('_', ' ')}</Badge>,
      width: '120px',
    },
  ]

  return (
    <>
      <DataTable
        title="Events"
        description="Manage all events, programs, and activities."
        data={data}
        columns={columns}
        loading={loading}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
        searchKeys={['title', 'venue', 'category']}
        addLabel="Add Event"
        emptyMessage="No events yet"
        emptyIcon={<Calendar className="w-10 h-10 opacity-30" />}
      />

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
              className="relative bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editing ? 'Edit Event' : 'New Event'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Title *" placeholder="Event title" {...register('title')} error={errors.title?.message} />

                <Textarea
                  label="Description *"
                  placeholder="Describe the event..."
                  rows={3}
                  maxLength={2000}
                  {...register('description')}
                  error={errors.description?.message}
                  value={watch('description') || ''}
                />

                {/* Banner Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Event Banner Image
                  </label>
                  {(bannerPreview || existingBannerUrl) ? (
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-100">
                      <img
                        src={bannerPreview || existingBannerUrl!}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeBanner}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                        aria-label="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1 rounded-lg bg-black/60 text-white text-xs hover:bg-black/80 transition-colors flex items-center gap-1"
                        >
                          <ImagePlus className="w-3 h-3" />
                          Change Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary"
                    >
                      <ImagePlus className="w-8 h-8" />
                      <span className="text-sm font-medium">Click to upload banner image</span>
                      <span className="text-xs">PNG, JPG, WebP · Max 5 MB</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Date *" type="date" {...register('date')} error={errors.date?.message} />
                  <Input label="Time" type="time" {...register('time')} />
                </div>

                <Input label="Venue *" placeholder="Event venue" {...register('venue')} error={errors.venue?.message} />
                <Input label="Organizer" placeholder="Organizer name" {...register('organizer')} />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                    <Select onValueChange={v => setValue('category', v)} defaultValue={editing?.category}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Status</label>
                    <Select onValueChange={v => setValue('status', v as any)} defaultValue={editing?.status || 'upcoming'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Registration Settings
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration Status</label>
                    <Select onValueChange={v => setValue('registration_status', v as any)} defaultValue={editing?.registration_status || 'coming_soon'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {regStatusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    label="Registration Link"
                    type="url"
                    placeholder="https://forms.google.com/..."
                    {...register('registration_link')}
                    error={errors.registration_link?.message}
                  />
                  <Input
                    label="Registration Deadline"
                    type="date"
                    {...register('registration_deadline')}
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('is_featured')} className="rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="text-sm text-gray-700">Mark as Featured Event</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" loading={saving}>{editing ? 'Update' : 'Create'}</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
