import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Trophy, ImagePlus, X } from 'lucide-react'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase, uploadFile, STORAGE_BUCKETS } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, logActivity } from '@/lib/utils'
import type { Achievement } from '@/types'

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  date: z.string().min(1),
  category: z.string().min(1),
  awarded_by: z.string().optional(),
  is_featured: z.boolean().default(false),
})

type FormData = z.infer<typeof schema>

const categories = ['Academic', 'Leadership', 'Community', 'Sports', 'Cultural', 'Research', 'Other']

export default function AchievementsPage() {
  const [data, setData] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Achievement | null>(null)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { admin, isDemo } = useAuth()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_featured: false },
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: rows } = await supabase.from('achievements').select('*').order('date', { ascending: false })
    setData(rows || [])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    reset({ is_featured: false })
    setImageFile(null)
    setImagePreview(null)
    setExistingImageUrl(null)
    setModalOpen(true)
  }

  function openEdit(row: Achievement) {
    setEditing(row)
    reset({
      title: row.title,
      description: row.description,
      date: row.date,
      category: row.category,
      awarded_by: row.awarded_by || '',
      is_featured: row.is_featured,
    })
    setImageFile(null)
    setImagePreview(null)
    setExistingImageUrl(row.image_url || null)
    setModalOpen(true)
  }

  async function handleDelete(row: Achievement) {
    const { error } = await supabase.from('achievements').delete().eq('id', row.id)
    if (error) { toast.error('Failed to delete.'); return }
    await logActivity(admin, `Deleted achievement: ${row.title}`, 'Achievements', `Category: ${row.category}`)
    toast.success('Achievement deleted.')
    fetchData()
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    setExistingImageUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function onSubmit(formData: FormData) {
    setSaving(true)
    try {
      let imageUrl: string | null = existingImageUrl

      if (imageFile) {
        if (isDemo) throw new Error('Image upload is not available in demo mode.')
        const ext = imageFile.name.split('.').pop()
        const path = `achievements/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { url, error: uploadError } = await uploadFile(STORAGE_BUCKETS.ACHIEVEMENTS, imageFile, path)
        if (!url) throw new Error(`Image upload failed: ${uploadError ?? 'Unknown error'}`)
        imageUrl = url
      }

      const payload = { ...formData, awarded_by: formData.awarded_by || null, image_url: imageUrl }

      if (editing) {
        const { error } = await supabase.from('achievements').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity(admin, `Edited achievement: ${formData.title}`, 'Achievements', `Category: ${formData.category}`)
        toast.success('Achievement updated.')
      } else {
        const { error } = await supabase.from('achievements').insert(payload)
        if (error) throw error
        await logActivity(admin, `Added achievement: ${formData.title}`, 'Achievements', `Category: ${formData.category}, Awarded by: ${formData.awarded_by || 'N/A'}`)
        toast.success('Achievement added.')
      }
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<Achievement>[] = [
    {
      key: 'title',
      label: 'Achievement',
      render: row => (
        <div className="flex items-center gap-3">
          {row.image_url ? (
            <img src={row.image_url} alt={row.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-primary/40" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 line-clamp-1">{row.title}</p>
            <p className="text-xs text-gray-400">{row.awarded_by || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: row => <Badge variant="default" className="text-xs">{row.category}</Badge>,
      width: '110px',
    },
    {
      key: 'date',
      label: 'Date',
      render: row => <span className="text-xs text-gray-500">{formatDate(row.date)}</span>,
      width: '120px',
    },
    {
      key: 'is_featured',
      label: 'Featured',
      render: row => row.is_featured ? <Badge variant="secondary">Featured</Badge> : null,
      width: '90px',
    },
  ]

  return (
    <>
      <DataTable
        title="Achievements"
        description="Manage organizational awards and recognitions."
        data={data}
        columns={columns}
        loading={loading}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
        searchKeys={['title', 'awarded_by', 'category']}
        addLabel="Add Achievement"
        emptyMessage="No achievements added yet"
        emptyIcon={<Trophy className="w-10 h-10 opacity-30" />}
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
              className="relative bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editing ? 'Edit Achievement' : 'Add Achievement'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Title *" placeholder="Achievement title" {...register('title')} error={errors.title?.message} />

                <Textarea
                  label="Description *"
                  placeholder="Describe this achievement..."
                  rows={3}
                  maxLength={1000}
                  {...register('description')}
                  error={errors.description?.message}
                  value={watch('description') || ''}
                />

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Achievement Image
                  </label>
                  {(imagePreview || existingImageUrl) ? (
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-100">
                      <img
                        src={imagePreview || existingImageUrl!}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
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
                      <span className="text-sm font-medium">Click to upload image</span>
                      <span className="text-xs">PNG, JPG, WebP · Max 5 MB</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Date *" type="date" {...register('date')} error={errors.date?.message} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                    <Select onValueChange={v => setValue('category', v)} defaultValue={editing?.category}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Input label="Awarded By" placeholder="Awarding institution/organization" {...register('awarded_by')} />

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('is_featured')} className="rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="text-sm text-gray-700">Mark as Featured</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" loading={saving}>{editing ? 'Update' : 'Add'}</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
