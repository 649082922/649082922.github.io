-- ============================================================
-- 清理 quiz_banks 的 visibility 旧 RLS 策略，统一以 is_public 为准
-- （幂等，可重复执行）
--
-- 背景：
--   20260814120000 曾按 visibility 建过一套策略（"read quiz banks" 等 4 条），
--   之后的代码只读写 is_public、从不维护 visibility（线上公开题库的
--   visibility 仍是插入默认值 'private'，已实测确认两列语义漂移）。
--   RLS 多策略为 OR 语义：任何 visibility 残留 'public'/'unlisted' 的题库
--   即使已"转私有"（is_public=false），对直接调用 PostgREST 的登录用户仍可读。
--   同时 quiz_feedback 的 insert 策略按 visibility 判断，
--   导致公开题库（visibility='private'）收不到任何人的反馈。
--
-- 修复：
--   1. drop 旧 4 条策略（read quiz banks / create|update|delete own quiz bank）
--   2. 存量数据对齐：visibility 与 is_public 一致（列保留，但不再被任何策略引用）
--   3. quiz_feedback 的 insert 策略改用 is_public 判断
--   4. 重建公开列表索引（旧同名索引条件是 visibility='public'，对现有查询无效）
--
-- 执行方式：Supabase Dashboard → SQL Editor 粘贴执行
-- ============================================================

-- ---------- 1. drop 旧 visibility 策略 ----------

drop policy if exists "read quiz banks" on public.quiz_banks;
drop policy if exists "create own quiz bank" on public.quiz_banks;
drop policy if exists "update own quiz bank" on public.quiz_banks;
drop policy if exists "delete own quiz bank" on public.quiz_banks;

-- ---------- 2. 存量数据对齐（防御性） ----------

alter table public.quiz_banks
  add column if not exists visibility text not null default 'private';

update public.quiz_banks
set visibility = case when is_public then 'public' else 'private' end
where visibility <> (case when is_public then 'public' else 'private' end);

-- ---------- 3. quiz_feedback 提反馈策略改用 is_public ----------

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

-- ---------- 4. 公开列表索引重建为 is_public 条件 ----------

drop index if exists quiz_banks_public_idx;
create index quiz_banks_public_idx
  on public.quiz_banks (updated_at desc)
  where is_public;

-- ---------- 验证（执行后在结果里确认） ----------
-- 应只剩 4 条策略，且 select 策略只有 "read own or public quiz banks"：
-- select policyname, cmd from pg_policies
-- where schemaname = 'public' and tablename = 'quiz_banks' order by policyname;
