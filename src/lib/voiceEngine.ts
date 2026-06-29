// Browser-native speech engine: STT (Web Speech API) + TTS (Speech Synthesis).
// MVP scope: Hindi (hi-IN) + English (en-IN).
// Graceful: detects unsupported browsers and exposes capability flags.

export type VoiceLang = "hi-IN" | "en-IN";

export interface SpeakOptions {
  lang?: VoiceLang;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
}

export interface ListenOptions {
  lang?: VoiceLang;
  onPartial?: (text: string) => void;
  onResult: (finalText: string) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
}

// Capability detection
export function getSpeechRecognition(): any | null {
  if (typeof window === "undefined") return null;
  // @ts-ignore - webkit prefix
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function isVoiceFullySupported(): boolean {
  return !!getSpeechRecognition() && isSpeechSynthesisSupported();
}

// ─── Voice loader (cached + lazy) ─────────────────────────────────────────
let cachedVoices: SpeechSynthesisVoice[] = [];
function loadVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  const list = window.speechSynthesis.getVoices();
  if (list.length) cachedVoices = list;
  return cachedVoices;
}
// Subscribe once for asynchronous voice arrival (most desktop Chrome)
if (typeof window !== "undefined" && isSpeechSynthesisSupported()) {
  try {
    // Trigger initial load; some engines fire onvoiceschanged after first getVoices()
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", () => loadVoices());
    // Older browsers
    if (typeof (window.speechSynthesis as any).onvoiceschanged !== "function") {
      (window.speechSynthesis as any).onvoiceschanged = () => loadVoices();
    }
  } catch { /* noop */ }
}

function pickVoice(lang: VoiceLang): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  if (!voices.length) return null;
  let v = voices.find((vo) => vo.lang === lang);
  if (v) return v;
  const prefix = lang.split("-")[0];
  v = voices.find((vo) => vo.lang.startsWith(prefix + "-"));
  if (v) return v;
  v = voices.find((vo) => vo.lang.startsWith(prefix));
  return v || voices[0] || null;
}

// ─── Speak ─────────────────────────────────────────────────────────────────
// One-time engine warm-up. Must be called inside a user gesture on iOS/Safari.
// Speaking an empty utterance unlocks the synthesis engine for later use.
let primed = false;
export function primeSpeech() {
  if (!isSpeechSynthesisSupported() || primed) return;
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    u.rate = 1;
    window.speechSynthesis.speak(u);
    primed = true;
  } catch { /* noop */ }
}

let chromeKeepAlive: number | null = null;
function startChromeKeepAlive() {
  // Chrome desktop pauses synthesis after ~15s. Ping resume() to keep it alive.
  if (chromeKeepAlive) return;
  chromeKeepAlive = window.setInterval(() => {
    if (!window.speechSynthesis.speaking) {
      if (chromeKeepAlive) { clearInterval(chromeKeepAlive); chromeKeepAlive = null; }
      return;
    }
    try { window.speechSynthesis.pause(); window.speechSynthesis.resume(); } catch { /* noop */ }
  }, 10000);
}

/** Speak text. Cancels any in-flight utterance. */
export function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported() || !text.trim()) {
      opts.onEnd?.();
      resolve();
      return;
    }

    try { window.speechSynthesis.cancel(); } catch { /* noop */ }

    const lang = opts.lang || "en-IN";
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = opts.rate ?? 0.95;
    u.pitch = opts.pitch ?? 1;
    u.volume = 1;

    // Try to set a matching voice if we have one; otherwise let the browser pick.
    const v = pickVoice(lang);
    if (v) u.voice = v;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      opts.onEnd?.();
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;

    // Queue immediately so the user gesture is preserved.
    try {
      window.speechSynthesis.speak(u);
      startChromeKeepAlive();
    } catch {
      finish();
      return;
    }

    // If voices arrive after queueing, re-speak with the correct voice (only
    // when we didn't already get a voice — avoids double-speaks).
    if (!v) {
      const tryUpgrade = () => {
        const v2 = pickVoice(lang);
        if (v2 && !settled && !window.speechSynthesis.speaking) {
          // The default voice may have spoken silently; queue the real voice.
          u.voice = v2;
          try { window.speechSynthesis.speak(u); } catch { /* noop */ }
        }
      };
      // One-shot retry shortly after queue (typical voice load <300ms)
      window.setTimeout(tryUpgrade, 200);
    }

    // Safety: if neither onend nor onerror fires within 25s, resolve so callers
    // don't hang forever.
    window.setTimeout(finish, 25000);
  });
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try { window.speechSynthesis.cancel(); } catch { /* noop */ }
  }
  if (chromeKeepAlive) { clearInterval(chromeKeepAlive); chromeKeepAlive = null; }
}

// ─── Listen (STT) ──────────────────────────────────────────────────────────
async function tryWarmMic(): Promise<void> {
  try {
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    }
  } catch {
    // ignore — SpeechRecognition.start() will surface real errors
  }
}

/** Start listening. Returns a stop function. */
export function listen(opts: ListenOptions): () => void {
  const SR = getSpeechRecognition();
  if (!SR) {
    opts.onError?.("speech-recognition-unsupported");
    opts.onEnd?.();
    return () => {};
  }

  let stopped = false;
  let recog: any = null;
  let finalText = "";
  let lastInterim = "";
  let lastSpeechAt = Date.now();
  let silenceTimer: any = null;
  let restartCount = 0;
  const MAX_RESTARTS = 8;

  const SILENCE_MS = 1500;
  const MAX_MS = 60000;
  const startedAt = Date.now();

  const finish = () => {
    if (stopped) return;
    stopped = true;
    if (silenceTimer) clearTimeout(silenceTimer);
    try { recog?.stop(); } catch { /* noop */ }
    try { recog?.abort?.(); } catch { /* noop */ }
    const text = (finalText.trim() || lastInterim.trim());
    if (text) opts.onResult(text);
    opts.onEnd?.();
  };

  const armSilenceTimer = () => {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      if (finalText.trim() || lastInterim.trim()) finish();
    }, SILENCE_MS);
  };

  const buildRecognizer = () => {
    const r = new SR();
    r.lang = opts.lang || "en-IN";
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;

    r.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript + " ";
        else interim += res[0].transcript;
      }
      if (interim) {
        lastInterim = interim;
        opts.onPartial?.(interim);
        lastSpeechAt = Date.now();
        armSilenceTimer();
      }
      if (finalText) {
        lastSpeechAt = Date.now();
        armSilenceTimer();
      }
    };

    r.onerror = (e: any) => {
      const err = e?.error || "unknown";
      if (stopped) return;
      if (err === "not-allowed" || err === "service-not-allowed") {
        opts.onError?.("mic-permission-denied");
        finish();
        return;
      }
      if (err === "no-speech" || err === "aborted" || err === "audio-capture" || err === "network") {
        return;
      }
      opts.onError?.(err);
    };

    r.onend = () => {
      if (stopped) return;
      if (Date.now() - startedAt > MAX_MS) { finish(); return; }
      if ((finalText.trim() || lastInterim.trim()) && Date.now() - lastSpeechAt > SILENCE_MS) { finish(); return; }
      if (restartCount++ > MAX_RESTARTS) { finish(); return; }
      try {
        r.start();
      } catch {
        try {
          recog = buildRecognizer();
          recog.start();
        } catch { finish(); }
      }
    };
    return r;
  };

  void tryWarmMic();

  try {
    recog = buildRecognizer();
    recog.start();
  } catch (e: any) {
    opts.onError?.(e?.message || "start-failed");
    opts.onEnd?.();
  }

  return () => {
    finish();
  };
}

// --- Lightweight intent matching (works across Hindi-Latin + English) ---
const YES_WORDS = ["yes", "yeah", "yep", "yup", "ok", "okay", "sure", "fine", "good", "haan", "ha", "ji", "thik", "theek", "sahi", "haanji", "correct", "right", "perfect", "ho gaya"];
const NO_WORDS = ["no", "nope", "nah", "nahi", "nahin", "mat", "cancel", "stop", "galat", "wrong", "back"];
const SKIP_WORDS = ["skip", "next", "chod", "chhod", "aage", "aage badho", "continue"];
const RETRY_WORDS = ["retry", "again", "phir se", "dobara", "redo", "wapas", "change", "badlo"];

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/[.,!?;:'"()]/g, "");
}

function containsAny(s: string, words: string[]): boolean {
  const n = ` ${normalize(s)} `;
  return words.some((w) => n.includes(` ${w} `));
}

export function isYes(s: string): boolean { return containsAny(s, YES_WORDS); }
export function isNo(s: string): boolean { return containsAny(s, NO_WORDS); }
export function isSkip(s: string): boolean { return containsAny(s, SKIP_WORDS); }
export function isRetry(s: string): boolean { return containsAny(s, RETRY_WORDS); }

export function extractPhone(s: string): string | null {
  const tokens = normalize(s).split(/\s+/);
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "double" && tokens[i + 1] && /^\d$/.test(tokens[i + 1])) {
      out.push(tokens[i + 1].repeat(2)); i++;
    } else if (t === "triple" && tokens[i + 1] && /^\d$/.test(tokens[i + 1])) {
      out.push(tokens[i + 1].repeat(3)); i++;
    } else if (/^\d+$/.test(t)) {
      out.push(t);
    }
  }
  const digits = out.join("").replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return null;
}
