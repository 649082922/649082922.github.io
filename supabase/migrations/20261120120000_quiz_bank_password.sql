-- ============================================================
-- 公开题库密码（幂等，可重复执行）
--
-- 功能：
--   1. quiz_banks 增加 password_hash（bcrypt，服务端哈希，NULL=无密码）
--   2. 收紧 SELECT 策略：有密码的公开题库，题目内容不再对匿名/非属主整行可读
--      （否则任何人直接调 PostgREST REST API 就能绕过前端密码门）
--   3. 元数据视图 quiz_bank_meta：公开题库的名字/作者/是否有密码仍对所有人可见
--      （公开列表需要显示 🔒 条目，但不含题目内容）
--   4. RPC open_quiz_bank(id, password)：凭密码取题库全文；属主免密
--   5. RPC set_quiz_bank_password(id, password)：仅属主可设置/清除密码
--
-- 执行方式：Supabase Dashboard → SQL Editor 粘贴执行
-- 兼容性：执行前线上代码自动回退旧行为；执行后旧行为完全不变（存量题库密码全空）
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- 1. 密码列 ----------
alter table public.quiz_banks
  add column if not exists password_hash text;

-- ---------- 2. 收紧公开可读策略 ----------
-- 原：is_public or 属主 → 改：属主 或 (公开 且 无密码)
drop policy if exists "read own or public quiz banks" on public.quiz_banks;
create policy "read own or public quiz banks"
on public.quiz_banks for select
to authenticated, anon
using (
  (select auth.uid()) = user_id
  or (is_public and password_hash is null)
);

-- ---------- 3. 公开元数据视图（不含题目内容） ----------
-- 注意：PG17 不支持对视图 ENABLE ROW LEVEL SECURITY，且视图 RLS 本就不构成安全边界。
-- 这里用 definer 视图（默认）绕过基表 RLS 暴露公开元数据，
-- 再用显式 GRANT/REVOKE 把匿名权限收窄为只读 SELECT。
create or replace view public.quiz_bank_meta as
select b.id, b.name, b.owner_name, b.updated_at,
       (b.password_hash is not null) as has_password
from public.quiz_banks b
where b.is_public;

revoke all on public.quiz_bank_meta from anon, authenticated;
grant select on public.quiz_bank_meta to anon, authenticated;

-- ---------- 4. 凭密码打开题库 ----------
-- 返回空 = 不存在 / 未公开 / 密码缺失或错误；属主始终放行
-- search_path 追加 extensions：Supabase 的 pgcrypto（crypt）在 extensions schema
create or replace function public.open_quiz_bank(p_id uuid, p_password text default null)
returns table (id uuid, name text, owner_name text, bank jsonb, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.quiz_banks%rowtype;
begin
  select b.* into v_row from public.quiz_banks b where b.id = p_id;
  if not found then
    return;
  end if;

  if v_row.user_id = (select auth.uid()) then
    null; -- 属主直接放行
  elsif v_row.is_public then
    if v_row.password_hash is not null
       and (nullif(trim(p_password), '') is null
            or crypt(p_password, v_row.password_hash) <> v_row.password_hash) then
      return; -- 有密码但未提供或不对
    end if;
  else
    return; -- 私有且非属主
  end if;

  return query
  select v_row.id, v_row.name, v_row.owner_name, v_row.bank, v_row.updated_at;
end;
$$;

-- ---------- 5. 属主设置/清除密码 ----------
-- p_password 为空 → 清除密码；返回 false = 题库不存在或不属于当前账号
create or replace function public.set_quiz_bank_password(p_id uuid, p_password text default null)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.quiz_banks b
  set password_hash = case
        when nullif(trim(p_password), '') is null then null
        else crypt(p_password, gen_salt('bf'))
      end,
      updated_at = now()
  where b.id = p_id
    and b.user_id = (select auth.uid());
  return found;
end;
$$;

-- ---------- 验证（执行后在结果里确认） ----------
-- select policyname, cmd from pg_policies
--  where schemaname = 'public' and tablename = 'quiz_banks'
--  order by policyname;
-- 预期：quiz_banks 的 select 策略只有 "read own or public quiz banks"（定义已收紧）。
