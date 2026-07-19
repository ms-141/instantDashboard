-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

-- Customers
create table customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  phone      text,
  notes      text,
  created_at timestamptz not null default now()
);

-- Orders
create table orders (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references customers(id) on delete restrict,
  order_number text,
  status       text not null default 'new'
               check (status in ('new','in_progress','completed','delivered','cancelled')),
  due_date     date not null,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Logos (multiple per order)
create table order_logos (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  name          text,
  price         numeric(10,2),
  width_inches  numeric(6,2) not null,
  height_inches numeric(6,2) not null,
  placement     text not null,
  notes         text
);

-- Garments (multiple per order)
create table order_garments (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  garment_type text not null,
  quantity     integer not null default 1,
  price        numeric(10,2),
  color        text,
  sizes        text,
  supplied_by  text not null default 'customer'
               check (supplied_by in ('us','customer')),
  notes        text
);

-- Auto-update updated_at on orders
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- Row Level Security: only authenticated users can access data
alter table customers    enable row level security;
alter table orders       enable row level security;
alter table order_logos  enable row level security;
alter table order_garments enable row level security;

create policy "auth users" on customers    for all using (auth.role() = 'authenticated');
create policy "auth users" on orders       for all using (auth.role() = 'authenticated');
create policy "auth users" on order_logos  for all using (auth.role() = 'authenticated');
create policy "auth users" on order_garments for all using (auth.role() = 'authenticated');

-- Imported order queue (for email/webhook intake + manual approval)
create table imported_orders (
  id                uuid primary key default gen_random_uuid(),
  source            text not null default 'email_webhook',
  source_identifier text,
  review_status     text not null default 'pending'
                    check (review_status in ('pending','approved','rejected')),
  customer_name     text not null,
  customer_email    text,
  customer_phone    text,
  customer_notes    text,
  order_number      text,
  order_status      text not null default 'new'
                    check (order_status in ('new','in_progress','completed','delivered','cancelled')),
  due_date          date,
  notes             text,
  logos             jsonb not null default '[]'::jsonb,
  garments          jsonb not null default '[]'::jsonb,
  raw_payload       jsonb not null default '{}'::jsonb,
  review_notes      text,
  approved_order_id uuid references orders(id) on delete set null,
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz
);

create index imported_orders_review_status_created_idx on imported_orders(review_status, created_at desc);

alter table imported_orders enable row level security;
create policy "auth users" on imported_orders for all using (auth.role() = 'authenticated');
