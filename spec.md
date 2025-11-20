# 概要

單一靜態頁面應用（`index.html` + `style.css` + `app.js`），支援手機直放與橫放（響應式），所有畫面樣式寫在單一 CSS 檔，JS 僅負責行為（計時、產題、手勢、流程、觸發結束動畫）。無任何資料儲存或上傳。

---

# 新增需求（本次變更）

1. 支援手機**橫放**（landscape）時 UI 仍可清楚顯示並且適合雙手操作。
2. 結束結果頁加入**動畫效果**（使用 CSS 動畫 + JS 觸發），依得分顯示不同等級與文字：

   * 分數 ≥ 30：顯示「驚人」與強烈慶祝動畫
   * 分數 20–29：顯示「超級棒」與明亮動畫
   * 分數 15–19：顯示「不錯」與溫和動畫
   * 分數 ≤ 14：顯示「再加油」與鼓勵動畫
3. 動畫必須在靜態頁內實作，不依賴外部 library（可用 CSS keyframes + small JS for timing + optional `<canvas>` for confetti）。

---

# 使用者流程（快速重述）

1. 首頁選時間（1/2/3 分）→ 按開始（3 秒倒數） → 練習畫面（倒數計時）。
2. 顯示題目（A + B），小朋友口說答案，家長以**滑動或按鈕**判定對/錯（右滑 = 對，左滑 = 錯）。
3. 每次判定後跳下一題直到時間到。
4. 時間到顯示結果頁（正確 / 錯誤 / 總數 / 正確率）以及等級動畫與稱讚文字。按「再來一次」回首頁。

---

# UI / 響應式規範（手機橫放重點）

* 基本策略：採「Mobile-first」設計，然後用 media queries 處理大螢幕與橫放。
* 斷點建議：

  * 手機直立：`max-width: 600px`（預設）
  * 手機橫放 / 小平板： `@media (min-width: 601px) and (max-width: 900px)` 或 `@media (orientation: landscape) and (max-height: 600px)`
  * 桌面： `min-width: 901px`
* 手機橫放 UI 要點：

  * 題目區置中，字體自動縮放但仍保持可讀（題目字級建議：直立時 `6.5rem`，橫放時 `4.5rem` 或使用 `clamp()`）。
  * 左右滑動互動區可延伸成明顯的左右按鈕（靠近兩側邊緣，觸控目標至少 64×64px）。
  * 時間與計分顯示放在畫面上方或左右側（橫放時置於上方左側與右側，或一側垂直排列）。
  * 保留 safe area（iPhone notch / home indicator）：使用 CSS env() 變數 `padding`（`padding: env(safe-area-inset-left)` 等）。
* Landscape 示例 layout：

  * 左側：錯誤按鈕（大面積紅）
  * 中央：題目卡片（大）
  * 右側：正確按鈕（大面積綠）
  * 下方或上方：剩餘時間與當前分數
* 旋轉偵測：監聽 `window.orientation` 或 `resize` 事件以調整 JS 內任何需要依畫面大小或方向決定的行為（例如滑動閾值）。

---

# 結果動畫細節（等級映射與行為）

**觸發時機**：倒數結束並顯示結果頁時，JS 會根據 `correct` 得分觸發對應動畫組合與顯示文字。

## 等級分界與文字

* `score >= 30` → 等級：`amazing`，文字：「驚人」
* `20 <= score <= 29` → 等級：`excellent`，文字：「超級棒」
* `15 <= score <= 19` → 等級：`good`，文字：「不錯」
* `score <= 14` → 等級：`tryAgain`，文字：「再加油」

## 動畫建議（全部用 CSS keyframes + 少量 JS 觸發 class）

* `amazing`（驚人）：大型 confetti + 卡片跳動 + 數字放大閃爍

  * CSS: `@keyframes confetti-fall`, `@keyframes pop-scale`
  * JS: 在結果頁插入多個 `<span class="confetti">` 並加入動畫 class，3s 後漸出消失。
* `excellent`（超級棒）：氣泡上升 / 星星閃爍 + 樂觀放大文字動畫

  * CSS: `@keyframes bubble-rise`, `@keyframes glow`
* `good`（不錯）：卡片輕微彈跳 + 邊框閃動

  * CSS: `@keyframes bounce-small`
* `tryAgain`（再加油）：簡單鼓勵動畫（文字淡入 + 搖一搖提示）

  * CSS: `@keyframes shake` + `fade-in`，並顯示鼓勵文

### 技術備註（實作建議）

* 為避免大量 DOM 元素，`confetti` 可用 `<canvas>`（短 JS draw + particle system）或用 20–40 個 `<span>` 並用 CSS transform/translate + rotation 做視覺效果。選擇 `<canvas>` 可更省效能但實作稍複雜；用 `<span>` 則更易於純 CSS 控制。
* 動畫觸發方式：結果頁 container 加上 `class="show-level amazing"` → CSS 根據 `.show-level.amazing .confetti { animation: ... }` 執行。JS 在顯示結果時先 `addClass`，若需要循環或自動消失，可用 `setTimeout` 在 N 秒後移除動畫 class。
* 可以加入短暫音效（注意自動播放限制）——若要包含，應由使用者點擊按鈕啟動播放（可列為未來選項）。

---

# CSS / Class 規範（重要 class）

* `.screen--home`, `.screen--countdown`, `.screen--play`, `.screen--result`
* `.btn-start`, `.time-option`, `.timer-display`, `.score-display`
* `.card--question`（題目卡）
* `.gesture-area`（左右滑動區）
* `.btn-mark-correct`, `.btn-mark-wrong`（備援按鈕）
* 結果動畫相關：

  * `.result-level`（容器）
  * `.level-amazing`, `.level-excellent`, `.level-good`, `.level-tryagain`
  * `.confetti`, `.bubble`, `.star`（動畫元素）
* 響應式 / orientation：

  * `.layout--portrait`, `.layout--landscape`（JS 可根據方向切換）

---

# 行為 / JS 規格（重點）

* 計時：`setInterval` 每秒更新 `timer`；到 0 時觸發 `endSession()`。
* 題目：`nextQuestion()` - 隨機兩個 0–9 整數。
* 滑動偵測：

  * 使用 `pointerdown`, `pointermove`, `pointerup` 或 `touch*`，計算水平位移 `dx`。
  * 閾值：水平位移超過 `minSwipe = Math.min(window.innerWidth * 0.12, 80)` 或固定 `50px` 即視為滑動成功。
  * 成功左滑：`markWrong()`；右滑：`markCorrect()`。
  * 動畫：在決定後，加 class `.slide-left` / `.slide-right` 觸發 CSS 轉場，然後在 transition end 呼叫 `nextQuestion()` 並移除 slide class。
* 橫放關聯：

  * 當 `orientation` 或 `resize` 發生時，重新計算 `minSwipe` 與調整 UI（例如把計分顯示放到一側）。
* 結束：

  * `endSession()` 計算 `score`、`total`、`accuracy`，顯示 `.screen--result`、並呼叫 `triggerResultAnimation(level)`.
  * `triggerResultAnimation(level)` 會在 `.result-level` 上加入 `.level-{key}`，插入必要的 DOM（如 confetti），並在 5–8 秒後清理。
* 無任何資料儲存：`window.localStorage` 不使用。

---

# Accessibility（可及性）

* 文字說明與 aria 標籤：

  * 每個按鈕都有 `aria-label`（例：`aria-label="標記為正確"`）。
  * 結果頁節點應有 `role="status"` 以便螢幕閱讀器讀出結束結果。
* 顏色對比：確保紅/綠對色盲友善，可加上圖示（勾/叉）與文字。
* 對於不能滑動使用者，左右大型按鈕與鍵盤支援（← → 或 A / D）均可操作。

---

# 測試項目（Acceptance Tests，含新功能）

* T1：手機橫放（Landscape）時題目、按鈕、計時與分數仍可完整顯示且交互正常。
* T2：在橫放時，左側與右側的大按鈕可被觸控，並產生 correct/wrong 並跳題。
* T3：滑動閾值合理：滑動小於閾值 → 不判定；滑動超過閾值 → 判定並跳題。
* T4：時間到後立即顯示結果頁，並根據 `correct` 數觸發正確分級動畫：

  * correct=32 → 顯示「驚人」動畫
  * correct=22 → 顯示「超級棒」動畫
  * correct=17 → 顯示「不錯」動畫
  * correct=8  → 顯示「再加油」動畫
* T5：動畫在 6–8 秒後自動停止（或在使用者按下「再來一次」時立即停止並清理）。
* T6：旋轉螢幕（portrait ↔ landscape）過程中 UI 不會崩壞，滑動仍可操作。

---

# 交付物（更新）

1. `index.html` — 單頁結構（含所有 screen container）
2. `style.css` — 所有畫面樣式與動畫（包含 landscape 規則、confetti / star / bubble CSS）
3. `app.js` — 行為與動畫觸發（計時、題目、手勢、orientation 處理、結果動畫觸發）
4. `README.md` — 部署說明、支援瀏覽器、使用說明、如何調整分數門檻與動畫參數

---

# 建議實作細節（快速提示給工程師）

* 使用 `clamp()` 讓題目字級自適應： `font-size: clamp(2.5rem, 8vw, 6.5rem);`
* Safe area padding：`padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);`
* 建議把 slide 動畫與下一題延遲設定為 `transition-duration: 260ms`，以保持流暢。
* 為了簡單與可維護，先以 DOM `<span class="confetti">` 實作 confetti（20–40 個），若想更流暢再改用 `<canvas>` 版本。
* 將結果等級文字與 class 的 mapping 保存在一個小物件（JS），方便未來更改門檻或文字。

