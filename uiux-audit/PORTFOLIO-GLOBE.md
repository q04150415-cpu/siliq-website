# 單顆業主作品球 — 2026-09-11

## 最新：第二批正式名稱，移除鱘龍谷

依使用者指定更新：天櫻通訊、野餐派對、建材學霸詹姆士、維格診所、特膜電改里歐、熱浪小島-島主、名人阮橋本鋼鐵爸、美甲業主靜靜、LEXUS賴俊宏、個人IP-Miru、工廠醫生。鱘龍谷已從清單、首頁與發布封面檔案中移除，現有 **35 個業主**。前批正式名稱保持。

- `data/globe-clients.json`、匯入器對應與排除清單、首頁靜態內容已同步。既有音效驗證的清單數量與移除名稱也已更新。
- 比較前版確認保留作品的 11 個 title 更新，其餘圖片、連結與分類完全相同；發布目錄只有 35 張封面且沒有 `client-36.webp`。
- 本機既有作品球 31 項檢查通過；正式官網逐一切換核對 35 個名稱及連結，320px 手機所有名稱完整顯示且無溢出。
- 正式版本 `0c825bf5-6889-4355-9794-8d84ee3bc015`；發布設定 `uiux-audit/casework-release-20260911-103318/wrangler.json`，223 個公開檔案。更新首頁與球體 JSON，刪除發布目錄中的鱘龍谷封面。

## 最新：業主正式名稱

依使用者逐字指定更新作品球 9 個名稱：

- 希希 → 皮膚專科四寶媽希希醫師
- 大瑪螺螄粉 → 賣吃的小安(大瑪螺螄粉)
- 什麼鳥人生 → SILIQ行銷-什麼鳥人生
- 六爺 → 企業命理風水六爺
- 可魯 → 素食很好吃
- 周爺 → 網紅IP周爺
- 房仲 → 房仲案例
- 美閣 → 美閣SPA
- 孫老師算命 → 老娘算你狠孫老師

修改 `data/globe-clients.json` 與匯入器名稱對應，再執行 `build_portfolio_globe.py` 同步首頁。比較前版確認只有 9 個 title 改動，36 件圖片、連結與分類完全相同。

正式版本 `60b9f449-dea0-49ad-8f13-b0b8e9a704cf`；發布設定 `uiux-audit/casework-release-20260911-100549/wrangler.json`，224 個檔案，只有首頁與球體 JSON 更新。本機既有作品球 31 項檢查通過；正式官網逐一切換 36 個作品，名稱、連結與本機清單一致，所有完整名稱在 320px 手機無溢出。截圖 `after/formal-names-mobile.png`。

## 最新音色調整：科技進場，滑動沿用

使用者明確認可滑動音效，要求進場更科技炫麗。只改 `assemblySound`，新增專用的 `energySweep`／`energyResolve`；雙聲道微失諧鋸齒波經低通濾波上升，六段加速電子音階，聚合落點以低頻下滑與四層高音尾韻收束。比較前版確認 `setup`、`route`、`tone`、`air`、`cue`、`swipe` 原始碼完全相同。

- script query：`js/globe-effects.js?v=20260911-3`。
- 發布設定：`uiux-audit/casework-release-20260911-015452/wrangler.json`；224 個檔案，更新首頁與音效 script 共 2 個。
- 正式版本：`bb0c880d-aa85-4722-81aa-ec9482c35b15`。
- 本機 `check_globe_effects.py` 19 項通過；音訊峰值檢查延長到覆蓋整段進場與尾音。`node --check`、`git diff --check` 通過。
- 正式官網 `check_globe_effects.py --live` 19 項通過，完整進場、滑动、靜音與手機均正常。

## 最新：碎片進場、音效、移除三個業主

- 依使用者要求移除夏美女、鴻鼎菓子、藍鯨區塊鏈，現為 **36 個業主**。公開發布清單也排除這三張封面檔案；本機来源留存。
- 首次進入可視範圍時，球面圖片碎片從散落狀態旋轉聚合，2.65 秒後完成，支援「重播聚合」。拖曳、鍵盤操作、暫停、視窗縮放可立即結束進場。減少動態偏好直接顯示完整球體。
- 新增 `js/globe-effects.js`，必須在 `portfolio-globe.js` 前載入。CSS 與 JS 版本 query 為 `20260911-2`。
- 原創 Web Audio 音色：濾波空氣聲、柔和正弦泛音、低頻收束與短殘響。拖曳音量跟移動幅度變化，發聲頻率限制為 85ms 一次；切換作品有輕微提示聲。master gain 0.32 + 壓縮器。
- 音效遵守瀏覽器的互動限制；首次訪問可能靜音播放動畫，第一次點擊／觸控／鍵盤互動可啟用。點「重播聚合」可一起體驗動畫與聲音。「音效：關」記憶至 localStorage。背景分頁停止音訊，無 AudioContext 不妨礙球體互動。
- 音效啟用參照 [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)；未嘗試繞過 autoplay policy。
- 本機檢查：作品球 31 項、進場／實際音訊輸出／靜音 19 項、共用功能 53 項通過。`check_globe_effects.py` 用真實 Web Audio 輸出分析確認有聲音、峰值未削波，並驗證靜音後輸出歸零、偏好記憶、移除業主及手機動畫。
- 發布候選：`uiux-audit/casework-release-20260911-014623/wrangler.json`，224 個公開檔案，36 張球體封面，共 1,449,992 bytes。以下為前版歷史。
- 正式版本：`f2fe2808-7300-4901-90fd-143fee5666f7`，2026-09-11 發布至 `siliqtw.com` / Cloudflare `siliq-website`。
- 正式官網驗證：`check_globe_effects.py --live` 19 項與 `check_portfolio_globe.py --live` 31 項全部通過。結果為 `after/globe-effects-production.json` 與 `after/globe-production-checks.json`。

使用者澄清：將許多業主作品圖片拼成「同一顆可上下左右滑動的球」，並提供公開 Drive 根資料夾，每個子資料夾對應一個業主。

## 成果

- 首屏只有一顆球，使用 39 個不同業主的實際代表封面；緩慢自轉、滑鼠與手機上下左右拖曳、鍵盤、前後按鈕及暫停。
- 球中央對應業主名稱與作品連結；點球面圖片可將該業主移到中央，點名稱開啟選定作品。
- 使用原生 WebGL，無新增套件。減少動態偏好預設暫停；無 WebGL 或 JavaScript 仍有封面拼圖與作品連結。
- 13 件詳細案例與策略分析維持原資料。球體清單獨立於作品篩選。

## 內容来源與維護

- 公開清單：`data/globe-clients.json`；39 張壓縮 WebP：`assets/globe/`，總計 1,537,810 bytes。
- 各業主候選封面均已透過本機聯絡表目視檢查。排除內部資料、毛片、空資料夾、黑畫面／過場預覽及錯放品牌封面。
- 44 個候選業主目錄中，阿哲、BHKS 未找到可用檔案；蘿菠先生、BNI 預覽無代表畫面；The more 候選封面實為摩瑪建材，暫不納入。
- 完整來源與對應檔案只保存在 `uiux-audit/after/globe-sources.json`，不部署稽核目錄與完整 Drive 目錄清單。網站只連結選定單一作品檔案。
- 修改清單後執行 `python uiux-audit/build_portfolio_globe.py` 同步首頁静態備援與互動資料。`js/portfolio-globe.js` 直接讀該備援圖片資料。
- 原兩顆球檔案保留作歷史紀錄，首頁已改載入 `css/portfolio-globe.css` 與 `js/portfolio-globe.js`。

## 驗證

- `node --check js/portfolio-globe.js`、`git diff --check` 通過。
- `python uiux-audit/check_portfolio_globe.py`：31 項通過，涵蓋單顆球、39 個名稱與連結、橫直拖曳、真實 touch 事件、键盤循環、暫停、減少動態、無 JS／WebGL 備援及 320–1440px。
- `python uiux-audit/check_redesign.py`：53 項首頁與共用功能檢查通過。
- 桌機／手機截圖：`uiux-audit/after/local-globe-1440.png`、`local-globe-390.png`。

## 發布

使用 `prepare_seo_release.py --label casework` 的公開檔案清單，部署至 Cloudflare `siliq-website` / `https://siliqtw.com/`。

- 正式版本：`08adffac-c857-4d59-b2ca-ce3b033ad08d`。
- 發布設定：`uiux-audit/casework-release-20260911-011000/wrangler.json`；226 個公開檔案，43 個新增／更新。
- 回退前一個正式版本：`c866e784-9c86-42c3-a71d-c3f0075b1139`（舊兩顆球）。
- `python uiux-audit/check_portfolio_globe.py --live` 正式官網 31 項全部通過，包含 39 張封面載入、手機觸控與所有尺寸；結果為 `after/globe-production-checks.json`。
