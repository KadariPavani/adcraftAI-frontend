import { useState } from "react";
import { Mic } from "lucide-react";
import { VoiceAssistant } from "./VoiceAssistant";
import { primeSpeech } from "@/lib/voiceEngine";
import { cn } from "@/lib/utils";

export function VoiceFAB({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => { primeSpeech(); setOpen(true); }}
        aria-label="Open voice assistant"
        className={cn(
          "group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 pl-3.5 pr-5 h-14 rounded-full bg-gradient-marigold text-primary-foreground font-bold shadow-float transition-all duration-300 hover:shadow-glow-lg hover:-translate-y-1 active:scale-95 ring-1 ring-white/30",
          className,
        )}
      >
        <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-foreground/20">
          <Mic className="w-5 h-5" />
          <span aria-hidden className="absolute inset-0 rounded-full ring-2 ring-primary-foreground/40 animate-pulse-ring" />
          <span aria-hidden className="absolute inset-0 rounded-full ring-2 ring-primary-foreground/30 animate-pulse-ring [animation-delay:0.6s]" />
        </span>
        <span className="hidden sm:inline tracking-wide">Voice</span>
      </button>
      <VoiceAssistant open={open} onClose={() => setOpen(false)} />
    </>
  );
}
