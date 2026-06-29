// Regional flavor copy for AdCraft AI.
// Strategy: keep English as primary; sprinkle a short transliterated phrase
// in the user's likely regional language (Latin script so anyone can read it).
// Detection: cached IP geolocation (free, no key) → Indian state map → fallback.

export type LangCode =
  | "hi" // Hindi (default for India)
  | "ta" // Tamil
  | "te" // Telugu
  | "kn" // Kannada
  | "ml" // Malayalam
  | "mr" // Marathi
  | "gu" // Gujarati
  | "bn" // Bengali
  | "pa" // Punjabi
  | "or" // Odia
  | "as" // Assamese
  | "ur" // Urdu
  | "en"; // English fallback (non-IN)

export interface RegionalCopy {
  lang: LangCode;
  langLabel: string; // e.g. "Tamil"
  region: string; // e.g. "Tamil Nadu" or "India"
  greeting: string; // e.g. "Vanakkam"
  // Hero
  heroLine1: string; // "Your product"
  heroLine2: string; // "to the whole world"
  // Sections
  howItWorks: string; // "in three easy steps"
  startToday: string; // "Start today."
  // Auth/dashboard subline
  authTagline: string; // "Perfect content for your products"
  dashboardSubline: string; // "What shall we make today?"
  madeFor: string; // "Made in India · For local creators"
}

const COPY: Record<LangCode, RegionalCopy> = {
  hi: {
    lang: "hi", langLabel: "Hindi", region: "India",
    greeting: "Namaste",
    heroLine1: "Apna product,",
    heroLine2: "duniya tak pahunchao.",
    howItWorks: "Teen aasaan steps mein",
    startToday: "Aaj se shuru karein.",
    authTagline: "Apke products ke liye perfect content",
    dashboardSubline: "Aaj kya banayein? Pick an action below to get started.",
    madeFor: "Made in India · For local creators",
  },
  ta: {
    lang: "ta", langLabel: "Tamil", region: "Tamil Nadu",
    greeting: "Vanakkam",
    heroLine1: "Unga product,",
    heroLine2: "ulagam mulluvathum kondu sellungal.",
    howItWorks: "Moondru elliya padigalil",
    startToday: "Indrே thodanguvom.",
    authTagline: "Unga products ku perfect content",
    dashboardSubline: "Indru enna seyvom? Pick an action below to get started.",
    madeFor: "Made in India · For local creators",
  },
  te: {
    lang: "te", langLabel: "Telugu", region: "Andhra Pradesh / Telangana",
    greeting: "Namaskaram",
    heroLine1: "Mee product ni,",
    heroLine2: "prapancham antha cherchandi.",
    howItWorks: "Mooडu sulabhamaina steps lo",
    startToday: "Ee roju nunchi modalupettandi.",
    authTagline: "Mee products ki perfect content",
    dashboardSubline: "Ee roju enti chesedham? Pick an action below to get started.",
    madeFor: "Made in India · For local creators",
  },
  kn: {
    lang: "kn", langLabel: "Kannada", region: "Karnataka",
    greeting: "Namaskara",
    heroLine1: "Nimma product annu,",
    heroLine2: "prapanchada moole moolege talupisi.",
    howItWorks: "Mooru sulabha hejjegalalli",
    startToday: "Indinda shuru maadi.",
    authTagline: "Nimma products ge perfect content",
    dashboardSubline: "Indu yenu maadona? Pick an action below to get started.",
    madeFor: "Made in India · For local creators",
  },
  ml: {
    lang: "ml", langLabel: "Malayalam", region: "Kerala",
    greeting: "Namaskaram",
    heroLine1: "Ningalude product,",
    heroLine2: "lokam muzhuvanum ethikkam.",
    howItWorks: "Moonu eluppamulla steps il",
    startToday: "Innu thanne thudangam.",
    authTagline: "Ningalude products inu perfect content",
    dashboardSubline: "Innu enthu undakkanam? Pick an action below to get started.",
    madeFor: "Made in India · For local creators",
  },
  mr: {
    lang: "mr", langLabel: "Marathi", region: "Maharashtra",
    greeting: "Namaskar",
    heroLine1: "Tumcha product,",
    heroLine2: "saglyaa jagaat pohochva.",
    howItWorks: "Teen sopya steps madhe",
    startToday: "Aajach suruvat kara.",
    authTagline: "Tumchya products sathi perfect content",
    dashboardSubline: "Aaj kaay banvuya? Pick an action below to get started.",
    madeFor: "Made in India · For local creators",
  },
  gu: {
    lang: "gu", langLabel: "Gujarati", region: "Gujarat",
    greeting: "Namaste",
    heroLine1: "Tamaaru product,",
    heroLine2: "duniya sudhi pahonchaado.",
    howItWorks: "Tran saral steps maa",
    startToday: "Aajthi j shuru karo.",
    authTagline: "Tamaara products maate perfect content",
    dashboardSubline: "Aaje shu banaaviye? Pick an action below to get started.",
    madeFor: "Made in India · For local creators",
  },
  bn: {
    lang: "bn", langLabel: "Bengali", region: "West Bengal",
    greeting: "Nomoshkar",
    heroLine1: "Apnar product,",
    heroLine2: "sara prithibi te pouchhe din.",
    howItWorks: "Tinti sohoj step e",
    startToday: "Aaj theke shuru korun.",
    authTagline: "Apnar products er jonyo perfect content",
    dashboardSubline: "Aaj ki banabo? Pick an action below to get started.",
    madeFor: "Made in India · For local creators",
  },
  pa: {
    lang: "pa", langLabel: "Punjabi", region: "Punjab",
    greeting: "Sat Sri Akaal",
    heroLine1: "Tuhada product,",
    heroLine2: "saari duniya tak pahuncha do.",
    howItWorks: "Tinn sokhe steps vich",
    startToday: "Ajj ton hi shuru karo.",
    authTagline: "Tuhade products layi perfect content",
    dashboardSubline: "Ajj ki banaiye? Pick an action below to get started.",
    madeFor: "Made in India · For local creators",
  },
  or: {
    lang: "or", langLabel: "Odia", region: "Odisha",
    greeting: "Namaskar",
    heroLine1: "Apananka product,",
    heroLine2: "sara duniya paryanta pahanchanu.",
    howItWorks: "Tinita sahaja step re",
    startToday: "Aji thiru aarambha karantu.",
    authTagline: "Apananka products paain perfect content",
    dashboardSubline: "Aji kana karibu? Pick an action below to get started.",
    madeFor: "Made in India · For local creators",
  },
  as: {
    lang: "as", langLabel: "Assamese", region: "Assam",
    greeting: "Nomoskar",
    heroLine1: "Apunar product,",
    heroLine2: "gutei prithibi loi loi jaok.",
    howItWorks: "Tinita sohoj step ot",
    startToday: "Aji rë para arombho korok.",
    authTagline: "Apunar products r babe perfect content",
    dashboardSubline: "Aji ki banaim? Pick an action below to get started.",
    madeFor: "Made in India · For local creators",
  },
  ur: {
    lang: "ur", langLabel: "Urdu", region: "India",
    greeting: "Aadaab",
    heroLine1: "Apni product,",
    heroLine2: "saari duniya tak pohanchaayein.",
    howItWorks: "Teen aasaan qadmon mein",
    startToday: "Aaj se shuru karein.",
    authTagline: "Aapki products ke liye behtareen content",
    dashboardSubline: "Aaj kya banayein? Pick an action below to get started.",
    madeFor: "Made in India · For local creators",
  },
  en: {
    lang: "en", langLabel: "English", region: "Global",
    greeting: "Hello",
    heroLine1: "Your product,",
    heroLine2: "ready for the world.",
    howItWorks: "In three easy steps",
    startToday: "Get started today.",
    authTagline: "Perfect content for your products",
    dashboardSubline: "What shall we create today? Pick an action below to get started.",
    madeFor: "For independent creators worldwide",
  },
};

// Indian state/region → language map (uses substrings, lowercased)
const STATE_LANG: Array<[string, LangCode]> = [
  ["tamil nadu", "ta"],
  ["puducherry", "ta"],
  ["andhra pradesh", "te"],
  ["telangana", "te"],
  ["karnataka", "kn"],
  ["kerala", "ml"],
  ["maharashtra", "mr"],
  ["goa", "mr"],
  ["gujarat", "gu"],
  ["dadra", "gu"],
  ["daman", "gu"],
  ["west bengal", "bn"],
  ["tripura", "bn"],
  ["punjab", "pa"],
  ["chandigarh", "pa"],
  ["haryana", "hi"],
  ["odisha", "or"],
  ["orissa", "or"],
  ["assam", "as"],
  ["jammu", "ur"],
  ["kashmir", "ur"],
];

const BROWSER_LANG: Record<string, LangCode> = {
  hi: "hi", ta: "ta", te: "te", kn: "kn", ml: "ml",
  mr: "mr", gu: "gu", bn: "bn", pa: "pa", or: "or",
  as: "as", ur: "ur", en: "en",
};

const CACHE_KEY = "adcraft.regionalCopy.v1";
const OVERRIDE_KEY = "adcraft.regionalCopy.override";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function setLanguageOverride(lang: LangCode | null) {
  try {
    if (lang) localStorage.setItem(OVERRIDE_KEY, lang);
    else localStorage.removeItem(OVERRIDE_KEY);
    window.dispatchEvent(new CustomEvent("adcraft:lang-changed"));
  } catch { /* noop */ }
}

export function getLanguageOverride(): LangCode | null {
  try {
    const v = localStorage.getItem(OVERRIDE_KEY) as LangCode | null;
    return v && COPY[v] ? v : null;
  } catch { return null; }
}

function fromBrowser(): LangCode {
  if (typeof navigator === "undefined") return "hi";
  const langs = [navigator.language, ...(navigator.languages || [])]
    .filter(Boolean)
    .map((l) => l.toLowerCase().split("-")[0]);
  for (const l of langs) if (BROWSER_LANG[l]) return BROWSER_LANG[l];
  // Default for India-targeted product
  return "hi";
}

function pickFromGeo(country?: string, region?: string): LangCode {
  if (!country) return fromBrowser();
  const c = country.toUpperCase();
  if (c !== "IN") return "en";
  const r = (region || "").toLowerCase();
  for (const [needle, code] of STATE_LANG) {
    if (r.includes(needle)) return code;
  }
  return "hi";
}

function readCache(): { lang: LangCode; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lang: LangCode; ts: number };
    if (!parsed.lang || Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(lang: LangCode) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ lang, ts: Date.now() }));
  } catch {
    /* noop */
  }
}

export function getCopyFor(lang: LangCode): RegionalCopy {
  return COPY[lang] || COPY.hi;
}

/**
 * Detects user locale via cached IP geo lookup.
 * Returns the resolved language code (caches for 7 days).
 * Always resolves; never throws.
 */
export async function detectLanguage(): Promise<LangCode> {
  // User-set toggle wins above all
  const userOverride = getLanguageOverride();
  if (userOverride) return userOverride;
  // URL override (?lang=ta) next
  try {
    const url = new URL(window.location.href);
    const override = url.searchParams.get("lang") as LangCode | null;
    if (override && COPY[override]) {
      writeCache(override);
      return override;
    }
  } catch { /* noop */ }

  const cached = readCache();
  if (cached) return cached.lang;

  // Try IP geo (free, no API key). Timeout to keep it snappy.
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch("https://ipapi.co/json/", { signal: ctrl.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const lang = pickFromGeo(data?.country_code || data?.country, data?.region);
      writeCache(lang);
      return lang;
    }
  } catch { /* fall through */ }

  const lang = fromBrowser();
  writeCache(lang);
  return lang;
}
