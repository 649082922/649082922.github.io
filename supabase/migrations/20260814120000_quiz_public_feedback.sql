-- ============================================================
-- quiz-library 公开功能改造（多题库 + 公开 + 反馈）
--   1. quiz_banks：单题库(user_id 主键) → 多题库(id 主键) + 公开字段
--   2. RLS 重写：自己的全权 + public/unlisted 登录用户可读
--   3. 新增 quiz_feedback 反馈表
--
-- 现有题库数据保留：自动成为"私有"的第一条题库。
-- 执行方式：Supabase Dashboard → SQL Editor 粘贴执行（可重复执行，已完成的步骤会自动跳过）
-- ============================================================

-- ---------- 1. quiz_banks 表改造 ----------

alter table public.quiz_banks add column if not exists id uuid default gen_random_uuid();
alter table public.quiz_banks add column if not exists description text default '';
alter table public.quiz_banks add column if not exists owner_name text default '';
alter table public.quiz_banks add column if not exists tags text[] default '{}';
alter table public.quiz_banks add column if not exists visibility text not null default 'private';
alter table public.quiz_banks add column if not exists created_at timestamptz not null default now();

-- 现有行补 id 和 owner_name（现有数据都是作者本人的）
update public.quiz_banks set id = gen_random_uuid() where id is null;
update public.quiz_banks set owner_name = '勇敢DBA不怕困难' where owner_name = '';

-- 主键 user_id → id（仅当当前主键还是 user_id 时才改，可重跑）
do $$
declare
	pk_col text;
begin
	select a.attname into pk_col
	from pg_index i
	join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
	where i.indrelid = 'public.quiz_banks'::regclass and i.indisprimary;
	if pk_col = 'user_id' then
		execute 'alter table public.quiz_banks drop constraint quiz_banks_pkey';
		execute 'alter table public.quiz_banks add primary key (id)';
	end if;
end $$;

-- visibility 取值约束（可重跑）
do $$
begin
	if not exists (
		select 1 from pg_constraint
		where conname = 'quiz_banks_visibility_check'
			and conrelid = 'public.quiz_banks'::regclass
	) then
		alter table public.quiz_banks
			add constraint quiz_banks_visibility_check
			check (visibility in ('private','public','unlisted'));
	end if;
end $$;

create index if not exists quiz_banks_user_idx on public.quiz_banks(user_id);
-- 广场查询索引：只索引公开题库，按更新时间倒序
create index if not exists quiz_banks_public_idx on public.quiz_banks(updated_at desc) where visibility = 'public';

-- ---------- 2. RLS 重写 ----------

drop policy if exists "users read own quiz bank" on public.quiz_banks;
drop policy if exists "users create own quiz bank" on public.quiz_banks;
drop policy if exists "users update own quiz bank" on public.quiz_banks;
drop policy if exists "users delete own quiz bank" on public.quiz_banks;

-- 读：自己的 OR 公开/未列出（对所有登录用户可见）
create policy "read quiz banks"
on public.quiz_banks for select
to authenticated
using (
	user_id = (select auth.uid())
	or visibility in ('public','unlisted')
);

-- 写：仅自己的
create policy "create own quiz bank"
on public.quiz_banks for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "update own quiz bank"
on public.quiz_banks for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "delete own quiz bank"
on public.quiz_banks for delete
to authenticated
using (user_id = (select auth.uid()));

-- ---------- 3. 反馈表 ----------

create table if not exists public.quiz_feedback (
	id uuid primary key default gen_random_uuid(),
	bank_id uuid not null references public.quiz_banks(id) on delete cascade,
	question_type text not null check (question_type in ('single','multiple','judge')),
	question_index int not null check (question_index >= 0),
	content text not null check (char_length(content) between 1 and 2000),
	reporter_id uuid not null references auth.users(id),
	created_at timestamptz not null default now()
);

create index if not exists quiz_feedback_bank_idx on public.quiz_feedback(bank_id);

alter table public.quiz_feedback enable row level security;

-- 提反馈：登录用户本人署名，且目标题库对其可见（自己的或 public/unlisted）
create policy "insert quiz feedback"
on public.quiz_feedback for insert
to authenticated
with check (
	reporter_id = (select auth.uid())
	and exists (
		select 1 from public.quiz_banks b
		where b.id = bank_id
			and (b.user_id = (select auth.uid()) or b.visibility in ('public','unlisted'))
	)
);

-- 读反馈：自己提的 OR 该题库的所有者（作者后台集中看）
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
