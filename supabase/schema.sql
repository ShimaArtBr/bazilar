-- ═══════════════════════════════════════════════════════════════════════════
-- BaZi PWA — Supabase Schema v1.0
-- Projeto: zgyyvjfckxpwnsucrvfg
-- Sprint: S5 · Março 2026
-- Executar no SQL Editor do Supabase (ordem obrigatória)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Extensões ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── 1. users ─────────────────────────────────────────────────────────────────
-- Espelha auth.users com campos específicos do produto.
-- Criado via trigger ao cadastrar no Supabase Auth.

create table if not exists public.users (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text unique not null,
  tier                  text not null default 'free' check (tier in ('free', 'premium')),
  dayun_next_transition date,
  lgpd_consent          boolean not null default false,
  lgpd_consent_at       timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Trigger: atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Trigger: cria registro em public.users ao cadastrar via Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. premium_access ────────────────────────────────────────────────────────
-- Registro de cada pagamento aprovado (Pix ou Stripe).

create table if not exists public.premium_access (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  txid            text unique,                          -- txid EfiBank ou charge_id Stripe
  expires_at      timestamptz not null,                 -- now() + 30 dias no webhook
  payment_method  text not null check (payment_method in ('pix', 'stripe')),
  valor_pago      integer not null,                     -- centavos (ex: 1990 = R$ 19,90)
  created_at      timestamptz not null default now()
);

create index if not exists premium_access_user_id_idx on public.premium_access(user_id);
create index if not exists premium_access_expires_at_idx on public.premium_access(expires_at);

-- ── 3. push_subscriptions ────────────────────────────────────────────────────
-- Web Push VAPID — uma subscription por dispositivo por usuário.

create table if not exists public.push_subscriptions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  endpoint    text not null unique,
  keys        jsonb not null,   -- { p256dh: string, auth: string }
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
create index if not exists push_subscriptions_active_idx  on public.push_subscriptions(active);

-- ── 4. donations ─────────────────────────────────────────────────────────────
-- Histórico de doações (pode coincidir com premium_access ou ser separado).

create table if not exists public.donations (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users(id) on delete set null,
  valor       integer not null,   -- centavos
  txid        text,               -- txid EfiBank para rastreamento
  created_at  timestamptz not null default now()
);

create index if not exists donations_user_id_idx on public.donations(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS — Row Level Security
-- Regra geral: usuário só acessa seus próprios dados.
-- service_role bypassa RLS por design (usado apenas nas Vercel Functions).
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.users               enable row level security;
alter table public.premium_access      enable row level security;
alter table public.push_subscriptions  enable row level security;
alter table public.donations           enable row level security;

-- users: leitura e atualização própria
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- premium_access: leitura própria; insert/update apenas via service_role (webhook)
create policy "premium_access_select_own" on public.premium_access
  for select using (auth.uid() = user_id);

-- push_subscriptions: CRUD próprio (browser gerencia a subscription)
create policy "push_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "push_insert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "push_update_own" on public.push_subscriptions
  for update using (auth.uid() = user_id);

create policy "push_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- donations: leitura própria; insert via service_role (webhook)
create policy "donations_select_own" on public.donations
  for select using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Verificação pós-execução
-- Cole no SQL Editor após rodar o schema acima para confirmar RLS ativo:
--
-- select tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
-- order by tablename;
--
-- Deve retornar rowsecurity = true para as 4 tabelas.
-- ═══════════════════════════════════════════════════════════════════════════
