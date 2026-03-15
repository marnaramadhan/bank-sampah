import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default async function AdminNasabahPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: nasabah } = await supabase
    .from('nasabah')
    .select('*')
    .order('created_at', { ascending: false }) as { data: any[] | null }

  const total = nasabah?.length ?? 0
  const totalSaldo = nasabah?.reduce((s, n) => s + n.saldo, 0) ?? 0

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Nasabah</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} nasabah terdaftar · Total saldo: {formatRupiah(totalSaldo)}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {nasabah?.length === 0 && (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">Belum ada nasabah terdaftar</p>
          )}
          {nasabah?.map(n => (
            <div key={n.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{n.nama}</p>
                  <p className="text-xs text-gray-400">{n.no_hp ?? '-'} · Daftar {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatRupiah(n.saldo)}</p>
                <p className="text-xs text-gray-400">saldo</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
