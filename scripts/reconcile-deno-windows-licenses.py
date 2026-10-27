"""Reconcile Deno Windows license gaps with later preserved supplements."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / 'docs' / 'release'


def read(name):
    return json.loads((REPORTS / name).read_text(encoding='utf-8-sig'))


def package_id(value):
    match = re.match(r'^(.*)-(\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?)$', value)
    return (match.group(1).lower(), match.group(2)) if match else None


windows = read('deno-windows-dependency-graph.json')['packages']
windows_by_id = {(p['name'].lower(), p['version']): p for p in windows}
retrievals = read('deno-upstream-licenses.json')
raw_gaps = [p for p in retrievals if not p.get('retrieved') and package_id(p['name']) in windows_by_id]

supplements = {}

def cover(name, evidence, status='full-license-text-preserved'):
    if package_id(name) in windows_by_id:
        supplements[name] = {'package': name, 'status': status, 'evidence': evidence}


for item in read('deno-embedded-license-supplements.json'):
    cover(item['package'], item['path'])

for item in read('deno-source-header-license-supplements.json')['packages']:
    cover(item['package'], item['licenseTextPath'],
          'canonical-MIT-full-text; copyright notice copied from checksum-verified crate source header')

for item in read('deno-apache-license-supplements.json')['packages']:
    cover(item['package'], item['licenseTextPath'],
          'canonical-Apache-2.0-full-text; package declares MIT OR Apache-2.0; Apache option selected')

for item in read('deno-mit-author-license-supplements.json')['packages']:
    cover(item['package'], item['licenseTextPath'],
          'canonical-MIT-full-text; copyright attribution unresolved; contributor metadata is not asserted as ownership')

for item in read('deno-inferred-repo-license-evidence.json')['results']:
    if item.get('path'):
        cover(item['package'], item['path'], 'fixed-commit-license-text; repository identity inferred from package family')

for item in read('zune-license-supplement.json'):
    path = item.get('path', '')
    if 'zune-core-0.4.12' in path:
        cover('zune-core-0.4.12', path, 'fixed-commit-license-text; crate-to-repository source identity reviewed')

for item in read('swc-embedded-notices.json')['packages']:
    cover(item['package'], 'docs/release/licenses/deno-swc-headers/APACHE-2.0.txt',
          'canonical-Apache-2.0-text; crate checksum and manifest verified; embedded notices separately inventoried')

swc_notice_checks = read('deno-swc-notice-check.json')
smartstring = next((x for x in read('deno-embedded-license-supplements.json') if x['package'] == 'smartstring-1.0.1'), None)
if smartstring:
    cover('smartstring-1.0.1', smartstring['path'], 'complete-MPL-2.0-text from verified registry source; author attribution in crate README')

# CC0 has no per-package copyright notice requirement; the complete canonical
# legal code is sufficient once the checksum-verified crate declares CC0-1.0.
cover('hexf-parse-0.2.1', 'docs/release/licenses/spdx-canonical/CC0-1.0.txt',
      'canonical-CC0-1.0-legal-code; registry checksum and declared license verified')

raw_gap_names = {item['name'] for item in raw_gaps}
covered = set(supplements).intersection(raw_gap_names)
unresolved = []
for item in raw_gaps:
    name = item['name']
    if name in covered:
        continue
    pkg = windows_by_id[package_id(name)]
    unresolved.append({'package': name, 'declaredLicense': item.get('license'),
                       'repository': item.get('repository'), 'vcs': item.get('vcs'),
                       'windowsGraphLicense': pkg.get('license')})

swc_notice_status = {
    'commitCountChecked': len(swc_notice_checks),
    'noticeFilesFound': sum(1 for x in swc_notice_checks if x.get('status') == 'found'),
    'noticeFilesNotPresent': sum(1 for x in swc_notice_checks if x.get('status') == 'not-present'),
    'requestFailures': [x for x in swc_notice_checks if x.get('status') == 'request-failed'],
    'scope': 'Root NOTICE was checked at each distinct fixed SWC commit represented in the Windows gap set. The crate archives were separately checksum-verified against Deno Cargo.lock. This is not a full embedded-code notice audit.'
}

result = {
    'asOf': '2026-10-19',
    'scope': 'Reconciliation of the earlier 905-package Windows Deno candidate graph. It includes build dependencies and workspace feature-unification over-approximation; it is not a binary linkage SBOM.',
    'graphCandidateCount': len(windows),
    'rawWindowsGapsWithoutUpstreamFile': len(raw_gaps),
    'upstreamFilesPreviouslyRetrievedForWindowsGraph': sum(
        1 for p in retrievals if p.get('retrieved') and package_id(p['name']) in windows_by_id),
    'supplementalLicenseTextArtifactCount': len(covered),
    'remainingWithoutPreservedFullLicenseText': len(unresolved),
    'unverifiedMITCopyrightAttributionCount': len(read('deno-mit-author-license-supplements.json')['packages']),
    'remainingWithUnverifiedCopyrightAttribution': len(unresolved) + len(read('deno-mit-author-license-supplements.json')['packages']),
    'supplementalEvidence': sorted(supplements.values(), key=lambda x: x['package']),
    'remainingPackages': sorted(unresolved, key=lambda x: x['package']),
    'swcNoticeCheck': swc_notice_status,
    'limitations': [
        'A standard license text does not prove the exact binary linkage or complete embedded third-party notice inventory.',
        'Unresolved MIT texts preserve the SPDX copyright placeholder because package authors or Git commit authors are contributor metadata, not proof of copyright ownership.',
        'SWC packages use checksum-verified registry archives; the standard Apache-2.0 text is supplied separately, with detected source headers preserved. Root NOTICE was absent at the 13 fixed SWC commits checked.',
        'Unresolved packages may be build-only or workspace-unified candidates, but require dependency-graph evidence before exclusion.'
    ]
}
(REPORTS / 'deno-windows-license-reconciliation.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps({k: result[k] for k in ('graphCandidateCount', 'rawWindowsGapsWithoutUpstreamFile',
                                         'upstreamFilesPreviouslyRetrievedForWindowsGraph',
                                         'supplementalLicenseTextArtifactCount',
                                         'remainingWithoutPreservedFullLicenseText')}, ensure_ascii=False))
