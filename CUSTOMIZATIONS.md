# 博客自定義改動記錄

> 基於 Fuwari 主題的二次開發。本文檔記錄所有對上游主題的修改，
> 方便日後合併上游更新時對照，也方便問題溯源。
>
> 最後更新：2026-10-17

---

## 一、新增功能

### 1. 簡繁切換（OpenCC 前端實時轉換）

| 項目 | 說明 |
| --- | --- |
| 新增文件 | `src/components/widget/LangToggle.astro` |
| 新增文件 | `public/lib/opencc-full.js`（1.1MB，OpenCC 完整庫） |
| 掛載位置 | `src/components/Navbar.astro`（LightDarkSwitch 之後） |
| 原理 | 寫繁體、前端用 OpenCC 實時轉簡體；只轉正文文本節點，跳過 `pre/code/script/style/textarea` |
| 偏好存儲 | `localStorage['blog-lang-pref']`（`tw`/`cn`） |
| 庫加載方式 | 異步動態加載（`document.createElement('script')`），不阻塞首屏；點擊事件立即綁定 |

**關鍵 Bug 修復（2026-10-17）**：
- `OpenCC.Converter({from, to})` 返回的是**可直接調用的函數**，不是帶 `.convert()` 方法的對象
- 誤用 `.convert()` 會拋 `TypeError` 導致整個 `applyLang()` 中斷（按鈕無反應）
- 正確：`const convert = getConverterCn(); convert(text)`

### 2. 頁腳版本號（構建時自動生成）

| 項目 | 說明 |
| --- | --- |
| 新增文件 | `scripts/gen-version.mjs` |
| 生成文件 | `src/version.ts`（git-ignored，構建時生成） |
| 修改文件 | `src/components/Footer.astro`、`package.json` |
| 顯示 | 頁腳 `v<short-hash> · <date>`，如 `v1af2060 · 2026-10-17` |
| 用途 | 確認線上是否為最新部署，排查緩存問題 |

`package.json` 的 `build` 腳本改為：`node scripts/gen-version.mjs && astro build && pagefind --site dist`

### 3. 字體可選（系統字體默認 + Huninn 美化可選）

| 項目 | 說明 |
| --- | --- |
| 新增文件 | `public/fonts/huninn-400.woff2`（1.3MB，自托管） |
| 修改文件 | `src/layouts/Layout.astro`、`tailwind.config.cjs`、`src/utils/setting-utils.ts`、`src/components/widget/DisplaySettings.svelte`、`src/i18n/` |

設計：
- **默認系統字體**：不加載任何 web 字體，首屏不閃，保持輕量
- **用戶可選**：顯示設置 → 字體 → 系統字體 / 美化字體（Huninn）
- **無閃爍**：偏好存 `localStorage['font-family']`，在 `<head>` 內同步讀取並給 `<html>` 加 `font-beautified` 類，渲染前生效
- **按需下載**：`@font-face` 定義了但瀏覽器只在實際使用時才下載 woff2

---

## 二、對上游主題的修改

### 4. 移除 `onload-animation` 入場動畫（修復刷新閃兩次）

| 項目 | 說明 |
| --- | --- |
| 修改文件 | `src/styles/transition.css` |
| 原因 | Fuwari 默認的入場動畫把內容初始設為 `opacity: 0`，首繪空白後分兩波淡入，用戶感知為"閃兩次" |
| 改動 | 刪除 `@keyframes fade-in-up`、`.onload-animation`、各組件的 `animation-delay` 規則 |
| 保留 | Swup 翻頁過渡規則（`html.is-changing` 等） |
| 影響 | 失去入場淡入動畫；HTML 裡殘留的 `onload-animation` class 變成空規則，無害，無需逐個改組件 |

### 5. 修復 `markdown.css` 無效的 Tailwind 類

| 項目 | 說明 |
| --- | --- |
| 修改文件 | `src/styles/markdown.css` |
| 原因 | 構建間歇性失敗：`@apply link`（`link` 不是有效 Tailwind 類）、`@apply btn-regular-dark`（跨文件的自定義類，`@apply` 無法引用） |
| 改動 | 移除 `@apply link`；將 `btn-regular-dark` 的樣式內聯為原生 CSS（`background: oklch(...)` + hover 變體） |

### 6. 移除 Google Fonts（改為字體可選方案）

| 項目 | 說明 |
| --- | --- |
| 修改文件 | `src/layouts/Layout.astro`、`tailwind.config.cjs` |
| 原因 | Google Fonts 在國內訪問慢，`display=swap` 導致中文重排閃爍；且與"默認輕量"目標衝突 |
| 改動 | 刪除 `<head>` 裡的 3 行 Google Fonts `<link>`；`tailwind.config.cjs` 的 `fontFamily.sans` 移除 `Huninn`、`Noto Sans TC` |

---

## 三、內容（文章）

| 文件 | 說明 |
| --- | --- |
| `src/content/posts/2fa-totp-vault.md` | 自託管 TOTP 驗證器介紹（2026-10-17） |
| `src/content/posts/temp-mail.md` | 自託管臨時郵箱介紹（2026-10-17） |

---

## 四、合併上游更新時的注意事項

1. **先備份**：合併前 `git stash` 或開新分支
2. **重點衝突文件**：
   - `src/layouts/Layout.astro`（改動多：字體、版本號、動畫相關）
   - `src/styles/transition.css`（刪了動畫）
   - `src/styles/markdown.css`（修了無效類）
   - `tailwind.config.cjs`（改了字體棧）
   - `src/components/Navbar.astro`（掛了 LangToggle）
   - `src/components/widget/DisplaySettings.svelte`（加了字體選擇）
   - `src/utils/setting-utils.ts`（加了字體函數）
   - `src/i18n/`（加了 i18n key）
3. **新增文件不會衝突**（直接保留）：
   - `src/components/widget/LangToggle.astro`
   - `public/lib/opencc-full.js`
   - `public/fonts/huninn-400.woff2`
   - `scripts/gen-version.mjs`
   - `src/content/posts/*.md`
4. **構建腳本**：`package.json` 的 `build` 被改過，合併後檢查是否保留 `gen-version.mjs`
5. **測試清單**（合併後必測）：
   - [ ] 繁簡切換按鈕點擊有效
   - [ ] 字體切換（系統/美化）有效且刷新不閃
   - [ ] 頁腳版本號正常顯示
   - [ ] 刷新頁面無兩段式閃爍
   - [ ] `pnpm build` / `astro build` 通過

---

## 五、已知問題 / 技術債

- 簡繁轉換是純前端 DOM 文本節點替換，動態插入的內容（如搜索面板）不會自動轉換
- OpenCC 完整庫 1.1MB，僅在用戶首次切換到簡體時下載
- Huninn 只有 400 字重，加粗靠瀏覽器合成
- `src/version.ts` 是構建時生成的，不要手動編輯，已加入 `.gitignore`

---

## 六、瀏覽量統計（2026-10-17 新增）

| 項目 | 說明 |
| --- | --- |
| Worker | `blog-views`（https://blog-views.elewis113.workers.dev） |
| D1 | `blog-views`（4bf3c568-e9cc-482f-90c1-822a2e404b44） |
| 源碼 | `~/workspace/blog-views/`（worker.js + schema.sql，不在博客倉庫） |
| 表結構 | `views(path, count)`、`hits(path, ip, day)`（去重用） |
| 去重規則 | 同一 IP 同一天同一文章只計一次 |
| 顯示位置 | 文章頁 PostMeta（"X 次瀏覽"）、頁腳（"總瀏覽 X 次"） |
| API | `POST /hit {path}`、`GET /count?path=`、`GET /batch`、`GET /total` |

## 七、倉庫可見性

- 2026-10-17 起 `ouneedtech/blog` 轉為 **私有倉庫**
- 原因：不希望文章被腳本直接從 GitHub 批量扒取，希望流量走博客站
- GitHub Actions 自動部署不受影響（用 PAT 拉取私有倉庫正常）
- 注意：博客頁腳/關於頁的 GitHub 圖標鏈接對訪客會 404，如需對外展示可改為其他鏈接

## 八、雙倉庫架構（2026-10-17 新增）

| 倉庫 | 可見性 | 內容 | 用途 |
| --- | --- | --- | --- |
| `ouneedtech/blog` | 私有 | 完整博客（含文章） | 實際部署用，GitHub Actions 自動部署到 Cloudflare Pages |
| `ouneedtech/blog-theme` | 公開 | 純主題（不含文章） | 對外展示，博客上的 GitHub 鏈接指向此倉庫 |

同步腳本：`~/workspace/bin/sync-blog-theme.sh [commit-message]`
- 一次推送兩個倉庫
- 公開倉庫自動排除 `src/content/posts/*.md`（保留 README.md 說明）
- 用法：改完 blog 後跑 `./sync-blog-theme.sh "改動說明"`
