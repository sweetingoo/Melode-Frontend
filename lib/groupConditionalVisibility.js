/**
 * Conditional visibility for group layouts, table rows, and grid rows.
 * Same `conditional_visibility` object shape everywhere:
 * 1. all_of — array of nested visibility objects; EVERY part must pass (logical AND)
 * 2. count_of_fields — at least `min_count` of the listed fields must match (threshold)
 * 3. any_of — same predicate across N field ids; true if ANY one field matches
 * 4. conditions[] — combined with conditions_operator: "or" (default) = any row matches;
 *    "and" = every row must match
 * 5. Legacy { depends_on_field, show_when, value } on the root
 *
 * When `all_of` is present at a level, it is evaluated first (each sub-object is evaluated
 * recursively); remaining keys on the same object (count_of_fields, any_of, conditions,
 * depends_on_field) are also required — logical AND with all_of parts.
 */

function normalizeCondValue(v) {
  if (v === true || v === "true" || v === "True" || v === "TRUE") return true;
  if (v === false || v === "false" || v === "False" || v === "FALSE") return false;
  if (v === "yes" || v === "Yes" || v === "YES") return true;
  if (v === "no" || v === "No" || v === "NO") return false;
  return v;
}

export function isGroupConditionMet(condition, data) {
  if (!condition?.depends_on_field) return false;
  const { depends_on_field, show_when, value: expectedValue } = condition;
  const dependentValue = data?.[depends_on_field];
  const normalize = normalizeCondValue;
  if (show_when === "equals") return normalize(dependentValue) === normalize(expectedValue);
  if (show_when === "not_equals") return normalize(dependentValue) !== normalize(expectedValue);
  if (show_when === "contains")
    return Array.isArray(dependentValue)
      ? dependentValue.includes(expectedValue)
      : String(dependentValue || "").includes(String(expectedValue || ""));
  if (show_when === "is_empty") return !dependentValue || dependentValue === "" || dependentValue === false;
  if (show_when === "is_not_empty") return dependentValue != null && dependentValue !== "" && dependentValue !== false;
  return true;
}

/** One field "counts" toward count_of_fields.min_count. */
function countOfFieldMatches(data, fieldId, match) {
  const v = data?.[fieldId];
  const m = match || "is_not_empty";
  if (m === "is_true" || m === "boolean_true" || m === "checked") {
    return normalizeCondValue(v) === true;
  }
  if (m === "is_empty") {
    return v == null || v === "" || v === false;
  }
  // is_not_empty and default: any value that is "filled" / selected
  return v != null && v !== "" && v !== false;
}

function evaluateConditionsArray(conditions, conditionsOperator, data) {
  if (!conditions?.length) return true;
  const evaluateConditionRow = (condition) => {
    if (
      condition?.count_of_fields != null ||
      condition?.any_of != null ||
      condition?.all_of != null ||
      Array.isArray(condition?.conditions)
    ) {
      return evaluateConditionalVisibility(condition, data);
    }
    return isGroupConditionMet(condition, data);
  };
  let result = evaluateConditionRow(conditions[0]);
  for (let i = 1; i < conditions.length; i += 1) {
    const condition = conditions[i];
    const op = condition?.operator || condition?.condition_operator || conditionsOperator || "or";
    const conditionResult = evaluateConditionRow(condition);
    result = op === "and" ? result && conditionResult : result || conditionResult;
  }
  return result;
}

/** Leaf: no all_of on this object (caller strips all_of before calling). */
function evaluateConditionalVisibilityLeaf(cv, data) {
  if (!cv) return true;

  const cof = cv.count_of_fields;
  if (cof != null) {
    const rawIds = Array.isArray(cof.field_ids) ? cof.field_ids : null;
    const fieldIds = (rawIds || []).map(String).filter(Boolean);
    if (fieldIds.length > 0) {
      const minRaw = cof.min_count;
      const min =
        minRaw == null || minRaw === "" ? 1 : Math.max(0, Math.floor(Number(String(minRaw))) || 0);
      const cap = fieldIds.length;
      const need = Math.min(min, cap);
      const match = cof.match || "is_not_empty";
      const met = fieldIds.filter((fid) => countOfFieldMatches(data, fid, match)).length;
      return met >= need;
    }
  }

  const anyOf = cv.any_of;
  const rawIds =
    anyOf && Array.isArray(anyOf.field_ids)
      ? anyOf.field_ids
      : anyOf && Array.isArray(anyOf.depends_on_fields)
        ? anyOf.depends_on_fields
        : null;
  const fieldIds = (rawIds || []).map(String).filter(Boolean);
  if (fieldIds.length > 0 && anyOf?.show_when) {
    const { show_when, value } = anyOf;
    return fieldIds.some((fid) => isGroupConditionMet({ depends_on_field: fid, show_when, value }, data));
  }

  const conditions = Array.isArray(cv.conditions) ? cv.conditions : null;
  if (conditions && conditions.length > 0) {
    return evaluateConditionsArray(conditions, cv.conditions_operator, data);
  }
  if (!cv.depends_on_field) return true;
  return isGroupConditionMet(cv, data);
}

/** Core evaluator for `conditional_visibility` (used by groups, table rows, grid rows). */
export function evaluateConditionalVisibility(cv, data) {
  if (!cv) return true;

  const allOfRaw = Array.isArray(cv.all_of) ? cv.all_of : null;
  const allOf = (allOfRaw || []).filter((p) => p != null && typeof p === "object");
  if (allOf.length > 0) {
    for (const part of allOf) {
      if (!evaluateConditionalVisibility(part, data)) return false;
    }
  }

  const { all_of: _ignored, ...rest } = cv;
  return evaluateConditionalVisibilityLeaf(rest, data);
}

export function checkGroupConditionalVisibility(group, data) {
  return evaluateConditionalVisibility(group?.conditional_visibility, data);
}

/** Table or grid `row.conditional_visibility` (same shape as group). */
export function checkLayoutRowVisibility(row, data) {
  return evaluateConditionalVisibility(row?.conditional_visibility, data);
}

/** @deprecated use evaluateConditionalVisibility or checkLayoutRowVisibility */
export function checkConditionalVisibility(cv, data) {
  return evaluateConditionalVisibility(cv, data);
}

function groupDefinesLeaf(cv) {
  if (!cv) return false;
  const cof = cv.count_of_fields;
  if (cof != null) {
    const fieldIds = (Array.isArray(cof.field_ids) ? cof.field_ids : []).map(String).filter(Boolean);
    if (fieldIds.length > 0) return true;
  }
  const anyOf = cv.any_of;
  const rawIds =
    anyOf && Array.isArray(anyOf.field_ids)
      ? anyOf.field_ids
      : anyOf && Array.isArray(anyOf.depends_on_fields)
        ? anyOf.depends_on_fields
        : null;
  const fieldIds = (rawIds || []).map(String).filter(Boolean);
  if (fieldIds.length > 0 && anyOf?.show_when) return true;
  if (Array.isArray(cv.conditions) && cv.conditions.length > 0) return true;
  return !!cv.depends_on_field;
}

export function groupDefinesConditionalVisibility(cv) {
  if (!cv) return false;
  const allOf = (Array.isArray(cv.all_of) ? cv.all_of : []).filter((p) => p != null && typeof p === "object");
  const { all_of: _a, ...rest } = cv;
  const leafDefines = groupDefinesLeaf(rest);
  if (allOf.length > 0) {
    const allPartsDefine = allOf.every((p) => groupDefinesConditionalVisibility(p));
    if (!leafDefines) return allPartsDefine;
    return allPartsDefine && leafDefines;
  }
  return leafDefines;
}
