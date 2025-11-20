# 概要

單一靜態頁面應用（`index.html` + `style.css` + `app.js`），支援手機直放與橫放（響應式），所有畫面樣式寫在單一 CSS 檔，JS 僅負責行為（計時、產題、手勢、流程、觸發結束動畫、猴子遊戲邏輯）。無任何資料儲存或上傳。

---

# 核心功能

1. **支援手機橫放**（landscape）時 UI 仍可清楚顯示並且適合雙手操作。
2. **結果頁動畫效果**（使用 CSS 動畫 + JS 觸發），依得分顯示不同等級與文字：

   * 分數 ≥ 30：「太驚人了」與強烈慶祝動畫（confetti）
   * 分數 26–29：「超級棒」與慶祝動畫（confetti）
   * 分數 20–25：「厲害」與明亮動畫（bubbles + stars）
   * 分數 15–19：「不錯」與溫和動畫（rings）
   * 分數 ≤ 14：「再加油」與鼓勵動畫（shake）
3. **猴子跑步遊戲**：在練習畫面加入視覺化遊戲元素

   * 猴子從位置 5 開始（10 格跑道，位置 0-9）
   * 答對：猴子往右移動一格
   * 答錯或超時：猴子往左移動一格
   * 猴子到達位置 0 會被鱷魚吃掉，遊戲結束
   * 即時顯示遊戲狀態訊息
4. **答題時限功能**：可設定每題的答題時限（0 秒 = 不限時，或 1-4 秒）

   * 超過時限自動判定為答錯，猴子往左移動
   * 時限到達前需要作答，否則會強制跳下一題
5. **答題限速功能**：可設定慢速答題門檻（0 秒 = 不限速，或 1-3 秒）

   * 用於統計哪些題目答對但速度較慢
   * 結果頁會分別顯示「答錯的題目」和「答對但超過門檻的題目」
6. **加強練習模式**：結果頁分析錯誤和慢速題目

   * 自動分析哪些數字（加數和被加數）最常出現在錯誤或慢速題目中
   * 點擊「💪加強練習」按鈕，使用這些困難數字組合新題庫
   * 在 console 印出數字統計分析結果
7. 動畫在靜態頁內實作，不依賴外部 library（使用 CSS keyframes + JS timing）。

---

# 使用者流程

1. 首頁選擇設定：
   * 練習時間（1/2/3 分鐘）
   * 題目總和上限（10/12/15）
   * 是否包含 0（會出現 0 / 不出現 0）
   * 答題時限（不限時 / 1-4 秒）
   * 答題限速（不限速 / 1-3 秒，用於標記慢速題目）
2. 全部設定完成後「開始練習」按鈕才會啟用。
3. 按開始後進入 3 秒倒數，然後開始練習。
4. 練習畫面：
   * 顯示題目（A + B）、剩餘時間、猴子跑步遊戲軌道
   * 小朋友口說答案，家長以**滑動或鍵盤**判定對/錯（右滑/→ = 對，左滑/← = 錯）
   * 答對：猴子往右移動一格
   * 答錯或超時：猴子往左移動一格
   * 猴子到達位置 0 會被鱷魚吃掉，遊戲立即結束
5. 時間到或猴子被吃掉後顯示結果頁：
   * 正確/錯誤/總題數/正確率
   * 依分數顯示等級動畫與文字
   * 顯示「答錯的題目」清單
   * 若設定了限速，也顯示「答對但超過門檻的題目」清單
   * 若有錯誤或慢速題目，顯示「💪加強練習」按鈕
6. 可選擇「再來一次」（沿用設定）、「加強練習」（針對困難數字）或「回首頁」（重新設定）。

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

**觸發時機**：倒數結束或猴子被吃並顯示結果頁時，JS 會根據 `correct` 得分觸發對應動畫組合與顯示文字。

## 等級分界與文字

* `score >= 30` → 等級：`amazing`，標題：「太驚人了」，訊息：「速度與準確度都滿點，保持佳績！」
* `26 <= score <= 29` → 等級：`excellent`，標題：「超級棒」，訊息：「節奏俐落又穩定，距離滿分越來越近！」
* `20 <= score <= 25` → 等級：`awesome`，標題：「厲害」，訊息：「表現很好，繼續加油！」
* `15 <= score <= 19` → 等級：`good`，標題：「不錯」，訊息：「漸入佳境，再多練幾次就更熟悉囉。」
* `score <= 14` → 等級：`tryagain`，標題：「再加油」，訊息：「穩住呼吸，慢慢算，下次一定更好。」

## 動畫實作（CSS keyframes + JS 觸發）

* `amazing`（太驚人了）：大型 confetti（42 個彩色紙片）
  * CSS: `@keyframes confetti-fall` 從上往下掉落，帶有旋轉和水平位移
  * JS: 動態產生 42 個 `<span class="confetti-piece">`，6.5 秒後清理

* `excellent`（超級棒）：中型 confetti（28 個彩色紙片）
  * CSS: 同 amazing 但數量較少
  * JS: 動態產生 28 個彩色紙片，6.5 秒後清理

* `awesome`（厲害）：氣泡上升 + 星星閃爍
  * CSS: `@keyframes bubble-rise` 從下往上升，`@keyframes star-twinkle` 閃爍
  * JS: 產生 14 個 bubble 和 10 個 star，6.2 秒後清理

* `good`（不錯）：同心圓擴散
  * CSS: `@keyframes ring-expand` 圓形擴散並淡出
  * JS: 產生 1 個擴散圓圈，6 秒後清理

* `tryagain`（再加油）：卡片搖晃
  * CSS: `@keyframes shake` 左右搖晃
  * JS: 加上 `.is-shaking` class，3 秒後移除

### 技術備註（實作建議）

* 為避免大量 DOM 元素，`confetti` 可用 `<canvas>`（短 JS draw + particle system）或用 20–40 個 `<span>` 並用 CSS transform/translate + rotation 做視覺效果。選擇 `<canvas>` 可更省效能但實作稍複雜；用 `<span>` 則更易於純 CSS 控制。
* 動畫觸發方式：結果頁 container 加上 `class="show-level amazing"` → CSS 根據 `.show-level.amazing .confetti { animation: ... }` 執行。JS 在顯示結果時先 `addClass`，若需要循環或自動消失，可用 `setTimeout` 在 N 秒後移除動畫 class。
* 可以加入短暫音效（注意自動播放限制）——若要包含，應由使用者點擊按鈕啟動播放（可列為未來選項）。

---

# CSS / Class 規範（重要 class）

## 畫面與佈局
* `.screen--home`, `.screen--countdown`, `.screen--play`, `.screen--result`
* `.layout--portrait`, `.layout--landscape`（JS 根據方向切換）

## 首頁設定
* `.time-option`（時間選項按鈕）
* `.setting-option`（各種設定按鈕：總和上限、零、時限、限速）
* `.btn-start`（開始練習按鈕）

## 練習畫面
* `.card--question`（題目卡）
* `.gesture-area`（左右滑動區）
* `.timer-pill`（計時器顯示）
* `.slide-left`, `.slide-right`, `.pop`（卡片動畫）

## 猴子遊戲
* `.monkey-game`（遊戲容器）
* `.game-track`（軌道容器）
* `.track-cell`（單個格子）
* `.track-cell--danger`（鱷魚格子，位置 0）
* `.track-cell--start`（起始格子，位置 5）
* `.emoji--monkey`（猴子表情符號）
* `.emoji--crocodile`（鱷魚表情符號）
* `.move-right`, `.move-left`, `.eaten`（猴子動畫）
* `.eating`（鱷魚動畫）
* `.game-status`（遊戲狀態訊息）
* `.status-text`, `.status-success`, `.status-alert`（狀態樣式）

## 結果頁
* `.result-level`（等級顯示容器）
* `.level-amazing`, `.level-excellent`, `.level-awesome`, `.level-good`, `.level-tryagain`
* `.is-shaking`（搖晃動畫）
* `.slowest-questions`（答題統計容器）
* `.slowest-section`, `.slowest-title`, `.slowest-list`（統計區塊）
* `.slowest-item`, `.slowest-item--wrong`, `.slowest-item--slow`（統計項目）
* `.timeout-tag`（超時標記）

## 動畫元素
* `.confetti-piece`（彩色紙片）
* `.bubble`（氣泡）
* `.star`（星星）
* `.ring`（擴散圓圈）

---

# 題庫邏輯

## 正常模式題庫產生（200 題）

1. **平衡和數分配**：取 `BALANCED_SUM_MIN` (4) 到 `BALANCED_SUM_MAX` (10) 或使用者設定的 `sumLimit` 中較小者
2. **平均分配**：將 200 題平均分配到各個和數，確保每個和數的題目數量相近
3. **有效配對**：只產生運算元在 0-9 範圍內的有效配對
4. **過濾零配對**：若設定不允許 0，排除 0+0、0+1、1+0 等組合
5. **去除連續重複**：打亂後檢查並移除連續出現的相同題目（a 和 b 完全相同）
6. **0/1 比例控制**：強制將含 0 或 1 的題目比例限制在 10% 以內
7. **題庫除錯**：在 console 輸出完整題庫內容供檢查

## 加強練習模式題庫

1. **統計困難數字**：分析答錯和慢速題目中的加數和被加數
2. **提取所有出現的數字**：取得所有在錯誤/慢速中出現的數字（不限數量）
3. **組合產生**：使用這些數字的所有組合（包括自己+自己）產生題目
4. **符合設定**：仍需符合總和上限和零設定
5. **擴充題庫**：若組合太少，重複添加並打亂到足夠數量（至少 50 題）
6. **Console 輸出**：顯示數字統計和加強練習的目標數字

# 猴子跑步遊戲

* **軌道**：10 格（位置 0-9），位置 0 有鱷魚，位置 5 為起點
* **起始位置**：猴子從位置 5 開始
* **移動規則**：
  - 答對 → 往右移一格（最多到位置 9）
  - 答錯或超時 → 往左移一格（最少到位置 0）
* **遊戲結束**：猴子到達位置 0 時被鱷魚吃掉，立即結束遊戲
* **動畫效果**：猴子移動時有移動動畫，被吃掉時有特殊動畫
* **狀態訊息**：即時顯示遊戲狀態（答對、小心、被吃掉等）

# 答題計時功能

## 答題時限（questionTimeLimit）

* **設定選項**：不限時(0) / 1秒 / 1.5秒 / 2秒 / 2.5秒 / 3秒 / 3.5秒 / 4秒
* **行為**：設定為 0 時不啟動單題計時器；設定其他值時，超過時限自動判定為答錯
* **超時處理**：記錄為錯誤，標記 `timeout: true`，猴子往左移動

## 答題限速（slowThreshold）

* **設定選項**：不限速(0) / 1秒 / 1.5秒 / 2秒 / 2.5秒 / 3秒
* **行為**：用於標記答對但速度慢的題目，不影響遊戲進行
* **結果顯示**：在結果頁分開顯示「答錯的題目」和「答對但超過門檻的題目」

# 行為 / JS 規格（重點）

* 計時：`setInterval` 每秒更新 `timer`；到 0 時或猴子被吃時觸發 `endSession()`。
* 題目：從預先建立的 200 題題庫中依序取出，記錄每題開始時間。
* 答題記錄：每次作答記錄 question、a、b、answer、isCorrect、duration、timeout 等資訊。
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

# 測試項目（Acceptance Tests）

## 基本功能
* T1：首頁必須選擇所有設定（時間、總和上限、零、時限、限速）後，「開始練習」按鈕才會啟用。
* T2：按下「開始練習」後進入 3 秒倒數，然後開始遊戲。
* T3：練習畫面顯示題目、剩餘時間、猴子軌道、遊戲狀態。
* T4：可使用左右滑動或鍵盤（← → 或 A D）判定對錯。

## 響應式
* T5：手機橫放（Landscape）時題目、按鈕、計時、猴子遊戲仍可完整顯示且交互正常。
* T6：滑動閾值合理：滑動小於閾值 → 不判定；滑動超過閾值 → 判定並跳題。
* T7：旋轉螢幕（portrait ↔ landscape）過程中 UI 不會崩壞，滑動仍可操作。

## 題庫邏輯
* T8：題庫產生 200 題，平均分配和數 4-10（或使用者設定的上限）。
* T9：若設定「不出現 0」，題庫中不會有 0+0、0+1、1+0 等組合。
* T10：題庫中含 0 或 1 的題目比例不超過 10%。
* T11：不會連續出現兩題完全相同（a 和 b 都相同）的題目。
* T12：Console 會輸出完整題庫供檢查。

## 猴子遊戲
* T13：猴子從位置 5 開始。
* T14：答對時猴子往右移動，顯示成功訊息。
* T15：答錯或超時時猴子往左移動，顯示警告訊息。
* T16：猴子到達位置 0 時被鱷魚吃掉，遊戲立即結束並顯示結果頁。
* T17：猴子移動和被吃掉時有動畫效果。

## 答題計時
* T18：設定「不限時」時，題目可無限等待作答。
* T19：設定時限（如 2 秒）時，超過時限自動判定為答錯，猴子往左移動。
* T20：超時的題目在結果頁標記為「超時」。

## 結果頁
* T21：時間到或猴子被吃後立即顯示結果頁。
* T22：顯示正確/錯誤/總題數/正確率。
* T23：依分數觸發正確的動畫和文字：
  * correct ≥ 30 → 「太驚人了」+ 大型 confetti (42個)
  * 26 ≤ correct ≤ 29 → 「超級棒」+ 中型 confetti (28個)
  * 20 ≤ correct ≤ 25 → 「厲害」+ bubbles + stars
  * 15 ≤ correct ≤ 19 → 「不錯」+ rings
  * correct ≤ 14 → 「再加油」+ shake
* T24：動畫在 6–8 秒後自動停止並清理。
* T25：顯示「答錯的題目」清單（含超時標記）。
* T26：若設定了限速，顯示「答對但超過門檻的題目」清單。
* T27：若有錯誤或慢速題目（至少 2 題），顯示「💪加強練習」按鈕。

## 加強練習
* T28：點擊「加強練習」後，console 輸出數字統計分析。
* T29：使用統計出的困難數字組合新題庫。
* T30：新題庫仍符合總和上限和零設定。
* T31：若沒有困難數字，顯示提示並進行一般練習。

## 導航
* T32：「再來一次」沿用上次設定重新開始練習。
* T33：「回首頁」清除所有設定，回到首頁重新選擇。
* T34：按「回首頁」或「再來一次」時，動畫立即停止並清理。

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

