import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Shield, KeyRound } from 'lucide-react'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate, getInitials, logActivity } from '@/lib/utils'
import type { Admin } from '@/types'

// Change password schema
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
}).refine(d => d.current_password !== d.new_password, {
  message: 'New password must be different from current password',
  path: ['new_password'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

// Single schema — password fields are always optional at schema level.
// We enforce "required when adding" manually in onSubmit.
const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'super_admin']),
  status: z.enum(['active', 'inactive']),
  password: z.string().optional(),
  confirm_password: z.string().optional(),
}).superRefine((data, ctx) => {
  // Only validate passwords when they are filled in
  if (data.password || data.confirm_password) {
    if ((data.password?.length ?? 0) < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password must be at least 8 characters', path: ['password'] })
    }
    if (data.password !== data.confirm_password) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Passwords do not match', path: ['confirm_password'] })
    }
  }
})

type FormData = z.infer<typeof schema>

export default function AdministratorsPage() {
  const [data, setData] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Admin | null>(null)
  const [saving, setSaving] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const { admin: currentAdmin } = useAuth()

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'admin', status: 'active', password: '', confirm_password: '' },
  })

  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    reset: resetPw,
    formState: { errors: errorsPw },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: rows } = await supabase.from('admins').select('*').order('created_at', { ascending: false })
    setData(rows || [])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    reset({ role: 'admin', status: 'active', password: '', confirm_password: '' })
    setModalOpen(true)
  }

  function openEdit(row: Admin) {
    setEditing(row)
    reset({
      full_name: row.full_name,
      email: row.email,
      role: row.role,
      status: row.status,
      password: '',
      confirm_password: '',
    })
    setModalOpen(true)
  }

  async function handleDelete(row: Admin) {
    if (row.id === currentAdmin?.id) {
      toast.error('You cannot delete your own account.')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('No active session.')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-admin-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ user_id: row.id }),
        }
      )

      const result = await res.json()
      console.error('[delete-admin] status:', res.status, 'result:', result)
      if (!res.ok) throw new Error(result.error || 'Failed to delete.')

      await logActivity(currentAdmin, `Deleted administrator: ${row.full_name}`, 'Administrators', `Role: ${row.role}, Email: ${row.email}`)
      toast.success('Administrator removed.')
      fetchData()
    } catch (e: any) {
      console.error('[delete-admin] error:', e)
      toast.error(e?.message || 'Failed to delete.')
    }
  }

  async function handleChangePassword(formData: PasswordFormData) {
    setChangingPassword(true)
    try {
      // Verify current password by re-signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentAdmin!.email,
        password: formData.current_password,
      })
      if (signInError) throw new Error('Current password is incorrect.')

      // Update to new password
      const { error } = await supabase.auth.updateUser({ password: formData.new_password })
      if (error) throw error

      await logActivity(currentAdmin, `Changed own password`, 'Administrators')
      toast.success('Password updated successfully.')
      setPasswordModalOpen(false)
      resetPw()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update password.')
    } finally {
      setChangingPassword(false)
    }
  }

  async function onSubmit(formData: FormData) {
    // Require password when creating
    if (!editing && !formData.password) {
      toast.error('Password is required.')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('admins').update({
          full_name: formData.full_name,
          role: formData.role,
          status: formData.status,
        }).eq('id', editing.id)
        if (error) throw error
        await logActivity(currentAdmin, `Edited administrator: ${formData.full_name}`, 'Administrators', `Role: ${formData.role}, Status: ${formData.status}`)
        toast.success('Administrator updated.')
      } else {
        // Call edge function — runs with service role key so it can create auth users
        // Always get a fresh session to avoid using a stale/null token from context
        const { data: { session: freshSession } } = await supabase.auth.getSession()
        if (!freshSession?.access_token) throw new Error('No active session. Please log in again.')
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin-user`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${freshSession.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password!,
              full_name: formData.full_name,
            }),
          }
        )
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Failed to create user.')

        const { error } = await supabase.from('admins').insert({
          id: result.user.id,
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          created_by: currentAdmin?.id,
        })
        if (error) throw error
        await logActivity(currentAdmin, `Created administrator: ${formData.full_name}`, 'Administrators', `Role: ${formData.role}, Email: ${formData.email}`)
        toast.success('Administrator created.')
      }
      setModalOpen(false)
      fetchData()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<Admin>[] = [
    {
      key: 'full_name',
      label: 'Administrator',
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
            <p className="text-xs text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: row => (
        <div className="flex justify-center">
          <Badge variant={row.role === 'super_admin' ? 'secondary' : 'default'}>
            {row.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </Badge>
        </div>
      ),
      width: '140px',
    },
    {
      key: 'status',
      label: 'Status',
      render: row => <Badge variant={row.status === 'active' ? 'success' : 'danger'}>{row.status}</Badge>,
      width: '100px',
    },
    {
      key: 'last_login',
      label: 'Last Login',
      render: row => <span className="text-xs text-gray-400">{row.last_login ? formatDate(row.last_login) : 'Never'}</span>,
      width: '150px',
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: row => <span className="text-xs text-gray-400">{formatDate(row.created_at)}</span>,
      width: '150px',
    },
  ]

  return (
    <>
      <DataTable
        title="Administrators"
        description="Manage admin accounts and permissions."
        data={data}
        columns={columns}
        loading={loading}
        onAdd={currentAdmin?.role === 'super_admin' ? openAdd : undefined}
        onEdit={currentAdmin?.role === 'super_admin' ? openEdit : undefined}
        onDelete={currentAdmin?.role === 'super_admin' ? handleDelete : undefined}
        searchKeys={['full_name', 'email', 'role']}
        addLabel="Add Administrator"
        emptyMessage="No administrators found"
        emptyIcon={<Shield className="w-10 h-10 opacity-30" />}
        actions={row => row.id === currentAdmin?.id ? (
          <div className="relative group/tooltip">
            <button
              onClick={() => { resetPw(); setPasswordModalOpen(true) }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
              aria-label="Change password"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <div className="absolute right-0 bottom-full mb-1.5 px-2 py-1 rounded-lg bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50">
              Change my password
            </div>
          </div>
        ) : null}
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
              className="relative bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editing ? 'Edit Administrator' : 'Add Administrator'}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Full Name *"
                  placeholder="Full Name"
                  {...register('full_name')}
                  error={errors.full_name?.message}
                />

                {!editing && (
                  <Input
                    label="Email *"
                    type="email"
                    placeholder="admin@adamson.edu.ph"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                    <Select onValueChange={v => setValue('role', v as any)} defaultValue={editing?.role || 'admin'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <Select onValueChange={v => setValue('status', v as any)} defaultValue={editing?.status || 'active'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Password — only shown when adding */}
                {!editing && (
                  <div className="space-y-3">
                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Password</p>
                      <div className="space-y-3">
                        <Input
                          label="Password *"
                          type="password"
                          placeholder="Min. 8 characters"
                          {...register('password')}
                          error={errors.password?.message}
                        />
                        <Input
                          label="Confirm Password *"
                          type="password"
                          placeholder="Re-enter password"
                          {...register('confirm_password')}
                          error={errors.confirm_password?.message}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" loading={saving}>{editing ? 'Update' : 'Create'}</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Change Password Modal */}
      <AnimatePresence>
        {passwordModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPasswordModalOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
                  <p className="text-xs text-gray-400">Update your own account password</p>
                </div>
              </div>
              <form onSubmit={handleSubmitPw(handleChangePassword)} className="space-y-4">
                <Input
                  label="Current Password *"
                  type="password"
                  placeholder="Enter your current password"
                  {...registerPw('current_password')}
                  error={errorsPw.current_password?.message}
                />
                <Input
                  label="New Password *"
                  type="password"
                  placeholder="Min. 8 characters"
                  {...registerPw('new_password')}
                  error={errorsPw.new_password?.message}
                />
                <Input
                  label="Confirm New Password *"
                  type="password"
                  placeholder="Re-enter new password"
                  {...registerPw('confirm_password')}
                  error={errorsPw.confirm_password?.message}
                />
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setPasswordModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" loading={changingPassword}>Update Password</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
