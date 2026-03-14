'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { JenisSampah, Pengurus } from '@/types/database'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function EditPenimbanganPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [jenisList, setJenisList] = useState<JenisSampah[]>([])
  const [pengurus, setPengurus] = useState<Pengurus | null>(null)
  const [original, setOriginal] = useState<any>(null)
  const [form, setForm] = useState({ jenis_sampah_id: '', berat_kg: '', catatan: '', status: 'selesai' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      const [{ data: p }, { data: timbang }, { data: j }] = await Promise.all([
        supabase.from('pengurus').select('*').eq('user_id', user!.id).single(),
        supabase.from('penimbangan').select('*, nasabah(nama), jenis_sampah(nama)').eq('id', id).single(),
        supabase.from('jenis_sampah').select('*').eq('aktif', true).order('kategori'),
      ])

      setPengurus(p)
      setOriginal(timbang)
      setJenisList(j ?? [])
      if (timbang) {
        setForm({
          jenis_sampah_id: timbang.jenis_sampah_id,
          berat_kg: String(timbang.berat_kg),
          catatan: timbang.catatan ?? '',
          status: timbang.status,
        })
      }
      setLoading(false)
    }
    loadData()
  }, [id])

  const selectedJenis = jenisList.find(j => j.id === form.jenis_sampah_id)
  const berat = parseFloat(form.berat_kg) || 0
  const totalNilai = selectedJenis ? berat * selectedJenis.harga_nasabah : 0
  const selisih = original ? totalNilai - original.total_nilai : 0

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pengurus) return setError('Data pengurus tidak ditemukan.')
    if (berat <= 0 && form.status === 'selesai') return setError('Berat harus lebih dari 0.')
    setSaving(true)
    setError('')

    const { error: err } = await supabase
      .from('penimbangan')
      .update({
        jenis_sampah_id: form.jenis_sampah_id,
        berat_kg: berat,
        harga_saat_setor: selectedJenis?.harga_nasabah ?? original.harga_saat_setor,
        total_nilai: form.status === 'batal' ? original.total_nilai : totalNilai,
        status: form.status,
        catatan: form.catatan || null,
        edited_at: new Date().toISOString(),
        edited_by: pengurus.id,
      })
      .eq('id', id)

    if (err) {
      setError('Gagal menyimpan. ' + err.message)
      setSaving(false)
    } else {
      router.push('/dashboard/pengurus/penimbangan')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!original) {
    return <p className="text-sm text-gray-500">Data tidak ditemukan.</p>
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/pengurus/penimbangan" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Penimbangan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Nasabah: {original.nasabah?.nama}</p>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Edit penimbangan akan otomatis menyesuaikan saldo nasabah. Pastikan data yang diubah sudah benar.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Sampah</label>
          <select name="jenis_sampah_id" value={form.jenis_sampah_id} onChange={handleChange} required
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
            {jenisList.map(j => (
              <option key={j.id} value={j.id}>
                {j.nama} — {formatRupiah(j.harga_nasabah)}/kg
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan</label>
          <textarea name="catatan" value={form.catatan} onChange={handleChange} rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Catatan koreksi..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
          <select name="status" value={form.status} onChange={handleChange}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
            <option value="selesai">Selesai</option>
            <option value="batal">Batal (saldo dikembalikan)</option>
          </select>
        </div>

        {/* Preview perubahan */}
        {form.status === 'selesai' && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Nilai sebelumnya</span>
              <span>{formatRupiah(original.total_nilai)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Nilai baru</span>
              <span className="font-medium">{formatRupiah(totalNilai)}</span>
            </div>
            {selisih !== 0 && (
              <div className={`flex justify-between font-semibold pt-1 border-t border-gray-200 ${selisih > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                <span>Selisih saldo nasabah</span>
                <span>{selisih > 0 ? '+' : ''}{formatRupiah(selisih)}</span>
              </div>
            )}
          </div>
        )}

        {form.status === 'batal' && (
          <div className="bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700">
            Saldo nasabah akan dikurangi <span className="font-semibold">{formatRupiah(original.total_nilai)}</span>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  )
}
