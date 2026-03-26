"""
Enrich CN/RU product JSON files with field-level provenance metadata.

Adds:
- `_meta.<Sx>.source` in {direct, parsed, inferred, manual}
- rule / inputs / confidence / note for inferred fields

High-confidence inferred fields in this pass:
- INF-01: S5 -> S15
- INF-13: S15 -> S5 (only exact, unambiguous mappings)
- INF-10: S12 -> S17 (use 50 * OD as central estimate; keep 40-60x range in metadata)
- LEGACY-S27: project armor layers from legacy S10/S11/S8/S9 when S27 is missing
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


BASE = Path(__file__).resolve().parents[1]
SRC_DATA = BASE / "src" / "data"
CN_FILE = SRC_DATA / "cn-products.json"
RU_FILE = SRC_DATA / "ru-products.json"
SCHEMA_FILE = SRC_DATA / "s-schema.json"

S5_TO_S15_EXACT = {
    "B": 90,
    "F40": 180,
    "F46": 230,
    "F46/F40": 260,
    "PFA": 280,
}

S15_TO_S5_EXACT = {
    90: "B",
    180: "F40",
    230: "F46",
    232: "F46",
    260: "F46/F40",
    280: "PFA",
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse_chinese(model: str) -> dict[str, Any]:
    s: dict[str, Any] = {}
    upper = model.strip().upper()

    if upper.startswith("WMF"):
        s["S1"] = "密封"
    elif upper.startswith("W"):
        s["S1"] = "普通"

    core_match = re.search(r"(?:WMF|W)(GS|1|3|4|5|7)", upper)
    if core_match:
        c = core_match.group(1)
        s["S2"] = 1 if c == "GS" else int(c)

    if "PFA" in upper:
        s["S5"] = "PFA"
    elif "F46" in upper:
        s["S5"] = "F46"
    elif "F40" in upper:
        s["S5"] = "F40"
    elif re.search(r"(?:WMF|W)(?:GS|1|3|4|5|7)B", upper):
        s["S5"] = "B"

    if "PP" in upper:
        s["S7"] = "PP"
    else:
        stripped = re.sub(r"^WMF|^W", "", upper)
        stripped = re.sub(r"GS|[13457]", "", stripped)
        stripped = re.sub(r"B|F40|F46|PFA", "", stripped)
        if re.search(r"P(?!FA)", stripped):
            after = re.sub(r"^WMF?", "", upper)
            after = re.sub(r"^(GS|[13457])", "", after)
            after = re.sub(r"^(PFA|F46|F40|B)", "", after)
            if after.startswith("P") and not after.startswith("PF"):
                s["S7"] = "P"
    if "S7" not in s:
        s["S7"] = "无"

    od_match = re.search(r"(\d+\.?\d*)\s*(?:mm)?$", model, re.IGNORECASE) or re.search(r"-(\d+\.?\d+)", model)
    if od_match:
        s["S12"] = float(od_match.group(1))

    features = []
    if "-JY" in upper:
        features.append("JY")
    if "-FF" in upper or "FF-" in upper:
        features.append("FF")
    if "-FD" in upper or "FD-" in upper:
        features.append("FD")
    if "-HS" in upper or "HS-" in upper:
        features.append("HS")
    if (re.search(r"X(?!$)", upper) or upper.endswith("X")) and re.search(r"[13457]B?X", upper):
        features.append("X")
    if features:
        s["S23"] = ",".join(features)

    spec_match = re.search(r"(\d+)\*(\d+\.?\d+)", model)
    if spec_match:
        s["S2"] = int(spec_match.group(1))
        s["S3"] = float(spec_match.group(2))

    return s


def parse_russian(model: str) -> dict[str, Any]:
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


def round_number(value: float) -> float | int:
    rounded = round(value, 2)
    return int(rounded) if abs(rounded - round(rounded)) < 1e-9 else rounded


def project_s27(entry: dict[str, Any]) -> list[dict[str, Any]] | None:
    if entry.get("S27") not in (None, "", []):
        return entry["S27"]
    if not entry.get("S10"):
        return None

    layers = []
    for idx in range(1, int(entry["S10"]) + 1):
        layers.append({
            "index": idx,
            "kind": "armor",
            "structure": entry.get("S8") if idx == 1 else entry.get("S9") if idx == 2 else None,
            "material": entry.get("S11"),
            "note": "projected from legacy S10/S11 fields",
        })
    return layers


def is_projected_s27(value: Any) -> bool:
    if not isinstance(value, list) or not value:
        return False
    return all(isinstance(layer, dict) and layer.get("note") == "projected from legacy S10/S11 fields" for layer in value)


def add_meta(meta: dict[str, Any], field: str, source: str, **extra: Any) -> None:
    payload = {"source": source, **extra}
    meta[field] = payload


def enrich_products(path: Path, parser, name_field: str, name_fields: set[str]) -> None:
    data = load_json(path)
    schema_fields = [key for key in load_json(SCHEMA_FILE).keys()]
    enriched = []

    for item in data:
        next_item = dict(item)
        meta = dict(next_item.get("_meta") or {})
        parsed = parser(next_item[name_field])

        for field in schema_fields:
            value = next_item.get(field)
            if value in (None, "", []):
                continue
            if field in meta and field != "S27":
                continue
            if field == "S27" and is_projected_s27(value):
                add_meta(
                    meta,
                    "S27",
                    "inferred",
                    rule="LEGACY-S27",
                    inputs=["S8", "S9", "S10", "S11"],
                    confidence="B",
                    note="由旧版铠装字段投影生成",
                )
                continue
            if field in parsed and parsed[field] == value:
                add_meta(meta, field, "parsed", rule=f"PARSE-{name_field.upper()}", inputs=[name_field], confidence="A")
            else:
                add_meta(meta, field, "direct", rule=None, inputs=[], confidence=None)

        if next_item.get("S15") in (None, "") and next_item.get("S5") in S5_TO_S15_EXACT:
            next_item["S15"] = S5_TO_S15_EXACT[next_item["S5"]]
            add_meta(
                meta,
                "S15",
                "inferred",
                rule="INF-01",
                inputs=["S5"],
                confidence="A",
                note="由绝缘材料耐温等级推断",
            )

        if next_item.get("S5") in (None, "") and next_item.get("S15") in S15_TO_S5_EXACT:
            next_item["S5"] = S15_TO_S5_EXACT[next_item["S15"]]
            add_meta(
                meta,
                "S5",
                "inferred",
                rule="INF-13",
                inputs=["S15"],
                confidence="A",
                note="由温度等级反推绝缘材料",
            )

        if next_item.get("S17") in (None, "") and isinstance(next_item.get("S12"), (int, float)):
            estimate = round_number(float(next_item["S12"]) * 50)
            next_item["S17"] = estimate
            add_meta(
                meta,
                "S17",
                "inferred",
                rule="INF-10",
                inputs=["S12"],
                confidence="B",
                note=f"经验公式，建议范围 {round_number(float(next_item['S12']) * 40)}–{round_number(float(next_item['S12']) * 60)} mm",
                rangeMin=round_number(float(next_item["S12"]) * 40),
                rangeMax=round_number(float(next_item["S12"]) * 60),
            )

        if next_item.get("S27") in (None, "", []):
            projected = project_s27(next_item)
            if projected:
                next_item["S27"] = projected
                add_meta(
                    meta,
                    "S27",
                    "inferred",
                    rule="LEGACY-S27",
                    inputs=["S8", "S9", "S10", "S11"],
                    confidence="B",
                    note="由旧版铠装字段投影生成",
                )

        next_item["_meta"] = meta
        enriched.append(next_item)

    dump_json(path, enriched)


def main() -> None:
    schema = load_json(SCHEMA_FILE)
    k_name_fields = {key for key, value in schema.items() if value.get("k")}
    r_name_fields = {key for key, value in schema.items() if value.get("r")}

    enrich_products(CN_FILE, parse_chinese, "cn", k_name_fields)
    enrich_products(RU_FILE, parse_russian, "ru", r_name_fields)

    print(f"enriched {CN_FILE}")
    print(f"enriched {RU_FILE}")


if __name__ == "__main__":
    main()
