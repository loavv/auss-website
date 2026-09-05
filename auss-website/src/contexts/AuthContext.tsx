import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Admin } from '@/types'

// ─── Demo credentials ────────────────────────────────────────
const DEMO_EMAIL = 'admin@auss.demo'
const DEMO_PASSWORD = 'auss2026'

const DEMO_USER = {
  id: 'demo-user-id',
  email: DEMO_EMAIL,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as unknown as User

const DEMO_ADMIN: Admin = {
  id: 'demo-user-id',
  full_name: 'Demo Super Admin',
  email: DEMO_EMAIL,
  role: 'super_admin',
  status: 'active',
  avatar_url: null,
  created_at: new Date().toISOString(),
  last_login: new Date().toISOString(),
  created_by: null,
}
// ─────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null
  session: Session | null
  admin: Admin | null
  loading: boolean
  isDemo: boolean
  signIn: (email: string, password: string, remember?: boolean) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_SESSION_KEY = 'auss_demo_session'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    // Check for active demo session first
    const demoActive = sessionStorage.getItem(DEMO_SESSION_KEY)
    if (demoActive === 'true') {
      setUser(DEMO_USER)
      setAdmin(DEMO_ADMIN)
      setIsDemo(true)
      setLoading(false)
      return
    }

    // Otherwise check real Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchAdmin(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchAdmin(session.user.id)
        } else {
          setAdmin(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchAdmin(userId: string) {
    const { data } = await supabase
      .from('admins')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setAdmin(data)
  }

  async function signIn(email: string, password: string, _remember = true) {
    // ── Demo login ──
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      sessionStorage.setItem(DEMO_SESSION_KEY, 'true')
      setUser(DEMO_USER)
      setAdmin(DEMO_ADMIN)
      setIsDemo(true)
      return { error: null }
    }

    // ── Real Supabase login ──
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (adminData) {
          await supabase.from('activity_logs').insert({
            admin_id: user.id,
            admin_name: adminData.full_name,
            action: 'Login',
            module: 'Authentication',
          })
          await supabase
            .from('admins')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id)
        }
      }
    }

    return { error: error as Error | null }
  }

  async function signOut() {
    // ── Demo sign out ──
    if (isDemo) {
      sessionStorage.removeItem(DEMO_SESSION_KEY)
      setUser(null)
      setAdmin(null)
      setIsDemo(false)
      return
    }

    // ── Real sign out ──
    if (user && admin) {
      await supabase.from('activity_logs').insert({
        admin_id: user.id,
        admin_name: admin.full_name,
        action: 'Logout',
        module: 'Authentication',
      })
    }
    await supabase.auth.signOut()
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })
    return { error: error as Error | null }
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error as Error | null }
  }

  return (
    <AuthContext.Provider value={{
      user, session, admin, loading, isDemo,
      signIn, signOut, resetPassword, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
