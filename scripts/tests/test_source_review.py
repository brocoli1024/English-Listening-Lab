import importlib.util
import pathlib
import tempfile
import unittest
import zipfile
import json
import hashlib

SPEC = importlib.util.spec_from_file_location('source_review', pathlib.Path(__file__).parents[1] / 'export-source-review.py')
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class SourceReviewTests(unittest.TestCase):
    def test_allowlist_excludes_materials_tools_workflows_and_history(self):
        for name in ['src/screens/SetupScreen.tsx', 'desktop/jobs.cjs', 'scripts/build-ffmpeg.py', 'LICENSE', 'package.json']:
            self.assertTrue(module.allowed(name), name)
        for name in ['assets/audio/private.wav', 'assets/lyrics/private.lrc', '.github/workflows/build.yml', '.git/config', 'desktop/vendor/yt-dlp.exe', 'src/private.mp3', 'src/cookies.txt', 'docs/release/evidence.json', 'src/.env', 'release/setup.exe', 'src/../private.ts']:
            self.assertFalse(module.allowed(name), name)

    def test_archive_has_exact_manifest_and_preserves_code(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / 'src').mkdir()
            code = b'export const feature = true;\n'
            (root / 'src/feature.ts').write_bytes(code)
            (root / 'src/private.mp3').write_bytes(b'private material')
            target = root / 'review.zip'
            module.export(root, target, ['src/feature.ts', 'src/private.mp3'])
            with zipfile.ZipFile(target) as archive:
                self.assertEqual(set(archive.namelist()), {'src/feature.ts', 'REVIEW.md', 'SOURCE_MANIFEST.json'})
                self.assertEqual(archive.read('src/feature.ts'), code)
                manifest = json.loads(archive.read('SOURCE_MANIFEST.json'))
                for item in manifest['files']:
                    self.assertEqual(hashlib.sha256(archive.read(item['path'])).hexdigest(), item['sha256'])
            with self.assertRaises(FileExistsError):
                module.export(root, target, ['src/feature.ts'])

    def test_disguised_binary_or_credential_stops_export(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / 'src').mkdir()
            for content in [b'MZbinary', b'PK\x03\x04archive', b'\x00binary', b'github_pat_' + b'a' * 60]:
                (root / 'src/feature.ts').write_bytes(content)
                with self.assertRaises(ValueError):
                    module.export(root, root / 'review.zip', ['src/feature.ts'])
                self.assertFalse((root / 'review.zip').exists())


if __name__ == '__main__':
    unittest.main()
