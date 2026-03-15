import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import type { Role } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const role = (user.user_metadata?.role ?? 'nasabah') as Role

  let nama = 'Pengguna'
  let hasNasabahProfile = false

  if (role === 'nasabah') {
    const { data } = await supabase.from('nasabah').select('nama').eq('user_id', user.id).single()
    nama = data?.nama ?? nama
  } else {
    const { data: pengurus } = await supabase
      .from('pengurus')
      .select('nama, nasabah_id')
      .eq('user_id', user.id)
      .single()
    nama = pengurus?.nama ?? nama
    hasNasabahProfile = !!pengurus?.nasabah_id
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} nama={nama} hasNasabahProfile={hasNasabahProfile} />
      <main className="flex-1 p-4 md:p-6 overflow-auto pt-16 md:pt-6">
        {children}
      </main>
    </div>
  )
}
