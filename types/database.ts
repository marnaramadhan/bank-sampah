export type Role = 'nasabah' | 'pengurus' | 'admin'
export type StatusTarikDana = 'pending' | 'approved' | 'rejected'
export type StatusPenimbangan = 'selesai' | 'batal'
export type StatusPengepul = 'aktif' | 'nonaktif'

export interface Nasabah {
  id: string
  user_id: string | null
  nama: string
  no_hp: string | null
  alamat: string | null
  saldo: number
  created_at: string
}

export interface Pengurus {
  id: string
  user_id: string
  nasabah_id: string | null
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
  persentase_nasabah: number
  harga_nasabah: number
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
  pengepul?: Pick<Pengepul, 'id' | 'nama'>
  jenis_sampah?: Pick<JenisSampah, 'id' | 'nama'>
}

export type Database = {
  public: {
    Tables: {
      nasabah: {
        Row: Nasabah
        Insert: {
          user_id?: string | null
          nama: string
          no_hp?: string | null
          alamat?: string | null
          saldo?: number
        }
        Update: Partial<Nasabah>
      }
      pengurus: {
        Row: Pengurus
        Insert: {
          user_id: string
          nasabah_id?: string | null
          nama: string
          no_hp?: string | null
          jabatan?: string | null
        }
        Update: Partial<Pengurus>
      }
      jenis_sampah: {
        Row: JenisSampah
        Insert: {
          nama: string
          kategori?: string | null
          harga_pengepul: number
          persentase_nasabah: number
          aktif?: boolean
        }
        Update: Partial<Omit<JenisSampah, 'harga_nasabah'>>
      }
      pengepul: {
        Row: Pengepul
        Insert: {
          nama: string
          no_hp?: string | null
          alamat?: string | null
          status?: string
        }
        Update: Partial<Pengepul>
      }
      penimbangan: {
        Row: Penimbangan
        Insert: {
          nasabah_id: string
          jenis_sampah_id: string
          pengurus_id: string
          berat_kg: number
          harga_saat_setor: number
          total_nilai: number
          status?: string
          catatan?: string | null
          tanggal?: string
          edited_at?: string | null
          edited_by?: string | null
        }
        Update: Partial<Penimbangan>
      }
      tarik_dana: {
        Row: TarikDana
        Insert: {
          nasabah_id: string
          jumlah: number
          metode?: string
          status?: string
          catatan?: string | null
          diproses_oleh?: string | null
        }
        Update: Partial<TarikDana>
      }
      penjualan_pengepul: {
        Row: PenjualanPengepul
        Insert: {
          pengepul_id: string
          jenis_sampah_id: string
          pengurus_id: string
          berat_kg: number
          harga_saat_jual: number
          total_nilai: number
          catatan?: string | null
        }
        Update: Partial<PenjualanPengepul>
      }
    }
  }
}