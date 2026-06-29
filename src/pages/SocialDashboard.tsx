import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Calendar, Send, Clock, Eye, MousePointerClick, TrendingUp,
  Trash2, ExternalLink, Copy, Settings, Instagram, Facebook, MessageCircle,
} from "lucide-react";
import { format } from "date-fns";
import {
  PageHeader, GradientText, StatCard, EmptyState, Shimmer,
} from "@/components/ui/premium";
import { cn } from "@/lib/utils";

interface ScheduledPost {
  id: string;
  caption: string;
  hashtags: string[];
  platforms: string[];
  goal: string | null;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  link_type: string | null;
  link_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  image_urls: string[];
}

interface PostMetrics {
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  totalClicks: number;
}

const STATUS_MAP: Record<string, { label: string; variant: any }> = {
  draft:     { label: "Draft", variant: "secondary" },
  scheduled: { label: "Scheduled", variant: "soft-accent" },
  published: { label: "Published", variant: "soft-success" },
  failed:    { label: "Failed", variant: "destructive" },
};

const PLATFORM_META: Record<string, { Icon: any; tone: string }> = {
  instagram: { Icon: Instagram, tone: "text-primary" },
  facebook:  { Icon: Facebook, tone: "text-accent" },
  whatsapp:  { Icon: MessageCircle, tone: "text-success" },
};

export default function SocialDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [metrics, setMetrics] = useState<PostMetrics>({ totalPosts: 0, scheduledPosts: 0, publishedPosts: 0, totalClicks: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data, error } = await supabase
        .from("scheduled_posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      const postsData = (data || []) as ScheduledPost[];
      setPosts(postsData);
      setMetrics({
        totalPosts: postsData.length,
        scheduledPosts: postsData.filter((p) => p.status === "scheduled").length,
        publishedPosts: postsData.filter((p) => p.status === "published").length,
        totalClicks: 0,
      });
    } catch (error: any) {
      toast({ title: "Error loading posts", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("scheduled_posts").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Post deleted" });
      fetchPosts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_posts")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Marked as published" });
      fetchPosts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied" });
  };

  const filteredPosts = posts.filter((p) => activeTab === "all" ? true : p.status === activeTab);

  return (
    <div className="min-h-screen bg-background bg-block-print">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            eyebrow="Social hub"
            title={<>Plan, publish & <GradientText>track</GradientText></>}
            subtitle="Schedule posts, ship them in one click, and watch the clicks roll in."
            actions={
              <>
                <Button variant="outline" size="lg" onClick={() => navigate("/social/settings")}>
                  <Settings className="w-4 h-4" /> API Keys
                </Button>
                <Button variant="gradient" size="lg" className="sheen" onClick={() => navigate("/social/schedule")}>
                  <Plus className="w-4 h-4" /> New Post
                </Button>
              </>
            }
          />

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 stagger-children">
            <StatCard icon={Send} label="Total Posts" value={metrics.totalPosts} tone="primary" />
            <StatCard icon={Clock} label="Scheduled" value={metrics.scheduledPosts} tone="accent" />
            <StatCard icon={Eye} label="Published" value={metrics.publishedPosts} tone="success" />
            <StatCard icon={MousePointerClick} label="Link Clicks" value={metrics.totalClicks} tone="tertiary" />
          </div>

          {/* Posts list */}
          <Card className="rounded-3xl border-2 border-border/70 shadow-card overflow-hidden">
            <CardHeader className="border-b border-border/60 bg-muted/30">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle className="font-display">Your Posts</CardTitle>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="rounded-xl bg-card ring-1 ring-border h-10 p-1">
                    {[
                      { v: "all", l: `All · ${posts.length}` },
                      { v: "draft", l: `Drafts · ${posts.filter((p) => p.status === "draft").length}` },
                      { v: "scheduled", l: `Scheduled · ${posts.filter((p) => p.status === "scheduled").length}` },
                      { v: "published", l: `Published · ${posts.filter((p) => p.status === "published").length}` },
                    ].map((t) => (
                      <TabsTrigger key={t.v} value={t.v} className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-xs sm:text-sm">
                        {t.l}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-border/60">
                      <Shimmer className="h-4 w-32 mb-3" />
                      <Shimmer className="h-3 w-full mb-2" />
                      <Shimmer className="h-3 w-3/4" />
                    </div>
                  ))
                ) : filteredPosts.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No posts here yet"
                    description="Schedule something amazing — it only takes a minute."
                    action={
                      <Button variant="gradient" size="lg" className="sheen" onClick={() => navigate("/social/schedule")}>
                        <Plus className="w-4 h-4" /> Create Your First Post
                      </Button>
                    }
                  />
                ) : (
                  filteredPosts.map((post) => (
                    <PostRow key={post.id} post={post} onDelete={handleDelete} onPublish={handlePublish} onCopyLink={copyLink} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function PostRow({
  post, onDelete, onPublish, onCopyLink,
}: {
  post: ScheduledPost;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onCopyLink: (url: string) => void;
}) {
  const navigate = useNavigate();
  const statusInfo = STATUS_MAP[post.status] || STATUS_MAP.draft;
  const publishResults = (post as any).publish_results || {};
  const thumb = post.image_urls?.[0];

  return (
    <div
      onClick={() => navigate(`/social/post/${post.id}`)}
      className="group p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-card transition-all cursor-pointer flex items-start gap-4"
    >
      {thumb ? (
        <img src={thumb} alt="" className="w-16 h-16 rounded-xl object-cover ring-1 ring-border shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-muted ring-1 ring-border shrink-0 flex items-center justify-center text-muted-foreground/50">
          <Send className="w-5 h-5" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            {post.platforms.map((p) => {
              const meta = PLATFORM_META[p];
              if (!meta) return null;
              const result = publishResults[p];
              return (
                <span key={p} className={cn("inline-flex w-6 h-6 rounded-md ring-1 ring-border items-center justify-center bg-card", meta.tone, result?.error && "opacity-40")} title={p}>
                  <meta.Icon className="w-3.5 h-3.5" />
                </span>
              );
            })}
          </div>
          <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
          {post.goal && <Badge variant="outline" className="text-[10px]">{post.goal}</Badge>}
        </div>

        <p className="text-sm line-clamp-2">{post.caption}</p>

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {post.hashtags.slice(0, 5).map((tag, i) => (
              <span key={i} className="text-xs text-primary font-medium">#{tag}</span>
            ))}
            {post.hashtags.length > 5 && (
              <span className="text-xs text-muted-foreground">+{post.hashtags.length - 5}</span>
            )}
          </div>
        )}

        <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
          {post.scheduled_for && (
            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(post.scheduled_for), "MMM d, yyyy h:mm a")}</span>
          )}
          {post.link_url && (
            <span className="inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> {post.link_type}</span>
          )}
          {post.utm_source && (
            <span className="inline-flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {post.utm_source}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {post.link_url && (
          <Button variant="ghost" size="iconSm" onClick={() => onCopyLink(post.link_url!)} aria-label="Copy link">
            <Copy className="w-4 h-4" />
          </Button>
        )}
        {(post.status === "draft" || post.status === "scheduled") && (
          <Button variant="ghost" size="iconSm" onClick={() => onPublish(post.id)} aria-label="Mark published">
            <Send className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="iconSm" onClick={() => onDelete(post.id)} className="text-destructive" aria-label="Delete">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
