"""Regression: preserved MIT templates must not disappear from attribution gaps."""
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class AttributionGapTests(unittest.TestCase):
    def test_regeneration_keeps_packages_with_text_but_unverified_attribution(self):
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            (root / 'scripts').mkdir()
            reports = root / 'docs/release'
            reports.mkdir(parents=True)
            script = 'audit-deno-mit-copyright-gaps.py'
            shutil.copyfile(ROOT / 'scripts' / script, root / 'scripts' / script)
            for name in ('deno-windows-license-reconciliation.json',
                         'deno-registry-sources.json',
                         'deno-windows-license-crate-metadata.json',
                         'deno-mit-author-license-supplements.json'):
                shutil.copyfile(ROOT / 'docs/release' / name, reports / name)
            supplements = json.loads((reports / 'deno-mit-author-license-supplements.json').read_text())
            for item in supplements['packages']:
                target = root / item['registryArchive']
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / item['registryArchive'], target)
            result = subprocess.run([sys.executable, str(root / 'scripts' / script)],
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            gaps = json.loads((reports / 'deno-mit-copyright-gaps.json').read_text())
            expected = {item['package'] for item in supplements['packages']}
            self.assertEqual({item['package'] for item in gaps['packages']}, expected)
            self.assertGreater(len(expected), 0)


if __name__ == '__main__':
    unittest.main()
