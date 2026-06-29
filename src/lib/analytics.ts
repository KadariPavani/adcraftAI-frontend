// Lightweight client-side analytics. Captures all clicks, page views, and
// custom events. Sends to the public `analytics_events` table (insert-only RLS).
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ac_session_id";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min idle = new session

function getSessionId(): string {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const { id, ts } = JSON.parse(raw);
      if (Date.now() - ts < SESSION_TTL_MS) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: Date.now() }));
        return id;
      }
    }
  } catch { /* noop */ }
  const id = crypto.randomUUID();
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: Date.now() })); } catch {}
  return id;
}

let cachedUserId: string | null = null;
supabase.auth.getUser().then(({ data }) => { cachedUserId = data.user?.id || null; });
supabase.auth.onAuthStateChange((_e, s) => { cachedUserId = s?.user?.id || null; });

let pageEnteredAt = Date.now();
let currentPath = typeof window !== "undefined" ? window.location.pathname : "/";

export async function track(eventName: string, properties: Record<string, any> = {}) {
  try {
    const sessionId = getSessionId();
    await supabase.from("analytics_events").insert({
      session_id: sessionId,
      user_id: cachedUserId,
      event_name: eventName,
      page: currentPath,
      properties,
      referrer: typeof document !== "undefined" ? document.referrer : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch (err) {
    // Never throw from tracker
    console.debug("[analytics] track failed", err);
  }
}

export function trackPageView(path: string) {
  // Record duration on previous page
  const duration = Date.now() - pageEnteredAt;
  if (currentPath && duration > 50) {
    void supabase.from("analytics_events").insert({
      session_id: getSessionId(),
      user_id: cachedUserId,
      event_name: "page_leave",
      page: currentPath,
      duration_ms: duration,
      properties: { next: path },
    });
  }
  currentPath = path;
  pageEnteredAt = Date.now();
  void track("page_view", { path });
}

function describeElement(el: HTMLElement): Record<string, any> {
  const attrs: Record<string, any> = {
    tag: el.tagName.toLowerCase(),
  };
  const text = (el.innerText || el.textContent || "").trim().slice(0, 80);
  if (text) attrs.text = text;
  if (el.id) attrs.id = el.id;
  const cls = (el.className && typeof el.className === "string") ? el.className : "";
  if (cls) attrs.class = cls.slice(0, 120);
  const role = el.getAttribute("role"); if (role) attrs.role = role;
  const aria = el.getAttribute("aria-label"); if (aria) attrs.aria = aria;
  const href = (el as HTMLAnchorElement).href; if (href) attrs.href = href;
  const dataEvent = el.getAttribute("data-event"); if (dataEvent) attrs.data_event = dataEvent;
  return attrs;
}

let installed = false;
export function installGlobalTracking() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // Initial page view
  trackPageView(window.location.pathname);

  // Click capture
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const interactive = target.closest("button, a, [role='button'], [data-event], input[type='submit'], input[type='button']") as HTMLElement | null;
    const el = interactive || target;
    void track("click", describeElement(el));
  }, true);

  // Form submissions
  document.addEventListener("submit", (e) => {
    const f = e.target as HTMLFormElement;
    void track("form_submit", { id: f.id, action: f.action, name: f.name });
  }, true);

  // Visibility / unload
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      const duration = Date.now() - pageEnteredAt;
      void track("page_hidden", { duration_ms: duration });
    } else {
      pageEnteredAt = Date.now();
      void track("page_visible");
    }
  });

  window.addEventListener("error", (e) => {
    void track("js_error", { message: e.message, src: e.filename, line: e.lineno });
  });
}
