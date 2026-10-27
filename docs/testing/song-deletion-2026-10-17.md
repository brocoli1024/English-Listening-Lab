# 曲庫刪除驗收 — 2026-10-17

使用者已同意：僅刪匯入歌曲，確認後移除音檔、所有難度草稿與該曲成績。已實作 HomeScreen 的確認／取消／忙碌與錯誤提示，內建歌曲不顯示刪除按鈕。

## 證據

- 完整基準：44 項 Jest、18 項桌面測試、typecheck、lint 通過。其後新增最終曲庫寫入失敗的重試測試，importedSongs 12 項通過、lint 通過；未宣稱已重跑全部 45 項。
- 桌面 removeAudio 原本吞掉任何檔案錯誤，現僅忽略 ENOENT，EACCES 等錯誤傳回讓 UI 提示重試。
- scripts/delete-song-smoke.cjs 實際啟動開發版 Electron＋最新 dist，用 desktop/.test-data/delete-song-smoke 獨立 profile 測試：取消保留歌曲與音檔、確認移除音檔／草稿／成績、頁面重新載入仍不存在。兩次執行通過。
- confirmation.png 已目視檢查確認文字與取消／確認按鈕；測試資料未寫入真實使用者曲庫。
- Jest roots 與 TypeScript include 限制 App 原始碼，Metro 排除下載來源及發行材料，避免工具掃描外部測試。Metro blockList 本機檢查確認排除生成目錄且保留 src；新增 Metro 設定後仍需正式乾淨建置驗證。

## 界線

本次為開發版桌面 UI 驗收，尚未重建安裝包，也不是乾淨電腦或不同版本升級驗收。刪除採可重試清理：中途錯誤可能已有部分資料刪除，保留曲庫項目並明確提示。全部清理成功才移除曲庫項目。無法恢復已刪資料。
