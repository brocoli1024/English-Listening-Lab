"""Small, testable helpers for pinned V8 submodule license inventories."""


def license_candidates(tree_entries):
    prefixes = ("license", "copying", "notice", "copyright")
    paths = {
        entry["path"]
        for entry in tree_entries
        if entry.get("type") == "blob"
        and entry.get("path", "").rsplit("/", 1)[-1].lower().startswith(prefixes)
    }
    return sorted(paths)
