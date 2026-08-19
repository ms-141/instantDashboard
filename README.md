# Embroidery Order Tracker

Web app for tracking embroidery customers, orders, logos, and garments.

## Stack

- Next.js (App Router)
- Supabase (Auth + Postgres)
- Nodemailer + Gmail SMTP (CRM email sends)
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
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma4:e2b
GMAIL_SMTP_USER=instant@telus.net
GMAIL_SMTP_APP_PASSWORD=your-16-character-app-password
EMAIL_FROM_ADDRESS=instant@telus.net
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Run schema in Supabase SQL editor:

```sql
-- use supabase/schema.sql
```

4. Start dev server:

```bash
npm run dev
```

## CRM: email sending, open/click tracking, templates, automations

The CRM layer lets you send tracked emails to customers (like HubSpot's
email tool), with a per-customer/order activity timeline.

### Setup: Gmail SMTP (sending as instant@telus.net)

Since Telus routes `@telus.net` mail through Google Workspace, emails are
sent by authenticating directly against Gmail's SMTP servers as the real
`instant@telus.net` mailbox — not through a third-party email API. This
means there's no domain-verification step (you can't verify `telus.net` in
an ESP like Resend/SendGrid anyway, since Telus — not you — controls its
DNS), but it does mean you're sending through the mailbox itself, so Gmail's
sending limits apply (~2,000/day on Google Workspace, ~500/day on a plain
consumer Gmail account — fine for CRM follow-ups, not for bulk marketing
blasts).

1. Sign in to the `instant@telus.net` Google account.
2. Enable **2-Step Verification** (Google Account → Security) if not already on.
3. Go to Google Account → Security → **App passwords**, and generate one for
   this app (e.g. name it "Instant Dashboard CRM").
4. Set:
   - `GMAIL_SMTP_USER=instant@telus.net`
   - `GMAIL_SMTP_APP_PASSWORD=` the generated app password (no spaces)
   - `EMAIL_FROM_ADDRESS=instant@telus.net` (must match `GMAIL_SMTP_USER` —
     Gmail's SMTP servers reject a `From` address that isn't the
     authenticated mailbox or a configured "Send As" alias on it)
5. Set `NEXT_PUBLIC_APP_URL` to your deployed app's public URL (e.g.
   `https://your-app.vercel.app`). This is required because tracking pixel
   and click-redirect links must be absolute — they're loaded from the
   recipient's email client, not from your app.

### How it works

- **Sending**: "Send Email" on a customer or order page opens a compose
  form (optionally pre-filled from a saved template). Sent emails are logged
  to `email_messages`.
- **Open tracking**: a 1x1 transparent tracking pixel is embedded in every
  outbound email and served from `/api/track/open/[trackingId]`. Note that
  Apple Mail Privacy Protection and some Gmail image proxies pre-fetch this
  pixel automatically, so "opened" is a soft signal, not proof the recipient
  actually read the email — this is the same limitation HubSpot and other
  CRMs have.
- **Click tracking**: links in outbound emails are rewritten to route
  through `/api/track/click/[trackingId]` before redirecting to the original
  URL.
- **Templates**: manage reusable templates under **Templates** in the nav,
  with merge fields like `{{customer_name}}`, `{{order_number}}`, and
  `{{due_date}}`.
- **Automations**: under **Automations**, configure a template to be sent
  automatically whenever an order's status changes to a given value (e.g.
  auto-email customers when an order becomes `completed`).
- **Activity timeline**: each customer/order page shows a unified feed of
  orders created, status changes, emails sent/opened/clicked, and manually
  added notes.

## Inbound email -> review queue -> order automation

Use any email automation or local script to POST into your webhook endpoint.

1. Trigger: **New email in Gmail**.
2. Choose one payload mode:

- Structured payload: send already-parsed fields (customer_name, due_date, logos, garments, etc).
- Raw email payload: send `raw_email_text` (plus optional `email_subject`/`email_from`) and let Ollama extract fields.
3. Action: **Webhooks -> POST** to:

```text
https://<your-vercel-domain>/api/inbound-order
```

4. Add header:

```text
x-inbound-order-secret: <INBOUND_ORDER_WEBHOOK_SECRET>
```

5. Structured payload example:

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
      "price": 35.0,
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
      "price": 18.5,
      "color": "Black",
      "sizes": "M x4, L x6, XL x2",
      "supplied_by": "customer",
      "notes": ""
    }
  ]
}
```

Raw email payload example (Ollama extraction):

```json
{
  "source_identifier": "gmail:18c9c8f6",
  "email_from": "office@acme.com",
  "email_subject": "Quote approved - 12 black polos",
  "raw_email_text": "Hi team, please proceed with 12 black polos for Acme Construction... due July 25. Left chest logo 3.5 x 2.0 in..."
}
```

6. The webhook creates a record in **Imported Orders** (not a live order yet):

- Open `/imports`
- Review and edit imported details
- Click **Approve & Create Order** when correct

### Required webhook fields

- `customer_name` OR `raw_email_text`
- `due_date` is optional in webhook, but required before approval

Everything else is optional.

## Existing deployments: add new table and price columns

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

-- If your database was created before price support was added:
alter table if exists order_logos
  add column if not exists price numeric(10,2);

alter table if exists order_garments
  add column if not exists price numeric(10,2);
```

## Deploy (Vercel)

In Vercel project settings, set environment variables for Production (and Preview if needed):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INBOUND_ORDER_WEBHOOK_SECRET`
- `GMAIL_SMTP_USER`
- `GMAIL_SMTP_APP_PASSWORD`
- `EMAIL_FROM_ADDRESS`
- `NEXT_PUBLIC_APP_URL` (your production URL, e.g. `https://your-app.vercel.app`)
