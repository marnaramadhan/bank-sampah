import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Scale, Wallet, TrendingUp, ArrowUpRight } from 'lucide-react'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default async function NasabahDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: nasabah } = await supabase
    .from('nasabah')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Ambil 5 penimbangan terbaru
  const { data: penimbangan } = await supabase
    .from('penimbangan')
    .select('*, jenis_sampah(nama, kategori)')
    .eq('nasabah_id', nasabah?.id ?? '')
    .order('tanggal', { ascending: false })
    .limit(5)

  // Statistik bulan ini
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: bulanIni } = await supabase
    .from('penimbangan')
    .select('total_nilai, berat_kg')
    .eq('nasabah_id', nasabah?.id ?? '')
    .gte('tanggal', startOfMonth.toISOString())
    .eq('status', 'selesai')

  const totalNilaiBulanIni = bulanIni?.reduce((sum, p) => sum + p.total_nilai, 0) ?? 0
  const totalBeratBulanIni = bulanIni?.reduce((sum, p) => sum + p.berat_kg, 0) ?? 0

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Selamat datang, {nasabah?.nama} 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan akun bank sampah kamu</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Saldo',
            value: formatRupiah(nasabah?.saldo ?? 0),
            icon: Wallet,
            color: 'text-primary-600 bg-primary-50',
          },
          {
            label: 'Nilai bulan ini',
            value: formatRupiah(totalNilaiBulanIni),
            icon: TrendingUp,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            label: 'Berat bulan ini',
            value: `${totalBeratBulanIni.toFixed(1)} kg`,
            icon: Scale,
            color: 'text-amber-600 bg-amber-50',
          },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Riwayat terbaru */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Setor terbaru</h2>
          <a href="/dashboard/nasabah/penimbangan" className="text-xs text-primary-600 flex items-center gap-1 hover:underline">
            Lihat semua <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        <div className="divide-y divide-gray-50">
          {penimbangan?.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">Belum ada riwayat setor sampah</p>
          )}
          {penimbangan?.map(p => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{(p.jenis_sampah as any)?.nama}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {p.berat_kg} kg · {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary-600">{formatRupiah(p.total_nilai)}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  p.status === 'selesai' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
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
