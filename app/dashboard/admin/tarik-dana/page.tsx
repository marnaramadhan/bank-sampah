import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ApproveTarikDana from './ApproveTarikDana'

export default async function TarikDanaAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: tarikDana } = await supabase
    .from('tarik_dana')
    .select('*, nasabah(nama, saldo)')
    .order('tanggal', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tarik Dana</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kelola permintaan pencairan saldo nasabah</p>
      </div>
      <ApproveTarikDana initialData={tarikDana ?? []} />
    </div>
  )
}
