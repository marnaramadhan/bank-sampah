'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, Wallet } from 'lucide-react'
import type { TarikDana, Nasabah } from '@/types/database'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  approved: 'bg-emerald-50 text-emerald-600',
  rejected: 'bg-red-50 text-red-500',
}

export default function TarikDanaNasabah() {
  const supabase = createClient()
  const [nasabah, setNasabah] = useState<Nasabah | null>(null)
  const [riwayat, setRiwayat] = useState<TarikDana[]>([])
  const [form, setForm] = useState({ jumlah: '', metode: 'tunai', catatan: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()

    // Cek pengurus mode nasabah
    const { data: pengurus } = await supabase
      .from('pengurus').select('nasabah_id').eq('user_id', user!.id).single()

    const nasabahQuery = pengurus?.nasabah_id
      ? supabase.from('nasabah').select('*').eq('id', pengurus.nasabah_id).single()
      : supabase.from('nasabah').select('*').eq('user_id', user!.id).single()

    const { data: n } = await nasabahQuery
    setNasabah(n)

    if (n) {
      const { data: r } = await supabase
        .from('tarik_dana')
        .select('*')
        .eq('nasabah_id', n.id)
        .order('tanggal', { ascending: false })
      setRiwayat(r ?? [])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const jumlah = parseFloat(form.jumlah)
    if (!nasabah) return
    if (jumlah <= 0) return setError('Jumlah harus lebih dari 0.')
    if (jumlah > nasabah.saldo) return setError('Jumlah melebihi saldo.')
    if (riwayat.some(r => r.status === 'pending')) return setError('Kamu masih punya permintaan yang sedang diproses.')

    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('tarik_dana').insert({
      nasabah_id: nasabah.id,
      jumlah,
      metode: form.metode,
      catatan: form.catatan || null,
      status: 'pending',
    })

    if (err) {
      setError('Gagal mengajukan. ' + err.message)
    } else {
      setSuccess(true)
      setForm({ jumlah: '', metode: 'tunai', catatan: '' })
      await loadData()
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tarik Dana</h1>
        <p className="text-sm text-gray-500 mt-0.5">Cairkan saldo bank sampahmu</p>
      </div>

      {/* Saldo */}
      {nasabah && (
        <div className="bg-primary-600 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-primary-200">Saldo tersedia</p>
            <p className="text-2xl font-bold text-white mt-0.5">{formatRupiah(nasabah.saldo)}</p>
          </div>
          <Wallet className="w-8 h-8 text-primary-300" />
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Permintaan tarik dana berhasil diajukan. Tunggu persetujuan admin.
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah (Rp)</label>
          <input type="number" value={form.jumlah} onChange={e => setForm(p => ({ ...p, jumlah: e.target.value }))}
            required min="1000" step="1000"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="50000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Metode pencairan</label>
          <select value={form.metode} onChange={e => setForm(p => ({ ...p, metode: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
            <option value="tunai">Tunai</option>
            <option value="transfer">Transfer bank</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan (opsional)</label>
          <textarea value={form.catatan} onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))} rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Misal: rekening BCA 1234567890 a.n. Budi" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Mengajukan...' : 'Ajukan Tarik Dana'}
        </button>
      </form>

      {/* Riwayat */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Riwayat pengajuan</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {riwayat.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">Belum ada riwayat tarik dana</p>
          )}
          {riwayat.map(r => (
            <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{formatRupiah(r.jumlah)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {r.metode} · {new Date(r.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[r.status]}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
