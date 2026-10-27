# 正式上線差距盤點 — 2026-10-19

結論：Windows x64 桌面版已有核心功能，但目前不應把既有安裝包當成正式公開版本。主要差距是發布材料與驗收，並非缺少帳號或雲端功能。

範圍：目前工作區的程式碼、發布設定、第三方材料及測試。依 README 與桌面規格，以 Windows 安裝版為主；手機商店發布另計。本次沒有修改產品程式碼、提交 Git 或公開檔案。不是完整安全掃描或法律結論。

## 1. 本次重新驗證

| 檢查 | 結果與界線 |
| --- | --- |
| TypeScript / lint | 重新執行，兩者 exit code 均為 0 |
| 應用測試 | 6 suites、45/45 通過 |
| 桌面測試 | 18/18 通過 |
| Expo web export | exit 0；649 modules，輸出 dist。這不等於安裝版可啟動 |
| 現存驗收包資源比對 | **失敗**：release-check-v8-retry/win-unpacked 的 aead-gcm-stream-0.4.0/LICENSE-MIT 與目前來源不一致 |
| Git 發布狀態 | git remote -v 為空；大量應用程式、測試、workflow 與材料尚未追蹤，HEAD 為 bd401be |

第一次使用系統沙盒 Temp 執行測試時，Jest cache 與音檔 rename 出現 EPERM，並未證實產品邏輯錯誤。把 TEMP/TMP 設為專案內 desktop/.test-data/readiness-temp 後，以上 63 項測試全部通過。沒有修改測試斷言。

已讀指定的 [Expo SDK 57 文件](https://docs.expo.dev/versions/v57.0.0/)；package.json 的 Expo 57、React 19.2.3、React Native 0.86.3 與該版文件的主要版本組合一致，本機 Node 為 24.14.1。

## 2. 按優先順序處理的五項缺口

### P0：第三方材料尚未結案，清單本身也不一致

- `docs/release/ffmpeg-direct-source-index.json` 仍是 `completeCorrespondingSource: false`，57 個直接候選不代表完整對應來源。
- `docs/release/yt-dlp-dependency-sources.json` 仍是 `complete: false`；Deno/V8 的完整執行檔對應與通知涵蓋也仍待核對。
- `deno-mit-copyright-gaps.json` 只列 2 項，但 `deno-mit-author-license-supplements.json` 列 8 項，且本次讀取其 8 份實體授權檔，全部仍含 `<copyright holders>` 占位文字。不能據較短清單宣稱只剩 2 項，亦不能以貢獻者姓名直接填成權利人。
- `scripts/check-desktop-package.cjs:37` 僅把 `desktop/vendor/sources` 壓成來源附件，未把已收集的完整候選材料轉成經核定的發行清單；包檢查通過也不代表來源完整。

完成條件：統一待處理清單；逐項以實際版本和證據決定所需來源／通知；產生明確的發行附件 manifest 與 hash，檢查附件缺漏。若無法取得必要證據，另行評估縮減所捆綁工具的方案。

粗估：先對齊清單 2–4 小時；材料結案另估 3–7 個工作天以上，可能受上游資訊限制，不能保證日期。

### P0：現存安裝包已過期，最新版的實機驗收未完成

本次直接呼叫 checkPackage 檢查 `desktop/.test-data/release-check-v8-retry/win-unpacked`。包內 aead-gcm-stream 授權是舊署名，工作區是占位文字，因而在資源位元比對處失敗。10/19 文件記載的「包檢查通過」不能延用到現在的來源狀態。

既有 10/19 紀錄另記載 Electron 44.7.2 本體與候選 App 在這台主機、載入 App 前退出；本次未重跑啟動，不能認定是 App 程式缺陷，也不能說已修復。10/17 的啟動、重裝與還原證據僅適用當時候選。

完成條件：材料定稿後重建；在乾淨 Windows x64 機器驗證安裝、啟動、離線播放、完整曲庫／草稿／成績備份還原、不同版本升級及卸載保留資料。保留對應安裝檔 hash 與環境資料。

粗估：有可用乾淨環境後 1–2 個工作天；若仍有啟動問題須另外診斷。

### P0：尚無可重現、可追溯的正式發布路徑

Git remote 未設定，核心新檔仍未追蹤。`.github/workflows/windows-desktop.yml` 只對私人儲存庫上傳 artifact，沒有建立 Release 的步驟；`electron-builder.yml` 設定 `publish: null`。本次沒有查遠端帳號，因此不以本地 remote 為空推論遠端儲存庫一定不存在。

完成條件：逐項審核公開檔案（排除私人音檔、歌詞、profile、快取與 Python bytecode），保存可重建的 commit；從乾淨 checkout 成功建置；建立版本 tag、release notes、安裝檔、SHA-256 與完整來源附件的對應。公開二進位仍須等材料結案。

粗估：1–2 個工作天，假設儲存庫存取與材料均就緒。

### P1：真實 YouTube 路徑與相依風險仍缺最後驗收

歷史紀錄只有真實「無英文字幕」下載成功；人工英文字幕與自動字幕流程有離線測試，但沒有完整真實下載驗收證據。補測英文字幕、缺字幕轉本機歌詞、取消／重試、網路中斷與不可用影片。

10/19 舊稽核記錄是 npm production tree 29 個受影響節點（24 high、5 moderate）；本次未重新查 npm advisory，不能稱為最新數字或 29 個可利用的 App 漏洞。需把建置鏈與實際發行 bundle／工具分開記錄暴露與處置。不要用不相容的 Expo 降版來消除警告。

完成條件：最終版本的真實流程證據，以及與最終產物對應的相依風險處置紀錄。

粗估：1–2 個工作天，視網路與上游服務可用性。

### P1：使用者取得正式版後仍缺支援入口

目前主要頁面與 navigation 沒有「關於／版本／授權／問題回報／取得新版」入口。備份與資料位置已有文件，不必重做；需把使用者實際找得到的入口及資料損壞後的處理說明補齊。`getProgress()` 對讀取失敗會顯示空進度，但保存會拒絕覆寫；需讓使用者理解錯誤與復原方式，避免只看到像歸零的統計。

安裝包設定明確關閉簽章。簽章應有明確發行決策；本盤點不把「未簽章」單獨視為技術上不能發布，也不建議使用者關閉防護。產品圖示與發行者資訊應在最後安裝驗收時一併檢查。

完成條件：能查看版本、開啟授權和更新／支援說明，清楚區分本機匯入與 YouTube 連線行為；完成錯誤與復原操作驗收。

粗估：0.5–1.5 個工作天；簽章身分驗證的外部等待另計。

## 3. 已有成果與可以延後的範圍

LRC 相容性、難度填空、匯入保存、刪歌及重試保護已有實作與測試；備份還原已有同版開發環境紀錄。不要再把 10/16 報告中「沒有刪歌」等舊狀態當成待辦。

自動更新、登入、雲端同步、更多曲目和手機商店版不必成為 Windows 首版門檻。若要同時上架手機，app.json 尚缺 iOS bundle identifier 與 Android package，亦未見 eas.json；須另列商店素材、原生建置與裝置驗收工作，不能用 Windows 結果代替。

## 4. 執行順序

1. 先把第三方材料的 8 項／2 項矛盾整理成一份可追蹤清單，確認每項完成條件。
2. 補支援入口與真實 YouTube／風險驗收；收斂要公開的檔案清單。
3. 材料定稿後，從乾淨 checkout 建置最終候選，執行乾淨 Windows 安裝及跨版本升級驗收。
4. 所有阻擋結案後才發布相同 hash 的安裝包與來源附件。

規劃量級約 1–3 個工作週；第三方證據與 Electron 啟動問題可能延長，不宜承諾固定上線日。優先順序是本次建議，並非已完成的實作計畫。
