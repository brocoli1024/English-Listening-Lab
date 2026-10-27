# yt-dlp Windows 執行檔相依核對 — 2026-10-16

## 結論

原本 9 個 sdist 不是完整材料。已直接讀取本專案固定 yt-dlp.exe 的 PyInstaller CArchive 與 PYZ 目錄，不依賴本機 Python 已安裝的套件清單。未修改產品、未重新打包、未解除公開發行限制。

執行檔 SHA-256：66674953fe251b89f4d08c5f0e35e0728679bd67ab3d7d05c0562af101dd3e7a。

## 已確認存在的額外 Python 相依

| 元件 | 包含證據 | 版本證據及可信度 | 材料狀態 |
|---|---|---|---|
| cffi | PYZ 的 cffi；_cffi_backend.cp310-win_amd64.pyd | cffi 模組位元碼含 2.1.1（靜態版本字串，尚未以相同 Python 執行讀取） | 不在原本 9 包內 |
| pycparser | PYZ 的 pycparser | 模組位元碼含 3.00（候選版本，不能只靠字串宣告完整對應） | 不在原本 9 包內 |
| charset_normalizer | PYZ 與 cd/md 原生 pyd | version 模組位元碼含 3.5.0 | 不在原本 9 包內 |
| idna | PYZ 的 idna | package_data 模組位元碼含 3.18 | 不在原本 9 包內 |

requests 的 PKG-INFO 宣告 charset_normalizer、idna、urllib3、certifi；curl_cffi 的 pyproject 宣告 cffi>=2.0.0、certifi。可選 PySocks 並未作為 socks 根模組出現在此次 PYZ 目錄，不因來源宣告 optional extra 就列作已包含。PYZ 目錄也不等於完整 runtime 呼叫圖。

## 已確認的原生部分

- CPython：python310.dll、python3.dll 及標準庫 pyd；既有實際 verbose 輸出為 Python 3.10.11。
- OpenSSL：libcrypto-1_1.dll、libssl-1_1.dll；既有 runtime 輸出為 1.1.1t。
- SQLite：sqlite3.dll；既有 runtime 輸出為 3.40.1。
- libffi：libffi-7.dll；檔名只能確認 ABI，尚不能推導精確版本。
- Microsoft runtime：VCRUNTIME140.dll、ucrtbase.dll、api-ms-win-* DLL；必須保留相應散布聲明，不能將它們當成 MIT 或假設須提供開源來源。
- 壓縮/XML/decimal：_bz2、_lzma、pyexpat、_decimal 等模組存在；它們內部靜態相依仍需依 CPython 該版建置資訊核對。
- PyInstaller bootloader 與 runtime hooks 亦屬散布內容；精確打包版本與來源／授權例外尚待確認。

## curl_cffi 與 libcurl 不可合併視為一份來源

執行檔確實含 curl_cffi.libs/libcurl-impersonate-ec8ead0e422fe4ae62a99233a63f6007.dll。

解壓後 SHA-256：ec8ead0e422fe4ae62a99233a63f6007adc727caba97ff1f87385c00cafe200f。

對這份既有 DLL 呼叫無網路的 curl_version()，實際回報：

```
libcurl/8.21.0-IMPERSONATE BoringSSL zlib/1.3.1 brotli/1.2.0 zstd/1.5.7 WinIDN nghttp2/1.63.0 ngtcp2/1.20.0 nghttp3/1.15.0
```

curl_cffi 0.16.0 的 scripts/build.py 固定引用 curl-impersonate v2.0.0 Windows x86_64 資產；Makefile 也指向 v2.0.0 與 curl-8_21_0。這是強烈來源線索，但未與官方資產逐位元比對前，不宣稱已完成二進位對應。

仍缺：curl-impersonate v2.0.0 的 patches、建置腳本、實際 BoringSSL commit，以及以上原生相依來源／聲明。相同 Brotli 版本的 Python sdist 也不能直接證明符合 libcurl 中的建置材料。

## 可重查的附件

- yt-dlp-executable-inventory.json：CArchive 檔案目錄與內嵌套件 METADATA/WHEEL。
- yt-dlp-python-modules.json：PYZ 模組名稱。
- yt-dlp-libcurl-version.txt：實際 DLL 的版本回報。
- scripts/inspect-ytdlp-archive.cjs：讀取固定執行檔 CArchive 清單的本機工具。
- 原始抽取物只留在被 Git 排除的 desktop/.downloads/compliance/exe-evidence/，不作為公開來源包。

下一步：先對照 curl-impersonate v2.0.0 官方 Windows 資產的 DLL 雜湊；再從該 tag 收集精確原生來源與 patches。Python 間接相依的候選版本需進一步與來源／wheel bytecode 對應，再加入來源附件。

參考：PyInstaller archive 原理 https://pyinstaller.org/en/stable/advanced-topics.html ；curl_cffi 固定版本 https://github.com/lexiforest/curl_cffi/tree/v0.16.0 。以上包含與版本結論以本地執行檔、已校驗 sdist 與 DLL 回報為直接證據。

## 2026-10-16 官方二進位對應已確認

官方 v2.0.0 Windows x86_64 資產內的 lib/libcurl-impersonate.dll 與 yt-dlp 內附 DLL 逐位元相同，SHA-256 均為 ec8ead0e422fe4ae62a99233a63f6007adc727caba97ff1f87385c00cafe200f。官方壓縮檔 SHA-256 為 88e5b641a13b9a991857996947837c6f058cc3b0c9142ded0fc17b82008e98b2，與 GitHub asset digest 一致。

v2.0.0 tag 此次解析至 ec41b71ce888806bfec56ada7a7258d333eb3d19；已下載以此 commit 固定的來源包並保存授權，詳見 curl-impersonate-binary-match.json。來源含建置設定與 patches，但尚未包含全部外部相依來源。這項比對證明 DLL 與官方資產一致，不等於已自行從來源重建驗證。
