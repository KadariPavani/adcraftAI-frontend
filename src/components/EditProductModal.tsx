import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploader } from "@/components/ImageUploader";
import { Sparkles, Save, Loader2, ImagePlus } from "lucide-react";
import { type Product } from "@/hooks/useProducts";

interface EditProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: () => void;
}

export function EditProductModal({ product, open, onOpenChange, onProductUpdated }: EditProductModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [newOriginalImage, setNewOriginalImage] = useState<string | null>(null);
  const [newEnhancedImage, setNewEnhancedImage] = useState<string | null>(null);

  useEffect(() => {
    if (product && open) {
      setTitle(product.title);
      setShortDesc(product.short_description || "");
      setLongDesc(product.long_description || "");
      setCategory(product.category || "");
      setTags((product.tags || []).join(", "));
      setShowImageUploader(false);
      setNewOriginalImage(null);
      setNewEnhancedImage(null);
    }
  }, [product, open]);

  const displayImage = newEnhancedImage || newOriginalImage || product?.enhanced_image_url || product?.image_url;

  const handleImageReady = (original: string, enhanced: string | null) => {
    setNewOriginalImage(original);
    setNewEnhancedImage(enhanced);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const imageData = newEnhancedImage || newOriginalImage || product?.enhanced_image_url || product?.image_url;
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          type: 'description',
          productInfo: `Current title: ${title}. ${shortDesc}`,
          imageData,
        }
      });
      if (error) throw error;

      setTitle(data.content.title || title);
      setShortDesc(data.content.short_description || shortDesc);
      setLongDesc(data.content.long_description || longDesc);
      setCategory(data.content.category || category);
      setTags((data.content.tags || []).join(", "));
      toast({ title: "Content regenerated" });
    } catch (error: any) {
      toast({ title: "Regeneration failed", description: error.message, variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = async () => {
    if (!product || !title.trim()) return;
    setIsSaving(true);
    try {
      const parsedTags = tags.split(",").map(t => t.trim()).filter(Boolean);
      const updateData: any = {
        title: title.trim(),
        short_description: shortDesc.trim() || null,
        long_description: longDesc.trim() || null,
        category: category.trim() || null,
        tags: parsedTags.length > 0 ? parsedTags : null,
      };

      if (newOriginalImage) updateData.image_url = newOriginalImage;
      if (newEnhancedImage) updateData.enhanced_image_url = newEnhancedImage;

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id);

      if (error) throw error;

      toast({ title: "Product updated" });
      onProductUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Current Image + Replace Option */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Product Image</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImageUploader(!showImageUploader)}
              >
                <ImagePlus className="w-4 h-4 mr-1" />
                {showImageUploader ? "Cancel" : "Update Image"}
              </Button>
            </div>

            {showImageUploader ? (
              <ImageUploader onImageReady={handleImageReady} />
            ) : displayImage ? (
              <div className="aspect-video overflow-hidden rounded-lg bg-secondary max-h-48">
                <img src={displayImage} alt={title} className="w-full h-full object-cover" />
              </div>
            ) : null}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-sm font-semibold">Product Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-short" className="text-sm font-semibold">Short Description</Label>
            <Textarea id="edit-short" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={2} />
          </div>

          {/* Long Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-long" className="text-sm font-semibold">Full Description</Label>
            <Textarea id="edit-long" value={longDesc} onChange={(e) => setLongDesc(e.target.value)} rows={4} />
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Tags (comma-separated)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
          </div>

          {/* Tag pills */}
          {tags && (
            <div className="flex flex-wrap gap-1.5">
              {tags.split(",").map(t => t.trim()).filter(Boolean).map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-accent text-accent-foreground rounded-full text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex-1"
            >
              {isRegenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Regenerating…</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Regenerate with AI</>
              )}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !title.trim()} className="flex-1">
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Save Changes</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
