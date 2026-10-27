"""Fetch notices from pinned rusty_v8 submodules; retain unresolved entries."""
import base64, concurrent.futures, configparser, hashlib, json, pathlib, urllib.request
from v8_license_inventory import license_candidates
ROOT=pathlib.Path(__file__).resolve().parents[1]
CACHE=ROOT/'desktop/.downloads/compliance'
OUT=ROOT/'docs/release'
config=configparser.ConfigParser()
config.read(CACHE/'rusty-v8-gitmodules')
urls={config[s]['path']:config[s]['url'].removesuffix('.git') for s in config.sections()}
tree=json.loads((CACHE/'rusty-v8-tree-recursive.json').read_text())
assert not tree.get('truncated'), 'Incomplete tree'

def fetch(url):
    with urllib.request.urlopen(url,timeout=25) as r:
        return r.read()

def collect(entry):
    path,sha=entry['path'],entry['sha']
    repo=urls[path]
    result={'path':path,'commit':sha,'repository':repo,'treeScan':'recursive' if repo.startswith('https://github.com/') else 'root-only','licenses':[]}
    try:
        if repo.startswith('https://github.com/'):
            tree=json.loads(fetch(repo.replace('https://github.com/','https://api.github.com/repos/')+'/git/trees/'+sha+'?recursive=1'))
            if tree.get('truncated'):
                raise RuntimeError('GitHub recursive tree is truncated')
            names=license_candidates(tree['tree'])
        else:
            files=json.loads(fetch(repo+'/+/'+sha+'/?format=JSON')[4:])['entries']
            names=license_candidates([{'path':x['name'],'type':x['type']} for x in files])
        for name in names:
            if repo.startswith('https://github.com/'):
                url=repo.replace('https://github.com/','https://raw.githubusercontent.com/')+'/'+sha+'/'+name
                data=fetch(url)
            else:
                url=repo+'/+/'+sha+'/'+name+'?format=TEXT'
                data=base64.b64decode(fetch(url))
            dest=OUT/'licenses/deno-v8-submodules'/path/name
            dest.parent.mkdir(parents=True,exist_ok=True); dest.write_bytes(data)
            result['licenses'].append({'url':url,'path':dest.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(data).hexdigest()})
    except Exception as error:
        result['error']=str(error)
    return result

entries=[x for x in tree['tree'] if x['mode']=='160000']
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results=list(pool.map(collect,entries))
(OUT/'deno-v8/submodule-licenses.json').write_text(json.dumps({'scope':'All source submodules, including build-only tools. GitHub trees are recursive; Gitiles trees are root-only. This is not a binary-linked SBOM or complete nested notice inventory.','complete':False,'submodules':results},indent=2)+'\n')
print('Submodules:',len(results),'with license candidates:',sum(bool(x['licenses']) for x in results))
for x in results:
    if not x['licenses']: print(x['path'],x.get('error','No root license file'))
