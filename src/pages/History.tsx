import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Megaphone, Calendar, Sparkles, Clock, History as HistoryIcon, ChevronRight,
} from "lucide-react";
import { PageHeader, EmptyState, GradientText, Shimmer } from "@/components/ui/premium";
import { cn } from "@/lib/utils";

export default function History() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      toast({ title: "Error loading history", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const meta = (type: string) => {
    switch (type) {
      case "description":
        return { icon: FileText, title: "Product Description Generated", tone: "bg-primary/10 text-primary ring-primary/15" };
      case "campaign":
        return { icon: Megaphone, title: "Marketing Campaign Created", tone: "bg-accent/10 text-accent ring-accent/15" };
      default:
        return { icon: Calendar, title: "Activity", tone: "bg-muted text-foreground ring-border" };
    }
  };

  const fmt = (s: string) =>
    new Date(s).toLocaleString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background bg-block-print">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto">
          <PageHeader
            eyebrow="Activity"
            title={<>Your <GradientText>recent work</GradientText></>}
            subtitle="A timeline of everything AI has created for you."
          />

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/60 p-5 bg-card">
                  <div className="flex items-center gap-4">
                    <Shimmer className="w-11 h-11 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <Shimmer className="h-4 w-1/2" />
                      <Shimmer className="h-3 w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="No activity yet"
              description="Start generating content and your history will appear here."
              action={
                <Button variant="gradient" size="lg" className="sheen" onClick={() => navigate("/generate/description")}>
                  <Sparkles className="w-4 h-4" /> Create something
                </Button>
              }
            />
          ) : (
            <div className="relative pl-6">
              <div aria-hidden className="absolute left-2.5 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />
              <ul className="space-y-3 stagger-children">
                {activities.map((a) => {
                  const m = meta(a.activity_type);
                  const Icon = m.icon;
                  return (
                    <li key={a.id} className="relative group">
                      <span aria-hidden className="absolute -left-[19px] top-7 w-3 h-3 rounded-full bg-card border-2 border-primary shadow-glow" />
                      <button
                        type="button"
                        className="w-full text-left rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-card transition-all p-4 flex items-center gap-4"
                      >
                        <span className={cn("inline-flex items-center justify-center w-11 h-11 rounded-2xl ring-1 shrink-0", m.tone)}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold leading-tight">{m.title}</p>
                            <Badge variant="soft" className="text-[10px]">{a.activity_type}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3" /> {fmt(a.created_at)}
                          </p>
                          {a.metadata && (
                            <p className="text-xs text-muted-foreground/80 mt-1.5 line-clamp-1">
                              {JSON.stringify(a.metadata).slice(0, 120)}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-60 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
