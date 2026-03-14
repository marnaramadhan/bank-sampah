import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default async function RiwayatPenimbanganNasabah() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Cek apakah ini pengurus yang akses mode nasabah
  const { data: pengurus } = await supabase
    .from('pengurus').select('nasabah_id').eq('user_id', user.id).single()

  const nasabahId = pengurus?.nasabah_id
    ?? (await supabase.from('nasabah').select('id').eq('user_id', user.id).single()).data?.id

  if (!nasabahId) redirect('/dashboard/nasabah')

  const { data: penimbangan } = await supabase
    .from('penimbangan')
    .select('*, jenis_sampah(nama, kategori)')
    .eq('nasabah_id', nasabahId)
    .order('tanggal', { ascending: false })

  const total = penimbangan?.filter(p => p.status === 'selesai').reduce((s, p) => s + p.total_nilai, 0) ?? 0

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Riwayat Setor Sampah</h1>
        <p className="text-sm text-gray-500 mt-0.5">Total seluruh waktu: <span className="font-semibold text-primary-600">{formatRupiah(total)}</span></p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {penimbangan?.length === 0 && (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">Belum ada riwayat setor sampah</p>
          )}
          {penimbangan?.map(p => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{(p.jenis_sampah as any)?.nama}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {p.berat_kg} kg · {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${p.status === 'selesai' ? 'text-primary-600' : 'text-gray-400 line-through'}`}>
                  {formatRupiah(p.total_nilai)}
                </p>
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
