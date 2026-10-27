# 發行工作進度 — 2026-10-19

## 優先順序

1. 發行材料整理：進行中。MIT 與原創署名「brocoli1024」已確認；yt-dlp、Deno/V8、FFmpeg 等來源或 notice 閉包仍未齊。
2. LRC 相容性：已完成修正與安裝版驗收，詳見 ../testing/lrc-compatibility-2026-10-16.md。
3. 曲庫管理：刪除匯入歌曲及其音檔、草稿與成績的功能已完成；內建曲保留。備份／還原 smoke 證據已記錄，但仍需乾淨環境驗收。
4. GitHub 發布：目標為 `brocoli1024/English-Listening-Lab`；目前沒有 remote、公開 Release 或已整理的乾淨提交。公開附件須等來源材料決策完成。
5. 環境驗收：先前候選包的本機重啟驗收已通過；目前 Electron 44.7.2 在這台主機連原始執行檔都於啟動階段崩潰，故新版包尚未取得有效 runtime 驗收。乾淨 Windows 電腦、跨版本升級與實際字幕影片仍待驗。

## 工具材料盤點

| 元件 | 已有材料 | 未完成項目 |
|---|---|---|
| yt-dlp 2026.08.19 Windows exe | 固定版本二進位與 SHA-256、專案來源與 Unlicense | 執行檔所含 GPLv3+ 相依來源、Python/打包依賴授權；專案 Unlicense 不能代表整個 exe |
| Deno 2.9.7 | 固定二進位、來源與 MIT LICENSE | 打包相依的完整授權聲明核對 |
| FFmpeg/ffprobe n8.1.3-9-g29e619e767 | 固定二進位、FFmpeg 來源、同標籤建置腳本、LGPLv3 授權文字 | 實際啟用相依的精確來源、建置/對應材料與授權；已保存二進位輸出的 build configuration |
| Electron 44.7.2 | 安裝目錄 LICENSE 與 LICENSES.chromium.html | 發行附件清單再次核對 |
| 內建錄音 | THIRD_PARTY_NOTICES.md 來源與演唱者聲明 | 發布前核對資產與聲明一一對應 |

FFmpeg 使用獨立程序，App 不直接連結其函式庫；需核對的是所散布之工具本身與其靜態相依，不應不加區分地要求 App 原始碼重新連結。

## 可驗證的結案條件

- 私人歌詞不出現在 Git 追蹤清單或產品封裝內。
- 原創程式碼授權與署名獲確認；保留 Expo 上游聲明。
- 每個打包元件與相依項目都有版本、授權、來源附件或可核對的取得方式；無「待補」卻標記完成。
- 公開發行檢查在材料未齊時仍保持關閉；不解除目前 workflow 的公開 artifact 限制。

上游參考：https://github.com/yt-dlp/yt-dlp#license 、https://github.com/BtbN/FFmpeg-Builds 、https://ffmpeg.org/legal.html 。精確版本證據以 desktop/tools.lock.json 與本機已驗證來源包為準。

2026-10-16 更新：已取得固定版本 yt-dlp 官方 THIRD_PARTY_LICENSES.txt（SHA-256 472aefe951c7db35e1657c1d13fd337140511ed6f2b329205105ad441c5a02b7），保存於 licenses/ 並加入後續安裝包資源設定。尚未重建安裝包；先前安裝檔不含這項新增附件。此步只補授權文字，不代表相依來源齊備。

## 2026-10-16 實際補件結果

- 從實際 yt-dlp.exe verbose 診斷取得 Python 3.10.11、OpenSSL 1.1.1t、SQLite 3.40.1 及 9 個 Python 套件版本。診斷使用無效網址，沒有下載媒體。
- 9 個套件的 PyPI sdist 已按官方 metadata SHA-256 校驗；網址、版本、雜湊與授權附件列於 yt-dlp-dependency-sources.json。可重跑 `node scripts/collect-ytdlp-sources.cjs`，需網路與 tar。
- 原始來源包內的頂層 LICENSE/COPYING/NOTICE 已保存於 licenses/。Deno 主授權及來源中的 Node/Undici 型別授權也已抽出；這不是完整 Deno 相依授權集合。
- 本機附件：release/yt-dlp-dependency-sources-PARTIAL.tar.gz，含 9 個來源壓縮檔及獨立 SHA-256 檔，刻意標記 PARTIAL。舊 third-party-sources.tar.gz 未被當成完整發行來源包。
- deno-cargo-inventory.json 收錄同版本 Cargo.lock 的 1128 筆條目；包含開發／建置／平台限定元件，不代表全部進入 Windows 執行檔。下一步必須縮小至實際目標相依，再補授權與來源對應。

### 尚未結案的具體項目

1. yt-dlp：Python 與原生 runtime/相依的完整材料，curl_cffi 內嵌原生函式庫與其他間接相依的版本對應。9 個頂層 sdist 不等於完整對應來源。
2. Deno：Windows release 所含 Rust/V8/原生相依授權集合與對應證據；不能只附 MIT 主授權。
3. FFmpeg：精確建置來源腳本存在，但官方 download.sh 使用 Docker。此機沒有 Docker，也沒有可用 WSL 發行環境；未安裝新的虛擬化工具。所有啟用相依的來源與建置材料尚未完成。
4. 尚未把新附件重建進安裝包；公開 workflow 限制保持不變。

2026-10-16 原生／間接相依核對完成第一輪：直接讀取執行檔 CArchive/PYZ，確認額外 Python 相依與 libcurl 原生相依，詳見 yt-dlp-native-audit.md。原 9 包仍為部分材料；新發現未被誤標為來源已齊。未改動安裝包或公開發行限制。

2026-10-16：curl-impersonate v2.0.0 官方 Windows x64 DLL 與內附 DLL 逐位元一致；官方壓縮檔 hash 也符合 GitHub digest。已固定 source commit ec41b71ce888806bfec56ada7a7258d333eb3d19、下載來源及保留授權。此項二進位對應結案；外部相依來源收集及重建驗證仍未完成。證據：curl-impersonate-binary-match.json。

2026-10-16：curl 原生材料批次完成：8 份來源全部符合固定 CMake SHA-256，主授權＋13 份額外來源聲明、5 份 patches 與 Windows 建置設定已保存。整合附件 release/curl-native-source-materials-v2.0.0.tar.gz 及 .sha256 已產生。詳見 curl-native-materials.md。這是此批來源收集結案，不是整個 yt-dlp／App 的發行許可或可重現建置證明。

2026-10-16：Python runtime／間接相依批次已補件：主來源＋4 個已確認版本的間接相依＋6 個 CPython 建置相依，共 11 份來源及授權。24 個共有 runtime DLL/PYD 與官方可攜版一致。附件與驗證界線見 python-runtime-materials.md；PyInstaller 精確來源對應仍未結案，未解除整體公開發行限制。

2026-10-16：PyInstaller 6.22.0 精確來源核對完成：官方鎖定自建 wheel 的 SHA-256 相符，8 個內附 loader/hooks 與固定來源相符，bootloader 程式碼及其餘非資源區段一致。已保存 GPL-2.0-or-later＋Bootloader Exception、Apache-2.0 完整文字與建置配方授權。詳見 pyinstaller-materials.md；整體發行材料與可重現建置仍未全部結案，未重建安裝包。

## 2026-10-16 持續發行準備

使用者要求持續處理至可正式上線，已提供目的地 brocoli1024 / English Listening Lab；預定 repo slug 為 English-Listening-Lab。GitHub connector 可讀取該帳號儲存庫，本次清單尚未包含此名稱；尚未建立或推送。

- Deno Cargo.lock 的 1,046 個 registry 來源包全數通過鎖定 SHA-256，保存於 desktop/.downloads/compliance/deno-crates。這是含測試、建置與其他平台的候選全集，不是 Windows shipped SBOM。沒有 Git registry 來源。
- 119 個包未內附完整授權檔；按 .cargo_vcs_info.json 固定提交補取 62 個，57 個尚未解決（包含缺 repo、缺 commit、404）。詳見 deno-license-gaps.json、deno-upstream-licenses.json。SWC 固定 commit 00ec64fe9a4da0973f14721d7b6dc1f13cd75413 的官方 tree API 也回傳 404，不能用 main 冒充同版來源。
- rusty_v8 150.4.0 crate 校驗碼相符，記錄 commit 5c15a6995c9bb4bacd3e341b59fff32c909c80bf 且 dirty=true；不得宣稱提交與 crate 全部逐位元一致。其 V8 子模組是 denoland/v8 ac1e23989121713ca642f6650b34deff7b686896，兩份來源已保存、授權已抽出；20 個子模組取得 15 組根授權，其餘仍需上層／嵌套聲明核對。見 deno-v8/。
- FFmpeg 已抽出 125 組固定建置來源參照與原始腳本，見 ffmpeg-source-references.json、ffmpeg-build/。未宣稱已解析 Windows 條件或收齊來源。
- 新鮮驗證：41 Jest、17 desktop、typecheck、lint 全部通過。桌面測試沙箱初跑 EPERM；一般環境重跑通過，未修改產品規避測試。尚未重建安裝包。

刪歌方案已提出並以 async 問題等待設計確認：僅匯入歌曲，確認後清理音檔、草稿、該曲成績，內建歌曲保留。其他工作不依賴此回答。完整正式上線仍需第三方缺口結案、資料管理、乾淨建置／安裝升級與備份還原驗收、發布附件及 repo。

## 2026-10-17 本輪進度

- 使用者已明確同意刪歌設計。功能與確認 UI 已實作，開發版 Electron 獨立曲庫驗收通過；詳見 ../testing/song-deletion-2026-10-17.md。尚未重建安裝包。
- FFmpeg 57 組直接啟用來源取得 52 組；另外 4 組已使用官方 Git 固定提交取得並封存，見 ffmpeg-git-sources.json。LAME r6835 HTTP 固定修訂匯出正在進行（scripts/collect-lame-svn.py，process session 91648）。第一次執行時程式尚未修正隱藏檔過濾；完成後須再跑一次新版以補足隱藏檔，快取可重用。原腳本間接相依、patches、submodules仍需核對。
- 已按官方 SHA-256 取得可攜 Cargo/rustc 1.95.0（不改系統安裝）。1046 registry sources 已抽取供 metadata-only 使用，.cargo-checksum.json files 為空但 package checksum保留；不得把這套目錄當作已逐檔驗證的可重建 vendor。Windows cargo metadata --locked --offline 正在執行（session 79297），輸出 desktop/.downloads/compliance/deno-windows-metadata.json；先檢查程序狀態再接續。
- npm audit --omit=dev 保存於 desktop/.downloads/compliance/npm-production-audit.json：41 個包含繼承影響的項目，其中 1 critical / 28 high。尚未完成實際打包可達性分析，不能當成 41 個 App runtime 漏洞，也不能忽略；建置工具鏈與實際 renderer/主程序須分開確認。未執行自動 downgrade/fix。

後續核實：session 79297 已成功完成。Windows 非 dev 邊可達圖為 905 個候選（846 個 registry），未解決授權落在圖中的有 48 個。此圖仍包含 build dependencies 及 workspace feature unification，不能當成精確 linkage 清單。見 deno-windows-dependency-graph.json。LAME session 91648 已因網路逾時停止，已用修正後腳本與快取續跑 session 50064；需先查該 handle，不能假定完成。

## 2026-10-17 來源與備份補充

- LAME session 40939 handle 已不存在，但 lame-svn-source.json 顯示 435 檔、0 失敗、completeFileExport=true。已重新讀取全部成功檔案計算 SHA-256 一致，並封存 lame-r6835.tar.gz 與授權。
- ffmpeg-direct-source-index.json 整合 57 個直接來源壓縮檔，已逐一重新校驗。completeCorrespondingSource 仍為 false：間接相依、子模組、產生檔與建置材料尚未完全核對。
- scripts/backup-restore-smoke.cjs 首次驗收通過：閉合 profile 60 個檔案複製前後逐位元一致，還原後可讀音檔與 localStorage 標記，原 profile 保持不變。結果 desktop/.test-data/backup-restore-i2xxvh/result.json。這次尚未驗證真實曲庫／草稿／成績內容。
- 已擴充 packaged-desktop-smoke.cjs 與備份測試，加入完整曲庫、難度草稿與成績 fixture；但新版測試尚未執行。自動核准服務因使用額度限制無法完成 require_escalated 審查，明確拒絕執行 node scripts/backup-restore-smoke.cjs；不是安全判定，不得改走其他入口繞過。需審查服務恢復或使用者指示後再驗證。
- 待處理 npm audit 的 41 項內，10 個套件包含直接 advisory，其餘為相依傳播。尚未核對所有打包可達性，不作漏洞數量或已修復宣稱。

## 2026-10-17 核准恢復後

- 同一 require_escalated 流程恢復可用，完整備份測試已執行成功，包含曲庫、草稿、成績與音檔；證據 backup-restore-XD17Ho/result.json。
- 相容範圍內更新 15 個 lockfile 節點：brace-expansion 1.1.21/5.0.12、compression 1.8.2、js-yaml 3.15.2/4.3.2、shell-quote 1.12.0、source-map-js 1.2.2。Expo／React Native 版本未降級。原 lockfile 留在 desktop/.downloads/compliance/package-lock-before-audit-update.json。
- 更新後 45 Jest、18 desktop、typecheck、lint 全部通過。npm production audit 的 direct advisory packages 由 10 降為 5，critical=0；整體 39 項（含傳播）仍待可達性判讀，剩餘 direct 為 braces、decode-uri-component、node-forge、sprintf-js、uuid。
- 第一次候選包建置與 npm 更新重疊，缺 brace-expansion 而失敗，不視為有效新安裝包。更新及測試全部完成後已開始獨立重建（後續先確認 build session）。
- 新增 check-desktop-package 驗證來源 LICENSE、THIRD_PARTY_NOTICES、整個 licenses 目錄與包內逐位元一致；尚待新包通過。FFmpeg 有 15 份直接來源含 .gitmodules/Cargo.lock/DEPS，已保存 ffmpeg-nested-source-inventory.json，仍非相依閉包。

## 2026-10-17 新候選包驗證

- 獨立重建已成功（exit 0），desktop:check-package 通過所有工具雜湊、必要檔案及授權資源逐位元比對。
- 新打包執行檔的 seed / restart 隔離測試均 exit 0，音檔、曲庫、難度草稿與成績跨程序保留。
- 安裝檔 SHA-256 為 38842a866bb1704a28d8cbc5a195ca771ded0abaa55e5a40d2ec29af58b18d8e，Authenticode 為 NotSigned。詳見 ../testing/packaged-candidate-2026-10-17.md。
- 尚未完成乾淨機器安裝／升級，第三方材料閉包及剩餘公告可達性仍待核對；不作正式上線完成宣稱。

## 2026-10-17 FFmpeg 間接來源核對

- shaderc DEPS 的七個固定提交已取得官方來源及內附授權，見 ffmpeg-shaderc-sources.json；包含測試相依，仍非最終 linkage 清單。
- libjxl 建置只明確初始化 Highway 子模組，其他功能停用或使用系統庫；下一步取得精確 gitlink。
- rav1e 建置會執行 cargo update cc，原始 Cargo.lock 不能證明發行二進位實際使用的 cc 版本。此缺口需有效建置鎖定檔或等價上游證據，不能以今日最新版代替。
- 詳見 ffmpeg-nested-review.md。新授權檔晚於候選安裝包，材料完成後需重建並重新驗證資源一致性。

## 2026-10-17 Highway 與 librsvg

- 已保存 libjxl 官方完整 Git tree，確認 Highway gitlink 為 457c891775a7397bdb0376bb1031e6e027af1c48；官方來源及三份授權聲明重算雜湊一致。
- librsvg 鎖定檔中的 357 份 registry sources 全數通過鎖定 SHA-256，授權缺口另列 ffmpeg-librsvg-license-gaps.json；不是實際 shipped SBOM，也未證明有效 vendor tree 與二進位對應。
- 確認另外需處理 Vulkan-Headers v1.4.363、libudfread 與其他 SCRIPT_REPO2 來源。57 份直接來源索引不能視為完整閉包。

## 2026-10-17 額外來源補齊

- Vulkan-Headers、libudfread、gnulib 三份腳本指定來源與九份授權檔已取得並重新校驗；見 ffmpeg-extra-sources.json。Vulkan 標籤指向的提交證據另保存於 vulkan-headers-tag-evidence.json。
- librsvg 的十三項缺少內附授權之候選相依，三項已按記錄提交補取，十項仍未解決；見 ffmpeg-librsvg-upstream-licenses.json。尚需目標平台／建置相依圖判定，不直接把候選全集當作 shipped SBOM。
- 待續：其他 SCRIPT_REPO2、libplacebo/zimg 子模組及有效建置鎖定檔。未重建安裝包，未宣稱完整發行材料。

## 2026-10-18 中斷後驗證

- 中斷前下載已完成，無需重跑。額外來源清單的十四份壓縮檔與二十四份獨立授權檔重新校驗通過。
- 已保存 zimg、libplacebo 官方固定父提交的子模組樹，取得兩份及六份子模組來源；包含停用的範例／測試候選，不等同實際 linkage。
- SDK 13 nv-codec-headers 的授權位於各標頭開頭，已另抽取原文聲明並記錄來源成員及雜湊。原始檔仍保存在來源壓縮檔。
- 發行仍未完成：有效建置對應、其餘第三方授權缺口、乾淨環境驗收與 GitHub 發布仍需完成。

## 2026-10-18 非標準授權檔補查

- r-efi 5.3.0/6.0.0 的完整 MIT 文字與著作權人在 AUTHORS，已從校驗過的原始包直接保存，見 r-efi-license-supplement.json。
- selectors 0.40.0 原始 lib.rs 明確引用 MPL 2.0，已保存標頭及 Mozilla 官方全文，見 selectors-license-supplement.json。
- 三個套件的補充檔案重新校驗通過。librsvg 原始十三項候選缺口中，三項前已補取、三項本輪補證，七項仍待證據；不等同整體發行合規完成。

## 2026-10-18 Windows 相依解析

- 已保存七個待補候選的直接傳入相依條件，見 librsvg-remaining-license-edges.json。objc-foundation 的已見入口限制 macOS；winapi GNU 套件則具有各自的 target 條件，尚不能僅靠名稱排除。
- 原始 FFmpeg 建置來源 images/base-win64/Dockerfile 明確指定 x86_64-pc-windows-gnu；證據 ffmpeg-rust-target-evidence.json。
- 357 份校驗過的 registry archives 已展開至 librsvg-cargo-vendor，供 metadata-only 使用；checksum files 映射為空，不能當作已逐檔校驗的可重建 vendor 發行。
- 離線 cargo metadata 已啟動，target 為 x86_64-pc-windows-gnu 並啟用 librsvg-c/avif（程序 session 55470）。最後觀察仍在執行，接續先查相同 handle；未宣稱解析成功。輸出 desktop/.downloads/compliance/librsvg-windows-metadata.json，完成後須從 librsvg-c 根節點排除 dev 邊計算可達集合。

後續核實：session 55470 已 exit 0。從 librsvg-c 根節點沿 normal/build 邊得到 203 個候選；七項未補證套件中只有 winapi-x86_64-pc-windows-gnu 可達，其餘六項不在此圖。見 librsvg-windows-dependency-graph.json。此圖可能有 workspace feature unification 過度包含，且不是既有二進位 linkage 證明；不得據此宣稱全工具授權完成。

## 2026-10-18 winapi GNU 精確來源

- 首次比對 winapi-rs 0.3.9 標籤不符，保留失敗證據 winapi-gnu-source-comparison.json，不能使用該標籤宣稱來源對應。
- 官方版本檔歷史定位發布 0.4.0 的提交 9497609ef44cc9bcd16cd2411c0ee6ccaf5483aa。已取得來源，crate 除 Cargo 產生的正規化 manifest 外，全部 1419 個檔案逐位元一致，0 差異、0 缺少；其中包含預編譯匯入程式庫。
- 此提交也包含 1404 份定義檔及根 MIT/Apache 授權，已保存並校驗。證據 winapi-gnu-exact-source-comparison.json。這建立發布包與原始倉庫提交的對應，並非重建結果或 FFmpeg 實際 linkage 證明。

## 2026-10-18 Deno 授權補查

- 從校驗過的原始 crate 找到 plist 的 LICENCE、r-efi 的 AUTHORS、win_uds 的 UNLICENSE，已保存 deno-embedded-license-supplements.json；原檔名篩選曾漏收，不能將缺少 LICENSE 檔直接視為未提供授權。
- 從同系列套件的 repository/homepage 交叉定位 cranelift 兩項與 dlopen2_derive，取得各自 crate 記錄提交上的授權；見 deno-inferred-repo-license-evidence.json。
- cranelift assembler 與 meta 的十三及十七個來源檔逐位元吻合固定提交，無差異或缺少。dlopen2_derive 的六檔原始位元不同，另核對換行差異，結果見 deno-inferred-repo-source-comparison.json。不得把換行正規化相符稱為逐位元一致。
- zune-core 同提交的猜測根 LICENSE-MIT 路徑為 404，仍待查證；SWC 等缺口尚未結案。

## 2026-10-18 官方樹補查

- zune 固定提交的完整官方樹顯示 LICENSE.md / LICENSE-ZLIB，已取得兩份原文並校驗，見 zune-license-supplement.json；先前 LICENSE-MIT 只是錯誤路徑。
- SWC 832d537695a07e539660096883fab52bb7f10ecf 官方 Git tree API 回傳 422；之前另有提交 404，不以最新版冒充。derive-io 與 sys_traits 指定提交的樹可讀且未截斷，但未發現授權檔名。見 additional-license-tree-results.json。
- SWC crate 本身有 Apache-2.0 metadata 與若干 Rust Project 原始碼著作權標頭；仍須保留相應通知，不能因 Cargo 宣告就忽略內嵌聲明。正式發行材料仍未結案。

## 2026-10-18 SWC 原始通知保存

- 重新核對 28 個 SWC 系列 crate 的官方鎖定校驗碼，抽出 11 份包含著作權／授權聲明的 Rust 檔案開頭註解，原文保存於 licenses/deno-swc-headers，對照 swc-embedded-notices.json。
- 補入 Apache 官方 2.0 全文並記錄 URL 與 SHA-256（swc-canonical-license.json）；不將此宣稱為從無法取得的 SWC 提交下載的原檔。11 份通知及全文重新校驗通過。
- 這是原始通知保存及標準授權全文補充，並非完整內嵌第三方程式碼審查，也未消除指定上游提交不可取得的來源對應缺口。

## 2026-10-18 SWC 來源判準更正

- 直接讀取固定 Deno source archive 的 Cargo.lock，確認上述 28 個 SWC 套件全部使用 crates.io registry，而非 Git source；逐份重新計算已下載 crate 的 SHA-256，全部吻合鎖定值，見 swc-lockfile-source-verification.json。
- 因此「Git 提交無法取得」不能再被列為這 28 份 registry 來源包缺失。先前將其概括稱為來源對應缺口過於寬泛；Git 記錄僅作額外來源歷史證據。
- 真正尚未完成的是通知涵蓋範圍與最終二進位建置對應，不能用 registry 校驗替代這兩項驗證。後續不重試已知失敗的同一 Git API 路徑。

## 2026-10-18 發行門檻重整

- SWC 全文字通知候選掃描找到十二檔：十一份已保存原始標頭，另有 fixer.rs 的 issue_286 測試資料（位於 cfg(test) 模組），已保存 swc-test-notice.json；未將測試文字誤稱執行期程式碼。
- 已直接檢查目前 remote、workflow、使用說明與聲明，整理 ../testing/release-gates-2026-10-18.md。尚無 remote、公開 Release 或乾淨 checkout/電腦驗收證據；十月十七日安裝檔也未包含之後新增通知。
- 接續應同時推進剩餘 runtime advisory 與發布資訊，不能只重複擴大來源候選清單。所有正式發行門檻仍維持原範圍。

## 2026-10-19 發行材料整合

- 新增 collected-source-index.json 整合各證據所指的封存檔。最新重算為 1,523 份、1,397,472,809 bytes、0 遺失／雜湊不符。這是本機索引核對，混合官方鎖定校驗與本機來源雜湊，不是批准的 GitHub 附件集合。
- 新增 ../testing/release-gates-2026-10-19.md，明確列出 FFmpeg 有效建置相依、Deno/V8 授權與 native 閉包、yt-dlp 完整性、更新安裝包、GitHub 流程及乾淨環境驗收等剩餘條件。
- 來源封存索引只使材料可追溯；未解決相依對應時，不應把約 1.4 GB 候選集合直接上傳代替完整對應來源，也不應公開舊安裝檔。

## 2026-10-19 rav1e Cargo 更新版本核對

- 讀取固定 rav1e 來源後確認 Cargo.lock 原先鎖定 `cc 1.2.26`，其 build recipe 在 `cargo cinstall` 前執行 `cargo update cc`。
- 依 BtbN 2026-09-30 發行日期與官方 crates.io 版本日期，`cc 1.5.1` 是當時最新的非 yanked 相容版本；`cc 1.6.0` 到 10/3 才發布。`cc 1.5.1` 要求 `find-msvc-tools 0.1.14` 與 `shlex 2.0.1`。既有 `jobserver 0.1.33`、`libc 0.2.172` 符合新需求。
- 下載並用官方 crates.io SHA-256 校驗 `cc 1.5.1` 與 `find-msvc-tools 0.1.14` 來源封存，確認兩包都內含 MIT 與 Apache-2.0 授權全文；shlex 2.0.1 的來源與官方 checksum 已在 librsvg registry 候選封存中。
- 新增 rav1e-cc-update-evidence.json 與來源索引項目。這是依官方版本日期及 Cargo 保守更新規則重建的高可信候選，不是 BtbN 上游的有效 Cargo.lock 或建置日誌；完全精確的二進位相依對應仍未證實。

## 2026-10-19 Deno Windows 授權缺口重算

- 905 套件候選圖先前列出 48 筆沒有在初次上游抓取中取得授權全文的項目。對照後續補件，33 筆已有可追溯全文：包含 27 個 SWC crate 的標準 Apache-2.0 文本、已找到的原始程式碼通知、plist、Cranelift、dlopen2_derive、zune-core 與 smartstring。smartstring 的 MPL 全文直接取自已按 Cargo.lock 校驗碼驗證的 crate，並補記作者署名。
- lazy-regex-proc_macros 3.1.0 的 crates.io metadata 未提供 repo；用同一固定 VCS commit 的 lazy-regex 母 crate 證實原始 repo，取得根 MIT 授權並校驗 SHA-256。SWC 13 個固定提交的根 NOTICE 檢查都回應 404，無獨立 NOTICE 檔。
- 新增 reconcile-deno-windows-licenses.py 與 deno-windows-license-reconciliation.json。重算後剩 14 個 Windows 圖候選仍無完整授權文本；圖包含 build 依賴與 workspace feature 過度合併，不代表 14 個都進入發行二進位，也不能先行排除。

後續補查：hexf-parse 0.2.1 的鎖定 crate 宣告 CC0-1.0，已加入 SPDX 完整法律文本；deno_tunnel 0.8.1 與 rustls-tokio-stream 0.8.0 的已校驗 crate 原始碼均含完整 Deno 著作權／MIT 標頭，已用這些標頭填入標準 MIT 全文並保存雜湊。derive-io、derive-io-macros 與 sptr 明確宣告 MIT OR Apache-2.0，已選用 Apache-2.0 並保存完整授權文本。剩餘 8 個 MIT 套件都已有完整 MIT 法律文本，但署名仍未核實：crate 作者欄與 Git 提交作者欄只證明貢獻資訊，不是版權聲明；檢查已校驗 crate 中的授權/版權檔名及來源程式碼，也未找到可支持目前填入姓名的標頭。已檢查 convert_case 0.4.0 的精確上游提交樹，沒有 LICENSE 檔；其餘精確樹有頁面快取限制或 dirty VCS 標記，未能補上確證。8 項都沿一般 Windows 相依路徑可達，故保留為發行阻擋項，不把推定姓名當正式聲明。詳見 deno-apache-license-supplements.json、deno-mit-author-license-supplements.json、deno-sys-traits-commit-author-evidence.json、deno-mit-copyright-gaps.json 與 deno-windows-license-reconciliation.json。

## 2026-10-19 FFmpeg/librsvg Windows 授權缺口篩選

- BtbN Windows x64 Dockerfile 固定 Rust target 為 `x86_64-pc-windows-gnu`。以 librsvg-c/avif 為根的 Windows Cargo 圖，在七個此前缺上游授權檔候選中只有 `winapi-x86_64-pc-windows-gnu-0.4.0` 可達；block、difflib、malloc_buf、objc-foundation、objc_id 與 i686 winapi 候選都不可達。
- 可達的 x86_64 winapi registry crate 與官方提交 `9497609ef44cc9bcd16cd2411c0ee6ccaf5483aa` 比對，1,419 個檔案吻合，無差異或缺檔；MIT 與 Apache-2.0 原文均已保存。這只結案該 Windows GNU 圖中已知的授權檔缺口，未證明 FFmpeg 最終二進位 linkage 或完整 librsvg vendor 閉包。
- 詳見 `ffmpeg-librsvg-windows-license-triage.json`。FFmpeg 對應來源仍未齊全。
## 2026-10-19 Deno/V8 固定來源授權補查

- 從完整 rusty_v8 固定 Git tree 確認 V8 子模組提交 `ac1e23989121713ca642f6650b34deff7b686896`，取得該提交完整遞迴 tree（20,123 entries，未截斷）。V8 tree 本身沒有子模組，找到 25 個授權／通知檔名候選，逐一從固定提交取回並記錄 Git blob SHA 與 SHA-256，保存在 licenses/deno-v8-fixed-tree 及 deno-v8/fixed-v8-license-files.json。
- 這 25 份涵蓋 V8 根授權與其內部第三方、測試及工具聲明；候選掃描包含非執行期項目。rusty_v8 外層仍有 20 個子模組，其中 5 個未找到根層授權檔。已保存 `chromium_build` 固定提交的完整遞迴 tree，並補入 AndroidHiddenApiBypass 的 Apache-2.0 原文；PartitionAlloc 固定提交的 411 個檔案封存中另找到並保存 Apple Public Source License 2.0。`third_party/rust`、`tools/clang` 與 `tools/win` 的固定 Gitiles 封存也已掃描：11,275 個 Rust 檔案有 421 個授權／通知檔名候選並已保存；clang 1,045 個檔案及 win 93 個檔案沒有符合檔名的候選。再依 Deno 2.9.7 Cargo.lock、rusty_v8/V8 固定 GN 來源設定及 Chromium 生成的 crate BUILD.gn，追出 Temporal 來源目標 46 個 Rust crate、120 條 GN 相依邊；68 份授權文本全部對應到可達 crate，並已列入 THIRD_PARTY_NOTICES.md。完整掃描 pinned V8 的 58 個 GN/GNI 檔後，確認唯一非測試 runtime Rust target 是 Temporal 分支；另兩處引用分別屬於 test-only debug helper 與 gcmole 測試資料。剩餘 352 個授權候選檔位於 205 個不屬於該 runtime 閉包的 vendor 目錄，另 1 個是 patch 內的 Apache 授權文字。Rusty V8 固定來源 CI 設定以原始碼建立預編譯庫，但本專案實際下載的 Deno 執行檔建置模式及預編譯庫雜湊未記錄，因此仍未完成二進位 link map。分類證據見 deno-v8-rust-license-candidate-classification.json。隔離目錄 NSIS 驗收包已產生，`check-desktop-package.cjs` 通過，68 份 V8 Temporal 授權文本逐項比對無缺漏；安裝檔 SHA-256 為 `5c21634aaa4b6df2d0e53f7805ce810d88a131cd41a160d61e9739e197a91e6c`，未簽章且不是最終發布候選。Chromium 繼承標頭授權與完整 executable notice 閉包仍需核對。詳見 deno-v8-rust-runtime-reachability.json、deno-v8-rust-license-candidate-classification.json、deno-v8-gitiles-submodule-archives.json、deno-v8-partition-alloc-archive.json、deno-v8/submodule-licenses.json 與 deno-v8/missing-root-license-submodule-trees.json。
- 以保存的 Windows Cargo metadata 從 deno 2.9.7 沿一般相依邊追蹤，8 個版權歸屬未驗證的套件全部可達，最短路徑與 crate target kind 已記錄於 deno-unresolved-license-dependency-paths.json。這證明 Cargo 解析圖中的一般相依可達性，不等同最終二進位連結；其中 proc-macro 會在建置期執行。

## 2026-10-19 npm 相依安全驗收

- `decode-uri-component` 原先以 0.2.2 經 React Navigation 進入網頁 bundle；已在 package.json 加入 0.5.0 override，重新安裝並輸出網頁版。輸出 bundle 含修正版的 `codePointAt` 解碼路徑，且未找到舊 `decodeComponents` 標記。
- `uuid` 已固定覆寫為 11.1.1；實際載入檢查確認 `uuid.v4()` 與 Xcode 套件介面可用。npm 官方稽核不再列出 `decode-uri-component` 或 `uuid`。
- `npm audit --omit=dev` 仍回報 29 個受影響套件節點（24 高、5 中、0 嚴重）。多數來自 Expo/Metro、React Native CLI 與 Jest 建置／測試相依；目前 Electron 安裝包排除 node_modules，且網頁應用程式由 dist bundle 提供。此套件樹稽核不等同 shipped SBOM 或執行期可達性證明。
- npm 提議的主要修復會將 Expo 降至 44.0.6、React Native 降至 0.72.17，與本專案 Expo SDK 57 組合不相容；沒有套用該降版。braces、node-forge、sprintf-js 等剩餘項目保留在建置鏈風險紀錄，須隨 Expo 57 相容更新或建置鏈調整再處理。
- 目前驗證：Jest 45/45、桌面測試 18/18、TypeScript、lint、Expo web export 均通過。桌面測試需將暫存目錄指向工作區，避開 Windows 沙盒系統 Temp 的 rename 權限限制。稽核 JSON 保存在忽略目錄 `desktop/.downloads/compliance/npm-production-audit-final-2026-10-19.json`，不作為公開發行檔案。

## 2026-10-19 新候選包啟動驗收

- 隔離 NSIS 候選包的檔案與 notice 校驗通過，但 packaged runtime 尚未驗收。工作區 ACL 首先阻擋 Electron AppContainer；將候選包複製到一般暫存目錄並授予 `ALL APPLICATION PACKAGES` 讀取後，仍可重現 `0x80000003`，堆疊位於 `electron::fuses::IsLoadBrowserProcessSpecificV8SnapshotEnabled`。
- 未修改的 `node_modules/electron/dist/electron.exe --version` 也以相同代碼及相同堆疊退出；錯誤發生在 App 程式載入前。因此這次結果無法判定 App 程式或 NSIS 設定有缺陷，需改用另一台乾淨 Windows 機器重驗。此主機的啟動失敗與先前候選包重啟通過紀錄並存，不能用舊結果取代新版驗收。

## 2026-10-19 署名缺口生成修正與 dlopen2 結案

- 根因：audit-deno-mit-copyright-gaps.py 只讀 remainingPackages（缺全文），漏掉已有 MIT 模板但無已確認署名的項目。新增回歸測試先重現八項全漏，再修正為合併兩種缺口。
- dlopen2 0.6.1 缺少 crate VCS 記錄；官方版本檔歷史定位 8580a7c1eafad6507b6c5fd37cb2e404af7e214d，40 個非生成檔案在 CRLF/LF 正規化後吻合。原始根 LICENSE 已保存，從 provisional 清單移至已補證登錄；詳見 dlopen2-0.6.1-source-comparison.json。
- 其餘七項固定來源已取得並記錄雜湊；完整樹與限定文字掃描沒有找到可確認適用的通知。sacabase 的命中屬兄弟套件，未誤套用。見 attribution-fixed-source-scan.json。
- 重跑準備、reconciliation、gap 及依賴路徑產生器後，均維持七項未確認署名；dlopen2 原始通知 hash 不變。Python 測試 2/2、應用測試 45/45、桌面測試 18/18 通過。來源索引更新為 1,537 個封存，0 缺失或記錄 hash 不符；仍不是批准附件集合。
- 目前工作清單集中於 third-party-closure-status.md，保留 Deno native、FFmpeg、yt-dlp 與附件整合的未結案條件。未修改內附執行檔、重建安裝包、對外發訊息或公開發行。

## 2026-10-20 上層與官方後續通知核對

- 更正先前只查固定舊提交的侷限：aead 官方明確追溯 0.4.0；convert_case 2020 年缺件補正已由 owner 合併；sys_traits owner PR #89 回應 0.1.28，根通知也適用原始碼與 manifest 逐位元吻合的 macros 0.1.0。保存四份固定提交原文與可追溯證據，不把目前最新版文本無條件套用舊版。
- 所有生成清單現為三項：deno_native_certs、fqdn、sacabase。三項已有內容相同的公開 issue，無需重複開單；本對話沒有對外發訊息。
- 四份保存通知已逐位元比對官方 API 內容、Git blob SHA 與本機 SHA-256。重新生成後無覆寫；三組未解清單一致；Python 回歸測試 2/2 通過。獨立審查未發現證據阻擋，指出總表舊七項文字需同步，已更新並保留歷史區段。詳見 parent-license-review-2026-10-20.md。
