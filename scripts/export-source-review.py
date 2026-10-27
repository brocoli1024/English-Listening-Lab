"""Export a text-only review snapshot; never an installer or runnable distribution."""
import datetime
import hashlib
import json
import pathlib
import re
import subprocess
import zipfile

ROOT_FILES = {
    'App.tsx', 'package.json', 'package-lock.json', 'app.json', 'tsconfig.json',
    'metro.config.js', 'eslint.config.js', 'jest.config.js', 'electron-builder.yml',
    'LICENSE', 'THIRD_PARTY_NOTICES.md', 'MICROSOFT_RUNTIME_TERMS.txt', 'PRIVACY.md',
    'README.md', '.gitignore', '.gitattributes', 'AGENTS.md', 'docs/source-sharing.md',
}
SUFFIXES = {'.ts', '.tsx', '.js', '.cjs', '.mjs', '.json', '.py', '.sh', '.nsh'}
REVIEW = '''# 原始碼檢視包

這是目前工作目錄的文字原始碼快照，保留 YouTube、本機匯入與桌面功能程式碼。
不含執行檔、教材、圖片、私人匯入資料、Git 歷史、CI workflow、依賴快取或內部查核檔。
素材和部分建置證據刻意省略，因此本包不是可直接執行、測試或完整重建的產品。
請直接閱讀程式碼；不要把內附本機建置腳本當成已核准的產品發布方式。

入口：App.tsx → src/screens；桌面橋接：desktop/main.cjs、preload.cjs、ipc.cjs；
下載流程：desktop/jobs.cjs；本機教材：src/services/localFiles*、importedSongs.ts。

SOURCE_MANIFEST.json 列出本包所有其他檔案的 SHA-256；它不是數位簽章。
LICENSE、第三方通知及 Microsoft 條款保留原文，歷史產品說明不代表相關二進位已附入。
新增且未另獲較廣授權的原創內容限個人檢視與非商業本機建置，詳見 LICENSE。
既有 MIT、第三方及 GitHub 平台權利保留；本包不授予平台下載許可。
分享本 ZIP 不需要邀請對方存取原儲存庫；原儲存庫的舊 Actions 附件不屬本包。
'''


def allowed(name):
    parts = pathlib.PurePosixPath(name).parts
    if not parts or '\\' in name or ':' in name or any(p in {'.', '..'} for p in parts):
        return False
    if name in ROOT_FILES:
        return True
    if parts[0] not in {'src', 'desktop', 'scripts'}:
        return False
    if any(p.startswith('.') or p in {'vendor', 'node_modules', '__pycache__', 'sources'} for p in parts):
        return False
    return pathlib.PurePosixPath(name).suffix in SUFFIXES


def export(root, target, candidates):
    root = root.resolve()
    payload = {'REVIEW.md': REVIEW.encode('utf-8')}
    for name in sorted(set(candidates)):
        if not allowed(name):
            continue
        file = root / name
        # Refuse symlinks/junctions, including intermediate directory components.
        for item in [file, *file.parents]:
            if item == root:
                break
            if item.is_symlink() or item.is_junction():
                raise ValueError(f'Linked path excluded: {name}')
        if not file.resolve().is_relative_to(root) or not file.is_file():
            raise ValueError(f'Invalid source path: {name}')
        data = file.read_bytes()
        if data.startswith((b'MZ', b'PK\x03\x04', b'\x7fELF', b'\x1f\x8b')) or b'\x00' in data:
            raise ValueError(f'Binary content rejected: {name}')
        text = data.decode('utf-8-sig')
        if re.search(r'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\s+[A-Za-z0-9+/=]{20,}', text):
            raise ValueError(f'Credential pattern rejected in: {name}')
        payload[name] = data
    manifest = {'purpose': 'source-review-only', 'runnable': False, 'files': [
        {'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
        for name, data in sorted(payload.items())]}
    payload['SOURCE_MANIFEST.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    target.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(target, 'x', compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in sorted(payload.items()):
            archive.writestr(name, data)
    with zipfile.ZipFile(target) as archive:
        if set(archive.namelist()) != set(payload) or archive.testzip() is not None:
            raise ValueError('Archive verification failed')
        for name, data in payload.items():
            if archive.read(name) != data:
                raise ValueError(f'Archive content mismatch: {name}')
    return manifest


if __name__ == '__main__':
    root = pathlib.Path(__file__).resolve().parents[1]
    candidates = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=root).decode('utf-8').split('\0')
    version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
    if not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise ValueError('Invalid version')
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    target = root / 'source-review' / f'English-Listening-Lab-{version}-source-review-{stamp}.zip'
    result = export(root, target, filter(None, candidates))
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    target.with_suffix('.zip.sha256').write_text(f'{digest}  {target.name}\n', encoding='utf-8')
    print(json.dumps({'archive': str(target), 'files': len(result['files']) + 1, 'bytes': target.stat().st_size, 'sha256': digest}, indent=2))
