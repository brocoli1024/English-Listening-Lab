# 公開原始碼與分享範圍

此公開儲存庫提供可自行建置的完整原始碼。首次操作請見 [Windows 建置指南](build-on-windows.md)。本專案原創程式碼採 MIT 授權；第三方素材與程式依各自授權。

## 公開版內容

此版本以新的 Git 歷史起始，提交使用 brocoli1024 與 GitHub noreply 信箱。原私人庫的提交、Actions 紀錄與附件不屬於此公開庫。授權聲明保留第三方權利人姓名與必要歸屬。

保留功能程式碼、建置腳本、鎖定來源、第三方授權，以及三首有來源紀錄的範例錄音。YouTube 功能保留；保留程式碼不表示取得平台下載許可。安裝包的再散布審查仍未完成，材料清單的公開散布核准維持 false。

部分歷史上游 API 備份已改為明確標記的來源連結摘要，省略討論全文與個人作者資料；摘要不代表原始 API 回應，不可拿來驗證舊報告內的原檔雜湊。`docs/release/licenses/` 的授權原文保留。

CI 僅執行原始碼檢查，不建置安裝檔、不上傳 Artifact、不建立 Release。`desktop/vendor/`、`desktop/.downloads/`、`release/`、依賴快取、私人匯入教材及憑證不應提交。新增內容仍須檢查是否含私人資訊。

## 僅供閱讀的文字檢視包

執行 `python scripts/export-source-review.py`，分享 `source-review/` 內產生的 ZIP 與 SHA-256，接收者先讀 `REVIEW.md`。此工具排除 assets、執行檔、Git 歷史、CI 與內部查核資料，因此產物僅供閱讀，不能直接完整建置。需要建置時請下載完整公開儲存庫。
