# 舊 Netlify 官網永久導向正式網址

2026-09-11 使用者詢問為何仍出現 `https://siliq.netlify.app/`，表示正式網址已改為 `https://siliqtw.com/`。

## 核實原因

- `https://siliqtw.com/` 回應 200，Cloudflare，canonical 正確，首頁含最新 35 個業主作品球；公開頁面沒有 `siliq.netlify.app` 連結。
- `https://siliq.netlify.app/` 回應 200，Netlify，仍是舊網站，canonical 為歷史網域 `siliq2378.com`，沒有作品球，未設轉址。
- 使用者從哪個外部入口看到舊網址尚未確認；不可斷言來自 Google／104／特定社群。
- Netlify CLI 確認站名 `siliq`、site id `8b63ffbe-60c4-4387-85ec-ff76ac19a232`、custom domain `siliq2378.com`、沒有 domain aliases 或連結的自動建置 repository。是同公司舊官網，非員工系統。

## 修正

專用目錄 `uiux-audit/netlify-redirect/`，僅發布搬遷備援頁與 `_redirects`：

```text
/* https://siliqtw.com/:splat 301!
```

維持頁面路徑及 query 參數；規則強制套用，舊網址訪客及爬蟲改前往正式官網。未重新發布官網內容到 Netlify，未修改 Cloudflare、DNS、GitHub Pages、員工系統或外部帳號資料。

Netlify 仍綁定的歷史 custom domain 如流量到達此站，也套用同一轉址。另觀察 `www.siliqtw.com` DNS 未解析，並非本次舊 Netlify 入口問題，本次未修改。

## 發布及驗證

- 舊正式 deploy／回退點：`6a96977cc7213e34c3e6aecf`。
- 轉址測試 deploy：`6aa397fcaf10911f942e07c7`。8 條代表路徑驗證通過，包含首頁、blog、文章、resources/index.html、FAQ、robots、sitemap、UTM 參數。
- 新正式 redirect deploy：`6aa39965661519153416ed90`。
- `python uiux-audit/verify_legacy_redirect.py` 檢查正式 Netlify 網址，報告 `uiux-audit/after/legacy-redirect-live.json`。
- 官網內容仍使用 Cloudflare 版本 `0c825bf5-6889-4355-9794-8d84ee3bc015`。

## 後續維護

Netlify 此站只作轉址入口，官網內容只發布到 Cloudflare `siliq-website` / `siliqtw.com`。本機 `CNAME` 與部分舊紀錄的 `siliq2378.com` 屬歷史 GitHub／Netlify 配置，不是目前官網部署目標。

搜尋結果顯示的網址需等搜尋引擎重新抓取更新；永久轉址不代表已更新外部帳號、已提交 Search Console 或已完成 Google 網址變更工具。

- [Netlify redirect options](https://docs.netlify.com/manage/routing/redirects/redirect-options/)
- [Google site move guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
