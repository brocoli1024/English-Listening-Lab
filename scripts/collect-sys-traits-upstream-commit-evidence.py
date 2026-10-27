"""Preserve GitHub commit metadata linked by sys_traits Cargo VCS records."""
import hashlib
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
REPORT = ROOT / 'docs/release/deno-mit-copyright-gaps.json'
OUT = ROOT / 'docs/release/deno-sys-traits-commit-author-evidence.json'
gaps = json.loads(REPORT.read_text(encoding='utf-8'))
targets = [item for item in gaps['packages'] if item['package'] in (
    'sys_traits-0.1.28', 'sys_traits_macros-0.1.0')]
results = []
for item in targets:
    vcs = item.get('cargoVcsInfo')
    if not vcs:
        raise SystemExit(f'Missing Cargo VCS evidence for {item["package"]}')
    commit = vcs['git']['sha1']
    url = f'https://api.github.com/repos/dsherret/sys_traits/commits/{commit}'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'English-Listening-Lab-release-audit',
        'Accept': 'application/vnd.github+json',
    })
    with urllib.request.urlopen(req, timeout=45) as response:
        payload = response.read()
    data = json.loads(payload)
    cache = ROOT / 'desktop/.downloads/compliance' / f'sys_traits-commit-{commit}.json'
    cache.write_bytes(payload)
    results.append({
        'package': item['package'],
        'crateVcs': vcs,
        'apiUrl': url,
        'cachedResponse': cache.relative_to(ROOT).as_posix(),
        'cachedResponseSha256': hashlib.sha256(payload).hexdigest(),
        'commitAuthorName': data['commit']['author']['name'],
        'commitAuthorDate': data['commit']['author']['date'],
        'commitMessage': data['commit']['message'].splitlines()[0],
        'githubAccount': (data.get('author') or {}).get('login'),
        'attributionCaveat': 'Commit author metadata is evidence of a contributor to the linked source revision, not conclusive proof of copyright ownership; the macro crate VCS record is marked dirty.',
    })

OUT.write_text(json.dumps({
    'asOf': '2026-10-19',
    'scope': 'GitHub commit authors for the exact revisions recorded in checksum-verified sys_traits crate archives.',
    'packages': results,
}, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'packages': len(results)}))
