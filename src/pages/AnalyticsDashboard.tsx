import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3, Activity, Globe2 } from "lucide-react";
import { CountUp, GradientText, SectionEyebrow } from "@/components/ui/premium";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SECRET_SLUG = "x9k2p7q4w8m1n6";

interface Summary {
  range_days: number;
  totals: Record<string, number>;
  byEvent: Record<string, number>;
  byPage: Record<string, number>;
  byDay: Record<string, number>;
  avgPageMs: Record<string, number>;
  topClicks: { label: string; count: number }[];
  recent: any[];
}

export default function AnalyticsDashboard() {
  const { slug } = useParams();
  const [data, setData] = useState<Summary | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const ok = slug === SECRET_SLUG;

  useEffect(() => {
    if (!ok) return;
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-summary?days=${days}&key=${SECRET_SLUG}`;
        const res = await fetch(url, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string}`,
          },
        });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);
        setData(json);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [days, ok]);

  if (!ok) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-mono text-sm text-muted-foreground">
        404
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-block-print">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <SectionEyebrow>Internal · Analytics</SectionEyebrow>
            <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight">
              <GradientText>AdCraft</GradientText> Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Anonymous events, sessions and click data.</p>
          </div>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 7, 14, 30, 60, 90].map((d) => (<SelectItem key={d} value={String(d)}>Last {d} days</SelectItem>))}
            </SelectContent>
          </Select>
        </header>

        {loading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        )}
        {err && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{err}</div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8 stagger-children">
              {Object.entries(data.totals).map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-card border border-border/60 p-4 shadow-card hover-lift">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</p>
                  <p className="font-display text-2xl font-bold mt-1 tabular-nums">
                    <CountUp value={v as number} />
                  </p>
                </div>
              ))}
            </div>

            <Section title="Events per day" icon={Activity}>
              <BarChart data={data.byDay} />
            </Section>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <Section title="Top events" icon={BarChart3}>
                <Table rows={Object.entries(data.byEvent).sort((a, b) => b[1] - a[1]).slice(0, 25)} cols={["Event", "Count"]} />
              </Section>
              <Section title="Pages by traffic" icon={Globe2}>
                <Table rows={Object.entries(data.byPage).sort((a, b) => b[1] - a[1]).slice(0, 25)} cols={["Page", "Views"]} />
              </Section>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <Section title="Average time on page (ms)" icon={Activity}>
                <Table rows={Object.entries(data.avgPageMs).sort((a, b) => b[1] - a[1]).slice(0, 25)} cols={["Page", "Avg ms"]} />
              </Section>
              <Section title="Top clicks (label)" icon={BarChart3}>
                <Table rows={data.topClicks.map((c) => [c.label, c.count])} cols={["Label", "Clicks"]} />
              </Section>
            </div>

            <Section title="Recent 200 events" icon={Activity}>
              <div className="max-h-96 overflow-auto rounded-2xl border border-border/60 bg-card">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                    <tr>
                      {["Time", "Event", "Page", "Session", "User", "Props"].map((h) => (
                        <th key={h} className="text-left p-2.5 font-semibold text-foreground/80 border-b border-border">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((e) => (
                      <tr key={e.id} className="border-b border-border/40 hover:bg-muted/40">
                        <td className="p-2 whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                        <td className="p-2 text-success font-medium">{e.event_name}</td>
                        <td className="p-2">{e.page}</td>
                        <td className="p-2 text-muted-foreground">{(e.session_id || "").slice(0, 8)}</td>
                        <td className="p-2 text-muted-foreground">{(e.user_id || "—").slice(0, 8)}</td>
                        <td className="p-2 text-muted-foreground"><code>{JSON.stringify(e.properties).slice(0, 120)}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 inline-flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-primary" /> {title}
      </h2>
      {children}
    </section>
  );
}

function Table({ rows, cols }: { rows: any[][] | [string, number][]; cols: string[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/60">
          <tr>{cols.map((c) => (
            <th key={c} className="text-left p-3 font-semibold text-foreground/80">{c}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border/60 hover:bg-muted/40">
              {(r as any[]).map((cell, j) => (
                <td key={j} className="p-3 tabular-nums">{String(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div className="flex items-end gap-1.5 h-44 px-4 py-3 rounded-2xl border border-border/60 bg-card">
      {entries.map(([day, v]) => (
        <div key={day} className="flex-1 flex flex-col items-center gap-1.5 group">
          <span className="text-[10px] text-muted-foreground tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">{v}</span>
          <div
            title={`${day}: ${v}`}
            className="w-full bg-gradient-to-t from-primary to-tertiary rounded-md min-h-[2px] hover:opacity-90 transition-opacity"
            style={{ height: `${(v / max) * 100}%` }}
          />
          <div className="text-[9px] text-muted-foreground">{day.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}
