# Bank Sampah — Next.js + Supabase

Aplikasi manajemen bank sampah dengan 3 role: **Nasabah**, **Pengurus**, dan **Admin**.

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Backend & Database**: Supabase (Auth + PostgreSQL + RLS)
- **Deploy**: Vercel

---

## Setup

### 1. Clone & install dependencies
```bash
npm install
```

### 2. Setup Supabase
1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** → paste & run isi file `schema_bank_sampah.sql`
3. Ambil kredensial di **Project Settings → API**

### 3. Konfigurasi environment
```bash
cp .env.local.example .env.local
```
Isi `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Jalankan development server
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000)

---

## Buat akun admin pertama

Karena admin tidak bisa daftar sendiri lewat UI, buat lewat Supabase Dashboard:

1. **Authentication → Users → Add user**
2. Isi email & password
3. Setelah user dibuat, klik user tersebut → edit **User Metadata**:
   ```json
   { "role": "admin" }
   ```
4. Buat data pengurus di tabel `pengurus`:
   ```sql
   INSERT INTO pengurus (user_id, nama, jabatan)
   VALUES ('<user-id>', 'Nama Admin', 'Admin');
   ```

---

## Struktur folder

```
bank-sampah/
├── app/
│   ├── auth/
│   │   ├── login/          # Halaman login
│   │   └── register/       # Halaman daftar nasabah
│   └── dashboard/
│       ├── layout.tsx      # Layout dengan sidebar
│       ├── nasabah/        # Dashboard nasabah
│       ├── pengurus/       # Dashboard pengurus
│       │   ├── penimbangan/  # Form input timbang
│       │   └── penjualan/    # Form jual ke pengepul
│       └── admin/
│           ├── tarik-dana/   # Approve/reject tarik dana
│           └── jenis-sampah/ # Kelola harga sampah
├── components/
│   └── layout/
│       └── Sidebar.tsx     # Navigasi sidebar
├── lib/
│   └── supabase/
│       ├── client.ts       # Supabase client (browser)
│       └── server.ts       # Supabase client (server)
├── types/
│   └── database.ts         # TypeScript types
└── middleware.ts            # Auth & role-based routing
```

---

## Role & akses

| Fitur | Nasabah | Pengurus | Admin |
|---|:---:|:---:|:---:|
| Lihat saldo & riwayat | ✅ | — | ✅ |
| Ajukan tarik dana | ✅ | — | ✅ |
| Input penimbangan | — | ✅ | ✅ |
| Overview statistik | — | ✅ | ✅ |
| Jual ke pengepul | — | ✅ | ✅ |
| Approve tarik dana | — | — | ✅ |
| Kelola jenis sampah | — | — | ✅ |
| Kelola pengepul | — | — | ✅ |
| Kelola akun pengguna | — | — | ✅ |

---

## Deploy ke Vercel

1. Push ke GitHub
2. Import repo di [vercel.com](https://vercel.com)
3. Tambahkan environment variables (sama seperti `.env.local`)
4. Deploy — custom domain bisa diatur di **Settings → Domains**
