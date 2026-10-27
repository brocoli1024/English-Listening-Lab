"""Record checksum-verified author metadata and missing package license files."""
import hashlib
import json
import pathlib
import re
import tarfile
import tomllib

ROOT = pathlib.Path(__file__).resolve().parents[1]
REPORTS = ROOT / 'docs/release'
RECON = json.loads((REPORTS / 'deno-windows-license-reconciliation.json').read_text(encoding='utf-8'))
REGISTRY = json.loads((REPORTS / 'deno-registry-sources.json').read_text(encoding='utf-8'))
META = json.loads((REPORTS / 'deno-windows-license-crate-metadata.json').read_text(encoding='utf-8'))
ATTRIBUTIONS = json.loads((REPORTS / 'deno-mit-author-license-supplements.json').read_text(encoding='utf-8'))
registry_by_id = {(item['name'], item['version']): item for item in REGISTRY['packages']}
metadata_by_id = {(item['name'], item['version']): item for item in META['packages']}
pattern = re.compile(r'license|licence|copying|notice|copyright|authors|unlicense', re.I)
results = []

# Text coverage and attribution are separate gates. A preserved MIT template
# removes a text gap but must not erase an unresolved copyright notice.
pending = {item['package']: item for item in RECON['remainingPackages']
           if item.get('declaredLicense') == 'MIT'}
pending.update({item['package']: item for item in ATTRIBUTIONS['packages']
                if not item.get('copyrightLineWritten')})
for unresolved in sorted(pending.values(), key=lambda item: item['package']):
    name, version = unresolved['package'].rsplit('-', 1)
    registry = registry_by_id[(name, version)]
    metadata = metadata_by_id[(name, version)]
    archive_path = ROOT / 'desktop/.downloads/compliance/deno-crates' / f'{name}-{version}.crate'
    archive_sha = hashlib.sha256(archive_path.read_bytes()).hexdigest()
    if archive_sha != registry['checksum'] or not registry.get('verified'):
        raise SystemExit(f'Checksum is not verified for {name}-{version}')
    package_root = f'{name}-{version}/'
    with tarfile.open(archive_path) as archive:
        manifest = tomllib.loads(archive.extractfile(package_root + 'Cargo.toml.orig').read().decode('utf-8'))['package']
        files = [member.name for member in archive.getmembers()
                 if member.isfile() and member.name.startswith(package_root)
                 and pattern.search(pathlib.PurePosixPath(member.name).name)]
        vcs = json.loads(archive.extractfile(package_root + '.cargo_vcs_info.json').read().decode('utf-8')) if any(
            member.name == package_root + '.cargo_vcs_info.json' for member in archive.getmembers()) else None
    results.append({
        'package': unresolved['package'],
        'declaredLicense': unresolved['declaredLicense'],
        'registryArchive': archive_path.relative_to(ROOT).as_posix(),
        'registryArchiveSha256': archive_sha,
        'publishedAt': metadata['publishedAt'],
        'repositoryMetadata': metadata.get('repository'),
        'packageAuthorsMetadata': manifest.get('authors'),
        'cargoVcsInfo': vcs,
        'licenseOrAttributionNamedFilesInCrate': files,
        'copyrightEvidenceStatus': 'unresolved; Cargo authors metadata is recorded as authorship metadata only and is not treated as a copyright notice',
    })

out = {
    'asOf': '2026-10-19',
    'scope': 'Remaining Deno Windows normal-dependency candidates declaring MIT; exact registry archives are verified, while copyright holders are not asserted from author metadata.',
    'packages': results,
}
(REPORTS / 'deno-mit-copyright-gaps.json').write_text(json.dumps(out, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'packages': len(results), 'withManifestAuthors': sum(bool(x['packageAuthorsMetadata']) for x in results)}))
