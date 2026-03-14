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