
-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- 1. Internal Doors Table
create table internal_doors (
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
create table entrance_storages (
  id text primary key, -- e.g. 'E02'
  name text not null,
  category text not null,
  width integer not null default 0,
  price integer not null default 0,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Shipping Fees Table
create table shipping_fees (
  id serial primary key,
  prefecture text unique not null,
  price integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on tables (Open read access for now as per app requirements)
alter table internal_doors enable row level security;
create policy "Allow public read access on internal_doors" on internal_doors for select using (true);
create policy "Allow authenticated insert/update on internal_doors" on internal_doors for all using (auth.role() = 'authenticated');

alter table entrance_storages enable row level security;
create policy "Allow public read access on entrance_storages" on entrance_storages for select using (true);

alter table shipping_fees enable row level security;
create policy "Allow public read access on shipping_fees" on shipping_fees for select using (true);

-- Create Storage Bucket for Images
insert into storage.buckets (id, name, public) values ('door-images', 'door-images', true);
create policy "Public Access" on storage.objects for select using ( bucket_id = 'door-images' );
create policy "Authenticated Upload" on storage.objects for insert with check ( bucket_id = 'door-images' AND auth.role() = 'authenticated' );

-- --- INITIAL DATA SEEDING (Sample from Constants) ---

-- Internal Doors (Sample)
insert into internal_doors (type, location, design, height, frame_price, door_price, set_price) values
('片開き戸', 'LD', 'ガラス戸(透明強化ガラス5mm)', 'H2000', 15320, 30680, 46000),
('片開き戸', 'LD', 'ガラス戸(透明強化ガラス5mm)', 'H2200', 17470, 35730, 53200),
('片開き戸', 'LD', 'ガラス戸(透明強化ガラス5mm)', 'H2400', 17470, 35730, 53200),
('片開き戸', '居室', 'フラット', 'H2000', 13440, 11260, 24700),
('片開き戸', '居室', 'フラット', 'H2200', 15060, 12240, 27300),
('片開き戸', '居室', 'フラット', 'H2400', 15140, 13060, 28200),
('片開き戸', 'トイレ・洗面', 'フラット 表示錠', 'H2000', 15400, 11500, 26900),
('片開き戸', 'トイレ・洗面', 'フラット 表示錠', 'H2200', 17150, 12450, 29600),
('片開き戸', 'トイレ・洗面', 'フラット 表示錠', 'H2400', 17300, 13300, 30600),
('片開き戸', 'トイレ・洗面', 'フラット 表示錠 遮音仕様', 'H2000', 27900, 26500, 54400),
('片開き戸', 'トイレ・洗面', 'フラット 表示錠 遮音仕様', 'H2200', 29650, 27450, 57100),
('片開き戸', 'トイレ・洗面', 'フラット 表示錠 遮音仕様', 'H2400', 29800, 28300, 58100),
('片引戸', 'LD', 'ガラス戸(透明強化ガラス5mm)', 'H2000', 11220, 41180, 52400),
('片引戸', 'LD', 'ガラス戸(透明強化ガラス5mm)', 'H2200', 11220, 47480, 58700),
('片引戸', '居室', 'フラット', 'H2000', 12080, 16720, 28800),
('片引戸', '居室', 'フラット', 'H2200', 12710, 17590, 30300),
('片引戸', 'トイレ・洗面', 'フラット 表示錠', 'H2000', 12350, 20550, 32900),
('片引戸', 'トイレ・洗面', 'フラット 表示錠', 'H2200', 13010, 21590, 34600),
('折戸2枚', '居室', 'フラット', 'H2000', 6490, 9710, 16200),
('折戸2枚', '居室', 'フラット', 'H2200', 6970, 10230, 17200),
('物入両開き', '居室', 'フラット', 'H2000', 8980, 11420, 20400),
('物入両開き', '居室', 'フラット', 'H2200', 9650, 12350, 22000);
-- Note: You should continue inserting the rest of PRICE_LIST data here.

-- Entrance Storages
insert into entrance_storages (id, name, category, width, price) values
('E02', 'W800(E02)/2枚', '一の字タイプ', 800, 23700),
('E03R', 'W1200(E03)/3枚(R)片開き右', '一の字タイプ', 1200, 39800),
('E03L', 'W1200(E03)/3枚(L)片開き左', '一の字タイプ', 1200, 39800),
('E04', 'W1600(E04)/4枚', '一の字タイプ', 1600, 47300),
('E05R', 'W2000(E05)/5枚(R)片開き右', '一の字タイプ', 2000, 63500),
('E05L', 'W2000(E05)/5枚(L)片開き左', '一の字タイプ', 2000, 63500),
('E22', 'W800(E22)/2枚', '二の字タイプ', 800, 42500),
('E33R', 'W1200(E33)/3枚(R)片開き右', '二の字タイプ', 1200, 71200),
('I20', 'W800(I20)/2枚', 'トールタイプ', 800, 38500),
('I30R', 'W1200(I30)/3枚(R)片開き右', 'トールタイプ', 1200, 65700),
('I40', 'W1600(I40)/4枚', 'トールタイプ', 1600, 77000),
('C14R', 'W1200(C14)/(R)トール右', 'コの字タイプ', 1200, 69600),
('C24R', 'W1600(C24)/(R)トール右', 'コの字タイプ', 1600, 81000),
('L12R', 'W1200(L12)/(R)トール右', 'L型タイプ', 1200, 50800),
('L22R', 'W1600(L22)/(R)トール右', 'L型タイプ', 1600, 62200);

-- Shipping Fees
insert into shipping_fees (prefecture, price) values
('青森県', 58000), ('岩手県', 58000), ('宮城県', 53000), ('福島県', 53000), ('山形県', 53000),
('茨城県', 48000), ('栃木県', 45000), ('群馬県', 45000), ('東京都', 43000), ('埼玉県', 43000),
('千葉県', 43000), ('神奈川県', 43000), ('福井県', 42000), ('山梨県', 42000), ('長野県', 42000),
('新潟県', 42000), ('岐阜県', 40000), ('愛知県', 40000), ('静岡県', 42000), ('三重県', 40000),
('大阪府', 42000), ('滋賀県', 42000), ('京都府', 42000), ('兵庫県', 42000), ('和歌山県', 45000),
('島根県', 58000), ('岡山県', 50000), ('広島県', 50000), ('山口県', 58000), ('徳島県', 48000),
('愛媛県', 53000), ('高知県', 48000), ('福岡県', 68000), ('佐賀県', 68000), ('長崎県', 68000),
('熊本県', 68000), ('鹿児島県', 68000);
