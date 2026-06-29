import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Copy, Check, ExternalLink, Pencil, Send, Trash2, Link2, Package,
  Calendar, FolderOpen, Sparkles,
} from "lucide-react";
import { EditProductModal } from "@/components/EditProductModal";
import { CreateProductLinkModal } from "@/components/CreateProductLinkModal";
import { ProductAnalytics } from "@/components/ProductAnalytics";
import { type Product } from "@/hooks/useProducts";
import {
  PageHeader, GradientText, SectionEyebrow, Shimmer, Spotlight,
} from "@/components/ui/premium";
import { cn } from "@/lib/utils";

interface ProductLink { id: string; slug: string; }
interface ProductWithLinks extends Product {
  product_links: ProductLink[];
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<ProductWithLinks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const fetchProduct = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data, error } = await supabase
        .from("products")
        .select(`id, title, short_description, long_description, category, tags, image_url, enhanced_image_url, image_urls, enhanced_image_urls, created_at, product_links (id, slug)`)
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      setProduct(data as unknown as ProductWithLinks);
    } catch (err: any) {
      toast({ title: "Product not found", description: err.message, variant: "destructive" });
      navigate("/catalog");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProduct(); /* eslint-disable-next-line */ }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background bg-block-print">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-5xl mx-auto">
            <Shimmer className="h-9 w-32 mb-6" />
            <div className="grid lg:grid-cols-5 gap-8">
              <Shimmer className="lg:col-span-3 aspect-square rounded-3xl" />
              <div className="lg:col-span-2 space-y-4">
                <Shimmer className="h-10 w-3/4" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-2/3" />
                <Shimmer className="h-12 w-full rounded-xl" />
                <Shimmer className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) return null;

  // Gallery
  const originals = product.image_urls && product.image_urls.length > 0
    ? product.image_urls
    : product.image_url ? [product.image_url] : [];
  const enhanced = product.enhanced_image_urls && product.enhanced_image_urls.length > 0
    ? product.enhanced_image_urls
    : product.enhanced_image_url ? [product.enhanced_image_url] : [];
  const gallery = originals.map((orig, i) => enhanced[i] || orig).filter(Boolean);
  if (gallery.length === 0 && (product.enhanced_image_url || product.image_url)) {
    gallery.push((product.enhanced_image_url || product.image_url) as string);
  }
  const displayImage = gallery[imgIdx] || null;
  const hasLink = product.product_links?.length > 0;
  const slug = hasLink ? product.product_links[0].slug : null;
  const publicUrl = slug ? `${window.location.origin}/p/${slug}` : null;
  const created = product.created_at ? new Date(product.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : null;

  const copyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: "Link copied" });
  };

  const openPublic = () => slug && window.open(`/p/${slug}`, "_blank");

  const openSchedule = () => navigate("/social/schedule", {
    state: {
      productId: product.id,
      productTitle: product.title,
      productDescription: product.short_description,
      productImage: product.enhanced_image_url || product.image_url,
      prefillCaption: `${product.title}${product.short_description ? `\n\n${product.short_description}` : ""}`,
      prefillHashtags: product.tags?.map((t) => `#${t}`).join(" ") || "",
      linkType: "product",
    },
  });

  const handleDelete = async () => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
      toast({ title: "Product deleted" });
      navigate("/catalog");
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background bg-block-print">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb / Back */}
          <nav className="mb-6 flex items-center gap-2 text-sm">
            <Button variant="ghost" size="sm" onClick={() => navigate("/catalog")}>
              <ArrowLeft className="w-4 h-4" /> Library
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground truncate">{product.title}</span>
          </nav>

          {/* Top grid: image + meta */}
          <div className="grid lg:grid-cols-5 gap-8 mb-8">
            {/* Image gallery */}
            <div className="lg:col-span-3 space-y-3">
              <Spotlight className="relative aspect-square rounded-3xl overflow-hidden bg-muted border border-border/60 shadow-elevated">
                {displayImage ? (
                  <img src={displayImage} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
                    <Package className="w-20 h-20" />
                  </div>
                )}
                {hasLink && (
                  <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-success/15 text-success ring-1 ring-success/20 text-xs font-semibold backdrop-blur">
                    <Link2 className="w-3.5 h-3.5" /> Live link
                  </span>
                )}
              </Spotlight>
              {gallery.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {gallery.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImgIdx(i)}
                      className={cn(
                        "shrink-0 w-16 h-16 rounded-xl overflow-hidden ring-2 transition-all",
                        i === imgIdx ? "ring-primary" : "ring-border hover:ring-border-strong",
                      )}
                      aria-label={`Image ${i + 1}`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Meta + actions */}
            <div className="lg:col-span-2 flex flex-col">
              <SectionEyebrow>{product.category || "Product"}</SectionEyebrow>
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

              {/* Meta row */}
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                {created && (
                  <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Created {created}</span>
                )}
                {hasLink && (
                  <span className="inline-flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> /p/{slug}</span>
                )}
              </div>

              {/* Primary actions */}
              <div className="mt-7 space-y-2.5">
                {hasLink ? (
                  <Button variant="gradient" size="lg" className="w-full sheen" onClick={copyLink}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Link copied" : "Copy shareable link"}
                  </Button>
                ) : (
                  <Button variant="gradient" size="lg" className="w-full sheen" onClick={() => setLinkOpen(true)}>
                    <Link2 className="w-4 h-4" /> Create shareable link
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <Button variant="outline" size="lg" onClick={openSchedule}>
                    <Send className="w-4 h-4" /> Post
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setEditOpen(true)}>
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                </div>

                {hasLink && (
                  <Button variant="ghost" size="lg" className="w-full" onClick={openPublic}>
                    <ExternalLink className="w-4 h-4" /> View public page
                  </Button>
                )}
              </div>

              <button
                type="button"
                onClick={handleDelete}
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-destructive hover:underline self-start"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete product
              </button>
            </div>
          </div>

          {/* Long description */}
          {product.long_description && (
            <section className="rounded-3xl border border-border/70 bg-card shadow-card p-6 md:p-7 mb-8 animate-fade-up">
              <SectionEyebrow>Full description</SectionEyebrow>
              <p className="font-display text-xl font-bold mb-3">About this product</p>
              <p className="text-sm md:text-base text-foreground/85 leading-relaxed whitespace-pre-line">{product.long_description}</p>
            </section>
          )}

          {/* Inline analytics — always visible when link exists */}
          {hasLink && (
            <section className="animate-fade-up">
              <SectionEyebrow>Analytics</SectionEyebrow>
              <div className="flex items-end justify-between mb-4">
                <p className="font-display text-xl font-bold">Link performance</p>
                <Button variant="ghost" size="sm" onClick={() => navigate("/analytics")}>
                  See all <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
              <ProductAnalytics productLinkId={product.product_links[0].id} />
            </section>
          )}

          {!hasLink && (
            <section className="rounded-3xl border-2 border-dashed border-border bg-card/60 p-8 text-center animate-fade-up">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 ring-1 ring-primary/15 text-primary mb-4">
                <Link2 className="w-6 h-6" />
              </span>
              <p className="font-display text-xl font-bold">No shareable link yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-5">
                Create one to start tracking clicks and routing customers to WhatsApp, Instagram or your website.
              </p>
              <Button variant="gradient" className="sheen" onClick={() => setLinkOpen(true)}>
                <Link2 className="w-4 h-4" /> Create shareable link
              </Button>
            </section>
          )}
        </div>
      </main>

      <EditProductModal
        product={product}
        open={editOpen}
        onOpenChange={setEditOpen}
        onProductUpdated={fetchProduct}
      />
      <CreateProductLinkModal
        productId={product.id}
        productTitle={product.title}
        open={linkOpen}
        onOpenChange={setLinkOpen}
        onLinkCreated={fetchProduct}
      />
    </div>
  );
}
