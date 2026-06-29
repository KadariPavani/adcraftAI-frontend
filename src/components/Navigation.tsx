import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles, LogOut, LayoutDashboard, CalendarCheck, Settings, Menu, X, Mic, ChevronRight,
} from "lucide-react";
import { VoiceFAB } from "@/components/VoiceFAB";
import { LanguageToggle } from "@/components/LanguageToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/voice", label: "Voice", icon: Mic },
  { to: "/social/dashboard", label: "Social", icon: CalendarCheck },
  { to: "/social/settings", label: "Keys", icon: Settings },
];

export const Navigation = ({ showAuth = true }: { showAuth?: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error signing out", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
      toast({ title: "Signed out successfully" });
    }
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-border/60 bg-background/80 backdrop-blur-xl shadow-card"
            : "bg-background/40 backdrop-blur-md",
        )}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link
            to="/"
            className="group flex items-center gap-2.5 font-display text-xl font-bold text-foreground"
          >
            <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-marigold shadow-soft transition-all duration-500 group-hover:rotate-[8deg] group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
              <span aria-hidden className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/30" />
            </span>
            <span className="tracking-tight">
              AdCraft <span className="text-gradient-static">AI</span>
            </span>
          </Link>

          {showAuth && (
            <>
              {/* Desktop */}
              <div className="hidden md:flex items-center gap-1">
                <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-muted/60 ring-1 ring-border/60 backdrop-blur">
                  {links.map(({ to, label, icon: Icon }) => (
                    <button
                      key={to}
                      onClick={() => navigate(to)}
                      className={cn(
                        "group relative inline-flex items-center gap-2 px-3.5 h-9 rounded-xl text-sm font-medium transition-all duration-300",
                        isActive(to)
                          ? "bg-card text-foreground shadow-sm-soft"
                          : "text-foreground/65 hover:text-foreground hover:bg-card/60",
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          isActive(to) ? "text-primary" : "text-foreground/60 group-hover:text-foreground",
                        )}
                      />
                      {label}
                      {isActive(to) && (
                        <span
                          aria-hidden
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-glow"
                        />
                      )}
                    </button>
                  ))}
                </div>
                <div className="w-px h-6 bg-border mx-2" />
                <LanguageToggle />
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-foreground/70">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </Button>
              </div>

              {/* Mobile toggle */}
              <button
                className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-card/80 backdrop-blur transition-all active:scale-95"
                onClick={() => setOpen((v) => !v)}
                aria-label="Toggle menu"
                aria-expanded={open}
              >
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile sheet */}
      {showAuth && (
        <div
          className={cn(
            "md:hidden fixed inset-0 z-40 transition-all duration-300",
            open ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          <div
            onClick={() => setOpen(false)}
            className={cn(
              "absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-300",
              open ? "opacity-100" : "opacity-0",
            )}
          />
          <aside
            className={cn(
              "absolute top-16 inset-x-3 rounded-3xl bg-card shadow-elevated border border-border/60 overflow-hidden transition-all duration-300 origin-top",
              open ? "scale-100 opacity-100" : "scale-95 opacity-0",
            )}
          >
            <div className="p-2 grid gap-1">
              {links.map(({ to, label, icon: Icon }, i) => (
                <button
                  key={to}
                  onClick={() => { setOpen(false); navigate(to); }}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className={cn(
                    "animate-fade-up flex items-center justify-between gap-3 px-4 h-14 rounded-2xl text-base font-medium transition-colors",
                    isActive(to)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/80 hover:bg-muted",
                  )}
                >
                  <span className="inline-flex items-center gap-3">
                    <span className={cn(
                      "inline-flex items-center justify-center w-9 h-9 rounded-xl",
                      isActive(to) ? "bg-primary/20" : "bg-muted",
                    )}>
                      <Icon className="w-4.5 h-4.5" />
                    </span>
                    {label}
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              ))}
              <div className="h-px bg-border my-1.5 mx-2" />
              <div className="px-2 py-1">
                <LanguageToggle className="w-full justify-center h-11" />
              </div>
              <button
                onClick={() => { setOpen(false); handleLogout(); }}
                className="flex items-center gap-3 px-4 h-14 rounded-2xl text-base font-medium text-foreground/80 hover:bg-muted transition-colors"
              >
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-muted">
                  <LogOut className="w-4.5 h-4.5" />
                </span>
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {showAuth && <VoiceFAB />}
    </>
  );
};
