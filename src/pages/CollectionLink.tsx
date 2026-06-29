import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, Instagram, ExternalLink, Globe, ChevronLeft, Sparkles, Heart,
  Share2, Check, Package, ShoppingBag, ArrowRight, Search, X,
} from "lucide-react";
import { Shimmer, GradientText, SectionEyebrow, Spotlight } from "@/components/ui/premium";
import { cn } from "@/lib/utils";

interface CollectionProduct {
  id: string;
  title: string;
  short_description: string | null;
  long_description: string | null;
  image_url: string | null;
  enhanced_image_url: string | null;
  category: string | null;
  tags: string[] | null;
}

interface CollectionData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  whatsapp_number: string | null;
  instagram_handle: string | null;
  marketplace_url: string | null;
  website_url: string | null;
}

export default function CollectionLink() {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CollectionProduct | null>(null);
  const [shared, setShared] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => { if (slug) fetchCollection(); /* eslint-disable-next-line */ }, [slug]);

  useEffect(() => {
    // Scroll to top when switching between grid + detail view
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedProduct]);

  const fetchCollection = async () => {
    try {
      const { data: collectionData, error: collError } = await supabase
        .from('product_collections')
        .select('id, name, slug, description, whatsapp_number, instagram_handle, marketplace_url, website_url')
        .eq('slug', slug).eq('is_active', true).maybeSingle();
      if (collError) throw collError;
      if (!collectionData) { setError("Collection not found"); return; }
      setCollection(collectionData as CollectionData);

      const { data: cpData, error: cpError } = await supabase
        .from('collection_products')
        .select('product_id, sort_order')
        .eq('collection_id', collectionData.id)
        .order('sort_order', { ascending: true });
      if (cpError) throw cpError;

      if (cpData && cpData.length > 0) {
        const productIds = cpData.map((cp) => cp.product_id);
        const { data: productsData, error: pError } = await supabase
          .from('products')
          .select('id, title, short_description, long_description, image_url, enhanced_image_url, category, tags')
          .in('id', productIds);
        if (pError) throw pError;
        const orderMap = new Map(cpData.map((cp) => [cp.product_id, cp.sort_order]));
        const sorted = (productsData || []).sort(
          (a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0),
        );
        setProducts(sorted);
      }
    } catch (err: any) {
      console.error('Error fetching collection:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getImage = (p: CollectionProduct) => p.enhanced_image_url || p.image_url;

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share && collection) {
      try {
        await navigator.share({ title: collection.name, url: window.location.href });
        return;
      } catch { /* user cancelled */ }
    }
    await navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 1500);
  };

  /* ── Loading ─────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background bg-gradient-mesh p-4">
        <div className="max-w-5xl mx-auto pt-10 space-y-6">
          <Shimmer className="h-12 w-2/3 mx-auto" />
          <Shimmer className="h-4 w-1/2 mx-auto" />
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 pt-6">
            {[...Array(6)].map((_, i) => <Shimmer key={i} className="aspect-square rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ──────────────────────────────────────── */
  if (error || !collection) {
    return (
      <div className="min-h-screen bg-background bg-gradient-mesh flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-card border border-border shadow-elevated p-8 text-center animate-scale-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Collection Not Found</h1>
          <p className="text-muted-foreground">This collection may have been removed or is no longer available.</p>
        </div>
      </div>
    );
  }

  /* ── Selected product detail view ───────────────────── */
  if (selectedProduct) {
    return (
      <ProductView
        product={selectedProduct}
        collection={collection}
        onBack={() => setSelectedProduct(null)}
      />
    );
  }

  /* ── Filtered grid ──────────────────────────────────── */
  const visible = query.trim()
    ? products.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          (p.short_description || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      })
    : products;

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]));

  return (
    <div className="min-h-screen bg-background relative">
      {/* Hero backdrop */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-[28rem] bg-gradient-mesh opacity-80" />
      <div aria-hidden className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-primary/20 blur-3xl animate-blob" />
      <div aria-hidden className="absolute -top-24 -left-32 w-[24rem] h-[24rem] rounded-full bg-tertiary/15 blur-3xl animate-blob [animation-delay:4s]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-7 pb-12">
        {/* Top toolbar */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-marigold shadow-soft">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </span>
            <span className="font-display font-bold">AdCraft AI</span>
          </a>
          <button
            onClick={handleShare}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-card/80 backdrop-blur border border-border text-sm font-medium transition-all hover:shadow-card hover:bg-card",
              shared && "text-success",
            )}
          >
            {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {shared ? "Copied" : "Share"}
          </button>
        </div>

        {/* Hero */}
        <header className="text-center mb-10 animate-fade-up">
          <SectionEyebrow className="justify-center">Storefront</SectionEyebrow>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05] text-balance mb-3">
            <GradientText>{collection.name}</GradientText>
          </h1>
          {collection.description && (
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {collection.description}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="soft">
              <Package className="w-3.5 h-3.5" />
              {products.length} {products.length === 1 ? "item" : "items"}
            </Badge>
            {categories.slice(0, 3).map((c) => (
              <Badge key={c} variant="soft-accent">{c}</Badge>
            ))}
          </div>

          {/* Hero CTAs (jump to contact) */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            {collection.whatsapp_number && (
              <Button
                onClick={() => {
                  const msg = encodeURIComponent(`Hi! I want to know more about your products from ${collection.name}`);
                  window.open(`https://wa.me/${collection.whatsapp_number}?text=${msg}`, "_blank");
                }}
                className="h-11 rounded-2xl bg-success hover:bg-success/90 text-success-foreground font-semibold shadow-soft sheen"
              >
                <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
              </Button>
            )}
            {collection.instagram_handle && (
              <Button
                variant="outline"
                onClick={() => window.open(`https://instagram.com/${collection.instagram_handle}`, "_blank")}
                className="h-11 rounded-2xl"
              >
                <Instagram className="w-4 h-4" /> Instagram
              </Button>
            )}
          </div>
        </header>

        {/* Search bar (only when many items) */}
        {products.length >= 6 && (
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search this collection…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-10 rounded-2xl border border-border bg-card/80 backdrop-blur text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/40 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="rounded-3xl bg-card border border-border/60 py-16 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No products in this collection yet.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-border bg-card/60 py-12 text-center">
            <p className="text-muted-foreground">No products match "{query}".</p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setQuery("")}>Clear search</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
            {visible.map((product) => {
              const img = getImage(product);
              return (
                <Spotlight
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedProduct(product)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedProduct(product); } }}
                  className="group cursor-pointer rounded-2xl bg-card border border-border/70 shadow-card overflow-hidden hover-lift press-shrink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {img ? (
                      <img
                        src={img}
                        alt={product.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
                        <Package className="w-10 h-10" />
                      </div>
                    )}
                    {product.category && (
                      <Badge variant="soft" className="absolute top-2.5 left-2.5 backdrop-blur bg-card/85 border-0 text-[10px]">
                        {product.category}
                      </Badge>
                    )}
                    <div aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/40 to-transparent pointer-events-none" />
                  </div>
                  <div className="p-3.5 space-y-1.5">
                    <h3 className="font-display text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    {product.short_description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{product.short_description}</p>
                    )}
                  </div>
                </Spotlight>
              );
            })}
          </div>
        )}

        {/* Bottom contact band */}
        <ContactBand collection={collection} />
        <Branding />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Product detail (within collection)
   ────────────────────────────────────────────────────────────*/
function ProductView({
  product, collection, onBack,
}: { product: CollectionProduct; collection: CollectionData; onBack: () => void }) {
  const img = product.enhanced_image_url || product.image_url;
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: product.title, url: window.location.href }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[24rem] bg-gradient-mesh opacity-70" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-12">
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-card/80 backdrop-blur border border-border text-sm font-medium hover:shadow-card hover:bg-card transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Back to {collection.name}
          </button>
          <button
            onClick={handleShare}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-card/80 backdrop-blur border border-border text-sm font-medium transition-all hover:shadow-card hover:bg-card",
              shared && "text-success",
            )}
          >
            {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {shared ? "Copied" : "Share"}
          </button>
        </div>

        <div className="grid lg:grid-cols-5 gap-7 mb-8">
          <Spotlight className="lg:col-span-3 relative aspect-square rounded-3xl overflow-hidden bg-muted border border-border/60 shadow-elevated animate-fade-up">
            {img ? (
              <img src={img} alt={product.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
                <Package className="w-20 h-20" />
              </div>
            )}
            {product.category && (
              <Badge variant="gradient" className="absolute top-4 left-4 shadow-soft">{product.category}</Badge>
            )}
          </Spotlight>

          <div className="lg:col-span-2 flex flex-col animate-fade-up [animation-delay:80ms]">
            <SectionEyebrow>From {collection.name}</SectionEyebrow>
            <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight text-balance">
              <GradientText>{product.title}</GradientText>
            </h1>
            {product.short_description && (
              <p className="mt-3 text-muted-foreground text-base leading-relaxed">{product.short_description}</p>
            )}

            {product.tags && product.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {product.tags.map((tag, i) => (
                  <Badge key={i} variant="soft-accent" className="text-[11px]">#{tag}</Badge>
                ))}
              </div>
            )}

            <div className="mt-7 space-y-2.5">
              {collection.whatsapp_number && (
                <Button
                  onClick={() => {
                    const msg = encodeURIComponent(`Hi! I'm interested in: ${product.title}`);
                    window.open(`https://wa.me/${collection.whatsapp_number}?text=${msg}`, "_blank");
                  }}
                  className="w-full h-13 rounded-2xl text-base font-bold bg-success hover:bg-success/90 text-success-foreground shadow-soft sheen"
                >
                  <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
                </Button>
              )}
              {collection.instagram_handle && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://instagram.com/${collection.instagram_handle}`, "_blank")}
                  className="w-full h-12 rounded-2xl text-base"
                >
                  <Instagram className="w-5 h-5" /> View on Instagram
                </Button>
              )}
              {collection.marketplace_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(collection.marketplace_url!, "_blank")}
                  className="w-full h-12 rounded-2xl text-base"
                >
                  <ExternalLink className="w-5 h-5" /> Buy on Marketplace
                </Button>
              )}
              {collection.website_url && (
                <Button
                  variant="ghost"
                  onClick={() => window.open(collection.website_url!, "_blank")}
                  className="w-full h-12 rounded-2xl text-base"
                >
                  <Globe className="w-5 h-5" /> Visit Website
                </Button>
              )}
            </div>
          </div>
        </div>

        {product.long_description && (
          <section className="rounded-3xl border border-border/70 bg-card shadow-card p-6 md:p-7 mb-8 animate-fade-up">
            <SectionEyebrow>Details</SectionEyebrow>
            <p className="font-display text-xl font-bold mb-3">About this product</p>
            <p className="text-sm md:text-base text-foreground/85 leading-relaxed whitespace-pre-line">
              {product.long_description}
            </p>
          </section>
        )}

        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Explore more from {collection.name}
        </button>

        <Branding />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Sticky-ish contact band at bottom of grid view
   ────────────────────────────────────────────────────────────*/
function ContactBand({ collection }: { collection: CollectionData }) {
  const buttons: { Icon: any; label: string; onClick: () => void; tone: "success" | "accent" | "tertiary" | "muted" }[] = [];
  if (collection.whatsapp_number) {
    buttons.push({
      Icon: MessageCircle,
      label: "WhatsApp",
      tone: "success",
      onClick: () => {
        const msg = encodeURIComponent(`Hi! I'm interested in your products from ${collection.name}`);
        window.open(`https://wa.me/${collection.whatsapp_number}?text=${msg}`, "_blank");
      },
    });
  }
  if (collection.instagram_handle) {
    buttons.push({
      Icon: Instagram,
      label: "Instagram",
      tone: "accent",
      onClick: () => window.open(`https://instagram.com/${collection.instagram_handle}`, "_blank"),
    });
  }
  if (collection.marketplace_url) {
    buttons.push({
      Icon: ExternalLink,
      label: "Marketplace",
      tone: "tertiary",
      onClick: () => window.open(collection.marketplace_url!, "_blank"),
    });
  }
  if (collection.website_url) {
    buttons.push({
      Icon: Globe,
      label: "Website",
      tone: "muted",
      onClick: () => window.open(collection.website_url!, "_blank"),
    });
  }
  if (buttons.length === 0) return null;

  const toneStyles = {
    success: "bg-success hover:bg-success/90 text-success-foreground",
    accent: "bg-card border border-border hover:border-primary/40 text-foreground",
    tertiary: "bg-card border border-border hover:border-primary/40 text-foreground",
    muted: "bg-card border border-border hover:border-primary/40 text-foreground",
  };

  return (
    <section className="mt-12 rounded-3xl bg-card border border-border/70 shadow-card p-6 md:p-8 animate-fade-up">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <SectionEyebrow>Get in touch</SectionEyebrow>
          <h2 className="font-display text-xl md:text-2xl font-bold">
            Like what you see? <GradientText>Reach out.</GradientText>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            We'll respond on whichever channel works best for you.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {buttons.map(({ Icon, label, onClick, tone }) => (
            <Button
              key={label}
              onClick={onClick}
              className={cn("h-11 rounded-2xl text-sm font-semibold shadow-soft sheen", toneStyles[tone])}
            >
              <Icon className="w-4 h-4" /> {label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Branding() {
  return (
    <a
      href="/"
      className="mt-10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <Sparkles className="w-3.5 h-3.5 text-primary" />
      Powered by <strong className="font-display font-bold">AdCraft AI</strong>
      <Heart className="w-3 h-3 fill-tertiary text-tertiary" />
    </a>
  );
}
