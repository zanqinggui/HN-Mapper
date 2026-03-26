"""
Promote the prepared RU staging dataset to the default application dataset.

This keeps a backup of the current ru-products.json so the original 37-entry
seed database remains available for comparison.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


BASE = Path(__file__).resolve().parents[1]
SRC_DATA = BASE / "src" / "data"
RU_FILE = SRC_DATA / "ru-products.json"
STAGING_FILE = SRC_DATA / "ru-products.staging.json"
BACKUP_FILE = SRC_DATA / "ru-products.seed.json"
MANIFEST_FILE = SRC_DATA / "ru-products.meta.json"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    current = load_json(RU_FILE)
    staging = load_json(STAGING_FILE)

    if not isinstance(current, list) or not isinstance(staging, list):
        raise SystemExit("Current RU file and staging file must both be JSON arrays.")
    if len(staging) < len(current):
        raise SystemExit(f"Refusing to promote staging: staging has {len(staging)} rows, current has {len(current)}.")

    if not BACKUP_FILE.exists():
        dump_json(BACKUP_FILE, current)

    dump_json(RU_FILE, staging)

    manifest = {
        "promoted_at_utc": datetime.now(timezone.utc).isoformat(),
        "current_rows_before_promote": len(current),
        "rows_after_promote": len(staging),
        "backup_file": str(BACKUP_FILE),
        "source_file": str(STAGING_FILE),
    }
    dump_json(MANIFEST_FILE, manifest)

    print(f"backup -> {BACKUP_FILE}")
    print(f"promoted -> {RU_FILE}")
    print(f"rows: {len(current)} -> {len(staging)}")


if __name__ == "__main__":
    main()
