import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { ProductSelector } from "@/components/ProductSelector";
import { useProducts } from "@/hooks/useProducts";
import {
  Sparkles, Download, ShoppingBag, Loader2, ArrowLeft, PackageSearch, Wand2, Check,
} from "lucide-react";
import {
  PageHeader, GradientText, CopyButton, SectionEyebrow,
} from "@/components/ui/premium";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "amazon", label: "Amazon India", short: "AZ", tone: "from-primary to-tertiary" },
  { id: "flipkart", label: "Flipkart", short: "FK", tone: "from-accent to-foreground" },
  { id: "meesho", label: "Meesho", short: "MS", tone: "from-tertiary to-primary" },
];

type Listings = Record<string, Record<string, string | string[]>>;

function csvEscape(value: string) {
  const v = value.replace(/"/g, '""');
  return /[",\n]/.test(v) ? `"${v}"` : v;
}
function downloadCsv(platform: string, fields: string[], data: Record<string, string | string[]>) {
  const headers = fields.join(",");
  const row = fields.map((f) => {
    const v = data[f];
    if (Array.isArray(v)) return csvEscape(v.join(" | "));
    return csvEscape(String(v ?? ""));
  }).join(",");
  const blob = new Blob([headers + "\n" + row], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${platform}-listing-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EcommerceListing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products, isLoading: productsLoading, getProductImage } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string>("none");
  const [images, setImages] = useState<{ original: string; enhanced: string | null }[]>([]);
  const [imageKey, setImageKey] = useState(0);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [brandName, setBrandName] = useState("");
  const [productInfo, setProductInfo] = useState("");
  const [features, setFeatures] = useState("");
  const [selected, setSelected] = useState<string[]>(["amazon", "flipkart", "meesho"]);
  const [isLoading, setIsLoading] = useState(false);
  const [listings, setListings] = useState<Listings | null>(null);
  const [fields, setFields] = useState<Record<string, string[]>>({});

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    if (id === "none") return;
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const originals = (p.image_urls && p.image_urls.length > 0) ? p.image_urls : (p.image_url ? [p.image_url] : []);
    const enhanced = (p.enhanced_image_urls && p.enhanced_image_urls.length > 0) ? p.enhanced_image_urls : (p.enhanced_image_url ? [p.enhanced_image_url] : []);
    const imgs = originals.map((o, i) => ({ original: o, enhanced: enhanced[i] || null }));
    setImages(imgs);
    setPrimaryIndex(0);
    setImageKey((k) => k + 1);
    const info = [p.title, p.long_description || p.short_description].filter(Boolean).join("\n\n");
    if (info) setProductInfo(info);
    const feat = [
      p.category ? `Category: ${p.category}` : "",
      p.tags && p.tags.length ? `Tags: ${p.tags.join(", ")}` : "",
    ].filter(Boolean).join("\n");
    if (feat) setFeatures(feat);
    toast({ title: `Loaded "${p.title}" from your library` });
  };

  const togglePlatform = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const primaryImage = images[primaryIndex] ? images[primaryIndex].enhanced || images[primaryIndex].original : null;

  const handleGenerate = async () => {
    if (!brandName.trim()) { toast({ title: "Brand name required", variant: "destructive" }); return; }
    if (!productInfo.trim() || !features.trim()) { toast({ title: "Missing info", description: "Add description & features", variant: "destructive" }); return; }
    if (selected.length === 0) { toast({ title: "Pick at least one marketplace", variant: "destructive" }); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ecommerce-listing", {
        body: { platforms: selected, brandName: brandName.trim(), productInfo, features, productImageUrl: primaryImage },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setListings(data.listings);
      setFields(data.fields);
      toast({ title: "Listings generated" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyAll = (platform: string) => {
    const data = listings?.[platform];
    if (!data) return;
    const text = Object.entries(data).map(([k, v]) =>
      `${k.toUpperCase()}\n${Array.isArray(v) ? v.map((x) => `• ${x}`).join("\n") : v}`,
    ).join("\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: `${platform} listing copied` });
  };

  return (
    <div className="min-h-screen bg-background bg-block-print">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4 inline-flex">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </div>

          <PageHeader
            eyebrow="Ecommerce studio"
            title={<>Sell on <GradientText>Amazon, Flipkart & Meesho</GradientText></>}
            subtitle="Upload photos, describe your product, and get SEO-optimized listings + downloadable CSV exports."
          />

          <div className="space-y-6">
            <Card className="rounded-3xl border-2 border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <PackageSearch className="w-5 h-5 text-primary" /> Use a product from your library
                </CardTitle>
                <CardDescription>Optional — pre-fills photos and description.</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductSelector
                  products={products}
                  isLoading={productsLoading}
                  value={selectedProductId}
                  onValueChange={handleSelectProduct}
                  placeholder="Choose a product (or upload fresh below)"
                  getProductImage={getProductImage}
                />
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="font-display">1. Product Photos</CardTitle>
                <CardDescription>Upload multiple — enhance any/all, pick the best as primary.</CardDescription>
              </CardHeader>
              <CardContent>
                <MultiImageUploader
                  key={imageKey}
                  initialImages={images}
                  onChange={(imgs, primary) => { setImages(imgs); setPrimaryIndex(primary); }}
                />
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="font-display">2. Product Details</CardTitle>
                <CardDescription>The more detail, the better the SEO listing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand name <span className="text-destructive">*</span></Label>
                  <Input id="brand" placeholder="E.g., Mitti & Co." value={brandName} onChange={(e) => setBrandName(e.target.value.slice(0, 80))} maxLength={80} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="info">Detailed description <span className="text-destructive">*</span></Label>
                  <Textarea id="info" rows={4} placeholder="E.g., Handmade vegetable-tanned leather bifold wallet…" value={productInfo} onChange={(e) => setProductInfo(e.target.value)} className="resize-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="features">Key features & specs <span className="text-destructive">*</span></Label>
                  <Textarea id="features" rows={4} placeholder="Brand: ___, Material: ___, Color: ___, Size: ___, Country of origin: India…" value={features} onChange={(e) => setFeatures(e.target.value)} className="resize-none" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="font-display">3. Choose Marketplaces</CardTitle>
                <CardDescription>Each gets a tailored listing — toggle as you like.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-3">
                  {PLATFORMS.map((p) => {
                    const active = selected.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        className={cn(
                          "relative rounded-2xl border-2 p-4 transition-all duration-300 press-shrink overflow-hidden text-left",
                          active ? "border-primary shadow-soft bg-primary/5" : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn("inline-flex items-center justify-center w-11 h-11 rounded-2xl text-white text-sm font-bold shadow-soft bg-gradient-to-br", p.tone)}>
                            {p.short}
                          </span>
                          {active && <Check className="w-5 h-5 text-primary" strokeWidth={2.5} />}
                        </div>
                        <p className="mt-3 font-semibold text-sm">{p.label}</p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Button variant="gradient" size="xl" className="w-full sheen" onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Generating SEO listings…</>) : (<><Sparkles className="w-4 h-4" /> Generate Listings</>)}
            </Button>

            {listings && (
              <div className="space-y-6 pt-4 animate-fade-up">
                <SectionEyebrow>Results</SectionEyebrow>
                {Object.keys(listings).map((platform) => {
                  const data = listings[platform];
                  const platMeta = PLATFORMS.find((x) => x.id === platform);
                  return (
                    <Card key={platform} className="rounded-3xl border-2 border-border/70 shadow-card overflow-hidden">
                      <div aria-hidden className={cn("h-1.5 bg-gradient-to-r", platMeta?.tone)} />
                      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                        <div className="flex items-center gap-3">
                          <span className={cn("inline-flex items-center justify-center w-11 h-11 rounded-2xl text-white text-sm font-bold shadow-soft bg-gradient-to-br", platMeta?.tone)}>
                            {platMeta?.short}
                          </span>
                          <div>
                            <CardTitle className="font-display text-xl">{platMeta?.label || platform}</CardTitle>
                            <CardDescription>SEO-optimized listing</CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => copyAll(platform)}>
                            <Sparkles className="w-3.5 h-3.5" /> Copy all
                          </Button>
                          <Button variant="gradient" size="sm" className="sheen" onClick={() => downloadCsv(platform, fields[platform] || Object.keys(data), data)}>
                            <Download className="w-3 h-3" /> CSV
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {Object.entries(data).map(([key, value]) => (
                          <div key={key} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                {key.replace(/_/g, " ")}
                              </Label>
                              <CopyButton text={Array.isArray(value) ? value.join("\n") : String(value)} />
                            </div>
                            {Array.isArray(value) ? (
                              <ul className="rounded-2xl bg-muted/40 border border-border/60 p-4 list-disc pl-8 text-sm space-y-1.5">
                                {value.map((v, i) => <li key={i}>{v}</li>)}
                              </ul>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap rounded-2xl bg-muted/40 border border-border/60 p-4 leading-relaxed">{value}</p>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
