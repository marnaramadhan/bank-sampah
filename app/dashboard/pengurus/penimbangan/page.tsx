import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default async function PenimbanganPengurusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: pengurus } = await supabase
    .from('pengurus').select('id').eq('user_id', user.id).single()

  const { data: penimbangan } = await supabase
    .from('penimbangan')
    .select('*, nasabah(nama), jenis_sampah(nama, kategori)')
    .eq('pengurus_id', pengurus?.id ?? '')
    .order('tanggal', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Penimbangan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Riwayat & input penimbangan kamu</p>
        </div>
        <Link
          href="/dashboard/pengurus/penimbangan/baru"
          className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Input Baru
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {penimbangan?.length === 0 && (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">Belum ada penimbangan</p>
          )}
          {penimbangan?.map(p => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{(p.nasabah as any)?.nama}</p>
                  {p.edited_at && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full">diedit</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(p.jenis_sampah as any)?.nama} · {p.berat_kg} kg ·{' '}
                  {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatRupiah(p.total_nilai)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    p.status === 'selesai' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                  }`}>
                    {p.status}
                  </span>
                </div>
                {p.status === 'selesai' && (
                  <Link
                    href={`/dashboard/pengurus/penimbangan/${p.id}/edit`}
                    className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
