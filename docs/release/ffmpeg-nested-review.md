# FFmpeg nested-source review

Status: incomplete. These findings refer to the captured BtbN scripts and pinned archives, not a reproduced Windows binary build.

## shaderc

`ffmpeg-build/scripts.d/47-vulkan/50-shaderc.sh` runs `utils/git-sync-deps`, then disables tests/examples in both target and host builds. The pinned shaderc CMake configuration only enables tests when `SHADERC_SKIP_TESTS` is false. Its `third_party/CMakeLists.txt` adds googletest only for shaderc tests and adds Abseil, RE2 and Effcee only when SPIRV-Tools tests are enabled; with the recorded flags, those four test-conditional projects are not configured. The three source-build inputs are glslang, SPIRV-Headers and SPIRV-Tools; their static libraries are built for shaderc. All seven exact DEPS archives and nine license texts were rehashed successfully. Their nested DEPS were also checked: protobuf is only configured for the disabled SPIRV fuzzer; mimalloc has no source directory in the pinned archive and the dependent CMake option remains disabled; Chromium GN buildtools are not used by this CMake/Ninja recipe. See `ffmpeg-shaderc-dependency-triage.json` and `ffmpeg-shaderc-sources.json`. Local hashes are integrity records, not upstream-published checksums. Final FFmpeg binary linkage remains unverified.

## libjxl

`ffmpeg-build/scripts.d/50-libjxl/50-libjxl.sh` explicitly initializes only `third_party/highway`. It forces system Brotli and LCMS2, disables SKCMS/SJPEG, testing, tools, examples and benchmarks. Do not treat all ten entries in libjxl's `.gitmodules` as linked dependencies. Obtain the exact Highway gitlink revision next; the `.gitmodules` URL alone does not identify it. System dependencies must still be connected to the build's direct-source inventory.

Highway follow-up: the complete official Git tree for the pinned libjxl commit identifies `third_party/highway` as gitlink `457c891775a7397bdb0376bb1031e6e027af1c48`. The corresponding google/highway archive and three license/copyright files have been collected and independently rehashed. Evidence: `libjxl-git-tree.json` and `ffmpeg-highway-source.json`. No `.gitmodules`, DEPS or Cargo.lock was found in that archive; this limited metadata check is not proof that no other embedded third-party code exists.

## rav1e — reconstructed `cc` update candidate

`ffmpeg-build/scripts.d/50-rav1e.sh` runs `cargo update cc` before `cargo cinstall`. The pinned rav1e source starts at `cc 1.2.26`, so its original Cargo.lock alone does not show the build-time version. Official crates.io version metadata shows that `cc 1.5.1` was the newest non-yanked compatible release available by the BtbN FFmpeg build date, 2026-09-30; `cc 1.6.0` was published on 2026-10-03. The normalized `cc 1.5.1` manifest requires `find-msvc-tools 0.1.14` and `shlex 2.0.1`. Both were available by the build date. Their official crates.io checksums match the saved source archives, and the crate archives contain MIT and Apache-2.0 texts. The earlier lock's `jobserver 0.1.33` and `libc 0.2.172` satisfy the new `cc` requirements; Cargo's conservative package-specific update retains compatible locked transitive dependencies.

This gives a high-confidence reconstructed candidate: `cc 1.5.1`, `find-msvc-tools 0.1.14`, `jobserver 0.1.33`, `libc 0.2.172`, and `shlex 2.0.1`. It does not establish the exact effective lock used by the distributed binary: no post-update Cargo.lock, vendor directory, or build log was preserved. Evidence and source archive paths are recorded in `rav1e-cc-update-evidence.json`; the candidate archives are indexed in `collected-source-index.json`. Build-time tool sources are not evidence that those tools are incorporated into FFmpeg's runtime binary.

## librsvg

`ffmpeg-build/scripts.d/50-librsvg/99-librsvg.sh` runs `cargo vendor --versioned-dirs` during download and builds offline afterward. The full registry source set and effective lockfile need preservation. The build disables tests, documentation, introspection and the conversion tool; its two gir-related submodules must not automatically be counted as shipped runtime libraries.

## Packaging consequence

## 2026-10-18 additional verification

The extra-source manifest now contains fourteen archives and twenty-four standalone license files, independently rehashed after the interrupted collection. This includes OpenCL-ICD-Loader, SDK 13 nv-codec-headers, publicsuffix/list, both zimg submodules and all six libplacebo submodules. `zimg-git-tree.json` and `libplacebo-git-tree.json` preserve official fixed-parent gitlink evidence. The latter includes Nuklear for demos even though the FFmpeg recipe disables demos: collection is intentionally broader than shipped code.

SDK 13 nv-codec-headers has no standalone license file. Its copyright/permission statements are embedded at the start of individual headers and are preserved separately as `embeddedHeaderNotices` in `ffmpeg-extra-sources.json`. Do not infer that absence of a LICENSE file means absence of licensing terms. The build recipe selects SDK 13 for FFmpeg versions 800–801; SDK 11.1 is the older branch and is not selected for this 8.1 build. Final binary/build correspondence remains to be established.

Additional review: Vulkan-Shim-Loader's recipe overrides the submodule with Vulkan-Headers `v1.4.363`; use that recipe revision, not the parent gitlink. libbluray explicitly depends on the separate `45-libudfread.sh` build. Neither was present in the 57-entry direct-source index. Other `SCRIPT_REPO2` entries exist for gnulib, OpenCL-ICD-Loader, alternate nv-codec-headers and publicsuffix/list; enabled build conditions and archive coverage still need checking.

Collection follow-up: Vulkan-Headers v1.4.363, libudfread b0bc6957e7e07d5f35391f210596d9eb71cffdd9 and gnulib eb72eb6f75f5621c5d648acd11467fd124584617 have been collected with nine embedded license files, all independently rehashed. See `ffmpeg-extra-sources.json`. Official GitHub tag evidence resolves Vulkan-Headers v1.4.363 to commit 6802bb4733b63ed5efd3adb308a6c885ef180ea1 (`vulkan-headers-tag-evidence.json`). The gnulib URL is the mirror explicitly selected by the captured libiconv recipe.

librsvg follow-up: all 357 registry archives from the pinned repository lockfile were downloaded and independently checked against their Cargo.lock SHA-256 values. Embedded license files were also rehashed. See `ffmpeg-librsvg-registry-sources.json` and `ffmpeg-librsvg-license-gaps.json`. This is the full lockfile candidate set, including non-shipped dependencies; effective vendor/build correspondence remains unverified.

Of the thirteen librsvg candidate packages without embedded license files, upstream files were retrieved at recorded commits for three; ten remain unresolved. See `ffmpeg-librsvg-upstream-licenses.json`. Retrieval alone is not a final license applicability determination. Resolve the target/build dependency graph before treating platform-specific or test-only candidates as shipped components.

2026-10-18 supplement: three of those ten now have additional documentary evidence. Both r-efi versions store the complete MIT permission text and copyright holders in `AUTHORS`, which the filename-based collector missed; those files are preserved verbatim in `r-efi-license-supplement.json`. selectors 0.40.0 explicitly references MPL 2.0 in its original lib.rs header; the header and Mozilla's canonical full license are preserved in `selectors-license-supplement.json`. Seven original candidates still lack equivalent full license evidence. The earlier raw discovery reports are retained, not silently rewritten as if upstream retrieval had succeeded.

Windows follow-up: the Windows GNU normal/build dependency graph reaches only winapi-x86_64-pc-windows-gnu among those seven. Its 0.4.0 package corresponds byte for byte to all 1,419 compared files under the official upstream commit 9497609ef44cc9bcd16cd2411c0ee6ccaf5483aa (excluding Cargo's generated normalized manifest). That source archive includes 1,404 definition files and the original project MIT/Apache license texts. See `winapi-gnu-exact-source-comparison.json`. The initially tried 0.3.9 tag did not match and is retained only as failed comparison evidence. This closes the missing upstream-license/source identification for this candidate, without claiming a rebuilt import library or proof of the FFmpeg binary's final linkage.

License files added by this collection postdate the candidate installer recorded in `../testing/packaged-candidate-2026-10-17.md`. Rebuild and revalidate resource equality after material collection is finalized; the existing installer does not contain these additions.
