import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { ProductSelector } from "@/components/ProductSelector";
import {
  Calendar, Clock, Link2, Send, Sparkles, Globe, Tag, ArrowLeft, Check,
  Instagram, Facebook, MessageCircle, Target, X,
} from "lucide-react";
import { PageHeader, GradientText } from "@/components/ui/premium";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", Icon: Instagram, tone: "text-primary bg-primary/10 ring-primary/20" },
  { id: "facebook", label: "Facebook", Icon: Facebook, tone: "text-accent bg-accent/10 ring-accent/20" },
  { id: "whatsapp", label: "WhatsApp", Icon: MessageCircle, tone: "text-success bg-success/10 ring-success/20" },
];

const GOALS = [
  { id: "awareness", label: "Brand Awareness" },
  { id: "engagement", label: "Engagement" },
  { id: "traffic", label: "Drive Traffic" },
  { id: "sales", label: "Sales / Promo" },
];

interface Collection { id: string; name: string; slug: string; }

export default function SchedulePost() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { products, isLoading: isLoadingProducts, getProductImage } = useProducts();

  const prefill = (location.state as any) || {};

  const [caption, setCaption] = useState(prefill.prefillCaption || "");
  const [hashtags, setHashtags] = useState(prefill.prefillHashtags || "");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(prefill.prefillPlatforms || []);
  const [selectedGoal, setSelectedGoal] = useState(prefill.prefillGoal || "engagement");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [linkType, setLinkType] = useState(prefill.linkType || "none");
  const [customUrl, setCustomUrl] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(prefill.productId || "");
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(prefill.prefillImages || (prefill.productImage ? [prefill.productImage] : []));

  useEffect(() => { fetchCollections(); }, []);

  useEffect(() => {
    if (selectedPlatforms.length > 0 && !utmSource) setUtmSource(selectedPlatforms[0]);
    if (selectedPlatforms.length > 0 && !utmMedium) setUtmMedium("social");
  }, [selectedPlatforms]);

  const fetchCollections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("product_collections").select("id, name, slug").eq("user_id", user.id).eq("is_active", true);
    setCollections(data || []);
  };

  const togglePlatform = (id: string) =>
    setSelectedPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const buildFinalUrl = () => {
    let baseUrl = "";
    if (linkType === "collection" && selectedCollectionId) {
      const coll = collections.find((c) => c.id === selectedCollectionId);
      if (coll) baseUrl = `${window.location.origin}/c/${coll.slug}`;
    } else if (linkType === "product" && selectedProductId) {
      baseUrl = `${window.location.origin}/p/${selectedProductId}`;
    } else if (linkType === "custom" && customUrl) {
      baseUrl = customUrl;
    }
    if (!baseUrl) return "";
    const params = new URLSearchParams();
    if (utmSource) params.set("utm_source", utmSource);
    if (utmMedium) params.set("utm_medium", utmMedium);
    if (utmCampaign) params.set("utm_campaign", utmCampaign);
    if (utmContent) params.set("utm_content", utmContent);
    const paramStr = params.toString();
    return paramStr ? `${baseUrl}?${paramStr}` : baseUrl;
  };

  const handleSave = async (publish = false) => {
    if (!caption.trim()) { toast({ title: "Caption required", variant: "destructive" }); return; }
    if (selectedPlatforms.length === 0) { toast({ title: "Select at least one platform", variant: "destructive" }); return; }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const scheduledFor = scheduledDate && scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : null;
      const hashtagArray = hashtags.split(/[\s,#]+/).filter(Boolean).map((t: string) => t.replace(/^#/, ""));
      const finalUrl = buildFinalUrl();
      const status = publish ? "scheduled" : "draft";
      const { error } = await supabase.from("scheduled_posts").insert({
        user_id: user.id,
        caption,
        hashtags: hashtagArray,
        platforms: selectedPlatforms,
        goal: selectedGoal,
        status,
        scheduled_for: scheduledFor,
        link_type: linkType,
        link_url: finalUrl || null,
        collection_id: linkType === "collection" ? selectedCollectionId || null : null,
        product_id: linkType === "product" ? selectedProductId || null : null,
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
        utm_content: utmContent || null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      });
      if (error) throw error;
      toast({ title: publish ? "Post scheduled" : "Draft saved", description: publish ? `Scheduled for ${selectedPlatforms.join(", ")}` : "Edit and schedule later" });
      navigate("/social/dashboard");
    } catch (error: any) {
      toast({ title: "Error saving post", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const finalUrl = buildFinalUrl();

  return (
    <div className="min-h-screen bg-background bg-block-print">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/social/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Social Hub
          </Button>

          <PageHeader
            eyebrow="Schedule"
            title={<>Plan a <GradientText>scroll-stopping</GradientText> post</>}
            subtitle="Write once. Publish to Instagram, Facebook and WhatsApp."
          />

          <div className="space-y-6">
            <Card className="rounded-3xl border-2 border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Post Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {imageUrls.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Attached Images</Label>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {imageUrls.map((url, i) => (
                        <div key={i} className="relative shrink-0 group">
                          <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover ring-1 ring-border" />
                          <button
                            type="button"
                            onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center shadow-sm-soft opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {prefill.productTitle && (
                  <div className="p-3 rounded-2xl bg-primary/5 border border-primary/15 flex items-center gap-3">
                    {prefill.productImage && (
                      <img src={prefill.productImage} alt="" className="w-12 h-12 rounded-lg object-cover ring-1 ring-border" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Creating post for: {prefill.productTitle}</p>
                      {prefill.productDescription && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{prefill.productDescription}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea id="caption" placeholder="Write your post caption…" value={caption} onChange={(e) => setCaption(e.target.value)} rows={5} className="resize-none" />
                  <p className="text-xs text-muted-foreground tabular-nums">{caption.length} characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hashtags" className="inline-flex items-center gap-1.5"><Tag className="w-4 h-4 text-primary" /> Hashtags</Label>
                  <Input id="hashtags" placeholder="#fashion #sale #trending" value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Platforms & Goal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Select Platforms</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {PLATFORMS.map((p) => {
                      const active = selectedPlatforms.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePlatform(p.id)}
                          className={cn(
                            "group rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-all duration-300 press-shrink",
                            active ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card hover:border-primary/40",
                          )}
                        >
                          <span className={cn("inline-flex items-center justify-center w-10 h-10 rounded-xl ring-1", p.tone)}>
                            <p.Icon className="w-5 h-5" />
                          </span>
                          <span className="text-xs font-medium">{p.label}</span>
                          {active && <span className="inline-flex items-center gap-1 text-[10px] text-primary"><Check className="w-3 h-3" /> selected</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="inline-flex items-center gap-2"><Target className="w-4 h-4 text-accent" /> Campaign Goal</Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {GOALS.map((g) => {
                      const active = selectedGoal === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedGoal(g.id)}
                          className={cn(
                            "rounded-2xl border-2 p-3.5 text-left transition-all press-shrink",
                            active ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card hover:border-primary/40",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">{g.label}</p>
                            {active && <Check className="w-4 h-4 text-primary" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2"><Link2 className="w-5 h-5 text-primary" /> Link & Tracking</CardTitle>
                <CardDescription>Attach a link and UTM parameters to track performance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Link Type</Label>
                  <Select value={linkType} onValueChange={setLinkType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Link</SelectItem>
                      <SelectItem value="collection">Collection Storefront</SelectItem>
                      <SelectItem value="product">Single Product</SelectItem>
                      <SelectItem value="custom">Custom URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {linkType === "collection" && (
                  <div className="space-y-2">
                    <Label>Select Collection</Label>
                    <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                      <SelectTrigger><SelectValue placeholder="Choose a collection" /></SelectTrigger>
                      <SelectContent>
                        {collections.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {linkType === "product" && (
                  <div className="space-y-2">
                    <Label>Select Product</Label>
                    <ProductSelector
                      products={products}
                      isLoading={isLoadingProducts}
                      value={selectedProductId}
                      onValueChange={setSelectedProductId}
                      placeholder="Choose a product"
                      getProductImage={getProductImage}
                    />
                  </div>
                )}

                {linkType === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-url">Custom URL</Label>
                    <Input id="custom-url" placeholder="https://your-store.com/product" value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} />
                  </div>
                )}

                {linkType !== "none" && (
                  <>
                    <div className="pt-2 border-t border-border/60">
                      <Label className="text-sm font-semibold mb-3 block">UTM Parameters</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <UtmField id="utm-source" label="Source" placeholder="instagram" value={utmSource} onChange={setUtmSource} />
                        <UtmField id="utm-medium" label="Medium" placeholder="social" value={utmMedium} onChange={setUtmMedium} />
                        <UtmField id="utm-campaign" label="Campaign" placeholder="summer-sale" value={utmCampaign} onChange={setUtmCampaign} />
                        <UtmField id="utm-content" label="Content" placeholder="post-1" value={utmContent} onChange={setUtmContent} />
                      </div>
                    </div>
                    {finalUrl && (
                      <div className="p-3 rounded-2xl bg-muted/50 border border-border/60">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Preview URL</Label>
                        <p className="text-xs font-mono mt-1 break-all text-foreground/80">{finalUrl}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-2 border-border/70 shadow-card">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> Time</Label>
                    <Input id="time" type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => handleSave(false)} disabled={isSaving}>
                Save as Draft
              </Button>
              <Button variant="gradient" size="lg" className="flex-1 sheen" onClick={() => handleSave(true)} disabled={isSaving}>
                <Send className="w-4 h-4" /> {scheduledDate ? "Schedule Post" : "Publish Now"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function UtmField({ id, label, placeholder, value, onChange }: { id: string; label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input id={id} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
