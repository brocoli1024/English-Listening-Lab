"""Retrieve omitted license files at each crate's recorded upstream commit."""
import concurrent.futures, hashlib, json, pathlib, urllib.request, urllib.error
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT/'docs/release'
gaps = json.loads((OUT/'deno-license-gaps.json').read_text())

def collect(item):
    repo = (item.get('repository') or '').removesuffix('.git').rstrip('/')
    vcs = item.get('vcs') or {}
    commit = vcs.get('git', {}).get('sha1')
    result = dict(item, retrieved=[])
    if not repo.startswith('https://github.com/') or not commit:
        return result
    repo = '/'.join(repo.removeprefix('https://github.com/').split('/')[:2])
    sub = vcs.get('path_in_vcs','').strip('/')
    folders = [sub] if sub else []
    folders.append('')
    for folder in folders:
        found = False
        for filename in ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENSE-MIT', 'LICENSE-APACHE', 'COPYING', 'COPYRIGHT']:
            rel = '/'.join(x for x in [folder,filename] if x)
            url = 'https://raw.githubusercontent.com/'+repo+'/'+commit+'/'+rel
            try:
                with urllib.request.urlopen(url,timeout=20) as response:
                    data = response.read()
                dest = OUT/'licenses/deno-upstream'/item['name']/filename
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
                result['retrieved'].append({'url':url,'path':dest.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(data).hexdigest()})
                found = True
            except (urllib.error.URLError, TimeoutError):
                pass
        if found:
            break
    return result

results = []
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for item in pool.map(collect,gaps):
        results.append(item)
        if len(results)%10 == 0:
            print('Checked',len(results),'/',len(gaps),flush=True)
(OUT/'deno-upstream-licenses.json').write_text(json.dumps(results,indent=2)+'\n')
print('Retrieved',sum(bool(x['retrieved']) for x in results),'Unresolved',sum(not x['retrieved'] for x in results),flush=True)
