const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string

export interface CloudinaryUploadResult {
  url: string | null
  error: string | null
}

/**
 * Uploads an image file to Cloudinary using an unsigned upload preset.
 * The actual image file is stored in Cloudinary — not Supabase Storage.
 * Only the returned URL is saved to the Supabase database.
 *
 * @param file   - The image File object selected by the user
 * @param folder - Subfolder inside Cloudinary (e.g. 'officers', 'gallery', 'events', 'achievements')
 */
export async function uploadToCloudinary(
  file: File,
  folder: string
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return { url: null, error: 'Cloudinary is not configured. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.' }
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', `auss/${folder}`)

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    )

    if (!res.ok) {
      const err = await res.json()
      return { url: null, error: err.error?.message ?? `Upload failed (HTTP ${res.status})` }
    }

    const data = await res.json()
    return { url: data.secure_url as string, error: null }
  } catch (err: any) {
    return { url: null, error: err?.message ?? 'Network error during upload.' }
  }
}

/**
 * Transforms an existing Cloudinary URL by injecting transformation parameters.
 * Useful for generating thumbnails without re-uploading.
 *
 * Falls back to the original URL if it's not a Cloudinary URL (e.g. old Supabase URLs).
 *
 * @param url        - The original Cloudinary secure_url
 * @param transforms - Cloudinary transformation string (e.g. 'w_400,h_400,c_fill,f_auto,q_auto')
 *
 * @example
 * // Square thumbnail for officer photo
 * getOptimizedUrl(officer.avatar_url, 'w_200,h_200,c_fill,f_auto,q_auto')
 *
 * // Wide banner for event card
 * getOptimizedUrl(event.banner_url, 'w_800,h_450,c_fill,f_auto,q_auto')
 */
export function getOptimizedUrl(url: string | null | undefined, transforms: string): string {
  if (!url) return ''
  // Only transform Cloudinary URLs — pass Supabase/other URLs through unchanged
  if (!url.includes('cloudinary.com')) return url
  return url.replace('/upload/', `/upload/${transforms}/`)
}
