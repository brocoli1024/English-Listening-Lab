# 公開原始碼與分享範圍

此公開儲存庫提供可自行建置的完整原始碼。首次操作請見 [Windows 建置指南](build-on-windows.md)。新增且未另獲較廣授權的原創內容採 [個人檢視與建置授權](../LICENSE)；第三方素材與程式依各自授權。

## 公開版內容

此版本以新的 Git 歷史起始，提交使用 brocoli1024 與 GitHub noreply 信箱。原私人庫的提交、Actions 紀錄與附件不屬於此公開庫。授權聲明保留第三方權利人姓名與必要歸屬。

保留功能程式碼、建置腳本、鎖定來源、第三方授權，以及三首有來源紀錄的範例錄音。YouTube 功能保留；保留程式碼不表示取得平台下載許可。安裝包的再散布審查仍未完成，材料清單的公開散布核准維持 false。

部分歷史上游 API 備份已改為明確標記的來源連結摘要，省略討論全文與個人作者資料；摘要不代表原始 API 回應，不可拿來驗證舊報告內的原檔雜湊。`docs/release/licenses/` 的授權原文保留。

CI 僅執行原始碼檢查，不建置安裝檔、不上傳 Artifact、不建立 Release。`desktop/vendor/`、`desktop/.downloads/`、`release/`、依賴快取、私人匯入教材及憑證不應提交。新增內容仍須檢查是否含私人資訊。

## 僅供閱讀的文字檢視包

執行 `python scripts/export-source-review.py`，分享 `source-review/` 內產生的 ZIP 與 SHA-256，接收者先讀 `REVIEW.md`。此工具排除 assets、執行檔、Git 歷史、CI 與內部查核資料，因此產物僅供閱讀，不能直接完整建置。需要建置時請下載完整公開儲存庫。

## 授權：個人檢視與建置

自本次授權變更起，對於權利人有權重新授權且未另以較廣條款提供的新增原創內容，允許個人閱讀、下載、非商業本機建置及執行，也允許建置所需的本機設定與相容性調整。未另外授予商用、站外再散布、代他人託管或機構使用許可；可分享原儲存庫連結。完整條款及例外以 LICENSE 為準。

**既有 MIT 權利不會被收回。** [首次公開版本](https://github.com/brocoli1024/English-Listening-Lab/tree/9fc48edfd2df49e7485a04a42b6400e7b3df7fa6) 中的既有程式碼已依 MIT 授權，其後相同內容仍可依 MIT 使用、修改、散布及商用。本次變更不能把整份既有程式碼追溯改為禁止商用；未來新增原創內容才可能受新限制。原 MIT 全文與 Expo 聲明保留於 THIRD_PARTY_NOTICES.md。

公開庫仍允許 [GitHub 服務條款](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#d-user-generated-content) 範圍內的檢視與站內 fork。自訂授權不縮減第三方元件、範本、素材或法律例外原已允許的權利。MIT 等授權文字繼續出現在相依套件與第三方通知中是必要的，不表示所有新內容都採 MIT。
