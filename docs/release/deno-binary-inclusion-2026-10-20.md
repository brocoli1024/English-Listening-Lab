# Deno 三項署名缺口：實際散布證據 — 2026-10-20

> 公開版註記（2026-10-27）：本報告是歷史查核紀錄，部分上游 API 原檔在公開版改為來源連結摘要。`evidence-hashes.json` 保留的是當時原檔的雜湊，不能用來驗證這些摘要；受影響檔案見同名資料夾內 `PUBLIC-SNAPSHOT.md`。授權原文保留。

結論：不能將三個 Cargo 相依項目視為三個已證實散布的元件。fqdn 有直接二進位及執行證據；deno_native_certs 有強功能證據與官方來源對應；sacabase 尚無實際包含證據，應降低處理優先序，保留待判定。

| 套件 | 包含判定 | 對署名工作清單的影響 |
| --- | --- | --- |
| fqdn 0.5.2 | 確認包含套件特有資料，且其解析行為可實際觸發 | 優先補足適用通知 |
| deno_native_certs 0.3.0 | 強功能包含證據；尚非符號／機器碼逐函式鑑定 | 優先補足適用通知；不可因 README 提到 macOS 就排除 Windows |
| sacabase 2.0.0 | 未確認包含；來源顯示兩層未使用分支，二進位未找到名稱 | 降為包含性待判定，不能僅憑 Cargo 清單當成同等發布阻擋項；也不能標記已證明不存在 |

## 執行檔與來源身份

鎖定官方 Deno 2.9.7 Windows x64 ZIP SHA-256：`a0c3101b4158d1dfb7d6a78a7bf0f3de80c96bb423c152beec8beb22786f2238`。

ZIP 內 deno.exe 與下列三份檔案逐位元相同，大小 97,462,048 bytes，SHA-256 均為 `e020f3e232bd16e33768dee528e5983349c962952051ced0a5d58ad42f5d9b33`：

- `desktop/vendor/deno.exe`
- `release/win-unpacked/resources/tools/deno.exe`
- `desktop/.test-data/release-check-v8-retry/win-unpacked/resources/tools/deno.exe`

本輪核對本機散布目錄及既有測試目錄，沒有重新解包 NSIS 安裝檔，也沒有主張未來建置或所有平台相同。官方來源壓縮檔通過 tools.lock.json 的 sourceSha256；使用的六份 Deno 來源與該壓縮檔逐位元相同。六個相關 crate 壓縮檔均通過已保存 registry checksum。這建立版本證據，並非可位元重現建置證明。

## 個別證據

### fqdn

PE `.rdata` 在檔案位移 77,639,346 含 `fqdn-0.5.2` 的 Rust 原始碼路徑；77,639,735 含 `empty label found in FQDN`。來源 `runtime/permissions/lib.rs` 的主機解析呼叫 `FQDN::from_str`。直接執行散布目錄的 Deno，指定 `--allow-net=bad..host`，退出碼 1 並回傳相同專屬錯誤。此預期失敗用來驗證解析路徑，沒有對外連線。一般 JS 中的 fqdn 字樣未作為套件證據。

### deno_native_certs

`node:tls.getCACertificates("system")` 對應 `op_node_get_ca_certificates` → `load_system_ca_certificates` → `deno_native_certs::load_native_certs`。鎖定 crate 的非 macOS 實作會呼叫 rustls_native_certs 並轉換憑證資料，Windows 並非空實作。

使用散布目錄的 Deno 呼叫此 API，退出碼 0、回傳系統憑證數量 53；只記錄數量，未匯出憑證。搭配已核對官方來源，構成強功能包含證據。二進位找不到套件名稱，可能與最佳化／內聯有關，不能據此排除；本輪未對獨立符號或機器碼作逐函式鑑定。

### sacabase

Cargo 路徑是 `qbsdiff → suffix_array → cdivsufsort → sacabase`，但來源呼叫不是同一件事：

1. 官方 Deno 來源全部 `.rs` 中，唯一 qbsdiff 參照是 `runtime/ops/desktop.rs` 的 `Bspatch::new`。`bspatch.rs` 及共用 `utils.rs` 不使用 suffix_array；使用它的是產生差異檔的 `bsdiff.rs`。
2. 即使走到 suffix_array，其 `src/saca.rs` 使用的是 `cdivsufsort::sort_in_place`；cdivsufsort 使用 sacabase 的是另一個 `sort` 包裝函式。不能把兩者混為一談。

執行檔含 qbsdiff 的 `bspatch.rs` 路徑，沒有找到 `sacabase` 或 `suffix_array` 名稱。這與上述未使用路徑一致，但字串不存在不證明程式碼不存在。沒有匹配此官方二進位的 link map／PDB；本次官方 release API 的資產清單亦無 PDB、symbol 或 debug 命名資產。若需要正式作出「完全未包含」的判定，仍需對應連結資訊或等效機器碼分析。

## 範圍與處理決定

這是技術包含性分級，不是法律侵權或產品可上線的判決。App 平常是否呼叫某功能，不能代替完整 deno.exe 的散布範圍。現有三項署名缺口仍保留在材料盤點，未刪除通知或臆造權利人；其中兩項優先補件，sacabase 改為較低優先的包含性待判定。其他 FFmpeg、原生相依及附件工作不因本結論自動結案。

可複查證據：[evidence.json](deno-binary-inclusion-2026-10-20/evidence.json)、[原始來源摘錄與雜湊](deno-binary-inclusion-2026-10-20/evidence-hashes.json)、[官方 release API 快照](deno-binary-inclusion-2026-10-20/official-release.json)。來源摘錄保存原始位元內容；CRLF 格式可能影響不同工具顯示的行號。
