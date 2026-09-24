# SEO 修改與發布紀錄（2026-09-10）

使用者指示「開工」後，完成官網搜尋設定與台中自媒體服務頁，已發布至 https://siliqtw.com/。

## 修改

- 77 個既有公開 HTML 頁更新舊網域引用；補上原本缺少的 canonical。網域更新包含分享圖片、JSON-LD 與頁面顯示文字。
- 首頁搜尋標題與摘要聚焦台中、自媒體、短影音及社群經營；新增服務頁入口，保留原視覺主標與品牌色。
- 新增 `/services/taichung-social-media/` 與 `css/local-service.css`，包含服務內容、既有三件作品、合作方式、諮詢準備與原生 details FAQ。內容與連結在不執行 JavaScript 時仍可使用。
- 新頁加入 Service、BreadcrumbList 結構化資料，首頁組織以 `https://siliqtw.com/#organization` 識別。
- robots.txt 指向正式網站地圖；sitemap.xml 共 74 筆網址，保留原文章 lastmod，更新實際改版的主要頁面日期。四個原設 noindex 的互動自檢頁未納入。
- 已核實正式站 `/privacy.html`、`/ip-checklist.html` 會轉址到無副檔名網址，canonical 與 sitemap 已對齊此規則。
- 修正首頁既有多餘 `</meta>`，避免 HTML head 結構不正確。

## 驗證

- `python uiux-audit/check_seo.py`：74 個 sitemap 目標存在，canonical 唯一且一致、OG URL 與 JSON-LD 正確、無舊網域；新頁連結與錨點有效。
- 新頁 320、390、700、768、1024、1440px 無水平溢出；手機選單、Escape、FAQ、首頁入口及無 JavaScript 內容通過。
- `python uiux-audit/check_redesign.py`：既有 49 項瀏覽器檢查通過。
- `git diff --check` 通過。
- 線上檢查結果：`after/seo-production-checks.json`。檢查正式地圖與 robots 和發布檔一致，每個 sitemap URL 為 200 且不轉址、canonical 正確；新頁 CSS、首頁 JS 與 JSON 相符。

預覽：[桌機](after/seo-service-1440.png)、[手機](after/seo-service-390.png)。

## 發布

- 平台：Cloudflare Workers Static Assets；Worker：`siliq-website`。
- 新版本：`cefb8628-0b1c-4fc6-9f95-29766dc0e6d6`。
- 前版本：`7ccc70f9-1ddb-4e2a-8c2c-e8a9bd8ceaf3`。
- 180 個公開檔案，81 個新增／異動檔案上傳，99 個沿用。
- 保留 `2026-08-05` compatibility date、`nodejs_compat` 與既有 vars；HTML 採 `auto-trailing-slash`、未命中路徑使用 `none`。
- 發布清單：`after/seo-release-manifest.json`；發布暫存目錄已加入 .gitignore，未將工具、報告或個人截圖上傳。
- 舊 Netlify、GitHub Pages、員工系統沒有更新；本機 CNAME 保留歷史部署設定，未改動其他託管站台。
- 工作區未 commit／push。

## 待接續

使用者已確認有 Google Search Console，但沒有 Google 商家檔案。Search Console 的實際資源名稱與權限、公司的實體服務方式仍待確認；網站 sitemap 已可用，但尚未在 Search Console 提交。另待提供可公開的案例背景、成效期間、報價方式，及確認外部品牌帳戶資料。未進行完整案例撰寫或舊站轉址設定。

本次依據 Google 官方的 [canonical 整合指引](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)、[網站地圖指引](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) 與 [AI 搜尋功能說明](https://developers.google.com/search/docs/appearance/ai-features)，以及 [Cloudflare HTML 路由文件](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)。改善搜尋基礎不等於已被 Google 收錄或保證排名。
