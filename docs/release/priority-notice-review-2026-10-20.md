# 優先通知補件：fqdn 與 deno_native_certs

> 公開版註記（2026-10-27）：本報告是歷史查核紀錄，部分上游 API 原檔在公開版改為來源連結摘要。`evidence-hashes.json` 保留的是當時原檔的雜湊，不能用來驗證這些摘要；受影響檔案見同名資料夾內 `PUBLIC-SNAPSHOT.md`。授權原文保留。

2026-10-20 最新查核：兩項仍無可採用的官方完整通知，不能標記補件完成。兩個既有 issue 已精確詢問適用版本，無須重開問題；以下跟進文字僅為草稿，尚未對外送出。

## 查核結果

| 套件 | 最新官方證據 | 處置 |
| --- | --- | --- |
| fqdn 0.5.2 | [issue #8](https://github.com/Orange-OpenSource/fqdn/issues/8) 仍 open、0 comments；預設分支 a23fef8570522a3b98a79afc45322d6487166cd9 完整樹沒有授權通知檔名；全部 2 個 PR 未見通知補件 | 優先等待適用於發布 crate 的原始 MIT 通知；dirty VCS 不作發布內容完全相同的證明 |
| deno_native_certs 0.3.0 | [issue #7](https://github.com/denoland/deno_native_certs/issues/7) 仍 open、0 comments；預設分支 af63bfbea7d761ab286fa357bc38350b39ad2df0 完整樹沒有授權通知檔名；全部 6 個 PR 未見通知補件 | 優先等待原始 MIT 通知，或有權維護者明確指出既有通知涵蓋此獨立 repo 的 0.3.0 |

本輪是對先前已完成的原始碼／README 通知查找作更新查核；沒有聲稱僅靠檔名掃描即可排除所有形式的通知。原始 API 回應保存在同名資料夾，完整樹回應均為 truncated=false。先前查核詳見 parent-license-review-2026-10-20.md。

## 現有 issue 跟進草稿

只有需要補充散布事實時才使用，不必立即重複催問。收到回覆之前，現有問題本身已完整提出缺件需求。

### fqdn — issue #8

Additional distribution context: we verified that the official Deno 2.9.7 Windows x64 executable we bundle contains fqdn 0.5.2 source-path data and exercises its hostname parser.

Could you provide the complete original MIT copyright and permission notice applicable to the published fqdn 0.5.2 crate, or identify an existing notice and confirm that it covers that release? The crate records a dirty VCS revision, so applicability to the published crate would be particularly helpful. We will preserve the notice verbatim rather than infer ownership from contributor metadata.

### deno_native_certs — issue #7

Additional distribution context: we bundle the official Deno 2.9.7 Windows x64 executable. Its system-CA API works in our runtime check, and the matching release source calls deno_native_certs 0.3.0 through the non-macOS implementation.

Could you provide the complete original MIT copyright and permission notice applicable to deno_native_certs 0.3.0? If an existing Deno project notice already applies, please identify it and confirm that it covers this separate repository and release. We will preserve the authoritative notice verbatim.

## 收到補件後的驗收

1. 核對回覆者的維護者身分、通知來源與對指定版本的適用說明；不能只因 repo 位於同一組織就套用其他專案通知。
2. 保存固定提交的原文、來源連結及雜湊，再補入既有通知檔與證據登錄。
3. 重跑材料生成與一致性檢查，確認通知不被占位模板覆寫；發布包仍需重新產製及驗證。

sacabase 2.0.0 保留於來源材料缺口盤點，分類為「包含性待判定、較低優先」，不得僅由 Cargo 相依關係產生與上述兩項相同的發布阻擋判定。這不等於已證明它不存在，也不會刪除其現有材料。
