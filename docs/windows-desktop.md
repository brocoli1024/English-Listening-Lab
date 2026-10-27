# Windows 桌面版

目前提供原始碼供受邀朋友自行建置，尚不交付安裝包。首次搭建請依 [Windows 首次建置指南](build-on-windows.md)。CI 僅跑原始碼檢查，已確認的舊安裝包附件已刪除。

目標平台：Windows 10 22H2 / Windows 11，x64。

## 一般使用者

正式發布後，從本專案 GitHub Releases 取得 `English-Listening-Lab-版本-Setup.exe`，執行安裝即可。不需另外安裝 Node.js、Python、FFmpeg 或 yt-dlp。

目前是開發驗證版本，尚未公開發布，沒有數位簽章。Windows 可能顯示發行者未知；請核對來源與同一版本的 SHA-256。

1. 開啟 App，按「匯入我的歌曲」。
2. 選「本機檔案」，或「YouTube 網址」並檢查影片、下載音訊。
3. 確認英文歌詞與難度，按「儲存並開始練習」。

YouTube 僅接受單首不需登入的公開影片，最長 20 分鐘；請使用有權下載的內容。人工英文字幕優先，其次自動字幕。自動字幕可能有錯字；缺少可用字幕時，音檔會暫存，選擇自己的 TXT / LRC 後才能儲存。沒有自動語音辨識。

音檔上限 50 MiB，歌詞上限 300,000 字元及 1,500 行。下載可取消，最長 10 分鐘。失敗可重試；尚未儲存的下載會在退出時清除。

## 資料與更新

首頁的「說明與支援」可查看目前版本、程式授權全文、第三方通知、隱私說明與完整備份還原步驟。1.0.4 的下載、問題回報與完整隱私頁按鈕會透過預設瀏覽器開啟本專案固定 GitHub 頁面；正式公開前，頁面可能尚無安裝檔或僅限有權限的人存取。不會自動送出問題回報。

曲庫、音檔和答案草稿存在 `%APPDATA%\English Listening Lab`。已匯入歌曲可離線使用；YouTube 檢查和下載需要網路。桌面資料與瀏覽器曲庫分開。

更新時安裝新版 App，沿用相同資料目錄。移除程式預設保留資料；需要完整清除時，先退出 App 並備份上述資料夾，再自行刪除。不要在 App 運行時搬動資料。

YouTube 規則改變時，可能需要更新整個 App。本版沒有背景工具更新或帳號登入功能。

## 開發者建置

以下命令適用完整儲存庫；必要文字材料已附入，私人測試曲庫與建置快取不隨附。

本機建置環境需要 Windows x64、Node.js 24、npm、Python 3.12+、Windows tar，以及下載依賴與官方工具的網路。請使用短且不含空白的專案路徑，完整步驟見首次建置指南。

```powershell
npm ci
node node_modules/electron/install.js
npm run desktop:tools
npm test -- --watch=false
npm run test:desktop
npm run typecheck
npm run lint
npm run desktop:build
npm run desktop:check-package
```

工具版本與校驗碼記錄於 `desktop/tools.lock.json`。準備工具時先校驗來源下載，再解壓；重跑會重新驗證快取。工具與產物不進 Git。安裝包在 `release/`。

隔離測試（不可使用正式資料目錄）：

```powershell
$env:LISTENING_LAB_TEST_DATA_DIR = Join-Path (Get-Location) 'desktop\.test-data\manual'
npm run desktop:start
```

GitHub Actions 僅執行原始碼測試、型別與 lint 檢查，不建置安裝包、不上傳 artifact，也不發布 Release。本機建置腳本供接收者自行產生與檢查產物；本次分享不包含工具執行檔、來源附件或安裝包，也不表示二進位散布條件已完成審查。

驗收狀態請見 [windows-desktop-verification.md](testing/windows-desktop-verification.md)。

## 刪除匯入歌曲

在匯入歌曲卡片按「刪除歌曲」，確認歌名後按「確認刪除」。此操作會移除該曲音檔、所有難度的答案草稿及成績；內建歌曲沒有刪除按鈕。按「取消」不會刪除資料。

刪除過程若儲存失敗，曲庫保留該項目讓你重試；部分資料可能已清理，請再次確認刪除完成清理。重新匯入需重新選擇自己的音檔與歌詞。

## 手動備份與還原（Windows）

1. 完全關閉 English Listening Lab，確認沒有下載工作仍在執行。
2. 在檔案總管開啟 `%APPDATA%`，將整個 `English Listening Lab` 資料夾複製到你的備份位置。不要只複製 audio 子資料夾；曲庫、草稿及成績也需要一起保存。
3. 還原前保持 App 關閉，先把目前的 `English Listening Lab` 資料夾另行備份並改名，避免覆蓋唯一副本。
4. 將備份的完整資料夾放回 `%APPDATA%\English Listening Lab`，再啟動 App，檢查歌曲播放、答案草稿與成績。

請保留原始音檔與歌詞，並在獨立資料目錄驗證備份可還原。備份包含你匯入的私人內容，分享專案或回報問題時不要附上整個資料夾。
