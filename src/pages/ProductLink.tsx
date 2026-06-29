import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, Instagram, ExternalLink, Globe, ShoppingBag,
  Sparkles, Heart, Share2, Check,
} from "lucide-react";
import { Shimmer } from "@/components/ui/premium";
import { cn } from "@/lib/utils";

interface ProductLinkData {
  id: string;
  slug: string;
  whatsapp_number: string | null;
  instagram_handle: string | null;
  marketplace_url: string | null;
  website_url: string | null;
  products: {
    id: string;
    title: string;
    short_description: string | null;
    long_description: string | null;
    image_url: string | null;
    enhanced_image_url: string | null;
    category: string | null;
    tags: string[] | null;
  } | null;
}

export default function ProductLink() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [productLink, setProductLink] = useState<ProductLinkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  useEffect(() => { if (slug) fetchProductLink(); }, [slug]);

  const fetchProductLink = async () => {
    try {
      const { data, error } = await supabase
        .from('product_links')
        .select(`id, slug, whatsapp_number, instagram_handle, marketplace_url, website_url, products (id, title, short_description, long_description, image_url, enhanced_image_url, category, tags)`)
        .eq('slug', slug).eq('is_active', true).maybeSingle();
      if (error) throw error;
      if (!data) { setError("Product not found"); return; }
      setProductLink(data as unknown as ProductLinkData);

      const utmSource = searchParams.get('utm_source');
      const utmMedium = searchParams.get('utm_medium');
      const utmCampaign = searchParams.get('utm_campaign');
      await supabase.functions.invoke('track-click', {
        body: {
          productLinkId: data.id, utmSource, utmMedium, utmCampaign,
          referrer: document.referrer, source: utmSource || 'direct',
        },
      });
    } catch (err: any) {
      console.error('Error fetching product link:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const trackClick = async (source: string) => {
    if (!productLink) return;
    await supabase.functions.invoke('track-click', {
      body: { productLinkId: productLink.id, source, referrer: document.referrer },
    });
  };

  const handleWhatsApp = () => {
    if (!productLink?.whatsapp_number || !productLink.products) return;
    trackClick('whatsapp');
    const message = encodeURIComponent(`Hi! I'm interested in: ${productLink.products.title}`);
    window.open(`https://wa.me/${productLink.whatsapp_number}?text=${message}`, '_blank');
  };
  const handleInstagram = () => {
    if (!productLink?.instagram_handle) return;
    trackClick('instagram');
    window.open(`https://instagram.com/${productLink.instagram_handle}`, '_blank');
  };
  const handleMarketplace = () => {
    if (!productLink?.marketplace_url) return;
    trackClick('marketplace');
    window.open(productLink.marketplace_url, '_blank');
  };
  const handleWebsite = () => {
    if (!productLink?.website_url) return;
    trackClick('website');
    window.open(productLink.website_url, '_blank');
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share && productLink?.products) {
      try {
        await navigator.share({ title: productLink.products.title, url: window.location.href });
        return;
      } catch { /* user cancelled */ }
    }
    await navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background bg-gradient-mesh p-4">
        <div className="max-w-lg mx-auto pt-8 space-y-4">
          <Shimmer className="aspect-square w-full rounded-3xl" />
          <Shimmer className="h-8 w-3/4" />
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !productLink || !productLink.products) {
    return (
      <div className="min-h-screen bg-background bg-gradient-mesh flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl bg-card border border-border shadow-elevated p-8 text-center animate-scale-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Product Not Found</h1>
          <p className="text-muted-foreground">This product link may have been removed or is no longer available.</p>
        </div>
      </div>
    );
  }

  const product = productLink.products;
  const displayImage = product.enhanced_image_url || product.image_url;

  return (
    <div className="min-h-screen bg-background relative">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[28rem] bg-gradient-mesh opacity-70" />
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-primary/15 blur-3xl" />

      <div className="relative max-w-lg mx-auto px-4 pt-8 pb-12">
        {/* Share button */}
        <div className="flex justify-end mb-3">
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

        {/* Product card */}
        <div className="rounded-3xl overflow-hidden bg-card border border-border/60 shadow-elevated animate-fade-up">
          {displayImage && (
            <div className="relative aspect-square overflow-hidden bg-muted">
              <img src={displayImage} alt={product.title} className="w-full h-full object-cover" />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card/95 via-card/10 to-transparent" />
              {product.category && (
                <Badge variant="gradient" className="absolute top-3 left-3 shadow-soft">{product.category}</Badge>
              )}
            </div>
          )}
          <div className="p-6 space-y-4">
            <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight">{product.title}</h1>
            {product.short_description && (
              <p className="text-muted-foreground text-base leading-relaxed">{product.short_description}</p>
            )}
            {product.long_description && (
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed pt-2 border-t border-border/60">
                {product.long_description}
              </p>
            )}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag, i) => (
                  <Badge key={i} variant="soft-accent" className="text-[10px]">#{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3 mt-5 stagger-children">
          {productLink.whatsapp_number && (
            <Button onClick={handleWhatsApp} className="w-full h-14 rounded-2xl text-base font-bold bg-green-600 hover:bg-green-700 text-white shadow-soft hover:shadow-glow-lg hover:-translate-y-0.5 transition-all sheen" >
              <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
            </Button>
          )}
          {productLink.instagram_handle && (
            <Button onClick={handleInstagram} className="w-full h-14 rounded-2xl text-base font-bold text-white shadow-soft hover:shadow-glow-lg hover:-translate-y-0.5 transition-all bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-500 sheen">
              <Instagram className="w-5 h-5" /> View on Instagram
            </Button>
          )}
          {productLink.marketplace_url && (
            <Button onClick={handleMarketplace} variant="outline" className="w-full h-14 rounded-2xl text-base">
              <ExternalLink className="w-5 h-5" /> Buy on Marketplace
            </Button>
          )}
          {productLink.website_url && (
            <Button onClick={handleWebsite} variant="outline" className="w-full h-14 rounded-2xl text-base">
              <Globe className="w-5 h-5" /> Visit Website
            </Button>
          )}
        </div>

        {/* Powered by */}
        <a
          href="/"
          className="mt-10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Powered by <strong className="font-display font-bold">AdCraft AI</strong>
          <Heart className="w-3 h-3 fill-tertiary text-tertiary" />
        </a>
      </div>
    </div>
  );
}
