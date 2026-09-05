import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Users, ImagePlus, X, Plus, Tag, Pencil, Trash2 } from 'lucide-react'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase, uploadFile, STORAGE_BUCKETS } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, logActivity } from '@/lib/utils'
import type { Officer, OfficerCategory } from '@/types'

// ─── Schemas ────────────────────────────────────────────────
const officerSchema = z.object({
  full_name: z.string().min(2),
  position: z.string().min(2),
  department: z.string().optional(),
  course: z.string().min(1, 'Course is required'),
  year_level: z.string().min(1, 'Year level is required'),
  email: z.string().email().optional().or(z.literal('')),
  bio: z.string().optional(),
  order: z.number().default(0),
  hierarchy_row: z.number().min(1).default(1),
  category_id: z.string().nullable().default(null),
  academic_year: z.string().min(4),
  is_active: z.boolean().default(true),
})

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  order: z.number().default(0),
  is_active: z.boolean().default(true),
})

type OfficerFormData = z.infer<typeof officerSchema>
type CategoryFormData = z.infer<typeof categorySchema>

const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']
const departments = [
  'College of Engineering',
  'College of Science',
  'College of Pharmacy',
  'College of Architecture',
  'College of Business Administration',
  'College of Education and Liberal Arts (CELA)',
  'College of Nursing',
  'College of Computing and Information Technology (CCIT)',
  'College of Law',
  'Graduate School',
]

// ─── Main Page ───────────────────────────────────────────────
export default function OfficersPage() {
  const [activeTab, setActiveTab] = useState<'officers' | 'categories'>('officers')

  return (
    <div className="px-6 pt-6">
      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('officers')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'officers'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Officers
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          Categories
        </button>
      </div>

      {activeTab === 'officers' ? <OfficersTab /> : <CategoriesTab />}
    </div>
  )
}

// ─── Categories Tab ──────────────────────────────────────────
function CategoriesTab() {
  const [categories, setCategories] = useState<OfficerCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<OfficerCategory | null>(null)
  const [saving, setSaving] = useState(false)
  const { admin } = useAuth()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { is_active: true, order: 0 },
  })

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    setLoading(true)
    const { data } = await supabase.from('officer_categories').select('*').order('order')
    setCategories(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    reset({ is_active: true, order: 0, name: '', description: '' })
    setModalOpen(true)
  }

  function openEdit(row: OfficerCategory) {
    setEditing(row)
    reset({
      name: row.name,
      description: row.description || '',
      order: row.order,
      is_active: row.is_active,
    })
    setModalOpen(true)
  }

  async function handleDelete(row: OfficerCategory) {
    const { error } = await supabase.from('officer_categories').delete().eq('id', row.id)
    if (error) { toast.error('Failed to delete. Make sure no officers are assigned to this category first.'); return }
    await logActivity(admin, `Deleted officer category: ${row.name}`, 'Officers')
    toast.success('Category deleted.')
    fetchCategories()
  }

  async function onSubmit(formData: CategoryFormData) {
    setSaving(true)
    try {
      const payload = {
        ...formData,
        description: formData.description || null,
      }
      if (editing) {
        const { error } = await supabase.from('officer_categories').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity(admin, `Edited officer category: ${formData.name}`, 'Officers')
        toast.success('Category updated.')
      } else {
        const { error } = await supabase.from('officer_categories').insert(payload)
        if (error) throw error
        await logActivity(admin, `Added officer category: ${formData.name}`, 'Officers')
        toast.success('Category added.')
      }
      setModalOpen(false)
      fetchCategories()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<OfficerCategory>[] = [
    {
      key: 'name',
      label: 'Category',
      render: row => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          {row.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'order',
      label: 'Order',
      render: row => <span className="text-xs text-gray-500">{row.order}</span>,
      width: '70px',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: row => <Badge variant={row.is_active ? 'success' : 'outline'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>,
      width: '80px',
    },
  ]

  return (
    <>
      <DataTable
        title="Officer Categories"
        description="Manage officer categories (e.g. Executive Officers, Committees)."
        data={categories}
        columns={columns}
        loading={loading}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
        searchKeys={['name', 'description']}
        addLabel="Add Category"
        emptyMessage="No categories added yet"
        emptyIcon={<Tag className="w-10 h-10 opacity-30" />}
      />

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editing ? 'Edit Category' : 'Add Category'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Category Name *" placeholder="e.g. Executive Officers" {...register('name')} error={errors.name?.message} />
                <Textarea
                  label="Description"
                  placeholder="Brief description of this officer group..."
                  rows={3}
                  {...register('description')}
                />
                <Input label="Display Order" type="number" {...register('order', { valueAsNumber: true })} />
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('is_active')} className="rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="text-sm text-gray-700">Active (visible on website)</span>
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

// ─── Officers Tab ────────────────────────────────────────────
function OfficersTab() {
  const [data, setData] = useState<Officer[]>([])
  const [categories, setCategories] = useState<OfficerCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Officer | null>(null)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [availableRows, setAvailableRows] = useState<number[]>([1])
  const [selectedRow, setSelectedRow] = useState<number>(1)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('__none__')
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null)
  const [modalKey, setModalKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { admin, isDemo } = useAuth()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<OfficerFormData>({
    resolver: zodResolver(officerSchema),
    defaultValues: { is_active: true, order: 0, hierarchy_row: 1, academic_year: '2025-2026', category_id: null },
  })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [officerRes, catRes] = await Promise.all([
      supabase.from('officers').select('*').order('order'),
      supabase.from('officer_categories').select('*').order('order'),
    ])
    setData(officerRes.data || [])
    setCategories(catRes.data || [])
    const existing = Array.from(new Set((officerRes.data || []).map(r => r.hierarchy_row ?? 1))).sort((a, b) => a - b)
    setAvailableRows(existing.length > 0 ? existing : [1])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    const prefilledCategory = (activeCategoryFilter && activeCategoryFilter !== '__uncategorized__') ? activeCategoryFilter : null
    reset({ is_active: true, order: 0, hierarchy_row: 1, academic_year: '2025-2026', category_id: prefilledCategory })
    setSelectedRow(1)
    setSelectedCategoryId(prefilledCategory ?? '__none__')
    setModalKey(k => k + 1)
    setImageFile(null)
    setImagePreview(null)
    setExistingImageUrl(null)
    setModalOpen(true)
  }

  function openEdit(row: Officer) {
    setEditing(row)
    const rowNum = row.hierarchy_row ?? 1
    reset({
      full_name: row.full_name,
      position: row.position,
      department: row.department || '',
      course: row.course || '',
      year_level: row.year_level || '',
      email: row.email || '',
      bio: row.bio || '',
      order: row.order,
      hierarchy_row: rowNum,
      category_id: row.category_id || null,
      academic_year: row.academic_year,
      is_active: row.is_active,
    })
    setSelectedRow(rowNum)
    setSelectedCategoryId(row.category_id || '__none__')
    setModalKey(k => k + 1)
    setImageFile(null)
    setImagePreview(null)
    setExistingImageUrl(row.avatar_url || null)
    setModalOpen(true)
  }

  async function handleDelete(row: Officer) {
    const { error } = await supabase.from('officers').delete().eq('id', row.id)
    if (error) { toast.error('Failed to delete.'); return }
    await logActivity(admin, `Deleted officer: ${row.full_name}`, 'Officers', `Position: ${row.position}`)
    toast.success('Officer removed.')
    fetchAll()
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

  async function onSubmit(formData: OfficerFormData) {
    setSaving(true)
    try {
      let avatarUrl: string | null = existingImageUrl

      if (imageFile) {
        if (isDemo) throw new Error('Image upload is not available in demo mode.')
        const ext = imageFile.name.split('.').pop()
        const path = `officers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { url, error: uploadError } = await uploadFile(STORAGE_BUCKETS.OFFICERS, imageFile, path)
        if (!url) throw new Error(`Image upload failed: ${uploadError ?? 'Unknown error'}`)
        avatarUrl = url
      }

      const payload = {
        ...formData,
        avatar_url: avatarUrl,
        department: formData.department || null,
        course: formData.course || null,
        year_level: formData.year_level || null,
        email: formData.email || null,
        bio: formData.bio || null,
        category_id: formData.category_id || null,
      }

      if (editing) {
        const { error } = await supabase.from('officers').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity(admin, `Edited officer: ${formData.full_name}`, 'Officers', `Position: ${formData.position}`)
        toast.success('Officer updated.')
      } else {
        const { error } = await supabase.from('officers').insert(payload)
        if (error) throw error
        await logActivity(admin, `Added officer: ${formData.full_name}`, 'Officers', `Position: ${formData.position}, A.Y.: ${formData.academic_year}`)
        toast.success('Officer added.')
      }
      setModalOpen(false)
      fetchAll()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<Officer>[] = [
    {
      key: 'full_name',
      label: 'Officer',
      render: row => (
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={row.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(row.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">{row.full_name}</p>
            <p className="text-xs text-gray-400">{row.email || ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      label: 'Position',
      render: row => <span className="text-sm text-primary font-medium">{row.position}</span>,
    },
    {
      key: 'category_id',
      label: 'Category',
      render: row => {
        const cat = categories.find(c => c.id === row.category_id)
        return <span className="text-xs text-gray-500">{cat ? cat.name : '—'}</span>
      },
    },
    {
      key: 'hierarchy_row',
      label: 'Row',
      render: row => <span className="text-xs font-medium text-gray-500">Row {row.hierarchy_row ?? 1}</span>,
      width: '70px',
    },
    {
      key: 'academic_year',
      label: 'A.Y.',
      render: row => <span className="text-xs font-medium text-gray-700">{row.academic_year}</span>,
      width: '90px',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: row => <Badge variant={row.is_active ? 'success' : 'outline'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>,
      width: '80px',
    },
  ]

  const filteredData = activeCategoryFilter === null
    ? data
    : activeCategoryFilter === '__uncategorized__'
    ? data.filter(o => !o.category_id)
    : data.filter(o => o.category_id === activeCategoryFilter)

  return (
    <>
      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 pt-2 pb-0">
          <button
            onClick={() => setActiveCategoryFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              activeCategoryFilter === null
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({data.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                activeCategoryFilter === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name} ({data.filter(o => o.category_id === cat.id).length})
            </button>
          ))}
          {data.some(o => !o.category_id) && (
            <button
              onClick={() => setActiveCategoryFilter('__uncategorized__')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                activeCategoryFilter === '__uncategorized__'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              Uncategorized ({data.filter(o => !o.category_id).length})
            </button>
          )}
        </div>
      )}

      <DataTable
        title="Officers"
        description="Manage AUSS officers and executive board members."
        data={filteredData}
        columns={columns}
        loading={loading}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
        searchKeys={['full_name', 'position', 'department']}
        addLabel="Add Officer"
        emptyMessage="No officers in this category"
        emptyIcon={<Users className="w-10 h-10 opacity-30" />}
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
                {editing ? 'Edit Officer' : 'Add Officer'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Full Name *" placeholder="Juan dela Cruz" {...register('full_name')} error={errors.full_name?.message} />
                <Input label="Position *" placeholder="e.g. President" {...register('position')} error={errors.position?.message} />

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category
                    <span className="ml-1 text-xs text-gray-400 font-normal">(which officer group this belongs to)</span>
                  </label>
                  <Select
                    key={`cat-${modalKey}`}
                    value={selectedCategoryId}
                    onValueChange={v => {
                      setSelectedCategoryId(v)
                      setValue('category_id', v === '__none__' ? null : v, { shouldValidate: true })
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— No category —</SelectItem>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hierarchy Row */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Hierarchy Row <span className="text-red-500">*</span>
                    <span className="ml-1 text-xs text-gray-400 font-normal">(controls which row this position appears in)</span>
                  </label>
                  <RowPicker
                    key={`row-${modalKey}`}
                    rows={availableRows}
                    value={selectedRow}
                    onChange={(num) => {
                      setSelectedRow(num)
                      setValue('hierarchy_row', num, { shouldValidate: true })
                    }}
                    onAddRow={() => {
                      const next = Math.max(...availableRows) + 1
                      setAvailableRows(prev => [...prev, next])
                      setSelectedRow(next)
                      setValue('hierarchy_row', next, { shouldValidate: true })
                    }}
                    onDeleteRow={(row) => {
                      setAvailableRows(prev => prev.filter(r => r !== row))
                      if (selectedRow === row) {
                        const remaining = availableRows.filter(r => r !== row)
                        const fallback = remaining.length > 0 ? Math.min(...remaining) : 1
                        if (remaining.length === 0) setAvailableRows([1])
                        setSelectedRow(fallback)
                        setValue('hierarchy_row', fallback, { shouldValidate: true })
                      }
                    }}
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo</label>
                  {(imagePreview || existingImageUrl) ? (
                    <div className="relative w-28 h-28 mx-auto">
                      <img
                        src={imagePreview || existingImageUrl!}
                        alt="Officer photo"
                        className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
                      />
                      <button type="button" onClick={removeImage}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                        aria-label="Remove photo">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors shadow"
                        aria-label="Change photo">
                        <ImagePlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full py-5 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition-all duration-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary">
                      <ImagePlus className="w-7 h-7" />
                      <span className="text-sm font-medium">Click to upload photo</span>
                      <span className="text-xs">PNG, JPG, WebP · Max 5 MB</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">College / Department</label>
                  <Select
                    key={`dept-${modalKey}`}
                    defaultValue={editing?.department || ''}
                    onValueChange={v => setValue('department', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select college" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Course *" placeholder="BS Computer Engineering" {...register('course')} error={errors.course?.message} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Year Level <span className="text-red-500">*</span></label>
                    <Select
                      key={`yr-${modalKey}`}
                      defaultValue={editing?.year_level || ''}
                      onValueChange={v => setValue('year_level', v, { shouldValidate: true })}
                    >
                      <SelectTrigger className={errors.year_level ? 'border-red-400' : ''}><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {yearLevels.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.year_level && <p className="mt-1.5 text-xs text-red-500">{errors.year_level.message}</p>}
                  </div>
                </div>

                <Input label="Email" type="email" placeholder="officer@adamson.edu.ph" {...register('email')} error={errors.email?.message} />

                <Textarea
                  label="Bio"
                  placeholder="Short biography..."
                  rows={3}
                  maxLength={500}
                  {...register('bio')}
                  value={watch('bio') || ''}
                />

                <Input label="Academic Year *" placeholder="2025-2026" {...register('academic_year')} error={errors.academic_year?.message} />

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('is_active')} className="rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="text-sm text-gray-700">Active Officer</span>
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

// ─── Row Picker ──────────────────────────────────────────────
function RowPicker({
  rows,
  value,
  onChange,
  onAddRow,
  onDeleteRow,
}: {
  rows: number[]
  value: number
  onChange: (row: number) => void
  onAddRow: () => void
  onDeleteRow: (row: number) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
      >
        <span>Row {value}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="py-1 max-h-48 overflow-y-auto">
              {rows.map(r => (
                <div
                  key={r}
                  className={`flex items-center justify-between px-3 py-2 group hover:bg-gray-50 transition-colors ${r === value ? 'bg-primary/5' : ''}`}
                >
                  <button
                    type="button"
                    className="flex-1 text-left text-sm font-medium text-gray-800"
                    onClick={() => { onChange(r); setOpen(false) }}
                  >
                    {r === value && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-2 mb-0.5" />}
                    Row {r}
                  </button>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteRow(r)}
                      className="ml-2 p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      aria-label={`Delete Row ${r}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100">
              <button
                type="button"
                onClick={() => { onAddRow(); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row {Math.max(...rows) + 1}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
