# FFmpeg 本機來源建置

本流程接替舊 BtbN 大型預編譯工具；歷史取證資料保留，不再用於聲稱新成品包含 rav1e、librsvg 等元件。本儲存庫僅分享原始碼供檢視；本文件說明保留腳本的操作方式，不表示提供或核准散布安裝包。

## 建置與輸入驗證

Windows 安裝 Node.js 24 與 Python 3.11 以上，在專案根目錄執行：

```powershell
npm ci
node scripts/ffmpeg-build.cjs
npm run desktop:tools
```

第一次需要網路，工具鏈及來源全部存入 `desktop/.downloads/`。流程不需要安裝 WSL 或建立全系統 MSYS2。`desktop/ffmpeg-build.lock.json` 固定 FFmpeg commit、LAME r6835 來源清單雜湊、MSYS2 base、43 份工具鏈套件及其簽章的 SHA-256；下載後逐項校驗，pacman 驗證套件簽章，並比對全部已安裝套件版本。來源清單 `lame-svn-source.json` 固定 435 個檔案 URL 與 SHA-256。

初次執行可使用先前試作的已驗證快取；乾淨電腦則從鎖定 URL 下載。固定 URL 的服務可用性仍取決於上游，需保留審查所需來源與工具鏈快取以防日後下架，不能改用未鎖定新版。

`scripts/build-ffmpeg.sh` 固定完整設定。LAME 排除前端與 mpg123 解碼器，以 shared DLL 建置；FFmpeg 關閉外部自動偵測，只啟用 LAME 與 Windows SChannel。GPL、nonfree、version3、librav1e、librsvg、libjxl、shaderc、libplacebo、Vulkan 必須為關閉，否則流程停止。保留 FFmpeg 內建格式與濾鏡，不宣稱這是僅音訊的極小建置。

## 成品、來源與通知

建置完成後產生 `desktop/.downloads/ffmpeg-build/<build-key>/receipt.json`。build key 涵蓋鎖檔、LAME 清單及三份建置程式。輸入變動必須另建；快取缺檔、雜湊不符或缺少兩個 DLL 時驗證會失敗。

工具準備流程將四個檔案一併安裝：`ffmpeg.exe`、`ffprobe.exe`、`libmp3lame-0.dll`、`libwinpthread-1.dll`。實際成品 SHA-256 記於 `desktop/vendor/installed-hashes.json`；receipt 另保留來源附件雜湊與 DLL import table。編譯器路徑與其他環境差異可能影響位元結果，因此不宣稱跨電腦成品 SHA-256 必定相同。

來源附件包含：

1. `ffmpeg.tar.gz`：未修改的固定官方來源。
2. `lame.tar.gz`：435 個逐項校驗的固定 SVN 原始檔，以固定 tar metadata 封存。
3. `ffmpeg-build.tar.gz`：鎖檔、LAME 來源清單及實際使用的建置程式。
4. `mingw-w64.tar.gz`：固定提交 `63ebe6cdb3ec4d5c586b7f0f0c03dd502e44c296` 的完整執行期／標頭來源，涵蓋其中可能適用 LGPL 的 Wine 標頭。來源 SHA-256 與 URL 另鎖定於 `desktop/tools.lock.json` 的 supplementary source，準備工具時逐位元校驗。本次原始碼分享不附帶本機建置取證檔。

通知包括 FFmpeg LICENSE/COPYING 原文、LAME COPYING/README、MinGW-w64 runtime、winpthreads、GCC runtime exception 原文及保守保留的來源註解通知。來源註解集合含未連入成品的參考內容，不作實際元件清單；完整原始位元仍保留在來源封存。

`npm run desktop:check-package` 比對安裝包中的全部工具雜湊、通知、鎖檔及來源封存內容。上述產物不隨本次原始碼分享交付；CI 不執行此建置流程。

## 修改與重新連結

FFmpeg CLI 與 App 分開執行，LAME 使用獨立 DLL。使用者可從上述來源重建 LAME，保持相容的檔名／ABI 後替換工具目錄中的 DLL，再以 FFmpeg 執行驗證；App 的工具準備與套件檢查是官方建置驗證，不限制使用者修改自己的副本。若改動 ABI，需同時從所附來源重建 FFmpeg。

正式散布時應保留授權與必要通知、提供適用的完整對應來源及建置腳本，並避免加入與其修改／除錯權利衝突的條款。這份程序記錄不取代其他工具的授權要求。
