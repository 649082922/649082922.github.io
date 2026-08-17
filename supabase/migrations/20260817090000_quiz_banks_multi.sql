-- 多题库公开功能对齐补丁(幂等,可重复执行)。
-- 背景:quiz_banks 已应用 20260814120000 的 visibility 方案(多题库 id 主键 + visibility/tags/description)。
-- 本迁移在既有结构上最小化补充线上代码所需的能力,不推翻任何已有对象:
--   1. 增加 is_public 列(布尔,线上代码使用;与 visibility 并存,public 即 is_public=true)
--   2. 存量数据换算:visibility='public' → is_public=true
--   3. 追加匿名(anon)可读策略:公开题库未登录也能刷(手机无 GitHub 登录场景)
-- RLS 为并集语义,既有 authenticated 策略保持不变;quiz_feedback 外键不受影响。

alter table public.quiz_banks
  add column if not exists is_public boolean not null default false;

update public.quiz_banks
set is_public = true
where is_public = false
  and visibility = 'public';

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quiz_banks'
      and policyname = 'read own or public quiz banks'
  ) then
    create policy "read own or public quiz banks"
    on public.quiz_banks for select
    to authenticated, anon
    using (is_public or (select auth.uid()) = user_id);
  end if;
end $$;
