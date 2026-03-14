'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Recycle, LayoutDashboard, Scale, Wallet, LogOut,
  Users, Package, ShoppingCart, BarChart3, Settings,
  ArrowLeftRight
} from 'lucide-react'
import type { Role } from '@/types/database'

const navItems: Record<Role, { href: string; label: string; icon: React.ElementType }[]> = {
  nasabah: [
    { href: '/dashboard/nasabah', label: 'Ringkasan', icon: LayoutDashboard },
    { href: '/dashboard/nasabah/penimbangan', label: 'Riwayat Setor', icon: Scale },
    { href: '/dashboard/nasabah/tarik-dana', label: 'Tarik Dana', icon: Wallet },
  ],
  pengurus: [
    { href: '/dashboard/pengurus', label: 'Overview', icon: BarChart3 },
    { href: '/dashboard/pengurus/penimbangan', label: 'Input Timbang', icon: Scale },
    { href: '/dashboard/pengurus/penjualan', label: 'Jual ke Pengepul', icon: ShoppingCart },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Overview', icon: BarChart3 },
    { href: '/dashboard/admin/nasabah', label: 'Nasabah', icon: Users },
    { href: '/dashboard/admin/penimbangan', label: 'Penimbangan', icon: Scale },
    { href: '/dashboard/admin/tarik-dana', label: 'Tarik Dana', icon: Wallet },
    { href: '/dashboard/admin/pengepul', label: 'Pengepul', icon: Package },
    { href: '/dashboard/admin/jenis-sampah', label: 'Jenis Sampah', icon: Settings },
  ],
}

interface SidebarProps {
  role: Role
  nama: string
  viewMode?: 'pengurus' | 'nasabah'
  hasNasabahProfile?: boolean
}

export default function Sidebar({ role, nama, viewMode, hasNasabahProfile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const roleLabel: Record<string, string> = {
    nasabah: 'Nasabah',
    pengurus: 'Pengurus',
    admin: 'Admin',
  }

  const activeRole: Role = (role === 'pengurus' && viewMode === 'nasabah') ? 'nasabah' : role

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  function handleSwitchMode() {
    if (viewMode === 'nasabah') {
      router.push('/dashboard/pengurus')
    } else {
      router.push('/dashboard/nasabah')
    }
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shrink-0">
          <Recycle className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">Bank Sampah</p>
          <p className="text-xs text-gray-400">{roleLabel[activeRole]}</p>
        </div>
      </div>

      {role === 'pengurus' && hasNasabahProfile && (
        <button
          onClick={handleSwitchMode}
          className="mx-3 mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-200 text-xs text-gray-500 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          {viewMode === 'nasabah' ? 'Kembali ke mode pengurus' : 'Lihat sebagai nasabah'}
        </button>
      )}

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems[activeRole].map(item => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-gray-900 truncate">{nama}</p>
          <p className="text-xs text-gray-400">{roleLabel[activeRole]}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  )
}
