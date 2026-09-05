import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Save, Globe, Mail, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { invalidateOrgInfoCache } from '@/hooks/useOrgInfo'

interface OrgInfo {
  name: string
  tagline: string
  description: string
  email: string
  address: string
  established_year: number
}

export default function SettingsPage() {
  const [orgInfo, setOrgInfo] = useState<OrgInfo>({
    name: 'Adamson University Scholars\' Society',
    tagline: 'United. Empowered. Excellent.',
    description: '',
    email: 'asaadu@adamson.edu.ph',
    address: '900 San Marcelino St., Ermita, Manila',
    established_year: 2010,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { admin } = useAuth()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data } = await supabase.from('organization_information').select('*').limit(1).single()
    if (data) {
      setOrgInfo({
        name: data.name || '',
        tagline: data.tagline || '',
        description: data.description || '',
        email: data.email || '',
        address: data.address || '',
        established_year: data.established_year || 2010,
      })
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data: existing } = await supabase.from('organization_information').select('id').limit(1).single()
      
      if (existing) {
        await supabase.from('organization_information').update(orgInfo).eq('id', existing.id)
      } else {
        await supabase.from('organization_information').insert(orgInfo)
      }

      if (admin) {
        await supabase.from('activity_logs').insert({
          admin_id: admin.id,
          admin_name: admin.full_name,
          action: 'Updated organization settings',
          module: 'Settings',
        })
      }

      invalidateOrgInfoCache()
      toast.success('Settings saved successfully.')
    } catch {
      toast.error('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (key: keyof OrgInfo, value: string | number) => {
    setOrgInfo(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="p-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Website Settings</h1>
            <p className="text-sm text-gray-500">Manage organization information displayed on the website.</p>
          </div>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      <div className="space-y-6">
        {/* Organization Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="w-4 h-4 text-primary" />
                Organization Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Organization Name"
                value={orgInfo.name}
                onChange={e => updateField('name', e.target.value)}
              />
              <Input
                label="Tagline"
                placeholder="Organization tagline or motto"
                value={orgInfo.tagline}
                onChange={e => updateField('tagline', e.target.value)}
              />
              <Textarea
                label="Description"
                placeholder="Brief description of the organization..."
                rows={4}
                maxLength={1000}
                value={orgInfo.description}
                onChange={e => updateField('description', e.target.value)}
              />
              <Input
                label="Established Year"
                type="number"
                value={orgInfo.established_year}
                onChange={e => updateField('established_year', parseInt(e.target.value))}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="w-4 h-4 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                icon={<Mail className="w-4 h-4" />}
                value={orgInfo.email}
                onChange={e => updateField('email', e.target.value)}
              />
              <Input
                label="Office Address"
                icon={<MapPin className="w-4 h-4" />}
                value={orgInfo.address}
                onChange={e => updateField('address', e.target.value)}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
