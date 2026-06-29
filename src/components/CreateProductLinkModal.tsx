import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link2, Copy, Check } from "lucide-react";

interface CreateProductLinkModalProps {
  productId: string;
  productTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinkCreated?: () => void;
}

export function CreateProductLinkModal({
  productId,
  productTitle,
  open,
  onOpenChange,
  onLinkCreated
}: CreateProductLinkModalProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [marketplaceUrl, setMarketplaceUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const generateSlug = (title: string) => {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    const random = Math.random().toString(36).substring(2, 8);
    return `${base}-${random}`;
  };

  const handleCreate = async () => {
    setIsCreating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const slug = generateSlug(productTitle);

      const { data, error } = await supabase
        .from('product_links')
        .insert({
          user_id: user.id,
          product_id: productId,
          slug,
          whatsapp_number: whatsappNumber || null,
          instagram_handle: instagramHandle.replace('@', '') || null,
          marketplace_url: marketplaceUrl || null,
          website_url: websiteUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      const linkUrl = `${window.location.origin}/p/${slug}`;
      setCreatedLink(linkUrl);
      
      toast({
        title: "Product link created",
        description: "Share this link anywhere to sell your product",
      });

      onLinkCreated?.();
      
    } catch (error: any) {
      toast({
        title: "Failed to create link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyLink = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied!",
        description: "Share it on WhatsApp, Instagram, or anywhere",
      });
    }
  };

  const handleClose = () => {
    setCreatedLink(null);
    setCopied(false);
    setWhatsappNumber("");
    setInstagramHandle("");
    setMarketplaceUrl("");
    setWebsiteUrl("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Create Product Link
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for "{productTitle}"
          </DialogDescription>
        </DialogHeader>

        {!createdLink ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number (with country code)</Label>
              <Input
                id="whatsapp"
                placeholder="e.g., 919876543210"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram Handle</Label>
              <Input
                id="instagram"
                placeholder="e.g., @yourshop"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marketplace">Marketplace URL (optional)</Label>
              <Input
                id="marketplace"
                placeholder="e.g., https://meesho.com/your-product"
                value={marketplaceUrl}
                onChange={(e) => setMarketplaceUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website URL (optional)</Label>
              <Input
                id="website"
                placeholder="e.g., https://yourshop.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleCreate} 
              disabled={isCreating || (!whatsappNumber && !instagramHandle)}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Shareable Link"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Your product link:</p>
              <p className="font-mono text-sm break-all">{createdLink}</p>
            </div>

            <Button onClick={copyLink} className="w-full" variant="outline">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out my product: ${createdLink}`)}`, '_blank')}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Share on WhatsApp
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
