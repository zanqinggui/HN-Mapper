"""
Extract cable data from Chinese cable spec sheets (xlsx) in cn_cable_data/
and merge into src/data/cn-products.json
"""
import os, re, json, sys
import pandas as pd

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE, "cn_cable_data")
OUT_FILE = os.path.join(BASE, "src", "data", "cn-products.json")

# Russian label -> S field mapping (match by substring)
LABEL_MAP = {
    "конструкци":                           ("S4",  "str"),   # conductor construction (match short prefix)
    "изоляция (":                           ("S6",  "dim"),   # insulation thickness
    "изоляция (полистирен)":                ("S6",  "dim"),
    "изоляция (полиэтилен)":                ("S6",  "dim"),
    "изоляция (fep)":                       ("S6",  "dim"),
    "изоляция (etfe)":                      ("S6",  "dim"),
    "наружный диаметр кабеля":              ("S12", "od"),    # OD + tolerance
    "вес в воздухе":                        ("S14", "num"),   # weight kg/km
    "макс. температура (1 ч)":              ("S15", "num"),   # max temp 1h
    "максимальная рабочая температура":      ("S15", "num"),   # alt label
    "разрывное усилие кабеля":              ("S16", "num"),   # breaking strength kN
    "макс. рекомендуемое рабочее тяговое усилие": (None, None),  # skip
    "минимальный диаметр шкива":            ("S17", "num"),   # min drum diam mm
    "коэффициент линейного удлинения":      ("S18", "str"),   # linear elongation
    "номинальное рабочее напряжение":       ("S19", "num"),   # voltage V
    "сопротивление изоляции":               ("S20", "num"),   # insulation resist
    "электрическое сопротивление при 20":   ("S21", "num"),   # DC resistance
    "электрическое сопротивление пост. тока": ("S21", "num"),
    "электрическая ёмкость":                ("S22", "num"),   # capacitance pF/m
    "емкость":                              ("S22", "num"),
}

# Inner/outer armor detection (these appear with col 3 label)
ARMOR_INNER = "первый повив брони"
ARMOR_OUTER = "второй повив брони"


def parse_number(text):
    """Extract first number from a Russian-formatted string like '45 кг/км' or '3,5 мм'"""
    if text is None:
        return None
    text = str(text).replace(",", ".").strip()
    m = re.search(r"([\d.]+)", text)
    return float(m.group(1)) if m else None


def parse_construction(text):
    """Extract wire construction like '7×0.21' from '7×0,21 мм'"""
    if text is None:
        return None
    text = str(text).replace(",", ".").replace("х", "×").replace("x", "×").replace("X", "×")
    text = re.sub(r"\u00d7", "×", text)  # ×
    m = re.search(r"(\d+)\s*[×\*]\s*([\d.]+)", text)
    return f"{m.group(1)}×{m.group(2)}" if m else str(text).strip()


def parse_od(text):
    """Parse OD with tolerance: '3,5 мм+0,13 мм-0,05 мм' -> (3.5, '+0.13/-0.05')"""
    if text is None:
        return None, None
    text = str(text).replace(",", ".")
    m = re.search(r"([\d.]+)\s*мм\s*\+\s*([\d.]+)\s*мм\s*-\s*([\d.]+)", text)
    if m:
        od = float(m.group(1))
        tol = f"+{m.group(2)}/-{m.group(3)}"
        return od, tol
    m = re.search(r"([\d.]+)", text)
    return (float(m.group(1)), None) if m else (None, None)


def derive_model_info(filename):
    """Derive S parameters from filename/model name"""
    cn = filename.replace("_ru.xlsx", "").replace("_ru", "")
    info = {"cn": cn}

    upper = cn.upper()

    # S1 series
    if upper.startswith("GX-"):
        info["S1"] = "光缆"
    elif upper.startswith("FLM-"):
        info["S1"] = "密封"
    elif upper.startswith("FL-"):
        info["S1"] = "普通"
    elif "WMF" in upper:
        info["S1"] = "密封"
    else:
        info["S1"] = "普通"

    # S2 core count
    core_match = re.search(r"(?:FL[M]?-)?(?:GX-)?(?:WMF|W)(GS|1|2|3|4|5|7)", upper)
    if core_match:
        c = core_match.group(1)
        info["S2"] = 1 if c == "GS" else int(c)

    # S5 insulation material
    if "PFA" in upper:
        info["S5"] = "PFA"
    elif "F46F40" in upper:
        info["S5"] = "F46/F40"
    elif "F46" in upper:
        info["S5"] = "F46"
    elif "F40" in upper:
        info["S5"] = "F40"
    elif re.search(r"[WG]S?B", upper):
        info["S5"] = "B"

    # S7 shielding
    if "PP" in upper:
        info["S7"] = "PP"
    elif re.search(r"(?<!F)(?<!A)P(?!FA)(?!P)(?!$)", upper.replace("GS", "").replace(info.get("S5", ""), "")):
        info["S7"] = "P"
    else:
        info["S7"] = "无"

    # S23 special features
    features = []
    if "-EEHS" in upper:
        features.append("EEHS")
    elif "-EHS" in upper:
        features.append("EHS")
    elif "-HS" in upper:
        features.append("HS")
    if "-JY" in upper:
        features.append("JY")
    if "GB" in upper:
        features.append("GB")
    info["S23"] = ",".join(features) if features else ""

    # S10, S11 defaults
    info["S10"] = 2
    info["S11"] = "碳钢"

    return info


def extract_one(filepath):
    """Extract S parameters from a single spec sheet"""
    filename = os.path.basename(filepath)
    info = derive_model_info(filename)

    try:
        df = pd.read_excel(filepath, sheet_name=0, header=None, engine="openpyxl")
    except Exception as e:
        print(f"  WARN: cannot read {filename}: {e}", file=sys.stderr)
        return info

    # Section-aware scan:
    # "количество и размер проволок" section → armor wire construction (S8, S9)
    # "среднее разрывное усилие проволок" section → skip (not S fields)
    section = None  # "wire_size" or "wire_strength"
    for idx, row in df.iterrows():
        # Detect section headers from col 2
        col2 = row.get(2)
        if col2 and isinstance(col2, str):
            col2_lower = col2.strip().lower().replace("\n", " ")
            if "количество и размер проволок" in col2_lower or "количество и размер" in col2_lower:
                section = "wire_size"
            elif "среднее разрывное усилие" in col2_lower or "среднее разрывн" in col2_lower:
                section = "wire_strength"

        # Match standard labels from col 1 and col 2
        for col_label in [1, 2]:
            cell = row.get(col_label)
            if cell is None or not isinstance(cell, str):
                continue
            cell_lower = cell.strip().lower().replace("\n", " ")

            for label_key, (s_field, parse_type) in LABEL_MAP.items():
                if label_key in cell_lower:
                    if s_field is None:
                        break
                    val_cell = row.get(6)  # metric value column
                    if val_cell is None:
                        break

                    if parse_type == "num":
                        info[s_field] = parse_number(val_cell)
                    elif parse_type == "dim":
                        info[s_field] = parse_number(val_cell)
                    elif parse_type == "od":
                        od, tol = parse_od(val_cell)
                        info["S12"] = od
                        info["S13"] = tol
                    elif parse_type == "str":
                        info[s_field] = parse_construction(val_cell)
                    break

        # Armor rows in col 3: only extract construction in "wire_size" section
        col3 = row.get(3)
        if col3 and isinstance(col3, str):
            col3_lower = col3.strip().lower()
            val_cell = row.get(6)
            if val_cell and section == "wire_size":
                if ARMOR_INNER in col3_lower:
                    info["S8"] = parse_construction(val_cell)
                elif ARMOR_OUTER in col3_lower:
                    info["S9"] = parse_construction(val_cell)

        # Conductor construction from col 2 (backup, LABEL_MAP should catch it too)
        if col2 and isinstance(col2, str):
            col2_lower = col2.strip().lower().replace("\n", " ")
            if "конструкци" in col2_lower and "жил" in col2_lower:
                val_cell = row.get(6)
                if val_cell and "S4" not in info:
                    info["S4"] = parse_construction(val_cell)

    # Derive S3 from S4 if possible (conductor area = n_wires * pi * (d/2)^2)
    if "S4" in info and info["S4"] and "S3" not in info:
        m = re.match(r"(\d+)×([\d.]+)", str(info["S4"]))
        if m:
            n = int(m.group(1))
            d = float(m.group(2))
            area = n * 3.14159 * (d / 2) ** 2
            info["S3"] = round(area, 3)

    # Check for stainless steel armor from FL- prefix or file content
    if filename.startswith("FL-"):
        info["S11"] = "不锈钢"
    elif filename.startswith("FLM-"):
        info["S11"] = "不锈钢"

    return info


def ensure_all_s_fields(product):
    """Make sure all S1-S26 fields exist"""
    all_fields = [f"S{i}" for i in range(1, 27)]
    for f in all_fields:
        if f not in product:
            product[f] = None
    return product


def main():
    # Read existing products
    existing = []
    if os.path.exists(OUT_FILE):
        with open(OUT_FILE, "r", encoding="utf-8") as f:
            existing = json.load(f)
    existing_names = {p["cn"] for p in existing if p.get("cn")}

    # Extract from all xlsx files
    xlsx_files = sorted([
        os.path.join(DATA_DIR, f) for f in os.listdir(DATA_DIR) if f.endswith(".xlsx")
    ])

    new_products = []
    updated = 0
    for filepath in xlsx_files:
        filename = os.path.basename(filepath)
        print(f"Processing: {filename}")
        info = extract_one(filepath)
        info = ensure_all_s_fields(info)

        cn = info["cn"]
        if cn in existing_names:
            # Update existing entry with new data
            for ep in existing:
                if ep.get("cn") == cn:
                    for k, v in info.items():
                        if v is not None and (ep.get(k) is None):
                            ep[k] = v
                    updated += 1
            print(f"  -> Updated existing: {cn}")
        else:
            new_products.append(info)
            print(f"  -> New: {cn}")

    # Merge
    all_products = existing + new_products
    # Ensure all have all S fields
    all_products = [ensure_all_s_fields(p) for p in all_products]

    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)

    print(f"\nDone: {len(existing)} existing, {len(new_products)} new, {updated} updated")
    print(f"Total: {len(all_products)} products in {OUT_FILE}")


if __name__ == "__main__":
    main()
