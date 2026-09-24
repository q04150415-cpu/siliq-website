# Google 搜尋與 AI 推薦：下次接續事項

## 最新進度：2026-09-10 已開工並發布

- 使用者已指示「開工」，下方「尚未修改」為前次保存時的歷史狀態。
- 全站正式網域、canonical、分享網址、結構化資料與 robots 的地圖指向已修正為 `siliqtw.com`。
- 網站地圖已整理為 74 個可收錄頁面；保留四個互動資源頁原本的 noindex，不納入 sitemap。獨立 HTML 的 canonical 已配合 Cloudflare 改成不含 `.html` 的實際網址。
- 已新增並發布 `/services/taichung-social-media/`，首頁服務區及頁尾有可爬取入口。作品沿用現有資料，未新增未核實的營收、排名、費用或案例成果。
- 已部署至既有 Worker `siliq-website`，版本 `cefb8628-0b1c-4fc6-9f95-29766dc0e6d6`。詳見 [SEO 修改與發布紀錄](SEO-IMPLEMENTATION.md)。
- 使用者已確認有 Google Search Console，但沒有 Google 商家檔案。Search Console 的資源名稱、是否涵蓋 `siliqtw.com` 與目前權限仍待確認；尚未操作帳戶或提交 sitemap。
- 已詢問實際接客服務方式（到客戶所在地、公司接待或完全線上），待確認後決定商家檔案資格及是否顯示地址。
- 下一步：取得帳戶狀態後處理 Search Console 與商家資料；完整案例的需求、統計期間、成果及報價方式仍需使用者提供真實資料。
- Git 工作區尚未 commit／push；直接發布不等於 Git 備份。

---

儲存日期：2026-09-10（Asia/Taipei）。使用者指示「先存，我們明天處理」；今天只保存討論，不執行 SEO 修改、帳戶設定或再次發布。預計 2026-09-11 使用者回來後接續，沒有設定自動執行或提醒。

## 使用者目標與偏好

- 希望有人搜尋「台中自媒體公司」時，Google 的搜尋結果與 AI 回答能推薦 SILIQ。
- 維持已完成的漂亮 UI／UX，主題色不可跑掉：鼠尾草綠與深綠。
- 提高收錄、相關性與可信度；不保證固定排名、AI 推薦或見效時間。

## 已完成的網站工作

- UI／UX 已改版並發布至 https://siliqtw.com/。
- 正式部署目標：Cloudflare Workers `siliq-website`，純靜態 Assets。
- `siliq.pages.dev` 是員工系統，不是官網，不可依本機 Pages 快取部署。
- 已通過 49 項本機瀏覽器檢查，並完成正式站首頁、知識庫、資源及 FAQ 驗證。
- 版本：`7ccc70f9-1ddb-4e2a-8c2c-e8a9bd8ceaf3`。詳見 `DEPLOYMENT.md`。
- 官網諮詢使用 LINE；表單開啟 Email 草稿，由訪客確認寄出。沒有後端收件服務。
- 工作區修改尚未在本次對話中 commit／push；正式發布是直接上傳網站檔案。

## 已核實、尚未修正的搜尋問題

1. 正式網域是 `siliqtw.com`，首頁 canonical 仍為 `https://siliq2378.com/`。
2. 正式站 robots.txt 的 Sitemap 指向舊網域。
3. 正式站 sitemap.xml 有 69 處舊網域網址，沒有目前網域。
4. 首頁既有 `ProfessionalService` 結構化資料的網址與 Logo 仍指向舊網域；並非缺少結構化資料。
5. 首頁定位偏整體品牌行銷，尚未建立專門回答「台中自媒體公司」需求的服務頁。
6. 公開搜尋找到 104 公司介紹仍列 `siliq.netlify.app`，可列為外部品牌資料更新項目。
7. 未取得 Google Search Console 或 Google 商家檔案的驗證／權限狀態，不可宣稱網站沒有收錄，也不可宣稱已完成商家設定。

上述資訊於 2026-09-10 檢查正式網址與本機程式確認。SEO 討論階段只有檢查，沒有修改或發布 SEO 設定。

## 建議執行順序

1. **搜尋技術設定**：把 canonical、網站地圖、robots 的地圖網址、結構化資料及分享網址統一至正式網域；檢查站內連結與 HTTP 回應。舊站導向需先核實控制權與目前用途，不可改到員工系統或其他服務。
2. **Search Console**：確認使用者是否已驗證 `siliqtw.com`，再提交正確 sitemap、使用網址檢查工具確認重要頁面可收錄與 Google 選定的 canonical。
3. **在地服務頁**：建議 `/services/taichung-social-media/`，標題範例「台中自媒體經營公司｜短影音製作與個人品牌打造｜SILIQ 行銷」。說明真實服務區域、適合客群、服務內容、報價方式、合作流程、客戶需準備的資料及作品。這是提案，尚未建立。
4. **案例內容**：先整理三篇完整案例，包含需求、SILIQ 實際工作、執行方式、統計期間與成果。現有觀看數不能當作成交或營收；客戶地區、成果與合作細節需核實，不可捏造。
5. **Google 商家檔案**：確認是否已建立／驗證及是否符合資格；使用真實名稱、地址或服務區域、分類、營業時間、照片、正式網址。邀請真實客戶留下評價，不買評價或虛構內容。
6. **站外一致性**：FB、IG、104、合作夥伴頁等統一品牌名稱與正式網址；外部帳戶更新依可用權限與使用者指示處理，不替使用者向他人發訊息。
7. **追蹤**：以 Search Console 的查詢曝光／點擊、收錄狀況及實際諮詢衡量。優先觀察「台中自媒體公司」「台中短影音製作」「台中社群代操」。

## 下次需要使用者補充

上一則已詢問但尚未得到回答：是否已有並驗證 **Google 商家檔案**與 **Google Search Console**？若有，確認商家網址與 Search Console 資源名稱／權限。

內容製作時再確認：主要服務客群、實際服務區域、可公開的報價方式，以及可核實的案例資料。網站目前記載地址為台中市潭子區雅豐街110巷42號2樓；是否接待客戶應向使用者確認。

## 官方參考與公開資料

- Google AI 功能與網站：https://developers.google.com/search/docs/appearance/ai-features
- Google 生成式 AI 搜尋最佳做法：https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google 網址整合與 canonical：https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Google 商家在地排名：https://support.google.com/business/answer/7091?hl=zh-Hant
- 104 公司介紹：https://www.104.com.tw/company/1a2x6bmmkl

SEO 仍是 Google AI 搜尋的基礎；頁面須符合收錄及摘要顯示資格。沒有專用的「AI 推薦開關」，不應把堆疊關鍵字、大量重複文章或新增 llms.txt 當成保證推薦的方法。
