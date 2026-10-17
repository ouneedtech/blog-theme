---
title: 自託管 TOTP 驗證器：Cloudflare Workers + D1 的 2FA 網頁保險庫
published: 2026-10-17
description: 不想每次掏手機看驗證碼？用 Cloudflare Workers + D1 打造一個純自託管的網頁版 TOTP 驗證器：零依賴、端到端加密、單 HTML 前端。
tags: ["Cloudflare", "2FA", "TOTP", "自託管"]
category: "技術"
draft: false
---

## 0. TL;DR：先給結論

| 問題 | 結論 |
| --- | --- |
| 這是什麼？ | 一個跑在 Cloudflare Workers + D1 上的網頁版 TOTP 驗證器 |
| 為什麼不用手機 App？ | 電腦前工作時不用掏手機；多設備同步；備份可控 |
| 安全嗎？ | 服務端只存密文；密鑰派生用 PBKDF2-SHA256（600,000 次）；密碼遺失無法恢復 |
| 成本？ | Cloudflare 免費額度內搞定，$0 |
| 部署多麻煩？ | `git push` → GitHub Actions 自動部署，約 5 分鐘 |

---

## 1. 起點：為什麼要自託管 2FA

雙因素認證（2FA）這東西，用過的人都知道它的彆扭之處：

- 手機 App（Google Authenticator、Authy 之流）每次都要掏手機
- 換手機時遷移是個災難，丟了恢復碼就等著哭
- 雲同步方案等於把你的 TOTP 種子交給第三方

我的需求很具體：

> **一個能在瀏覽器裡打開即用的 TOTP 驗證器，數據完全自己掌控，不依賴任何第三方同步服務。**

驗收標準也很明確：

1. **純自託管**：代碼開源，跑在我自己的 Cloudflare 帳號下
2. **端到端加密**：服務端拿不到明文種子，即使 D1 被拖庫也解不開
3. **零運維**：Serverless，按量計費（免費額度內）
4. **夠輕**：單 HTML、無框架、無構建步驟

---

## 2. 架構：簡單到離譜

```
瀏覽器（單 HTML 文件，原生 JS + Web Crypto API，< 60KB）
   │  HTTPS
   ▼
Cloudflare Worker（API + 靜態頁面服務）
   │  綁定
   ▼
D1（SQLite，只存密文）
```

就三層，沒有第四層。前端零依賴，後端零 npm 運行時依賴，部署就是一個 `wrangler deploy`。

### 2.1 用戶模型

| 角色 | 權限 |
| --- | --- |
| 主管理員（admin） | 查看自己的 2FA；創建/刪除子用戶；查看用戶列表 |
| 子用戶 | 只能查看自己的 2FA，無其他權限 |

每個用戶由**用戶名 + 密碼**標識——密碼既是身份，也是解密鑰匙。

### 2.2 隱藏登錄入口

一個有意思的設計：未登錄時首頁顯示的表單，外观看起來像「快速添加 TOTP」（名稱框 + 字符串框 + 按鈕），實際邏輯是：

- 如果名稱匹配某用戶名且字符串匹配其密碼 → 登錄成功進入 vault
- 否則顯示通用錯誤「格式不正確」

不給任何「這是登錄入口」的提示。算是一種樸素的混淆。

---

## 3. 加密設計（核心）

這是整個項目最重要的部分。威脅模型很明確：**假設服務端（Worker + D1）完全不可信**——Cloudflare 能看到 D1 裡的所有數據，但拿不到你的 TOTP 種子明文。

### 3.1 密鑰派生

```
用戶密碼 + 隨機鹽 → PBKDF2-SHA256（600,000 次迭代）→ 64 字節
    ├── 前 32 字節 → AES-GCM 加密密鑰（保護 TOTP 種子）
    └── 後 32 字節 → HMAC-SHA256 驗證密鑰（服務端驗證身份，不存密碼）
```

關鍵點：

- **服務端從不存儲密碼明文**，只存 HMAC 驗證值
- 600,000 次 PBKDF2 迭代讓暴力破解成本極高
- 鹽是每用戶隨機的，彩虹表無效

### 3.2 TOTP 種子加密流程

```javascript
// 簡化示意，實際代碼在 worker.js 中
async function encryptSeed(seed, password, salt) {
  // 1. 派生密鑰
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    keyMaterial,
    512  // 64 字節
  );

  // 2. 拆分：前 32 字節加密，後 32 字節驗證
  const encKey = await crypto.subtle.importKey(
    "raw", bits.slice(0, 32), "AES-GCM", false, ["encrypt"]
  );

  // 3. AES-GCM 加密種子
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    encKey,
    new TextEncoder().encode(seed)
  );

  return { ciphertext, iv, salt };
}
```

解密在前端完成——**種子明文永遠不會離開瀏覽器**。Worker 只負責存取密文blob。

### 3.3 為什麼是 600,000 次？

OWASP 2023 年對 PBKDF2-HMAC-SHA256 的推薦是 600,000 次迭代。這不是拍腦袋的數字：

| 迭代次數 | 單次派生耗時（普通筆電） | 暴力破解成本 |
| --- | --- | --- |
| 100,000 | ~50ms | 低 |
| 600,000 | ~300ms | 高（OWASP 推薦） |
| 1,000,000 | ~500ms | 更高，但用戶體驗下降 |

300ms 的登錄延遲完全可接受，換來的是攻擊者每次猜測都要燒 300ms 的 CPU。

---

## 4. 部署：三種方式

| 方式 | 是否需要 GitHub | 適合場景 |
| --- | --- | --- |
| 本機 Wrangler → Cloudflare | 否 | 最少環節，推薦首次測試 |
| Cloudflare Workers Builds 連接 GitHub | 是 | 開源並隨 push 自動部署，推薦長期使用 |
| GitHub Actions → Cloudflare | 是 | 希望部署記錄與檢查都在 GitHub |

**應用運行不依賴 GitHub。** 自動部署渠道只選一種，避免同一次 push 重複部署。

### 4.1 本機快速預覽（不連 Cloudflare）

需要 Node.js 24，在項目根目錄運行：

```bash
node scripts/preview.mjs
```

打開 `http://127.0.0.1:8788`。首次設置的初始化令牌為 `local-preview-only-setup-token-000000000`，自行設置測試管理員用戶名和至少 12 位密碼。

> 此服務**僅綁定 127.0.0.1，數據庫在內存中，重啟即清空**。固定令牌僅供本地測試，生產環境絕不能使用。

### 4.2 直接部署到 Cloudflare

需要 Node.js 24、npm 和 Cloudflare 帳號：

```bash
npm ci
npx wrangler login
npx wrangler d1 create vault
```

記下輸出的 `database_id`，寫入 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "vault"
database_id = "你的-database-id"
```

初始化數據庫表結構：

```bash
npx wrangler d1 execute vault --file=schema.sql
```

設置初始化令牌（僅用一次）：

```bash
npx wrangler secret put SETUP_TOKEN
# 輸入一個足夠隨機的字符串，初始化後立即刪除
```

部署：

```bash
npx wrangler deploy
```

首次訪問時用 `SETUP_TOKEN` 初始化管理員帳號，**完成後立即刪除這個 secret**：

```bash
npx wrangler secret delete SETUP_TOKEN
```

---

## 5. 安全審計與測試

上線前做了幾件事：

1. **代碼審計**：通讀全部源碼，重點檢查加密流程、身份驗證、SQL 注入面
2. **自動化測試**：`npm test`，10/10 通過
3. **本地運行時驗證**：用 `wrangler dev` 在本地模擬 Cloudflare 環境跑通全流程

### 5.1 已知限制（誠實聲明）

- **密碼遺失無法恢復**：這是設計使然，不是 bug。沒有後門，沒有「忘記密碼」。
- **測試版本**：已完成本地代碼審查和自動化測試，不代表絕對安全或第三方審計認證。
- **先用測試帳號驗證**，再導入真實 2FA。

### 5.2 D1 ID 脫敏

公開倉庫的 `wrangler.toml` 中的真實 D1 ID 和域名註釋已替換為佔位符。Git 歷史壓成一個乾淨 commit 並強推，refs 中已確認找不到真實 D1 ID。

生產部署前必須注入真實 D1 ID，不能直接使用公開 `wrangler.toml`。

---

## 6. 使用體驗

部署完成後，綁定自定義域名（比如 `2fa.your-domain.com`），打開就是一個乾淨的驗證器界面：

- 添加 TOTP：掃二維碼或手動輸入種子
- 6 位數字自動倒計時刷新，點擊複製
- 支持多用戶隔離
- 日間/夜間模式
- 多語言：簡體中文 / English / 한국어 / 繁體中文

還有一個**無刪除權限的 Agent API**，可以給自動化腳本只讀訪問（比如讓機器人幫你讀驗證碼，但刪不掉你的種子）。

---

## 7. 結論

整個項目驗證了一個想法：**TOTP 驗證器不需要是個 App，也可以是個網頁；不需要信任第三方，也可以用 $0 的成本自己託管。**

核心代價只有一個：記住你的主密碼。丟了，誰也救不了你——包括我。

代碼開源在 GitHub，有興趣的可以自己部署一份。記得先用測試帳號跑一遍，確認沒問題再遷移真實的 2FA 種子。

---

*本文為測試版本項目的介紹，不構成安全審計報告。生產使用前請自行評估風險。*
