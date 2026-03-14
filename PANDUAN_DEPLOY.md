# Panduan Deploy — Bank Sampah

## Daftar isi
1. [Persiapan Supabase](#1-persiapan-supabase)
2. [Setup project lokal](#2-setup-project-lokal)
3. [Deploy ke Vercel](#3-deploy-ke-vercel)
4. [Custom domain](#4-custom-domain)
5. [Buat akun pertama (admin)](#5-buat-akun-pertama-admin)
6. [Cara tambah pengurus](#6-cara-tambah-pengurus)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Persiapan Supabase

### Buat project
1. Daftar/login di https://supabase.com
2. Klik **New Project**
3. Isi nama project, database password (simpan baik-baik!), dan pilih region terdekat (Singapore)
4. Tunggu project selesai dibuat (~2 menit)

### Jalankan schema database
1. Di sidebar kiri, klik **SQL Editor**
2. Klik **New query**
3. Buka file `schema_bank_sampah_v2.sql` dari folder ini
4. Copy semua isinya, paste ke SQL Editor
5. Klik **Run** (atau Ctrl+Enter)
6. Pastikan tidak ada error merah di bawah

### Ambil kredensial API
1. Klik **Project Settings** (ikon gear di sidebar)
2. Klik **API**
3. Catat dua nilai ini:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (di bagian Project API keys) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (klik reveal) → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Setup project lokal

```bash
# Clone atau download project ini, lalu masuk ke foldernya
cd bank-sampah

# Install dependencies
npm install

# Salin file env
cp .env.local.example .env.local
```

Buka `.env.local` dengan teks editor, isi dengan nilai dari Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```bash
# Jalankan di mode development
npm run dev
```

Buka http://localhost:3000 di browser.

---

## 3. Deploy ke Vercel

### Siapkan repository GitHub
```bash
# Di folder bank-sampah
git init
git add .
git commit -m "Initial commit"
```

Buat repo baru di https://github.com/new, lalu:
```bash
git remote add origin https://github.com/username/bank-sampah.git
git push -u origin main
```

### Deploy di Vercel
1. Buka https://vercel.com dan login (bisa pakai akun GitHub)
2. Klik **Add New → Project**
3. Pilih repo `bank-sampah` dari daftar
4. Di bagian **Environment Variables**, tambahkan 3 variabel:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxxxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJ... (anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJ... (service role key) |

5. Klik **Deploy**
6. Tunggu build selesai (~2-3 menit)
7. App live di URL `https://bank-sampah-xxx.vercel.app`

### Update deploy otomatis
Setelah ini, setiap `git push` ke branch `main` akan otomatis trigger deploy baru di Vercel.

---

## 4. Custom domain

### Beli domain
Rekomendasi registrar Indonesia:
- **Niagahoster** (niagahoster.co.id) — harga terjangkau
- **Domainesia** (domainesia.com)
- **Cloudflare** (cloudflare.com) — harga at-cost, panel bagus

Saran nama domain: `banksampah-[nama-komunitas].id` atau `.com`

### Pasang di Vercel
1. Di dashboard Vercel, masuk ke project → **Settings → Domains**
2. Ketik domain kamu (misal: `banksampahku.id`) → **Add**
3. Vercel akan kasih 2 DNS record yang perlu ditambahkan:
   - Type `A`, pointing ke IP Vercel
   - Type `CNAME` untuk `www`
4. Login ke panel domain kamu (Niagahoster/Cloudflare/dll)
5. Masuk ke **DNS Management**
6. Tambahkan record sesuai instruksi Vercel
7. Tunggu propagasi DNS (~5-30 menit, kadang sampai 24 jam)
8. SSL/HTTPS otomatis aktif gratis lewat Vercel

---

## 5. Buat akun pertama (admin)

Admin tidak bisa daftar sendiri lewat UI. Harus dibuat manual:

### Langkah 1 — Buat user di Supabase Auth
1. Di Supabase Dashboard → **Authentication → Users**
2. Klik **Add user → Create new user**
3. Isi email dan password
4. Klik **Create user**

### Langkah 2 — Set role admin
1. Klik nama user yang baru dibuat
2. Scroll ke bagian **User Metadata**
3. Klik edit, isi:
```json
{
  "role": "admin"
}
```
4. Klik **Save**

### Langkah 3 — Buat data pengurus
Kembali ke **SQL Editor**, jalankan:
```sql
INSERT INTO pengurus (user_id, nama, jabatan)
VALUES (
  'paste-user-id-disini',   -- ambil dari halaman user di Auth
  'Nama Admin',
  'Admin'
);
```

Selesai! Coba login dengan email dan password yang dibuat tadi.

---

## 6. Cara tambah pengurus

### Opsi A — Buat akun baru untuk pengurus
1. Supabase → Authentication → Add user
2. Set user metadata: `{ "role": "pengurus" }`
3. Jalankan SQL:
```sql
INSERT INTO pengurus (user_id, nama, jabatan)
VALUES ('user-id-pengurus', 'Nama Pengurus', 'Petugas Timbang');
```

### Opsi B — Pengurus yang juga nasabah
Kalau pengurus sudah punya akun nasabah sebelumnya:
1. Daftarkan sebagai pengurus (opsi A)
2. Hubungkan ke profil nasabah lama:
```sql
UPDATE pengurus
SET nasabah_id = 'id-dari-tabel-nasabah'
WHERE user_id = 'user-id-pengurus';
```
Pengurus ini nanti bisa switch ke mode nasabah dari sidebar.

---

## 7. Troubleshooting

### Error "relation does not exist"
Schema belum dijalankan. Ulangi langkah di bagian Supabase → SQL Editor.

### Error "new row violates row-level security policy"
Kemungkinan role di user metadata belum di-set, atau pengurus/nasabah belum punya row di tabel yang sesuai.

### Halaman putih / redirect loop
Cek environment variables di Vercel. Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` sudah benar.

### Saldo tidak update setelah penimbangan
Pastikan trigger `trg_saldo_timbang` sudah aktif. Cek di Supabase → **Database → Functions** apakah function `update_saldo_setelah_timbang` ada.

### Custom domain tidak aktif
DNS propagasi butuh waktu. Cek status di https://dnschecker.org dengan domain kamu.

---

## Struktur file lengkap

```
bank-sampah/
├── .env.local.example          # Template environment variables
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── middleware.ts               # Auth & role routing otomatis
├── schema_bank_sampah_v2.sql   # ← JALANKAN INI DI SUPABASE
│
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                # Redirect otomatis ke dashboard
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx   # Hanya untuk nasabah baru
│   └── dashboard/
│       ├── layout.tsx          # Sidebar + auth check
│       ├── nasabah/
│       │   ├── page.tsx        # Ringkasan saldo
│       │   ├── penimbangan/    # Riwayat setor
│       │   └── tarik-dana/     # Ajukan pencairan
│       ├── pengurus/
│       │   ├── page.tsx        # Overview statistik
│       │   ├── penimbangan/    # List + input + edit
│       │   └── penjualan/      # Jual ke pengepul
│       └── admin/
│           ├── page.tsx        # Overview lengkap
│           ├── nasabah/        # Daftar semua nasabah
│           ├── penimbangan/    # Semua transaksi
│           ├── tarik-dana/     # Approve/reject pencairan
│           ├── pengepul/       # Kelola mitra pengepul
│           └── jenis-sampah/   # Atur harga sampah
│
├── components/
│   └── layout/
│       └── Sidebar.tsx         # Navigasi + mode switch
│
├── lib/
│   └── supabase/
│       ├── client.ts           # Untuk komponen browser
│       └── server.ts           # Untuk server components
│
└── types/
    └── database.ts             # TypeScript types semua tabel
```
