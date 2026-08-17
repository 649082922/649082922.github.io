-- 多题库改造：一个账号可保存多份题库，每份可独立设置「公开（未登录也能刷）/ 私有（仅本人）」。
-- 在 Supabase SQL Editor 执行一次。可重复执行（幂等）。

-- 1) 旧单题库表（user_id 主键）改名备份；已是新结构或已迁移过则跳过
do $$
begin
  if exists (
       select 1 from information_schema.tables
       where table_schema = 'public' and table_name = 'quiz_banks'
     )
     and not exists (
       select 1 from information_schema.tables
       where table_schema = 'public' and table_name = 'quiz_banks_legacy'
     )
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'quiz_banks' and column_name = 'user_id'
     )
     and not exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'quiz_banks' and column_name = 'is_public'
     )
  then
    alter table public.quiz_banks rename to quiz_banks_legacy;
  end if;
end $$;

-- 2) 新多题库表
create table if not exists public.quiz_banks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  owner_name text not null default '',
  name text not null default '我的题库',
  is_public boolean not null default false,
  bank jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quiz_banks_user_idx on public.quiz_banks (user_id);
create index if not exists quiz_banks_public_idx on public.quiz_banks (is_public) where is_public;

-- 3) 迁移旧数据（保留已同步的题库，默认私有）；新表已有数据时跳过，防重复
do $$
begin
  if to_regclass('public.quiz_banks_legacy') is not null
     and not exists (select 1 from public.quiz_banks limit 1)
  then
    insert into public.quiz_banks (user_id, owner_name, name, bank, updated_at)
    select user_id, '', name, bank, updated_at
    from public.quiz_banks_legacy;
  end if;
end $$;

-- 4) RLS：公开行任何人可读（含未登录 anon）；私有行仅本人；写操作仅本人
alter table public.quiz_banks enable row level security;

drop policy if exists "read own or public quiz banks" on public.quiz_banks;
create policy "read own or public quiz banks"
on public.quiz_banks for select
to authenticated, anon
using (is_public or (select auth.uid()) = user_id);

drop policy if exists "insert own quiz banks" on public.quiz_banks;
create policy "insert own quiz banks"
on public.quiz_banks for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "update own quiz banks" on public.quiz_banks;
create policy "update own quiz banks"
on public.quiz_banks for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "delete own quiz banks" on public.quiz_banks;
create policy "delete own quiz banks"
on public.quiz_banks for delete
to authenticated
using ((select auth.uid()) = user_id);

-- 5) 旧表的旧策略随改名一并失效，无需处理。确认新功能正常后可删除备份表：
-- drop table if exists public.quiz_banks_legacy;
