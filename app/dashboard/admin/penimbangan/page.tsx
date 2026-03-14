import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default async function AdminPenimbanganPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: penimbangan } = await supabase
    .from('penimbangan')
    .select('*, nasabah(nama), jenis_sampah(nama, kategori), pengurus(nama)')
    .order('tanggal', { ascending: false })
    .limit(100)

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Semua Penimbangan</h1>
        <p className="text-sm text-gray-500 mt-0.5">{penimbangan?.length ?? 0} transaksi terbaru</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {penimbangan?.length === 0 && (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">Belum ada data penimbangan</p>
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
                  {(p.jenis_sampah as any)?.nama} · {p.berat_kg} kg · oleh {(p.pengurus as any)?.nama} ·{' '}
                  {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">{formatRupiah(p.total_nilai)}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  p.status === 'selesai' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-400'
                }`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
