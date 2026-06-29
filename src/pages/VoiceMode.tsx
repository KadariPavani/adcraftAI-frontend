import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { primeSpeech } from "@/lib/voiceEngine";
import { Mic, Languages, Upload, Check, Sparkles, Waves } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GradientText, SectionEyebrow, Spotlight } from "@/components/ui/premium";

export default function VoiceMode() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate("/auth");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16 relative">
        <div aria-hidden className="absolute inset-0 bg-gradient-mesh opacity-50 -z-10" />
        <div aria-hidden className="pointer-events-none absolute top-20 -left-32 w-[28rem] h-[28rem] rounded-full bg-primary/20 blur-3xl animate-blob -z-10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-32 w-[28rem] h-[28rem] rounded-full bg-tertiary/20 blur-3xl animate-blob [animation-delay:4s] -z-10" />

        <div className="max-w-3xl mx-auto text-center space-y-10">
          <div className="animate-fade-up">
            <SectionEyebrow className="justify-center">Voice Mode</SectionEyebrow>

            {/* Mic */}
            <div className="relative inline-flex items-center justify-center mt-2 mb-7">
              <span aria-hidden className="absolute w-44 h-44 rounded-full bg-primary/15 animate-pulse-ring" />
              <span aria-hidden className="absolute w-32 h-32 rounded-full bg-primary/20 animate-pulse-ring [animation-delay:0.6s]" />
              <span className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-marigold shadow-elevated">
                <Mic className="w-12 h-12 text-primary-foreground" strokeWidth={2.2} />
                <span aria-hidden className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/30" />
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-bold leading-[1.05] text-balance">
              Just talk. We'll <GradientText>do the rest.</GradientText>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mt-5">
              Bina padhe-likhe bhi product list karein. Apni bhasha mein boliye — Hindi ya English.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="gradient" size="xl" className="sheen" onClick={() => { primeSpeech(); setOpen(true); }}>
                <Mic className="w-6 h-6" /> Start Voice Mode
              </Button>
              <Button variant="outline" size="xl" onClick={() => navigate("/generate/description")}>
                <Sparkles className="w-5 h-5" /> Use a Photo instead
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 stagger-children">
            {[
              { icon: Mic, title: "Speak", desc: "Tap mic and tell us what you want." },
              { icon: Upload, title: "Upload Photo", desc: "From phone or click a picture." },
              { icon: Check, title: "Done", desc: "Product saved automatically." },
            ].map((s, i) => (
              <Spotlight key={i} className="rounded-3xl bg-card border-2 border-border/70 shadow-card p-6 text-left hover-lift">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 ring-1 ring-primary/15 text-primary">
                    <s.icon className="w-5 h-5" />
                  </span>
                  <span className="font-display text-4xl font-bold text-primary/15">{i + 1}</span>
                </div>
                <h3 className="font-display text-lg font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </Spotlight>
            ))}
          </div>

          <div className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full border border-border bg-card">
              <Languages className="w-4 h-4 text-primary" /> English (India) · Hindi
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full border border-border bg-card">
              <Waves className="w-4 h-4 text-accent" /> Low-data friendly
            </span>
          </div>
        </div>
      </main>

      <VoiceAssistant open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
