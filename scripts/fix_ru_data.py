"""
Apply high-confidence, name-derived fixes to RU source datasets.

This script updates:
- src/data/ru-products.json
- scripts/data/ru_missing_partial.json

It only edits fields that are explicit in the model name or covered by
project-level family conventions already used in the dataset:
- S1, S2, S3, S7, S10, S15, S16, S23, S26

It intentionally does not invent values for S11/S12/S14/... without source support.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


BASE = Path(__file__).resolve().parents[1]
SCRIPT_DATA = BASE / "scripts" / "data"
RU_FILE = BASE / "src" / "data" / "ru-products.json"
MISSING_FILE = SCRIPT_DATA / "ru_missing_partial.json"
MISSING_FIXED_FILE = SCRIPT_DATA / "ru_missing_partial.fixed.json"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def derive_fields(model: str) -> dict[str, Any]:
    s: dict[str, Any] = {}
    raw = model.strip()
    lower = raw.lower()

    is_fiber = raw.startswith("ОК") or "тбп" in lower
    is_swab = "Св" in raw
    is_heating = any(token in raw for token in ("нАП", "нМСП", "нАСП")) or lower.startswith("кнп")
    is_anti_corrosion = "оа" in lower
    is_coax = "1К" in raw

    core_match = re.search(r"(\d+)\s*[хx×_]\s*(\d+[,.]?\d*)", raw)
    if core_match:
        s["S2"] = int(core_match.group(1))
        s["S3"] = float(core_match.group(2).replace(",", "."))

    numbers_after_area = None if is_fiber else re.search(r"[хx×_]\s*[\d,.]+[-–](\d+)[-–](\d+)(?:[-–](\d+))?", raw)
    explicit_layers = int(numbers_after_area.group(3)) if numbers_after_area and numbers_after_area.group(3) else None
    if numbers_after_area:
        s["S16"] = int(numbers_after_area.group(1))
        s["S15"] = int(numbers_after_area.group(2))
        if explicit_layers:
            s["S10"] = explicit_layers

    if is_fiber:
        s["S1"] = "光缆"
        fiber_match = re.search(r"(?:^|[-\s])(\d+)Е(?:[-\s]|$)", raw, re.IGNORECASE) or re.search(r"х(\d+)Е", raw, re.IGNORECASE)
        if fiber_match:
            s["S26"] = int(fiber_match.group(1))
        temp_match = re.search(r"-(\d+)\s*$", raw)
        if temp_match:
            s["S15"] = int(temp_match.group(1))
    elif is_swab:
        s["S1"] = "抽汲"
    elif is_heating:
        s["S1"] = "加热"
    elif is_coax:
        s["S1"] = "同轴"
    elif explicit_layers and explicit_layers > 2 and raw.startswith("КГ"):
        s["S1"] = "加强"
    elif is_anti_corrosion:
        s["S1"] = "防腐"
    elif raw.startswith("КГ"):
        s["S1"] = "普通"

    if is_anti_corrosion:
        s["S23"] = "Оа"
    elif is_swab:
        s["S23"] = "Св"
    elif explicit_layers and explicit_layers > 2 and raw.startswith("КГ"):
        s["S23"] = "HS"

    if is_coax:
        s["S7"] = "同轴屏蔽"

    return s


def apply_fix(entry: dict[str, Any]) -> tuple[dict[str, Any], dict[str, dict[str, Any]]]:
    next_entry = dict(entry)
    changes: dict[str, dict[str, Any]] = {}
    for field, value in derive_fields(entry["ru"]).items():
        old_value = next_entry.get(field)
        if old_value != value:
            next_entry[field] = value
            changes[field] = {"old": old_value, "new": value}
    return next_entry, changes


def fix_dataset(input_path: Path, output_path: Path | None = None) -> list[dict[str, Any]]:
    target_path = output_path or input_path
    data = load_json(input_path)
    fixed = []
    change_log = []
    for entry in data:
        next_entry, changes = apply_fix(entry)
        fixed.append(next_entry)
        if changes:
            change_log.append({"ru": entry["ru"], "changes": changes})
    dump_json(target_path, fixed)
    return change_log


def main() -> None:
    ru_changes = fix_dataset(RU_FILE)
    missing_changes = fix_dataset(MISSING_FILE, MISSING_FIXED_FILE)

    print(f"updated {RU_FILE} -> {len(ru_changes)} entries changed")
    print(f"updated {MISSING_FIXED_FILE} -> {len(missing_changes)} entries changed")
    print("sample existing changes:")
    for item in ru_changes[:5]:
        print(item)
    print("sample missing changes:")
    for item in missing_changes[:5]:
        print(item)


if __name__ == "__main__":
    main()
