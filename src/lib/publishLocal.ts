// Browser-side publisher. Talks straight to Meta Graph API — no Supabase edge function involved.
// Use during local development: every step is console.log'd, no deploy needed to iterate.
// All Graph endpoints used here are CORS-enabled by Meta (same ones the JS SDK uses).

import { supabase } from "@/integrations/supabase/client";

const GRAPH = "https://graph.facebook.com/v21.0";

type Result = { success: boolean; platformPostId?: string; error?: string };

const tag = (platform: string) => `[publish:${platform}]`;
const log = (platform: string, ...args: unknown[]) => console.log(tag(platform), ...args);
const warn = (platform: string, ...args: unknown[]) => console.warn(tag(platform), ...args);
const err = (platform: string, ...args: unknown[]) => console.error(tag(platform), ...args);

async function getCred(userId: string, platform: string, key: string): Promise<string | null> {
  const { data } = await supabase
    .from("user_social_credentials")
    .select("credential_value")
    .eq("user_id", userId)
    .eq("platform", platform)
    .eq("credential_key", key)
    .maybeSingle();
  return data?.credential_value ?? null;
}

async function loadPost(postId: string, userId: string) {
  const { data, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("id", postId)
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error(error?.message || "Post not found");
  return data;
}

function buildCaption(post: { caption?: string; hashtags?: string[]; link_url?: string }): string {
  let caption = post.caption || "";
  if (post.hashtags?.length) caption += "\n\n" + post.hashtags.map((h) => `#${h}`).join(" ");
  if (post.link_url) caption += "\n\n🔗 " + post.link_url;
  return caption;
}

async function readImageBlob(url: string, platform: string): Promise<{ blob: Blob; contentType: string }> {
  log(platform, "readImageBlob", url.slice(0, 80) + (url.length > 80 ? "…" : ""));
  if (!url) throw new Error("No image URL");
  if (url.startsWith("blob:") || /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(url)) {
    throw new Error(`Image source not reachable (${url.slice(0, 60)}…). Re-upload first.`);
  }
  // fetch() handles data:, https:, http: uniformly
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Source fetch failed: HTTP ${res.status}`);
  const blob = await res.blob();
  const contentType = blob.type || res.headers.get("content-type") || "image/jpeg";
  log(platform, "bytes ready", { contentType, size: blob.size });
  return { blob, contentType };
}

// Calls /me/permissions and logs which scopes the token actually has vs declined.
// Run on every publish attempt — diagnoses (#200) / (#10) / (#190) errors at a glance.
async function diagnoseToken(token: string, platform: string): Promise<{ granted: string[]; declined: string[] }> {
  try {
    const res = await fetch(`${GRAPH}/me/permissions?access_token=${encodeURIComponent(token)}`);
    const data = await res.json();
    const perms: Array<{ permission: string; status: string }> = data.data || [];
    const granted = perms.filter((p) => p.status === "granted").map((p) => p.permission);
    const declined = perms.filter((p) => p.status !== "granted").map((p) => p.permission);
    log(platform, "token GRANTED scopes:", granted);
    if (declined.length) warn(platform, "token DECLINED/EXPIRED scopes:", declined);
    return { granted, declined };
  } catch (e) {
    warn(platform, "diagnoseToken failed", e);
    return { granted: [], declined: [] };
  }
}

// Page tokens and User tokens look the same (EAA… prefix) but behave differently.
// User-token + POST /{page}/photos → Meta wants the deprecated publish_actions scope and 403s.
// Page-token  + POST /{page}/photos → succeeds with pages_manage_posts.
// If we were given a User Token, auto-swap to the page's own access_token via /me/accounts.
async function resolvePageToken(token: string, pageId: string, platform: string): Promise<string> {
  const meRes = await fetch(`${GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(token)}`);
  const me = await meRes.json();
  if (me.error) throw new Error("Token check failed: " + (me.error.message || JSON.stringify(me.error)));
  log(platform, "/me ←", me);
  if (me.id === pageId) {
    log(platform, "✓ token is already the Page Token");
    return token;
  }
  log(platform, `token belongs to user/entity id=${me.id}, fetching Page Token for ${pageId}…`);
  const accRes = await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token&limit=100&access_token=${encodeURIComponent(token)}`);
  const accData = await accRes.json();
  if (accData.error) throw new Error("/me/accounts failed: " + (accData.error.message || JSON.stringify(accData.error)));
  const pages: Array<{ id: string; name: string; access_token?: string }> = accData.data || [];
  log(platform, `pages reachable by this token: ${pages.length}`, pages.map((p) => `${p.name}(${p.id})`));
  const page = pages.find((p) => p.id === pageId);
  if (!page?.access_token) {
    throw new Error(`No Page Token derivable for page ${pageId}. Available: ${pages.map((p) => `${p.name} ${p.id}`).join("; ") || "none"}. Check the FB Page ID in Social Settings, or use a token from an account that manages the page.`);
  }
  log(platform, `✓ derived Page Token for "${page.name}"`);
  return page.access_token;
}

function fbError(data: unknown): string | null {
  const d = data as { error?: { code?: number; error_subcode?: number; message?: string; error_user_msg?: string; error_user_title?: string; fbtrace_id?: string } };
  if (!d?.error) return null;
  const e = d.error;
  const userMsg = e.error_user_msg || e.error_user_title;
  const detail = userMsg ? `${e.message} — ${userMsg}` : e.message;
  return `[${e.code}${e.error_subcode ? "/" + e.error_subcode : ""}] ${detail}${e.fbtrace_id ? " trace=" + e.fbtrace_id : ""}`;
}

async function igWaitForContainer(creationId: string, token: string, platform: string): Promise<void> {
  let status = "IN_PROGRESS";
  for (let i = 0; i < 15 && status === "IN_PROGRESS"; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const stRes = await fetch(`${GRAPH}/${creationId}?fields=status_code,status&access_token=${encodeURIComponent(token)}`);
    const stData = await stRes.json();
    const stErr = fbError(stData);
    if (stErr) throw new Error("Status check: " + stErr);
    status = stData.status_code || "IN_PROGRESS";
    log(platform, `  status[${creationId.slice(-6)}] poll#${i + 1} = ${status}`);
    if (status === "ERROR" || status === "EXPIRED") throw new Error(`Container ${status}: ${stData.status || "rejected"}`);
  }
  if (status !== "FINISHED") throw new Error(`Container stuck at ${status} after 30s`);
}

// Upload bytes to the existing public product-images bucket (same one product photos use).
// Returns the public URL — IG /media accepts it because it's a real, fetchable https URL.
async function uploadToProductImages(
  userId: string,
  blob: Blob,
  contentType: string,
  platform: string,
): Promise<string> {
  const ext = (contentType.split("/")[1] || "jpg").replace("jpeg", "jpg").split("+")[0];
  const path = `${userId}/publish/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  log(platform, `supabase.storage.from('product-images').upload(${path})`);
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, blob, { contentType, upsert: false });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("Storage returned no public URL");
  log(platform, "uploaded → ", data.publicUrl);
  // Sanity check: try to fetch it ourselves before handing to Meta.
  try {
    const probe = await fetch(data.publicUrl, { method: "HEAD" });
    log(platform, `HEAD probe: ${probe.status} ${probe.headers.get("content-type")}`);
    if (!probe.ok) warn(platform, "probe returned non-2xx — bucket may not be public");
  } catch (e) {
    warn(platform, "probe failed (CORS or network)", e);
  }
  return data.publicUrl;
}

export async function publishInstagramLocal(postId: string): Promise<Result> {
  const platform = "instagram";
  console.groupCollapsed(`${tag(platform)} === postId=${postId} ===`);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not signed in" };
    log(platform, "user", user.id);

    const post = await loadPost(postId, user.id);
    log(platform, "post loaded", { caption: post.caption?.slice(0, 60), images: post.image_urls?.length, hashtags: post.hashtags?.length });

    const token = (await getCred(user.id, "meta", "page_access_token")) || "";
    const igAccountId = await getCred(user.id, "meta", "instagram_business_account_id");
    log(platform, "creds", { hasToken: !!token, tokenPrefix: token.slice(0, 8), igAccountId });

    if (!token) return { success: false, error: "Page Access Token missing in Social Settings" };
    if (!igAccountId) return { success: false, error: "Instagram Business Account ID missing in Social Settings" };

    await diagnoseToken(token, platform);

    const caption = buildCaption(post);
    const hashtagCount = (caption.match(/#\w+/g) || []).length;
    log(platform, "caption", { length: caption.length, hashtagCount });
    if (caption.length > 2200) return { success: false, error: `Caption ${caption.length}/2200 chars` };
    if (hashtagCount > 30) return { success: false, error: `Hashtags ${hashtagCount}/30` };

    const rawImages: string[] = (post.image_urls || []).filter(Boolean);
    if (!rawImages.length) return { success: false, error: "Post has no image" };
    if (rawImages.length > 10) warn(platform, `IG carousel max is 10; truncating from ${rawImages.length}`);
    const imagesToPost = rawImages.slice(0, 10);

    // Upload every image to product-images bucket → public URLs
    const imageUrls: string[] = [];
    for (let i = 0; i < imagesToPost.length; i++) {
      log(platform, `image ${i + 1}/${imagesToPost.length}`);
      const { blob, contentType } = await readImageBlob(imagesToPost[i], platform);
      const url = await uploadToProductImages(user.id, blob, contentType, platform);
      imageUrls.push(url);
    }

    let creationId: string;
    if (imageUrls.length === 1) {
      // Single image
      log(platform, `POST ${GRAPH}/${igAccountId}/media (single)`);
      const r = await fetch(`${GRAPH}/${igAccountId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrls[0], caption, access_token: token }),
      });
      const d = await r.json();
      log(platform, "← /media single", d);
      const e = fbError(d);
      if (e) return { success: false, error: "Create container: " + e };
      if (!d.id) return { success: false, error: "Create container returned no id" };
      creationId = d.id;
    } else {
      // Carousel: create each child as is_carousel_item, wait, then assemble parent
      log(platform, `building CAROUSEL with ${imageUrls.length} images`);
      const childIds: string[] = [];
      for (let i = 0; i < imageUrls.length; i++) {
        log(platform, `POST /media child ${i + 1}/${imageUrls.length} (is_carousel_item)`);
        const r = await fetch(`${GRAPH}/${igAccountId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: imageUrls[i], is_carousel_item: true, access_token: token }),
        });
        const d = await r.json();
        log(platform, `← child ${i + 1}`, d);
        const e = fbError(d);
        if (e) return { success: false, error: `Carousel child ${i + 1}: ` + e };
        if (!d.id) return { success: false, error: `Carousel child ${i + 1} returned no id` };
        await igWaitForContainer(d.id, token, platform);
        childIds.push(d.id);
      }
      log(platform, `POST /media (CAROUSEL parent) children=${childIds.join(",")}`);
      const r = await fetch(`${GRAPH}/${igAccountId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_type: "CAROUSEL", children: childIds.join(","), caption, access_token: token }),
      });
      const d = await r.json();
      log(platform, "← /media carousel", d);
      const e = fbError(d);
      if (e) return { success: false, error: "Create carousel: " + e };
      if (!d.id) return { success: false, error: "Carousel returned no id" };
      creationId = d.id;
    }

    await igWaitForContainer(creationId, token, platform);

    log(platform, `POST ${GRAPH}/${igAccountId}/media_publish`);
    const pubRes = await fetch(`${GRAPH}/${igAccountId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: creationId, access_token: token }),
    });
    const pubData = await pubRes.json();
    log(platform, "← /media_publish response", pubData);
    const pubErr = fbError(pubData);
    if (pubErr) return { success: false, error: "Publish: " + pubErr };
    if (!pubData.id) return { success: false, error: "Publish returned no id" };

    log(platform, "✓ SUCCESS Instagram post id =", pubData.id);
    return { success: true, platformPostId: pubData.id };
  } catch (e) {
    err(platform, "EXCEPTION", e);
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    console.groupEnd();
  }
}

export async function publishFacebookLocal(postId: string): Promise<Result> {
  const platform = "facebook";
  console.groupCollapsed(`${tag(platform)} === postId=${postId} ===`);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not signed in" };

    const post = await loadPost(postId, user.id);
    const token = await getCred(user.id, "meta", "page_access_token");
    const pageId = await getCred(user.id, "meta", "facebook_page_id");
    log(platform, "creds", { hasToken: !!token, pageId });
    if (!token || !pageId) return { success: false, error: "Page Access Token + Facebook Page ID required" };

    const { granted } = await diagnoseToken(token, platform);
    const missing = ["pages_manage_posts"].filter((p) => !granted.includes(p));
    if (missing.length) {
      const msg = `Token is missing required Facebook scope(s): ${missing.join(", ")}. (Granted: ${granted.join(", ") || "none"})`;
      err(platform, msg);
      return { success: false, error: msg };
    }

    // CRITICAL: swap a User Token for the Page Token if needed (avoids the deprecated
    // publish_actions error). Pass-through if already a Page Token.
    const pageToken = await resolvePageToken(token, pageId, platform);

    const message = buildCaption(post);
    const rawImages: string[] = (post.image_urls || []).filter(Boolean);

    let data: { id?: string; post_id?: string };
    if (rawImages.length === 0) {
      const body: Record<string, string> = { message, access_token: pageToken };
      if (post.link_url) body.link = post.link_url;
      log(platform, `POST ${GRAPH}/${pageId}/feed (text only)`);
      const res = await fetch(`${GRAPH}/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      data = await res.json();
    } else if (rawImages.length === 1) {
      const { blob, contentType } = await readImageBlob(rawImages[0], platform);
      const ext = (contentType.split("/")[1] || "jpg").replace("jpeg", "jpg").split("+")[0];
      const form = new FormData();
      form.append("source", blob, `image.${ext}`);
      form.append("message", message);
      form.append("access_token", pageToken);
      log(platform, `POST ${GRAPH}/${pageId}/photos (single)`);
      const res = await fetch(`${GRAPH}/${pageId}/photos`, { method: "POST", body: form });
      data = await res.json();
    } else {
      // Multi-image album: upload each as published=false → get media_fbids → /feed with attached_media
      log(platform, `building album from ${rawImages.length} images`);
      const mediaFbids: string[] = [];
      for (let i = 0; i < rawImages.length; i++) {
        const { blob, contentType } = await readImageBlob(rawImages[i], platform);
        const ext = (contentType.split("/")[1] || "jpg").replace("jpeg", "jpg").split("+")[0];
        const form = new FormData();
        form.append("source", blob, `image.${ext}`);
        form.append("published", "false");
        form.append("access_token", pageToken);
        log(platform, `POST /photos child ${i + 1}/${rawImages.length} (published=false)`);
        const r = await fetch(`${GRAPH}/${pageId}/photos`, { method: "POST", body: form });
        const d = await r.json();
        log(platform, `← child ${i + 1}`, d);
        const e = fbError(d);
        if (e) return { success: false, error: `Album child ${i + 1}: ` + e };
        if (!d.id) return { success: false, error: `Album child ${i + 1} returned no id` };
        mediaFbids.push(d.id);
      }
      const attached = mediaFbids.map((id) => ({ media_fbid: id }));
      log(platform, `POST /feed with attached_media`, attached);
      const res = await fetch(`${GRAPH}/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, attached_media: attached, access_token: pageToken }),
      });
      data = await res.json();
    }

    log(platform, "← final response", data);
    const e = fbError(data);
    if (e) return { success: false, error: e };
    const platformPostId: string | undefined = data.id || data.post_id;
    if (!platformPostId) return { success: false, error: "Publish returned no id" };
    log(platform, "✓ SUCCESS Facebook post id =", platformPostId);
    return { success: true, platformPostId };
  } catch (e) {
    err(platform, "EXCEPTION", e);
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    console.groupEnd();
  }
}

// WhatsApp Business API only sends to specific opted-in numbers (no "feed" concept).
// For an artisan/creator publishing flow, the right primitive is wa.me/?text=… which
// opens WhatsApp prefilled and lets the user pick a chat/group/broadcast list.
// ponytail: native share URL, no permissions, no API. Upgrade to Business API only
// when you have approved templates + a customer list.
export async function publishWhatsAppLocal(postId: string): Promise<Result> {
  const platform = "whatsapp";
  // CRITICAL: open the popup SYNCHRONOUSLY before any await — preserves the user-gesture
  // context so browsers don't block it. We navigate it later once the caption is loaded.
  const win = window.open("about:blank", "_blank");
  if (!win) {
    return { success: false, error: "Browser blocked the popup. Allow popups for this site and retry." };
  }

  console.groupCollapsed(`${tag(platform)} === postId=${postId} ===`);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { win.close(); return { success: false, error: "Not signed in" }; }

    const post = await loadPost(postId, user.id);
    const message = buildCaption(post);
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    log(platform, "navigating popup →", url);
    win.location.href = url;
    log(platform, "✓ share dialog open — pick a chat in WhatsApp to send");
    return { success: true, platformPostId: "wa-share-" + Date.now() };
  } catch (e) {
    err(platform, "EXCEPTION", e);
    try { win.close(); } catch { /* ignore */ }
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    console.groupEnd();
  }
}
