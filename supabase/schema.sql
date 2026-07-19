-- Safe, idempotent schema for embroidery order tracker.
-- This file is designed to run on both new and existing Supabase projects.

create extension if not exists pgcrypto;

-- Customers
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.customers add column if not exists name text;
alter table public.customers add column if not exists email text;
alter table public.customers add column if not exists phone text;
alter table public.customers add column if not exists notes text;
alter table public.customers add column if not exists created_at timestamptz not null default now();

-- Orders + auto-incrementing order number sequence (starts at 0)
create sequence if not exists public.orders_order_number_seq
  as bigint
  minvalue 0
  start with 0
  increment by 1;

alter sequence public.orders_order_number_seq minvalue 0 increment by 1;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  order_number text default nextval('public.orders_order_number_seq')::text,
  status text not null default 'new',
  due_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists customer_id uuid;
alter table public.orders add column if not exists order_number text;
alter table public.orders add column if not exists status text;
alter table public.orders add column if not exists due_date date;
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists created_at timestamptz not null default now();
alter table public.orders add column if not exists updated_at timestamptz not null default now();

alter table public.orders
  alter column order_number set default nextval('public.orders_order_number_seq')::text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_customer_id_fkey'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_customer_id_fkey
      foreign key (customer_id) references public.customers(id) on delete restrict;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_status_check
      check (status in ('new','in_progress','completed','delivered','cancelled'));
  end if;
end
$$;

-- Move sequence to next available numeric order number
with next_num as (
  select coalesce(max(order_number::bigint) + 1, 0) as n
  from public.orders
  where order_number ~ '^[0-9]+$'
)
select setval('public.orders_order_number_seq', (select n from next_num), false);

-- Logos (multiple per order)
create table if not exists public.order_logos (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  name text,
  price numeric(10,2),
  width_inches numeric(6,2) not null,
  height_inches numeric(6,2) not null,
  placement text not null,
  notes text
);

alter table public.order_logos add column if not exists order_id uuid;
alter table public.order_logos add column if not exists name text;
alter table public.order_logos add column if not exists price numeric(10,2);
alter table public.order_logos add column if not exists width_inches numeric(6,2);
alter table public.order_logos add column if not exists height_inches numeric(6,2);
alter table public.order_logos add column if not exists placement text;
alter table public.order_logos add column if not exists notes text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_logos_order_id_fkey'
      and conrelid = 'public.order_logos'::regclass
  ) then
    alter table public.order_logos
      add constraint order_logos_order_id_fkey
      foreign key (order_id) references public.orders(id) on delete cascade;
  end if;
end
$$;

-- Garments (multiple per order)
create table if not exists public.order_garments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  garment_type text not null,
  quantity integer not null default 1,
  price numeric(10,2),
  color text,
  sizes text,
  supplied_by text not null default 'customer',
  notes text
);

alter table public.order_garments add column if not exists order_id uuid;
alter table public.order_garments add column if not exists garment_type text;
alter table public.order_garments add column if not exists quantity integer;
alter table public.order_garments add column if not exists price numeric(10,2);
alter table public.order_garments add column if not exists color text;
alter table public.order_garments add column if not exists sizes text;
alter table public.order_garments add column if not exists supplied_by text;
alter table public.order_garments add column if not exists notes text;

alter table public.order_garments alter column quantity set default 1;
alter table public.order_garments alter column supplied_by set default 'customer';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_garments_order_id_fkey'
      and conrelid = 'public.order_garments'::regclass
  ) then
    alter table public.order_garments
      add constraint order_garments_order_id_fkey
      foreign key (order_id) references public.orders(id) on delete cascade;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_garments_supplied_by_check'
      and conrelid = 'public.order_garments'::regclass
  ) then
    alter table public.order_garments
      add constraint order_garments_supplied_by_check
      check (supplied_by in ('us','customer'));
  end if;
end
$$;

-- Imported order queue (for email/webhook intake + manual approval)
create table if not exists public.imported_orders (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'email_webhook',
  source_identifier text,
  review_status text not null default 'pending',
  customer_name text not null,
  customer_email text,
  customer_phone text,
  customer_notes text,
  order_number text,
  order_status text not null default 'new',
  due_date date,
  notes text,
  logos jsonb not null default '[]'::jsonb,
  garments jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  review_notes text,
  approved_order_id uuid,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.imported_orders add column if not exists source text;
alter table public.imported_orders add column if not exists source_identifier text;
alter table public.imported_orders add column if not exists review_status text;
alter table public.imported_orders add column if not exists customer_name text;
alter table public.imported_orders add column if not exists customer_email text;
alter table public.imported_orders add column if not exists customer_phone text;
alter table public.imported_orders add column if not exists customer_notes text;
alter table public.imported_orders add column if not exists order_number text;
alter table public.imported_orders add column if not exists order_status text;
alter table public.imported_orders add column if not exists due_date date;
alter table public.imported_orders add column if not exists notes text;
alter table public.imported_orders add column if not exists logos jsonb not null default '[]'::jsonb;
alter table public.imported_orders add column if not exists garments jsonb not null default '[]'::jsonb;
alter table public.imported_orders add column if not exists raw_payload jsonb not null default '{}'::jsonb;
alter table public.imported_orders add column if not exists review_notes text;
alter table public.imported_orders add column if not exists approved_order_id uuid;
alter table public.imported_orders add column if not exists created_at timestamptz not null default now();
alter table public.imported_orders add column if not exists reviewed_at timestamptz;

alter table public.imported_orders alter column source set default 'email_webhook';
alter table public.imported_orders alter column review_status set default 'pending';
alter table public.imported_orders alter column order_status set default 'new';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'imported_orders_approved_order_id_fkey'
      and conrelid = 'public.imported_orders'::regclass
  ) then
    alter table public.imported_orders
      add constraint imported_orders_approved_order_id_fkey
      foreign key (approved_order_id) references public.orders(id) on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'imported_orders_review_status_check'
      and conrelid = 'public.imported_orders'::regclass
  ) then
    alter table public.imported_orders
      add constraint imported_orders_review_status_check
      check (review_status in ('pending','approved','rejected'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'imported_orders_order_status_check'
      and conrelid = 'public.imported_orders'::regclass
  ) then
    alter table public.imported_orders
      add constraint imported_orders_order_status_check
      check (order_status in ('new','in_progress','completed','delivered','cancelled'));
  end if;
end
$$;

create index if not exists imported_orders_review_status_created_idx
  on public.imported_orders(review_status, created_at desc);

-- Auto-update updated_at on orders
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_updated_at on public.orders;

create trigger orders_updated_at
before update on public.orders
for each row execute function public.update_updated_at();

-- Row Level Security: only authenticated users can access data
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_logos enable row level security;
alter table public.order_garments enable row level security;
alter table public.imported_orders enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'customers' and policyname = 'auth users'
  ) then
    create policy "auth users" on public.customers for all using (auth.role() = 'authenticated');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'orders' and policyname = 'auth users'
  ) then
    create policy "auth users" on public.orders for all using (auth.role() = 'authenticated');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'order_logos' and policyname = 'auth users'
  ) then
    create policy "auth users" on public.order_logos for all using (auth.role() = 'authenticated');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'order_garments' and policyname = 'auth users'
  ) then
    create policy "auth users" on public.order_garments for all using (auth.role() = 'authenticated');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'imported_orders' and policyname = 'auth users'
  ) then
    create policy "auth users" on public.imported_orders for all using (auth.role() = 'authenticated');
  end if;
end
$$;
