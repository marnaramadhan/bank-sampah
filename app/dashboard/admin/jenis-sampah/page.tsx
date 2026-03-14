'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Plus, Pencil, Check, X } from 'lucide-react'
import type { JenisSampah } from '@/types/database'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function JenisSampahPage() {
  const supabase = createClient()
  const [data, setData] = useState<JenisSampah[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ harga_nasabah: '', harga_pengepul: '' })
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ nama: '', kategori: '', harga_nasabah: '', harga_pengepul: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: d } = await supabase.from('jenis_sampah').select('*').order('kategori').order('nama')
    setData(d ?? [])
  }

  async function handleSaveEdit(id: string) {
    setLoading(true)
    await supabase.from('jenis_sampah').update({
      persentase_nasabah: parseFloat(editForm.harga_nasabah),
      harga_pengepul: parseFloat(editForm.harga_pengepul),
    }).eq('id', id)
    await loadData()
    setEditingId(null)
    setLoading(false)
  }

  async function handleToggleAktif(id: string, aktif: boolean) {
    await supabase.from('jenis_sampah').update({ aktif: !aktif }).eq('id', id)
    setData(prev => prev.map(j => j.id === id ? { ...j, aktif: !aktif } : j))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('jenis_sampah').insert({
      nama: addForm.nama,
      kategori: addForm.kategori || null,
      harga_nasabah: parseFloat(addForm.harga_nasabah),
      harga_pengepul: parseFloat(addForm.harga_pengepul),
      aktif: true,
    })
    await loadData()
    setAddForm({ nama: '', kategori: '', harga_nasabah: '', harga_pengepul: '' })
    setShowAdd(false)
    setLoading(false)
  }

  const grouped = data.reduce((acc, j) => {
    const cat = j.kategori ?? 'Lainnya'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(j)
    return acc
  }, {} as Record<string, JenisSampah[]>)

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jenis Sampah</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola daftar dan harga sampah</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-primary-100 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Tambah jenis sampah baru</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Nama</label>
              <input value={addForm.nama} onChange={e => setAddForm(p => ({ ...p, nama: e.target.value }))} required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Botol plastik PET" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Kategori</label>
              <input value={addForm.kategori} onChange={e => setAddForm(p => ({ ...p, kategori: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Plastik" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Harga nasabah (Rp/kg)</label>
              <input type="number" value={addForm.harga_nasabah} onChange={e => setAddForm(p => ({ ...p, harga_nasabah: e.target.value }))} required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="2000" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Harga pengepul (Rp/kg)</label>
              <input type="number" value={addForm.harga_pengepul} onChange={e => setAddForm(p => ({ ...p, harga_pengepul: e.target.value }))} required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="3000" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Simpan
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
              <X className="w-3.5 h-3.5" /> Batal
            </button>
          </div>
        </form>
      )}

      {/* Table per kategori */}
      {Object.entries(grouped).map(([kat, items]) => (
        <div key={kat} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{kat}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map(j => (
              <div key={j.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${j.aktif ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{j.nama}</p>
                </div>
                {editingId === j.id ? (
                  <div className="flex items-center gap-2">
                    <input type="number" value={editForm.harga_nasabah}
                      onChange={e => setEditForm(p => ({ ...p, harga_nasabah: e.target.value }))}
                      className="w-24 px-2 py-1 rounded border border-gray-200 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="Nasabah" />
                    <input type="number" value={editForm.harga_pengepul}
                      onChange={e => setEditForm(p => ({ ...p, harga_pengepul: e.target.value }))}
                      className="w-24 px-2 py-1 rounded border border-gray-200 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="Pengepul" />
                    <button onClick={() => handleSaveEdit(j.id)} className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg">
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Nasabah: <span className="font-medium text-gray-700">{j.persentase_nasabah}% = {formatRupiah(j.harga_nasabah)}</span></span>
                    <span>Pengepul: <span className="font-medium text-gray-700">{formatRupiah(j.harga_pengepul)}</span></span>
                    <button onClick={() => { setEditingId(j.id); setEditForm({ harga_nasabah: String(j.harga_nasabah), harga_pengepul: String(j.harga_pengepul) }) }}
                      className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleToggleAktif(j.id, j.aktif)}
                      className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${j.aktif ? 'bg-primary-50 text-primary-600 hover:bg-primary-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                      {j.aktif ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
