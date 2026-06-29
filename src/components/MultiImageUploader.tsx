import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Sparkles, Loader2, X, Star, RotateCcw } from "lucide-react";

export interface ImageSlot {
  original: string;          // base64 or URL
  enhanced: string | null;   // base64 or URL
  isEnhancing: boolean;
  prompt: string;
}

interface Props {
  initialImages?: { original: string; enhanced: string | null }[];
  onChange: (images: { original: string; enhanced: string | null }[], primaryIndex: number) => void;
  className?: string;
}

export function MultiImageUploader({ initialImages, onChange, className = "" }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<ImageSlot[]>(
    (initialImages || []).map((i) => ({ original: i.original, enhanced: i.enhanced, isEnhancing: false, prompt: "" })),
  );
  const [primaryIndex, setPrimaryIndex] = useState(0);

  useEffect(() => {
    onChange(
      slots.map((s) => ({ original: s.original, enhanced: s.enhanced })),
      Math.min(primaryIndex, Math.max(0, slots.length - 1)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, primaryIndex]);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newSlots: ImageSlot[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const base64 = await fileToBase64(file);
      newSlots.push({ original: base64, enhanced: null, isEnhancing: false, prompt: "" });
    }
    setSlots((prev) => [...prev, ...newSlots]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const removeSlot = (i: number) => {
    setSlots((prev) => prev.filter((_, idx) => idx !== i));
    if (primaryIndex >= i && primaryIndex > 0) setPrimaryIndex((p) => p - 1);
  };

  const setPrompt = (i: number, value: string) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, prompt: value } : s)));

  const enhanceSlot = async (i: number) => {
    const slot = slots[i];
    const input = slot.enhanced || slot.original;
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, isEnhancing: true } : s)));
    try {
      const { data, error } = await supabase.functions.invoke("enhance-image", {
        body: { imageData: input, customPrompt: slot.prompt.trim() || undefined },
      });
      if (error) throw error;
      if (data?.enhancedImage) {
        setSlots((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, enhanced: data.enhancedImage, isEnhancing: false, prompt: "" } : s)),
        );
        toast({ title: `Image ${i + 1} enhanced` });
      }
    } catch (err: any) {
      setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, isEnhancing: false } : s)));
      toast({ title: "Enhancement failed", description: err.message, variant: "destructive" });
    }
  };

  const resetSlot = (i: number) => {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, enhanced: null } : s)));
  };

  return (
    <div className={className}>
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />

      <Card
        className="border-2 border-dashed border-primary/30 hover:border-primary/50 cursor-pointer transition-all mb-4"
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-6">
          <Upload className="w-8 h-8 text-primary/60 mb-2" />
          <p className="font-medium">{slots.length === 0 ? "Upload Product Photos" : "Add More Photos"}</p>
          <p className="text-xs text-muted-foreground">Select multiple images — JPEG, PNG, WebP</p>
        </CardContent>
      </Card>

      {slots.length > 0 && (
        <div className="space-y-4">
          {slots.map((slot, i) => {
            const display = slot.enhanced || slot.original;
            return (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Image {i + 1}</Badge>
                      {slot.enhanced && <Badge className="bg-primary/20 text-primary">Enhanced</Badge>}
                      {primaryIndex === i && (
                        <Badge className="bg-success/20 text-success-foreground">
                          <Star className="w-3 h-3 mr-1" /> Primary
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {primaryIndex !== i && (
                        <Button variant="ghost" size="sm" onClick={() => setPrimaryIndex(i)}>
                          <Star className="w-3 h-3 mr-1" /> Set primary
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeSlot(i)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Original</p>
                      <div className="aspect-square rounded-md overflow-hidden bg-secondary">
                        <img src={slot.original} className="w-full h-full object-cover" alt="" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Enhanced</p>
                      <div className="aspect-square rounded-md overflow-hidden bg-secondary flex items-center justify-center">
                        {slot.enhanced ? (
                          <img src={slot.enhanced} className="w-full h-full object-cover" alt="" />
                        ) : slot.isEnhancing ? (
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        ) : (
                          <Sparkles className="w-6 h-6 text-primary/40" />
                        )}
                      </div>
                    </div>
                  </div>

                  <Input
                    placeholder="Optional prompt: e.g., white background, brighten…"
                    value={slot.prompt}
                    onChange={(e) => setPrompt(i, e.target.value)}
                    className="text-xs h-9"
                    disabled={slot.isEnhancing}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => enhanceSlot(i)} disabled={slot.isEnhancing} size="sm" className="flex-1">
                      {slot.isEnhancing ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Enhancing</>
                      ) : slot.enhanced ? (
                        <><RotateCcw className="w-3 h-3 mr-1" /> Re-enhance</>
                      ) : (
                        <><Sparkles className="w-3 h-3 mr-1" /> Enhance</>
                      )}
                    </Button>
                    {slot.enhanced && (
                      <Button variant="outline" size="sm" onClick={() => resetSlot(i)}>
                        Reset
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
