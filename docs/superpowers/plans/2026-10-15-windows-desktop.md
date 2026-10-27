# Windows Desktop and YouTube Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提供 Windows 安裝程式，使用者可貼 YouTube 網址取得音訊與英文歌詞、選難度並離線練習。

**Architecture:** 以 Electron 包裝 Expo Web 靜態輸出。主程序管理固定版本下載工具、受限 IPC、暫存工作與音檔；現有 React Native Web 介面沿用解析、挖空、計分與進度保存。桌面橋接不存在時，網站與手機保留原有檔案匯入流程。

**Tech Stack:** Expo SDK 57、React Native Web、Electron、electron-builder / NSIS、TypeScript、CommonJS desktop modules、Node test runner、Jest Expo、yt-dlp、FFmpeg/ffprobe、Deno。

**Spec:** `docs/superpowers/specs/2026-10-15-windows-desktop-design.md`（使用者已確認）。

## Global Constraints

- Windows 10/11 x64；單首公開 YouTube 影片；英文字幕；所有處理與保存都在使用者電腦。
- 音訊 50 MB；歌詞 300,000 字元及 1,500 行；單片最長 20 分鐘；工作最長 10 分鐘。50 MB 以既有程式的 `50 * 1024 * 1024` bytes 判定。
- 優先人工英文字幕，否則英文自動字幕；缺字幕時可補 TXT/LRC；缺歌詞不能加入可練習曲庫。
- 第一版不處理播放清單、直播、登入 Cookie、會員或付費內容；不加入 AI 語音辨識。
- 每位使用者安裝；包含固定版本及校驗碼的工具；不要求全域 Python、yt-dlp、FFmpeg 或 PATH 設定。
- 保持 context isolation、renderer sandbox、Node integration 關閉；不提供任意命令、路徑或通用 IPC。
- 一次一個下載工作；可取消、逾時、關閉時結束子程序，啟動時清除孤立暫存檔。
- 桌面固定 origin 與專用 userData；不清除或自動搬移目前瀏覽器曲庫。
- 所有 UI 測試使用獨立 Electron 測試資料目錄；不得再將測試歌曲留在使用者曲庫。
- 更新整個 App 取得工具更新；第一版不加入背景自動更新。
- 原始碼測試、打包、安裝啟動與真實 YouTube 下載分別報告結果。

## Review Focus

1. 安裝／資料路徑含中文與空白：不能因命令列 quoting 或檔名處理失敗（Task 2、4）。
2. 取消或關閉時 ffmpeg 子程序仍在運行：整個工作樹必須停止，不留下暫存檔（Task 4）。
3. 自動字幕滑動重複與歌曲真正重複段落：只消除同時段累積片段，保留不同時間的副歌（Task 3）。
4. 保存音訊成功但曲庫 metadata 失敗：可重試且不產生孤立歌曲／錯配音檔（Task 5）。
5. 第二次啟動與 App 更新：音訊 range 播放與答案草稿仍存在；測試資料不混入正式資料（Task 1、5、7）。

## 工作樹與現況

目前 HEAD 含設計文件，但大量既有應用程式仍未提交。執行前讀取 using-git-worktrees，使用包含目前工作內容的隔離副本；不能直接從 HEAD 建空白工作樹後誤認檔案不存在，也不能 reset／刪除原有修改。保留基線檔案清單；階段提交僅包含本次桌面工作，既有未提交變更如需作為基線提交，須明確區分。

## 檔案責任與共同契約

| 檔案／目錄 | 責任 |
| --- | --- |
| `desktop/main.cjs`, `desktop/preload.cjs`, `desktop/ipc.cjs` | 視窗生命週期、精簡橋接、參數與 sender 驗證 |
| `desktop/protocol.cjs`, `desktop/audio-store.cjs` | 靜態資源／音訊協定、固定根目錄與持久音檔 |
| `desktop/youtube.cjs`, `desktop/subtitles.cjs`, `desktop/jobs.cjs`, `desktop/process-runner.cjs` | 網址／metadata、字幕整理、工作管理與子程序 |
| `desktop/contracts.d.ts`, `src/services/desktop.ts` | 共享公開契約與前端能力檢查 |
| `desktop/tools.lock.json`, `scripts/prepare-desktop-tools.cjs` | 可重現工具準備與授權材料 |
| `src/components/YouTubeImport.tsx`, `src/services/importAssets.ts` | 網址匯入介面與統一音訊來源型別 |
| `electron-builder.yml`, `.github/workflows/windows-desktop.yml` | Windows 安裝包與 GitHub 建置流程 |
| `desktop/tests/*.test.cjs`, `desktop/tests/fixtures/` | 無網路的主程序行為測試，與 Jest 分離 |

`desktop/contracts.d.ts` 定義並供 preload、IPC 與前端共同依據：

```ts
type SubtitleKind = 'manual' | 'automatic' | 'none';
type VideoInfo = { videoId: string; title: string; durationSeconds: number; subtitleKind: SubtitleKind; subtitleLanguage: string | null };
type JobEvent = { jobId: string; stage: 'checking' | 'downloading' | 'converting' | 'subtitles' | 'ready' | 'cancelled' | 'failed'; percent?: number; message?: string };
type DownloadResult = { jobId: string; audioToken: string; audioName: string; audioBytes: number; title: string; lrc: string | null; subtitleKind: SubtitleKind };
type AudioInput = { kind: 'bytes'; name: string; bytes: Uint8Array } | { kind: 'download'; token: string };
interface DesktopBridge {
  inspectYouTube(url: string): Promise<VideoInfo>;
  startYouTube(videoId: string): Promise<{ jobId: string }>;
  waitYouTube(jobId: string): Promise<DownloadResult>;
  cancelYouTube(jobId: string): Promise<void>;
  releaseYouTube(jobId: string): Promise<void>;
  onYouTubeProgress(listener: (event: JobEvent) => void): () => void;
  saveAudio(songId: string, input: AudioInput): Promise<string>;
  resolveAudio(songId: string): Promise<string>;
  removeAudio(songId: string): Promise<void>;
}
```

IPC 回傳可預期的錯誤代碼與繁體中文訊息，不回傳 stack、token 對應路徑或完整子程序命令。`startYouTube` 立即回傳 ID，再等候 `waitYouTube`，因此下載進行時可取消。主程序檢查呼叫者持有該工作；進度事件不把 Electron event 暴露給 renderer。

## Task 1: 可啟動且隔離的桌面外殼

**Files:** Create `desktop/main.cjs`, `desktop/preload.cjs`, `desktop/ipc.cjs`, `desktop/protocol.cjs`, `desktop/contracts.d.ts`, `desktop/tests/protocol.test.cjs`; modify `package.json`, `package-lock.json`, `eslint.config.js`, `.gitignore`.

**Interfaces:** `resolveAppPath(url: string, root: string): string`; `parseByteRange(header: string | null, size: number): { start: number; end: number } | null`; `registerDesktopProtocol({ staticRoot, audioStore }): void`。`app://studio/` 為固定 origin，`app://studio/audio/<songId>` 經 audioStore 查詢。

- [ ] 寫失敗測試：靜態檔 traversal／雙重編碼／未知 host 拒絕；`bytes=0-9` 對 100 bytes 回傳 `{start:0,end:9}`；suffix range 正確；超出範圍回傳 HTTP 416；HEAD 無 body。
- [ ] 執行 `node --test desktop/tests/protocol.test.cjs`，確認失敗源於缺少功能。
- [ ] 查閱 Expo v57 與目前 Electron 官方文件；安裝 Electron／electron-builder 的明確版本。維持 `package.json.main = expo/AppEntry.js`，桌面以 `electron desktop/main.cjs` 啟動，打包時透過 extraMetadata 指定入口。
- [ ] 實作限定根目錄協定、正確 MIME、range 與 CSP。選擇的 CSP 需允許 Expo Web 必需的樣式及本機 blob 音訊，不允許任意遠端 script。以 `BrowserWindow` 啟用隔離、sandbox，禁止未知導覽與新視窗。
- [ ] `desktop:start` 先輸出 Expo Web 再啟動桌面。開發測試透過 `LISTENING_LAB_TEST_DATA_DIR` 明確指定獨立絕對路徑；正式版不接受 URL 指定此路徑。
- [ ] 執行測試、`npm run desktop:start`，確認無 Metro 伺服器時可顯示內建曲庫。提交此任務涉及檔案，訊息 `feat: add isolated Electron desktop shell`。

## Task 2: 可驗證的工具準備

**Files:** Create `desktop/tools.lock.json`, `desktop/tools.cjs`, `scripts/prepare-desktop-tools.cjs`, `desktop/tests/tools.test.cjs`; modify `package.json`, `THIRD_PARTY_NOTICES.md`, `.gitignore`.

**Interfaces:** `prepareTools({ manifestPath, outputDir }): Promise<void>`；`resolveTools(resourcesDir: string): { ytDlp: string; ffmpeg: string; ffprobe: string; deno: string }`。lock 每筆含固定 version、HTTPS asset URL、SHA-256、archive layout、license/source-material URL。

- [ ] 寫失敗測試：錯誤 checksum 不留下可執行檔；ZIP traversal 拒絕；路徑含中文／空白可解析；漏任一工具會回報缺少的名稱；重跑相同版本可重用驗證過的檔案。
- [ ] 執行 `node --test desktop/tests/tools.test.cjs` 確認失敗。
- [ ] 從各工具官方 release 選定 Windows x64 版本，記錄真實雜湊，禁止填假值或用 latest URL。準備獨立 Deno，驗證所選 yt-dlp executable 的 EJS 支援。下載解壓縮只發生在專案的 `desktop/vendor/`，先驗證再原子替換。
- [ ] 收集所選版本的 license、copyright、對應原始碼及建置來源材料；對需提供 source 的發行檔準備可隨 release 分發的 source bundle，不能以通用首頁取代對應版本。工具檔與暫存檔不加入 Git。
- [ ] 新增 `desktop:tools` 命令；執行測試與四個工具的版本命令，清空測試 PATH 後確認使用絕對路徑啟動。提交 `build: prepare verified desktop media tools`。

## Task 3: YouTube 網址、影片與字幕正規化

**Files:** Create `desktop/youtube.cjs`, `desktop/subtitles.cjs`, `desktop/tests/youtube.test.cjs`, `desktop/tests/subtitles.test.cjs`, `desktop/tests/fixtures/captions.json`.

**Interfaces:** `normalizeYouTubeUrl(input: string): { videoId: string; url: string }`; `parseVideoInfo(metadata: unknown): VideoInfo`; `selectEnglishSubtitle(metadata: unknown): { kind: SubtitleKind; language: string | null }`; `normalizeCaptions(json3: unknown): string` 回傳 LRC。

- [ ] 寫失敗測試：接受 youtube.com/watch、youtu.be 與 shorts 的單一 11 字元 ID；拒絕假 host、credentials、非 HTTPS、playlist-only、無效 ID；帶 list 的單片 URL 正規化為只含 v。1200 秒接受、1201 秒拒絕；直播、付費／需登入狀態拒絕。
- [ ] 字幕測試：人工英文優先於自動英文，語系 en／en-US 可選；缺英文回傳 none；移除字幕標記；依毫秒排序；重疊累積 `Hello`→`Hello world` 不重複輸出；不同時間完整重複副歌保留；空內容或沒有英文的字幕回傳可辨識錯誤；超過 300,000 字元／1,500 行拒絕。
- [ ] 執行 `node --test desktop/tests/youtube.test.cjs desktop/tests/subtitles.test.cjs` 確認失敗。
- [ ] 實作上述純函式。字幕使用 yt-dlp 的 JSON3 輸出保留時間資訊，正規化後產生標準 LRC；只合併時間重疊且 token 為前綴延伸的 rolling segment，不能全曲以字串去重。
- [ ] 執行測試，將輸出 LRC fixture 交給現有 `parseLyrics` 驗證相容性；提交 `feat: normalize YouTube metadata and lyrics`。

## Task 4: 可取消與可回復的下載工作

**Files:** Create `desktop/jobs.cjs`, `desktop/process-runner.cjs`, `desktop/tests/jobs.test.cjs`, `desktop/tests/fixtures/fake-tool.cjs`; modify `desktop/ipc.cjs`, `desktop/main.cjs`, `desktop/preload.cjs`.

**Interfaces:** `createJobManager({ tools, tempRoot, runner }): { inspect(url, ownerId), start(videoId, ownerId), wait(jobId, ownerId), cancel(jobId, ownerId), release(jobId, ownerId), shutdown() }`；`runProcess(executable, args, { cwd, timeoutMs, signal, onLine }): Promise<{ stdout: string }>`。公開方法對應共同契約。

- [ ] 寫失敗測試：僅一個 active job；owner 不相符拒絕；假下載器成功、失敗、卡住與輸出超限；檢查失敗後可重試；600,000ms 逾時；取消與 shutdown 結束含孫程序的工作樹；stderr 截斷後仍能回報錯誤；中文空白路徑能執行。
- [ ] 使用本機 fake-tool 子程序測試真實 spawn、signal 與檔案生命週期，不靠 YouTube 網路當單元測試。執行 `node --test desktop/tests/jobs.test.cjs` 確認失敗。
- [ ] 下載參數固定使用 `shell:false`、`windowsHide:true`、`--ignore-config`、`--no-plugin-dirs`、`--no-playlist`、`--no-remote-components`、固定輸出 basename、工具絕對路徑、explicit Deno runtime。主程序從 videoId 重建 URL；不接受 renderer 命令旗標或字幕下載 URL。
- [ ] inspect 取得 metadata 並依 Task 3 驗證；start 在主程序再次檢查 metadata。若有選定字幕，取得該英文軌的 JSON3；音訊轉 MP3。沒有字幕照樣產生音訊，DownloadResult.lrc 為 null。
- [ ] 每工作建立隨機 ID 與受控暫存目錄，檢查輸出非 symlink、非目錄、固定名稱與實際大小。超過 50 MiB／逾時立即停止；暫存音訊 token 不接受任意路徑。下載完而未保存的工作保留到 release 或關閉；關閉／啟動清理 orphan。
- [ ] IPC 對 sender frame、origin、payload size、ID、工作 owner 驗證；preload 僅暴露共同契約方法。執行桌面測試，提交 `feat: add cancellable local YouTube jobs`。

## Task 5: 桌面曲庫保存與現有匯入相容

**Files:** Create `desktop/audio-store.cjs`, `desktop/tests/audio-store.test.cjs`, `src/services/desktop.ts`, `src/services/importAssets.ts`; modify `src/services/localFiles.web.ts`, `src/services/localFiles.ts`, `src/services/importedSongs.ts`, `src/services/importedSongs.test.ts`。

**Interfaces:** `ImportedAudioAsset = DocumentPickerAsset | { kind: 'desktop-download'; token: string; jobId: string; name: string; size: number; uri: string }`；`getDesktopBridge(): DesktopBridge | null`。`saveImportedSong(song: Song, asset: ImportedAudioAsset): Promise<Song>`。`createAudioStore(root)` 提供 `save(songId,input)`, `resolve(songId)`, `remove(songId)`，對外一律回傳限定協定 URL。

- [ ] 寫失敗測試：桌面 byte 音檔與 download token 皆可保存；不合法 songId／越界路徑／foreign token 拒絕；零 bytes／超過 50 MiB 拒絕；重新建立 store 後仍能 resolve；刪除只影響指定 ID。
- [ ] 擴充 importedSongs 測試：metadata 寫入失敗須移除新音檔但保留可重試的 download source；重試成功；單首 missing audio 不影響其他曲庫；沒有 bridge 時沿用 IndexedDB。
- [ ] 執行 `node --test desktop/tests/audio-store.test.cjs` 與 `npm test -- --watch=false src/services/importedSongs.test.ts` 確認失敗。
- [ ] 桌面本機檔案透過 File.arrayBuffer 轉 bounded bytes 交給橋接；下載音檔透過 token 複製到持久目錄，不提前銷毀暫存 source。原子 rename 完成持久音檔後沿用現有 metadata 保存及回復流程。成功保存後由 UI release job。
- [ ] 原生 mobile localFiles 拒絕 desktop-download 類型；瀏覽器分支不變。TS 不依賴 renderer 的 Node globals；確保 native bundle 不包含 Electron import。
- [ ] 執行完整 `npm test -- --watch=false`、`npm run typecheck`、桌面測試；提交 `feat: persist desktop imported audio safely`。

## Task 6: 網址匯入與難度預覽介面

**Files:** Create `src/components/YouTubeImport.tsx`, `src/utils/youtubeImportState.ts`, `src/utils/youtubeImportState.test.ts`; modify `src/screens/SetupScreen.tsx`, `src/services/desktop.ts`。

**Interfaces:** `YouTubeImport({ onPrepared: (result: DownloadResult) => void, disabled: boolean })`。狀態 reducer `reduceYouTubeImport(state, event)` 管理 idle/checking/checked/downloading/ready/error；事件皆帶 requestId，忽略過期請求。

- [ ] 寫失敗測試：更換 URL 後舊檢查回傳不能覆蓋；取消後晚到 ready 不可加入曲庫；缺字幕可補檔；檢查中／下載中禁止重複提交；切換來源時不得混用舊音檔與新歌詞。
- [ ] 執行 `npm test -- --watch=false src/utils/youtubeImportState.test.ts` 確認失敗。
- [ ] 僅當 bridge 存在才顯示「YouTube 網址」入口。顯示影片名稱、時間、人工／自動字幕；未知百分比顯示階段，不虛構進度。選定字幕標示「自動字幕，建議校對」。
- [ ] 結果透過 `parseLyrics(result.lrc, 'youtube.lrc')` 及 ImportedAudioAsset 接入現有 candidate / prepareExercise。沒有字幕顯示「未找到英文字幕，請選擇 TXT 或 LRC 歌詞」，保留音訊且不能儲存。沿用歌名、難度與題數預覽。
- [ ] 取消、切換來源、返回及卸載解除事件訂閱並 release 當前 job；保存成功後 release 不應刪除持久音檔。失敗可重試、錯誤訊息就近顯示；鍵盤能操作全部按鈕。
- [ ] 在獨立測試資料目錄驗證有字幕／缺字幕兩條流程及重啟；網站模式仍只有原本匯入。執行 Jest、typecheck、lint；提交 `feat: add desktop YouTube import flow`。

## Task 7: Windows 安裝包、GitHub 工作流程與驗收

**Files:** Create `electron-builder.yml`, `.github/workflows/windows-desktop.yml`, `scripts/check-desktop-package.cjs`, `docs/windows-desktop.md`, `docs/testing/windows-desktop-verification.md`; modify `package.json`, `README.md`, `THIRD_PARTY_NOTICES.md`, `.gitignore`。

**Interfaces:** `desktop:tools` 準備工具；`test:desktop` 執行 `node --test desktop/tests/*.test.cjs`；`desktop:build` 執行 Expo Web export 及 `electron-builder --win nsis --x64 --publish never`；`desktop:check-package` 檢查 unpacked 產物及 licenses。

- [ ] 加入包內容驗證：入口、Expo 靜態頁面、四個工具、license/source 資料與 app version 均存在；缺一失敗；原始碼、測試資料、暫存檔、.git、npm cache 不納入 runtime package。
- [ ] 設定穩定 appId `org.englishlisteninglab.desktop`、productName `English Listening Lab`；輸出 `release/`；NSIS per-user，不要求管理員權限；不啟用 updater 或假裝簽章。
- [ ] Windows Actions 先 `npm ci`、測試、lint/typecheck、準備與驗證固定工具，再打包。一般 PR 不授予 release write 權限；手動或版本標籤流程才可建立 draft release。使用 GitHub context 取得 repository，避免虛構 remote。
- [ ] 產生 installer SHA-256、第三方 source bundle 與安裝文件；工具來源包、安裝包、校驗檔均作為 artifact。實際公開 release／push 等待使用者確認 repository，這不阻擋本機打包驗證。
- [ ] 執行所有自動檢查及三平台 Expo export。使用獨立臨時 Windows 安裝位置和 Electron userData，驗證全域工具不可用時仍能啟動、離線播放、保存重啟、更新後資料保留與解除安裝行為。不能執行的項目記為未驗證。
- [ ] 使用有權下載的真實單首影片檢查端到端；無可用 fixture 或網路限制時記錄具體限制，不以 fake-tool 通過宣稱真實下載通過。UI 測試後核對正式 userData 未增加歌曲，清理測試資料。
- [ ] README 說明一般使用者安裝與開發者建置兩條路徑、未簽章提示、儲存位置、缺字幕與下載工具更新方式。寫入驗收紀錄，提交 `build: package Windows desktop app and release workflow`。

## 整體完成檢查

- [ ] 使用 requesting-code-review 進行一次獨立唯讀審查，提供本 spec／plan、實際 diff 與測試結果；修正重要問題。
- [ ] 使用 verification-before-completion 重新執行受影響檢查，核對本 spec 每一項驗收條件。
- [ ] 交付可用安裝檔及簡短操作步驟，清楚區分本機完成與尚未公開的 GitHub release。不要把 build success 說成已安裝或已發布。

## 計畫自我審查

- Spec 的使用流程、主程序隔離、下載限制、持久保存、固定工具、授權材料與 GitHub 發布均對應 Task 1–7。
- Review Focus 五項已分配到具體失敗測試或獨立安裝驗證。
- 型別由共同契約集中定義；前端只依 bridge；音訊來源統一為 ImportedAudioAsset。
- 真實下載與安裝驗證需實際執行，不能用單元測試代替；工作樹原有變更與使用者曲庫均須保留。

## 執行方式待確認

建議由本對話直接逐項實作，最後安排一次獨立審查：桌面橋接、工作生命週期與曲庫整合相互依賴，單一實作者較容易保持契約一致。另一選項是每項交給子代理實作並逐項獨立審查，檢查較密集、耗用較多。使用者確認計畫與執行方式後開始寫產品程式碼。
