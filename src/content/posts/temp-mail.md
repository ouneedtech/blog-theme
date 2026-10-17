---
title: 自託管臨時郵箱：Cloudflare Workers + D1 的郵局系統
published: 2026-10-17
description: 註冊帳號不想暴露真實郵箱？用 Cloudflare Workers + D1 + Email Routing 打造一個純自託管的臨時郵局：匿名建地址、即時收信、零成本。
tags: ["Cloudflare", "臨時郵箱", "自託管", "Email Routing"]
category: "技術"
draft: false
---

> 📮 **在線體驗**：[https://temp-mail-7tt.pages.dev](https://temp-mail-7tt.pages.dev) —— 本文中介紹的自託管臨時郵局，打开即用。

---

## 0. TL;DR：先給結論

| 問題 | 結論 |
| --- | --- |
| 這是什麼？ | 一個跑在 Cloudflare Workers + D1 上的臨時郵箱系統 |
| 為什麼不用 Guerrilla Mail？ | 自己的域名、自己的數據；不怕服務商跑路；可自定義域名 |
| 能發信嗎？ | 新用戶默認不能發信（額度為 0），防濫用；管理員可發 |
| 成本？ | Cloudflare 免費額度內搞定，$0 |
| 部署多麻煩？ | Worker + D1 + Email Routing，約 15 分鐘 |

---

## 1. 起點：為什麼要自託管臨時郵箱

臨時郵箱這東西，用過的人都知道它的痛點：

- 公共臨時郵箱（Guerrilla Mail、Temp-Mail 之流）地址池是公開的，別人也能看到你的郵件
- 免費服務說關就關，地址今天能用明天不一定
- 想要自己的域名？要麼付費，要麼自己搭

自託管的思路很直接：**域名是自己的，數據是自己的，規則也是自己定的**。

Cloudflare 的免費套餐正好能湊齊所有零件：
- **Email Routing**：免費的郵件轉發，catch-all 到 Worker
- **Workers**：免費 10 萬請求/天，跑 API 夠用了
- **D1**：免費 5GB，存郵件綽綽有餘
- **Pages**：免費托管前端

---

## 2. 架構：一張圖看懂

```
發件人 → Cloudflare Email Routing → Worker (temp-mail)
                                            ↓
                                    D1 (temp-mail-db)
                                            ↓
                                    Pages 前端展示
```

- **收信**：Email Routing 的 catch-all 規則把所有寄到 `mail.ouneed.kdns.fr` / `mail.cuneed.kdns.fr` 的郵件轉給 Worker，Worker 解析後存 D1
- **讀信**：前端調用 Worker API，匿名用戶只能看到自己創建的地址的郵件（地址隔離）
- **發信**：默認關閉，新用戶額度為 0；管理員可通過後台發信

域名配置：

| 域名 | 用途 |
| --- | --- |
| `mail.ouneed.kdns.fr` | 默認域名 |
| `mail.cuneed.kdns.fr` | 備用域名 |

---

## 3. 防濫用設計：為什麼不怕被薅

臨時郵箱最怕的就是被批量薅——有人寫腳本狂建地址拿來註冊、發垃圾郵件。這套系統有三層防護：

### 3.1 新用戶默認零發信額度

`DEFAULT_SEND_BALANCE` 默認為 0。新註冊的用戶（包括匿名創建的地址）**不能發信**，只能收信。想發信？管理員後台手動加額度。

這就堵死了 99% 的垃圾郵件濫用——薅地址可以，但發不出去。

### 3.2 IP 限流（代碼已就緒）

Worker 代碼裡對高風險接口做了限流埋點：

| 接口 | 說明 |
| --- | --- |
| `/api/new_address` | 創建新地址 |
| `/api/send_mail` | 發送郵件 |
| `/user_api/register` | 用戶註冊 |
| `/user_api/verify_code` | 驗證碼 |

限流按 `路徑 + IP` 做 key，超限返回 429。目前需要綁定 Cloudflare Rate Limiting 資源才能生效（Dashboard 裡幾分鐘能配好）。

### 3.3 地址隔離

匿名用戶 A 創建的地址，匿名用戶 B 看不到。每个地址有獨立的訪問憑證，不會像公共臨時郵箱那樣"撞地址"看到別人的郵件。

---

## 4. 管理員後台：能做什麼

管理員通過 `x-admin-auth` 請求頭驗證（前端彈框輸入密碼），可以：

- 查看所有地址和郵件
- 搜索郵件內容
- 刪除地址/清空收件箱
- 發送郵件（管理員不受額度限制）
- 查看統計（郵件數、地址數、活躍數）
- 配置 IP 黑名單

---

## 5. 部署要點：幾個坑

### 5.1 Email Routing 的 catch-all

兩個域名都要配 catch-all → Send to Worker → 選 `temp-mail`。配完後要等 DNS 生效，實測約 5 分鐘。

### 5.2 D1 綁定

Worker 需要綁定 D1 數據庫 `temp-mail-db`，binding 名為 `DB`。表結構用項目裡的 `schema.sql` 初始化。

### 5.3 管理員密碼

通過 Worker secrets 設置 `ADMIN_PASSWORDS`（JSON 數組字符串，如 `["你的密碼"]`）。前端沒有獨立的登錄接口——輸入密碼後存在瀏覽器，每次請求帶 `x-admin-auth` 頭，服務端比對。

### 5.4 前端部署

前端是獨立的 Vite 項目，構建後部署到 Cloudflare Pages。API 地址在前端配置裡指向 Worker 的 `workers.dev` 域名或自定義域名。

---

## 6. 和公共臨時郵箱的對比

|  | 公共臨時郵箱 | 自託管（本方案） |
| --- | --- | --- |
| 域名 | 服務商的 | 自己的 |
| 隱私 | 地址池公開，可能被偷看 | 地址隔離，別人看不到 |
| 穩定性 | 看服務商心情 | 自己掌控 |
| 發信 | 通常不支持 | 管理員可發，用戶默認禁發 |
| 成本 | 免費（有廣告） | Cloudflare 免費額度，$0 |
| 維護 | 不用管 | 偶爾看看 |

---

## 7. 適合誰用

- **開發者**：測試註冊流程、接驗證碼，不想用真實郵箱
- **隱私黨**：註冊不重要的服務時隔離真實郵箱
- **羊毛黨**：接碼專用（配合 Cloudflare 的 100 個郵箱接碼方案效果更佳）

不適合：
- 需要長期穩定收信的重要帳號（臨時郵箱本來就不是乾這個的）
- 需要大量發信的場景（額度機制就是防這個的）

---

## 8. 開源與部署

這個郵局基於開源項目二次開發（原項目支持 Telegram Bot、S3 存儲等多種功能，本站只啟用了核心收發信）。如果你也想搭一個：

1. 準備一個 Cloudflare 帳號（免費版就行）
2. 準備一個域名（託管在 Cloudflare）
3. 按第 5 節的要點配置 Email Routing + D1 + Worker + Pages

全程免費，半小時搞定。

---

*最後更新：2026-10-17*
