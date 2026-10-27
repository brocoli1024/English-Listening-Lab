"""Preserve the Apache-2.0 option for Deno crates declaring dual licensing."""
import hashlib
import json
import pathlib
import shutil

ROOT = pathlib.Path(__file__).resolve().parents[1]
REPORTS = ROOT / 'docs/release'
PACKAGES = ['derive-io-0.4.1', 'derive-io-macros-0.4.1', 'sptr-0.3.2']
SOURCE_LICENSE = REPORTS / 'licenses/deno-swc-headers/APACHE-2.0.txt'
REGISTRY = json.loads((REPORTS / 'deno-registry-sources.json').read_text(encoding='utf-8'))
results = []

for package in PACKAGES:
    name, version = package.rsplit('-', 1)
    record = next(item for item in REGISTRY['packages']
                  if item['name'] == name and item['version'] == version)
    if not record.get('verified') or record.get('declaredLicense') != 'MIT OR Apache-2.0':
        raise SystemExit(f'Unexpected registry verification or license expression for {package}')
    destination = REPORTS / 'licenses/deno-embedded' / package / 'LICENSE-APACHE'
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SOURCE_LICENSE, destination)
    results.append({
        'package': package,
        'declaredLicense': record['declaredLicense'],
        'selectedLicenseOption': 'Apache-2.0',
        'registryArchive': f'desktop/.downloads/compliance/deno-crates/{package}.crate',
        'registryArchiveSha256': record['checksum'],
        'vcsEvidence': record.get('vcs'),
        'licenseTextPath': destination.relative_to(ROOT).as_posix(),
        'licenseTextSha256': hashlib.sha256(destination.read_bytes()).hexdigest(),
        'licenseTextBasis': 'Complete Apache-2.0 text copied from the preserved canonical Apache text; selected because the checksum-verified package declares MIT OR Apache-2.0.',
        'attributionCaveat': 'The crate and fixed source tree contain no package-specific LICENSE/NOTICE file in the recorded scan. This adds the chosen standard license text but does not infer a copyright owner or prove final binary linkage.',
    })

out = {
    'asOf': '2026-10-19',
    'scope': 'Standard Apache-2.0 option for dual-licensed Deno dependencies; preserves declared option and avoids inventing package copyright lines.',
    'canonicalLicenseSource': SOURCE_LICENSE.relative_to(ROOT).as_posix(),
    'packages': results,
}
(REPORTS / 'deno-apache-license-supplements.json').write_text(
    json.dumps(out, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'packages': len(results), 'sha256': hashlib.sha256(SOURCE_LICENSE.read_bytes()).hexdigest()}))
