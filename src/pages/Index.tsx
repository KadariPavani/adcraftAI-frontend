import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sparkles, FileText, Megaphone, Zap, Heart, TrendingUp, Camera, Share2,
  ShieldCheck, ArrowRight, Star, CheckCircle2, ShoppingBag, Mic, Globe2,
  Languages, BarChart3, Wand2, Rocket, Quote,
} from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { useRegionalCopy } from "@/hooks/useRegionalCopy";
import { LanguageToggle } from "@/components/LanguageToggle";
import { CountUp, GradientText, Marquee, Spotlight, SectionEyebrow, ScrollProgress, MagneticButton } from "@/components/ui/premium";
import { cn } from "@/lib/utils";

export default function Index() {
  const navigate = useNavigate();
  const copy = useRegionalCopy();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard", { replace: true });
    });
  }, [navigate]);

  // rAF-throttled scroll: drives parallax + progress + nav state via CSS vars
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const y = window.scrollY;
      const max = Math.max(1, root.scrollHeight - window.innerHeight);
      root.style.setProperty("--scroll-y", `${y}px`);
      root.style.setProperty("--scroll-progress", String(Math.min(1, y / max)));
      setScrolled(y > 8);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Single global IntersectionObserver: reveals every [data-reveal] on entry
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)");
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <ScrollProgress />

      {/* ─────────────── Nav ─────────────── */}
      <nav
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-border/60 bg-background/85 backdrop-blur-xl shadow-card"
            : "bg-background/40 backdrop-blur-md",
        )}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-display text-xl font-bold">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-marigold shadow-soft">
              <Sparkles className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
            </span>
            AdCraft <span className="text-gradient-static">AI</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" onClick={() => navigate("/auth")} className="hidden sm:inline-flex">
              Sign in
            </Button>
            <Button variant="gradient" onClick={() => navigate("/auth")}>
              Get started <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ─────────────── Hero ─────────────── */}
      <section className="relative pt-28 pb-24 md:pt-36 md:pb-28">
        <div aria-hidden className="absolute inset-0 bg-gradient-mesh opacity-90 mesh-drift" />
        <div aria-hidden className="absolute inset-0 bg-block-print opacity-50" />
        <div aria-hidden className="pointer-events-none absolute -top-40 -right-32 parallax-med">
          <div className="w-[36rem] h-[36rem] rounded-full bg-primary/25 blur-3xl animate-blob" />
        </div>
        <div aria-hidden className="pointer-events-none absolute -bottom-48 -left-40 parallax-slow">
          <div className="w-[36rem] h-[36rem] rounded-full bg-tertiary/20 blur-3xl animate-blob [animation-delay:4s]" />
        </div>

        <div className="relative container mx-auto max-w-6xl px-4">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-14 items-center">
            {/* Left: copy */}
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur border border-border shadow-card text-xs font-semibold text-foreground/80 ring-1 ring-primary/10">
                <span className="relative inline-flex">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span aria-hidden className="absolute inset-0 rounded-full bg-success animate-ping" />
                </span>
                {copy.madeFor}
              </div>

              <h1 className="mt-5 font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight text-balance">
                {copy.heroLine1}
                <span className="block">
                  <GradientText animated>{copy.heroLine2}</GradientText>
                </span>
              </h1>

              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl text-pretty">
                Snap a photo of your product. AdCraft AI writes the description, designs the post,
                and gets it ready for Instagram, Facebook & WhatsApp — in seconds.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <MagneticButton strength={0.28}>
                  <Button variant="gradient" size="xl" onClick={() => navigate("/auth")} className="sheen">
                    <Sparkles className="w-5 h-5" /> Start free
                  </Button>
                </MagneticButton>
                <MagneticButton strength={0.18}>
                  <Button variant="outline" size="xl" onClick={() => navigate("/generate/description")}>
                    <Camera className="w-5 h-5" /> Try with a photo
                  </Button>
                </MagneticButton>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-success" /> Free to start
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> Ready in seconds
                </div>
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-accent" /> 12 Indian languages
                </div>
              </div>

              {/* Inline trust */}
              <div className="mt-10 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <span
                      key={i}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-marigold ring-2 ring-background text-primary-foreground text-xs font-bold"
                      style={{ filter: `hue-rotate(${i * 18}deg)` }}
                    >
                      {String.fromCharCode(64 + i)}
                    </span>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-foreground/70 mt-0.5">
                    <strong className="text-foreground">12,400+</strong> creators trust AdCraft
                  </p>
                </div>
              </div>
            </div>

            {/* Right: hero showcase */}
            <div className="relative animate-fade-up [animation-delay:120ms]">
              <div aria-hidden className="absolute -inset-8 bg-gradient-warm opacity-25 blur-3xl rounded-[3rem]" />
              <div className="relative">
                {/* Phone-style frame */}
                <div className="relative rounded-[2.5rem] overflow-hidden border border-border bg-card shadow-elevated">
                  <img
                    src={heroImage}
                    alt="Indian artisan products styled for online catalogue"
                    className="w-full aspect-[4/5] object-cover"
                    loading="eager"
                  />
                  {/* Top floating chip */}
                  <div className="absolute top-5 left-5 px-3 py-2 rounded-2xl bg-card/95 backdrop-blur shadow-soft border border-border/60 text-xs font-semibold flex items-center gap-2 animate-float-slow">
                    <span className="w-7 h-7 rounded-lg bg-primary/15 inline-flex items-center justify-center">
                      <Camera className="w-3.5 h-3.5 text-primary" />
                    </span>
                    <span>
                      Photo uploaded
                      <span className="block text-[10px] font-medium text-muted-foreground">Original · enhanced</span>
                    </span>
                  </div>
                  {/* Right floating chip */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-5 px-3 py-2 rounded-2xl bg-card/95 backdrop-blur shadow-soft border border-border/60 text-xs font-semibold flex items-center gap-2 animate-float-slow [animation-delay:1s] hidden md:flex">
                    <span className="w-7 h-7 rounded-lg bg-tertiary/15 inline-flex items-center justify-center">
                      <Wand2 className="w-3.5 h-3.5 text-tertiary" />
                    </span>
                    <span>
                      Title written
                      <span className="block text-[10px] font-medium text-muted-foreground">AI · 0.8s</span>
                    </span>
                  </div>
                  {/* Bottom floating chip */}
                  <div className="absolute bottom-6 right-5 px-3 py-2 rounded-2xl bg-card/95 backdrop-blur shadow-soft border border-border/60 text-xs font-semibold flex items-center gap-2 animate-float-slow [animation-delay:2s]">
                    <span className="w-7 h-7 rounded-lg bg-success/15 inline-flex items-center justify-center">
                      <Share2 className="w-3.5 h-3.5 text-success" />
                    </span>
                    <span>
                      Caption ready
                      <span className="block text-[10px] font-medium text-muted-foreground">IG · FB · WA</span>
                    </span>
                  </div>
                </div>

                {/* Pinned bottom card — "social preview" */}
                <div className="absolute -bottom-7 -left-6 right-12 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/60 shadow-elevated p-3.5 hidden sm:flex items-center gap-3 animate-fade-up [animation-delay:400ms]">
                  <div className="w-12 h-12 rounded-xl bg-gradient-marigold flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight">Reach this week</p>
                    <p className="text-xs text-muted-foreground">+243% vs. last week</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold leading-none">
                      <CountUp value={4827} />
                    </p>
                    <p className="text-[10px] text-success font-medium uppercase tracking-wider">live</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── Trust marquee ─────────────── */}
      <section data-reveal className="border-y border-border/60 bg-muted/30 py-6">
        <Marquee>
          {[
            "Made in India",
            "Used by Artisans",
            "12 Indian Languages",
            "Instagram Ready",
            "WhatsApp Ready",
            "Amazon · Flipkart · Meesho",
            "No design skills needed",
            "Voice + Photo",
          ].map((t) => (
            <span key={t} className="text-sm font-semibold text-muted-foreground inline-flex items-center gap-3">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> {t}
            </span>
          ))}
        </Marquee>
      </section>

      {/* ─────────────── Stat strip ─────────────── */}
      <section className="py-14 px-4">
        <div className="container mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { v: 12400, l: "Creators onboard", suffix: "+" },
            { v: 78000, l: "Listings created", suffix: "+" },
            { v: 243,   l: "Avg reach lift", suffix: "%" },
            { v: 12,    l: "Indian languages", suffix: "" },
          ].map((s, i) => (
            <div
              key={s.l}
              data-reveal="rise"
              style={{ ["--reveal-delay" as any]: `${i * 90}ms` }}
              className="rounded-2xl bg-card border border-border/60 p-5 shadow-card hover-lift"
            >
              <p className="font-display text-3xl md:text-4xl font-bold leading-none">
                <GradientText><CountUp value={s.v} /></GradientText><span className="text-primary">{s.suffix}</span>
              </p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-2">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────── How it works ─────────────── */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div data-reveal className="text-center mb-16 max-w-2xl mx-auto">
            <SectionEyebrow className="justify-center">How it works</SectionEyebrow>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-balance">
              {copy.howItWorks}
            </h2>
            <p className="text-lg text-muted-foreground">
              No tech skills needed. Just your phone, your product, and one tap.
            </p>
          </div>

          <div className="relative grid md:grid-cols-3 gap-6">
            {/* Connecting line on desktop */}
            <div aria-hidden className="hidden md:block absolute top-16 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            {[
              { step: "1", icon: Camera, title: "Take a photo", desc: "Snap your product with any phone camera. Even a basic one." },
              { step: "2", icon: Sparkles, title: "AI does the magic", desc: "Get titles, descriptions, captions and hashtags — instantly." },
              { step: "3", icon: Share2, title: "Post & sell", desc: "Share to Instagram, Facebook or WhatsApp directly from the app." },
            ].map(({ step, icon: Icon, title, desc }, i) => (
              <div
                key={step}
                data-reveal={i === 1 ? "rise" : i === 0 ? "left" : "right"}
                style={{ ["--reveal-delay" as any]: `${i * 140}ms` }}
              >
                <Spotlight
                  tilt
                  maxTilt={5}
                  className="relative rounded-3xl bg-card border-2 border-border/70 shadow-card p-7 h-full"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="halo-ring relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-marigold shadow-soft">
                      <Icon className="w-6 h-6 text-primary-foreground" strokeWidth={2.2} />
                      <span aria-hidden className="absolute -inset-1 rounded-2xl ring-1 ring-primary/20" />
                    </span>
                    <span className="font-display text-5xl font-bold text-primary/15 leading-none">{step}</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2">{title}</h3>
                  <p className="text-muted-foreground text-pretty">{desc}</p>
                </Spotlight>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── Feature bento ─────────────── */}
      <section className="py-20 px-4 bg-muted/30 border-y border-border/60 relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="relative container mx-auto max-w-6xl">
          <div data-reveal className="text-center mb-14 max-w-2xl mx-auto">
            <SectionEyebrow className="justify-center">Everything you need</SectionEyebrow>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-balance">
              One studio. <GradientText>Every channel.</GradientText>
            </h2>
          </div>

          <div className="grid md:grid-cols-6 gap-5">
            {/* Big card 1 */}
            <Spotlight
              tilt
              maxTilt={4}
              data-reveal="left"
              className="md:col-span-3 rounded-3xl border-2 border-border/70 bg-card overflow-hidden shadow-card"
            >
              <div className="p-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5 ring-1 ring-primary/15">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-2">Product Listings</h3>
                <p className="text-muted-foreground mb-5">
                  Catchy titles, SEO-friendly descriptions, smart tags — written for you in your tone.
                </p>
                <ul className="space-y-2.5 text-sm">
                  {["Catchy product titles", "Search-friendly descriptions", "Smart category & tags"].map((t) => (
                    <li key={t} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-success" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Spotlight>

            {/* Big card 2 — indigo */}
            <div
              data-reveal="right"
              style={{ ["--reveal-delay" as any]: "120ms" }}
              className="md:col-span-3 rounded-3xl border-2 border-border/70 bg-gradient-indigo text-primary-foreground overflow-hidden shadow-card hover-lift relative group"
            >
              <div aria-hidden className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-primary/20 blur-2xl group-hover:scale-150 transition-transform duration-700 ease-out" />
              <div className="relative p-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 mb-5 ring-1 ring-white/20">
                  <Megaphone className="w-7 h-7" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-2">Marketing Campaigns</h3>
                <p className="text-primary-foreground/85 mb-5">
                  Captions, hashtags, WhatsApp messages & creative images — ready to post.
                </p>
                <ul className="space-y-2.5 text-sm text-primary-foreground/90">
                  {["Engaging social captions", "Trending hashtags", "WhatsApp selling messages"].map((t) => (
                    <li key={t} className="flex items-center gap-2.5">
                      <span className="inline-flex w-4 h-4 rounded-full bg-white/20 items-center justify-center">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Small cards */}
            {[
              { icon: ShoppingBag, t: "Ecommerce Ready", d: "SEO listings + CSV for Amazon, Flipkart & Meesho.", tone: "accent" as const },
              { icon: Mic, t: "Voice Mode", d: "Speak in your language — get a finished post.", tone: "tertiary" as const },
              { icon: Globe2, t: "12 Indian Languages", d: "Hindi · Tamil · Telugu · Marathi · and 8 more.", tone: "primary" as const },
            ].map(({ icon: Icon, t, d, tone }, i) => {
              const c = tone === "accent" ? "text-accent bg-accent/10 ring-accent/15"
                : tone === "tertiary" ? "text-tertiary bg-tertiary/10 ring-tertiary/15"
                : "text-primary bg-primary/10 ring-primary/15";
              return (
                <Spotlight
                  key={t}
                  tilt
                  maxTilt={6}
                  data-reveal="rise"
                  style={{ ["--reveal-delay" as any]: `${i * 100 + 200}ms` }}
                  className="md:col-span-2 rounded-3xl border-2 border-border/70 bg-card overflow-hidden shadow-card"
                >
                  <div className="p-6">
                    <div className={cn("inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 ring-1", c)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display text-lg font-bold mb-1">{t}</h3>
                    <p className="text-sm text-muted-foreground text-pretty">{d}</p>
                  </div>
                </Spotlight>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────── Testimonials ─────────────── */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div data-reveal className="text-center mb-14 max-w-2xl mx-auto">
            <SectionEyebrow className="justify-center">Loved by creators</SectionEyebrow>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-balance">
              From local sellers to <GradientText>online stars</GradientText>.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { q: "Pehli baar mera Insta page Reels viral hue. AdCraft ke captions kamaal ke hain!", n: "Priya R.", r: "Handloom · Varanasi" },
              { q: "WhatsApp orders doubled in two weeks. I just took a photo and posted what it gave me.", n: "Suresh M.", r: "Spices · Chennai" },
              { q: "Sirf ek photo daali, full Amazon listing tayyar — title, bullets, category sab.", n: "Anita G.", r: "Home decor · Jaipur" },
            ].map((t, i) => (
              <div
                key={t.n}
                data-reveal={i === 0 ? "left" : i === 2 ? "right" : "rise"}
                style={{ ["--reveal-delay" as any]: `${i * 120}ms` }}
                className="relative rounded-3xl border border-border/70 bg-card p-7 shadow-card hover-lift group"
              >
                <Quote aria-hidden className="absolute -top-3 -left-3 w-8 h-8 text-primary/30 group-hover:text-primary/60 transition-colors duration-300" />
                <div className="flex items-center gap-0.5 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-foreground/90 leading-relaxed">"{t.q}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-marigold text-primary-foreground font-bold">
                    {t.n.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold leading-tight">{t.n}</p>
                    <p className="text-xs text-muted-foreground">{t.r}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── Benefits row ─────────────── */}
      <section className="py-14 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Heart, title: "Made for Indian creators", desc: "Designed for artisans, homepreneurs and local sellers." },
              { icon: Rocket, title: "Fast & simple", desc: "Professional content in seconds — no design skills needed." },
              { icon: TrendingUp, title: "Sell more", desc: "Reach customers on Instagram, Facebook and WhatsApp." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                data-reveal="scale"
                style={{ ["--reveal-delay" as any]: `${i * 130}ms` }}
                className="space-y-4 group"
              >
                <div className="halo-ring w-16 h-16 rounded-2xl bg-gradient-marigold flex items-center justify-center mx-auto shadow-soft  group-hover:scale-110 transition-transform duration-500 ease-out">
                  <Icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold">{title}</h3>
                <p className="text-muted-foreground text-pretty max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── CTA ─────────────── */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div data-reveal="scale" className="relative overflow-hidden rounded-[2.5rem] bg-gradient-marigold p-10 md:p-16 text-center shadow-elevated bg-noise">
            <div aria-hidden className="absolute -top-20 -right-20 w-72 h-72 bg-primary-foreground/15 rounded-full blur-3xl animate-blob" />
            <div aria-hidden className="absolute -bottom-20 -left-20 w-72 h-72 bg-accent/30 rounded-full blur-3xl animate-blob [animation-delay:6s]" />
            <div aria-hidden className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-[2.5rem]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-primary-foreground text-xs font-semibold mb-5 backdrop-blur">
                <Sparkles className="w-3.5 h-3.5" /> Free to start
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-primary-foreground text-balance">
                {copy.startToday}
              </h2>
              <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Thousands of creators are already growing their business with AdCraft AI.
              </p>
              {/* <MagneticButton strength={0.3}> */}
                <Button
                  size="xl"
                  variant="secondary"
                  onClick={() => navigate("/auth")}
                  className="shadow-soft sheen bg-card hover:bg-card text-foreground"
                >
                  <Sparkles className="w-5 h-5" /> Create free account
                  <ArrowRight className="w-4 h-4" />
                </Button>
              {/* </MagneticButton> */}
              <p className="mt-4 text-sm text-primary-foreground/80">
                No credit card needed · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── Footer ─────────────── */}
      <footer data-reveal className="py-12 px-4 border-t border-border/60 bg-card/40">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 font-display text-xl font-bold mb-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-marigold shadow-soft">
                  <Sparkles className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
                </span>
                AdCraft <span className="text-gradient-static">AI</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                The fastest way for Indian creators to turn a product photo into a sale.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/80 mb-3">Product</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a className="hover:text-foreground transition-colors" href="#">Listings</a></li>
                <li><a className="hover:text-foreground transition-colors" href="#">Campaigns</a></li>
                <li><a className="hover:text-foreground transition-colors" href="#">Voice Mode</a></li>
                <li><a className="hover:text-foreground transition-colors" href="#">Analytics</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/80 mb-3">Company</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a className="hover:text-foreground transition-colors" href="#">About</a></li>
                <li><a className="hover:text-foreground transition-colors" href="#">Privacy</a></li>
                <li><a className="hover:text-foreground transition-colors" href="#">Terms</a></li>
                <li><a className="hover:text-foreground transition-colors" href="#">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>© 2026 AdCraft AI · Empowering Indian creators.</p>
            <p className="inline-flex items-center gap-1.5">
              Made with <Heart className="w-3.5 h-3.5 fill-tertiary text-tertiary" /> in India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
