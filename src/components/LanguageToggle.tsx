import { Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { getLanguageOverride, setLanguageOverride, type LangCode } from "@/lib/regionalCopy";
import { useRegionalCopy } from "@/hooks/useRegionalCopy";
import { cn } from "@/lib/utils";

export const LanguageToggle = ({ className }: { className?: string }) => {
  const copy = useRegionalCopy();
  const [override, setOverride] = useState<LangCode | null>(getLanguageOverride());

  useEffect(() => {
    const onChange = () => setOverride(getLanguageOverride());
    window.addEventListener("adcraft:lang-changed", onChange);
    return () => window.removeEventListener("adcraft:lang-changed", onChange);
  }, []);

  const isEnglish = override === "en" || copy.lang === "en";

  const toggle = () => {
    if (isEnglish) setLanguageOverride(null);
    else setLanguageOverride("en");
  };

  const label = isEnglish ? copy.langLabel : "English";

  return (
    <button
      onClick={toggle}
      title={`Switch to ${label}`}
      className={cn(
        "group inline-flex items-center gap-1.5 px-2.5 h-9 rounded-xl text-xs font-medium border border-border bg-card/60 backdrop-blur text-foreground/80 hover:border-primary/40 hover:bg-card hover:text-foreground transition-all duration-300 active:scale-95",
        className,
      )}
    >
      <Languages className="w-3.5 h-3.5 text-primary" />
      <span className="font-semibold">{isEnglish ? "EN" : copy.langLabel}</span>
      <span className="text-muted-foreground/60 transition-transform group-hover:translate-x-0.5">→</span>
      <span className="text-primary font-semibold">{isEnglish ? copy.langLabel : "EN"}</span>
    </button>
  );
};
