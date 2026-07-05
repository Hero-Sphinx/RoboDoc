const OPENFDA_BASE = "https://api.fda.gov/drug/label.json";
const MAX_MEDICATIONS_CHECKED = 5;
const REQUEST_TIMEOUT_MS = 4000;

function parseMedicationNames(medicationsText) {
  if (!medicationsText) return [];
  return medicationsText
    .split(/[,;\n]| and /i)
    .map((name) => name.trim())
    .filter((name) => name.length > 1)
    .slice(0, MAX_MEDICATIONS_CHECKED);
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function truncate(text, maxLen = 320) {
  if (!text) return null;
  return text.length > maxLen ? `${text.slice(0, maxLen)}...` : text;
}

async function lookupDrugLabel(name) {
  const escaped = name.replace(/"/g, '');
  const query = `(openfda.generic_name:"${escaped}" OR openfda.brand_name:"${escaped}" OR openfda.substance_name:"${escaped}")`;
  const url = `${OPENFDA_BASE}?search=${encodeURIComponent(query)}&limit=1`;

  try {
    const res = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);
    if (!res.ok) return { name, found: false };

    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return { name, found: false };

    return {
      name,
      found: true,
      boxedWarning: truncate(result.boxed_warning?.[0]),
      warnings: truncate(result.warnings_and_cautions?.[0] || result.warnings?.[0]),
      interactions: truncate(result.drug_interactions?.[0]),
    };
  } catch (err) {
    return { name, found: false, error: err.message };
  }
}

/**
 * Looks up each medication the patient reported against the FDA's official
 * drug label database (openFDA, no API key required) so the AI prompt can be
 * grounded in real, current drug safety data instead of relying purely on
 * the model's training data. Never throws - a lookup failure just means
 * that medication is reported as "no record found" to the caller.
 */
async function getDrugSafetyContext(medicationsText) {
  const names = parseMedicationNames(medicationsText);
  if (names.length === 0) return null;

  const results = await Promise.all(names.map(lookupDrugLabel));

  const lines = results.map((r) => {
    if (!r.found) {
      return `- ${r.name}: No FDA label record found under this name - verify spelling/brand vs. generic name with the patient's pharmacist.`;
    }
    const parts = [];
    if (r.boxedWarning) parts.push(`BOXED WARNING: ${r.boxedWarning}`);
    if (r.warnings) parts.push(`Warnings: ${r.warnings}`);
    if (r.interactions) parts.push(`Known Interactions: ${r.interactions}`);
    return `- ${r.name}: ${parts.length ? parts.join(" | ") : "FDA label found, no notable warnings/interactions text available."}`;
  });

  return lines.join("\n");
}

module.exports = { getDrugSafetyContext };
