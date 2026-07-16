# Embroidery Order Tracker

Web app for tracking embroidery customers, orders, logos, and garments.

## Stack

- Next.js (App Router)
- Supabase (Auth + Postgres)
- Tailwind CSS
- Vercel

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
INBOUND_ORDER_WEBHOOK_SECRET=your-very-long-random-shared-secret
```

3. Run schema in Supabase SQL editor:

```sql
-- use supabase/schema.sql
```

4. Start dev server:

```bash
npm run dev
```

## Inbound email -> review queue -> order automation

Use your inbox (`instantembai@gmail.com`) with Make.com or Zapier:

1. Trigger: **New email in Gmail**.
2. (Optional) Add a parser step to extract order fields from quote-accepted emails.
3. Action: **Webhooks -> POST** to:

```text
https://<your-vercel-domain>/api/inbound-order
```

4. Add header:

```text
x-inbound-order-secret: <INBOUND_ORDER_WEBHOOK_SECRET>
```

5. Send JSON body like:

```json
{
  "customer_name": "Acme Construction",
  "customer_email": "office@acme.com",
  "customer_phone": "555-1212",
  "order_number": "Q-1048",
  "due_date": "2026-07-25",
  "status": "new",
  "notes": "Customer approved quote by email",
  "logos": [
    {
      "name": "Main logo",
      "width_inches": 3.5,
      "height_inches": 2.0,
      "placement": "Left Chest",
      "notes": "Use navy thread"
    }
  ],
  "garments": [
    {
      "garment_type": "Polo",
      "quantity": 12,
      "color": "Black",
      "sizes": "M x4, L x6, XL x2",
      "supplied_by": "customer",
      "notes": ""
    }
  ]
}
```

6. The webhook creates a record in **Imported Orders** (not a live order yet):

- Open `/imports`
- Review and edit imported details
- Click **Approve & Create Order** when correct

### Required webhook fields

- `customer_name`
- `due_date` is optional in webhook, but required before approval

Everything else is optional.

## Existing deployments: add new table

If your app is already running, run this in Supabase SQL Editor once:

```sql
create table if not exists imported_orders (
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

create index if not exists imported_orders_review_status_created_idx
  on imported_orders(review_status, created_at desc);

alter table imported_orders enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'imported_orders'
      and policyname = 'auth users'
  ) then
    create policy "auth users"
      on imported_orders
      for all
      using (auth.role() = 'authenticated');
  end if;
end
$$;
```

## Deploy (Vercel)

In Vercel project settings, set environment variables for Production (and Preview if needed):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INBOUND_ORDER_WEBHOOK_SECRET`
