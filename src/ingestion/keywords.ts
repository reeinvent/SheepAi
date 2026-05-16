// Single source of truth for Split city issue keywords.
// Used by RssIngestor and any other ingestor that needs keyword matching.

export const CITY_KEYWORDS: string[] = [
  // Waste & sanitation
  "smeće", "smece", "smeća", "smeca",
  "otpad", "deponij", "kontejner",
  "kanalizacija", "kanalizacij", "fekalij", "septička", "septicka", "odvodnja",

  // Water
  "voda", "vodovod", "vodoopskrb", "vodoinstalacij", "hidrofor",
  "poplava", "poplavljen", "izljev", "curenje", "procurio", "procurila",
  "suša", "susa", "nestanak vode",

  // Electricity & gas
  "struja", "električna", "elektricna", "HEP",
  "rasvjeta", "osvjetljenje", "javna rasvjeta", "kvar struje", "nestanak struje",
  "plinara", "plinovod", "plinska mreža", "plinski kvar", "nestanak plina", "curenje plina",

  // Roads & traffic
  "oštećenje ceste", "ostecenje ceste", "oštećenje kolnika", "ostecenje kolnika",
  "rupa na cesti", "rupa u asfaltu",
  "asfalt", "kolnik", "nogostup", "pločnik", "plocnik",
  "semafor", "zastoj", "gužva", "guzva",
  "prometna nesreća", "prometna nesreca",
  "autocesta", "obilaznica",

  // Parking
  "parking", "parkiralište", "parkiraliste", "parkiranje", "parkiran",
  "zauzeto parkirno", "nepropisno parkiran",

  // Public transport
  "promet Split", "Promet d.o.o", "linija broj",
  "autobusni kolodvor", "red voznje", "tramvaj",

  // Green areas & environment
  "zelenilo", "zelena površina", "košnja",
  "zagađenje", "zagadjenje", "onečišćenje", "oneciscenje",
  "buka", "gradilište", "gradiliste",

  // City administration & services
  "Grad Split", "gradska uprava",
  "komunalna", "komunalni", "inspekcija", "urbanizam",
  "infrastruktura", "javna površina", "javna povrsina",
  "renovacija", "rekonstrukcija", "sanacija",

  // Buildings & public spaces
  "fasada", "bespravna gradnja", "bespravno",
  "rušenje", "rusenje", "odron", "klizište", "kliziste",

  // Sea & coastal (Split-specific)
  "onečišćenje mora", "zagađenje mora",
];

// ── Matching helpers ──────────────────────────────────────────────────────────

/** Normalise Croatian diacritics so "smece" matches "smeće" etc. */
export function normalizeCroatian(text: string): string {
  return text
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/[ž]/g, "z")
    .replace(/[š]/g, "s")
    .replace(/[đ]/g, "d");
}

const NORMALIZED_KEYWORDS = CITY_KEYWORDS.map(normalizeCroatian);

/**
 * Match text against one keyword.
 * For keywords ≥5 chars we also do stem matching (keyword minus last char)
 * to catch Croatian inflections:
 *   "kanalizacija" → stem "kanalizacij" matches "kanalizacije", "kanalizacijom" …
 */
function matchesKeyword(normalizedText: string, normalizedKeyword: string): boolean {
  if (normalizedText.includes(normalizedKeyword)) return true;
  if (normalizedKeyword.length >= 5) {
    const stem = normalizedKeyword.slice(0, -1);
    const words = normalizedText.split(/[\s,.:;!?"'()\-]+/);
    return words.some((w) => w.startsWith(stem));
  }
  return false;
}

/** Returns true if the text contains at least one city keyword. */
export function matchesCityKeyword(text: string): boolean {
  const normalized = normalizeCroatian(text);
  return NORMALIZED_KEYWORDS.some((kw) => matchesKeyword(normalized, kw));
}

/** Returns all keywords matched in the text (original casing). */
export function matchedKeywords(text: string): string[] {
  const normalized = normalizeCroatian(text);
  return CITY_KEYWORDS.filter((_, i) => matchesKeyword(normalized, NORMALIZED_KEYWORDS[i]));
}
