# Blog Theme (Fuwari-based)

這是一個基於 [Fuwari](https://github.com/saicaca/fuwari) 主題二次開發的 Astro 博客主題。

## 特性

- 🌗 明暗主題切換
- 🔍 全文搜索（Pagefind）
- 🌐 簡繁切換（OpenCC 前端實時轉換）
- 🔤 字體可選（系統字體 / Huninn 美化字體）
- 📊 瀏覽量統計（Cloudflare Worker + D1）
- 📱 響應式設計

## 自定義改動

詳見 [CUSTOMIZATIONS.md](./CUSTOMIZATIONS.md)。

## 使用

```bash
pnpm install
pnpm dev
```

在 `src/content/posts/` 下放你的 markdown 文章即可。

## 部署

推送到 GitHub 後，通過 GitHub Actions 自動部署到 Cloudflare Pages（需配置 `CLOUDFLARE_API_TOKEN`）。

## 注意

此公開倉庫不包含實際文章內容，僅展示主題代碼。
