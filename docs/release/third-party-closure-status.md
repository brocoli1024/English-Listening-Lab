# 第三方材料結案狀態 — 2026-10-20

目前 DENO-ATTR 有三項材料缺口，但不代表三項已證實同等散布風險：fqdn 有直接包含證據，deno_native_certs 有強功能包含證據，兩項優先補件；sacabase 來源顯示未使用分支，降為包含性待判定。詳見 [二進位查核](deno-binary-inclusion-2026-10-20.md)。三項皆已有公開 issue，不必重複開單。aead-gcm-stream、convert_case、sys_traits 與 sys_traits_macros 已取得官方後續／上層通知補件，詳見 [逐項判定](parent-license-review-2026-10-20.md)。整體第三方材料仍未結案。

這是目前工作清單；較早的 progress 與驗收報告保留歷史狀態。來源完整性、授權通知、精確二進位對應及可位元重現是不同證據，不互相代替。

10/20 再查：fqdn #8、deno_native_certs #7 仍無回覆，最新完整樹與 PR 未見通知補件。兩項尚未結案；已備妥[跟進草稿與驗收條件](priority-notice-review-2026-10-20.md)，未對外送出。sacabase 保持較低優先的包含性待判定。

## 本輪已完成

1. 修正 audit-deno-mit-copyright-gaps.py：即使 MIT 全文已保存，仍會列出缺署名的套件。回歸測試先重現漏掉全部八項，再通過。
2. dlopen2 0.6.1 署名缺口結案：固定提交 8580a7c1eafad6507b6c5fd37cb2e404af7e214d 的 40 份非生成檔案在 CRLF/LF 正規化後與鎖定 crate 一致；根 LICENSE 已逐位元保存。不是逐位元來源一致或全 Deno 二進位結案。
3. 其餘七項的固定來源樹及封存已保存。掃描 README／程式碼內嵌 copyright 與 MIT permission 標記，未找到足以替換這七項占位文字的通知。stringsearch 中的兄弟套件通知不能直接套用到 sacabase。

## 尚未完成的五組工作

| ID | 現況 | 下一個可結案的證據 |
| --- | --- | --- |
| DENO-ATTR | 2 項優先補件（deno_native_certs、fqdn）；1 項包含性待判定（sacabase）；盤點仍保留 3 個缺口 | 優先追蹤 deno_native_certs #7、fqdn #8；sacabase 不僅憑 Cargo 清單阻擋發布，也不標記已排除；不能從 Cargo 作者欄生成權利聲明 |
| DENO-NATIVE | V8 Temporal 46 個來源目標的 68 份文本已保存；Chromium 內嵌通知與實際 Deno 預編譯庫對應未結案 | 固定建置模式／預編譯庫 digest、實際元件通知範圍，區分 build-only 與 runtime；見 deno-v8-rust-runtime-reachability.json |
| FFMPEG | 57 份直接來源候選及多批傳遞來源已收集；completeCorrespondingSource 仍為 false | 有效建置來源／鎖檔，特別是 rav1e cargo update cc、librsvg vendor；所需建置／重新連結材料的適用性與完整集合；見 ffmpeg-nested-review.md |
| YTDLP | Python runtime、curl、PyInstaller 已有獨立材料與比對；總報告仍為 complete:false | 執行檔元件逐項映射來源／通知／建置證據，補原生靜態相依與 Microsoft runtime 散布聲明範圍。不要重做已完成的 PyInstaller 版本定位 |
| ATTACHMENTS | collected-source-index 是候選索引；打包腳本只壓縮 vendor/sources | 批准的附件 manifest，列元件、版本、來源、通知、hash 與未結案狀態；不能直接發布候選全集 |

## 2026-10-19 歷史查核：當時七項與已查範圍

下表保留當時的固定舊提交查找結果；四項已由 10/20 的後續官方通知查核補齊，不代表目前仍有七項未解。

| 套件 | crate 記錄提交 | 本輪結果 |
| --- | --- | --- |
| aead-gcm-stream 0.4.0 | 2737345ddbccd5b3e1ae41060b136cfc3e0cb610 | littledivy/aead-stream 完整樹無通知檔名；10 份文字檔未命中；repo 由 crate README 線索定位 |
| convert_case 0.4.0 | 300d9eef9e8c970e15f324afbc3df8b6a4ebbf71 | 完整樹無通知檔名；12 份文字檔未命中 |
| deno_native_certs 0.3.0 | 700f235fe029ea839f5a64eea251abf8116ddb4c | 完整樹無通知檔名；9 份文字檔未命中 |
| fqdn 0.5.2 | a23fef8570522a3b98a79afc45322d6487166cd9 | 完整樹無通知檔名；11 份文字檔未命中；crate VCS 標記 dirty |
| sacabase 2.0.0 | acd5846b959884a1d24247038e9c52b5cf900f67 | 52 份文字檔；命中的是 cdivsufsort/divsufsort，未找到確認適用 sacabase 的通知；跳過 5 份非文字／大檔 |
| sys_traits 0.1.28 | 709e02e198721f81b485c078ccdf1835fa3e6a40 | 完整樹無通知檔名；22 份文字檔未命中 |
| sys_traits_macros 0.1.0 | 75cbf3ea478624cc78275b0264e78e9ae13ce3f5 | 完整樹無通知檔名；18 份文字檔未命中；crate VCS 標記 dirty |

這是限定標記與 2 MB 上限的文字查找結果，不是宣稱不存在其他形式的授權證據。dirty VCS 提交不能直接當作完整發布內容。GitHub codeload SHA-256 是本機完整性紀錄，不是上游簽章；原始 crate 則與鎖定 registry checksum 比對。

## dlopen2 結案證據

官方版本檔歷史定位 0.6.1，原始 Cargo.toml、程式碼、範例、測試及根 README 共 40 檔僅有換行差異。Cargo 產生的 normalized manifest 與 Cargo.lock 不在比對結論；兩者保留於原始校驗過的 crate。原始根 LICENSE 包含三段權利聲明，保存於 licenses/deno-embedded/dlopen2-0.6.1/LICENSE-MIT。

- [固定上游 LICENSE](https://github.com/OpenByteDev/dlopen2/blob/8580a7c1eafad6507b6c5fd37cb2e404af7e214d/LICENSE)
- 比對：dlopen2-0.6.1-source-comparison.json；已補證登錄：deno-inferred-repo-license-evidence.json。
- 未解清單：deno-mit-copyright-gaps.json、deno-mit-author-license-supplements.json。
- 查找證據：attribution-fixed-source-scan.json、attribution-upstream-tree-results.json、attribution-upstream-trees/。

## 2026-10-19 取證草稿（本對話尚未對外送出）

10/20 已發現適用官方補件及其餘三項的既有 issues；下方草稿僅供參考，不應重新建立相同問題。

七項不能靠重試相同 LICENSE 路徑或增加下載數量結案。可向各上游詢問下列問題，填入表中的套件、版本與提交：

> We are preparing third-party notices for a distribution that includes PACKAGE VERSION. Its checksum-verified crates.io archive declares MIT, but we could not locate the applicable copyright/permission notice in the archive or recorded source revision COMMIT. Could you point us to the original notice applicable to this version, or add an authoritative notice that explicitly covers it? We do not want to infer copyright ownership from Cargo authors or commit metadata. For a dirty VCS record, please also clarify which source revision corresponds to the published crate.

若無法取得必要材料，可另評估替換／不隨附相關工具的方案。不能把占位文字改成推測姓名後標記完成。
