create table if not exists public.quiz_banks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '我的题库',
  bank jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.quiz_banks enable row level security;

create policy "users read own quiz bank"
on public.quiz_banks for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users create own quiz bank"
on public.quiz_banks for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "users update own quiz bank"
on public.quiz_banks for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users delete own quiz bank"
on public.quiz_banks for delete
to authenticated
using ((select auth.uid()) = user_id);
