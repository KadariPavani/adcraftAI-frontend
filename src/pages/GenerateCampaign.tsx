import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Package, Send, Wand2, Image as ImageIcon, Download,
  Instagram, MessageCircle, Facebook, Target, Megaphone, Check,
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { ProductSelector } from "@/components/ProductSelector";
import { CopyButton, GradientText, PageHeader } from "@/components/ui/premium";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, tone: "bg-primary/10 text-primary ring-primary/20" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, tone: "bg-success/10 text-success ring-success/20" },
  { id: "facebook", label: "Facebook", icon: Facebook, tone: "bg-accent/10 text-accent ring-accent/20" },
];

const GOALS = [
  { id: "awareness", label: "Awareness", desc: "Reach new audiences" },
  { id: "engagement", label: "Engagement", desc: "Get likes & comments" },
  { id: "orders", label: "WhatsApp Orders", desc: "Drive direct sales" },
  { id: "sale", label: "Sale / Promo", desc: "Push a discount" },
];

export default function GenerateCampaign() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products, isLoading: isLoadingProducts, getProductImage } = useProducts();
  const [isGenerating, setIsGenerating] = useState(false);
  const [productInfo, setProductInfo] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [selectedGoal, setSelectedGoal] = useState("engagement");
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    if (productId === "none") { setProductInfo(""); return; }
    const product = products.find((p) => p.id === productId);
    if (product) {
      setProductInfo(`${product.title}${product.short_description ? `: ${product.short_description}` : ""}`);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedProductImage = selectedProduct?.enhanced_image_url || selectedProduct?.image_url || null;

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleGenerate = async () => {
    if (!productInfo.trim()) {
      toast({ title: "Add product details", description: "Please describe your product or select one", variant: "destructive" });
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast({ title: "Select platforms", description: "Choose at least one platform", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          type: "campaign",
          productInfo,
          goal: selectedGoal,
          platforms: selectedPlatforms,
          productImageUrl: selectedProductImage,
        },
      });
      if (error) throw error;
      setGeneratedContent(data.content);
      setGeneratedImages(data.images || []);
      toast({ title: "Campaign created", description: `Your marketing content${data.images?.length ? " and images are" : " is"} ready` });
    } catch (error: any) {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-block-print">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto">
          <PageHeader
            eyebrow="Marketing studio"
            title={<>Make a <GradientText>scroll-stopping</GradientText> campaign</>}
            subtitle="Pick a product, your goal, and the platforms. We'll write captions, hashtags & WhatsApp messages."
          />

          <div className="space-y-6">
            <Card className="rounded-3xl border-2 border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Megaphone className="w-5 h-5 text-primary" />
                  Campaign Details
                </CardTitle>
                <CardDescription>Select from your library or describe any product.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-7">
                <div>
                  <Label className="mb-2 inline-flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" /> Pick from your library <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <ProductSelector
                    products={products}
                    isLoading={isLoadingProducts}
                    value={selectedProductId}
                    onValueChange={handleProductSelect}
                    placeholder="Choose a product or type below"
                    getProductImage={getProductImage}
                  />
                  {products.length === 0 && !isLoadingProducts && (
                    <p className="text-xs text-muted-foreground mt-2">No products yet — you can still create a campaign by describing the product below.</p>
                  )}
                  {selectedProduct && selectedProductImage && (
                    <div className="mt-3 flex items-center gap-3 p-3 rounded-2xl bg-muted/60 border border-border/60 animate-fade-up">
                      <img src={selectedProductImage} alt={selectedProduct.title} className="w-16 h-16 rounded-xl object-cover ring-1 ring-border" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{selectedProduct.title}</p>
                        {selectedProduct.short_description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{selectedProduct.short_description}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-dashed" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-card px-3 text-muted-foreground">
                    {selectedProductId && selectedProductId !== "none" ? "Edit product info" : "Or describe your product"}
                  </span></div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-info">Product Information</Label>
                  <Textarea
                    id="product-info"
                    placeholder="E.g., Handmade leather wallet, premium quality, perfect gift…"
                    value={productInfo}
                    onChange={(e) => setProductInfo(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="inline-flex items-center gap-2"><Target className="w-4 h-4 text-accent" /> Campaign Goal</Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {GOALS.map((g) => {
                      const active = selectedGoal === g.id;
                      return (
                        <button
                          type="button"
                          key={g.id}
                          onClick={() => setSelectedGoal(g.id)}
                          className={cn(
                            "group text-left rounded-2xl border-2 p-4 transition-all duration-300 press-shrink",
                            active
                              ? "border-primary bg-primary/5 shadow-soft"
                              : "border-border bg-card hover:border-primary/40 hover:bg-muted/40",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">{g.label}</p>
                            {active && <Check className="w-4 h-4 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Select Platforms</Label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {PLATFORMS.map((p) => {
                      const Icon = p.icon;
                      const active = selectedPlatforms.includes(p.id);
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => togglePlatform(p.id)}
                          className={cn(
                            "group rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-all duration-300 press-shrink",
                            active
                              ? "border-primary bg-primary/5 shadow-soft"
                              : "border-border bg-card hover:border-primary/40 hover:bg-muted/40",
                          )}
                        >
                          <span className={cn("inline-flex items-center justify-center w-10 h-10 rounded-xl ring-1", p.tone)}>
                            <Icon className="w-5 h-5" />
                          </span>
                          <span className="text-xs font-medium">{p.label}</span>
                          {active && <span className="inline-flex items-center gap-1 text-[10px] text-primary"><Check className="w-3 h-3" /> selected</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button onClick={handleGenerate} disabled={isGenerating} variant="gradient" className="w-full sheen" size="lg">
                  {isGenerating ? (<><Wand2 className="w-4 h-4 animate-bounce-soft" /> Generating campaign…</>) : (<><Sparkles className="w-4 h-4" /> Generate Campaign</>)}
                </Button>
              </CardContent>
            </Card>

            {generatedContent && (
              <Card className="rounded-3xl border-2 border-primary/30 shadow-elevated overflow-hidden animate-scale-in">
                <div aria-hidden className="h-1.5 bg-gradient-marigold" />
                <CardHeader>
                  <CardTitle className="font-display">Your campaign content</CardTitle>
                  <CardDescription>Copy and use this for your marketing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-7">
                  {generatedImages.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold mb-3 inline-flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-primary" /> Campaign Creatives
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generatedImages.map((src, i) => (
                          <div key={i} className="group relative rounded-2xl overflow-hidden border border-border/60 shadow-card">
                            <img src={src} alt={`Creative ${i + 1}`} className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3">
                              <Button
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = src;
                                  link.download = `campaign-image-${i + 1}.png`;
                                  link.click();
                                  toast({ title: "Download started" });
                                }}
                              >
                                <Download className="w-4 h-4" /> Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base font-semibold">Campaign Caption</Label>
                      <CopyButton text={generatedContent.caption} label="Copy" />
                    </div>
                    <div className="rounded-2xl bg-muted/40 border border-border/60 p-4 text-sm leading-relaxed whitespace-pre-line">
                      {generatedContent.caption}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-2 block">Hashtags</Label>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.hashtags?.map((tag: string, i: number) => (
                        <button key={i} onClick={() => { navigator.clipboard.writeText(`#${tag}`); toast({ title: `Copied #${tag}` }); }}>
                          <Badge variant="soft" className="hover:bg-primary/20 transition-colors cursor-pointer">#{tag}</Badge>
                        </button>
                      ))}
                    </div>
                  </div>

                  {generatedContent.whatsapp_message && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-base font-semibold inline-flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-success" /> WhatsApp Message
                        </Label>
                        <CopyButton text={generatedContent.whatsapp_message} label="Copy" />
                      </div>
                      <div className="rounded-2xl bg-success/5 border border-success/20 p-4 text-sm leading-relaxed">
                        {generatedContent.whatsapp_message}
                      </div>
                    </div>
                  )}

                  {generatedContent.slogan && (
                    <div className="rounded-2xl bg-gradient-marigold p-5 text-center">
                      <Label className="text-xs uppercase tracking-widest text-primary-foreground/80">Campaign Slogan</Label>
                      <p className="font-display text-2xl font-bold text-primary-foreground mt-1">{generatedContent.slogan}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="gradient"
                      className="flex-1 sheen"
                      size="lg"
                      onClick={() => navigate("/social/schedule", {
                        state: {
                          prefillCaption: `${generatedContent.caption}${generatedContent.hashtags?.length ? "\n\n" + generatedContent.hashtags.map((t: string) => `#${t}`).join(" ") : ""}`,
                          prefillHashtags: generatedContent.hashtags?.map((t: string) => `#${t}`).join(" ") || "",
                          prefillPlatforms: selectedPlatforms,
                          prefillGoal: selectedGoal,
                          prefillImages: generatedImages,
                          productId: selectedProductId !== "none" ? selectedProductId : undefined,
                          productTitle: selectedProduct?.title,
                          productImage: selectedProductImage,
                          linkType: selectedProductId && selectedProductId !== "none" ? "product" : "none",
                        },
                      })}
                    >
                      <Send className="w-4 h-4" /> Schedule This Post
                    </Button>
                    <Button variant="outline" onClick={() => setGeneratedContent(null)} className="flex-1" size="lg">
                      <Sparkles className="w-4 h-4" /> Generate Another
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
