import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Send, CheckCircle2, XCircle, Clock, Loader2, ExternalLink, TrendingUp,
  Image as ImageIcon, Instagram, Facebook, MessageCircle, Target,
} from "lucide-react";
import { format } from "date-fns";
import { CopyButton, PageHeader, GradientText, Shimmer } from "@/components/ui/premium";
import { cn } from "@/lib/utils";
import { publishInstagramLocal, publishFacebookLocal, publishWhatsAppLocal } from "@/lib/publishLocal";

const PLATFORM_CONFIG: Record<string, { label: string; Icon: any; tone: string }> = {
  instagram: { label: "Instagram", Icon: Instagram, tone: "text-primary bg-primary/10 ring-primary/15" },
  facebook:  { label: "Facebook", Icon: Facebook, tone: "text-accent bg-accent/10 ring-accent/15" },
  whatsapp:  { label: "WhatsApp", Icon: MessageCircle, tone: "text-success bg-success/10 ring-success/15" },
};

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [publishingPlatform, setPublishingPlatform] = useState<string | null>(null);

  useEffect(() => { fetchPost(); }, [id]);

  const fetchPost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data, error } = await supabase
        .from("scheduled_posts").select("*").eq("id", id).eq("user_id", user.id).single();
      if (error) throw error;
      setPost(data);
    } catch (error: any) {
      toast({ title: "Error loading post", description: error.message, variant: "destructive" });
      navigate("/social/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishPlatform = async (platform: string) => {
    setPublishingPlatform(platform);
    try {
      let result: { success: boolean; platformPostId?: string; error?: string };

      if (platform === "instagram") {
        result = await publishInstagramLocal(id!);
      } else if (platform === "facebook") {
        result = await publishFacebookLocal(id!);
      } else if (platform === "whatsapp") {
        result = await publishWhatsAppLocal(id!);
      } else {
        result = { success: false, error: `Unsupported platform: ${platform}` };
      }

      // Persist publish_results so the UI reflects success/failure on reload.
      if (post) {
        const existing = (post.publish_results || {}) as Record<string, unknown>;
        const updated = {
          ...existing,
          [platform]: {
            platform,
            success: result.success,
            platformPostId: result.platformPostId,
            error: result.error,
            publishedAt: result.success ? new Date().toISOString() : undefined,
          },
        };
        const update: Record<string, unknown> = { publish_results: updated };
        if (result.success) {
          update.status = "published";
          if (!post.published_at) update.published_at = new Date().toISOString();
        }
        await supabase.from("scheduled_posts").update(update).eq("id", id);
      }

      if (result.success) {
        toast({ title: `Published to ${PLATFORM_CONFIG[platform]?.label}` });
      } else {
        toast({ title: `Failed to publish to ${PLATFORM_CONFIG[platform]?.label}`, description: result.error || "Unknown error", variant: "destructive" });
      }
      fetchPost();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setPublishingPlatform(null);
    }
  };

  const captionForCopy = () => {
    if (!post) return "";
    let text = post.caption;
    if (post.hashtags?.length) text += "\n\n" + post.hashtags.map((h: string) => `#${h}`).join(" ");
    if (post.link_url) text += "\n\n" + post.link_url;
    return text;
  };

  const getPlatformStatus = (platform: string) => {
    const results = (post?.publish_results || {}) as Record<string, any>;
    return results[platform] || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background bg-block-print">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-4xl mx-auto">
            <Shimmer className="h-10 w-32 mb-6" />
            <Shimmer className="h-12 w-2/3 mb-3" />
            <Shimmer className="h-4 w-1/3 mb-8" />
            <div className="grid lg:grid-cols-3 gap-6">
              <Shimmer className="lg:col-span-2 h-96 rounded-3xl" />
              <Shimmer className="h-96 rounded-3xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-background bg-block-print">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/social/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Hub
          </Button>

          <PageHeader
            eyebrow={post.status}
            title={<>Your <GradientText>post</GradientText> preview</>}
            subtitle="Review, publish to each platform, and watch the results roll in."
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-3xl border-2 border-border/70 shadow-card overflow-hidden">
                <div aria-hidden className="h-1 bg-gradient-marigold" />
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-display">
                    Post Preview
                    <Badge variant={post.status === "published" ? "soft-success" : post.status === "scheduled" ? "soft-accent" : "secondary"}>
                      {post.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {post.image_urls?.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {post.image_urls.map((url: string, i: number) => (
                        <img key={i} src={url} alt="" className="rounded-2xl w-full aspect-square object-cover ring-1 ring-border" />
                      ))}
                    </div>
                  )}

                  <div className="relative rounded-2xl bg-muted/40 border border-border/60 p-5">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed pr-10">{post.caption}</p>
                    <div className="absolute top-2 right-2">
                      <CopyButton text={captionForCopy()} />
                    </div>
                  </div>

                  {post.hashtags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.hashtags.map((tag: string, i: number) => (
                        <Badge key={i} variant="soft">#{tag}</Badge>
                      ))}
                    </div>
                  )}

                  {post.link_url && (
                    <div className="p-3 rounded-2xl bg-card border border-border/60 flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-primary shrink-0" />
                      <p className="text-xs font-mono break-all flex-1">{post.link_url}</p>
                      <CopyButton text={post.link_url} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {(post.utm_source || post.utm_medium || post.utm_campaign) && (
                <Card className="rounded-3xl border-2 border-border/70 shadow-card">
                  <CardHeader>
                    <CardTitle className="text-base font-display inline-flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> UTM Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {post.utm_source &&   <UtmRow k="Source"   v={post.utm_source} />}
                      {post.utm_medium &&   <UtmRow k="Medium"   v={post.utm_medium} />}
                      {post.utm_campaign && <UtmRow k="Campaign" v={post.utm_campaign} />}
                      {post.utm_content &&  <UtmRow k="Content"  v={post.utm_content} />}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="rounded-3xl border-2 border-border/70 shadow-card">
                <CardHeader><CardTitle className="text-base font-display">Publish to Platforms</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {(post.platforms as string[]).map((platform) => {
                    const config = PLATFORM_CONFIG[platform];
                    const status = getPlatformStatus(platform);
                    const isPublishing = publishingPlatform === platform;
                    if (!config) return null;
                    return (
                      <div key={platform} className="rounded-2xl border border-border/60 p-4 space-y-3 bg-card">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className={cn("inline-flex items-center justify-center w-9 h-9 rounded-xl ring-1", config.tone)}>
                              <config.Icon className="w-4 h-4" />
                            </span>
                            <span className="font-semibold text-sm">{config.label}</span>
                          </div>
                          {status?.success ? (
                            <Badge variant="soft-success"><CheckCircle2 className="w-3 h-3" /> Published</Badge>
                          ) : status?.error ? (
                            <Badge variant="destructive"><XCircle className="w-3 h-3" /> Failed</Badge>
                          ) : (
                            <Badge variant="outline"><Clock className="w-3 h-3" /> Pending</Badge>
                          )}
                        </div>
                        {status?.error && <p className="text-xs text-destructive">{status.error}</p>}
                        {status?.platformPostId && <p className="text-xs text-muted-foreground">Post ID: {status.platformPostId}</p>}
                        {!status?.success && (
                          <Button size="sm" variant="gradient" className="w-full" onClick={() => handlePublishPlatform(platform)} disabled={isPublishing}>
                            {isPublishing
                              ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing…</>)
                              : (<><Send className="w-3.5 h-3.5" /> Publish Now</>)}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-2 border-border/70 shadow-card">
                <CardHeader><CardTitle className="text-base font-display">Details</CardTitle></CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  {post.scheduled_for && (
                    <Row icon={Clock} text={`Scheduled: ${format(new Date(post.scheduled_for), "MMM d, yyyy h:mm a")}`} />
                  )}
                  {post.published_at && (
                    <Row icon={CheckCircle2} text={`Published: ${format(new Date(post.published_at), "MMM d, yyyy h:mm a")}`} tone="text-success" />
                  )}
                  {post.goal && <Row icon={Target} text={`Goal: ${post.goal}`} />}
                  <Row icon={ImageIcon} text={`${post.image_urls?.length || 0} images`} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function UtmRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-muted/40 border border-border/60 p-2.5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</p>
      <p className="font-medium mt-0.5 truncate">{v}</p>
    </div>
  );
}

function Row({ icon: Icon, text, tone }: { icon: any; text: string; tone?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", tone)}>
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span>{text}</span>
    </div>
  );
}
