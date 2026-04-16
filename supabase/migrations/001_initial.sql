-- ── email_captures ─────────────────────────────────────────────────────────────
-- One row per email address. Upserted on each eligibility check.
create table if not exists email_captures (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null,
  regulation            text,
  compensation_amount   text,
  airline               text,
  flight_number         text,
  origin                text,
  destination           text,
  eligibility_verdict   text,
  captured_at           timestamptz not null default now(),
  converted_at          timestamptz,         -- set when kit purchased or managed service authorised
  unsubscribed_at       timestamptz,
  reminder_24h_sent_at  timestamptz,
  reminder_72h_sent_at  timestamptz,
  unsubscribe_token     text not null default gen_random_uuid()::text
);

create unique index if not exists email_captures_email_idx
  on email_captures (email);

create index if not exists email_captures_captured_at_idx
  on email_captures (captured_at);

create index if not exists email_captures_unsubscribe_token_idx
  on email_captures (unsubscribe_token);

alter table email_captures enable row level security;

-- Only the service_role key (server-side) may read or write
create policy "service_role_all" on email_captures
  for all
  using     (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ── claims ─────────────────────────────────────────────────────────────────────
-- Full claim objects stored as JSONB to avoid camelCase ↔ snake_case conversion
-- across the existing codebase. id / status / timestamps are indexed separately.
create table if not exists claims (
  id          text        primary key,
  status      text        not null default 'authorized',
  is_test     boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  data        jsonb       not null
);

create index if not exists claims_status_idx     on claims (status);
create index if not exists claims_created_at_idx on claims (created_at desc);
create index if not exists claims_is_test_idx    on claims (is_test);

alter table claims enable row level security;

create policy "service_role_all" on claims
  for all
  using     (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
