import Link from 'next/link'
import { createClient, createAdminClient } from '~/lib/supabase/server'
import { redirect } from 'next/navigation'
import ActiveNav from './_components/ActiveNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <ActiveNav />
      <main className="flex-1 overflow-auto min-w-0 bg-[var(--color-navy)]">
        {children}
      </main>
    </div>
  )
}
