# LRC compatibility fix — 2026-10-16

Scope: existing import parser; no library migration or changes to saved songs.

- Accept standalone named metadata including provider ID/custom tags.
- Parse signed integer millisecond offsets with whitespace; reject malformed values with source line numbers.
- Omit only an opening zero-time artist/title credit matching both ar and ti metadata (case/whitespace normalized). Preserve title-only lyrics, later repetitions, unconfirmed text and TXT behavior.
- Preserve original line numbers in timestamp errors.

Verification: three new regression cases failed against the old parser, then all 41 Jest tests passed after the fix. The user's original, unmodified local LRC parsed into 73 lyric lines, starting at 29.77 seconds with the offset applied. Commercial lyrics were not copied into test fixtures. Desktop frontend export succeeded; installer and quality checks tracked in this turn.

Limit: this is conservative header recognition, not arbitrary lyric editing or universal LRC support. Files without matching artist/title metadata retain their opening text. Existing saved songs require re-import to apply new parsing rules.

Final quality checks: TypeScript and ESLint passed. The original LRC verification used the real shared parser, without modifying the source file or importing any song into the user's library.
Installer rebuilt successfully: release/English-Listening-Lab-1.0.0-Setup.exe. Package inventory and binary hashes passed; installer SHA-256 regenerated. Packaged frontend bytes match the freshly exported bundle. Installer remains the existing unsigned local review build (1.0.0); no public publication or fresh installation test was performed in this change.

Installed-app acceptance: installed the rebuilt installer into desktop/.test-data/lrc-install (exit 0), launched its actual executable with an isolated profile, fed the unchanged user LRC through the file-input import path, and verified the rendered 73-line preview with no title credit. No audio was selected and no song was saved; this test does not verify audio synchronization. Screenshot: desktop/.test-data/lrc-acceptance/packaged.png. The test application was closed. Formal user profile was not used.
