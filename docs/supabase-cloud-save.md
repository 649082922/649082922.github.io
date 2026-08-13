# 小游戏云存档与审计配置

代码已经包含登录、云存档和隐藏审计页面，启用服务还需要建立一个 Supabase 项目。

1. 在 Supabase 新建项目，在 SQL Editor 执行 `supabase/schema.sql`。
2. Authentication → Providers 中启用 Email；需要 GitHub 登录时，再启用 GitHub Provider，并按 Supabase 页面给出的 callback URL 配置 GitHub OAuth App。
3. Authentication → URL Configuration：
   - Site URL：`https://649082922.github.io`
   - Redirect URLs 增加 `https://649082922.github.io/games/` 和本地调试地址。
4. 在 GitHub 仓库 Settings → Secrets and variables → Actions 添加：
   - Variable：`PUBLIC_SUPABASE_URL`
   - Secret：`PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. 推送或手动重新运行 Pages 部署。
6. 使用 `649082922@qq.com` 登录一次后，数据库触发器会自动把该账号加入 `site_admins`。如果你的 GitHub 账号返回的邮箱不同，请用邮箱登录站长后台。
7. 隐藏审计页面地址：`/owner/audit/`。它不显示在网站导航与 sitemap 中，且数据库 RLS 只允许 `site_admins` 中的账号读取日志。

审计日志仅包含已登录用户的登录、退出、云存档上传和恢复事件，不追踪匿名访客，也不采集 IP 或浏览器指纹。
