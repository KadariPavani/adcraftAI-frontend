import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link2, Copy, Check, Package } from "lucide-react";
import { type Product } from "@/hooks/useProducts";
import { Spotlight } from "@/components/ui/premium";
import { cn } from "@/lib/utils";

interface ProductLink { id: string; slug: string; }
interface ProductWithLinks extends Product { product_links: ProductLink[]; }

interface ProductCardProps {
  product: ProductWithLinks;
  // Kept for API compatibility — the detail page handles edit/link/delete now.
  onDelete?: (id: string) => void;
  onEdit?: (product: ProductWithLinks) => void;
  onCreateLink?: (product: ProductWithLinks) => void;
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

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
  const displayImage = gallery[0] || null;
  const hasLink = product.product_links?.length > 0;
  const slug = hasLink ? product.product_links[0].slug : null;
  const galleryCount = gallery.length;

  const open = () => navigate(`/product/${product.id}`);

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!slug) return;
    const link = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: "Link copied" });
  };

  return (
    <Spotlight
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
      className="group cursor-pointer rounded-2xl bg-card border border-border/70 shadow-card overflow-hidden hover-lift press-shrink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
            <Package className="w-12 h-12" />
          </div>
        )}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/40 to-transparent pointer-events-none" />

        {/* Top row */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2">
          {product.category ? (
            <Badge variant="soft" className="backdrop-blur bg-card/85 border-0">{product.category}</Badge>
          ) : <span />}
          {hasLink && (
            <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-success/15 text-success ring-1 ring-success/20 text-[10px] font-semibold backdrop-blur">
              <Link2 className="w-3 h-3" /> Live
            </span>
          )}
        </div>

        {/* Gallery count */}
        {galleryCount > 1 && (
          <span className="absolute bottom-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background/85 backdrop-blur ring-1 ring-border/60">
            {galleryCount} photos
          </span>
        )}

        {/* Quick copy link overlay (only if has link) */}
        {hasLink && (
          <button
            type="button"
            onClick={copyLink}
            className={cn(
              "absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-background/90 backdrop-blur ring-1 ring-border text-[11px] font-semibold transition-all opacity-0 group-hover:opacity-100",
              copied && "text-success opacity-100",
            )}
            aria-label="Copy shareable link"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        <h3 className="font-display text-base font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        {product.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.short_description}</p>
        )}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {product.tags.slice(0, 2).map((tag, i) => (
              <Badge key={i} variant="soft-accent" className="text-[10px] font-normal">#{tag}</Badge>
            ))}
            {product.tags.length > 2 && (
              <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">+{product.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </Spotlight>
  );
}
