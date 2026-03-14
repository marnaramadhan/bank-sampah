import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Scale, ShoppingCart, TrendingUp, Users, Wallet, Package } from 'lucide-react'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    { data: penimbanganBulanIni },
    { data: penjualanBulanIni },
    { count: totalNasabah },
    { count: totalPengurus },
    { data: tarikDanaPending },
    { data: penimbanganTerbaru },
  ] = await Promise.all([
    supabase.from('penimbangan').select('total_nilai, berat_kg').gte('tanggal', startOfMonth.toISOString()).eq('status', 'selesai'),
    supabase.from('penjualan_pengepul').select('total_nilai').gte('tanggal', startOfMonth.toISOString()),
    supabase.from('nasabah').select('*', { count: 'exact', head: true }),
    supabase.from('pengurus').select('*', { count: 'exact', head: true }),
    supabase.from('tarik_dana').select('*, nasabah(nama)').eq('status', 'pending').order('tanggal', { ascending: false }),
    supabase.from('penimbangan').select('*, nasabah(nama), jenis_sampah(nama)').order('tanggal', { ascending: false }).limit(5),
  ])

  const totalSetor = penimbanganBulanIni?.reduce((s, p) => s + p.total_nilai, 0) ?? 0
  const totalBerat = penimbanganBulanIni?.reduce((s, p) => s + p.berat_kg, 0) ?? 0
  const totalJual = penjualanBulanIni?.reduce((s, p) => s + p.total_nilai, 0) ?? 0
  const margin = totalJual - totalSetor

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bulan {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Setor ke nasabah', value: formatRupiah(totalSetor), icon: Scale, color: 'text-primary-600 bg-primary-50' },
          { label: 'Jual ke pengepul', value: formatRupiah(totalJual), icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
          { label: 'Margin bersih', value: formatRupiah(margin), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total nasabah', value: `${totalNasabah ?? 0} orang`, icon: Users, color: 'text-violet-600 bg-violet-50' },
          { label: 'Total pengurus', value: `${totalPengurus ?? 0} orang`, icon: Package, color: 'text-amber-600 bg-amber-50' },
          { label: 'Berat terkumpul', value: `${totalBerat.toFixed(1)} kg`, icon: Scale, color: 'text-gray-600 bg-gray-100' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs text-gray-500 leading-tight">{stat.label}</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">{stat.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Tarik dana pending */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Tarik dana pending</h2>
            <a href="/dashboard/admin/tarik-dana" className="text-xs text-primary-600 hover:underline">Proses →</a>
          </div>
          <div className="divide-y divide-gray-50">
            {tarikDanaPending?.length === 0 && (
              <p className="px-5 py-5 text-sm text-gray-400 text-center">Tidak ada permintaan pending</p>
            )}
            {tarikDanaPending?.map(t => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{(t.nasabah as any)?.nama}</p>
                  <p className="text-xs text-gray-400">{t.metode} · {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatRupiah(t.jumlah)}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Penimbangan terbaru */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Penimbangan terbaru</h2>
            <a href="/dashboard/admin/penimbangan" className="text-xs text-primary-600 hover:underline">Lihat semua →</a>
          </div>
          <div className="divide-y divide-gray-50">
            {penimbanganTerbaru?.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{(p.nasabah as any)?.nama}</p>
                  <p className="text-xs text-gray-400">{(p.jenis_sampah as any)?.nama} · {p.berat_kg} kg</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatRupiah(p.total_nilai)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
