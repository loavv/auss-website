import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { OrgInfo } from '@/types/database'

// Module-level cache — shared across all components, cleared after TTL
let cache: OrgInfo | null = null
let cacheTime = 0
const CACHE_TTL_MS = 60_000 // 1 minute — keeps the site fresh after admin saves

async function fetchAndCache(): Promise<OrgInfo | null> {
  const { data } = await supabase
    .from('organization_information')
    .select('*')
    .limit(1)
    .single()

  if (data) {
    cache = data
    cacheTime = Date.now()
  }
  return data ?? null
}

export function useOrgInfo() {
  const isCacheValid = cache && Date.now() - cacheTime < CACHE_TTL_MS
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(isCacheValid ? cache : null)

  useEffect(() => {
    if (isCacheValid) return
    fetchAndCache().then(data => { if (data) setOrgInfo(data) })
  }, [])

  return orgInfo
}

/** Call this after saving settings so the next page render picks up fresh data */
export function invalidateOrgInfoCache() {
  cache = null
  cacheTime = 0
}
