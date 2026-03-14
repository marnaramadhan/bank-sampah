'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle } from 'lucide-react'
import type { JenisSampah, Pengepul, Pengurus } from '@/types/database'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function PenjualanPengepulPage() {
  const supabase = createClient()
  const [jenisList, setJenisList] = useState<JenisSampah[]>([])
  const [pengepulList, setPengepulList] = useState<Pengepul[]>([])
  const [pengurus, setPengurus] = useState<Pengurus | null>(null)
  const [form, setForm] = useState({ pengepul_id: '', jenis_sampah_id: '', berat_kg: '', catatan: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      const [{ data: j }, { data: pe }, { data: p }] = await Promise.all([
        supabase.from('jenis_sampah').select('*').eq('aktif', true).order('nama'),
        supabase.from('pengepul').select('*').eq('status', 'aktif').order('nama'),
        supabase.from('pengurus').select('*').eq('user_id', user!.id).single(),
      ])
      setJenisList(j ?? [])
      setPengepulList(pe ?? [])
      setPengurus(p)
    }
    loadData()
  }, [])

  const selectedJenis = jenisList.find(j => j.id === form.jenis_sampah_id)
  const berat = parseFloat(form.berat_kg) || 0
  const totalNilai = selectedJenis ? berat * selectedJenis.harga_pengepul : 0
  const totalNasabah = selectedJenis ? berat * selectedJenis.harga_nasabah : 0
  const margin = totalNilai - totalNasabah

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pengurus) return setError('Data pengurus tidak ditemukan.')
    if (berat <= 0) return setError('Berat harus lebih dari 0.')
    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('penjualan_pengepul').insert({
      pengepul_id: form.pengepul_id,
      jenis_sampah_id: form.jenis_sampah_id,
      pengurus_id: pengurus.id,
      berat_kg: berat,
      harga_saat_jual: selectedJenis!.harga_pengepul,
      total_nilai: totalNilai,
      catatan: form.catatan || null,
    } as any)

    if (err) {
      setError('Gagal menyimpan. ' + err.message)
    } else {
      setSuccess(true)
      setForm({ pengepul_id: '', jenis_sampah_id: '', berat_kg: '', catatan: '' })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Jual ke Pengepul</h1>
        <p className="text-sm text-gray-500 mt-0.5">Catat penjualan sampah ke pengepul</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Penjualan berhasil dicatat!
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        {/* Pengepul */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Pengepul</label>
          <select name="pengepul_id" value={form.pengepul_id} onChange={handleChange} required
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
            <option value="">-- Pilih pengepul --</option>
            {pengepulList.map(pe => (
              <option key={pe.id} value={pe.id}>{pe.nama}</option>
            ))}
          </select>
        </div>

        {/* Jenis sampah */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Sampah</label>
          <select name="jenis_sampah_id" value={form.jenis_sampah_id} onChange={handleChange} required
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
            <option value="">-- Pilih jenis sampah --</option>
            {jenisList.map(j => (
              <option key={j.id} value={j.id}>
                {j.nama} — {formatRupiah(j.harga_pengepul)}/kg
              </option>
            ))}
          </select>
        </div>

        {/* Berat */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Berat (kg)</label>
          <input type="number" name="berat_kg" value={form.berat_kg} onChange={handleChange}
            required min="0.1" step="0.1"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="0.0" />
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan (opsional)</label>
          <textarea name="catatan" value={form.catatan} onChange={handleChange} rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Catatan tambahan..." />
        </div>

        {/* Preview kalkulasi */}
        {totalNilai > 0 && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Nilai jual ke pengepul</span>
              <span className="font-medium">{formatRupiah(totalNilai)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Nilai bayar ke nasabah</span>
              <span className="font-medium text-red-500">- {formatRupiah(totalNasabah)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
              <span>Estimasi margin</span>
              <span className="text-emerald-600">{formatRupiah(margin)}</span>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Menyimpan...' : 'Simpan Penjualan'}
        </button>
      </form>
    </div>
  )
}
