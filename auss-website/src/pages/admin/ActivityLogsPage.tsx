import { useState, useEffect } from 'react'
import { Activity, Clock } from 'lucide-react'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import type { ActivityLog } from '@/types'

const actionColors: Record<string, string> = {
  login: 'success',
  logout: 'outline',
  created: 'default',
  edited: 'warning',
  deleted: 'danger',
  uploaded: 'info',
}

function getActionVariant(action: string): 'success' | 'outline' | 'default' | 'warning' | 'danger' | 'info' {
  const lower = action.toLowerCase()
  for (const [key, val] of Object.entries(actionColors)) {
    if (lower.includes(key)) return val as any
  }
  return 'default'
}

export default function ActivityLogsPage() {
  const [data, setData] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: rows } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    setData(rows || [])
    setLoading(false)
  }

  const columns: Column<ActivityLog>[] = [
    {
      key: 'admin_name',
      label: 'Admin',
      render: row => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {row.admin_name.charAt(0)}
          </div>
          <span className="text-sm font-medium text-gray-900">{row.admin_name}</span>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: row => <Badge variant={getActionVariant(row.action)} className="text-xs">{row.action}</Badge>,
      width: '120px',
    },
    {
      key: 'module',
      label: 'Module',
      render: row => <span className="text-sm text-primary font-medium">{row.module}</span>,
      width: '130px',
    },
    {
      key: 'details',
      label: 'Details',
      render: row => <p className="text-xs text-gray-500 line-clamp-1">{row.details || '—'}</p>,
    },
    {
      key: 'created_at',
      label: 'Timestamp',
      render: row => (
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDateTime(row.created_at)}
        </span>
      ),
      width: '160px',
    },
  ]

  return (
    <DataTable
      title="Activity Logs"
      description="Track all admin actions and system events."
      data={data}
      columns={columns}
      loading={loading}
      searchKeys={['admin_name', 'action', 'module']}
      emptyMessage="No activity logs yet"
      emptyIcon={<Activity className="w-10 h-10 opacity-30" />}
      pageSize={15}
    />
  )
}
