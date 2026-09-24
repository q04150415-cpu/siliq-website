# 官網系統（SILIQ 行銷官網）

## 下次接續（2026-09-10 保存）

使用者已回來指示「開工」。2026-09-10 已完成並發布搜尋技術設定與台中自媒體服務頁，版本 `cefb8628-0b1c-4fc6-9f95-29766dc0e6d6`。剩餘工作為確認 Search Console／Google 商家檔案權限、提交 sitemap、補齊可核實案例與更新外部品牌資料。完整進度見 [SEO 接續紀錄](uiux-audit/SEO-NEXT-STEPS.md) 與 [本次 SEO 發布紀錄](uiux-audit/SEO-IMPLEMENTATION.md)。

## 正式發布設定（2026-09-10 核實，優先於下方歷史紀錄）

- 2026-09-11 舊站轉址：使用者回報 `siliq.netlify.app` 仍出現；核實舊 Netlify 官網仍回傳 200 且未轉址。已將 Netlify `siliq`（site id `8b63ffbe-60c4-4387-85ec-ff76ac19a232`）改為專用 301 永久轉址，所有路徑導向 `https://siliqtw.com/:splat`。Netlify 正式 deploy `6aa39965661519153416ed90`。**Netlify 今後只維護轉址，不得把官網內容重新部署到舊站。** 官網內容持續發布 Cloudflare `siliq-website`；本次未變更 Cloudflare 或 DNS。詳見 `uiux-audit/LEGACY-DOMAIN-REDIRECT.md`。

- 2026-09-11 最新發布 `0c825bf5-6889-4355-9794-8d84ee3bc015`：再更新 11 個業主正式名稱並移除鱘龍谷，作品球現為 35 件。詳見 `uiux-audit/PORTFOLIO-GLOBE.md` 最新章節；匯入器名稱對應與排除清單已同步。已逐一核對正式官網 35 個名稱、連結與 320px 手機顯示。

- 2026-09-11 最新發布 `60b9f449-dea0-49ad-8f13-b0b8e9a704cf`：作品球「品牌影像」下方 9 個業主改成使用者指定正式名稱，詳見 `uiux-audit/PORTFOLIO-GLOBE.md`。清單為 `data/globe-clients.json`，匯入器 `prepare_globe_clients.py` 已加入對應，避免重新匯入覆蓋名稱。36 個作品的圖片、連結、進場與滑動音效均沿用。線上確認所有完整名稱在 320px 手機可顯示。

- 2026-09-11 最新發布 `bb0c880d-aa85-4722-81aa-ec9482c35b15`：依使用者回饋，只有進場音效改為科技電子蓄能、加速音階、低頻收束及高音尾韻；滑動音效已獲使用者認可，保持原樣。音效 script 版本 `20260911-3`。其餘延續下版 36 業主與碎片進場。

- 2026-09-11 最新發布 `f2fe2808-7300-4901-90fd-143fee5666f7`：新增 2.65 秒圖片碎片聚合進場、重播、原創聚合與滑動音效、靜音記憶。移除夏美女、鴻鼎菓子、藍鯨區塊鏈後為 36 個業主；发布清單也排除三張封面。新增 `js/globe-effects.js`，遵守音訊互動限制。詳見 `uiux-audit/PORTFOLIO-GLOBE.md` 最新章節。

- 2026-09-11 最新發布 `08adffac-c857-4d59-b2ca-ce3b033ad08d`：依澄清改為「一顆由多個業主封面拼成的作品球」，使用使用者提供的 Drive 資料夾中 39 個業主代表封面，可上下左右拖曳、點選與暫停。詳見 `uiux-audit/PORTFOLIO-GLOBE.md`。資料為 `data/globe-clients.json`；修改後執行 `python uiux-audit/build_portfolio_globe.py`。新檔為 `css/portfolio-globe.css`、`js/portfolio-globe.js`，首頁不再載入舊兩顆球版本。

- 2026-09-11 最新發布 `c866e784-9c86-42c3-a71d-c3f0075b1139`：首屏兩張作品改為互動旋轉球面，可拖曳與暫停；詳見 `uiux-audit/HERO-SPHERES.md`。新增 `css/hero-spheres.css` 與 `js/hero-spheres.js`，無 WebGL／JavaScript 時有靜態圓形圖片備援。下方為前版紀錄。

- 最新版本 `a3fcd112-87e8-442d-8f4d-8d2365add4f0`：依使用者指定，將首頁與服務頁主打案例名稱改為「阿美上班不無聊」，連結、封面及策略分析沿用；下方策略分析發布為前一版本。

- 最新發布為案例策略分析：`f0a7fc00-5ad3-4e0d-a088-5bfe8bca3e12`。13 個案例各有「設計思路」與「信任價值」，首頁桌機每列圖片旁放分析、手機上下排列，服務頁 3 件作品同步。文案存於 `data/content.json` 的 `portfolio[].strategy`。首頁主打仍為 Instagram `DY69y4TSG6H`（竹東少女案件）。詳見 `uiux-audit/CASEWORK-IMPLEMENTATION.md`。

- 現行正式官網：`https://siliqtw.com/`。
- 部署至 Cloudflare Workers 的 `siliq-website`，使用純靜態 Assets；自訂網域 `siliqtw.com` 直接綁定此 Worker。
- `siliq.pages.dev` 是員工系統，**不是本官網**；本機 `.wrangler/cache/pages.json` 的 `siliq` 專案快取不可當作官網發布目標。
- 本機 Netlify 連結仍為 `siliq`，但其 `siliq2378.com` 為歷史設定；本次發布沒有更新 Netlify 或 GitHub Pages。
- 發布檔案包含 `assets/`、`blog/`、`css/`、`data/`、`faq/`、`js/`、`resources/`、`services/` 及網站根目錄 HTML、robots、sitemap；不直接上傳整個工作區，避免帶入本機設定、檢查報告與個人截圖。
- 最新 UI 樣式：`css/refined.css`。首頁資料由 JSON 載入，已移除舊的 localStorage 快取清除流程。
- 本次版本與驗證記錄：`uiux-audit/DEPLOYMENT.md`。

## 專案用途
SILIQ 行銷（希利克鳥有限公司）的公司官方網站，靜態網站，包含首頁、部落格、FAQ、免費資源下載頁（lead magnet）、IP 自檢表，以及一個純前端的後台管理頁（admin.html）。正式網域為 `siliqtw.com`（舊網域 `siliq2378.com` 已過期棄用，2026-09 已全站汰換）。

## 技術棧
- 純靜態 HTML / CSS / JavaScript（無 build 工具、無 package.json、無框架）
- 內容資料以 JSON 驅動：`data/content.json`（首頁文案）、`blog/articles.json`（部落格文章清單），由 `js/main.js`、`js/blog.js` 等以 `fetch()` 讀取並渲染
- `admin.html` 是純前端的內容編輯後台，帳密與內容編輯結果存在瀏覽器 `localStorage`（無後端 API、無資料庫）
- Google Fonts（Noto Sans TC、Montserrat）

## 目錄結構重點
- `index.html`：首頁
- `admin.html`：後台管理頁（localStorage 驗證與內容編輯）
- `blog/`：部落格文章頁（多個子資料夾，每篇文章一個目錄）＋ `articles.json`（文章清單）＋ `index.html`（列表頁）
- `faq/`、`resources/`：FAQ 頁與免費資源下載頁（brand-checklist、content-calendar、marketing-healthcheck、video-script）
- `ip-checklist.html`：IP 自檢表頁（獨立 lead magnet 頁）
- `css/`：`style.css`、`blog.css`、`faq.css`、`resources.css`
- `js/`：`main.js`（首頁邏輯）、`blog.js`、`faq.js`、`resources.js`
- `data/content.json`：首頁文案內容
- `assets/`：Logo、夥伴 Logo、作品集圖片
- `temp-ig/`：IG 輪播圖暫存（依日期命名的 slide 圖片，供發文使用）
- `sitemap.xml`、`robots.txt`：SEO 設定，Sitemap 指向 `siliqtw.com/sitemap.xml`
- `CNAME`：GitHub / 靜態託管用自訂網域檔，內容為 `siliqtw.com`（實際服務走 Cloudflare Workers，此檔僅避免舊網域殘留）
- `.netlify/`、`.wrangler/`：Netlify CLI 與 Cloudflare Wrangler 的本地暫存/連結資料（已被 `.gitignore` 排除，不進版控）

## 常用指令
本專案沒有 build/test script（無 package.json）。從 `.claude/settings.local.json` 允許清單可確認曾使用過的操作：
- `npx http-server`：本機預覽靜態網站
- `netlify deploy` / `netlify status` / `netlify login`：部署與檢查 Netlify 站台
- `npx netlify-cli`：透過 npx 執行 Netlify CLI

## 部署方式
- 已連結 Netlify 站台（`.netlify/state.json` 內有 `siteId`），發布目錄（publish）即專案根目錄，透過 Netlify CLI（`netlify deploy`）手動部署
- 也曾以 Cloudflare Wrangler 操作（`.wrangler/` 快取存在），且權限清單中有 `siliq-website.pages.dev` 網域，顯示同時有 Cloudflare Pages 部署存在
- Git remote：`https://github.com/q04150415-cpu/siliq-website.git`
- 正式網域：`siliqtw.com`（綁定 Cloudflare Workers `siliq-website`）；舊網域 `siliq2378.com` 已過期棄用
- 未發現 GitHub Actions 或其他 CI 設定檔，部署為手動觸發

## 注意事項
- `admin.html` 的登入帳密與內容編輯結果僅存於瀏覽器 `localStorage`，沒有後端驗證或資料庫，清除瀏覽器資料會導致編輯內容遺失、且非真正安全的權限控管
- `js/main.js` 會在頁面載入時先執行 `localStorage.removeItem('siliq_content')` 清除舊快取，再重新載入內容
- Git 歷史中有大量「Auto: daily blog」「ig carousel」提交，顯示部落格文章與 IG 輪播圖是透過自動化流程持續產生並提交進版控（本專案內未找到對應的自動化腳本原始檔）
- 根目錄有多個個人截圖與宣傳圖片（`S__...jpg`、`螢幕擷取畫面...png`），非網站程式碼的一部分，留意勿誤刪
- `.claude/`、`.netlify/`、`.wrangler/`、`.env*` 已列在 `.gitignore`，不會被提交
