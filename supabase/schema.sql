-- 在 Supabase SQL Editor 中执行一次。
-- 最后将 REPLACE_WITH_YOUR_USER_UUID 换成站长登录后的 Supabase User UID 再执行 INSERT。

create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;

create policy "users read own game save"
on public.game_saves for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users create own game save"
on public.game_saves for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "users update own game save"
on public.game_saves for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- 多题库：一个账号多份题库，每份可独立设公开（未登录可刷）/ 私有（仅本人）。
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
drop index if exists quiz_banks_public_idx;
create index quiz_banks_public_idx on public.quiz_banks (updated_at desc) where is_public;

alter table public.quiz_banks enable row level security;

-- 幂等：先清旧策略再建，保证线上收敛到本文件定义（防历史宽策略残留）
-- 含 20260814120000 的旧 visibility 策略：代码只维护 is_public，
-- visibility 残留 'public' 会让"私有"题库对登录用户仍可读（RLS 为 OR 语义）。
drop policy if exists "read quiz banks" on public.quiz_banks;
drop policy if exists "create own quiz bank" on public.quiz_banks;
drop policy if exists "update own quiz bank" on public.quiz_banks;
drop policy if exists "delete own quiz bank" on public.quiz_banks;
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

-- 题库反馈：登录用户可对"自己的或公开的"题库提反馈；
-- 反馈内容仅反馈者本人与题库属主可见。
create table if not exists public.quiz_feedback (
  id uuid primary key default gen_random_uuid(),
  bank_id uuid not null references public.quiz_banks(id) on delete cascade,
  question_type text not null check (question_type in ('single','multiple','judge')),
  question_index int not null check (question_index >= 0),
  content text not null check (char_length(content) between 1 and 2000),
  reporter_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists quiz_feedback_bank_idx on public.quiz_feedback (bank_id);

alter table public.quiz_feedback enable row level security;

drop policy if exists "insert quiz feedback" on public.quiz_feedback;
create policy "insert quiz feedback"
on public.quiz_feedback for insert
to authenticated
with check (
  reporter_id = (select auth.uid())
  and exists (
    select 1 from public.quiz_banks b
    where b.id = bank_id
      and (b.user_id = (select auth.uid()) or b.is_public)
  )
);

drop policy if exists "read quiz feedback" on public.quiz_feedback;
create policy "read quiz feedback"
on public.quiz_feedback for select
to authenticated
using (
  reporter_id = (select auth.uid())
  or exists (
    select 1 from public.quiz_banks b
    where b.id = bank_id and b.user_id = (select auth.uid())
  )
);

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_admins enable row level security;

-- 站长邮箱首次登录时自动加入管理员表；邮箱认证由 Supabase 完成。
create or replace function public.register_site_owner()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if lower(coalesce(new.email, '')) = '649082922@qq.com'
    or lower(coalesce(new.raw_user_meta_data ->> 'user_name', '')) = '649082922'
    or lower(coalesce(new.raw_user_meta_data ->> 'preferred_username', '')) = '649082922'
  then
    insert into public.site_admins (user_id) values (new.id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists register_site_owner_trigger on auth.users;
create trigger register_site_owner_trigger
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.register_site_owner();

-- 如果站长已在执行脚本前登录过，立即补写管理员身份。
insert into public.site_admins (user_id)
select id
from auth.users
where lower(email) = '649082922@qq.com'
   or lower(coalesce(raw_user_meta_data ->> 'user_name', '')) = '649082922'
   or lower(coalesce(raw_user_meta_data ->> 'preferred_username', '')) = '649082922'
on conflict (user_id) do nothing;

create policy "users can verify their own admin status"
on public.site_admins for select
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.site_audit_logs (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_email text,
  event_type text not null check (event_type in ('login', 'logout', 'save_upload', 'save_restore')),
  page_path text not null default '/',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists site_audit_logs_created_at_idx
on public.site_audit_logs (created_at desc);

create index if not exists site_audit_logs_user_id_idx
on public.site_audit_logs (user_id);

alter table public.site_audit_logs enable row level security;

create or replace function public.fill_audit_actor()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  new.user_id := (select auth.uid());
  new.actor_email := (select email from auth.users where id = (select auth.uid()));
  return new;
end;
$$;

drop trigger if exists fill_audit_actor_trigger on public.site_audit_logs;
create trigger fill_audit_actor_trigger
before insert on public.site_audit_logs
for each row execute function public.fill_audit_actor();

create policy "signed in users create own audit events"
on public.site_audit_logs for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "only site admins read audit events"
on public.site_audit_logs for select
to authenticated
using (
  exists (
    select 1 from public.site_admins
    where site_admins.user_id = (select auth.uid())
  )
);

-- 如需增加其他管理员，可从 Authentication → Users 复制 User UID 后执行：
-- insert into public.site_admins (user_id)
-- values ('REPLACE_WITH_YOUR_USER_UUID')
-- on conflict (user_id) do nothing;
