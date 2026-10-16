
## 2026-10-16 17:52 - 博客源码推送到 GitHub

### 仓库
- **地址**: https://github.com/ouneedtech/blog
- **分支**: main
- **可见性**: public
- **内容**: Fuwari 博客源码（繁体中文单语言，已清理模板作者信息）
- **同步**: /tmp/fuwari-clean → ~/workspace/blog/ 已同步，后续以 ~/workspace/blog/ 为准

## 2026-10-16 17:55 - 加回 GitHub 图标链接

### 改动
- **profileConfig.links**: 加回 GitHub 图标，指向 https://github.com/ouneedtech（之前清理模板时移除）
- 导航栏的 GitHub 链接保持移除（用户只要求头像下方）
- 页脚 Astro 框架链接保留（非 GitHub 相关）

## 2026-10-16 17:56 - GitHub 头像更换

### 改动
- **ouneedtech GitHub 头像**: 换成与博客相同的用户照片
- GitHub 缓存同步有延迟，个人主页可能需要几分钟才显示新头像

## 2026-10-16 17:50 - 接入 GitHub Actions 自动部署

### 改动
- **.github/workflows/deploy.yml**: push 到 main 分支自动构建并部署到 Cloudflare Pages
- **Secrets**: CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID 已通过 API 写入仓库
- **验证**: Actions 运行成功，push 即自动上线，无需手动 wrangler
