'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Recycle, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({ nama: '', email: '', password: '', no_hp: '', alamat: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Daftarkan user ke Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { role: 'nasabah' }
      }
    })

    if (authError || !data.user) {
      setError(authError?.message ?? 'Gagal mendaftar. Coba lagi.')
      setLoading(false)
      return
    }

    // 2. Buat profil nasabah
    const { error: profileError } = await supabase.from('nasabah').insert({
      user_id: data.user.id,
      nama: form.nama,
      no_hp: form.no_hp,
      alamat: form.alamat,
      saldo: 0,
    })

    if (profileError) {
      setError('Akun dibuat tapi gagal simpan profil. Hubungi admin.')
      setLoading(false)
      return
    }

    router.push('/dashboard/nasabah')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 mb-4">
            <Recycle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Nasabah</h1>
          <p className="text-sm text-gray-500 mt-1">Buat akun bank sampah kamu</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {[
            { label: 'Nama lengkap', name: 'nama', type: 'text', placeholder: 'Budi Santoso' },
            { label: 'Email', name: 'email', type: 'email', placeholder: 'nama@email.com' },
            { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••' },
            { label: 'No. HP', name: 'no_hp', type: 'tel', placeholder: '08xxxxxxxxxx' },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                required={field.name !== 'no_hp'}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={field.placeholder}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat</label>
            <textarea
              name="alamat"
              value={form.alamat}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Jl. Contoh No. 1, RT 01/02, Kota"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Sudah punya akun?{' '}
          <Link href="/auth/login" className="text-primary-600 font-medium hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
