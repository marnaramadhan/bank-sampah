'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Check, X, Loader2 } from 'lucide-react'
import type { Pengepul } from '@/types/database'

export default function AdminPengepulPage() {
  const supabase = createClient()
  const [data, setData] = useState<Pengepul[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ nama: '', no_hp: '', alamat: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: d } = await supabase.from('pengepul').select('*').order('nama')
    setData(d ?? [])
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.from('pengepul').insert({
      nama: form.nama,
      no_hp: form.no_hp || null,
      alamat: form.alamat || null,
      status: 'aktif',
    })
    await loadData()
    setForm({ nama: '', no_hp: '', alamat: '' })
    setShowAdd(false)
    setLoading(false)
  }

  async function handleToggle(id: string, status: string) {
    const newStatus = status === 'aktif' ? 'nonaktif' : 'aktif'
    await supabase.from('pengepul').update({ status: newStatus }).eq('id', id)
    setData(prev => prev.map(p => p.id === id ? { ...p, status: newStatus as any } : p))
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pengepul</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola mitra pengepul sampah</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-primary-100 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Tambah pengepul baru</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Nama', key: 'nama', placeholder: 'UD. Maju Jaya', required: true },
              { label: 'No. HP', key: 'no_hp', placeholder: '08xxxxxxxxxx', required: false },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-gray-600 mb-1">{f.label}</label>
                <input value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  required={f.required} placeholder={f.placeholder}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Alamat</label>
            <input value={form.alamat} onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))}
              placeholder="Jl. Contoh No. 1"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
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

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {data.length === 0 && (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">Belum ada pengepul</p>
          )}
          {data.map(p => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{p.nama}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.no_hp ?? '-'}{p.alamat ? ` · ${p.alamat}` : ''}</p>
              </div>
              <button onClick={() => handleToggle(p.id, p.status)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  p.status === 'aktif'
                    ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}>
                {p.status}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
