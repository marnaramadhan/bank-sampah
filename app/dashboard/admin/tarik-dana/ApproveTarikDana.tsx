'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  approved: 'bg-emerald-50 text-emerald-600',
  rejected: 'bg-red-50 text-red-500',
}

export default function ApproveTarikDana({ initialData }: { initialData: any[] }) {
  const supabase = createClient()
  const [data, setData] = useState(initialData)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleAction(id: string, status: 'approved' | 'rejected') {
    setLoadingId(id)
    const { error } = await supabase
      .from('tarik_dana')
      .update({ status })
      .eq('id', id)

    if (!error) {
      setData(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    }
    setLoadingId(null)
  }

  const pending = data.filter(t => t.status === 'pending')
  const done = data.filter(t => t.status !== 'pending')

  return (
    <div className="space-y-6">
      {/* Pending */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">
            Menunggu persetujuan
            {pending.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-full">{pending.length}</span>
            )}
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {pending.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">Tidak ada permintaan pending</p>
          )}
          {pending.map(t => (
            <div key={t.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.nasabah?.nama}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t.metode} · {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {t.catatan && <p className="text-xs text-gray-400 italic mt-0.5">"{t.catatan}"</p>}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-gray-900">{formatRupiah(t.jumlah)}</p>
                {loadingId === t.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleAction(t.id, 'approved')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(t.id, 'rejected')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Tolak
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Riwayat</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {done.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">Belum ada riwayat</p>
          )}
          {done.map(t => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.nasabah?.nama}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t.metode} · {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-gray-700">{formatRupiah(t.jumlah)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[t.status]}`}>
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
