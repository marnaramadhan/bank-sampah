-- ============================================================
-- SCHEMA BANK SAMPAH v2
-- Perubahan dari v1:
--   - jenis_sampah: harga_nasabah → persentase_nasabah + harga_nasabah generated column
--   - pengurus: tambah nasabah_id (opsional, untuk pengurus yang juga nasabah)
--   - penimbangan: pengurus bisa edit (update RLS)
-- ============================================================

create extension if not exists "uuid-ossp";


-- ============================================================
-- 1. TABEL UTAMA
-- ============================================================

create table nasabah (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  nama        text not null,
  no_hp       text,
  alamat      text,
  saldo       numeric(12, 2) not null default 0,
  created_at  timestamptz not null default now(),
  unique(user_id)
);

-- Pengurus bisa juga nasabah: nasabah_id nullable
-- Kalau diisi, berarti pengurus ini punya akun nasabah juga
create table pengurus (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  nasabah_id  uuid references nasabah(id) on delete set null,  -- nullable
  nama        text not null,
  no_hp       text,
  jabatan     text,
  created_at  timestamptz not null default now(),
  unique(user_id)
);

-- harga_nasabah dihitung otomatis: harga_pengepul * persentase_nasabah / 100
create table jenis_sampah (
  id                  uuid primary key default uuid_generate_v4(),
  nama                text not null,
  kategori            text,
  harga_pengepul      numeric(10, 2) not null default 0,
  persentase_nasabah  numeric(5, 2) not null default 70,        -- 0–100
  harga_nasabah       numeric(10, 2) generated always as
                        (round(harga_pengepul * persentase_nasabah / 100, 0)) stored,
  aktif               boolean not null default true,
  updated_at          timestamptz not null default now()
);

create table pengepul (
  id          uuid primary key default uuid_generate_v4(),
  nama        text not null,
  no_hp       text,
  alamat      text,
  status      text not null default 'aktif',
  created_at  timestamptz not null default now()
);


-- ============================================================
-- 2. TABEL TRANSAKSI
-- ============================================================

create table penimbangan (
  id               uuid primary key default uuid_generate_v4(),
  nasabah_id       uuid not null references nasabah(id),
  jenis_sampah_id  uuid not null references jenis_sampah(id),
  pengurus_id      uuid not null references pengurus(id),
  berat_kg         numeric(8, 2) not null,
  harga_saat_setor numeric(10, 2) not null,
  total_nilai      numeric(12, 2) not null,
  status           text not null default 'selesai',   -- selesai | batal
  catatan          text,
  tanggal          timestamptz not null default now(),
  edited_at        timestamptz,                        -- kapan terakhir diedit
  edited_by        uuid references pengurus(id)        -- siapa yang edit
);

create table tarik_dana (
  id            uuid primary key default uuid_generate_v4(),
  nasabah_id    uuid not null references nasabah(id),
  jumlah        numeric(12, 2) not null,
  metode        text not null default 'tunai',
  status        text not null default 'pending',
  catatan       text,
  diproses_oleh uuid references pengurus(id),
  tanggal       timestamptz not null default now()
);

create table penjualan_pengepul (
  id               uuid primary key default uuid_generate_v4(),
  pengepul_id      uuid not null references pengepul(id),
  jenis_sampah_id  uuid not null references jenis_sampah(id),
  pengurus_id      uuid not null references pengurus(id),
  berat_kg         numeric(8, 2) not null,
  harga_saat_jual  numeric(10, 2) not null,
  total_nilai      numeric(12, 2) not null,
  catatan          text,
  tanggal          timestamptz not null default now()
);


-- ============================================================
-- 3. FUNGSI & TRIGGER
-- ============================================================

-- Update saldo nasabah setelah penimbangan baru
create or replace function update_saldo_setelah_timbang()
returns trigger as $$
begin
  update nasabah set saldo = saldo + new.total_nilai where id = new.nasabah_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_saldo_timbang
  after insert on penimbangan
  for each row
  when (new.status = 'selesai')
  execute function update_saldo_setelah_timbang();

-- Koreksi saldo saat penimbangan diedit (batal atau ubah nilai)
create or replace function koreksi_saldo_edit_timbang()
returns trigger as $$
begin
  -- Jika status berubah dari selesai → batal: kembalikan saldo
  if old.status = 'selesai' and new.status = 'batal' then
    update nasabah set saldo = saldo - old.total_nilai where id = old.nasabah_id;

  -- Jika total_nilai berubah (koreksi berat/harga) dan status tetap selesai
  elsif old.status = 'selesai' and new.status = 'selesai'
    and old.total_nilai <> new.total_nilai then
    update nasabah
      set saldo = saldo - old.total_nilai + new.total_nilai
      where id = old.nasabah_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_koreksi_timbang
  after update on penimbangan
  for each row
  execute function koreksi_saldo_edit_timbang();

-- Update saldo setelah tarik dana di-approve
create or replace function update_saldo_setelah_tarik()
returns trigger as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    update nasabah set saldo = saldo - new.jumlah where id = new.nasabah_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_saldo_tarik
  after update on tarik_dana
  for each row
  execute function update_saldo_setelah_tarik();

-- Auto updated_at
create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_jenis_sampah_updated
  before update on jenis_sampah
  for each row execute function set_updated_at();


-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

alter table nasabah            enable row level security;
alter table pengurus           enable row level security;
alter table jenis_sampah       enable row level security;
alter table pengepul           enable row level security;
alter table penimbangan        enable row level security;
alter table tarik_dana         enable row level security;
alter table penjualan_pengepul enable row level security;

-- Helper: ambil role dari JWT
create or replace function get_my_role()
returns text as $$
  select coalesce(
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role'
  );
$$ language sql stable;

-- Helper: ambil pengurus.id dari user yang login
create or replace function get_my_pengurus_id()
returns uuid as $$
  select id from pengurus where user_id = auth.uid() limit 1;
$$ language sql stable security definer;

-- Helper: ambil nasabah_id milik pengurus yang login (kalau ada)
create or replace function get_my_nasabah_id_as_pengurus()
returns uuid as $$
  select nasabah_id from pengurus where user_id = auth.uid() limit 1;
$$ language sql stable security definer;

-- ---- NASABAH ----
create policy "nasabah: lihat data sendiri"
  on nasabah for select
  using (
    user_id = auth.uid()
    or id = get_my_nasabah_id_as_pengurus()   -- pengurus lihat data nasabah miliknya
  );

create policy "nasabah: update data sendiri"
  on nasabah for update
  using (user_id = auth.uid());

create policy "admin: full access nasabah"
  on nasabah for all using (get_my_role() = 'admin');

create policy "pengurus & admin: lihat semua nasabah"
  on nasabah for select
  using (get_my_role() in ('admin', 'pengurus'));

-- ---- PENGURUS ----
create policy "pengurus & admin: lihat semua pengurus"
  on pengurus for select
  using (get_my_role() in ('admin', 'pengurus'));

create policy "admin: full access pengurus"
  on pengurus for all using (get_my_role() = 'admin');

-- ---- JENIS SAMPAH ----
create policy "semua login: lihat jenis sampah aktif"
  on jenis_sampah for select
  using (aktif = true or get_my_role() = 'admin');

create policy "admin: kelola jenis sampah"
  on jenis_sampah for all using (get_my_role() = 'admin');

-- ---- PENGEPUL ----
create policy "pengurus & admin: lihat pengepul"
  on pengepul for select using (get_my_role() in ('admin', 'pengurus'));

create policy "admin: kelola pengepul"
  on pengepul for all using (get_my_role() = 'admin');

-- ---- PENIMBANGAN ----
-- Nasabah lihat miliknya (termasuk pengurus yang jadi nasabah)
create policy "nasabah: lihat penimbangan sendiri"
  on penimbangan for select
  using (
    nasabah_id = (select id from nasabah where user_id = auth.uid())
    or nasabah_id = get_my_nasabah_id_as_pengurus()
  );

create policy "pengurus & admin: lihat semua penimbangan"
  on penimbangan for select using (get_my_role() in ('admin', 'pengurus'));

create policy "pengurus: input penimbangan"
  on penimbangan for insert
  with check (get_my_role() in ('admin', 'pengurus'));

-- Pengurus hanya bisa edit penimbangan yang dia input sendiri
create policy "pengurus: edit penimbangan sendiri"
  on penimbangan for update
  using (
    get_my_role() in ('admin', 'pengurus')
    and (pengurus_id = get_my_pengurus_id() or get_my_role() = 'admin')
  );

-- ---- TARIK DANA ----
create policy "nasabah: lihat tarik dana sendiri"
  on tarik_dana for select
  using (
    nasabah_id = (select id from nasabah where user_id = auth.uid())
    or nasabah_id = get_my_nasabah_id_as_pengurus()
  );

create policy "nasabah: ajukan tarik dana"
  on tarik_dana for insert
  with check (
    (nasabah_id = (select id from nasabah where user_id = auth.uid())
    or nasabah_id = get_my_nasabah_id_as_pengurus())
    and status = 'pending'
  );

create policy "pengurus & admin: lihat semua tarik dana"
  on tarik_dana for select using (get_my_role() in ('admin', 'pengurus'));

create policy "admin: full access tarik dana"
  on tarik_dana for all using (get_my_role() = 'admin');

-- ---- PENJUALAN PENGEPUL ----
create policy "pengurus & admin: lihat penjualan"
  on penjualan_pengepul for select using (get_my_role() in ('admin', 'pengurus'));

create policy "pengurus: input penjualan"
  on penjualan_pengepul for insert
  with check (get_my_role() in ('admin', 'pengurus'));

create policy "admin: full access penjualan"
  on penjualan_pengepul for all using (get_my_role() = 'admin');


-- ============================================================
-- 5. SEED DATA
-- ============================================================

insert into jenis_sampah (nama, kategori, harga_pengepul, persentase_nasabah) values
  ('Botol plastik PET',  'Plastik', 3000,  70),
  ('Plastik keras HDPE', 'Plastik', 2500,  70),
  ('Kertas HVS',         'Kertas',  2000,  65),
  ('Kardus',             'Kertas',  1800,  65),
  ('Kaleng aluminium',   'Logam',  12000,  75),
  ('Besi/baja',          'Logam',   4000,  70);

-- Catatan: harga_nasabah dihitung otomatis, contoh hasil:
--   Botol plastik PET  → nasabah Rp 2.100/kg (70% dari 3.000)
--   Kaleng aluminium   → nasabah Rp 9.000/kg (75% dari 12.000)
