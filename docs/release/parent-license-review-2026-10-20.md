# 七項套件的上層聲明與官方補件核對 — 2026-10-20

> 公開版註記（2026-10-27）：本報告是歷史查核紀錄，部分上游 API 原檔在公開版改為來源連結摘要。`evidence-hashes.json` 保留的是當時原檔的雜湊，不能用來驗證這些摘要；受影響檔案見同名資料夾內 `PUBLIC-SNAPSHOT.md`。授權原文保留。

結論：四項已取得可採用的官方補件，三項仍需維護者釐清。後三項已存在內容相同的公開 issue，應追蹤現有討論，不必重複開單。本次未送出任何訊息。

先前只查固定舊提交，未納入後續官方補件，將七項一律視為需要詢問並不完整。這次已更正材料與生成清單；不是宣稱作者違規或整體 App 已可公開發行。

## 不需再為缺署名另行詢問：四項

| 套件 | 採用依據 | 適用界線 |
| --- | --- | --- |
| aead-gcm-stream 0.4.0 | [維護者明確回覆](https://github.com/littledivy/aead-gcm-stream/issues/4#issuecomment-6253827741)：新增通知適用 0.4.0 與所有先前版本。保存提交 34483de068985e32665292d736e9801ad7ec2502 的 LICENSE.md | 官方事後補件；不需要為此把 App 升級到 0.4.1 |
| convert_case 0.4.0 | [已合併 PR #1](https://github.com/rutrum/convert-case/pull/1) 補上缺少的 LICENSE，維護者接受；採 603143ab2b6fb6067fe6788ce3d2935fd5bc18ff 的 2020 年原文 | 對 pinned 0.4.0 提交的比較僅增加授權、README 授權連結及兩處文件 cfg；據此接受為同專案缺件補正。沒有另行明說「所有舊版」的回覆，不把這項判斷描述成逐字追溯授權聲明，也不用目前 2025 年最新版通知取代它 |
| sys_traits 0.1.28 | [issue #88](https://github.com/dsherret/sys_traits/issues/88) 明確詢問此版本，作者承認疏漏，親自建立並合併 [PR #89](https://github.com/dsherret/sys_traits/pull/89) 補根 LICENSE | 採 4e60da07c2cb1828e359f4a3be21d5e4ae511404 的原始全文；不是從 commit 作者欄推測姓名 |
| sys_traits_macros 0.1.0 | 同一官方 PR 指明倉庫的 crates 已宣告 MIT；macros 位於根授權之下。發布 crate 的 lib.rs 與 Cargo.toml.orig 分別與該提交 macros/lib.rs、macros/Cargo.toml **逐位元一致** | 採上層專案根通知。原 crate 的 dirty VCS 記錄不作身分證明；Cargo 生成檔與 VCS metadata 不在原始碼逐檔比對範圍 |

四份通知皆存入既有 `licenses/deno-embedded/套件版本/LICENSE-MIT`，保留上游原文，不拼湊版權姓名／年份。已驗證 Git blob SHA、來源 crate 的鎖定 SHA-256，以及重新執行材料生成器後通知未被占位模板覆寫。

## 仍需釐清，但已有公開問題：三項

| 套件 | 為何上層聲明仍不足以直接補齊 | 現有討論與行動 |
| --- | --- | --- |
| deno_native_certs 0.3.0 | Deno 根 LICENSE 有 Deno authors 的完整 MIT，但沒有明文指定適用這個獨立儲存庫；該 repo README 只說明用途及 rustls-native-certs 相依。不能僅因同屬 denoland 就搬用根聲明 | [issue #7](https://github.com/denoland/deno_native_certs/issues/7)：已精確詢問 0.3.0，查核時尚無回覆；等待／在現有討論跟進 |
| fqdn 0.5.2 | README 與 manifest 宣告 MIT；目前完整來源樹仍沒有完整通知。Orange-OpenSource 組織名稱不能直接充當此套件的權利聲明；dirty VCS 另需留意 | [issue #8](https://github.com/Orange-OpenSource/fqdn/issues/8)：已涵蓋發布版與 dirty VCS 問題，查核時尚無回覆；不重複開單 |
| sacabase 2.0.0 | stringsearch 根 README 明確要求查看各 crate 的授權。完整通知只出現在 cdivsufsort／divsufsort 等兄弟目錄；sacabase README 沒有說它們涵蓋本套件 | [issue #3](https://github.com/fasterthanlime/stringsearch/issues/3)：已詢問同一版本與 monorepo 範圍，查核時尚無回覆；不重複開單 |

「需要釐清」指目前專案的材料驗收尚缺證據，不等於法律判定沒有授權或不能使用。三個 issue 的提出者身分不作為授權依據；採信的是有權維護者提供的通知與適用說明。

## 可重查證據

1. 結構化判定：`upstream-notice-supplements-2026-10-20.json`，逐項列採用理由、固定提交、來源與通知 hash、是否需新詢問。
2. 原始官方 API 回應：`parent-license-review-2026-10-20/`；包含 PR、維護者回覆、固定通知內容、完整樹與比較結果。
3. 未解清單：`deno-mit-copyright-gaps.json`、`deno-mit-author-license-supplements.json`、`deno-windows-license-reconciliation.json` 與 dependency-paths 報告已收斂到同三項。

本次僅補件與查證，沒有修改產品行為、發布安裝包或建立對外問題。FFmpeg、yt-dlp、Deno native 元件與最終附件整合仍有其他未結案工作。
