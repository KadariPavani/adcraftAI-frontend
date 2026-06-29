import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Copy, Sparkles } from "lucide-react";
import { useInView } from "@/hooks/useInView";

/* ────────────────────────────────────────────────────────────
   PageHeader — eyebrow, gradient title, subtitle, actions
   ────────────────────────────────────────────────────────────*/
type PageHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function PageHeader({ eyebrow, title, subtitle, actions, align = "left", className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-10 animate-fade-up",
        align === "center" ? "text-center mx-auto max-w-3xl" : "flex flex-wrap items-end justify-between gap-6",
        className,
      )}
    >
      <div className={cn(align === "center" ? "" : "flex-1 min-w-0")}>
        {eyebrow && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-3 ring-1 ring-primary/15">
            <Sparkles className="w-3.5 h-3.5" />
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-4xl md:text-5xl font-bold leading-[1.05] tracking-tight text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl text-pretty">
            {subtitle}
          </p>
        )}
      </div>
      {actions && align !== "center" && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
      {actions && align === "center" && (
        <div className="mt-6 flex flex-wrap justify-center items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

/* ────────────────────────────────────────────────────────────
   GradientText — quick inline gradient
   ────────────────────────────────────────────────────────────*/
export function GradientText({
  children,
  animated = false,
  className,
}: {
  children: React.ReactNode;
  animated?: boolean;
  className?: string;
}) {
  return (
    <span className={cn(animated ? "text-gradient-warm" : "text-gradient-static", className)}>
      {children}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
   CountUp — animates a number to its target value
   ────────────────────────────────────────────────────────────*/
export function CountUp({
  value,
  duration = 1400,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.35 });
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (!inView || value <= 0) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);
  return <span ref={ref} className={cn("tabular-nums", className)}>{n.toLocaleString()}</span>;
}

/* ────────────────────────────────────────────────────────────
   StatCard — icon, label, animated value, optional trend chip
   ────────────────────────────────────────────────────────────*/
type StatCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: "primary" | "accent" | "success" | "tertiary";
  trend?: string;
  className?: string;
};

const TONES: Record<NonNullable<StatCardProps["tone"]>, { bg: string; ring: string; ic: string }> = {
  primary:  { bg: "bg-primary/10",   ring: "ring-primary/20",   ic: "text-primary"   },
  accent:   { bg: "bg-accent/10",    ring: "ring-accent/20",    ic: "text-accent"    },
  success:  { bg: "bg-success/10",   ring: "ring-success/20",   ic: "text-success"   },
  tertiary: { bg: "bg-tertiary/10",  ring: "ring-tertiary/20",  ic: "text-tertiary"  },
};

export function StatCard({ icon: Icon, label, value, tone = "primary", trend, className }: StatCardProps) {
  const t = TONES[tone];
  return (
    <div
      className={cn(
        "group relative rounded-2xl bg-card p-5 border border-border/60 shadow-card hover-lift overflow-hidden",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-warm opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500" />
      <div className="flex items-start justify-between gap-3 relative">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="font-display text-3xl md:text-4xl font-bold mt-1 leading-none">
            <CountUp value={value} />
          </p>
          {trend && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> {trend}
            </p>
          )}
        </div>
        <span className={cn("inline-flex items-center justify-center w-11 h-11 rounded-xl ring-1", t.bg, t.ring)}>
          <Icon className={cn("w-5 h-5", t.ic)} />
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   GlassCard — frosted surface with optional gradient border
   ────────────────────────────────────────────────────────────*/
export function GlassCard({
  children,
  gradient = false,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { gradient?: boolean }) {
  return (
    <div
      {...rest}
      className={cn(
        "glass rounded-2xl shadow-card",
        gradient && "border-gradient",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   EmptyState — friendly fallback with optional CTA
   ────────────────────────────────────────────────────────────*/
export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden text-center py-16 px-6 rounded-3xl border-2 border-dashed border-border bg-card/60 animate-fade-up",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
      <div className="relative">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-marigold flex items-center justify-center shadow-soft mb-5 animate-float">
          <Icon className="w-8 h-8 text-primary-foreground" />
        </div>
        <h3 className="font-display text-2xl font-bold mb-2">{title}</h3>
        {description && <p className="text-muted-foreground max-w-md mx-auto">{description}</p>}
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Shimmer — loading skeleton
   ────────────────────────────────────────────────────────────*/
export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-shimmer rounded-xl", className)} />;
}

export function ShimmerGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/60 p-4 bg-card">
          <Shimmer className="aspect-[4/3] mb-4" />
          <Shimmer className="h-4 w-2/3 mb-2" />
          <Shimmer className="h-3 w-full mb-1.5" />
          <Shimmer className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Marquee — infinite horizontal scroller for trust bars
   ────────────────────────────────────────────────────────────*/
export function Marquee({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10"
      />
      <div className="flex gap-12 animate-marquee whitespace-nowrap will-change-transform">
        <div className="flex gap-12 shrink-0">{children}</div>
        <div className="flex gap-12 shrink-0" aria-hidden>{children}</div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Spotlight — radial glow that follows cursor inside a card
   ────────────────────────────────────────────────────────────*/
type SpotlightProps = React.HTMLAttributes<HTMLDivElement> & {
  intensity?: number;
  tilt?: boolean;
  maxTilt?: number;
};

export function Spotlight({
  children,
  className,
  intensity = 0.35,
  tilt = false,
  maxTilt = 7,
  onMouseMove: userOnMouseMove,
  onMouseLeave: userOnMouseLeave,
  style: userStyle,
  ...rest
}: SpotlightProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      if (tilt) {
        const nx = (x / r.width - 0.5) * 2;
        const ny = (y / r.height - 0.5) * 2;
        el.style.setProperty("--tx", `${nx * maxTilt}deg`);
        el.style.setProperty("--ty", `${-ny * maxTilt}deg`);
      }
    }
    userOnMouseMove?.(e);
  };
  const onMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (el && tilt) {
      el.style.setProperty("--tx", "0deg");
      el.style.setProperty("--ty", "0deg");
    }
    userOnMouseLeave?.(e);
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn("group relative overflow-hidden", tilt && "tilt-card", className)}
      style={{ ["--mx" as any]: "50%", ["--my" as any]: "50%", ...userStyle }}
      {...rest}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(360px circle at var(--mx) var(--my), hsl(var(--primary) / ${intensity}), transparent 60%)`,
        }}
      />
      <div className="relative" style={tilt ? { transform: "translateZ(20px)" } : undefined}>
        {children}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   ScrollProgress — thin gradient bar at top of viewport
   ────────────────────────────────────────────────────────────*/
export function ScrollProgress({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "fixed top-0 left-0 right-0 h-[3px] z-[60] origin-left pointer-events-none scroll-progress-bar bg-gradient-marigold",
        className,
      )}
    />
  );
}

/* ────────────────────────────────────────────────────────────
   MagneticButton — wraps a child element; pulls toward cursor
   ────────────────────────────────────────────────────────────*/
export function MagneticButton({
  children,
  className,
  strength = 0.35,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "translate3d(0,0,0)";
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn("inline-block transition-transform duration-300 ease-out", className)}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   CopyButton — copies text, shows check feedback
   ────────────────────────────────────────────────────────────*/
export function CopyButton({
  text,
  className,
  label,
}: {
  text: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* no-op */
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ring-focus",
        copied && "text-success",
        className,
      )}
      aria-label="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────
   SectionEyebrow — small uppercase label with gradient dot
   ────────────────────────────────────────────────────────────*/
export function SectionEyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs font-semibold text-primary uppercase tracking-[0.18em] mb-3 inline-flex items-center gap-2", className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-gradient-marigold" />
      {children}
    </p>
  );
}

/* ────────────────────────────────────────────────────────────
   Divider — gradient hairline
   ────────────────────────────────────────────────────────────*/
export function GradientDivider({ className }: { className?: string }) {
  return (
    <div className={cn("h-px w-full bg-gradient-to-r from-transparent via-border-strong to-transparent", className)} />
  );
}
