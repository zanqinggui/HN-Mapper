import { useState, useMemo, useEffect, useRef } from "react";
import cnProducts from "./data/cn-products.json";
import ruProducts from "./data/ru-products.json";
import sSchemaRaw from "./data/s-schema.json";

// ============================================================
// 国际化：三语翻译
// ============================================================

const T = {
  cn: {
    title: "中俄测井电缆型号映射器",
    subtitle: "CN ↔ RU WIRELINE CABLE MAPPER · PROTOTYPE v0.1",
    tabCn2ru: "中→俄 解析",
    tabRu2cn: "俄→中 解析",
    tabManual: "S集合 手动筛选",
    inputLabelCn: "输入中国型号名",
    inputLabelRu: "输入俄罗斯型号名",
    parse: "解析",
    sPanel: (n) => `S 集合参数 · 已命中 ${n} 个筛选条件`,
    clearAll: "清除全部",
    cnHits: "中国型号 命中",
    ruHits: "俄罗斯型号 命中",
    noMatch: "无匹配",
    detailHeader: (n) => `全部匹配详情 · ${n} 条`,
    colModel: "型号", colCore: "芯", colArea: "mm²", colOD: "⌀mm",
    colStrength: "kN", colTemp: "°C", colLayers: "层", colFeatures: "特性",
    count: "条",
    gapTitle: "映射间隙分析",
    cnName: "中国型号名",
    ruName: "俄罗斯型号名",
    missing: "缺少:",
    truncated: (n) => `... 还有 ${n} 条未显示`,
    footerHint: "补充更多 S 参数可进一步缩小候选范围 · 在「S集合手动筛选」模式下可自由组合",
    showAllS: (n) => `展开全部 ${n} 项`,
    hideEmptyS: "收起空参数",
    parseFail: "未能识别该型号，请检查输入",
    parsePartial: (n) => `仅识别 ${n} 项参数，请检查型号格式`,
    parseOk: "已识别：",
    demandTitle: "需求清单",
    demandFt: "英尺",
    demandExport: "导出 CSV",
    demandDelete: "删除",
    copy: "复制型号",
    copied: "已复制",
    useFilter: "符合",
    ignoreFilter: "无视",
    relaxTitle: "解锁建议",
    relaxSummary: (target, count) => `当前无${target}结果。下面列出忽略 1-3 个条件即可解锁结果的全部 ${count} 组方案，按优先级排序。`,
    relaxHits: (n) => `预计得到 ${n} 条结果`,
    relaxApply: "应用建议",
    relaxIgnore: "忽略",
    relaxReason: "优先原因",
    relaxGroupTitle: (n, count) => `忽略 ${n} 个条件 · ${count} 组方案`,
    relaxPage: (page, total) => `第 ${page} / ${total} 页`,
    relaxPrev: "上一页",
    relaxNext: "下一页",
    targetCn: "中国型号",
    targetRu: "俄罗斯型号",
  },
  en: {
    title: "CN–RU Wireline Cable Mapper",
    subtitle: "CN ↔ RU WIRELINE CABLE MAPPER · PROTOTYPE v0.1",
    tabCn2ru: "CN → RU Parse",
    tabRu2cn: "RU → CN Parse",
    tabManual: "S-Set Manual Filter",
    inputLabelCn: "Enter Chinese cable model",
    inputLabelRu: "Enter Russian cable model",
    parse: "Parse",
    sPanel: (n) => `S-Set Parameters · ${n} filter(s) active`,
    clearAll: "Clear All",
    cnHits: "Chinese Models Matched",
    ruHits: "Russian Models Matched",
    noMatch: "No match",
    detailHeader: (n) => `All Match Details · ${n} item(s)`,
    colModel: "Model", colCore: "Core", colArea: "mm²", colOD: "⌀mm",
    colStrength: "kN", colTemp: "°C", colLayers: "Layers", colFeatures: "Features",
    count: "",
    gapTitle: "Mapping Gap Analysis",
    cnName: "CN model name",
    ruName: "RU model name",
    missing: "missing:",
    truncated: (n) => `... ${n} more not shown`,
    footerHint: "Add more S parameters to narrow candidates · Use \"S-Set Manual Filter\" mode for free combination",
    showAllS: (n) => `Show all ${n} fields`,
    hideEmptyS: "Collapse empty",
    parseFail: "Could not parse this model, check input",
    parsePartial: (n) => `Only ${n} field(s) recognized, check format`,
    parseOk: "Parsed: ",
    demandTitle: "Demand List",
    demandFt: "ft",
    demandExport: "Export CSV",
    demandDelete: "Remove",
    copy: "Copy model",
    copied: "Copied",
    useFilter: "Use",
    ignoreFilter: "Ignore",
    relaxTitle: "Unlock Suggestions",
    relaxSummary: (target, count) => `No ${target} yet. Listed below are all ${count} workable plans that unlock results by ignoring 1-3 filters, ordered by priority.`,
    relaxHits: (n) => `${n} result(s) expected`,
    relaxApply: "Apply",
    relaxIgnore: "Ignore",
    relaxReason: "Why this is prioritized",
    relaxGroupTitle: (n, count) => `Ignore ${n} filter(s) · ${count} plan(s)`,
    relaxPage: (page, total) => `Page ${page} / ${total}`,
    relaxPrev: "Prev",
    relaxNext: "Next",
    targetCn: "Chinese models",
    targetRu: "Russian models",
  },
  ru: {
    title: "Маппер кабелей КНР–РФ",
    subtitle: "CN ↔ RU WIRELINE CABLE MAPPER · PROTOTYPE v0.1",
    tabCn2ru: "КНР → РФ Разбор",
    tabRu2cn: "РФ → КНР Разбор",
    tabManual: "S-набор Ручной фильтр",
    inputLabelCn: "Введите марку кабеля КНР",
    inputLabelRu: "Введите марку кабеля РФ",
    parse: "Разбор",
    sPanel: (n) => `S-набор параметров · ${n} фильтр(ов) активно`,
    clearAll: "Очистить всё",
    cnHits: "Совпадения КНР",
    ruHits: "Совпадения РФ",
    noMatch: "Нет совпадений",
    detailHeader: (n) => `Все совпадения · ${n} шт.`,
    colModel: "Марка", colCore: "Жилы", colArea: "mm²", colOD: "⌀mm",
    colStrength: "kN", colTemp: "°C", colLayers: "Слои", colFeatures: "Особ.",
    count: "шт.",
    gapTitle: "Анализ пробелов маппинга",
    cnName: "Марка КНР",
    ruName: "Марка РФ",
    missing: "отсутствует:",
    truncated: (n) => `... ещё ${n} не показано`,
    footerHint: "Добавьте больше S-параметров для сужения результатов · Используйте режим \"Ручной фильтр\"",
    showAllS: (n) => `Показать все ${n} полей`,
    hideEmptyS: "Скрыть пустые",
    parseFail: "Не удалось распознать марку, проверьте ввод",
    parsePartial: (n) => `Распознано только ${n} поле(й), проверьте формат`,
    parseOk: "Распознано: ",
    demandTitle: "Список потребностей",
    demandFt: "фут",
    demandExport: "Экспорт CSV",
    demandDelete: "Удалить",
    copy: "Копировать марку",
    copied: "Скопировано",
    useFilter: "Учитывать",
    ignoreFilter: "Игнор",
    relaxTitle: "Подсказки разблокировки",
    relaxSummary: (target, count) => `Пока нет результатов ${target}. Ниже перечислены все ${count} рабочие варианты, которые дают результат при игнорировании 1-3 полей, в порядке приоритета.`,
    relaxHits: (n) => `Ожидается ${n} результат(ов)`,
    relaxApply: "Применить",
    relaxIgnore: "Игнорировать",
    relaxReason: "Почему это в приоритете",
    relaxGroupTitle: (n, count) => `Игнорировать ${n} поле(й) · ${count} вариант(ов)`,
    relaxPage: (page, total) => `Стр. ${page} / ${total}`,
    relaxPrev: "Назад",
    relaxNext: "Вперёд",
    targetCn: "КНР",
    targetRu: "РФ",
  },
};

// FIELD_OPTIONS 显示翻译（value 保持中文用于数据匹配）
const FIELD_OPTION_LABELS = {
  S1: {
    "普通": { en: "Standard", ru: "Стандартный" },
    "密封": { en: "Sealed", ru: "Герметичный" },
    "抽汲": { en: "Pump-out", ru: "Свабный" },
    "防腐": { en: "Anti-corrosion", ru: "Антикорр." },
    "同轴": { en: "Coaxial", ru: "Коаксиальный" },
    "加强": { en: "Reinforced", ru: "Усиленный" },
    "加热": { en: "Heating", ru: "Нагревательный" },
    "光缆": { en: "Fiber optic", ru: "Оптоволоконный" },
  },
  S7: {
    "无": { en: "None", ru: "Нет" },
    "同轴屏蔽": { en: "Coaxial shield", ru: "Коакс. экран" },
  },
  S11: {
    "碳钢": { en: "Carbon steel", ru: "Углерод. сталь" },
    "不锈钢": { en: "Stainless steel", ru: "Нерж. сталь" },
  },
};

const fieldOptionLabel = (sid, value, lang) => {
  if (lang === "cn" || !FIELD_OPTION_LABELS[sid]?.[value]) return String(value);
  return FIELD_OPTION_LABELS[sid][value][lang] || String(value);
};

const SOURCE_LABELS = {
  cn: { direct: "原始", parsed: "解析", inferred: "推断", manual: "校订" },
  en: { direct: "Direct", parsed: "Parsed", inferred: "Inferred", manual: "Manual" },
  ru: { direct: "Исх.", parsed: "Разбор", inferred: "Вывод", manual: "Правка" },
};

const SOURCE_COLORS = {
  direct: { text: "#8fb7ff", bg: "#13233a" },
  parsed: { text: "#f0b429", bg: "#3d2e0a" },
  inferred: { text: "#3fb950", bg: "#0d2818" },
  manual: { text: "#ff7b72", bg: "#3a1616" },
};

const S5_TO_S15_EXACT = {
  B: 90,
  F40: 180,
  F46: 230,
  "F46/F40": 260,
  PFA: 280,
};

const S15_TO_S5_EXACT = {
  90: "B",
  180: "F40",
  230: "F46",
  232: "F46",
  260: "F46/F40",
  280: "PFA",
};

const textByLang = (lang, values) => values[lang] || values.cn;

const normalizeLookupPart = (value) => (
  typeof value === "number" ? String(Number(value.toFixed(6))) : String(value)
);

const buildExactLookup = (products, inputKeys, outputKey) => {
  const buckets = new Map();

  for (const product of products) {
    if (inputKeys.some(key => product[key] === null || product[key] === undefined || product[key] === "")) continue;
    if (product[outputKey] === null || product[outputKey] === undefined || product[outputKey] === "") continue;

    const lookupKey = inputKeys.map(key => normalizeLookupPart(product[key])).join("|");
    if (!buckets.has(lookupKey)) buckets.set(lookupKey, new Map());
    buckets.get(lookupKey).set(normalizeLookupPart(product[outputKey]), product[outputKey]);
  }

  const exact = new Map();
  const ambiguous = new Map();
  let uniqueCount = 0;

  for (const [lookupKey, outputs] of buckets.entries()) {
    const values = [...outputs.values()];
    if (values.length === 1) {
      exact.set(lookupKey, values[0]);
      uniqueCount += 1;
    } else {
      ambiguous.set(lookupKey, values);
    }
  }

  const combinationCount = buckets.size;
  return {
    exact,
    ambiguous,
    stats: {
      combinations: combinationCount,
      unique: uniqueCount,
      ambiguous: ambiguous.size,
      confidenceRate: combinationCount > 0 ? Math.round((uniqueCount / combinationCount) * 100) : null,
    },
  };
};

const getLookupMatch = (lookup, parts) => {
  const lookupKey = parts.map(normalizeLookupPart).join("|");
  if (!lookup.exact.has(lookupKey)) return null;
  return {
    value: lookup.exact.get(lookupKey),
    confidenceRate: lookup.stats?.confidenceRate ?? null,
  };
};

const ALL_S5_TO_S15 = buildExactLookup([...cnProducts, ...ruProducts], ["S5"], "S15");
const ALL_S15_TO_S5 = buildExactLookup([...cnProducts, ...ruProducts], ["S15"], "S5");
const ALL_S12_TO_S17 = buildExactLookup([...cnProducts, ...ruProducts], ["S12"], "S17");
const CN_S5_S6_TO_S19 = buildExactLookup(cnProducts, ["S5", "S6"], "S19");
const CN_S5_S6_TO_S20 = buildExactLookup(cnProducts, ["S5", "S6"], "S20");
const ALL_S2_S3_TO_S21 = buildExactLookup([...cnProducts, ...ruProducts], ["S2", "S3"], "S21");
const ALL_S2_S3_S4_S6_S10_S11_TO_S12 = buildExactLookup(
  [...cnProducts, ...ruProducts],
  ["S2", "S3", "S4", "S6", "S10", "S11"],
  "S12"
);
const ALL_S12_S14_TO_S11 = buildExactLookup([...cnProducts, ...ruProducts], ["S12", "S14"], "S11");
const ALL_S11_S12_S14_TO_S18 = buildExactLookup([...cnProducts, ...ruProducts], ["S11", "S12", "S14"], "S18");

const MATCH_MODE_LABELS = {
  cn: { direct: "直接匹配", inferred: "推理匹配", inferredBy: "当前使用推理字段：" },
  en: { direct: "Direct match", inferred: "Inferred match", inferredBy: "Inferred filters in use: " },
  ru: { direct: "Прямое совпадение", inferred: "Совпадение с выводом", inferredBy: "Используются выведенные поля: " },
};

const CONFIDENCE_BADGE_LABELS = {
  cn: { rate: rate => `置信率 ${rate}%`, level: level => `置信等级 ${level}` },
  en: { rate: rate => `${rate}% confidence`, level: level => `Confidence ${level}` },
  ru: { rate: rate => `Уверенность ${rate}%`, level: level => `Уровень ${level}` },
};

const formatArmorLayers = (layers, lang) => {
  if (!Array.isArray(layers) || layers.length === 0) return "\u2014";
  const allStructuresMissing = layers.every(layer => !layer?.structure);
  if (allStructuresMissing) {
    const unit = textByLang(lang, { cn: "层", en: "layers", ru: "слоя" });
    return `${layers.length} ${unit}`;
  }
  return layers.map(layer => {
    const idx = layer?.index ?? "?";
    const prefix = lang === "ru" ? `С${idx}` : `L${idx}`;
    const structure = layer?.structure || textByLang(lang, { cn: "未列明", en: "unspecified", ru: "не указано" });
    return `${prefix}:${structure}`;
  }).join(" | ");
};

const formatSchemaValue = (sid, value, lang) => {
  if (value === null || value === undefined || value === "") return "\u2014";
  if (sid === "S27") return formatArmorLayers(value, lang);
  return fieldOptionLabel(sid, value, lang);
};

const getFieldMeta = (product, sid) => product?._meta?.[sid] || null;

const sourceLabel = (source, lang) => SOURCE_LABELS[lang]?.[source] || source || "";

const confidenceLabel = (meta, lang, compact = false) => {
  if (!meta || meta.source !== "inferred") return "";
  if (Number.isFinite(meta.confidenceRate)) {
    return compact
      ? `${meta.confidenceRate}%`
      : CONFIDENCE_BADGE_LABELS[lang].rate(meta.confidenceRate);
  }
  if (!meta.confidence) return "";
  return compact ? meta.confidence : CONFIDENCE_BADGE_LABELS[lang].level(meta.confidence);
};

const formatMetaNote = (meta, lang) => {
  if (!meta) return "";
  if (meta.rule === "LEGACY-S27") {
    return textByLang(lang, {
      cn: "由旧版铠装字段投影生成",
      en: "Projected from legacy armor fields",
      ru: "Спроецировано из устаревших полей брони",
    });
  }
  if (meta.rule === "INF-10") {
    const min = meta.rangeMin ?? "?";
    const max = meta.rangeMax ?? "?";
    return textByLang(lang, {
      cn: `经验估算，建议范围 ${min}–${max} mm`,
      en: `Empirical estimate, suggested range ${min}-${max} mm`,
      ru: `Оценка по эмпирике, рекомендуемый диапазон ${min}-${max} мм`,
    });
  }
  if (meta.rule === "INF-01") {
    return textByLang(lang, {
      cn: "由绝缘材料耐温等级推断",
      en: "Inferred from insulation temperature class",
      ru: "Выведено по температурному классу изоляции",
    });
  }
  if (meta.rule === "INF-02") {
    return textByLang(lang, {
      cn: "由绝缘材料和厚度查表推断额定电压",
      en: "Lookup inference from insulation material and thickness",
      ru: "Выведено по таблице из материала и толщины изоляции",
    });
  }
  if (meta.rule === "INF-03") {
    return textByLang(lang, {
      cn: "由绝缘材料和厚度查表推断绝缘电阻",
      en: "Lookup inference for insulation resistance",
      ru: "Выведено по таблице для сопротивления изоляции",
    });
  }
  if (meta.rule === "INF-04") {
    return textByLang(lang, {
      cn: "由芯数和截面积查表推断导体电阻",
      en: "Lookup inference from core count and area",
      ru: "Выведено по таблице из числа жил и сечения",
    });
  }
  if (meta.rule === "INF-07") {
    return textByLang(lang, {
      cn: "由导体结构、绝缘厚度和铠装参数查表推断外径",
      en: "Lookup inference for OD from structure and armor inputs",
      ru: "Выведено по таблице по конструкции, изоляции и броне",
    });
  }
  if (meta.rule === "INF-11") {
    return textByLang(lang, {
      cn: "由铠装材料、外径和重量查表推断线性延展系数",
      en: "Lookup inference for linear expansion coefficient",
      ru: "Выведено по таблице для коэффициента линейного расширения",
    });
  }
  if (meta.rule === "INF-12") {
    return textByLang(lang, {
      cn: "由外径和重量查表反推铠装材料",
      en: "Lookup inference for armor material from OD and weight",
      ru: "Выведено по таблице по наружному диаметру и массе",
    });
  }
  if (meta.rule === "INF-13") {
    return textByLang(lang, {
      cn: "由温度等级反推绝缘材料",
      en: "Inferred from temperature class",
      ru: "Выведено по температурному классу",
    });
  }
  return meta.note || "";
};

const cloneMetaMap = (meta = {}) => Object.fromEntries(
  Object.entries(meta).map(([key, value]) => [key, value ? { ...value } : value])
);

const inferRuntimeFields = (values, meta = {}) => {
  const nextValues = { ...values };
  const nextMeta = cloneMetaMap(meta);

  if ((nextValues.S15 === null || nextValues.S15 === undefined || nextValues.S15 === "") && nextValues.S5 in S5_TO_S15_EXACT) {
    nextValues.S15 = S5_TO_S15_EXACT[nextValues.S5];
    nextMeta.S15 = {
      source: "inferred",
      rule: "INF-01",
      inputs: ["S5"],
      confidence: "A",
      confidenceRate: ALL_S5_TO_S15.stats.confidenceRate,
      note: "由绝缘材料耐温等级推断",
    };
  }

  if ((nextValues.S5 === null || nextValues.S5 === undefined || nextValues.S5 === "") && Number.isFinite(nextValues.S15) && S15_TO_S5_EXACT[nextValues.S15]) {
    nextValues.S5 = S15_TO_S5_EXACT[nextValues.S15];
    nextMeta.S5 = {
      source: "inferred",
      rule: "INF-13",
      inputs: ["S15"],
      confidence: "A",
      confidenceRate: ALL_S15_TO_S5.stats.confidenceRate,
      note: "由温度等级反推绝缘材料",
    };
  }

  if ((nextValues.S19 === null || nextValues.S19 === undefined || nextValues.S19 === "")
    && nextValues.S5 !== null && nextValues.S5 !== undefined && nextValues.S5 !== ""
    && Number.isFinite(nextValues.S6)) {
    const inferredVoltage = getLookupMatch(CN_S5_S6_TO_S19, [nextValues.S5, nextValues.S6]);
    if (inferredVoltage && Number.isFinite(inferredVoltage.value)) {
      nextValues.S19 = inferredVoltage.value;
      nextMeta.S19 = {
        source: "inferred",
        rule: "INF-02",
        inputs: ["S5", "S6"],
        confidence: "A",
        confidenceRate: inferredVoltage.confidenceRate,
        note: "由绝缘材料和厚度查表推断额定电压",
      };
    }
  }

  if ((nextValues.S20 === null || nextValues.S20 === undefined || nextValues.S20 === "")
    && nextValues.S5 !== null && nextValues.S5 !== undefined && nextValues.S5 !== ""
    && Number.isFinite(nextValues.S6)) {
    const inferredResistance = getLookupMatch(CN_S5_S6_TO_S20, [nextValues.S5, nextValues.S6]);
    if (inferredResistance && Number.isFinite(inferredResistance.value)) {
      nextValues.S20 = inferredResistance.value;
      nextMeta.S20 = {
        source: "inferred",
        rule: "INF-03",
        inputs: ["S5", "S6"],
        confidence: "A",
        confidenceRate: inferredResistance.confidenceRate,
        note: "由绝缘材料和厚度查表推断绝缘电阻",
      };
    }
  }

  if ((nextValues.S21 === null || nextValues.S21 === undefined || nextValues.S21 === "")
    && Number.isFinite(nextValues.S2)
    && Number.isFinite(nextValues.S3)) {
    const inferredDcResistance = getLookupMatch(ALL_S2_S3_TO_S21, [nextValues.S2, nextValues.S3]);
    if (inferredDcResistance && Number.isFinite(inferredDcResistance.value)) {
      nextValues.S21 = inferredDcResistance.value;
      nextMeta.S21 = {
        source: "inferred",
        rule: "INF-04",
        inputs: ["S2", "S3"],
        confidence: "A",
        confidenceRate: inferredDcResistance.confidenceRate,
        note: "由芯数和截面积查表推断导体电阻",
      };
    }
  }

  if ((nextValues.S12 === null || nextValues.S12 === undefined || nextValues.S12 === "")
    && Number.isFinite(nextValues.S2)
    && Number.isFinite(nextValues.S3)
    && nextValues.S4 !== null && nextValues.S4 !== undefined && nextValues.S4 !== ""
    && Number.isFinite(nextValues.S6)
    && Number.isFinite(nextValues.S10)
    && nextValues.S11 !== null && nextValues.S11 !== undefined && nextValues.S11 !== "") {
    const inferredOd = getLookupMatch(
      ALL_S2_S3_S4_S6_S10_S11_TO_S12,
      [nextValues.S2, nextValues.S3, nextValues.S4, nextValues.S6, nextValues.S10, nextValues.S11]
    );
    if (inferredOd && Number.isFinite(inferredOd.value)) {
      nextValues.S12 = inferredOd.value;
      nextMeta.S12 = {
        source: "inferred",
        rule: "INF-07",
        inputs: ["S2", "S3", "S4", "S6", "S10", "S11"],
        confidence: "A",
        confidenceRate: inferredOd.confidenceRate,
        note: "由导体结构、绝缘厚度和铠装参数查表推断外径",
      };
    }
  }

  if ((nextValues.S11 === null || nextValues.S11 === undefined || nextValues.S11 === "")
    && Number.isFinite(nextValues.S12)
    && Number.isFinite(nextValues.S14)) {
    const inferredArmorMaterial = getLookupMatch(ALL_S12_S14_TO_S11, [nextValues.S12, nextValues.S14]);
    if (inferredArmorMaterial && inferredArmorMaterial.value !== null && inferredArmorMaterial.value !== undefined && inferredArmorMaterial.value !== "") {
      nextValues.S11 = inferredArmorMaterial.value;
      nextMeta.S11 = {
        source: "inferred",
        rule: "INF-12",
        inputs: ["S12", "S14"],
        confidence: "A",
        confidenceRate: inferredArmorMaterial.confidenceRate,
        note: "由外径和重量查表反推铠装材料",
      };
    }
  }

  if ((nextValues.S18 === null || nextValues.S18 === undefined || nextValues.S18 === "")
    && nextValues.S11 !== null && nextValues.S11 !== undefined && nextValues.S11 !== ""
    && Number.isFinite(nextValues.S12)
    && Number.isFinite(nextValues.S14)) {
    const inferredExpansion = getLookupMatch(ALL_S11_S12_S14_TO_S18, [nextValues.S11, nextValues.S12, nextValues.S14]);
    if (inferredExpansion && inferredExpansion.value !== null && inferredExpansion.value !== undefined && inferredExpansion.value !== "") {
      nextValues.S18 = inferredExpansion.value;
      nextMeta.S18 = {
        source: "inferred",
        rule: "INF-11",
        inputs: ["S11", "S12", "S14"],
        confidence: "A",
        confidenceRate: inferredExpansion.confidenceRate,
        note: "由铠装材料、外径和重量查表推断线性延展系数",
      };
    }
  }

  if ((nextValues.S17 === null || nextValues.S17 === undefined || nextValues.S17 === "") && Number.isFinite(nextValues.S12)) {
    const estimate = Math.round(nextValues.S12 * 50 * 100) / 100;
    nextValues.S17 = estimate;
    nextMeta.S17 = {
      source: "inferred",
      rule: "INF-10",
      inputs: ["S12"],
      confidence: "B",
      confidenceRate: ALL_S12_TO_S17.stats.confidenceRate,
      note: `经验公式，建议范围 ${Math.round(nextValues.S12 * 40 * 100) / 100}–${Math.round(nextValues.S12 * 60 * 100) / 100} mm`,
    };
  }

  return { values: nextValues, meta: nextMeta };
};

const buildFieldMeta = (values, source, rule, inputKey) => Object.fromEntries(
  Object.keys(values)
    .filter(key => values[key] !== null && values[key] !== undefined && values[key] !== "")
    .map(key => [key, {
      source,
      rule,
      inputs: inputKey ? [inputKey] : [],
      confidence: source === "inferred" ? "A" : null,
    }])
);

async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function CopyModelButton({ text, lang, onCopied, onClickStop = true }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e) => {
    if (onClickStop) e.stopPropagation();
    try {
      await copyToClipboard(text);
      setCopied(true);
      onCopied?.(text);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      title={copied ? T[lang].copied : T[lang].copy}
      aria-label={copied ? T[lang].copied : T[lang].copy}
      style={{
        marginLeft: 6,
        width: 20,
        height: 20,
        padding: 0,
        borderRadius: 4,
        border: `1px solid ${copied ? C.borderActive : C.border}`,
        background: copied ? C.tabActive : "transparent",
        color: copied ? C.blue : C.textSec,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        verticalAlign: "middle",
        flex: "0 0 auto",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
        <rect x="5.5" y="3.5" width="7" height="9" rx="1.2" />
        <rect x="2.5" y="6.5" width="7" height="7" rx="1.2" />
      </svg>
    </button>
  );
}

const sLabel = (schema, lang) => {
  if (lang === "en") return schema.labelEn;
  if (lang === "ru") return schema.labelRu;
  return schema.label;
};

// ============================================================
// 数据层：S元素定义 + 产品数据库
// ============================================================

const S_SCHEMA = Object.fromEntries(
  Object.entries(sSchemaRaw).map(([id, v]) => [id, { id, ...v }])
);

const K_NAME_FIELDS = Object.keys(sSchemaRaw).filter(id => sSchemaRaw[id].k);
const R_NAME_FIELDS = Object.keys(sSchemaRaw).filter(id => sSchemaRaw[id].r);

const PRODUCTS = [
  ...cnProducts.map(p => ({ ...p, ru: p.ru ?? null })),
  ...ruProducts.map(p => ({ ...p, cn: p.cn ?? null })),
].map(product => {
  const { _meta = {}, ...values } = product;
  const inferredProduct = inferRuntimeFields(values, _meta);
  return { ...inferredProduct.values, _meta: inferredProduct.meta };
});

// ============================================================
// 解析器：从型号名提取S值
// ============================================================

function parseChinese(input) {
  const s = {};
  const upper = input.trim().toUpperCase();

  if (upper.startsWith("WMF")) { s.S1 = "密封"; }
  else if (upper.startsWith("W")) { s.S1 = "普通"; }

  const coreMatch = upper.match(/(?:WMF|W)(GS|1|3|4|5|7)/);
  if (coreMatch) {
    const c = coreMatch[1];
    s.S2 = (c === "GS") ? 1 : parseInt(c);
  }

  if (upper.includes("PFA")) s.S5 = "PFA";
  else if (upper.includes("F46")) s.S5 = "F46";
  else if (upper.includes("F40")) s.S5 = "F40";
  else if (upper.match(/(?:WMF|W)(?:GS|1|3|4|5|7)B/)) s.S5 = "B";

  if (upper.includes("PP")) s.S7 = "PP";
  else if (/P(?!FA)/.test(upper.replace(/^WMF|^W/, "").replace(/GS|[13457]/, "").replace(/B|F40|F46|PFA/, ""))) {
    const afterInsul = upper.replace(/^WMF?/, "").replace(/^(GS|[13457])/, "").replace(/^(PFA|F46|F40|B)/, "");
    if (afterInsul.startsWith("P") && !afterInsul.startsWith("PF")) s.S7 = "P";
  }
  if (!s.S7) s.S7 = "无";

  const odMatch = input.match(/(\d+\.?\d*)\s*(?:mm)?$/i) || input.match(/-(\d+\.?\d+)/);
  if (odMatch) s.S12 = parseFloat(odMatch[1]);

  const features = [];
  if (upper.includes("-JY")) features.push("JY");
  if (upper.includes("-FF") || upper.includes("FF-")) features.push("FF");
  if (upper.includes("-FD") || upper.includes("FD-")) features.push("FD");
  if (upper.includes("-HS") || upper.includes("HS-")) features.push("HS");
  if (/X(?!$)/.test(upper) || upper.endsWith("X")) {
    if (upper.match(/[13457]B?X/)) features.push("X");
  }
  s.S23 = features.join(",") || "";

  const specMatch = input.match(/(\d+)\*(\d+\.?\d+)/);
  if (specMatch) {
    s.S2 = parseInt(specMatch[1]);
    s.S3 = parseFloat(specMatch[2]);
  }

  return s;
}

function parseRussian(input) {
  const s = {};
  const raw = input.trim();
  const lower = raw.toLowerCase();
  const isFiber = raw.startsWith("ОК") || lower.includes("тбп");
  const isSwab = raw.includes("Св");
  const isHeating = raw.includes("нАП") || raw.includes("нМСП") || raw.includes("нАСП") || lower.startsWith("кнп");
  const isAntiCorrosion = lower.includes("оа");
  const isCoax = raw.includes("1К");

  const coreMatch = raw.match(/(\d+)\s*[хx×]\s*(\d+[,.]?\d*)/);
  if (coreMatch) {
    s.S2 = parseInt(coreMatch[1]);
    s.S3 = parseFloat(coreMatch[2].replace(",", "."));
  }

  const numbersAfterArea = !isFiber && raw.match(/[хx×]\s*[\d,.]+[-–](\d+)[-–](\d+)(?:[-–](\d+))?/);
  const explicitLayers = numbersAfterArea?.[3] ? parseInt(numbersAfterArea[3]) : null;

  if (numbersAfterArea) {
    s.S16 = parseInt(numbersAfterArea[1]);
    s.S15 = parseInt(numbersAfterArea[2]);
    if (explicitLayers) s.S10 = explicitLayers;
  }

  if (isFiber) {
    s.S1 = "光缆";
    const fiberMatch = raw.match(/(?:^|[-\s])(\d+)Е(?:[-\s]|$)/i) || raw.match(/х(\d+)Е/i);
    if (fiberMatch) s.S26 = parseInt(fiberMatch[1]);
    const tempMatch = raw.match(/-(\d+)\s*$/);
    if (tempMatch) s.S15 = parseInt(tempMatch[1]);
  } else if (isSwab) {
    s.S1 = "抽汲";
  } else if (isHeating) {
    s.S1 = "加热";
  } else if (isCoax) {
    s.S1 = "同轴";
  } else if (explicitLayers && explicitLayers > 2 && raw.startsWith("КГ")) {
    s.S1 = "加强";
  } else if (isAntiCorrosion) {
    s.S1 = "防腐";
  } else if (raw.startsWith("КГ")) {
    s.S1 = "普通";
  }

  if (isAntiCorrosion) s.S23 = "Оа";
  else if (isSwab) s.S23 = "Св";
  else if (explicitLayers && explicitLayers > 2 && raw.startsWith("КГ")) s.S23 = "HS";

  if (isCoax) s.S7 = "同轴屏蔽";

  return s;
}

// ============================================================
// 筛选引擎
// ============================================================

// 匹配语义：≥ 向上兼容（过剩可接受）
const GTE_FIELDS = new Set(["S10", "S15", "S16", "S19", "S20"]);
// 匹配语义：≤ 向下兼容（越小越好）
const LTE_FIELDS = new Set(["S17", "S21"]);
// 匹配语义：容差 ±10%
const TOLERANCE_FIELDS = new Set(["S6", "S12", "S13", "S14", "S18", "S22"]);

function matchesFilter(product, filters) {
  for (const [key, val] of Object.entries(filters)) {
    if (val === null || val === undefined || val === "") continue;
    const pv = product[key];
    if (pv === null || pv === undefined) return false;
    if (typeof pv === "number" && typeof val === "number") {
      if (GTE_FIELDS.has(key)) {
        if (pv < val - 0.01) return false;
      } else if (LTE_FIELDS.has(key)) {
        if (pv > val + 0.01) return false;
      } else if (TOLERANCE_FIELDS.has(key)) {
        const margin = Math.abs(val) * 0.1 || 0.01;
        if (Math.abs(pv - val) > margin) return false;
      } else {
        if (Math.abs(pv - val) > 0.01) return false;
      }
    } else if (String(pv) !== String(val)) {
      return false;
    }
  }
  return true;
}

// ============================================================
// UI 组件
// ============================================================

function parseSummary(parsed, lang, t) {
  if (!parsed) return null;
  const entries = Object.entries(parsed).filter(([, v]) => v !== null && v !== undefined && v !== "");
  const count = entries.length;
  if (count === 0) return { text: t.parseFail, level: "fail" };
  if (count <= 2) return { text: t.parsePartial(count), level: "partial" };
  const parts = entries.map(([k, v]) => {
    if (k === "S2") return `${v}${lang === "cn" ? "芯" : lang === "ru" ? "жил" : "core"}`;
    if (k === "S3") return `${v}mm\u00B2`;
    if (k === "S12") return `\u2300${v}mm`;
    if (k === "S15") return `${v}\u00B0C`;
    if (k === "S16") return `${v}kN`;
    if (k === "S10") return `${v}${lang === "cn" ? "层" : lang === "ru" ? "сл." : "layers"}`;
    return fieldOptionLabel(k, v, lang);
  });
  return { text: `${t.parseOk}${parts.join(" \u00B7 ")}`, level: "success" };
}

const FIELD_OPTIONS = {
  S1:  ["普通", "密封", "抽汲", "防腐", "同轴", "加强", "加热"],
  S2:  [1, 2, 3, 4, 5, 7],
  S3:  [0.12, 0.2, 0.25, 0.35, 0.5, 0.75, 1.0, 1.5, 2.0, 4.0, 8.0, 12.0, 14.0, 16.0, 22.0, 25.0],
  S5:  ["B", "F40", "F46", "PFA"],
  S7:  ["无", "P", "PP", "同轴屏蔽"],
  S10: [2, 3, 4],
  S11: ["碳钢", "不锈钢"],
  S15: [80, 90, 150, 180, 200, 230, 260, 350],
  S23: ["", "JY", "FF", "FD", "HS", "X", "Оа", "Св", "н"],
};

const NUM_FIELDS = ["S3", "S6", "S12", "S13", "S14", "S15", "S16", "S17", "S18", "S19", "S20", "S21", "S22", "S24", "S26"];

const S_GROUPS = [
  { label: { cn: "基本参数", en: "Basic", ru: "Основные" },
    fields: ["S1", "S2", "S3", "S4", "S25"] },
  { label: { cn: "绝缘与屏蔽", en: "Insulation & Shielding", ru: "Изоляция и экран" },
    fields: ["S5", "S6", "S7"] },
  { label: { cn: "铠装", en: "Armor", ru: "Броня" },
    fields: ["S8", "S9", "S10", "S11", "S27"] },
  { label: { cn: "物理指标", en: "Physical", ru: "Физические" },
    fields: ["S12", "S13", "S14", "S15", "S16", "S17", "S18"] },
  { label: { cn: "电气参数", en: "Electrical", ru: "Электрические" },
    fields: ["S19", "S20", "S21", "S22", "S24"] },
  { label: { cn: "其他", en: "Other", ru: "Прочее" },
    fields: ["S23", "S26"] },
];

const summarizeMatchMode = (metaMap, lang) => {
  const inferredEntries = Object.entries(metaMap || {}).filter(([, meta]) => meta?.source === "inferred");
  if (inferredEntries.length === 0) {
    return { kind: "direct", label: MATCH_MODE_LABELS[lang].direct, detail: "" };
  }

  const detail = inferredEntries
    .map(([sid, meta]) => {
      const confidence = confidenceLabel(meta, lang, true);
      const suffix = confidence ? ` (${confidence})` : "";
      return `${sid} ← ${(meta.inputs || []).join("+")}${suffix}`;
    })
    .join(" · ");

  return {
    kind: "inferred",
    label: MATCH_MODE_LABELS[lang].inferred,
    detail: `${MATCH_MODE_LABELS[lang].inferredBy}${detail}`,
  };
};

const chooseFieldCombinations = (items, size) => {
  const result = [];
  const path = [];

  const walk = (start) => {
    if (path.length === size) {
      result.push([...path]);
      return;
    }
    for (let i = start; i <= items.length - (size - path.length); i += 1) {
      path.push(items[i]);
      walk(i + 1);
      path.pop();
    }
  };

  walk(0);
  return result;
};

const ignoreFieldPenalty = (sid, meta = {}) => {
  let score = 70;
  if (meta.source === "inferred") score = 20;
  else if (meta.source === "parsed") score = 55;
  else if (meta.source === "direct") score = 90;
  else if (meta.source === "manual") score = 130;

  if (Number.isFinite(meta.confidenceRate)) score += Math.round(meta.confidenceRate / 8);
  if (["S1", "S2", "S3"].includes(sid)) score += 40;
  if (["S23", "S7", "S26"].includes(sid)) score -= 10;
  return score;
};

const describeIgnoreFieldReason = (sid, meta = {}, lang) => {
  const fieldName = sLabel(S_SCHEMA[sid], lang);
  const confidence = Number.isFinite(meta.confidenceRate) ? `${meta.confidenceRate}%` : null;

  if (meta.source === "inferred") {
    if (confidence) {
      return textByLang(lang, {
        cn: `${sid} ${fieldName} 为推理字段，当前置信率 ${confidence}，比显式字段更适合先放宽。`,
        en: `${sid} ${fieldName} is inferred with ${confidence} confidence, so it is safer to relax before explicit fields.`,
        ru: `${sid} ${fieldName} выведено с уверенностью ${confidence}, поэтому его разумнее ослаблять раньше явных полей.`,
      });
    }
    return textByLang(lang, {
      cn: `${sid} ${fieldName} 为推理字段，通常比显式解析字段更适合优先忽略。`,
      en: `${sid} ${fieldName} is inferred, so it is usually a better relaxation candidate than explicit parsed fields.`,
      ru: `${sid} ${fieldName} является выводным полем, поэтому обычно его лучше ослаблять раньше явно распознанных полей.`,
    });
  }

  if (["S23", "S7", "S26"].includes(sid)) {
    return textByLang(lang, {
      cn: `${sid} ${fieldName} 属于附加/特性字段，限制较细，先放宽的代价更低。`,
      en: `${sid} ${fieldName} is an auxiliary/special field, so relaxing it usually costs less than loosening core structure fields.`,
      ru: `${sid} ${fieldName} относится к дополнительным/специальным полям, поэтому его ослабление обычно дешевле, чем ослабление базовой структуры.`,
    });
  }

  if (["S1", "S2", "S3"].includes(sid)) {
    return textByLang(lang, {
      cn: `${sid} ${fieldName} 是核心结构字段，本应尽量保留；出现在建议中说明它已经成为当前主要阻塞项。`,
      en: `${sid} ${fieldName} is a core structural field and should normally be kept; its appearance here means it is a major blocker right now.`,
      ru: `${sid} ${fieldName} является базовым структурным полем и обычно должно сохраняться; если оно попало в совет, значит сейчас это главный блокирующий фактор.`,
    });
  }

  if (meta.source === "manual") {
    return textByLang(lang, {
      cn: `${sid} ${fieldName} 来自人工录入，约束最强；只有在更低代价字段不足以解锁结果时才会排到前面。`,
      en: `${sid} ${fieldName} was entered manually and is treated as a strong constraint; it only rises when cheaper relaxations cannot unlock results.`,
      ru: `${sid} ${fieldName} введено вручную и считается сильным ограничением; оно поднимается в списке только когда более дешёвые ослабления не дают результат.`,
    });
  }

  if (meta.source === "direct") {
    return textByLang(lang, {
      cn: `${sid} ${fieldName} 来自产品原始数据，通常不会优先忽略；这次说明它对无结果影响很大。`,
      en: `${sid} ${fieldName} comes from direct product data and is not usually relaxed first; here it means this field is strongly blocking matches.`,
      ru: `${sid} ${fieldName} взято напрямую из данных продукта и обычно не ослабляется первым; здесь это означает, что поле сильно блокирует совпадения.`,
    });
  }

  if (meta.source === "parsed") {
    return textByLang(lang, {
      cn: `${sid} ${fieldName} 由型号名直接解析得到，约束强于推理字段，但弱于人工固定条件。`,
      en: `${sid} ${fieldName} is parsed directly from the model name, so it is stronger than inferred fields but still softer than manual fixed constraints.`,
      ru: `${sid} ${fieldName} распознано прямо из марки, поэтому это более жёсткое условие, чем выводные поля, но мягче ручной фиксации.`,
    });
  }

  return textByLang(lang, {
    cn: `${sid} ${fieldName} 当前是主要阻塞条件之一，放宽后能立即解锁结果。`,
    en: `${sid} ${fieldName} is currently one of the main blockers, and relaxing it unlocks results immediately.`,
    ru: `${sid} ${fieldName} сейчас является одним из главных блокеров, и его ослабление сразу открывает результаты.`,
  });
};

const summarizeRelaxationReason = (ignoreFields, filterMeta, lang) => (
  ignoreFields.map(sid => describeIgnoreFieldReason(sid, filterMeta[sid], lang)).join(" ")
);

const buildRelaxationSuggestions = ({
  filters,
  filterMeta,
  targetProducts,
  lang,
}) => {
  const activeKeys = Object.keys(filters).filter(key => filters[key] !== null && filters[key] !== undefined && filters[key] !== "");
  if (activeKeys.length === 0) return [];
  const maxIgnoreCount = Math.min(3, activeKeys.length - 1);
  if (maxIgnoreCount <= 0) return [];

  const suggestions = [];

  for (let ignoreCount = 1; ignoreCount <= maxIgnoreCount; ignoreCount += 1) {
    const combinations = chooseFieldCombinations(activeKeys, ignoreCount);
    combinations.forEach(ignoreFields => {
      const ignoreSet = new Set(ignoreFields);
      const relaxedFilters = Object.fromEntries(
        Object.entries(filters).filter(([key]) => !ignoreSet.has(key))
      );
      const matched = targetProducts.filter(product => matchesFilter(product, relaxedFilters));
      if (matched.length === 0) return;

      const score = ignoreFields.reduce(
        (sum, sid) => sum + ignoreFieldPenalty(sid, filterMeta[sid]),
        0
      );

      suggestions.push({
        ignoreFields,
        ignoreCount,
        hitCount: matched.length,
        score,
        reason: summarizeRelaxationReason(ignoreFields, filterMeta, lang),
      });
    });
  }

  return suggestions.sort((a, b) => (
    a.ignoreCount - b.ignoreCount
    || a.score - b.score
    || a.hitCount - b.hitCount
    || a.ignoreFields.join("|").localeCompare(b.ignoreFields.join("|"))
  ));
};

// ============================================================
// 配色常量
// ============================================================
const C = {
  bg: "#0f1419",
  panel: "#161b22",
  card: "#0d1117",
  text: "#d1d5db",
  textSec: "#8b949e",
  textMuted: "#6e7681",
  border: "#30363d",
  borderActive: "#388bfd",
  gold: "#f0b429",
  goldBg: "#3d2e0a",
  blue: "#58a6ff",
  blueBg: "#0e2a3d",
  white: "#f0f4f8",
  tabActive: "#1e3a5f",
  tabInactive: "#161b22",
};

const formatCnCardDetail = (product) => (
  [
    product?.S15 !== null && product?.S15 !== undefined ? `${product.S15}°C` : null,
    product?.S16 !== null && product?.S16 !== undefined ? `${product.S16}kN` : null,
    product?.S12 !== null && product?.S12 !== undefined ? `⌀${product.S12}mm` : null,
  ].filter(Boolean).join(" ") || "—"
);

const formatRuCardDetail = (product) => (
  [
    product?.S12 !== null && product?.S12 !== undefined ? `⌀${product.S12}mm` : null,
    product?.S14 !== null && product?.S14 !== undefined ? `${product.S14}kg/km` : null,
  ].filter(Boolean).join(" ") || "—"
);

const RELAXATION_PAGE_SIZE = 5;
const RIGHT_PANEL_HEIGHT = "calc(100vh - 220px)";

export default function CableMapper() {
  const [mode, setMode] = useState("cn2ru");
  const [cnInput, setCnInput] = useState("");
  const [ruInput, setRuInput] = useState("");
  const [manualFilters, setManualFilters] = useState({});
  const [ignoredParsedFieldsByMode, setIgnoredParsedFieldsByMode] = useState({ cn2ru: {}, ru2cn: {} });
  const [demandList, setDemandList] = useState([]);
  const [demandOpen, setDemandOpen] = useState(false);
  const [lang, setLang] = useState("cn");
  const [relaxationPage, setRelaxationPage] = useState(0);

  const inputText = mode === "cn2ru" ? cnInput : ruInput;
  const setInputText = mode === "cn2ru" ? setCnInput : setRuInput;

  const t = T[lang];
  const schemaFieldCount = Object.keys(S_SCHEMA).length;

  useEffect(() => { document.title = t.title; }, [t.title]);

  const [showAllS, setShowAllS] = useState(false);

  const parsedResult = useMemo(() => {
    if (mode === "cn2ru" && cnInput.trim()) {
      const parsed = parseChinese(cnInput);
      return inferRuntimeFields(parsed, buildFieldMeta(parsed, "parsed", "PARSE-CN", "cn"));
    }
    if (mode === "ru2cn" && ruInput.trim()) {
      const parsed = parseRussian(ruInput);
      return inferRuntimeFields(parsed, buildFieldMeta(parsed, "parsed", "PARSE-RU", "ru"));
    }
    return { values: null, meta: {} };
  }, [cnInput, ruInput, mode]);

  const manualResult = useMemo(() => inferRuntimeFields(
    manualFilters,
    buildFieldMeta(manualFilters, "manual", "MANUAL", null)
  ), [manualFilters]);

  const ignoredParsedFields = mode === "manual" ? {} : (ignoredParsedFieldsByMode[mode] || {});

  useEffect(() => {
    setIgnoredParsedFieldsByMode(prev => ({ ...prev, cn2ru: {} }));
  }, [cnInput]);

  useEffect(() => {
    setIgnoredParsedFieldsByMode(prev => ({ ...prev, ru2cn: {} }));
  }, [ruInput]);

  const activeFilters = useMemo(() => {
    if (mode === "manual") return manualResult.values;
    return Object.fromEntries(
      Object.entries(parsedResult.values || {}).filter(([key, value]) => {
        if (value === null || value === undefined || value === "") return false;
        return !ignoredParsedFields[key];
      })
    );
  }, [ignoredParsedFields, mode, manualResult.values, parsedResult.values]);

  const activeFilterMeta = useMemo(() => {
    if (mode === "manual") return manualResult.meta;
    return Object.fromEntries(
      Object.entries(parsedResult.meta || {}).filter(([key]) => !ignoredParsedFields[key])
    );
  }, [ignoredParsedFields, mode, manualResult.meta, parsedResult.meta]);

  const matchMode = useMemo(
    () => summarizeMatchMode(activeFilterMeta, lang),
    [activeFilterMeta, lang]
  );

  const results = useMemo(() => {
    const fKeys = Object.keys(activeFilters).filter(k => activeFilters[k] !== null && activeFilters[k] !== undefined && activeFilters[k] !== "");
    if (fKeys.length === 0) return { cn: [], ru: [], all: PRODUCTS };
    const matched = PRODUCTS.filter(p => matchesFilter(p, activeFilters));
    return { cn: matched.filter(p => p.cn), ru: matched.filter(p => p.ru), all: matched };
  }, [activeFilters]);

  const primaryResultKey = mode === "cn2ru" ? "ru" : mode === "ru2cn" ? "cn" : null;
  const targetProducts = useMemo(() => {
    if (primaryResultKey === "ru") return PRODUCTS.filter(product => product.ru);
    if (primaryResultKey === "cn") return PRODUCTS.filter(product => product.cn);
    return [];
  }, [primaryResultKey]);

  const primaryResults = primaryResultKey === "ru" ? results.ru : primaryResultKey === "cn" ? results.cn : [];

  const relaxationSuggestions = useMemo(() => {
    if (mode === "manual" || !primaryResultKey) return [];
    if (primaryResults.length > 0) return [];
    if (Object.keys(activeFilters).length < 1) return [];
    return buildRelaxationSuggestions({
      filters: activeFilters,
      filterMeta: activeFilterMeta,
      targetProducts,
      lang,
    });
  }, [activeFilterMeta, activeFilters, lang, mode, primaryResultKey, primaryResults.length, targetProducts]);

  const relaxationSuggestionGroups = useMemo(() => {
    const grouped = new Map();
    const pageStart = relaxationPage * RELAXATION_PAGE_SIZE;
    const pageItems = relaxationSuggestions.slice(pageStart, pageStart + RELAXATION_PAGE_SIZE);
    pageItems.forEach(suggestion => {
      if (!grouped.has(suggestion.ignoreCount)) grouped.set(suggestion.ignoreCount, []);
      grouped.get(suggestion.ignoreCount).push(suggestion);
    });
    return [...grouped.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([ignoreCount, suggestions]) => ({ ignoreCount, suggestions }));
  }, [relaxationPage, relaxationSuggestions]);

  const relaxationPageCount = useMemo(
    () => Math.max(1, Math.ceil(relaxationSuggestions.length / RELAXATION_PAGE_SIZE)),
    [relaxationSuggestions.length]
  );

  useEffect(() => {
    setRelaxationPage(0);
  }, [mode, cnInput, ruInput, activeFilters, primaryResultKey]);

  useEffect(() => {
    if (relaxationPage >= relaxationPageCount) {
      setRelaxationPage(Math.max(0, relaxationPageCount - 1));
    }
  }, [relaxationPage, relaxationPageCount]);

  const handleManualChange = (field, value) => {
    setManualFilters(prev => {
      const next = { ...prev };
      if (value === "" || value === null || value === undefined) delete next[field];
      else next[field] = NUM_FIELDS.includes(field) ? parseFloat(value) : value;
      return next;
    });
  };

  const setParsedFieldEnabled = (field, enabled) => {
    if (mode === "manual") return;
    setIgnoredParsedFieldsByMode(prev => {
      const current = { ...(prev[mode] || {}) };
      if (enabled) delete current[field];
      else current[field] = true;
      return { ...prev, [mode]: current };
    });
  };

  const applyRelaxationSuggestion = (ignoreFields) => {
    if (mode === "manual") return;
    setIgnoredParsedFieldsByMode(prev => {
      const current = { ...(prev[mode] || {}) };
      ignoreFields.forEach(field => {
        current[field] = true;
      });
      return { ...prev, [mode]: current };
    });
  };

  const hitCount = Object.keys(activeFilters).filter(k => activeFilters[k] !== null && activeFilters[k] !== undefined && activeFilters[k] !== "").length;

  const thPad = { padding: "6px 10px" };

  // Hover-to-Inspect state
  const hoverTimerRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [copyNotice, setCopyNotice] = useState("");

  // Flying cargo animation state
  const [flyingItems, setFlyingItems] = useState([]);
  const flyIdRef = useRef(0);
  const prevDemandLenRef = useRef(0);
  const [demandBounce, setDemandBounce] = useState(false);

  useEffect(() => {
    if (prevDemandLenRef.current === 0 && demandList.length > 0) {
      setDemandBounce(true);
      const tid = setTimeout(() => setDemandBounce(false), 500);
      prevDemandLenRef.current = demandList.length;
      return () => clearTimeout(tid);
    }
    prevDemandLenRef.current = demandList.length;
  }, [demandList.length]);

  const cancelDismiss = () => {
    if (dismissTimerRef.current) { clearTimeout(dismissTimerRef.current); dismissTimerRef.current = null; }
  };

  const startDismiss = () => {
    cancelDismiss();
    dismissTimerRef.current = setTimeout(() => {
      setHover(null);
      dismissTimerRef.current = null;
    }, 500);
  };

  const handleCardEnter = (product, e) => {
    cancelDismiss();
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    const mx = e.clientX, my = e.clientY;
    const tid = setTimeout(() => {
      setHover(prev => {
        if (!prev) return null;
        const tw = 520, th = 400;
        const left = prev.mouseX + 20 + tw > window.innerWidth ? prev.mouseX - tw - 10 : prev.mouseX + 20;
        const top = prev.mouseY + 10 + th > window.innerHeight ? prev.mouseY - th - 10 : prev.mouseY + 10;
        return { ...prev, phase: "tooltip", tooltipLeft: left, tooltipTop: top };
      });
    }, 2000);
    hoverTimerRef.current = tid;
    setHover({ product, mouseX: mx, mouseY: my, phase: "ring" });
  };

  const handleCardMove = (e) => {
    setHover(prev => prev?.phase === "ring" ? { ...prev, mouseX: e.clientX, mouseY: e.clientY } : prev);
  };

  const handleCardLeave = () => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
    if (hover?.phase === "tooltip") {
      startDismiss();
    } else {
      setHover(null);
    }
  };

  const handleCopyNotice = (text) => {
    setCopyNotice(text);
    setTimeout(() => {
      setCopyNotice(prev => prev === text ? "" : prev);
    }, 1200);
  };

  // Demand list handlers
  const handleModelClick = (modelName, product, clickEvent) => {
    const isNew = !demandList.some(d => d.model === modelName);
    setDemandList(prev => {
      if (prev.some(d => d.model === modelName)) return prev;
      return [...prev, { model: modelName, product, feet: 1 }];
    });
    if (isNew && clickEvent) {
      const id = flyIdRef.current++;
      setFlyingItems(prev => [...prev, {
        id, startX: clickEvent.clientX, startY: clickEvent.clientY,
      }]);
    }
  };

  const updateFeet = (model, feet) => {
    setDemandList(prev => prev.map(d => d.model === model ? { ...d, feet } : d));
  };

  const exportCSV = () => {
    const header = lang === "cn" ? "\u578B\u53F7,\u82F1\u5C3A\u6570" : lang === "ru" ? "\u041C\u0430\u0440\u043A\u0430,\u0424\u0443\u0442\u044B" : "Model,Feet";
    const rows = demandList.map(d => `${d.model},${d.feet}`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "cable-demand-list.csv"; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div style={{
      fontFamily: "'Microsoft YaHei', '微软雅黑', sans-serif",
      background: C.bg, color: C.text,
      minHeight: "100vh", padding: 24, boxSizing: "border-box",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.panel}; }
        ::-webkit-scrollbar-thumb { background: #474f5a; border-radius: 3px; }
        @keyframes hover-ring-fill {
          from { stroke-dashoffset: 62.83; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes demand-pop {
          0%   { transform: scale(0) rotate(-12deg); opacity: 0; }
          50%  { transform: scale(1.18) rotate(3deg); opacity: 1; }
          75%  { transform: scale(0.94) rotate(-1deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 28, position: "relative" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.white, margin: 0, letterSpacing: 2 }}>
            {t.title}
          </h1>
          <div style={{ fontSize: 13, color: C.textSec, marginTop: 4, letterSpacing: 1 }}>
            {t.subtitle}
          </div>
        </div>
        {/* Language toggle */}
        <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 0 }}>
          {["cn", "en", "ru"].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: "5px 12px", fontSize: 12, fontWeight: lang === l ? 700 : 400,
              background: lang === l ? C.tabActive : "transparent",
              color: lang === l ? C.blue : C.textSec,
              border: `1px solid ${C.border}`, cursor: "pointer", fontFamily: "inherit",
              borderRadius: l === "cn" ? "4px 0 0 4px" : l === "ru" ? "0 4px 4px 0" : 0,
            }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, justifyContent: "center" }}>
        {[
          { id: "cn2ru", label: t.tabCn2ru },
          { id: "ru2cn", label: t.tabRu2cn },
          { id: "manual", label: t.tabManual },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => { setMode(tab.id); }}
            style={{
              padding: "10px 24px", fontSize: 14,
              background: mode === tab.id ? C.tabActive : C.tabInactive,
              color: mode === tab.id ? C.blue : C.textSec,
              border: `1px solid ${mode === tab.id ? C.borderActive : C.border}`,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Left panel */}
        <div style={{ flex: "1 1 360px", minWidth: 340 }}>
          {mode !== "manual" && (
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.textSec, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                {mode === "cn2ru" ? t.inputLabelCn : t.inputLabelRu}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={mode === "cn2ru" ? "W3B-JY-14.7" : "КГ 3х0,75-60-150"}
                  style={{
                    flex: 1, background: C.card, color: mode === "cn2ru" ? C.gold : C.blue,
                    border: `1px solid ${C.borderActive}`, padding: "10px 12px",
                    fontSize: 16, fontFamily: "inherit", outline: "none",
                  }}
                />
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(mode === "cn2ru"
                  ? ["W3B-JY-14.7", "W7F46PP-11", "WGSB-6.25", "W3BP-8.4"]
                  : ["КГ 3х0,75-60-150", "КГл 1х0,5-18-200", "КГ 7х0,5-70-150", "КГ 3х0,75-55-90 Оа"]
                ).map(ex => (
                  <button key={ex} onClick={() => setInputText(ex)} style={{
                    background: C.card, color: mode === "cn2ru" ? C.gold : C.blue, border: `1px solid ${C.border}`,
                    padding: "4px 10px", fontSize: 11, fontFamily: "inherit", cursor: "pointer", opacity: 0.7,
                  }}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Parse feedback */}
          {mode !== "manual" && inputText.trim() && (() => {
            const fb = parseSummary(parsedResult.values, lang, t);
            if (!fb) return null;
            const colors = {
              success: { border: "#238636", bg: "#0d2818", text: "#3fb950" },
              partial: { border: "#9e6a03", bg: "#2d2000", text: "#d29922" },
              fail:    { border: "#da3633", bg: "#2d0b0b", text: "#f85149" },
            };
            const c = colors[fb.level];
            return (
              <div style={{
                background: c.bg, borderLeft: `3px solid ${c.border}`,
                padding: "8px 12px", marginBottom: 16, fontSize: 13, color: c.text,
              }}>
                {fb.text}
              </div>
            );
          })()}

          {/* S-filter panel */}
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, padding: 20 }}>
            <div style={{ fontSize: 12, color: C.textSec, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
              {t.sPanel(hitCount)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(S_SCHEMA)
                .filter(([sid]) => {
                  if (mode === "manual" || showAllS) return true;
                  const val = parsedResult.values?.[sid];
                  return val !== "" && val !== null && val !== undefined;
                })
                .map(([sid, schema]) => {
                const val = mode === "manual" ? (manualFilters[sid] ?? "") : (parsedResult.values?.[sid] ?? "");
                const meta = mode === "manual" ? manualResult.meta?.[sid] : parsedResult.meta?.[sid];
                const source = meta?.source;
                const isFromName = source === "parsed" || (mode === "cn2ru" ? K_NAME_FIELDS.includes(sid) : mode === "ru2cn" ? R_NAME_FIELDS.includes(sid) : false);
                const hasValue = val !== "" && val !== null && val !== undefined;
                const isApplied = mode === "manual" ? hasValue : hasValue && !ignoredParsedFields[sid];
                const sourceStyle = source ? SOURCE_COLORS[source] || SOURCE_COLORS.direct : null;

                return (
                  <div key={sid} style={{
                    display: "flex", flexDirection: "column", gap: 4,
                    opacity: hasValue ? (isApplied ? 1 : 0.55) : 0.5,
                  }}>
                    <div style={{
                      fontSize: 12,
                      color: hasValue ? (isFromName ? C.gold : C.blue) : C.textMuted,
                      display: "flex", alignItems: "center", gap: 4, justifyContent: "space-between",
                    }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                        <span style={{
                          background: hasValue ? (isFromName ? C.goldBg : C.blueBg) : "#1a1f2e",
                          padding: "1px 5px", fontSize: 10,
                          color: hasValue ? (isFromName ? C.gold : C.blue) : C.textMuted,
                        }}>{sid}</span>
                        {sLabel(schema, lang)}
                        {hasValue && source && (
                          <span style={{
                            marginLeft: 4,
                            padding: "1px 5px",
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 700,
                            color: sourceStyle.text,
                            background: sourceStyle.bg,
                          }}>
                            {sourceLabel(source, lang)}
                          </span>
                        )}
                        {hasValue && meta?.source === "inferred" && confidenceLabel(meta, lang, true) && (
                          <span style={{
                            padding: "1px 5px",
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#79c0ff",
                            background: "#13233a",
                          }}>
                            {confidenceLabel(meta, lang, true)}
                          </span>
                        )}
                      </span>
                    </div>

                    {mode !== "manual" ? (
                      <div style={{
                        minHeight: 36,
                        background: C.card,
                        color: hasValue ? C.white : C.textMuted,
                        border: `1px solid ${hasValue ? (isApplied ? C.borderActive : C.border) : "#1a1f2e"}`,
                        padding: "5px 8px",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}>
                        <span style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {hasValue ? formatSchemaValue(sid, val, lang) : "—"}
                        </span>
                        {hasValue && (
                          <span style={{
                            display: "inline-flex",
                            border: `1px solid ${isApplied ? C.borderActive : C.border}`,
                            borderRadius: 999,
                            overflow: "hidden",
                            flex: "0 0 auto",
                          }}>
                            <button
                              onClick={() => setParsedFieldEnabled(sid, true)}
                              style={{
                                padding: "2px 8px",
                                border: 0,
                                background: isApplied ? C.tabActive : "transparent",
                                color: isApplied ? C.blue : C.textSec,
                                cursor: "pointer",
                                fontSize: 10,
                                fontFamily: "inherit",
                              }}
                            >
                              {t.useFilter}
                            </button>
                            <button
                              onClick={() => setParsedFieldEnabled(sid, false)}
                              style={{
                                padding: "2px 8px",
                                border: 0,
                                background: !isApplied ? "#3a1616" : "transparent",
                                color: !isApplied ? "#ff7b72" : C.textSec,
                                cursor: "pointer",
                                fontSize: 10,
                                fontFamily: "inherit",
                              }}
                            >
                              {t.ignoreFilter}
                            </button>
                          </span>
                        )}
                      </div>
                    ) : FIELD_OPTIONS[sid] ? (
                      <select value={val}
                        onChange={e => { if (mode === "manual") handleManualChange(sid, e.target.value); }}
                        disabled={mode !== "manual"}
                        style={{
                          background: C.card, color: hasValue ? C.white : C.textMuted,
                          border: `1px solid ${hasValue ? C.borderActive : "#1a1f2e"}`,
                          padding: "5px 6px", fontSize: 12, fontFamily: "inherit",
                          cursor: mode === "manual" ? "pointer" : "default",
                        }}
                      >
                        <option value="">—</option>
                        {FIELD_OPTIONS[sid].map(o => (
                          <option key={String(o)} value={o}>{fieldOptionLabel(sid, o, lang)}</option>
                        ))}
                      </select>
                    ) : schema.type === "array" ? (
                      <textarea value={hasValue ? formatSchemaValue(sid, val, lang) : ""}
                        readOnly
                        rows={2}
                        style={{
                          background: C.card, color: hasValue ? C.white : C.textMuted,
                          border: `1px solid ${hasValue ? C.borderActive : "#1a1f2e"}`,
                          padding: "5px 6px", fontSize: 12, fontFamily: "inherit",
                          resize: "none",
                        }}
                      />
                    ) : (
                      <input type="text" value={hasValue ? formatSchemaValue(sid, val, lang) : val}
                        onChange={e => { if (mode === "manual") handleManualChange(sid, e.target.value); }}
                        readOnly={mode !== "manual"}
                        style={{
                          background: C.card, color: hasValue ? C.white : C.textMuted,
                          border: `1px solid ${hasValue ? C.borderActive : "#1a1f2e"}`,
                          padding: "5px 6px", fontSize: 12, fontFamily: "inherit",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {mode === "manual" && (
              <button onClick={() => setManualFilters({})} style={{
                marginTop: 12, background: "#1a1f2e", color: C.textSec,
                border: `1px solid ${C.border}`, padding: "6px 14px",
                fontSize: 12, fontFamily: "inherit", cursor: "pointer",
              }}>
                {t.clearAll}
              </button>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          flex: "1 1 440px",
          minWidth: 380,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          height: mode === "manual" ? "auto" : RIGHT_PANEL_HEIGHT,
          minHeight: 0,
          overflow: "hidden",
        }}>
          {/* Match panels — answer side first in parse modes */}
          {mode !== "manual" && (() => {
            const primaryPanel = mode === "cn2ru"
              ? {
                label: t.ruHits,
                color: C.blue,
                data: results.ru,
                detail: formatRuCardDetail,
                nameKey: "ru",
              }
              : {
                label: t.cnHits,
                color: C.gold,
                data: results.cn,
                detail: formatCnCardDetail,
                nameKey: "cn",
              };

            return (
              <div style={{
                background: C.panel,
                padding: 20,
                border: `2px solid ${primaryPanel.color}`,
                flex: "0 0 auto",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}>
                <div style={{
                  fontSize: 15,
                  color: primaryPanel.color,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  display: "flex",
                  justifyContent: "space-between",
                }}>
                  <span>{primaryPanel.label}</span>
                  <span style={{ color: C.textSec }}>{primaryPanel.data.length} {t.count}</span>
                </div>
                {matchMode.kind === "inferred" && (
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: -8 }}>
                    {matchMode.detail}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
                  {primaryPanel.data.length === 0 ? (
                    <div style={{ fontSize: 13, color: C.textMuted, fontStyle: "italic" }}>{t.noMatch}</div>
                  ) : (
                    primaryPanel.data.map((p, i) => (
                      <div key={i}
                        onMouseEnter={e => handleCardEnter(p, e)}
                        onMouseMove={handleCardMove}
                        onMouseLeave={handleCardLeave}
                        style={{
                        background: C.card, border: `1px solid #1a2332`,
                        borderLeft: `4px solid ${primaryPanel.color}`,
                        padding: "8px 12px", display: "flex",
                        justifyContent: "space-between", alignItems: "center",
                        cursor: "default",
                      }}>
                        <span style={{ display: "inline-flex", alignItems: "center", minWidth: 0 }}>
                          <span
                            onMouseEnter={e => handleCardEnter(p, e)}
                            onMouseMove={handleCardMove}
                            onMouseLeave={handleCardLeave}
                            onClick={(e) => { e.stopPropagation(); handleModelClick(p[primaryPanel.nameKey], p, e); }}
                            style={{ color: primaryPanel.color, fontSize: 15, fontWeight: 600, cursor: "pointer", textDecoration: "underline dotted", textUnderlineOffset: 3 }}
                          >{p[primaryPanel.nameKey]}</span>
                          <CopyModelButton text={p[primaryPanel.nameKey]} lang={lang} onCopied={handleCopyNotice} />
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, color: C.textSec }}>
                            {primaryPanel.detail(p)}
                          </span>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                            color: matchMode.kind === "inferred" ? "#3fb950" : "#8fb7ff",
                            background: matchMode.kind === "inferred" ? "#0d2818" : "#13233a",
                            border: `1px solid ${matchMode.kind === "inferred" ? "#1f6f43" : "#2d5a9a"}`,
                          }}>
                            {matchMode.label}
                          </span>
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                  <div style={{ fontSize: 13, color: C.textSec, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                    {t.detailHeader(primaryPanel.data.length)}
                  </div>
                  <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 220 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                          <th style={{ ...thPad, textAlign: "left", color: C.textSec, fontWeight: 600, whiteSpace: "nowrap" }}>{t.colModel}</th>
                          <th style={{ ...thPad, textAlign: "center", color: C.textSec, fontWeight: 600 }}>{t.colCore}</th>
                          <th style={{ ...thPad, textAlign: "center", color: C.textSec, fontWeight: 600 }}>{t.colArea}</th>
                          <th style={{ ...thPad, textAlign: "center", color: C.textSec, fontWeight: 600 }}>{t.colOD}</th>
                          <th style={{ ...thPad, textAlign: "center", color: C.textSec, fontWeight: 600 }}>{t.colStrength}</th>
                          <th style={{ ...thPad, textAlign: "center", color: C.textSec, fontWeight: 600 }}>{t.colTemp}</th>
                          <th style={{ ...thPad, textAlign: "center", color: C.textSec, fontWeight: 600 }}>{t.colLayers}</th>
                          <th style={{ ...thPad, textAlign: "left", color: C.textSec, fontWeight: 600 }}>{t.colFeatures}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {primaryPanel.data.slice(0, 30).map((p, i) => (
                          <tr key={i} style={{
                            borderBottom: `1px solid ${C.panel}`,
                            background: i % 2 === 0 ? C.card : C.panel,
                            lineHeight: 1.6,
                          }}>
                            <td style={{
                              ...thPad, color: primaryPanel.color,
                              fontWeight: 600, whiteSpace: "nowrap",
                              borderLeft: `3px solid ${primaryPanel.color}`,
                            }}>
                              <span style={{ display: "inline-flex", alignItems: "center" }}>
                                <span
                                  onMouseEnter={e => handleCardEnter(p, e)}
                                  onMouseMove={handleCardMove}
                                  onMouseLeave={handleCardLeave}
                                  style={{ cursor: "pointer", textDecoration: "underline dotted", textUnderlineOffset: 3 }}
                                >{p[primaryPanel.nameKey]}</span>
                                <CopyModelButton text={p[primaryPanel.nameKey]} lang={lang} onCopied={handleCopyNotice} />
                              </span>
                            </td>
                            <td style={{ ...thPad, textAlign: "center", color: C.text }}>{p.S2}</td>
                            <td style={{ ...thPad, textAlign: "center", color: C.text }}>{p.S3}</td>
                            <td style={{ ...thPad, textAlign: "center", color: C.text }}>{p.S12 ?? "—"}</td>
                            <td style={{ ...thPad, textAlign: "center", color: C.text }}>{p.S16 ?? "—"}</td>
                            <td style={{ ...thPad, textAlign: "center", color: C.text }}>{p.S15 ?? "—"}</td>
                            <td style={{ ...thPad, textAlign: "center", color: C.text }}>{p.S10 ?? "—"}</td>
                            <td style={{ ...thPad, color: C.textSec }}>{p.S23 || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {primaryPanel.data.length > 30 && (
                      <div style={{ fontSize: 12, color: C.textMuted, padding: "8px", textAlign: "center" }}>
                        {t.truncated(primaryPanel.data.length - 30)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
          {mode === "manual" && (() => {
            const panels = [
              { key: "cn", label: t.cnHits, color: C.gold, data: results.cn,
                detail: formatCnCardDetail,
                nameKey: "cn" },
              { key: "ru", label: t.ruHits, color: C.blue, data: results.ru,
                detail: formatRuCardDetail,
                nameKey: "ru" },
            ];
            if (mode === "cn2ru") panels.reverse();
            if (mode === "ru2cn") { /* cn already first */ }

            return panels.map((panel, idx) => {
              const isPrimary = mode !== "manual" && idx === 0;
              // In parse modes, only show the answer side
              if (mode !== "manual" && !isPrimary) return null;
              return (
                <div key={panel.key} style={{
                  background: C.panel, padding: 20,
                  border: isPrimary ? `2px solid ${panel.color}` : `1px solid ${C.border}`,
                  opacity: mode !== "manual" && !isPrimary ? 0.7 : 1,
                  flex: "0 0 auto",
                }}>
                  <div style={{
                    fontSize: isPrimary ? 15 : 13, color: panel.color, marginBottom: 12,
                    textTransform: "uppercase", letterSpacing: 1,
                    display: "flex", justifyContent: "space-between",
                  }}>
                    <span>{panel.label}</span>
                    <span style={{ color: C.textSec }}>{panel.data.length} {t.count}</span>
                  </div>
                  {matchMode.kind === "inferred" && (
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: -6, marginBottom: 10 }}>
                      {matchMode.detail}
                    </div>
                  )}
                  {panel.data.length === 0 ? (
                    <div style={{ fontSize: 13, color: C.textMuted, fontStyle: "italic" }}>{t.noMatch}</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: isPrimary ? 320 : 160, overflowY: "auto" }}>
                      {panel.data.map((p, i) => (
                        <div key={i}
                          onMouseEnter={e => handleCardEnter(p, e)}
                          onMouseMove={handleCardMove}
                          onMouseLeave={handleCardLeave}
                          style={{
                          background: C.card, border: `1px solid #1a2332`,
                          borderLeft: `${isPrimary ? 4 : 3}px solid ${panel.color}`,
                          padding: "8px 12px", display: "flex",
                          justifyContent: "space-between", alignItems: "center",
                          cursor: "default",
                        }}>
                          <span style={{ display: "inline-flex", alignItems: "center", minWidth: 0 }}>
                            <span
                              onClick={(e) => { e.stopPropagation(); handleModelClick(p[panel.nameKey], p, e); }}
                              style={{ color: panel.color, fontSize: isPrimary ? 15 : 14, fontWeight: 600, cursor: "pointer", textDecoration: "underline dotted", textUnderlineOffset: 3 }}
                            >{p[panel.nameKey]}</span>
                            <CopyModelButton text={p[panel.nameKey]} lang={lang} onCopied={handleCopyNotice} />
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, color: C.textSec }}>
                              {panel.detail(p)}
                            </span>
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 700,
                              color: matchMode.kind === "inferred" ? "#3fb950" : "#8fb7ff",
                              background: matchMode.kind === "inferred" ? "#0d2818" : "#13233a",
                              border: `1px solid ${matchMode.kind === "inferred" ? "#1f6f43" : "#2d5a9a"}`,
                            }}>
                              {matchMode.label}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            });
          })()}

          {/* Detail table — parse modes only, answer side only */}
          {false && (() => {
            const detailData = mode === "cn2ru" ? results.ru : results.cn;
            const detailColor = mode === "cn2ru" ? C.blue : C.gold;
            const detailNameKey = mode === "cn2ru" ? "ru" : "cn";
            return (
              <div style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                padding: 20,
                flex: "0 0 auto",
                minHeight: 0,
              }}>
              <div style={{ fontSize: 13, color: C.textSec, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                {t.detailHeader(detailData.length)}
              </div>
              {matchMode.kind === "inferred" && (
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: -4, marginBottom: 10 }}>
                  {matchMode.detail}
                </div>
              )}
              <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: 220 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        <th style={{ ...thPad, textAlign: "left", color: C.textSec, fontWeight: 600, whiteSpace: "nowrap" }}>{t.colModel}</th>
                        <th style={{ ...thPad, textAlign: "center", color: C.textSec, fontWeight: 600 }}>{t.colCore}</th>
                        <th style={{ ...thPad, textAlign: "center", color: C.textSec, fontWeight: 600 }}>{t.colArea}</th>
                        <th style={{ ...thPad, textAlign: "center", color: C.textSec, fontWeight: 600 }}>{t.colOD}</th>
                        <th style={{ ...thPad, textAlign: "center", color: C.textSec, fontWeight: 600 }}>{t.colStrength}</th>
                        <th style={{ ...thPad, textAlign: "center", color: C.textSec, fontWeight: 600 }}>{t.colTemp}</th>
                        <th style={{ ...thPad, textAlign: "center", color: C.textSec, fontWeight: 600 }}>{t.colLayers}</th>
                        <th style={{ ...thPad, textAlign: "left", color: C.textSec, fontWeight: 600 }}>{t.colFeatures}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.slice(0, 30).map((p, i) => (
                        <tr key={i} style={{
                          borderBottom: `1px solid ${C.panel}`,
                          background: i % 2 === 0 ? C.card : C.panel,
                          lineHeight: 1.6,
                        }}>
                          <td style={{
                            ...thPad, color: detailColor,
                            fontWeight: 600, whiteSpace: "nowrap",
                            borderLeft: `3px solid ${detailColor}`,
                          }}>
                            <span style={{ display: "inline-flex", alignItems: "center" }}>
                              <span>{p[detailNameKey]}</span>
                              <CopyModelButton text={p[detailNameKey]} lang={lang} onCopied={handleCopyNotice} />
                            </span>
                          </td>
                          <td style={{ ...thPad, textAlign: "center", color: C.text }}>{p.S2}</td>
                          <td style={{ ...thPad, textAlign: "center", color: C.text }}>{p.S3}</td>
                          <td style={{ ...thPad, textAlign: "center", color: C.text }}>{p.S12 ?? "—"}</td>
                          <td style={{ ...thPad, textAlign: "center", color: C.text }}>{p.S16 ?? "—"}</td>
                          <td style={{ ...thPad, textAlign: "center", color: C.text }}>{p.S15 ?? "—"}</td>
                          <td style={{ ...thPad, textAlign: "center", color: C.text }}>{p.S10}</td>
                          <td style={{ ...thPad, color: C.textSec }}>{p.S23 || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {detailData.length > 30 && (
                    <div style={{ fontSize: 12, color: C.textMuted, padding: "8px", textAlign: "center" }}>
                      {t.truncated(detailData.length - 30)}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {mode !== "manual" && relaxationSuggestions.length > 0 && (
            <div style={{
              background: C.panel,
              border: `1px solid ${C.border}`,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              flex: "1 1 0",
              minHeight: 0,
              overflow: "hidden",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: C.textSec, textTransform: "uppercase", letterSpacing: 1 }}>
                  {t.relaxTitle}
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => setRelaxationPage(page => Math.max(0, page - 1))}
                    disabled={relaxationPage === 0}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: `1px solid ${relaxationPage === 0 ? C.border : C.borderActive}`,
                      background: relaxationPage === 0 ? C.tabInactive : C.tabActive,
                      color: relaxationPage === 0 ? C.textMuted : C.blue,
                      cursor: relaxationPage === 0 ? "default" : "pointer",
                      fontFamily: "inherit",
                      fontSize: 12,
                    }}
                  >
                    ← {t.relaxPrev}
                  </button>
                  <span style={{ fontSize: 12, color: C.textSec, minWidth: 72, textAlign: "center" }}>
                    {t.relaxPage(relaxationPage + 1, relaxationPageCount)}
                  </span>
                  <button
                    onClick={() => setRelaxationPage(page => Math.min(relaxationPageCount - 1, page + 1))}
                    disabled={relaxationPage >= relaxationPageCount - 1}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: `1px solid ${relaxationPage >= relaxationPageCount - 1 ? C.border : C.borderActive}`,
                      background: relaxationPage >= relaxationPageCount - 1 ? C.tabInactive : C.tabActive,
                      color: relaxationPage >= relaxationPageCount - 1 ? C.textMuted : C.blue,
                      cursor: relaxationPage >= relaxationPageCount - 1 ? "default" : "pointer",
                      fontFamily: "inherit",
                      fontSize: 12,
                    }}
                  >
                    {t.relaxNext} →
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
                {t.relaxSummary(
                  primaryResultKey === "cn" ? t.targetCn : t.targetRu,
                  relaxationSuggestions.length
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: "1 1 auto", minHeight: 0, overflowY: "auto", paddingRight: 4 }}>
                {relaxationSuggestionGroups.map(group => (
                  <div key={group.ignoreCount} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 12, color: C.textSec, letterSpacing: 0.5 }}>
                      {t.relaxGroupTitle(group.ignoreCount, group.suggestions.length)}
                    </div>
                    {group.suggestions.map((suggestion, idx) => (
                      <div key={`${group.ignoreCount}-${idx}-${suggestion.ignoreFields.join("-")}`} style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        padding: 12,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: C.textSec, marginBottom: 6 }}>
                              {t.relaxIgnore}
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {suggestion.ignoreFields.map(sid => {
                                const meta = activeFilterMeta[sid];
                                return (
                                  <span key={sid} style={{
                                    display: "inline-flex",
                                    gap: 4,
                                    alignItems: "center",
                                    background: "#13233a",
                                    color: "#79c0ff",
                                    padding: "3px 8px",
                                    borderRadius: 999,
                                    fontSize: 11,
                                  }}>
                                    <span>{sid}</span>
                                    <span>{sLabel(S_SCHEMA[sid], lang)}</span>
                                    {meta?.source && <span>{sourceLabel(meta.source, lang)}</span>}
                                    {confidenceLabel(meta, lang, true) && <span>{confidenceLabel(meta, lang, true)}</span>}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          <button
                            onClick={() => applyRelaxationSuggestion(suggestion.ignoreFields)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: `1px solid ${C.borderActive}`,
                              background: C.tabActive,
                              color: C.blue,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              fontSize: 12,
                              flex: "0 0 auto",
                            }}
                          >
                            {t.relaxApply}
                          </button>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: C.textMuted }}>
                          {t.relaxHits(suggestion.hitCount)}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
                          <span style={{ color: C.gold }}>{t.relaxReason}</span>
                          <span style={{ color: C.textMuted }}> {suggestion.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Hover ring indicator */}
      {hover?.phase === "ring" && (
        <div style={{
          position: "fixed", left: hover.mouseX + 16, top: hover.mouseY + 16,
          pointerEvents: "none", zIndex: 1200,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none"
              stroke={C.textMuted} strokeWidth="2.5" opacity="0.3" />
            <circle cx="12" cy="12" r="10" fill="none"
              stroke={C.blue} strokeWidth="2.5"
              strokeDasharray="62.83" strokeDashoffset="62.83"
              strokeLinecap="round"
              style={{
                animation: "hover-ring-fill 2s linear forwards",
                transform: "rotate(-90deg)", transformOrigin: "center",
              }}
            />
          </svg>
        </div>
      )}

      {/* Hover tooltip */}
      {hover?.phase === "tooltip" && hover.product && (
        <div
          onMouseEnter={cancelDismiss}
          onMouseLeave={startDismiss}
          style={{
          position: "fixed", left: hover.tooltipLeft, top: hover.tooltipTop,
          width: 520, background: C.panel, border: `1px solid ${C.border}`,
          borderRadius: 6, padding: 16, zIndex: 1200,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)", fontSize: 12, fontFamily: "inherit",
          maxHeight: "80vh", overflowY: "auto",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8,
            color: hover.product.cn ? C.gold : C.blue,
            display: "flex", alignItems: "center" }}>
            <span>{hover.product.cn || hover.product.ru}</span>
            <CopyModelButton text={hover.product.cn || hover.product.ru} lang={lang} onCopied={handleCopyNotice} />
          </div>
          <div style={{ borderBottom: `1px solid ${C.border}`, marginBottom: 10 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            {S_GROUPS.map((group, gi) => (
              <div key={gi} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4,
                  textTransform: "uppercase", letterSpacing: 1 }}>
                  {group.label[lang]}
                </div>
                {group.fields.map(sid => {
                  const schema = S_SCHEMA[sid];
                  const val = hover.product[sid];
                  const meta = getFieldMeta(hover.product, sid);
                  const hasVal = val !== null && val !== undefined && val !== "";
                  const displayVal = hasVal ? formatSchemaValue(sid, val, lang) : "\u2014";
                  const sourceStyle = meta?.source ? SOURCE_COLORS[meta.source] || SOURCE_COLORS.direct : null;
                  return (
                    <div key={sid} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "2px 0", color: hasVal ? C.white : C.textMuted,
                    }}>
                      <span style={{ color: C.textSec }}>
                        <span style={{ display: "inline-block", width: 28 }}>{sid}</span>
                        {sLabel(schema, lang).replace(/ mm²| mm| °C| kN| kg\/km| MΩ\/km| Ω\/km| pF\/m| Ω| V/g, "")}
                      </span>
                      <span style={{ textAlign: "right", maxWidth: "55%" }}>
                        <span style={{ fontWeight: hasVal ? 600 : 400 }}>{displayVal}</span>
                        {meta?.source && (
                          <span style={{
                            marginLeft: 6,
                            padding: "1px 6px",
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 700,
                            color: sourceStyle.text,
                            background: sourceStyle.bg,
                            verticalAlign: "middle",
                          }}>
                            {sourceLabel(meta.source, lang)}
                          </span>
                        )}
                        {meta?.source === "inferred" && confidenceLabel(meta, lang, true) && (
                          <span style={{
                            marginLeft: 6,
                            padding: "1px 6px",
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#79c0ff",
                            background: "#13233a",
                            verticalAlign: "middle",
                          }}>
                            {confidenceLabel(meta, lang, true)}
                          </span>
                        )}
                        {formatMetaNote(meta, lang) && (
                          <div style={{ marginTop: 2, fontSize: 10, color: C.textMuted }}>
                            {formatMetaNote(meta, lang)}
                          </div>
                        )}
                        {meta?.source === "inferred" && confidenceLabel(meta, lang) && (
                          <div style={{ marginTop: 2, fontSize: 10, color: C.textMuted }}>
                            {confidenceLabel(meta, lang)}
                          </div>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demand list icon (collapsed) */}
      {demandList.length > 0 && !demandOpen && (
        <div onClick={() => setDemandOpen(true)} style={{
          position: "fixed", bottom: 24, right: 24, width: 52, height: 120,
          background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8,
          cursor: "pointer", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 6,
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)", zIndex: 1100,
          animation: demandBounce ? "demand-pop 400ms cubic-bezier(0.34, 1.56, 0.64, 1)" : undefined,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.textSec} strokeWidth="1.5">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="8" x2="16" y2="8" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="8" y1="16" x2="13" y2="16" />
          </svg>
          <div style={{
            position: "absolute", top: 4, right: 4, width: 20, height: 20,
            background: C.blue, borderRadius: "50%", fontSize: 11, fontWeight: 700,
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          }}>{demandList.length}</div>
        </div>
      )}

      {/* Demand list panel (expanded) */}
      {demandOpen && demandList.length > 0 && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, width: 380,
          maxHeight: 480, background: C.panel, border: `1px solid ${C.border}`,
          borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          zIndex: 1100, display: "flex", flexDirection: "column",
          fontFamily: "inherit", fontSize: 13,
        }}>
          {/* Header */}
          <div style={{
            padding: "12px 16px", borderBottom: `1px solid ${C.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ color: C.white, fontWeight: 700 }}>{t.demandTitle}</span>
            <span onClick={() => setDemandOpen(false)} style={{
              color: C.textMuted, cursor: "pointer", fontSize: 18, lineHeight: 1,
            }}>&times;</span>
          </div>
          {/* Items */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
            {demandList.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 0", borderBottom: `1px solid ${C.border}`,
              }}>
                <span
                  onMouseEnter={e => handleCardEnter(item.product, e)}
                  onMouseMove={handleCardMove}
                  onMouseLeave={handleCardLeave}
                  style={{ flex: 1, minWidth: 0, color: item.product?.cn ? C.gold : C.blue, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "default", display: "inline-flex", alignItems: "center" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.model}</span>
                  <CopyModelButton text={item.model} lang={lang} onCopied={handleCopyNotice} />
                </span>
                <input type="number" min="1" value={item.feet}
                  onChange={e => updateFeet(item.model, parseInt(e.target.value) || 1)}
                  style={{
                    width: 72, background: C.card, color: C.blue,
                    border: `1px solid ${C.border}`, padding: "4px 6px",
                    fontSize: 12, fontFamily: "inherit", textAlign: "right",
                  }}
                />
                <span style={{ color: C.textMuted, fontSize: 11 }}>{t.demandFt}</span>
                <span onClick={() => setDemandList(prev => prev.filter(d => d.model !== item.model))}
                  style={{ color: C.textMuted, cursor: "pointer", fontSize: 15, padding: "0 4px" }}>&times;</span>
              </div>
            ))}
          </div>
          {/* Export button */}
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}` }}>
            <button onClick={exportCSV} style={{
              width: "100%", background: C.tabActive, color: C.blue,
              border: `1px solid ${C.borderActive}`, padding: "8px",
              fontSize: 13, fontFamily: "inherit", cursor: "pointer", borderRadius: 4,
            }}>
              {t.demandExport}
            </button>
          </div>
        </div>
      )}

      {/* Flying cargo animation */}
      {flyingItems.map(item => {
        const targetX = window.innerWidth - 50;
        const targetY = window.innerHeight - 84;
        const dx = targetX - item.startX;
        const dy = targetY - item.startY;
        const arcPeakY = -Math.max(80, Math.min(180, Math.abs(dy) * 0.3 + 80));
        const animName = `fly-cargo-${item.id}`;
        return (
          <div key={item.id}>
            <style>{`
              @keyframes ${animName} {
                0%   { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; animation-timing-function: ease-out; }
                40%  { transform: translate(${dx * 0.4}px, ${arcPeakY}px) scale(0.8) rotate(-20deg); opacity: 1; animation-timing-function: ease-in; }
                100% { transform: translate(${dx}px, ${dy}px) scale(0.35) rotate(15deg); opacity: 0.4; }
              }
            `}</style>
            <div
              onAnimationEnd={() => setFlyingItems(prev => prev.filter(f => f.id !== item.id))}
              style={{
                position: "fixed", left: item.startX, top: item.startY,
                pointerEvents: "none", zIndex: 1300,
                animation: `${animName} 650ms forwards`,
              }}
            >
              <span style={{ fontSize: 20 }}>📦</span>
            </div>
          </div>
        );
      })}

      {copyNotice && (
        <div style={{
          position: "fixed",
          right: 24,
          bottom: demandOpen || demandList.length > 0 ? 152 : 24,
          zIndex: 1400,
          background: C.panel,
          border: `1px solid ${C.borderActive}`,
          color: C.blue,
          padding: "8px 12px",
          borderRadius: 6,
          boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
          fontSize: 12,
          maxWidth: 320,
        }}>
          {t.copied}: {copyNotice}
        </div>
      )}

    </div>
  );
}
