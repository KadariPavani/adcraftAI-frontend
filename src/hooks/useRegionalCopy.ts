import { useEffect, useState } from "react";
import { detectLanguage, getCopyFor, getLanguageOverride, type LangCode, type RegionalCopy } from "@/lib/regionalCopy";

const DEFAULT: LangCode = "hi";

export function useRegionalCopy(): RegionalCopy {
  const [lang, setLang] = useState<LangCode>(() => getLanguageOverride() || DEFAULT);

  useEffect(() => {
    let cancelled = false;
    detectLanguage().then((l) => { if (!cancelled) setLang(l); });
    const onChange = () => setLang(getLanguageOverride() || DEFAULT);
    window.addEventListener("adcraft:lang-changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("adcraft:lang-changed", onChange);
    };
  }, []);

  return getCopyFor(lang);
}
