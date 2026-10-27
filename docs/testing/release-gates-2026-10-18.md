# Windows public release gates — 2026-10-18

This supersedes the current-status portions of the October 16 assessment. Historical test results remain scoped to their recorded builds. Public release is not complete.

| Gate | Current evidence | Remaining proof/action |
| --- | --- | --- |
| Product and local data | LRC compatibility and imported-song deletion implemented; 45 application and 18 desktop tests passed before the October 17 candidate. Backup/restore and packaged restart records exist. | Verify the final rebuilt installer and different-version upgrade. Existing runs do not establish clean-machine behavior. |
| Third-party materials | Pinned archives, native-source records, registry checksums and notice supplements under docs/release. SWC registry sources match Cargo.lock; unavailable Git history is not a missing registry archive. | Reconcile exact distributable attachment inventory; close FFmpeg effective build dependencies (including rav1e's build-time cc update), Deno/V8 native notices, and remaining license evidence. Review source notices, not only filenames. |
| Security and build | Compatible dependency updates removed the prior critical audit entry; no force downgrade performed. | Assess remaining advisory packages against packaged runtime/build use. Produce a clean-checkout build. No claim of zero vulnerabilities. |
| Publishing | User supplied brocoli1024/English-Listening-Lab and MIT attribution. Local Git has no remote. Workflow builds but only uploads private-repository artifacts and has no Release step. | Review the staged/public file inventory, establish repository/remote, commit/tag, successful CI, final installer/hash/source attachments and release notes. Do not expose private audio, lyrics, test profiles or downloaded build caches. |
| User handoff | Manual installation and backup instructions exist. | Finalize version/help/license/update entry points and supported Windows environment; complete clean Windows x64 and upgrade acceptance. Signature is optional for this first release if accurately disclosed; do not recommend disabling protection. |

## Candidate limitations

The October 17 installer predates subsequent notice additions. Rebuild only after the relevant material changes are finalized, then rerun package-resource comparison and installer tests. `release/third-party-sources.tar.gz` is still a partial main-source archive; its filename is not evidence of completeness.

## SWC notice review

The full-text candidate scan found twelve files with copyright/license markers: eleven original Rust header blocks already preserved and one core-js excerpt inside `#[cfg(test)] mod tests` (`fixer.rs`, issue_286). The latter has now been preserved as an original test-fixture notice in `swc-test-notice.json`. The scan skips binary files and files over 2 MB and is not a general legal or embedded-code audit.

## Execution priority

1. Reconcile the third-party material inventories into explicit remaining items, without reclassifying unavailable optional Git history as missing locked registry source.
2. In parallel in the work plan, complete remaining runtime-advisory assessment and final user-facing release information; these do not depend on further source downloads.
3. Build the final candidate from a reviewed clean checkout, run installation/upgrade/restore checks, and publish the verified release artifacts to the requested repository.
