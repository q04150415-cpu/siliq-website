# SILIQ 官網視覺與互動改版

完成日期：2026-09-10。已發布至 [正式官網 siliqtw.com](https://siliqtw.com/)，詳見 [發布紀錄](DEPLOYMENT.md)。

## 已完成

- 保留原本品牌色：鼠尾草綠 `#5b8a72`、深綠 `#1e3530`、品牌綠 `#2d4a3e`。
- 首頁加入真實作品拼貼、大字排版、清楚的主要諮詢入口。手機保留作品主視覺。
- 精選案例移至首頁前段，預設三個案例；原有 13 個案例皆可透過分類查看。標題與服務說明固定呈現，影片／成效圖片可直接開啟或預覽。
- 服務重新編排；九個原有合作步驟整合成三個階段說明；評價改成靜態可閱讀卡片。
- 主站與文章頁統一導覽及視覺樣式。
- 知識庫使用品牌色系的文字封面，提供關鍵字搜尋、分類、每次九篇的載入更多、無結果提示及失敗重試。
- 四項免費資源直接進入互動自檢，移除無法真正收件的資料填寫門檻。
- 主要諮詢入口使用既有 LINE；表單改為開啟 Email 草稿，由訪客確認寄出，保留已填內容。
- 修正首頁 Logo 錨點錯誤、手機選單焦點、Escape 關閉、作品預覽焦點返回、FAQ 展開狀態及減少動態效果偏好。
- JavaScript 或首頁內容資料無法取得時，仍保留首頁文案、作品及服務內容。

## 驗證

`python uiux-audit/check_redesign.py`：49 項瀏覽器檢查通過，未發現 JavaScript 頁面錯誤。涵蓋 320、390、700、768、820、1024、1440px 的首頁寬度，另檢查知識庫、資源、FAQ 與一篇文章的桌機／手機版，以及篩選、搜尋、載入更多、失敗重試、選單、燈箱與郵件草稿。

`node --check`：main.js、blog.js、faq.js 語法檢查通過。`git diff --check` 通過。

表單檢查攔截郵件開啟操作，沒有寄出任何測試訊息。未驗證外部 LINE、Instagram 或 Google Drive 的服務可用性，也未進行完整效能／無障礙認證。

## 預覽

- [桌機首頁](after/desktop-home.png)
- [完整首頁](after/desktop-full.png)
- [手機首頁](after/mobile-home.png)
- [手機選單](after/mobile-menu.png)
- [手機案例](after/mobile-work.png)
- [行銷觀點](after/blog-1440.png)
- [免費資源](after/resources-1440.png)
- [檢查結果](after/checks.json)

主要新版樣式位於 `css/refined.css`；首頁文案與既有案例資料保留在 `data/content.json`。諮詢表單沒有後端收件服務，不會宣稱已寄出。
