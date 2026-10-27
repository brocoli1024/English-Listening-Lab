# Desktop execution ledger

Plan: docs/superpowers/plans/2026-10-15-windows-desktop.md

User approved direct implementation on 2026-10-15.

Ruling: preserve the dirty workspace in place on codex/windows-desktop instead of copying a HEAD-only worktree — the current working files are the actual application and the user asked to modify it directly — this sacrifices filesystem isolation but avoids losing or hiding existing work. Test userData remains isolated.

Ruling: use this portable ledger instead of bash-only task helper scripts — Windows PowerShell workspace — task completion and verification are recorded here.

Shared interface: desktop/contracts.d.ts owns the renderer bridge; no Node or Electron imports in Expo code. Desktop tests use node:test separately from Expo Jest.

1. Desktop shell: implemented; actual isolated Electron startup, range audio playback and renderer reload persistence passed.
2. Pinned media tools: all four binaries verified and executed with PATH empty; source and build archives collected. Complete dependency source/relink materials remain outstanding.
3. YouTube metadata and captions: implemented; manual priority, rolling captions, repeated choruses and limits tested.
4. Download lifecycle: implemented; real subprocess timeout, cancellation including descendants, owner checks, inspection cancellation and retry tested.
5. Persistent desktop audio: implemented; durable copy, ID validation, rollback/retry tested.
6. Import UI: implemented; screenshot inspected; offline caption and missing-caption/manual TXT flows with real IPC and disk store passed.
7. Packaging and verification: NSIS review installer built, inventory verified, installed in a Chinese path with spaces, restart/reinstall persistence verified, then test installation uninstalled. Actual YouTube download -> MP3 conversion -> temporary cleanup passed on the Blender fixture. Public distribution is still blocked on complete third-party materials.

Ruling: reserve cancelYouTube('inspection') for owner-scoped metadata cancellation — inspection precedes a download job ID — shared contract gains a documented sentinel, avoiding an unbounded generic IPC method.

Ruling: no public release automation while complete corresponding third-party source/relink materials are missing — review installer must not be represented as distribution ready — GitHub distribution remains incomplete.

Ruling: download large fixed assets in eight HTTP ranges and verify the full SHA-256 — single connections timed out at about 50–70 KB/s — range support is validated before accepting bytes.

Independent review: first model hit its usage limit; fresh fallback reviewer completed read-only review. One important finding (inspection Cancel did not abort the backend) was reproduced by a failing regression test and fixed; test now passes. No other important/critical findings reported.

Additional regression: split UTF-8 process output corrupted Chinese metadata. Reproduced, fixed with streaming decoders, test passes.

Latest checks: 37 Jest tests passed; 17 desktop tests passed; typecheck/lint passed; Expo Web/Android/iOS export passed. Test profiles are under ignored desktop/.test-data. No tests wrote to the user's browser library.

Final review artifact: release/English-Listening-Lab-1.0.0-Setup.exe. This is a locally tested, unsigned review build; no remote push, merge, or public release was performed. Existing pre-desktop changes were preserved without bulk staging or committing them.

Remaining work: complete corresponding third-party dependency sources/relink materials before public binary distribution; test a live English-subtitle video; a future different-version upgrade needs separate verification. No other reviewer-reported minor findings were left open.
