import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Sparkles, Loader2, X, RotateCcw, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ImageUploaderProps {
  onImageReady: (originalImage: string, enhancedImage: string | null) => void;
  onEnhancementComplete?: (skipped: boolean) => void;
  className?: string;
}

export function ImageUploader({ onImageReady, onEnhancementComplete, className = "" }: ImageUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [iterationCount, setIterationCount] = useState(0);
  const [enhancementHistory, setEnhancementHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setOriginalImage(base64);
      setEnhancedImage(null);
      setIsEnhanced(false);
      setIterationCount(0);
      setEnhancementHistory([]);
      setCustomPrompt("");
    };
    reader.readAsDataURL(file);
  };

  const handleEnhance = async () => {
    // Use enhanced image as input for re-enhancement, fallback to original
    const inputImage = enhancedImage || originalImage;
    if (!inputImage) return;

    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-image', {
        body: { 
          imageData: inputImage,
          customPrompt: customPrompt.trim() || undefined,
        }
      });

      if (error) throw error;

      if (data.enhancedImage) {
        // Save current enhanced image to history before replacing
        if (enhancedImage) {
          setEnhancementHistory(prev => [...prev, enhancedImage]);
        }
        setEnhancedImage(data.enhancedImage);
        setIsEnhanced(true);
        setIterationCount(prev => prev + 1);
        setCustomPrompt("");
        toast({
          title: `Image enhanced (v${iterationCount + 1})`,
          description: customPrompt.trim() 
            ? `Applied: "${customPrompt.trim()}"` 
            : "Default professional enhancement applied",
        });
        onImageReady(originalImage!, data.enhancedImage);
        onEnhancementComplete?.(false);
      }
    } catch (error: any) {
      console.error('Enhancement error:', error);
      toast({
        title: "Enhancement failed",
        description: error.message || "Could not enhance image. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleRevertToVersion = (index: number) => {
    const selectedVersion = enhancementHistory[index];
    // Move current to end, set selected as current
    setEnhancedImage(selectedVersion);
    setEnhancementHistory(prev => {
      const newHistory = [...prev];
      newHistory.splice(index, 1);
      if (enhancedImage) newHistory.push(enhancedImage);
      return newHistory;
    });
    setIterationCount(index + 1);
    onImageReady(originalImage!, selectedVersion);
    toast({ title: `Reverted to version ${index + 1}` });
  };

  const handleRevertToOriginal = () => {
    if (enhancedImage) {
      setEnhancementHistory(prev => [...prev, enhancedImage]);
    }
    setEnhancedImage(null);
    setIsEnhanced(false);
    setIterationCount(0);
    setCustomPrompt("");
    onImageReady(originalImage!, null);
    toast({ title: "Reverted to original image" });
  };

  const handleSkipEnhancement = () => {
    if (originalImage) {
      onImageReady(originalImage, null);
      onEnhancementComplete?.(true);
    }
  };

  const clearImage = () => {
    setOriginalImage(null);
    setEnhancedImage(null);
    setIsEnhanced(false);
    setCustomPrompt("");
    setIterationCount(0);
    setEnhancementHistory([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!originalImage ? (
        <Card 
          className="border-2 border-dashed border-primary/30 hover:border-primary/50 cursor-pointer transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="w-12 h-12 text-primary/50 mb-4" />
            <p className="text-lg font-medium mb-1">Upload Product Photo</p>
            <p className="text-sm text-muted-foreground">
              Click to upload JPEG, PNG, or WebP
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {iterationCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      v{iterationCount}
                    </Badge>
                  )}
                  {enhancementHistory.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <History className="w-3 h-3" />
                      {enhancementHistory.length} previous
                    </Button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={clearImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Version History */}
              {showHistory && enhancementHistory.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-secondary/50 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Enhancement History</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {enhancementHistory.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => handleRevertToVersion(i)}
                        className="flex-shrink-0 group relative"
                      >
                        <img
                          src={img}
                          alt={`Version ${i + 1}`}
                          className="w-16 h-16 rounded-md object-cover border-2 border-transparent group-hover:border-primary transition-colors"
                        />
                        <span className="absolute bottom-0 left-0 right-0 text-[10px] bg-background/80 text-center rounded-b-md">
                          v{i + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Original</p>
                  <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
                    <img 
                      src={originalImage} 
                      alt="Original product" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {isEnhanced ? `Enhanced (v${iterationCount})` : "Enhanced Preview"}
                  </p>
                  <div className="aspect-square overflow-hidden rounded-lg bg-secondary flex items-center justify-center">
                    {enhancedImage ? (
                      <img 
                        src={enhancedImage} 
                        alt="Enhanced product" 
                        className="w-full h-full object-cover"
                      />
                    ) : isEnhancing ? (
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Enhancing...</p>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click enhance to improve lighting & clarity
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhancement Prompt — always visible when not enhancing */}
              {!isEnhancing && (
                <div className="mt-4">
                  <Input
                    placeholder={isEnhanced 
                      ? "e.g., make it brighter, change background to beige, add warm tones..." 
                      : "Optional: e.g., make background white, brighten colors, remove shadows..."}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isEnhanced 
                      ? "Describe further changes — enhancement builds on the current version"
                      : "Leave empty for default enhancement, or describe how you'd like it improved"}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handleEnhance}
                  disabled={isEnhancing}
                  className="flex-1"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enhancing...
                    </>
                  ) : isEnhanced ? (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Re-Enhance
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Enhance Image
                    </>
                  )}
                </Button>

                {!isEnhanced && (
                  <Button
                    variant="outline"
                    onClick={handleSkipEnhancement}
                    disabled={isEnhancing}
                  >
                    Skip
                  </Button>
                )}

                {isEnhanced && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleRevertToOriginal}
                      disabled={isEnhancing}
                      size="sm"
                    >
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isEnhancing}
                      size="sm"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
