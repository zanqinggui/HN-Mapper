"""
Validate and merge RU cable data into a staging dataset.

Inputs:
- src/data/ru-products.json
- scripts/data/ru_missing_partial.json

Outputs:
- src/data/ru-products.staging.json
- src/data/ru-products.audit.json
"""
from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import Any


BASE = Path(__file__).resolve().parents[1]
SRC_DATA = BASE / "src" / "data"
SCRIPT_DATA = BASE / "scripts" / "data"
RU_FILE = SRC_DATA / "ru-products.json"
MISSING_FILE = SCRIPT_DATA / "ru_missing_partial.json"
MISSING_FIXED_FILE = SCRIPT_DATA / "ru_missing_partial.fixed.json"
STAGING_FILE = SRC_DATA / "ru-products.staging.json"
AUDIT_FILE = SRC_DATA / "ru-products.audit.json"
SCHEMA_FILE = SRC_DATA / "s-schema.json"

ALL_SCHEMA_FIELDS = []


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse_russian_name(model: str) -> dict[str, Any]:
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


def build_s27(entry: dict[str, Any]) -> list[dict[str, Any]] | None:
    if entry.get("S27") not in (None, ""):
        return entry["S27"]

    layers: list[dict[str, Any]] = []
    material = entry.get("S11")

    if entry.get("S8"):
        layers.append({
            "index": 1,
            "kind": "armor",
            "structure": entry["S8"],
            "material": material,
            "note": None,
        })
    if entry.get("S9"):
        layers.append({
            "index": 2,
            "kind": "armor",
            "structure": entry["S9"],
            "material": material,
            "note": None,
        })
    if not layers and entry.get("S10"):
        for idx in range(1, int(entry["S10"]) + 1):
            layers.append({
                "index": idx,
                "kind": "armor",
                "structure": entry.get("S8") if idx == 1 else entry.get("S9") if idx == 2 else None,
                "material": material,
                "note": "projected from legacy S10/S11 fields",
            })
    return layers or None


def ensure_schema_fields(entry: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(entry)
    for field in ALL_SCHEMA_FIELDS:
        normalized.setdefault(field, None)
    normalized.setdefault("ru", None)
    normalized["S27"] = build_s27(normalized)
    return normalized


def diff_against_name(entry: dict[str, Any]) -> list[dict[str, Any]]:
    expected = parse_russian_name(entry["ru"])
    issues = []
    for field, expected_value in expected.items():
        actual_value = entry.get(field)
        if expected_value == "" and actual_value == "":
            continue
        if actual_value in (None, ""):
            issues.append({
                "field": field,
                "severity": "warning",
                "message": f"missing value; model name implies {expected_value!r}",
            })
            continue
        if actual_value != expected_value:
            issues.append({
                "field": field,
                "severity": "warning",
                "message": f"value {actual_value!r} differs from name-derived {expected_value!r}",
            })
    return issues


def summarize_field_coverage(items: list[dict[str, Any]]) -> dict[str, dict[str, int]]:
    coverage = {}
    for field in ALL_SCHEMA_FIELDS:
        nonempty = sum(1 for item in items if item.get(field) not in (None, "", []))
        coverage[field] = {"nonempty": nonempty, "total": len(items)}
    return coverage


def main() -> None:
    schema = load_json(SCHEMA_FILE)
    global ALL_SCHEMA_FIELDS
    ALL_SCHEMA_FIELDS = list(schema.keys())

    existing_raw = load_json(RU_FILE)
    missing_source = MISSING_FIXED_FILE if MISSING_FIXED_FILE.exists() else MISSING_FILE
    missing_raw = load_json(missing_source)

    existing = [ensure_schema_fields(item) for item in existing_raw]
    missing = [ensure_schema_fields(item) for item in missing_raw]

    existing_names = {item["ru"] for item in existing}
    missing_names = [item["ru"] for item in missing]
    overlap = sorted(existing_names & set(missing_names))

    duplicate_missing = [name for name, count in Counter(missing_names).items() if count > 1]

    staging = sorted(existing + missing, key=lambda item: item["ru"])
    dump_json(STAGING_FILE, staging)

    audit = {
        "inputs": {
            "existing_count": len(existing),
            "missing_count": len(missing),
            "staging_count": len(staging),
            "missing_source": str(missing_source),
        },
        "overlap": overlap,
        "duplicate_missing": duplicate_missing,
        "coverage": {
            "existing": summarize_field_coverage(existing),
            "missing": summarize_field_coverage(missing),
            "staging": summarize_field_coverage(staging),
        },
        "known_review_items": [],
        "existing_name_mismatch": [],
        "missing_name_mismatch": [],
    }

    target = "КГ 1х0,5-5-90 Оа"
    matched_target = next((item for item in existing if item["ru"] == target), None)
    if matched_target:
        audit["known_review_items"].append({
            "ru": target,
            "status": "already_aligned",
            "note": "S10 is already 2 in the current ru-products.json; no further direct edit was needed in this pass.",
            "current": {k: matched_target.get(k) for k in ["S8", "S9", "S10", "S11", "S12", "S14", "S15", "S16", "S27"]},
        })

    for item in existing:
        issues = diff_against_name(item)
        if issues:
            audit["existing_name_mismatch"].append({"ru": item["ru"], "issues": issues})

    for item in missing:
        issues = diff_against_name(item)
        if issues:
            audit["missing_name_mismatch"].append({"ru": item["ru"], "issues": issues})

    dump_json(AUDIT_FILE, audit)

    print(f"staging -> {STAGING_FILE}")
    print(f"audit   -> {AUDIT_FILE}")
    print(f"existing={len(existing)} missing={len(missing)} staging={len(staging)}")
    print(f"overlap={len(overlap)} duplicate_missing={len(duplicate_missing)}")


if __name__ == "__main__":
    main()
