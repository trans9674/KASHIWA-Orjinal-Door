
-- --- DATABASE & TABLES SETUP ---

-- 1. Internal Doors Table
create table if not exists internal_doors (
  id uuid default gen_random_uuid() primary key,
  type text not null,
  location text not null,
  design text not null,
  height text not null,
  frame_price integer not null default 0,
  door_price integer not null default 0,
  set_price integer not null default 0,
  image_url text, 
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Entrance Storages Table
create table if not exists entrance_storages (
  id text primary key,
  name text not null,
  category text not null,
  width integer not null default 0,
  price integer not null default 0,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Shipping Fees Table
create table if not exists shipping_fees (
  id serial primary key,
  prefecture text unique not null,
  price integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --- COLUMN CHECK & ADDITION (Fix for "missing column" error) ---
-- 既存のテーブルに image_url カラムがない場合、後から追加するための処理
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'internal_doors' and column_name = 'image_url') then
    alter table internal_doors add column image_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'entrance_storages' and column_name = 'image_url') then
    alter table entrance_storages add column image_url text;
  end if;
end $$;

-- --- PERMISSIONS & RLS (Allow Anonymous Access) ---

-- Enable RLS
alter table internal_doors enable row level security;
alter table entrance_storages enable row level security;
alter table shipping_fees enable row level security;

-- Grant permissions to anon role (Anonymous users)
grant usage on schema public to anon;
grant all on all tables in schema public to anon;
grant all on all sequences in schema public to anon;

-- Internal Doors Policies
drop policy if exists "Allow full access on internal_doors" on internal_doors;
drop policy if exists "Allow public read access on internal_doors" on internal_doors;
drop policy if exists "Allow authenticated insert/update on internal_doors" on internal_doors;
create policy "Allow full access on internal_doors" on internal_doors for all using (true) with check (true);

-- Entrance Storages Policies
drop policy if exists "Allow full access on entrance_storages" on entrance_storages;
drop policy if exists "Allow public read access on entrance_storages" on entrance_storages;
create policy "Allow full access on entrance_storages" on entrance_storages for all using (true) with check (true);

-- Shipping Fees Policies
drop policy if exists "Allow full access on shipping_fees" on shipping_fees;
drop policy if exists "Allow public read access on shipping_fees" on shipping_fees;
create policy "Allow full access on shipping_fees" on shipping_fees for all using (true) with check (true);


-- --- STORAGE SETUP (Fix for "Bucket not found" error) ---

-- Grant usage on storage schema
grant usage on schema storage to anon;
grant all on all tables in schema storage to anon;

-- Create Storage Bucket for Images (idempotent)
insert into storage.buckets (id, name, public) values ('door-images', 'door-images', true)
on conflict (id) do update set public = true;

-- Storage Policies (Allow anyone to upload/read/delete in door-images)
drop policy if exists "Allow public access on storage" on storage.objects;
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;

create policy "Allow public access on storage" on storage.objects for all using ( bucket_id = 'door-images' ) with check ( bucket_id = 'door-images' );
