import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Mic, MicOff, Sparkles, X, Loader2, Languages, Package, Volume2, VolumeX,
  ArrowLeft, Send, ImageIcon, Bot, User as UserIcon, Wand2, Check, Wand,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  speak, stopSpeaking, listen, getSpeechRecognition, isSpeechSynthesisSupported, primeSpeech,
  isYes, isNo, type VoiceLang,
} from "@/lib/voiceEngine";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

interface VoiceAssistantProps {
  open: boolean;
  onClose: () => void;
}

type Stage =
  | "awaiting_first"   // greeted, waiting for user's first input
  | "awaiting_more"    // got some info, asking for details
  | "generating"       // calling generate-content
  | "review"           // showing generated listing, waiting for confirm
  | "saving"           // inserting to DB
  | "done";

interface Msg { id: string; role: "user" | "assistant"; content: string; image?: string; }
interface Generated { title: string; short: string; long: string; category: string; tags: string[]; }

const COPY = {
  "en-IN": {
    title: "AI Voice Assistant",
    subtitle: "Talk or type — I'll guide you",
    placeholder: "Type your reply, or tap the mic to speak…",
    listening: "Listening…",
    photoAdded: "Photo added",
    thinking: "Thinking…",
    generating: "Crafting your listing…",
    saving: "Saving to your library…",
    library: "View library",
    another: "Add another",
    saveBtn: "Save to library",
    keepEditing: "Make changes",
    enhanceBtn: "Enhance",
    enhancing: "Enhancing your photo — this takes about 10 seconds…",
    enhanceDone: "Here's the enhanced photo. How does it look?",
    enhanceFail: "Sorry, couldn't enhance the photo. We can still use the original.",
    enhanceNoPhoto: "Add a photo first, then I can enhance it.",
    notSupportedHeader: "Voice input isn't available on this browser",
    notSupportedBody: "Don't worry — you can still type, and I'll still talk back to you.",
    welcome: "Namaste! I am AdCraft, your AI assistant. Tell me about your product, or add a photo, and I will help you create a listing.",
    askMore: (note: string) => `Got it — ${shortify(note)}. Tell me one more thing: what's it made of, or what makes it special?`,
    photoAck: "Nice photo! Want me to enhance it, or shall I write the listing now? Just tell me what you'd like.",
    photoAckHaveText: "Great photo! That helps a lot. Let me put it all together now.",
    generateAck: "Perfect, that's plenty. Let me write your listing now…",
    present: (title: string) => `Here's what I made. The title is: ${title}. Should I save it to your library?`,
    askChange: "No problem — what would you like to change?",
    saved: "Saved! Your product is now in your library.",
    saveFail: "Sorry, I couldn't save it. Want to try again?",
    genFail: "Sorry, I couldn't write the listing. Tell me a little more and let's try again.",
    confused: "Sorry, I didn't catch that. Could you say it again?",
  },
  "hi-IN": {
    title: "AI Voice Assistant",
    subtitle: "Bolkar ya likh kar baat kijiye",
    placeholder: "Apna jawab likhein, ya mic dabaayein…",
    listening: "Sun raha hoon…",
    photoAdded: "Photo add ho gayi",
    thinking: "Soch raha hoon…",
    generating: "Aapki listing bana raha hoon…",
    saving: "Library mein save ho raha hai…",
    library: "Library dekhein",
    another: "Naya product",
    saveBtn: "Save karein",
    keepEditing: "Aur badlein",
    enhanceBtn: "Enhance karein",
    enhancing: "Photo enhance kar raha hoon — 10 second lagega…",
    enhanceDone: "Yeh rahi enhanced photo. Kaisi lagi?",
    enhanceFail: "Maaf kijiye, photo enhance nahi ho payi. Original use kar sakte hain.",
    enhanceNoPhoto: "Pehle photo add kijiye, fir enhance kar dunga.",
    notSupportedHeader: "Is browser par voice input available nahi hai",
    notSupportedBody: "Koi baat nahi — aap type kar sakte hain, main fir bhi bolunga.",
    welcome: "Namaste! Main AdCraft hoon, aapka AI assistant. Apne product ke baare mein bataiye, ya photo add kijiye — main listing bana dunga.",
    askMore: (note: string) => `Theek hai — ${shortify(note)}. Ek baat aur bataiye: yeh kis cheez ka bana hai, ya kya khaas hai?`,
    photoAck: "Sundar photo! Enhance karoon ya listing bana doon? Bataiye.",
    photoAckHaveText: "Bahut accha! Photo aur details mil gayi. Listing bana raha hoon.",
    generateAck: "Bahut accha! Listing bana raha hoon…",
    present: (title: string) => `Yeh dekhiye maine kya banaya. Title hai: ${title}. Library mein save kar doon?`,
    askChange: "Koi baat nahi — kya badalna chahte hain?",
    saved: "Save ho gaya! Aapka product ab library mein hai.",
    saveFail: "Maaf kijiye, save nahi ho paya. Phir koshish karein?",
    genFail: "Maaf kijiye, listing nahi ban payi. Thoda aur bataiye aur phir try karenge.",
    confused: "Maaf kijiye, samajh nahi aaya. Phir se boliye.",
  },
} as const;

// Words/phrases that signal "please enhance my photo"
const ENHANCE_WORDS = [
  "enhance", "improve", "better", "brighten", "brighter", "sharpen", "sharper",
  "clean up", "cleanup", "background", "fix the photo", "fix photo", "fix image",
  "make it look", "professional photo", "edit the photo", "edit photo", "retouch",
  // Hindi (Latin)
  "behtar", "saaf", "sundar banaiye", "sundar banao", "theek karo", "background",
  "photo theek", "image theek", "saaf karo", "achi karo", "enhance karo", "enhance kijiye",
];

// Does this message want the photo enhanced?
function wantsEnhance(text: string): boolean {
  const lower = ` ${text.toLowerCase().replace(/[.,!?;:'"()]/g, " ").replace(/\s+/g, " ")} `;
  return ENHANCE_WORDS.some((w) => lower.includes(` ${w} `) || lower.includes(` ${w}.`) || lower.includes(`${w} `));
}

// Extract a custom enhancement instruction beyond the trigger word
function enhanceInstruction(text: string): string | undefined {
  const t = text.trim();
  // Look for "make ___" or "change ___ to ___" patterns
  const m = t.match(/(?:make|change|set|use|with)\s+(.+?)(?:[.!?]|$)/i);
  if (m && m[1] && m[1].length < 120) return m[1].trim();
  if (t.length > 12 && t.length < 200) return t;
  return undefined;
}

// Shorten user input for echoing back ("got it — leather wallet…")
function shortify(s: string): string {
  const cleaned = s.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 40) return cleaned;
  return cleaned.slice(0, 40).replace(/\s\S*$/, "") + "…";
}

// Heuristic: does the input have enough detail to skip the follow-up?
function looksDetailed(text: string): boolean {
  const t = text.trim();
  if (t.length >= 60) return true;
  // Has multiple comma-separated descriptors or "and" connectives
  const descriptors = t.split(/[,;]|\sand\s/).filter((s) => s.trim().length > 2);
  if (descriptors.length >= 2) return true;
  return false;
}

const uuid = () => `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export function VoiceAssistant({ open, onClose }: VoiceAssistantProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lang, setLang] = useState<VoiceLang>("en-IN");
  const [muted, setMuted] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [stage, setStage] = useState<Stage>("awaiting_first");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [productNote, setProductNote] = useState("");
  const [generated, setGenerated] = useState<Generated | null>(null);

  // The image we'll use for generation/saving (enhanced beats original)
  const activeImage = enhancedImage || originalImage;

  // Refs so async callbacks always see the latest image — avoids stale-closure bugs
  // when user uploads + types in the same tick.
  const originalImageRef = useRef<string | null>(null);
  const enhancedImageRef = useRef<string | null>(null);
  useEffect(() => { originalImageRef.current = originalImage; }, [originalImage]);
  useEffect(() => { enhancedImageRef.current = enhancedImage; }, [enhancedImage]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stopListenRef = useRef<(() => void) | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const t = COPY[lang];
  const speechRecogSupported = !!getSpeechRecognition();
  const speechSynthSupported = isSpeechSynthesisSupported();

  // Reset on close
  useEffect(() => {
    if (!open) {
      stopSpeaking();
      stopListenRef.current?.();
      setIsListening(false);
      setPartial("");
    }
  }, [open]);

  // Initial open: greet
  useEffect(() => {
    if (!open) return;
    setStage("awaiting_first");
    setInput("");
    setOriginalImage(null);
    setEnhancedImage(null);
    setIsEnhancing(false);
    setProductNote("");
    setGenerated(null);

    const greeting: Msg = { id: uuid(), role: "assistant", content: t.welcome };
    setMessages([greeting]);
    if (!muted && speechSynthSupported) {
      primeSpeech();
      void speak(greeting.content, { lang });
    }
    void track("voice_assistant_opened", { lang });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lang]);

  // Auto-scroll
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, stage]);

  const speakIfAllowed = (text: string) => {
    if (muted || !speechSynthSupported) return;
    void speak(text, { lang });
  };

  const addAssistant = (content: string): Msg => {
    const msg: Msg = { id: uuid(), role: "assistant", content };
    setMessages((prev) => [...prev, msg]);
    speakIfAllowed(content);
    return msg;
  };

  const addUser = (content: string, image?: string): Msg => {
    const msg: Msg = { id: uuid(), role: "user", content, image };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  // ── Enhance image ─────────────────────────────────────────
  const runEnhance = async (customPrompt?: string, overrideImage?: string) => {
    // Prefer explicit override (from same-tick upload), then ref (latest state), then current closure
    const baseImage =
      overrideImage ?? enhancedImageRef.current ?? originalImageRef.current ?? enhancedImage ?? originalImage;
    if (!baseImage) {
      addAssistant(t.enhanceNoPhoto);
      return;
    }
    if (isEnhancing) return;
    setIsEnhancing(true);
    addAssistant(t.enhancing);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-image", {
        body: { imageData: baseImage, customPrompt: customPrompt?.trim() || undefined },
      });
      if (error) throw error;
      if (!data?.enhancedImage) throw new Error("No image returned");
      setEnhancedImage(data.enhancedImage);
      enhancedImageRef.current = data.enhancedImage; // sync ref immediately
      // Show enhanced result as an assistant chat bubble (with the new image)
      const msg: Msg = { id: uuid(), role: "assistant", content: t.enhanceDone, image: data.enhancedImage };
      setMessages((prev) => [...prev, msg]);
      speakIfAllowed(t.enhanceDone);
      void track("voice_image_enhanced", { custom: !!customPrompt });
    } catch (err: any) {
      addAssistant(t.enhanceFail);
      toast({ title: "Enhance failed", description: err.message, variant: "destructive" });
    } finally {
      setIsEnhancing(false);
    }
  };

  // ── Send user message ─────────────────────────────────────
  const sendMessage = async (text: string, attachedImage?: string) => {
    const trimmed = text.trim();
    if (!trimmed && !attachedImage) return;
    setInput("");

    // ─ Enhance intent at any stage (works before/after generation) ─
    if (trimmed && wantsEnhance(trimmed) && (originalImage || attachedImage)) {
      addUser(trimmed, attachedImage);
      // If they uploaded a fresh photo with the enhance request, set it first
      if (attachedImage && !originalImage) {
        setOriginalImage(attachedImage);
        originalImageRef.current = attachedImage; // sync ref immediately
      }
      await runEnhance(enhanceInstruction(trimmed), attachedImage);
      return;
    }

    // ─ Review stage: yes/no for save ─
    if (stage === "review") {
      addUser(trimmed);
      if (isYes(trimmed)) {
        await runSave();
        return;
      }
      if (isNo(trimmed)) {
        setStage("awaiting_more");
        addAssistant(t.askChange);
        return;
      }
      // Default treat as feedback — regenerate with combined info
      const combined = `${productNote}. Additional notes: ${trimmed}`;
      setProductNote(combined);
      addAssistant(t.generateAck);
      await runGenerate(combined);
      return;
    }

    // Make sure the ref is fresh before we run async ops
    if (attachedImage) {
      originalImageRef.current = attachedImage;
      if (!originalImage) setOriginalImage(attachedImage);
    }

    // ─ Awaiting first input ─
    if (stage === "awaiting_first") {
      addUser(trimmed || "(photo)", attachedImage);
      const merged = [productNote, trimmed].filter(Boolean).join(". ").trim();
      setProductNote(merged);

      // If user uploaded a photo as their first turn and gave any text — generate
      if (attachedImage && trimmed) {
        addAssistant(t.photoAckHaveText);
        await runGenerate(merged, attachedImage);
        return;
      }
      // Photo only — ask for description
      if (attachedImage && !trimmed) {
        setStage("awaiting_more");
        addAssistant(t.photoAck);
        return;
      }
      // Text only — if detailed enough, generate; else ask for one more thing
      if (looksDetailed(merged)) {
        addAssistant(t.generateAck);
        await runGenerate(merged);
      } else {
        setStage("awaiting_more");
        addAssistant(t.askMore(merged));
      }
      return;
    }

    // ─ Awaiting more details ─
    if (stage === "awaiting_more") {
      addUser(trimmed || "(photo)", attachedImage);
      const merged = [productNote, trimmed].filter(Boolean).join(". ").trim();
      setProductNote(merged);
      addAssistant(t.generateAck);
      await runGenerate(merged, attachedImage);
      return;
    }

    // ─ Done stage: not expecting input ─
    if (stage === "done") {
      addUser(trimmed);
      addAssistant(lang === "hi-IN" ? "Naya product banana hai? Niche se shuru karein." : "Want to create another? Tap 'Add another' below.");
      return;
    }
  };

  // ── Generation ────────────────────────────────────────────
  const runGenerate = async (note: string, overrideImage?: string) => {
    setStage("generating");
    // Always prefer the freshest enhanced > original
    const imageToUse =
      overrideImage ?? enhancedImageRef.current ?? originalImageRef.current ?? activeImage;
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { type: "description", productInfo: note || "a handcrafted product", imageData: imageToUse },
      });
      if (error) throw error;
      const c = data.content || {};
      const g: Generated = {
        title: c.title || "",
        short: c.short_description || "",
        long: c.long_description || "",
        category: c.category || "",
        tags: c.tags || [],
      };
      setGenerated(g);
      setStage("review");
      addAssistant(t.present(g.title));
      void track("voice_listing_generated", {});
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      setStage("awaiting_more");
      addAssistant(t.genFail);
    }
  };

  // ── Save ──────────────────────────────────────────────────
  const runSave = async () => {
    if (!generated) return;
    setStage("saving");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // Read from refs to guarantee we get the freshest enhanced image,
      // even if save was triggered in the same tick the enhance finished.
      const orig = originalImageRef.current ?? originalImage;
      const enh = enhancedImageRef.current ?? enhancedImage;

      const { error } = await supabase.from("products").insert({
        user_id: user.id,
        title: generated.title || "Untitled product",
        short_description: generated.short || null,
        long_description: generated.long || null,
        category: generated.category || null,
        tags: generated.tags.length ? generated.tags : null,
        // If we have an enhanced version, store it as the primary image too —
        // the catalog gallery prefers enhanced_image_url(s) but some legacy
        // surfaces read image_url directly.
        image_url: enh || orig,
        enhanced_image_url: enh || null,
      });
      if (error) throw error;
      setStage("done");
      addAssistant(enh ? `${t.saved} (with enhanced photo)` : t.saved);
      void track("voice_product_saved", { category: generated.category, enhanced: !!enh });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
      setStage("review");
      addAssistant(t.saveFail);
    }
  };

  // ── STT ───────────────────────────────────────────────────
  const toggleListening = () => {
    if (!speechRecogSupported) return;
    if (isListening) {
      stopListenRef.current?.();
      setIsListening(false);
      return;
    }
    stopSpeaking(); // Don't talk over the user
    setIsListening(true);
    setPartial("");
    stopListenRef.current = listen({
      lang,
      onPartial: (s) => setPartial(s),
      onResult: (final) => {
        setPartial("");
        void sendMessage(final);
      },
      onEnd: () => { setIsListening(false); setPartial(""); },
      onError: (e) => {
        setIsListening(false);
        setPartial("");
        if (e === "mic-permission-denied") {
          toast({ title: "Microphone access denied", description: "Allow microphone access in browser settings.", variant: "destructive" });
        } else if (e !== "no-speech" && e !== "aborted") {
          toast({ title: "Mic error", description: e, variant: "destructive" });
        }
      },
    });
  };

  // ── Image upload ──────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setOriginalImage(dataUrl);
      // If user already typed something in the composer, send it together with the photo
      const pending = input.trim();
      void sendMessage(pending, dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // allow re-upload of same file
  };

  // ── Reset for "Add another" ───────────────────────────────
  const restart = () => {
    setStage("awaiting_first");
    setMessages([{ id: uuid(), role: "assistant", content: t.welcome }]);
    setInput("");
    setOriginalImage(null);
    setEnhancedImage(null);
    setIsEnhancing(false);
    setProductNote("");
    setGenerated(null);
    speakIfAllowed(t.welcome);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  if (!open) return null;

  const showInputBar = stage !== "done" && stage !== "generating" && stage !== "saving";
  const isWorking = stage === "generating" || stage === "saving";

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => { stopSpeaking(); stopListenRef.current?.(); onClose(); }}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-muted hover:bg-muted/70 transition-colors shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-marigold shadow-soft shrink-0">
            <Bot className="w-5 h-5 text-primary-foreground" />
            {isWorking && (
              <span aria-hidden className="absolute inset-0 rounded-xl ring-2 ring-primary/40 animate-pulse-ring" />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-display font-bold text-base truncate">{t.title}</p>
            <p className="text-xs text-muted-foreground truncate">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => { stopSpeaking(); setLang((l) => l === "en-IN" ? "hi-IN" : "en-IN"); }}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-muted text-xs font-medium hover:bg-muted/70 transition-colors"
            aria-label="Toggle language"
          >
            <Languages className="w-4 h-4" />
            {lang === "en-IN" ? "EN" : "हिं"}
          </button>
          {speechSynthSupported && (
            <button
              onClick={() => {
                if (muted) {
                  primeSpeech();
                  setMuted(false);
                  const last = [...messages].reverse().find((m) => m.role === "assistant");
                  if (last) void speak(last.content, { lang });
                } else {
                  stopSpeaking();
                  setMuted(true);
                }
              }}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-muted hover:bg-muted/70 transition-colors"
              aria-label={muted ? "Unmute and replay" : "Mute"}
              title={muted ? "Unmute and replay" : "Mute"}
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={() => { stopSpeaking(); stopListenRef.current?.(); onClose(); }}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-muted hover:bg-destructive/15 hover:text-destructive transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Chat */}
      <main ref={messagesRef} className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-2xl px-4 py-6 space-y-4">
          {!speechRecogSupported && (
            <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
              <p className="font-medium">{t.notSupportedHeader}</p>
              <p className="text-muted-foreground mt-1">{t.notSupportedBody}</p>
            </div>
          )}

          {messages.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}

          {stage === "generating" && (
            <div className="rounded-2xl bg-gradient-marigold p-5 text-primary-foreground shadow-soft animate-fade-up flex items-center gap-3">
              <Wand2 className="w-5 h-5 animate-bounce-soft shrink-0" />
              <p className="font-semibold">{t.generating}</p>
            </div>
          )}

          {generated && (stage === "review" || stage === "saving" || stage === "done") && (
            <GeneratedPreview g={generated} image={activeImage} enhanced={!!enhancedImage} />
          )}

          {stage === "review" && generated && (
            <div className="grid grid-cols-2 gap-2.5 animate-fade-up">
              <Button
                variant="outline" size="lg"
                onClick={() => { setStage("awaiting_more"); addAssistant(t.askChange); }}
              >
                {t.keepEditing}
              </Button>
              <Button variant="gradient" size="lg" className="sheen" onClick={runSave}>
                <Check className="w-4 h-4" /> {t.saveBtn}
              </Button>
            </div>
          )}

          {stage === "saving" && (
            <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3 animate-fade-up">
              <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
              <p className="text-sm font-medium">{t.saving}</p>
            </div>
          )}

          {stage === "done" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-fade-up">
              <Button variant="gradient" size="lg" className="sheen" onClick={() => { onClose(); navigate("/catalog"); }}>
                <Package className="w-5 h-5" /> {t.library}
              </Button>
              <Button variant="outline" size="lg" onClick={restart}>
                <Sparkles className="w-5 h-5" /> {t.another}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Input bar */}
      {showInputBar && (
        <form onSubmit={onSubmit} className="border-t border-border/60 bg-background/90 backdrop-blur p-3 sm:p-4">
          <div className="container mx-auto max-w-2xl">
            {originalImage && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 pl-1 pr-2 h-9 rounded-full bg-success/10 ring-1 ring-success/20 text-success text-xs font-medium">
                  <img src={activeImage || originalImage} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-success/30" />
                  {enhancedImage ? "Enhanced" : t.photoAdded}
                  <button
                    type="button"
                    onClick={() => { setOriginalImage(null); setEnhancedImage(null); }}
                    className="ml-0.5 w-5 h-5 inline-flex items-center justify-center rounded-full hover:bg-success/15"
                    aria-label="Remove photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void runEnhance()}
                  disabled={isEnhancing}
                  className={cn(
                    "inline-flex items-center gap-1.5 pl-2 pr-3 h-9 rounded-full text-xs font-semibold transition-all ring-1",
                    isEnhancing
                      ? "bg-muted text-muted-foreground ring-border cursor-wait"
                      : "bg-primary/10 text-primary ring-primary/20 hover:bg-primary/15",
                  )}
                  title={enhancedImage ? "Re-enhance" : "Enhance with AI"}
                >
                  {isEnhancing
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t.enhancing.split("—")[0].trim()}</>
                    : <><Wand className="w-3.5 h-3.5" /> {enhancedImage ? "Re-enhance" : t.enhanceBtn}</>}
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-muted transition-colors shrink-0"
                aria-label="Upload photo"
                title="Upload photo"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

              <div className="flex-1 relative">
                <textarea
                  value={input + (partial ? (input ? " " : "") + partial : "")}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSubmit(e as unknown as React.FormEvent);
                    }
                  }}
                  placeholder={isListening ? t.listening : t.placeholder}
                  rows={1}
                  className="w-full min-h-11 max-h-40 px-4 py-2.5 rounded-2xl border border-border bg-card resize-none text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/40 transition-all overflow-y-auto"
                />
                {isListening && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full ring-1 ring-destructive/20">
                    <span className="relative inline-flex w-1.5 h-1.5">
                      <span className="absolute inset-0 rounded-full bg-destructive animate-ping" />
                      <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-destructive" />
                    </span>
                    REC
                  </span>
                )}
              </div>

              {speechRecogSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={cn(
                    "inline-flex items-center justify-center w-11 h-11 rounded-2xl transition-all shrink-0",
                    isListening
                      ? "bg-destructive text-destructive-foreground shadow-soft animate-pulse"
                      : "bg-card border border-border hover:border-primary/40 hover:bg-muted",
                  )}
                  aria-label={isListening ? "Stop listening" : "Start listening"}
                  title={isListening ? "Stop" : "Tap to speak"}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}

              <Button
                type="submit"
                variant="gradient"
                size="icon"
                disabled={!input.trim() && !partial.trim()}
                className="w-11 h-11 shrink-0"
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Chat bubble
   ────────────────────────────────────────────────────────────*/
function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex items-end gap-2 animate-fade-up", isUser ? "flex-row-reverse" : "")}>
      <span
        className={cn(
          "inline-flex items-center justify-center w-8 h-8 rounded-full shrink-0 shadow-sm-soft",
          isUser ? "bg-muted text-foreground" : "bg-gradient-marigold text-primary-foreground",
        )}
      >
        {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </span>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-card",
          isUser ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border/60 rounded-bl-md",
        )}
      >
        {msg.image && (
          <img
            src={msg.image}
            alt=""
            className="w-full max-w-xs rounded-xl mb-2 object-cover aspect-[4/3]"
          />
        )}
        <p className="whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
}

function GeneratedPreview({ g, image, enhanced }: { g: Generated; image: string | null; enhanced?: boolean }) {
  return (
    <div className="rounded-3xl border-2 border-primary/30 bg-card shadow-elevated overflow-hidden animate-scale-in">
      <div aria-hidden className="h-1.5 bg-gradient-marigold" />
      {image && (
        <div className="relative aspect-video bg-muted overflow-hidden">
          <img src={image} alt={g.title} className="w-full h-full object-cover" />
          {enhanced && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-success/90 text-success-foreground text-[10px] font-bold tracking-wider uppercase shadow-soft backdrop-blur">
              <Check className="w-3 h-3" /> Enhanced
            </span>
          )}
        </div>
      )}
      <div className="p-5 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Title</p>
          <h3 className="font-display text-xl font-bold leading-tight">{g.title}</h3>
        </div>
        {g.short && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Description</p>
            <p className="text-sm">{g.short}</p>
          </div>
        )}
        {g.category && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Category</p>
            <p className="text-sm">{g.category}</p>
          </div>
        )}
        {g.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {g.tags.map((tag, i) => (
              <span key={i} className="inline-flex px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium ring-1 ring-primary/15">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
