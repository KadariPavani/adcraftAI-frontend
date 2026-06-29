import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Sparkles, Layers, Copy, Trash2, ExternalLink, FolderOpen, Package, Search, X,
} from "lucide-react";
import { QuickAddProductModal } from "@/components/QuickAddProductModal";
import { CreateCollectionModal } from "@/components/CreateCollectionModal";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PageHeader, EmptyState, ShimmerGrid, SectionEyebrow, Spotlight, GradientText,
} from "@/components/ui/premium";

interface ProductLink { id: string; slug: string; }

interface CatalogProduct {
  id: string;
  title: string;
  short_description: string | null;
  long_description: string | null;
  category: string | null;
  tags: string[] | null;
  image_url: string | null;
  enhanced_image_url: string | null;
  image_urls: string[] | null;
  enhanced_image_urls: string[] | null;
  created_at: string | null;
  product_links: ProductLink[];
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
  product_count: number;
}

export default function Catalog() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refetch } = useProducts();
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "linked" | "unlinked">("all");

  const fetchCatalogProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data, error } = await supabase
        .from('products')
        .select(`id, title, short_description, long_description, category, tags, image_url, enhanced_image_url, image_urls, enhanced_image_urls, created_at, product_links (id, slug)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCatalogProducts((data as unknown as CatalogProduct[]) || []);
    } catch (error: any) {
      toast({ title: "Error loading products", description: error.message, variant: "destructive" });
    } finally {
      setIsCatalogLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('product_collections')
        .select('id, name, slug, description, is_active, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const collectionsWithCounts: Collection[] = [];
      for (const coll of data || []) {
        const { count } = await supabase
          .from('collection_products')
          .select('id', { count: 'exact', head: true })
          .eq('collection_id', coll.id);
        collectionsWithCounts.push({ ...coll, product_count: count || 0 });
      }
      setCollections(collectionsWithCounts);
    } catch (error: any) {
      console.error('Error loading collections:', error);
    }
  };

  useEffect(() => {
    fetchCatalogProducts();
    fetchCollections();
  }, []);

  const handleDeleteCollection = async (id: string) => {
    try {
      const { error } = await supabase.from('product_collections').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Collection deleted" });
      fetchCollections();
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  };

  const handleProductCreated = () => {
    fetchCatalogProducts();
    fetchCollections();
    refetch();
  };

  const copyCollectionLink = (slug: string) => {
    const url = `${window.location.origin}/c/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Collection link copied" });
  };

  // Apply filters
  const filteredProducts = catalogProducts.filter((p) => {
    if (filter === "linked" && p.product_links.length === 0) return false;
    if (filter === "unlinked" && p.product_links.length > 0) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.short_description || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background bg-block-print">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            eyebrow="Library"
            title={<>Your <GradientText>products</GradientText></>}
            subtitle="Everything you've created — use across listings, campaigns, and storefronts."
            actions={
              <>
                <Button variant="outline" size="lg" onClick={() => setShowCollectionModal(true)}>
                  <Layers className="w-4 h-4" /> New Collection
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="gradient" size="lg" className="sheen">
                      <Plus className="w-4 h-4" /> Add Product
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => setShowQuickAddModal(true)} className="cursor-pointer">
                      <Plus className="w-4 h-4 mr-2" /> Quick Add
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/generate/description")} className="cursor-pointer">
                      <Sparkles className="w-4 h-4 mr-2" /> AI-Powered
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            }
          />

          {/* Collections row */}
          {collections.length > 0 && (
            <section className="mb-10">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <SectionEyebrow>Storefronts</SectionEyebrow>
                  <h2 className="font-display text-xl font-bold">Collections</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowCollectionModal(true)}>
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {collections.map((coll) => (
                  <Spotlight key={coll.id} className="group rounded-2xl bg-card border border-border/70 shadow-card hover-lift overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-marigold shadow-soft shrink-0">
                          <FolderOpen className="w-5 h-5 text-primary-foreground" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-base font-bold truncate">{coll.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {coll.product_count} product{coll.product_count !== 1 ? 's' : ''}
                          </p>
                          {coll.description && (
                            <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">{coll.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-1.5">
                        <Button variant="soft" size="sm" className="flex-1 h-8" onClick={() => copyCollectionLink(coll.slug)}>
                          <Copy className="w-3.5 h-3.5" /> Copy link
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => window.open(`/c/${coll.slug}`, "_blank")}>
                          <ExternalLink className="w-3.5 h-3.5" /> Open
                        </Button>
                        <Button variant="ghost" size="iconSm" onClick={() => handleDeleteCollection(coll.id)} aria-label="Delete" className="text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Spotlight>
                ))}
              </div>
            </section>
          )}

          {/* Products section */}
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div>
                <SectionEyebrow>Products</SectionEyebrow>
                <h2 className="font-display text-xl font-bold">
                  {catalogProducts.length} {catalogProducts.length === 1 ? "item" : "items"}
                </h2>
              </div>

              {catalogProducts.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search products…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-9 pr-9 h-10 w-56"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter chips */}
                  <div className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-muted/60 ring-1 ring-border/60">
                    {([
                      { v: "all", l: "All" },
                      { v: "linked", l: "Linked" },
                      { v: "unlinked", l: "No link" },
                    ] as const).map((f) => (
                      <button
                        key={f.v}
                        type="button"
                        onClick={() => setFilter(f.v)}
                        className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                          filter === f.v
                            ? "bg-card text-foreground shadow-sm-soft"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {f.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isCatalogLoading ? (
              <ShimmerGrid count={6} />
            ) : catalogProducts.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No products yet"
                description="Take a photo, let AI write the words, and your library starts here."
                action={
                  <Button variant="gradient" size="lg" className="sheen" onClick={() => navigate("/generate/description")}>
                    <Sparkles className="w-4 h-4" /> Create Your First Product
                  </Button>
                }
              />
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border bg-card/60 py-16 text-center">
                <p className="text-muted-foreground">No products match your filter.</p>
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setQuery(""); setFilter("all"); }}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <QuickAddProductModal open={showQuickAddModal} onOpenChange={setShowQuickAddModal} onProductCreated={handleProductCreated} />
      <CreateCollectionModal open={showCollectionModal} onOpenChange={setShowCollectionModal} onCollectionCreated={handleProductCreated} />
    </div>
  );
}
