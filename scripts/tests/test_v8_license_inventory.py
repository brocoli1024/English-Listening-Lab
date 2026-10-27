import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from v8_license_inventory import license_candidates


class LicenseCandidatesTests(unittest.TestCase):
    def test_keeps_nested_license_paths_from_recursive_tree(self):
        entries = [
            {"path": "README.md", "type": "blob"},
            {"path": "android/third_party/Library/LICENSE", "type": "blob"},
            {"path": "android/third_party/Library/NOTICE.chromium", "type": "blob"},
            {"path": "android/third_party/Library", "type": "tree"},
        ]

        self.assertEqual(
            license_candidates(entries),
            [
                "android/third_party/Library/LICENSE",
                "android/third_party/Library/NOTICE.chromium",
            ],
        )


if __name__ == "__main__":
    unittest.main()
