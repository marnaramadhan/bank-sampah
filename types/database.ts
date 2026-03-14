export type Role = 'nasabah' | 'pengurus' | 'admin'

export type StatusTarikDana = 'pending' | 'approved' | 'rejected'
export type StatusPenimbangan = 'selesai' | 'batal'
export type StatusPengepul = 'aktif' | 'nonaktif'

export interface Nasabah {
  id: string
  user_id: string
  nama: string
  no_hp: string | null
  alamat: string | null
  saldo: number
  created_at: string
}

export interface Pengurus {
  id: string
  user_id: string
  nasabah_id: string | null   // ada = pengurus ini juga nasabah
  nama: string
  no_hp: string | null
  jabatan: string | null
  created_at: string
}

export interface JenisSampah {
  id: string
  nama: string
  kategori: string | null
  harga_pengepul: number
  persentase_nasabah: number   // 0–100
  harga_nasabah: number        // generated: harga_pengepul * persentase_nasabah / 100
  aktif: boolean
  updated_at: string
}

export interface Pengepul {
  id: string
  nama: string
  no_hp: string | null
  alamat: string | null
  status: StatusPengepul
  created_at: string
}

export interface Penimbangan {
  id: string
  nasabah_id: string
  jenis_sampah_id: string
  pengurus_id: string
  berat_kg: number
  harga_saat_setor: number
  total_nilai: number
  status: StatusPenimbangan
  catatan: string | null
  tanggal: string
  edited_at: string | null
  edited_by: string | null
  // Joined
  nasabah?: Pick<Nasabah, 'id' | 'nama'>
  jenis_sampah?: Pick<JenisSampah, 'id' | 'nama' | 'kategori'>
  pengurus?: Pick<Pengurus, 'id' | 'nama'>
}

export interface TarikDana {
  id: string
  nasabah_id: string
  jumlah: number
  metode: string
  status: StatusTarikDana
  catatan: string | null
  diproses_oleh: string | null
  tanggal: string
  // Joined fields
  nasabah?: Pick<Nasabah, 'id' | 'nama'>
}

export interface PenjualanPengepul {
  id: string
  pengepul_id: string
  jenis_sampah_id: string
  pengurus_id: string
  berat_kg: number
  harga_saat_jual: number
  total_nilai: number
  catatan: string | null
  tanggal: string
  // Joined fields
  pengepul?: Pick<Pengepul, 'id' | 'nama'>
  jenis_sampah?: Pick<JenisSampah, 'id' | 'nama'>
}

// Untuk Supabase client typing
export type Database = {
  public: {
    Tables: {
      nasabah: { Row: Nasabah; Insert: Omit<Nasabah, 'id' | 'created_at'>; Update: Partial<Nasabah> }
      pengurus: { Row: Pengurus; Insert: Omit<Pengurus, 'id' | 'created_at'>; Update: Partial<Pengurus> }
      jenis_sampah: { Row: JenisSampah; Insert: Omit<JenisSampah, 'id' | 'updated_at' | 'harga_nasabah'>; Update: Partial<Omit<JenisSampah, 'harga_nasabah'>> }
      pengepul: { Row: Pengepul; Insert: Omit<Pengepul, 'id' | 'created_at'>; Update: Partial<Pengepul> }
      penimbangan: { Row: Penimbangan; Insert: Omit<Penimbangan, 'id'>; Update: Partial<Penimbangan> }
      tarik_dana: { Row: TarikDana; Insert: Omit<TarikDana, 'id'>; Update: Partial<TarikDana> }
      penjualan_pengepul: { Row: PenjualanPengepul; Insert: Omit<PenjualanPengepul, 'id'>; Update: Partial<PenjualanPengepul> }
    }
  }
}
