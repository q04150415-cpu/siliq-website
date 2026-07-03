# 官網系統（SILIQ 行銷官網）

## 專案用途
SILIQ 行銷（希利克鳥有限公司）的公司官方網站，靜態網站，包含首頁、部落格、FAQ、免費資源下載頁（lead magnet）、IP 自檢表，以及一個純前端的後台管理頁（admin.html）。正式網域為 `siliq2378.com`（見 CNAME）。

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
- `sitemap.xml`、`robots.txt`：SEO 設定，Sitemap 指向 `siliq2378.com/sitemap.xml`
- `CNAME`：GitHub / 靜態託管用自訂網域檔，內容為 `siliq2378.com`
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
- 正式網域：`siliq2378.com`（CNAME 檔案設定），另在權限清單中也出現 `siliqtw.com`
- 未發現 GitHub Actions 或其他 CI 設定檔，部署為手動觸發

## 注意事項
- `admin.html` 的登入帳密與內容編輯結果僅存於瀏覽器 `localStorage`，沒有後端驗證或資料庫，清除瀏覽器資料會導致編輯內容遺失、且非真正安全的權限控管
- `js/main.js` 會在頁面載入時先執行 `localStorage.removeItem('siliq_content')` 清除舊快取，再重新載入內容
- Git 歷史中有大量「Auto: daily blog」「ig carousel」提交，顯示部落格文章與 IG 輪播圖是透過自動化流程持續產生並提交進版控（本專案內未找到對應的自動化腳本原始檔）
- 根目錄有多個個人截圖與宣傳圖片（`S__...jpg`、`螢幕擷取畫面...png`），非網站程式碼的一部分，留意勿誤刪
- `.claude/`、`.netlify/`、`.wrangler/`、`.env*` 已列在 `.gitignore`，不會被提交
