'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Nasabah, JenisSampah, Pengurus } from '@/types/database'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function InputPenimbanganBaru() {
  const router = useRouter()
  const supabase = createClient()
  const [nasabahList, setNasabahList] = useState<Nasabah[]>([])
  const [jenisList, setJenisList] = useState<JenisSampah[]>([])
  const [pengurus, setPengurus] = useState<Pengurus | null>(null)
  const [form, setForm] = useState({ nasabah_id: '', jenis_sampah_id: '', berat_kg: '', catatan: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      const [{ data: n }, { data: j }, { data: p }] = await Promise.all([
        supabase.from('nasabah').select('*').order('nama'),
        supabase.from('jenis_sampah').select('*').eq('aktif', true).order('kategori'),
        supabase.from('pengurus').select('*').eq('user_id', user!.id).single(),
      ])
      setNasabahList(n ?? [])
      setJenisList(j ?? [])
      setPengurus(p)
    }
    loadData()
  }, [])

  const selectedJenis = jenisList.find(j => j.id === form.jenis_sampah_id)
  const berat = parseFloat(form.berat_kg) || 0
  const totalNilai = selectedJenis ? berat * selectedJenis.harga_nasabah : 0

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pengurus) return setError('Data pengurus tidak ditemukan.')
    if (berat <= 0) return setError('Berat harus lebih dari 0.')
    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('penimbangan').insert({
      nasabah_id: form.nasabah_id,
      jenis_sampah_id: form.jenis_sampah_id,
      pengurus_id: pengurus.id,
      berat_kg: berat,
      harga_saat_setor: selectedJenis!.harga_nasabah,
      total_nilai: totalNilai,
      status: 'selesai',
      catatan: form.catatan || null,
    } as any)

    if (err) {
      setError('Gagal menyimpan. ' + err.message)
      setLoading(false)
    } else {
      router.push('/dashboard/pengurus/penimbangan')
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/pengurus/penimbangan" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Input Penimbangan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Catat setor sampah nasabah</p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nasabah</label>
          <select name="nasabah_id" value={form.nasabah_id} onChange={handleChange} required
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
            <option value="">-- Pilih nasabah --</option>
            {nasabahList.map(n => (
              <option key={n.id} value={n.id}>{n.nama}{n.no_hp ? ` (${n.no_hp})` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Sampah</label>
          <select name="jenis_sampah_id" value={form.jenis_sampah_id} onChange={handleChange} required
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
            <option value="">-- Pilih jenis sampah --</option>
            {jenisList.map(j => (
              <option key={j.id} value={j.id}>
                {j.nama} — {formatRupiah(j.harga_nasabah)}/kg ({j.persentase_nasabah}%)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Berat (kg)</label>
          <input type="number" name="berat_kg" value={form.berat_kg} onChange={handleChange}
            required min="0.1" step="0.1"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="0.0" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan (opsional)</label>
          <textarea name="catatan" value={form.catatan} onChange={handleChange} rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Catatan tambahan..." />
        </div>

        {totalNilai > 0 && (
          <div className="bg-primary-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-primary-600">Total nilai nasabah</p>
              {selectedJenis && (
                <p className="text-xs text-primary-500 mt-0.5">
                  {berat} kg × {formatRupiah(selectedJenis.harga_nasabah)} ({selectedJenis.persentase_nasabah}% dari harga pengepul)
                </p>
              )}
            </div>
            <p className="text-lg font-bold text-primary-700">{formatRupiah(totalNilai)}</p>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Menyimpan...' : 'Simpan Penimbangan'}
        </button>
      </form>
    </div>
  )
}
