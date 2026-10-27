# Third-party audio notices

The application bundles excerpts of the following recordings. The underlying nursery-rhyme compositions and lyrics are in the public domain.

## Twinkle, Twinkle, Little Star

- Recording: “Twinkle Twinkle Little Star - sung with full lyrics”
- Performer and uploader: Dcoetzee
- Source: https://commons.wikimedia.org/wiki/File:Twinkle_Twinkle_Little_Star_-_sung_with_full_lyrics.ogg
- License: CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/
- Modification: converted to mono WAV and shortened for the exercise

## Mary Had a Little Lamb

- Recording and performer: Celestianpower
- Source: https://commons.wikimedia.org/wiki/File:Mary_Had_a_Little_Lamb.ogg
- License: released into the public domain by the copyright holder
- Modification: converted to mono WAV and shortened for the exercise

## London Bridge Is Falling Down

- Recording and performer: Stephen Griffith
- Source: https://commons.wikimedia.org/wiki/File:London_Bridge_by_Stephen_Griffith_2013.webm
- License: Creative Commons Attribution 3.0 Unported (CC BY 3.0) — https://creativecommons.org/licenses/by/3.0/
- Modification: audio extracted, converted to mono WAV, and shortened for the exercise
# Desktop tools

Desktop builds use separately executed yt-dlp, Node.js, FFmpeg and ffprobe binaries. See `desktop/tools.lock.json` for versions and pinned upstream inputs. FFmpeg/ffprobe are built locally from the sources and toolchain in `desktop/ffmpeg-build.lock.json`; the installed build receipt and SHA-256 digests are retained under `resources/tools`. Original notices are retained under `resources/tools/licenses` in review builds. Deno is no longer bundled; the Deno material below is retained as historical reference.

The yt-dlp Windows executable includes dependencies and is GPL-3.0-or-later; its project source alone is Unlicense. Its complete executable component/source mapping and applicable Microsoft runtime redistribution conditions remain under review. Do not publicly distribute the review installer or represent the combined partial source archive as complete corresponding source until this work is finished.

### Node.js 24.22.1

The unmodified official Windows x64 node.exe is provided under the MIT license and the bundled dependency terms preserved in the official full LICENSE. The Windows archive and source archive SHA-256 values are pinned to the official SHASUMS256.txt in `desktop/tools.lock.json`. The original Windows LICENSE and README are included under `resources/tools/licenses/node/node-v24.22.1-win-x64/`; the source LICENSE is preserved separately as `resources/tools/licenses/node-LICENSE.txt`. The corresponding source attachment is named `node.tar.xz`. npm, npx, corepack and the archive's node_modules are not distributed with this app.

### Locally built FFmpeg and LAME

FFmpeg 8.1.3-ell-local1 is built from commit `29e619e767cde9045a75c29bc9a8278ae7b3a98b`, with GPL, nonfree and version3 options disabled. It is LGPL-2.1-or-later, with additional source-file notices. It uses the shared LAME SVN r6835 library (`libmp3lame-0.dll`, LGPL-2.0-or-later), MinGW-w64 runtime and winpthreads (`libwinpthread-1.dll`); original terms and conservative source-header notices are included in `resources/tools/licenses/ffmpeg/licenses/`. Windows SChannel and other Windows system DLLs are supplied by Windows.

The matching source attachment contains `ffmpeg.tar.gz`, `lame.tar.gz` and `ffmpeg-build.tar.gz` with pinned build scripts and toolchain inputs. See `docs/release/ffmpeg-source-build.md` for rebuilding and replacing the shared library. Older FFmpeg dependency notice collections under `resources/licenses` are retained as historical reference material and do not assert that those dependencies are present in the new source-built tools.

Electron includes its own LICENSE and LICENSES.chromium.html in the packaged application.

The upstream yt-dlp 2026.08.19 executable dependency license texts are retained in `docs/release/licenses/yt-dlp-2026.08.19-THIRD_PARTY_LICENSES.txt` and included under `resources/licenses` in subsequent builds. Source: https://raw.githubusercontent.com/yt-dlp/yt-dlp/2026.08.19/THIRD_PARTY_LICENSES.txt . SHA-256: `472aefe951c7db35e1657c1d13fd337140511ed6f2b329205105ad441c5a02b7`. This notice collection does not complete the corresponding dependency source requirements.


### PyInstaller 6.22.0

Windows yt-dlp uses the yt-dlp/Pyinstaller-Builds 2026.08.19.215425 wheel, upstream commit 70fc17210920bce17f4ab09bbf8104b0dbd45338. PyInstaller is GPL-2.0-or-later with the Bootloader Exception for the bootloader and loader; runtime hooks are Apache-2.0. Full terms are preserved in docs/release/licenses/PyInstaller-6.22.0-COPYING.txt. The build-recipe Unlicense is preserved separately. See docs/release/pyinstaller-materials.md for binary/source evidence and its limits; this does not replace other bundled components' terms.

### Historical reference: removed Deno/V8 Temporal Rust dependency set

The removed Deno 2.9.7 tool locked `deno_v8 0.4.0` → `v8 150.4.0` → `temporal_capi 0.2.3`. In that pinned source build, `rusty_v8` enabled Rust and Temporal support, and V8’s `v8_base_without_compiler` depended on the Temporal target. The source target closure below is preserved for historical review, not as an inventory of the current Node runtime; its declared license expressions and full texts were taken from the fixed Chromium Rust subtree.

The desktop build maps full texts into `licenses/deno-v8-submodules/third_party/rust/chromium_crates_io/vendor/<vendor-directory>/`. In the source repository they are under `docs/release/licenses/deno-v8-submodules/third_party/rust/chromium_crates_io/vendor/<vendor-directory>/`. The package checker compares the complete license directory with the packaged copy.

This is the checked-in source-build target closure, including compile-time dependencies. `rusty_v8` can also download prebuilt libraries, and build flags may override defaults; the exact build inputs for the packaged Deno executable are not recorded here. This list does not claim to be a complete executable SBOM.

| Crate | Version | Declared license | Vendor directory |
| --- | ---: | --- | --- |
| `autocfg` | 1.5.1 | Apache-2.0 | `autocfg-v1` |
| `calendrical_calculations` | 0.2.4 | Apache-2.0 | `calendrical_calculations-v0_2` |
| `core_maths` | 0.1.1 | MIT | `core_maths-v0_1` |
| `diplomat` | 0.15.0 | Apache-2.0 | `diplomat-v0_15` |
| `diplomat_core` | 0.15.0 | Apache-2.0 | `diplomat_core-v0_15` |
| `diplomat_runtime` | 0.15.1 | Apache-2.0 | `diplomat-runtime-v0_15` |
| `displaydoc` | 0.2.5 | Apache-2.0 | `displaydoc-v0_2` |
| `either` | 1.16.0 | Apache-2.0 | `either-v1` |
| `icu_calendar` | 2.2.1 | Unicode-3.0 | `icu_calendar-v2` |
| `icu_calendar_data` | 2.2.0 | Unicode-3.0 | `icu_calendar_data-v2` |
| `icu_collections` | 2.2.0 | Unicode-3.0 | `icu_collections-v2` |
| `icu_locale` | 2.2.0 | Unicode-3.0 | `icu_locale-v2` |
| `icu_locale_core` | 2.2.0 | Unicode-3.0 | `icu_locale_core-v2` |
| `icu_locale_data` | 2.2.0 | Unicode-3.0 | `icu_locale_data-v2` |
| `icu_provider` | 2.2.0 | Unicode-3.0 | `icu_provider-v2` |
| `ixdtf` | 0.6.5 | Unicode-3.0 | `ixdtf-v0_6` |
| `libm` | 0.2.16 | MIT | `libm-v0_2` |
| `litemap` | 0.8.2 | Unicode-3.0 | `litemap-v0_8` |
| `num_traits` | 0.2.19 | Apache-2.0 | `num-traits-v0_2` |
| `potential_utf` | 0.1.5 | Unicode-3.0 | `potential_utf-v0_1` |
| `proc_macro2` | 1.0.106 | Apache-2.0 | `proc-macro2-v1` |
| `quote` | 1.0.45 | Apache-2.0 | `quote-v1` |
| `resb` | 0.1.2 | Unicode-3.0 | `resb-v0_1` |
| `serde` | 1.0.228 | Apache-2.0 | `serde-v1` |
| `serde_core` | 1.0.228 | Apache-2.0 | `serde_core-v1` |
| `serde_derive` | 1.0.228 | Apache-2.0 | `serde_derive-v1` |
| `smallvec` | 1.15.1 | Apache-2.0 | `smallvec-v1` |
| `stable_deref_trait` | 1.2.1 | Apache-2.0 | `stable_deref_trait-v1` |
| `strck` | 1.0.0 | MIT | `strck-v1` |
| `syn` | 2.0.117 | Apache-2.0 | `syn-v2` |
| `synstructure` | 0.13.2 | MIT | `synstructure-v0_13` |
| `temporal_capi` | 0.2.3 | Apache-2.0 | `temporal_capi-v0_2` |
| `temporal_rs` | 0.2.3 | Apache-2.0 | `temporal_rs-v0_2` |
| `timezone_provider` | 0.2.3 | Apache-2.0 | `timezone_provider-v0_2` |
| `tinystr` | 0.8.3 | Unicode-3.0 | `tinystr-v0_8` |
| `unicode_ident` | 1.0.24 | Apache-2.0, Unicode-3.0 | `unicode-ident-v1` |
| `utf8_iter` | 1.0.4 | Apache-2.0 | `utf8_iter-v1` |
| `writeable` | 0.6.3 | Unicode-3.0 | `writeable-v0_6` |
| `yoke` | 0.8.2 | Unicode-3.0 | `yoke-v0_8` |
| `yoke_derive` | 0.8.2 | Unicode-3.0 | `yoke-derive-v0_8` |
| `zerofrom` | 0.1.8 | Unicode-3.0 | `zerofrom-v0_1` |
| `zerofrom_derive` | 0.1.7 | Unicode-3.0 | `zerofrom-derive-v0_1` |
| `zerotrie` | 0.2.4 | Unicode-3.0 | `zerotrie-v0_2` |
| `zerovec` | 0.11.6 | Unicode-3.0 | `zerovec-v0_11` |
| `zerovec_derive` | 0.11.3 | Unicode-3.0 | `zerovec-derive-v0_11` |
| `zoneinfo64` | 0.3.0 | Unicode-3.0 | `zoneinfo64-v0_3` |

## 歷史參考：Deno dlopen2 0.6.1 通知補件 — 2026-10-19

`docs/release/licenses/deno-embedded/dlopen2-0.6.1/LICENSE-MIT` 已改存官方固定提交 `8580a7c1eafad6507b6c5fd37cb2e404af7e214d` 的原始 MIT 通知，包含 Szymon Wieloch、Ahmed Masud 與 OpenByte 的原始權利聲明。40 份非生成檔案在換行正規化後與已鎖定 crate 相符；詳見 `docs/release/dlopen2-0.6.1-source-comparison.json`。

其餘七項 MIT 署名證據仍未確認。整體第三方發行材料尚未結案；目前狀態與下一步見 `docs/release/third-party-closure-status.md`。

## 官方後續與上層通知補件 — 2026-10-20

已保存 aead-gcm-stream 0.4.0、convert_case 0.4.0、sys_traits 0.1.28、sys_traits_macros 0.1.0 的官方完整通知，取代對應占位模板。適用理由與固定提交見 docs/release/upstream-notice-supplements-2026-10-20.json；其中官方後續補件不宣稱原本就存在於舊 crate。

目前署名待釐清項目剩 deno_native_certs 0.3.0、fqdn 0.5.2、sacabase 2.0.0；前文七項為 10/19 歷史狀態。逐項結論與現有 issue 連結見 docs/release/parent-license-review-2026-10-20.md。其他第三方發布門檻未因此自動結案。

2026-10-20 包含性查核後的優先序：fqdn 有直接二進位與執行證據，deno_native_certs 有強功能包含證據，兩項優先補足適用通知；sacabase 尚無實際包含證據，分類為較低優先的「包含性待判定」，不能只因出現在 Cargo 清單就視為同等發布阻擋項。這並非已證明 sacabase 不存在。證據見 docs/release/deno-binary-inclusion-2026-10-20.md；最新補件狀態及未送出的跟進草稿見 docs/release/priority-notice-review-2026-10-20.md。

## yt-dlp supplemental materials — 2026-10-23

The fixed executable includes typing_extensions 4.16.0 and a delvewheel 1.13.0 generated runtime patch in curl_cffi. Their complete original notices, astring/meriyah notices and cffi embedded libffi source notices are retained under resources/licenses. Dependency source/build inputs are pinned in desktop/yt-dlp-materials.lock.json and included in the private source attachment; generated npm distributions and fixed upstream preferred sources are identified separately. Microsoft runtime recipient terms are available at resources/MICROSOFT_RUNTIME_TERMS.txt and in Help and Support. These apply only to Microsoft components; other component license rights remain unchanged. Publisher eligibility and final distribution conditions remain under review; public distribution remains disabled.
