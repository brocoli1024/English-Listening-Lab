# English Listening Lab — Windows 首次建置指南

本次起未另獲較廣授權的新增原創內容，僅供檢視、學習及個人非商業建置／執行，詳見 [LICENSE](LICENSE)。先前 MIT 版本及後續相同內容的 MIT 權利保留；第三方授權另行適用。這是公開可檢視的原始碼專案，不將新條款稱為開源授權。詳見 [分享與授權範圍](docs/source-sharing.md)。

請取得完整 GitHub 儲存庫（含 assets 與 docs），不要使用 `source:review` 產生的純文字檢視 ZIP。公開儲存庫可直接下載，無須邀請。以下目標為 Windows 10 22H2／Windows 11 x64；不涵蓋 Windows ARM、macOS 或 Linux 桌面安裝包。

## 1. 準備環境

安裝 Node.js 24 x64（含 npm）、Python 3.12+（加入 PATH；本次本機使用 3.14 驗證），以及 Git for Windows。使用一般 PowerShell；若 `npm.ps1` 被執行原則阻擋，使用 `npm.cmd`，不必關閉整台電腦的安全設定。

```powershell
node --version
npm.cmd --version
python --version
git --version
tar --version
```

需能連線至 GitHub、Node.js、npm、MSYS2 與 SourceForge。首次工具準備會下載原始碼、編譯工具鏈及第三方材料，並編譯 FFmpeg；請預留數 GB 下載與至少 15 GB 可用空間作為保守起點。耗時取決於網路與 CPU，可能超過一小時。專案的工具來源與編譯快取留在 `desktop/.downloads/`；npm、Electron 與 electron-builder 也可能使用使用者目錄的下載快取。不需另裝全系統 MSYS2 或 FFmpeg。

## 2. 下載與安裝依賴

建議使用短且不含空白的路徑，例如 `C:\dev\English-Listening-Lab`，避免原生工具鏈路徑限制。以下從你選定的父目錄執行：

```powershell
git clone https://github.com/brocoli1024/English-Listening-Lab.git
cd English-Listening-Lab
npm.cmd ci
node node_modules/electron/install.js
npm.cmd run desktop:tools
```

每一行成功後再執行下一行。`npm ci` 使用儲存庫鎖定版本；Electron 安裝命令可補上曾設定 `ELECTRON_SKIP_BINARY_DOWNLOAD` 時缺少的執行環境。工具準備會檢查固定 SHA-256；遇到下載失敗可重跑同一命令，不能任意更改鎖檔雜湊來略過檢查。FFmpeg 編譯詳細紀錄位於 `desktop/.downloads/ffmpeg-build/<build-key>/logs/`。

GitHub 的 Code → Download ZIP 也可取得完整專案，解壓縮後從 `npm.cmd ci` 開始；純文字檢視 ZIP 不適用。

## 3. 驗證與啟動

```powershell
npm.cmd run test:source-review
npm.cmd test -- --watch=false
npm.cmd run test:desktop
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run desktop:start
```

第一次測試請先使用內建歌曲，再匯入自己有權使用的音檔與歌詞。關閉桌面視窗後即可回到命令列。YouTube 功能保留，但網站限制、登入要求與字幕可用性可能使特定影片失敗；不需要提供個人 cookies 或帳號憑證。

## 4. 在本機產生安裝檔

關閉正在執行的 App 後執行：

```powershell
npm.cmd run desktop:build
npm.cmd run desktop:check-package
```

安裝檔位於 `release/English-Listening-Lab-<版本>-Setup.exe`。檢查程式另產生 SHA-256、第三方來源附件及材料清單。安裝檔未數位簽章；不要自動略過安全警告或接受條款。建置成功不代表所有再散布條件完成審查；材料清單中的公開散布核准仍為 false。

請僅分享儲存庫原始碼連結。`desktop/vendor/`、`desktop/.downloads/`、`release/`、`desktop/.test-data/` 與私人教材不應加入 Git。CI 只執行原始碼檢查，不上傳安裝包。

## 排除問題

- `python` 無法辨識：安裝 Python 並加入 PATH，重開 PowerShell，再確認版本。
- Electron 找不到：執行 `node node_modules/electron/install.js`。
- 工具下載或 SHA-256 失敗：記下失敗 URL／檔名與錯誤，確認網路後重試；不要關閉驗證。
- 編譯錯誤：先查看上述 logs；回報最後的錯誤文字、Windows／Node／Python 版本即可，不要附私人曲庫。
- 測試的 junction／symbolic link 權限錯誤：這是測試環境能力限制，不能算測試通過；請在支援建立連結的環境驗證。

## 驗證紀錄

2026-10-27 已在獨立專案副本完成工具來源建置、安裝包建置、43 份來源附件檢查及封裝版重啟保存測試。這是既有 Windows 主機上的隔離專案測試，不等於全新 Windows 虛擬機驗收。詳見 [本次驗證範圍](docs/testing/friend-build-2026-10-27.md)。
