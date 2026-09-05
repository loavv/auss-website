import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Using demo mode.')
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

export const STORAGE_BUCKETS = {
  LOGOS: 'logos',
  ANNOUNCEMENTS: 'announcements',
  EVENTS: 'events',
  GALLERY: 'gallery',
  OFFICERS: 'officers',
  ACHIEVEMENTS: 'achievements',
  DOCUMENTS: 'documents',
} as const

export async function uploadFile(
  bucket: string,
  file: File,
  path: string
): Promise<{ url: string | null; error: string | null }> {
  // Log the current auth state to confirm the session is active
  const { data: { session } } = await supabase.auth.getSession()
  console.log('[uploadFile] session:', session ? `user=${session.user.email}` : 'NO SESSION')

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true })

  if (error) {
    console.error(`Upload error (bucket: ${bucket}, path: ${path}):`, error.message, error)
    return { url: null, error: error.message }
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return { url: urlData.publicUrl, error: null }
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    console.error('Delete error:', error.message, error)
    return false
  }
  return true
}
