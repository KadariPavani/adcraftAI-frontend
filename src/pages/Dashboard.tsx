import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import {
  FileText, Megaphone, History, FolderOpen, Link2, Eye,
  CalendarCheck, ShoppingBag, ArrowUpRight, Mic, ChevronRight,
} from "lucide-react";
import { User, Session } from "@supabase/supabase-js";
import { useRegionalCopy } from "@/hooks/useRegionalCopy";
import {
  CountUp, Spotlight, SectionEyebrow, GradientText,
} from "@/components/ui/premium";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalProducts: number;
  totalLinks: number;
  totalClicks: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const copy = useRegionalCopy();
  const [user, setUser] = useState<User | null>(null);
  const [_session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ totalProducts: 0, totalLinks: 0, totalClicks: 0 });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
      else fetchStats(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchStats = async (userId: string) => {
    try {
      const { count: productCount } = await supabase
        .from('products').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const { count: linkCount } = await supabase
        .from('product_links').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      const { data: userLinks } = await supabase
        .from('product_links').select('id').eq('user_id', userId);

      let clickCount = 0;
      if (userLinks && userLinks.length > 0) {
        const linkIds = userLinks.map(l => l.id);
        const { count } = await supabase
          .from('link_clicks').select('*', { count: 'exact', head: true }).in('product_link_id', linkIds);
        clickCount = count || 0;
      }

      setStats({
        totalProducts: productCount || 0,
        totalLinks: linkCount || 0,
        totalClicks: clickCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (!user) return null;

  const firstName = user.user_metadata?.full_name?.split(" ")[0] || "Creator";

  return (
    <div className="min-h-screen bg-background bg-block-print">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16 relative">
        <div aria-hidden className="pointer-events-none absolute top-0 right-0 w-[40rem] h-[40rem] rounded-full bg-primary/10 blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto space-y-10">
          {/* Greeting */}
          <header className="animate-fade-up">
            <SectionEyebrow>{copy.greeting}</SectionEyebrow>
            <h1 className="font-display text-3xl md:text-5xl font-bold leading-[1.05] text-balance">
              Welcome back, <GradientText>{firstName}</GradientText>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mt-2">
              {copy.dashboardSubline}
            </p>
          </header>

          {/* Clickable stats — each navigates */}
          <section className="grid grid-cols-3 gap-3 sm:gap-4 stagger-children">
            <StatTile
              icon={FolderOpen} label="Products" value={stats.totalProducts} tone="primary"
              hint="Open library"
              onClick={() => navigate("/catalog")}
            />
            <StatTile
              icon={Link2} label="Shareable Links" value={stats.totalLinks} tone="accent"
              hint="Manage links"
              onClick={() => navigate("/catalog")}
            />
            <StatTile
              icon={Eye} label="Link Clicks" value={stats.totalClicks} tone="success"
              hint="Open analytics"
              onClick={() => navigate("/analytics")}
            />
          </section>

          {/* Primary actions — one unified grid, every tile clickable, no duplicates */}
          <section>
            <div className="flex items-end justify-between mb-5">
              <div>
                <SectionEyebrow>Studio</SectionEyebrow>
                <h2 className="font-display text-2xl font-bold">Pick a tool</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              <ActionTile
                icon={FileText}
                title="New Product"
                desc="Photo to full listing"
                tone="marigold"
                onClick={() => navigate("/generate/description")}
                featured
              />
              <ActionTile
                icon={Megaphone}
                title="Marketing Campaign"
                desc="Captions, hashtags, creatives"
                tone="indigo"
                onClick={() => navigate("/generate/campaign")}
              />
              <ActionTile
                icon={ShoppingBag}
                title="Ecommerce Listing"
                desc="Amazon, Flipkart, Meesho"
                tone="warm"
                onClick={() => navigate("/ecommerce")}
              />
              <ActionTile
                icon={CalendarCheck}
                title="Social Hub"
                desc="Schedule & publish posts"
                tone="card"
                onClick={() => navigate("/social/dashboard")}
              />
              <ActionTile
                icon={Mic}
                title="Voice Mode"
                desc="Speak to create a product"
                tone="card"
                onClick={() => navigate("/voice")}
              />
              <ActionTile
                icon={History}
                title="Activity History"
                desc="Your recent generations"
                tone="card"
                onClick={() => navigate("/history")}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   StatTile — clickable stat with icon, animated count, hint
   ────────────────────────────────────────────────────────────*/
function StatTile({
  icon: Icon, label, value, tone, hint, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "primary" | "accent" | "success";
  hint: string;
  onClick: () => void;
}) {
  const t =
    tone === "primary"  ? { bg: "bg-primary/10",  ring: "ring-primary/20",  ic: "text-primary"  } :
    tone === "accent"   ? { bg: "bg-accent/10",   ring: "ring-accent/20",   ic: "text-accent"   } :
                          { bg: "bg-success/10",  ring: "ring-success/20",  ic: "text-success"  };
  return (
    <button
      onClick={onClick}
      className="group relative w-full text-left rounded-2xl bg-card border border-border/70 shadow-card p-4 sm:p-5 hover-lift press-shrink overflow-hidden"
    >
      <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-warm opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-1 leading-none">
            <CountUp value={value} />
          </p>
          <p className="text-[11px] text-muted-foreground mt-2 inline-flex items-center gap-1">
            {hint} <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </p>
        </div>
        <span className={cn("inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl ring-1 shrink-0", t.bg, t.ring)}>
          <Icon className={cn("w-5 h-5", t.ic)} />
        </span>
      </div>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────
   ActionTile — clickable studio action
   ────────────────────────────────────────────────────────────*/
function ActionTile({
  icon: Icon, title, desc, tone, onClick, featured,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  tone: "marigold" | "indigo" | "warm" | "card";
  onClick: () => void;
  featured?: boolean;
}) {
  const surface =
    tone === "marigold" ? "bg-gradient-marigold text-primary-foreground border-transparent" :
    tone === "indigo"   ? "bg-gradient-indigo text-primary-foreground border-transparent" :
    tone === "warm"     ? "bg-gradient-warm text-primary-foreground border-transparent" :
                          "bg-card text-foreground border-border/70";
  const iconTint =
    tone === "card" ? "bg-primary/10 ring-1 ring-primary/15 text-primary" :
                      "bg-white/20 ring-1 ring-white/25 text-white";
  return (
    <Spotlight
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className={cn(
        "group cursor-pointer rounded-3xl border-2 shadow-card hover-lift-lg press-shrink overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        surface,
        featured && "lg:col-span-2 lg:row-span-1",
      )}
    >
      <div className="p-5 sm:p-6 relative">
        {tone !== "card" && (
          <div aria-hidden className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/15 blur-2xl" />
        )}
        <div className="relative flex items-start justify-between gap-4">
          <span className={cn("inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shrink-0", iconTint)}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </span>
          <ChevronRight className={cn(
            "w-5 h-5 mt-2 opacity-50 group-hover:translate-x-1 group-hover:opacity-90 transition-all",
            tone === "card" ? "text-muted-foreground" : "text-white",
          )} />
        </div>
        <div className="relative mt-4">
          <h3 className={cn("font-display text-lg sm:text-xl font-bold leading-tight", tone === "card" ? "" : "text-white")}>
            {title}
          </h3>
          <p className={cn("text-sm mt-1", tone === "card" ? "text-muted-foreground" : "text-white/80")}>
            {desc}
          </p>
        </div>
      </div>
    </Spotlight>
  );
}
