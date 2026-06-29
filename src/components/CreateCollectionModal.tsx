import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, Layers } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

interface CreateCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCollectionCreated?: () => void;
}

export function CreateCollectionModal({ open, onOpenChange, onCollectionCreated }: CreateCollectionModalProps) {
  const { toast } = useToast();
  const { products, isLoading: productsLoading } = useProducts();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [marketplaceUrl, setMarketplaceUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateSlug = (title: string) => {
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
    const random = Math.random().toString(36).substring(2, 8);
    return `${base}-${random}`;
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (selectedProductIds.length === 0) {
      toast({ title: "Select at least one product", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const slug = generateSlug(name);

      const { data: collectionData, error: collError } = await supabase
        .from('product_collections')
        .insert({
          user_id: user.id,
          name: name.trim(),
          slug,
          description: description.trim() || null,
          whatsapp_number: whatsappNumber || null,
          instagram_handle: instagramHandle.replace('@', '') || null,
          marketplace_url: marketplaceUrl || null,
          website_url: websiteUrl || null,
        })
        .select()
        .single();

      if (collError) throw collError;

      // Insert junction records
      const junctionRows = selectedProductIds.map((pid, idx) => ({
        collection_id: collectionData.id,
        product_id: pid,
        sort_order: idx,
      }));

      const { error: jError } = await supabase
        .from('collection_products')
        .insert(junctionRows);

      if (jError) throw jError;

      const linkUrl = `${window.location.origin}/c/${slug}`;
      setCreatedLink(linkUrl);

      toast({ title: "Collection created", description: "Share this link to show your product storefront" });
      onCollectionCreated?.();
    } catch (error: any) {
      toast({ title: "Failed to create collection", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const copyLink = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied!" });
    }
  };

  const handleClose = () => {
    setCreatedLink(null);
    setCopied(false);
    setName("");
    setDescription("");
    setSelectedProductIds([]);
    setWhatsappNumber("");
    setInstagramHandle("");
    setMarketplaceUrl("");
    setWebsiteUrl("");
    onOpenChange(false);
  };

  const getProductImage = (p: any) => p.enhanced_image_url || p.image_url;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Create Collection Link
          </DialogTitle>
          <DialogDescription>
            Group multiple products into a shareable storefront page
          </DialogDescription>
        </DialogHeader>

        {!createdLink ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Collection Name *</Label>
              <Input placeholder="e.g., Summer Collection 2024" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Brief description of this collection" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>

            {/* Product picker */}
            <div className="space-y-2">
              <Label>Select Products * ({selectedProductIds.length} selected)</Label>
              <div className="border border-border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
                {productsLoading ? (
                  <p className="text-sm text-muted-foreground p-2">Loading products...</p>
                ) : products.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">No products in your library yet</p>
                ) : (
                  products.map(product => (
                    <label
                      key={product.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                      {getProductImage(product) && (
                        <img src={getProductImage(product)!} alt="" className="w-8 h-8 rounded object-cover" />
                      )}
                      <span className="text-sm font-medium truncate">{product.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-2">
              <Label>WhatsApp Number</Label>
              <Input placeholder="e.g., 919876543210" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Instagram Handle</Label>
              <Input placeholder="e.g., @yourshop" value={instagramHandle} onChange={e => setInstagramHandle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Marketplace URL</Label>
              <Input placeholder="e.g., https://meesho.com/your-shop" value={marketplaceUrl} onChange={e => setMarketplaceUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input placeholder="e.g., https://yourshop.com" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} />
            </div>

            <Button onClick={handleCreate} disabled={isCreating || !name.trim() || selectedProductIds.length === 0} className="w-full">
              {isCreating ? "Creating..." : "Create Collection Link"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Your collection link:</p>
              <p className="font-mono text-sm break-all">{createdLink}</p>
            </div>
            <Button onClick={copyLink} className="w-full" variant="outline">
              {copied ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy Link</>}
            </Button>
            <Button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out my products: ${createdLink}`)}`, '_blank')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Share on WhatsApp
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
