'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, UserCircle, Users, Building2, AlertCircle, Loader2, Repeat } from 'lucide-react'

export type AccountRole = 'user' | 'model' | 'company'

interface Props {
  userId: string
  name: string
  currentRole: AccountRole
  onClose: () => void
  onChanged: (newRole: AccountRole) => void
}

const ROLES: { role: AccountRole; icon: typeof Users }[] = [
  { role: 'model', icon: Users },
  { role: 'company', icon: Building2 },
  { role: 'user', icon: UserCircle },
]

export default function AdminChangeRoleDialog({ userId, name, currentRole, onClose, onChanged }: Props) {
  const t = useTranslations('admin.changeRole')
  const options = ROLES.filter(r => r.role !== currentRole)
  const [selected, setSelected] = useState<AccountRole>(options[0].role)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const roleLabel = (role: AccountRole) => t(`role_${role}`)

  const submit = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/admin/change-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole: selected }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || t('failed'))
      onChanged(selected)
    } catch (e: any) {
      setError(e?.message || t('failed'))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={() => !saving && onClose()}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">{t('title')}</p>
            <p className="text-xs text-gray-500 truncate">
              {name} · {t('current', { role: roleLabel(currentRole) })}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label={t('close')}
            className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-40">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600">{t('chooseNew')}</p>
          <div className="space-y-2">
            {options.map(({ role, icon: Icon }) => (
              <label key={role}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selected === role ? 'border-brand bg-brand/5' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                <input type="radio" name="new-role" value={role} checked={selected === role}
                  onChange={() => setSelected(role)} className="mt-1 accent-brand" />
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${selected === role ? 'text-brand' : 'text-gray-400'}`} />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-gray-900">{roleLabel(role)}</span>
                  <span className="block text-xs text-gray-500">{t(`effect_${role}`)}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 space-y-1">
            <p>{t('noteData')}</p>
            <p>{t('noteNotify')}</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-4 pb-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClose} disabled={saving}
            className="flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40">
            {t('cancel')}
          </button>
          <button type="button" onClick={submit} disabled={saving}
            className="flex-1 px-3 py-2.5 rounded-lg text-sm font-bold bg-brand text-white hover:bg-brand-hover disabled:opacity-60 flex items-center justify-center gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
            {t('confirm', { role: roleLabel(selected) })}
          </button>
        </div>
      </div>
    </div>
  )
}
