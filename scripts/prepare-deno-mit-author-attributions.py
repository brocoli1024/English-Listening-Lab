"""Preserve provisional MIT templates while recording attribution gaps explicitly."""
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
REPORTS = ROOT / 'docs/release'
CANONICAL = REPORTS / 'licenses/spdx-canonical/MIT.txt'
GAPS = json.loads((REPORTS / 'deno-mit-copyright-gaps.json').read_text(encoding='utf-8'))
KNOWN_AUTHORS = json.loads((REPORTS / 'deno-mit-author-license-supplements.json').read_text(encoding='utf-8'))
COMMITS = json.loads((REPORTS / 'deno-sys-traits-commit-author-evidence.json').read_text(encoding='utf-8'))
commit_by_package = {item['package']: item for item in COMMITS['packages']}
canonical = CANONICAL.read_text(encoding='utf-8')
marker = 'Copyright (c) <year> <copyright holders>'
if canonical.count(marker) != 1:
    raise SystemExit('Unexpected SPDX MIT template; refusing to rewrite it')

results = []
items_by_package = {item['package']: item for item in KNOWN_AUTHORS['packages']}
items_by_package.update({item['package']: item for item in GAPS['packages']})
for item in items_by_package.values():
    authors = item.get('packageAuthorsMetadata')
    attribution = []
    if authors:
        for author in authors:
            name = re.sub(r'\s*<[^>]*>\s*$', '', author).strip()
            if not name:
                raise SystemExit(f'Cannot derive a name from {author!r}')
            attribution.append(name)
        attribution_basis = 'Cargo.toml.orig authors metadata'
        archive_path = item['registryArchive']
        archive_sha = item['registryArchiveSha256']
    else:
        commit = commit_by_package.get(item['package'])
        if not commit:
            continue
        attribution = [commit['commitAuthorName']]
        attribution_basis = 'GitHub author metadata for the exact Cargo VCS commit'
        archive_path = item['registryArchive']
        archive_sha = item['registryArchiveSha256']
    # Cargo authors and commit authors are contributors, not verified
    # copyright holders. Keep the SPDX placeholder until a real notice is
    # found; do not publish an inferred copyright statement as fact.
    text = canonical
    package = item['package']
    path = REPORTS / 'licenses/deno-embedded' / package / 'LICENSE-MIT'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')
    results.append({
        'package': package,
        'declaredLicense': 'MIT',
        'packageAuthorsMetadata': authors,
        'copyrightLineWritten': None,
        'licenseTextPath': path.relative_to(ROOT).as_posix(),
        'licenseTextSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'licenseTextBasis': 'SPDX canonical MIT full text; copyright holder remains unverified, so the SPDX placeholder is preserved.',
        'attributionStatus': 'provisional; contributor metadata does not independently establish copyright ownership or years',
        'attributionEvidence': attribution_basis,
        'contributorMetadata': attribution,
        'registryArchive': archive_path,
        'registryArchiveSha256': archive_sha,
        'commitEvidence': commit_by_package.get(item['package']),
    })

out = {
    'asOf': '2026-10-19',
    'scope': 'Canonical MIT texts for checksum-verified crates with unresolved copyright attribution; contributor metadata is recorded separately and not asserted as ownership.',
    'canonicalLicenseSource': CANONICAL.relative_to(ROOT).as_posix(),
    'packages': results,
    'limitation': 'These provisional license texts preserve the SPDX copyright placeholder because Cargo authors and Git commit author fields identify contributors, not copyright holders. Obtain authoritative copyright attribution before release.',
}
(REPORTS / 'deno-mit-author-license-supplements.json').write_text(
    json.dumps(out, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'packages': len(results)}))
