# 朋友自行建置驗證 — 2026-10-27

目標：受邀朋友取得完整儲存庫後，在 Windows x64 自行下載依賴、啟動與建置桌面版。純文字檢視 ZIP 不適用。

## 本次補齊

- 補入封包材料清單必讀的 Node、yt-dlp 與 FFmpeg 歷史證據文字，並明確標示其驗證範圍。
- 補入 astring、meriyah、typing_extensions、delvewheel、cffi 內嵌 libffi 原始通知／來源，以及 SDK 可讀條款原文，共 12 份文字檔。
- 新增首次建置指南，修正 README 與原始碼分享／Windows 文件。

## 實際驗證

環境：既有 Windows 11 x64 主機，Node.js 24.14.1、Python 3.14.0；專案使用鎖定的 Electron 44.7.2。以遠端原始碼的獨立副本補入上述材料，起初無專案工具快取，從鎖定上游取得輸入。

第一次位於較深目錄時，MSYS2 套件簽章目的路徑達 263 字元，Python 複製失敗。改用短路徑後，沿用本次已校驗的下載檔，從來源完成 LAME 與 FFmpeg 編譯，沒有借用原工作目錄的已編譯工具。指南要求短且不含空白的路徑。npm／Electron／electron-builder 可能使用主機使用者快取。

通過項目：

1. `npm ci`、`desktop:tools`；FFmpeg 建置收據與所有工具雜湊驗證成功，37 份 yt-dlp 補充輸入成功。
2. `desktop:export`、`desktop:build`、`desktop:check-package`；版本 1.0.4 封包資源、授權、工具與 43 份來源附件檢查成功。
3. `node scripts/verify-desktop-tools.cjs`；四個工具在空 PATH 下執行成功。
4. 開發版與封裝版 smoke 測試：支援頁、授權文字、受限橋接、音訊保存、reload 與程序重啟保存通過，使用隔離測試資料。
5. 本次重新執行 3 項原始碼匯出測試與 50 項桌面／腳本測試通過。先前同版功能原始碼的 45 項應用測試、型別與 lint 檢查通過；本次未改功能程式碼。

本機安裝檔 `English-Listening-Lab-1.0.4-Setup.exe`：181002475 bytes；SHA-256 `78471aede05b74ddfed8fc5a8c95b2247759b7d555e8504955409dee5fcba84f`。此雜湊僅識別本次本機產物，不要求其他電腦逐位元相同；安裝檔不加入 Git，也不作為遠端附件交付。

## 未聲稱完成的範圍

未在全新 Windows 虛擬機或朋友電腦重新安裝；未代替使用者接受安裝條款；未保證 YouTube 每個影片的可下載性；未聲稱第三方元件全部可位元重現或法律審查已完成。材料清單的 `publicDistributionApproved` 與 `sourceClosureComplete` 維持 false。CI 仍僅執行原始碼檢查，不產生二進位附件。
