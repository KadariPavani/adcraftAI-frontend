import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3, MousePointerClick, TrendingUp, MessageCircle, Instagram, Globe,
  ExternalLink, Eye, Sparkles, Package, ChevronRight, Clock, Activity,
} from "lucide-react";
import {
  PageHeader, GradientText, StatCard, EmptyState, SectionEyebrow, Spotlight, Shimmer,
} from "@/components/ui/premium";
import { cn } from "@/lib/utils";

interface ProductSlim {
  id: string;
  title: string;
  image_url: string | null;
  enhanced_image_url: string | null;
}

interface LinkSlim {
  id: string;
  slug: string;
  product_id: string | null;
}

interface ClickRow {
  id: string;
  product_link_id: string;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  clicked_at: string;
}

type Range = 7 | 30 | 90;

export default function LinkAnalytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [range, setRange] = useState<Range>(7);
  const [links, setLinks] = useState<LinkSlim[]>([]);
  const [products, setProducts] = useState<Record<string, ProductSlim>>({});
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [range]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data: linkRows, error: lErr } = await supabase
        .from("product_links")
        .select("id, slug, product_id")
        .eq("user_id", user.id);
      if (lErr) throw lErr;
      const linksList = (linkRows || []) as LinkSlim[];
      setLinks(linksList);

      if (linksList.length === 0) {
        setClicks([]);
        setProducts({});
        setIsLoading(false);
        return;
      }

      const linkIds = linksList.map((l) => l.id);
      const productIds = Array.from(new Set(linksList.map((l) => l.product_id).filter(Boolean) as string[]));

      // Fetch products
      let productMap: Record<string, ProductSlim> = {};
      if (productIds.length > 0) {
        const { data: prodRows } = await supabase
          .from("products")
          .select("id, title, image_url, enhanced_image_url")
          .in("id", productIds);
        for (const p of (prodRows || []) as ProductSlim[]) productMap[p.id] = p;
      }
      setProducts(productMap);

      // Fetch clicks within range
      const since = new Date();
      since.setDate(since.getDate() - range);

      const { data: clickRows, error: cErr } = await supabase
        .from("link_clicks")
        .select("id, product_link_id, source, utm_source, utm_medium, utm_campaign, clicked_at")
        .in("product_link_id", linkIds)
        .gte("clicked_at", since.toISOString())
        .order("clicked_at", { ascending: false });
      if (cErr) throw cErr;
      setClicks((clickRows || []) as ClickRow[]);
    } catch (err: any) {
      toast({ title: "Failed to load analytics", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived metrics ────────────────────────────────────────
  const totalClicks = clicks.length;
  const uniqueProducts = useMemo(() => {
    const ids = new Set<string>();
    for (const c of clicks) {
      const l = links.find((x) => x.id === c.product_link_id);
      if (l?.product_id) ids.add(l.product_id);
    }
    return ids.size;
  }, [clicks, links]);

  const last24h = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return clicks.filter((c) => new Date(c.clicked_at).getTime() >= cutoff).length;
  }, [clicks]);

  const bySource = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of clicks) {
      const s = (c.source || c.utm_source || "direct").toLowerCase();
      m.set(s, (m.get(s) || 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [clicks]);

  const byDay = useMemo(() => {
    const days: { label: string; count: number; key: string }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      days.push({ key, label, count: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.key, i]));
    for (const c of clicks) {
      const key = c.clicked_at.slice(0, 10);
      const i = idx.get(key);
      if (i !== undefined) days[i].count++;
    }
    return days;
  }, [clicks, range]);

  const topProducts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of clicks) {
      const l = links.find((x) => x.id === c.product_link_id);
      if (!l?.product_id) continue;
      m.set(l.product_id, (m.get(l.product_id) || 0) + 1);
    }
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, count]) => ({ product: products[id], count, id }))
      .filter((x) => x.product);
  }, [clicks, links, products]);

  const maxDay = Math.max(1, ...byDay.map((d) => d.count));

  const sourceMeta: Record<string, { Icon: any; tone: string; label: string }> = {
    whatsapp:    { Icon: MessageCircle, tone: "text-success bg-success/10 ring-success/15", label: "WhatsApp" },
    instagram:   { Icon: Instagram, tone: "text-primary bg-primary/10 ring-primary/15", label: "Instagram" },
    facebook:    { Icon: Globe, tone: "text-accent bg-accent/10 ring-accent/15", label: "Facebook" },
    website:     { Icon: Globe, tone: "text-accent bg-accent/10 ring-accent/15", label: "Website" },
    marketplace: { Icon: ExternalLink, tone: "text-tertiary bg-tertiary/10 ring-tertiary/15", label: "Marketplace" },
    direct:      { Icon: Eye, tone: "text-muted-foreground bg-muted ring-border", label: "Direct" },
  };

  const meta = (s: string) =>
    sourceMeta[s] || { Icon: Activity, tone: "text-muted-foreground bg-muted ring-border", label: s.charAt(0).toUpperCase() + s.slice(1) };

  const productImage = (p?: ProductSlim) => p?.enhanced_image_url || p?.image_url || null;

  return (
    <div className="min-h-screen bg-background bg-block-print">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            eyebrow="Analytics"
            title={<>Track what's <GradientText>actually working</GradientText></>}
            subtitle="Aggregate clicks across all your shareable links — by source, by product, by day."
            actions={
              <div className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-muted/60 ring-1 ring-border/60">
                {([7, 30, 90] as Range[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-colors ${
                      range === r ? "bg-card text-foreground shadow-sm-soft" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r}d
                  </button>
                ))}
              </div>
            }
          />

          {/* ── Top stats ─────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 stagger-children">
            <StatCard icon={MousePointerClick} label="Total clicks" value={totalClicks} tone="primary" />
            <StatCard icon={Clock} label="Last 24 hours" value={last24h} tone="accent" />
            <StatCard icon={Package} label="Products with clicks" value={uniqueProducts} tone="success" />
            <StatCard icon={TrendingUp} label="Live links" value={links.length} tone="tertiary" />
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Shimmer className="h-56 rounded-3xl" />
              <div className="grid lg:grid-cols-2 gap-6">
                <Shimmer className="h-72 rounded-3xl" />
                <Shimmer className="h-72 rounded-3xl" />
              </div>
            </div>
          ) : links.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No links yet"
              description="Create a shareable link on any product to start tracking clicks."
              action={
                <Button variant="gradient" size="lg" className="sheen" onClick={() => navigate("/catalog")}>
                  <Sparkles className="w-4 h-4" /> Open Catalog
                </Button>
              }
            />
          ) : totalClicks === 0 ? (
            <EmptyState
              icon={MousePointerClick}
              title="No clicks in this window"
              description="Share your links on WhatsApp, Instagram, Facebook or anywhere — and your data lands here."
              action={
                <Button variant="outline" size="lg" onClick={() => navigate("/catalog")}>
                  Manage links
                </Button>
              }
            />
          ) : (
            <div className="space-y-8">
              {/* ── Daily chart ──────────────────────── */}
              <Spotlight className="rounded-3xl border border-border/70 bg-card shadow-card p-6">
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <SectionEyebrow>Daily clicks</SectionEyebrow>
                    <h2 className="font-display text-xl font-bold">Last {range} days</h2>
                  </div>
                  <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-gradient-marigold" /> Click count
                  </p>
                </div>
                <div className="flex items-end gap-1 sm:gap-1.5 h-44">
                  {byDay.map((d) => {
                    const h = (d.count / maxDay) * 100;
                    return (
                      <div key={d.key} className="group relative flex-1 flex flex-col items-center gap-1.5 min-w-0">
                        <span className="text-[10px] text-muted-foreground tabular-nums opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5">
                          {d.count}
                        </span>
                        <div
                          className={cn(
                            "w-full bg-gradient-marigold rounded-md min-h-[3px] transition-all duration-500 ease-out hover:opacity-90",
                            d.count === 0 && "bg-muted",
                          )}
                          style={{ height: `${Math.max(h, 3)}%` }}
                          title={`${d.label}: ${d.count} click${d.count === 1 ? "" : "s"}`}
                        />
                        <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                          {d.label.split(" ")[1]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Spotlight>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* ── By source ────────────────────────── */}
                <div className="rounded-3xl border border-border/70 bg-card shadow-card p-6">
                  <SectionEyebrow>By source</SectionEyebrow>
                  <h2 className="font-display text-xl font-bold mb-5">Where clicks come from</h2>
                  <ul className="space-y-3">
                    {bySource.map(([source, count]) => {
                      const m = meta(source);
                      const pct = totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0;
                      return (
                        <li key={source} className="flex items-center gap-3">
                          <span className={cn("inline-flex items-center justify-center w-9 h-9 rounded-xl ring-1 shrink-0", m.tone)}>
                            <m.Icon className="w-4 h-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate">{m.label}</p>
                              <p className="text-sm tabular-nums text-muted-foreground">
                                <span className="font-semibold text-foreground">{count}</span> · {pct}%
                              </p>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-marigold rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* ── Top products ─────────────────────── */}
                <div className="rounded-3xl border border-border/70 bg-card shadow-card p-6">
                  <SectionEyebrow>Top performers</SectionEyebrow>
                  <h2 className="font-display text-xl font-bold mb-5">Best-clicked products</h2>
                  {topProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No product-level clicks yet.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {topProducts.map(({ product, count, id }, i) => {
                        const img = productImage(product);
                        return (
                          <li key={id}>
                            <button
                              onClick={() => navigate(`/product/${id}`)}
                              className="group w-full text-left flex items-center gap-3 p-2.5 rounded-2xl hover:bg-muted/60 transition-colors press-shrink"
                            >
                              <span className="font-display text-xl font-bold text-muted-foreground tabular-nums w-6 text-center">
                                {i + 1}
                              </span>
                              {img ? (
                                <img src={img} alt={product!.title} className="w-12 h-12 rounded-xl object-cover ring-1 ring-border" />
                              ) : (
                                <span className="w-12 h-12 rounded-xl bg-muted ring-1 ring-border flex items-center justify-center">
                                  <Package className="w-5 h-5 text-muted-foreground/50" />
                                </span>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{product!.title}</p>
                                <p className="text-xs text-muted-foreground tabular-nums">{count} click{count === 1 ? "" : "s"}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* ── Recent activity ────────────────────── */}
              <div className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden">
                <div className="p-6 border-b border-border/60">
                  <SectionEyebrow>Activity</SectionEyebrow>
                  <h2 className="font-display text-xl font-bold">Recent clicks</h2>
                </div>
                <ul className="divide-y divide-border/60 max-h-96 overflow-auto">
                  {clicks.slice(0, 50).map((c) => {
                    const link = links.find((l) => l.id === c.product_link_id);
                    const product = link?.product_id ? products[link.product_id] : null;
                    const m = meta((c.source || c.utm_source || "direct").toLowerCase());
                    const when = new Date(c.clicked_at).toLocaleString("en-IN", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    });
                    return (
                      <li key={c.id} className="px-6 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                        <span className={cn("inline-flex items-center justify-center w-9 h-9 rounded-xl ring-1 shrink-0", m.tone)}>
                          <m.Icon className="w-4 h-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {product ? product.title : "Unknown product"}
                          </p>
                          <p className="text-xs text-muted-foreground inline-flex items-center gap-2 mt-0.5">
                            via {m.label}
                            {c.utm_campaign && <span className="text-muted-foreground/60">· {c.utm_campaign}</span>}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0 tabular-nums">{when}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
