
-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

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
  image_url text, -- URL to the image in Storage or external
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Entrance Storages Table
create table if not exists entrance_storages (
  id text primary key, -- e.g. 'E02'
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

-- Enable RLS on tables
alter table internal_doors enable row level security;
alter table entrance_storages enable row level security;
alter table shipping_fees enable row level security;

-- --- RLS POLICIES (UPDATED: Allow full access for anonymous users) ---

-- internal_doors
drop policy if exists "Allow public read access on internal_doors" on internal_doors;
drop policy if exists "Allow authenticated insert/update on internal_doors" on internal_doors;
create policy "Allow full access on internal_doors" on internal_doors for all using (true) with check (true);

-- entrance_storages
drop policy if exists "Allow public read access on entrance_storages" on entrance_storages;
create policy "Allow full access on entrance_storages" on entrance_storages for all using (true) with check (true);

-- shipping_fees
drop policy if exists "Allow public read access on shipping_fees" on shipping_fees;
create policy "Allow full access on shipping_fees" on shipping_fees for all using (true) with check (true);


-- --- STORAGE SETUP ---

-- Create Storage Bucket for Images (if not exists)
insert into storage.buckets (id, name, public) values ('door-images', 'door-images', true)
on conflict (id) do nothing;

-- Storage Policies
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;

-- Allow public access (read, insert, update, delete) for door-images bucket
create policy "Allow public access on storage" on storage.objects for all using ( bucket_id = 'door-images' ) with check ( bucket_id = 'door-images' );


-- --- INITIAL DATA SEEDING (Sample from Constants) ---
-- (Run this only if tables are empty)

-- Internal Doors (Sample)
insert into internal_doors (type, location, design, height, frame_price, door_price, set_price) 
select '片開き戸', 'LD', 'ガラス戸(透明強化ガラス5mm)', 'H2000', 15320, 30680, 46000
where not exists (select 1 from internal_doors where type='片開き戸' and design='ガラス戸(透明強化ガラス5mm)' and height='H2000');

-- (Note: Only inserting one sample to prevent duplication errors on re-run. 
--  In a real migration, you would handle data seeding more carefully.)
