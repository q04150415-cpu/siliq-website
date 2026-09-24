# 首屏球面作品（2026-09-11）

依使用者提供的首屏截圖，將右側希希醫師、機車改裝的兩張長方形作品卡改為可旋轉球面。使用原有作品圖片，未更換圖片或案例內容。

- 圓形球面包含影像透視、光源、陰影及高光；依來源圖片比例調整取樣，避免直接把直式圖拉成正方形。
- 預設緩慢往復旋轉，游標停留或鍵盤焦點進入時停住；可左右拖曳或使用左右方向鍵轉動。
- 提供暫停／播放旋轉按鈕。拖曳不觸發案例跳轉，普通點擊仍前往作品區。
- 遵從 prefers-reduced-motion，預設靜態；頁面隱藏或主視覺離開可見範圍時停止動畫更新。
- 無 WebGL、繪圖失敗或停用 JavaScript 時，保留原圖的圓形展示與連結；動畫不可用時隱藏控制按鈕。
- 無外部套件或新增圖片下載；新增 `css/hero-spheres.css`、`js/hero-spheres.js`，更新首頁 HTML。

## 驗證

- `check_hero_spheres.py` 共 24 項檢查通過：球面渲染、動畫變化、暫停、拖曳、鍵盤、點擊跳轉、6 種螢幕尺寸、減少動態效果與 WebGL／JavaScript 備援。
- `check_redesign.py` 原有 53 項檢查通過。
- JavaScript 語法與 `git diff --check` 通過。
- 本機截圖：`after/local-spheres-1440.png`、`after/local-spheres-390.png`。
- 正式站檢查使用 `check_hero_spheres.py --live`，結果記於 `after/spheres-production-checks.json`。

## 發布

Cloudflare Worker：`siliq-website`，正式網址：https://siliqtw.com/。

版本：`c866e784-9c86-42c3-a71d-c3f0075b1139`；前版本：`a3fcd112-87e8-442d-8f4d-8d2365add4f0`。184 個公開檔案中更新 3 個。
