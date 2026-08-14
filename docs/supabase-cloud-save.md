# 小游戏云存档与审计配置

代码已经包含登录、云存档和隐藏审计页面，启用服务还需要建立一个 Supabase 项目。

1. 在 Supabase 新建项目，在 SQL Editor 执行 `supabase/schema.sql`。
2. Authentication → Providers 中启用 GitHub Provider，并按 Supabase 页面给出的 callback URL 配置 GitHub OAuth App。网站只提供 GitHub 登录。
3. Authentication → URL Configuration：
   - Site URL：`https://649082922.github.io`
   - Redirect URLs 增加 `https://649082922.github.io/games/`、`https://649082922.github.io/quiz-library/` 和本地调试地址。
4. 在 GitHub 仓库 Settings → Secrets and variables → Actions 添加：
   - Variable：`PUBLIC_SUPABASE_URL`
   - Secret：`PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. 推送或手动重新运行 Pages 部署。
6. 使用 GitHub 账号 `649082922` 登录一次后，数据库触发器会自动把该账号加入 `site_admins`。如果站长 GitHub 用户名不同，请在 `site_admins` 中手动添加对应的 Supabase User UID。
7. 隐藏审计页面地址：`/owner/audit/`。它不显示在网站导航与 sitemap 中，且数据库 RLS 只允许 `site_admins` 中的账号读取日志。

审计日志仅包含已登录用户的登录、退出、云存档上传和恢复事件，不追踪匿名访客，也不采集 IP 或浏览器指纹。

题库页会把当前上传的题库保存到 `quiz_banks`。同一个 GitHub 账号在其他设备登录后，会自动恢复较新的云端题库；答题进度仍保留在各设备本地。
