'use client'
import { useState } from 'react'
import { createClient } from '~/lib/supabase/client'
import { updateProfile } from './actions'
import { Camera, Loader, CheckCircle2, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function ProfileForm({ profile }: { profile: any }) {
  const t = useTranslations('profile')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [photoUrl, setPhotoUrl] = useState(profile.photo_url || '')
  const [uploading, setUploading] = useState(false)

  const supabase = createClient()

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`
      const filePath = `${profile.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setPhotoUrl(publicUrl)
      setMsg({ type: 'success', text: t('uploadSuccess') })
    } catch (error: any) {
      setMsg({ type: 'error', text: 'Erro: ' + error.message })
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    const formData = new FormData(e.currentTarget)
    formData.set('photo_url', photoUrl)

    const res = await updateProfile(formData)
    if (res?.error) {
      setMsg({ type: 'error', text: res.error })
    } else {
      setMsg({ type: 'success', text: t('success') })
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {msg && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
          msg.type === 'success' ? 'bg-green-950/20 text-[var(--color-success)] border border-green-900/30' : 'bg-red-950/20 text-[var(--color-danger)] border border-red-900/30'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {msg.text}
        </div>
      )}

      {/* Avatar Upload */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--color-navy-border)] bg-[var(--color-navy-elevated)] flex items-center justify-center relative">
            {photoUrl ? (
              <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-black text-[var(--color-muted)]">
                {profile.name?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader size={24} className="animate-spin text-white" />
              </div>
            )}
          </div>
          
          <label className="absolute bottom-0 right-0 p-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white rounded-full cursor-pointer transition-all shadow-lg hover:scale-110">
            <Camera size={18} />
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
        <p className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-widest">{t('uploadNote')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">{t('nameLabel')}</label>
          <input
            type="text" name="name" required
            defaultValue={profile.name}
            className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">{t('emailLabel')}</label>
          <input
            type="email" disabled
            value={profile.email || ''}
            className="w-full bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl px-4 py-2.5 text-sm opacity-50 cursor-not-allowed"
          />
        </div>
      </div>

      <button
        type="submit" disabled={loading || uploading}
        className="w-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm transition-all shadow-lg shadow-[var(--color-orange)]/10"
      >
        {loading ? t('saving') : t('saveButton')}
      </button>
    </form>
  )
}
