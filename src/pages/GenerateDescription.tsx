import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Link2, ArrowRight, ArrowLeft, Check, Package, ImageIcon, FileText, Eye, Wand2,
} from "lucide-react";
import { MultiImageUploader } from "@/components/MultiImageUploader";
import { CreateProductLinkModal } from "@/components/CreateProductLinkModal";
import { Stepper } from "@/components/ui/stepper";
import { CopyButton, GradientText, PageHeader } from "@/components/ui/premium";

const STEPS = [
  { id: 1, label: "Upload Photos", icon: ImageIcon },
  { id: 2, label: "Product Details", icon: FileText },
  { id: 3, label: "Review & Edit", icon: Eye },
  { id: 4, label: "Done", icon: Check },
];

export default function GenerateDescription() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [productNote, setProductNote] = useState("");
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [images, setImages] = useState<{ original: string; enhanced: string | null }[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [savedProductId, setSavedProductId] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editShortDesc, setEditShortDesc] = useState("");
  const [editLongDesc, setEditLongDesc] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");

  const primaryImage = images[primaryIndex]
    ? images[primaryIndex].enhanced || images[primaryIndex].original
    : null;

  const handleImagesChange = (imgs: { original: string; enhanced: string | null }[], primary: number) => {
    setImages(imgs);
    setPrimaryIndex(primary);
  };

  const handleGenerate = async () => {
    if (!productNote.trim() && images.length === 0) {
      toast({ title: "Add product details", description: "Please describe your product or upload a photo", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type: 'description', productInfo: productNote, imageData: primaryImage }
      });
      if (error) throw error;
      setGeneratedContent(data.content);
      setEditTitle(data.content.title || "");
      setEditShortDesc(data.content.short_description || "");
      setEditLongDesc(data.content.long_description || "");
      setEditCategory(data.content.category || "");
      setEditTags((data.content.tags || []).join(", "));
      setStep(3);
      toast({ title: "Description generated" });
    } catch (error: any) {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!editTitle.trim()) {
      toast({ title: "Title required", description: "Give your product a name", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const parsedTags = editTags.split(",").map(t => t.trim()).filter(Boolean);
      const { data, error } = await supabase.from('products').insert({
        user_id: user.id,
        title: editTitle.trim(),
        short_description: editShortDesc.trim() || null,
        long_description: editLongDesc.trim() || null,
        category: editCategory.trim() || null,
        tags: parsedTags.length > 0 ? parsedTags : null,
        image_url: images[primaryIndex]?.original || null,
        enhanced_image_url: images[primaryIndex]?.enhanced || null,
        image_urls: images.map((i) => i.original),
        enhanced_image_urls: images.map((i) => i.enhanced || ""),
      }).select().single();
      if (error) throw error;
      setSavedProductId(data.id);
      setStep(4);
      toast({ title: "Product created", description: "Added to your Product Library" });
    } catch (error: any) {
      toast({ title: "Failed to create product", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setGeneratedContent(null);
    setSavedProductId(null);
    setProductNote("");
    setImages([]);
    setPrimaryIndex(0);
    setEditTitle(""); setEditShortDesc(""); setEditLongDesc("");
    setEditCategory(""); setEditTags("");
  };

  return (
    <div className="min-h-screen bg-background bg-block-print">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto">
          <PageHeader
            eyebrow="New listing"
            title={<>Turn one photo into a <GradientText>full listing</GradientText></>}
            subtitle="Upload photos, let AI write the words, and add it to your library — in seconds."
          />

          <div className="mb-10 animate-fade-up">
            <Stepper steps={STEPS} current={step} />
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-up">
              <Card className="rounded-3xl border-2 border-border/70 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    Product Photo
                  </CardTitle>
                  <CardDescription>Upload one or more product images — enhance each as needed, then continue.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MultiImageUploader onChange={handleImagesChange} />
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={images.length === 0} variant="gradient" size="lg" className="sheen">
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: form */}
          {step === 2 && !isGenerating && (
            <div className="space-y-6 animate-fade-up">
              {primaryImage && (
                <div className="rounded-3xl overflow-hidden bg-card border border-border/60 shadow-card aspect-[16/9] max-h-64">
                  <img src={primaryImage} alt="Product" className="w-full h-full object-cover" />
                </div>
              )}

              <Card className="rounded-3xl border-2 border-border/70 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <FileText className="w-5 h-5 text-primary" />
                    Tell us about your product
                  </CardTitle>
                  <CardDescription>Help AI generate better titles, descriptions & tags <span className="text-destructive">(required)</span></CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Textarea
                    placeholder="E.g., Handmade leather wallet, premium quality, vegetable-tanned leather…"
                    value={productNote}
                    onChange={(e) => setProductNote(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-shrink-0">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button onClick={handleGenerate} disabled={!productNote.trim()} variant="gradient" className="flex-1 sheen" size="lg">
                      <Sparkles className="w-4 h-4" /> Generate with AI <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: generating */}
          {step === 2 && isGenerating && (
            <Card className="rounded-3xl border-2 border-border/70 shadow-card animate-scale-in">
              <CardContent className="py-20 text-center">
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-marigold shadow-soft mb-6">
                  <Wand2 className="w-10 h-10 text-primary-foreground animate-bounce-soft" />
                  <span aria-hidden className="absolute inset-0 rounded-3xl ring-2 ring-primary/30 animate-pulse-ring" />
                  <span aria-hidden className="absolute -inset-2 rounded-3xl ring-2 ring-primary/20 animate-pulse-ring [animation-delay:0.5s]" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">
                  Crafting your <GradientText>perfect listing</GradientText>…
                </h2>
                <p className="text-muted-foreground">Generating title, description, tags & more.</p>
                <div className="mt-8 max-w-sm mx-auto space-y-2">
                  {["Reading your photo", "Writing a catchy title", "Adding SEO tags"].map((s, i) => (
                    <div key={s} className="flex items-center gap-2 text-sm text-muted-foreground" style={{ animationDelay: `${i * 300}ms` }}>
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success/15 text-success">
                        <Check className="w-3 h-3" />
                      </span>
                      {s}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3 */}
          {step === 3 && generatedContent && (
            <div className="space-y-6 animate-fade-up">
              {primaryImage && (
                <div className="rounded-3xl overflow-hidden bg-card border border-border/60 shadow-card aspect-[16/9] max-h-72">
                  <img src={primaryImage} alt="Product" className="w-full h-full object-cover" />
                </div>
              )}

              <Card className="rounded-3xl border-2 border-border/70 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <Eye className="w-5 h-5 text-primary" />
                    Review & Edit Your Product
                  </CardTitle>
                  <CardDescription>AI-generated content — feel free to tweak anything.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <EditField label="Product Title" value={editTitle}>
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-lg font-medium h-12" />
                  </EditField>
                  <EditField label="Short Description" value={editShortDesc}>
                    <Textarea value={editShortDesc} onChange={(e) => setEditShortDesc(e.target.value)} rows={2} className="resize-none" />
                  </EditField>
                  <EditField label="Full Description" value={editLongDesc}>
                    <Textarea value={editLongDesc} onChange={(e) => setEditLongDesc(e.target.value)} rows={5} className="resize-none" />
                  </EditField>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Category</Label>
                      <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Tags (comma-separated)</Label>
                      <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} />
                    </div>
                  </div>

                  {editTags && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {editTags.split(",").map((t) => t.trim()).filter(Boolean).map((tag, i) => (
                        <Badge key={i} variant="soft">#{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-shrink-0">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={handleCreateProduct} disabled={isSaving || !editTitle.trim()} variant="gradient" className="flex-1 sheen" size="lg">
                  {isSaving ? "Creating…" : (<><Package className="w-5 h-5" /> Add to Product Library</>)}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <Card className="rounded-3xl border-2 border-primary/30 shadow-elevated overflow-hidden animate-scale-in">
              <div aria-hidden className="h-1.5 bg-gradient-marigold" />
              <CardContent className="py-14 text-center space-y-7">
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-success/15 ring-1 ring-success/20">
                  <Check className="w-10 h-10 text-success" strokeWidth={2.5} />
                  <span aria-hidden className="absolute inset-0 rounded-3xl ring-2 ring-success/20 animate-pulse-ring" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-bold mb-2">
                    Product <GradientText>created</GradientText>
                  </h2>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">{editTitle}</strong> has been added to your Product Library.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Button onClick={() => setShowLinkModal(true)} variant="gradient" className="flex-1 sheen" size="lg">
                    <Link2 className="w-4 h-4" /> Create Shareable Link
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/generate/campaign")} className="flex-1" size="lg">
                    <Sparkles className="w-4 h-4" /> Create Campaign
                  </Button>
                </div>

                <div className="flex gap-3 justify-center pt-1">
                  <Button variant="ghost" onClick={() => navigate("/catalog")}>View Library</Button>
                  <Button variant="ghost" onClick={resetFlow}>Create Another</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {savedProductId && (
        <CreateProductLinkModal
          productId={savedProductId}
          productTitle={editTitle || "Product"}
          open={showLinkModal}
          onOpenChange={setShowLinkModal}
          onLinkCreated={() => navigate("/catalog")}
        />
      )}
    </div>
  );
}

function EditField({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">{label}</Label>
        <CopyButton text={value} />
      </div>
      {children}
    </div>
  );
}
