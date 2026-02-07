-- --- データベース & テーブル設定 ---

-- 1. 内部建具テーブル (internal_doors)
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

-- 2. 玄関収納テーブル (entrance_storages)
create table if not exists entrance_storages (
  id text primary key,
  name text not null,
  category text not null,
  width integer not null default 0,
  price integer not null default 0,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 送料テーブル (shipping_fees)
create table if not exists shipping_fees (
  id serial primary key,
  prefecture text unique not null,
  price integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --- セキュリティ設定 (RLS) ---

alter table internal_doors enable row level security;
alter table entrance_storages enable row level security;
alter table shipping_fees enable row level security;

-- 匿名アクセスを全て許可（開発・運用用）
create policy "Allow all for anon on internal_doors" on internal_doors for all using (true) with check (true);
create policy "Allow all for anon on entrance_storages" on entrance_storages for all using (true) with check (true);
create policy "Allow all for anon on shipping_fees" on shipping_fees for all using (true) with check (true);

-- --- ストレージ設定 ---

insert into storage.buckets (id, name, public) values ('door-images', 'door-images', true) on conflict (id) do nothing;
create policy "Public Access" on storage.objects for all using ( bucket_id = 'door-images' ) with check ( bucket_id = 'door-images' );

-- --- 初期シードデータ (送料: 全国47都道府県) ---

insert into shipping_fees (prefecture, price) values
('北海道', 35000), ('青森県', 28000), ('岩手県', 28000), ('宮城県', 25000), ('秋田県', 28000),
('山形県', 25000), ('福島県', 25000), ('茨城県', 18000), ('栃木県', 18000), ('群馬県', 18000),
('埼玉県', 15000), ('千葉県', 18000), ('東京都', 15000), ('神奈川県', 15000), ('新潟県', 22000),
('富山県', 20000), ('石川県', 20000), ('福井県', 18000), ('山梨県', 18000), ('長野県', 18000),
('岐阜県', 12000), ('静岡県', 15000), ('愛知県', 12000), ('三重県', 12000), ('滋賀県', 15000),
('京都府', 18000), ('大阪府', 18000), ('兵庫県', 18000), ('奈良県', 18000), ('和歌山県', 20000),
('鳥取県', 25000), ('島根県', 25000), ('岡山県', 22000), ('広島県', 22000), ('山口県', 25000),
('徳島県', 28000), ('香川県', 28000), ('愛媛県', 28000), ('高知県', 28000), ('福岡県', 30000),
('佐賀県', 32000), ('長崎県', 32000), ('熊本県', 32000), ('大分県', 32000), ('宮崎県', 35000),
('鹿児島県', 35000), ('沖縄県', 45000)
on conflict (prefecture) do update set price = excluded.price;

-- --- 初期シードデータ (玄関収納: 主要セット) ---

insert into entrance_storages (id, name, category, width, price) values
('E02', '一の字 W800', '一の字タイプ', 800, 58000),
('E03R', '一の字 W1200(R)', '一の字タイプ', 1200, 72000),
('E03L', '一の字 W1200(L)', '一の字タイプ', 1200, 72000),
('E22', '二の字 W800', '二の字タイプ', 800, 84000),
('E33R', '二の字 W1200(R)', '二の字タイプ', 1200, 108000),
('I20', 'トール W800', 'トールタイプ', 800, 96000),
('C14R', 'コの字 W1200(R)', 'コの字タイプ', 1200, 142000)
on conflict (id) do update set price = excluded.price, name = excluded.name;
