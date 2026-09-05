import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase, uploadFile, STORAGE_BUCKETS } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { logActivity } from '@/lib/utils'
import type { GalleryItem } from '@/types'

export default function GalleryAdminPage() {
  const [data, setData] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<GalleryItem | null>(null)
  const { admin } = useAuth()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: rows } = await supabase.from('gallery').select('*').order('order')
    setData(rows || [])
    setLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    let count = 0
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { url } = await uploadFile(STORAGE_BUCKETS.GALLERY, file, path)
      if (url) {
        await supabase.from('gallery').insert({
          image_url: url,
          is_featured: false,
          order: data.length + count,
        })
        count++
      }
    }
    setUploading(false)
    if (count > 0) {
      await logActivity(admin, `Uploaded ${count} gallery image${count > 1 ? 's' : ''}`, 'Gallery')
      toast.success(`${count} image(s) uploaded.`)
      fetchData()
    }
    e.target.value = ''
  }

  async function handleDelete(item: GalleryItem) {
    const { error } = await supabase.from('gallery').delete().eq('id', item.id)
    if (error) { toast.error('Failed to delete.'); return }
    await logActivity(admin, `Deleted gallery image`, 'Gallery', item.title || item.image_url)
    toast.success('Image deleted.')
    setDeleteConfirm(null)
    fetchData()
  }

  async function toggleFeatured(item: GalleryItem) {
    await supabase.from('gallery').update({ is_featured: !item.is_featured }).eq('id', item.id)
    await logActivity(admin, `${item.is_featured ? 'Unfeatured' : 'Featured'} gallery image`, 'Gallery', item.title || undefined)
    fetchData()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="text-sm text-gray-500 mt-1">Upload and manage gallery images.</p>
        </div>
        <label className="cursor-pointer">
          <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
          <div className={`inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-primary text-white text-sm font-semibold transition-all duration-200 cursor-pointer hover:bg-primary-dark shadow-md hover:shadow-lg ${uploading ? 'opacity-70 pointer-events-none' : ''}`}>
            {uploading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : <Upload className="w-4 h-4" />}
            Upload Images
          </div>
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Image className="w-16 h-16 opacity-30 mb-4" />
          <p className="text-sm font-medium">No images uploaded yet</p>
          <p className="text-xs mt-1">Click "Upload Images" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {data.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100"
              >
                <img
                  src={item.image_url}
                  alt={item.title || `Gallery ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => toggleFeatured(item)}
                    className={`p-2 rounded-lg transition-colors text-xs font-medium ${
                      item.is_featured ? 'bg-secondary text-navy' : 'bg-white/20 text-white'
                    }`}
                  >
                    {item.is_featured ? 'Featured' : 'Feature'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(item)}
                    className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {item.is_featured && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">Featured</Badge>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <img src={deleteConfirm.image_url} alt="" className="w-24 h-24 object-cover rounded-xl mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Image?</h3>
              <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button variant="destructive" className="flex-1" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
