import type { Express, Request, Response, NextFunction } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { hubDreams, hubDreamMessages } from "../shared/schema";
import { uploadImageToS3, isS3Configured } from "./s3";

/* Member Tools Hub API (subscriber-only tools embedded on psychicsource.com).
 * Registered BEFORE the admin auth guard so it stays public + cross-origin.
 * Every request is keyed to a hub user id: the verified member id from a
 * signed token when present, otherwise the anonymous per-browser id the
 * widget sends in X-PS-Hub-Uid. Token verification is a stub until Psychic
 * Source wires up the signed token; see resolveUser().
 */

const OPENROUTER = "https://openrouter.ai/api/v1/chat/completions";
const TEXT_MODEL = "anthropic/claude-sonnet-4-5";
const IMAGE_MODEL = process.env.IMAGE_MODEL || "openai/gpt-5.4-image-2";

// Simple per-user sliding-window limiter for the paid AI endpoints.
const hits: Record<string, number[]> = {};
function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits[key] || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits[key] = arr;
  return arr.length <= max;
}

function resolveUser(req: Request): string | null {
  // TODO: when Psychic Source provides a signed member token, verify
  // X-PS-Hub-Token here (shared secret / JWT) and return its subject.
  // Until then we trust the anonymous per-browser id the widget generates.
  const token = req.header("X-PS-Hub-Token");
  if (token) {
    // Placeholder: a real implementation verifies the signature + expiry.
    // For now, if a token is present we still fall through to the uid.
  }
  const uid = (req.header("X-PS-Hub-Uid") || "").trim();
  if (!uid || uid.length > 128) return null;
  return uid;
}

async function openrouterText(system: string, messages: { role: string; content: string }[], maxTokens: number): Promise<string> {
  const res = await fetch(OPENROUTER, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: TEXT_MODEL, max_tokens: maxTokens, messages: [{ role: "system", content: system }, ...messages] }),
  });
  if (!res.ok) throw new Error(`openrouter ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  return (data?.choices?.[0]?.message?.content || "").trim();
}

async function openrouterImage(prompt: string): Promise<string> {
  const res = await fetch(OPENROUTER, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: IMAGE_MODEL, modalities: ["image", "text"], messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`openrouter image ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  const msg = data?.choices?.[0]?.message;
  const fromImages = msg?.images?.[0]?.image_url?.url;
  if (fromImages) return fromImages;
  if (Array.isArray(msg?.content)) {
    for (const block of msg.content) if (block?.type === "image_url" && block?.image_url?.url) return block.image_url.url;
  }
  throw new Error("openrouter response had no image");
}

const INTERPRET_SYSTEM =
  "You are a thoughtful, warm dream interpreter for a personal journaling tool. Offer an insightful, multi-layered reading of the dream: the emotional themes, notable symbols and what they can represent, and a gentle reflection or question for the dreamer to sit with. Treat interpretation as a reflective, generative practice, not fortune-telling or medical advice. Write in flowing prose of two to four short paragraphs, in a caring second-person voice. Do not use markdown headings. Do not use em dashes or en dashes.";
const CHAT_SYSTEM =
  "You are continuing a warm, thoughtful conversation about a specific dream the user recorded. You already know the dream and any interpretation given; do not repeat them at length. Answer the user's follow-up with curiosity and care, staying grounded in their dream. Keep replies to a short paragraph or two. This is reflective journaling support, not fortune-telling or medical advice. Do not use em dashes or en dashes.";

function dreamContext(d: any): string {
  var parts = [];
  if (d.title) parts.push(`Title: ${d.title}`);
  parts.push(`Dreamt on: ${d.dreamtOn}`);
  if (d.mood) parts.push(`Mood on waking: ${d.mood}`);
  var flags = [d.isLucid ? "lucid" : null, d.isRecurring ? "recurring" : null, d.isNightmare ? "nightmare" : null].filter(Boolean);
  if (flags.length) parts.push(`Qualities: ${flags.join(", ")}`);
  if (d.tags && d.tags.length) parts.push(`Tags: ${d.tags.join(", ")}`);
  parts.push(`\nDream:\n${d.narrative}`);
  return parts.join("\n");
}

function buildImagePrompt(narrative: string, title: string | null): string {
  var base = (title ? title + ". " : "") + narrative;
  if (base.length > 900) base = base.slice(0, 900);
  return "A dreamlike, surreal, painterly artwork depicting this dream. Soft ethereal light, rich atmosphere, symbolic and evocative, no text or words in the image. The dream: " + base;
}

function publicDream(d: any) {
  return {
    id: d.id, dreamtOn: d.dreamtOn, title: d.title, narrative: d.narrative, mood: d.mood,
    isLucid: d.isLucid, isRecurring: d.isRecurring, isNightmare: d.isNightmare,
    vividness: d.vividness, sleepQuality: d.sleepQuality, moodBeforeSleep: d.moodBeforeSleep,
    pov: d.pov, agency: d.agency, emotions: d.emotions || [], isFalseAwakening: d.isFalseAwakening, isSleepParalysis: d.isSleepParalysis,
    themes: d.themes || [], interpretations: d.interpretations || {},
    imageUrl: d.imageUrl, images: d.images || [], publicSlug: d.publicSlug || null,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
  };
}

// Normalizes the optional richer-capture fields from a request body.
function extraFields(b: any): any {
  var f: any = {};
  function rating(v: any) { var n = parseInt(v, 10); return v == null || isNaN(n) ? null : Math.max(1, Math.min(5, n)); }
  if ("vividness" in b) f.vividness = rating(b.vividness);
  if ("sleepQuality" in b) f.sleepQuality = rating(b.sleepQuality);
  if ("moodBeforeSleep" in b) f.moodBeforeSleep = b.moodBeforeSleep ? String(b.moodBeforeSleep).slice(0, 40) : null;
  if ("pov" in b) f.pov = b.pov ? String(b.pov).slice(0, 40) : null;
  if ("emotions" in b) f.emotions = Array.isArray(b.emotions) ? b.emotions.map((t: any) => String(t).trim()).filter(Boolean).slice(0, 20) : null;
  if ("agency" in b) f.agency = b.agency ? String(b.agency).slice(0, 40) : null;
  if ("isFalseAwakening" in b) f.isFalseAwakening = !!b.isFalseAwakening;
  if ("isSleepParalysis" in b) f.isSleepParalysis = !!b.isSleepParalysis;
  return f;
}

// Interpretive lenses (multi-perspective dream interpretation).
var DREAM_LENSES: Record<string, string> = {
  emotional: "Read the dream through an emotional lens: the feelings present and what they reveal about the dreamer's inner state right now.",
  symbolic: "Read the dream through a symbolic lens: the key symbols and images and the range of things they can represent.",
  spiritual: "Read the dream through a gentle spiritual and intuitive lens: its deeper meaning and what the soul may be working through.",
  practical: "Read the dream through a practical lens: what it may be nudging the dreamer to notice, tend to, or act on in waking life.",
};

// Auto-extract a few themes/symbols from a narrative (replaces manual tags).
async function extractThemes(narrative: string): Promise<string[]> {
  try {
    var sys = "Extract 3 to 6 short recurring themes or symbols from this dream. Output ONLY a JSON array of lowercase short strings, for example [\"water\",\"falling\",\"being chased\"]. No other text.";
    var txt = await openrouterText(sys, [{ role: "user", content: narrative.slice(0, 4000) }], 80);
    var m = txt.match(/\[[\s\S]*\]/);
    if (m) { var arr = JSON.parse(m[0]); if (Array.isArray(arr)) return arr.map((x: any) => String(x).trim().toLowerCase()).filter(Boolean).slice(0, 8); }
  } catch (e) { /* themes are best-effort */ }
  return [];
}
function makeSlug(): string {
  try { return (globalThis as any).crypto.randomUUID().replace(/-/g, "").slice(0, 20); }
  catch (e) { return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
}

export function registerHubRoutes(app: Express) {
  const cors = (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-PS-Hub-Token, X-PS-Hub-Uid");
    next();
  };
  const auth = (req: Request, res: Response, next: NextFunction) => {
    const uid = resolveUser(req);
    if (!uid) return res.status(401).json({ error: "Missing hub identity." });
    (req as any).hubUser = uid;
    next();
  };
  app.options("/api/hub/*", cors, (_req, res) => res.sendStatus(204));

  // ---- list ----
  app.get("/api/hub/dreams", cors, auth, async (req, res) => {
    try {
      const uid = (req as any).hubUser as string;
      const rows = await db.select().from(hubDreams).where(eq(hubDreams.userId, uid)).orderBy(desc(hubDreams.dreamtOn), desc(hubDreams.createdAt));
      res.json({ dreams: rows.map(publicDream) });
    } catch (e) { console.error("hub list", e); res.status(500).json({ error: "Could not load dreams." }); }
  });

  // ---- pattern analysis ----
  app.get("/api/hub/patterns", cors, auth, async (req, res) => {
    try {
      const uid = (req as any).hubUser as string;
      const rows = await db.select().from(hubDreams).where(eq(hubDreams.userId, uid));
      const total = rows.length;
      const count = (fn: (d: any) => any) => { const m: Record<string, number> = {}; rows.forEach((d) => { const v = fn(d); (Array.isArray(v) ? v : [v]).forEach((x) => { if (x) m[x] = (m[x] || 0) + 1; }); }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
      const weekday = new Array(7).fill(0);
      rows.forEach((d) => { const wd = new Date(d.dreamtOn + "T00:00:00").getDay(); weekday[wd]++; });
      res.json({
        total,
        lucid: rows.filter((d) => d.isLucid).length,
        recurring: rows.filter((d) => d.isRecurring).length,
        nightmares: rows.filter((d) => d.isNightmare).length,
        interpreted: rows.filter((d) => d.interpretation).length,
        moods: count((d) => d.mood).slice(0, 6),
        themes: count((d) => d.themes).slice(0, 12),
        weekday,
      });
    } catch (e) { console.error("hub patterns", e); res.status(500).json({ error: "Could not load patterns." }); }
  });

  // ---- get one (with chat messages) ----
  app.get("/api/hub/dreams/:id", cors, auth, async (req, res) => {
    try {
      const uid = (req as any).hubUser as string;
      const [d] = await db.select().from(hubDreams).where(and(eq(hubDreams.id, req.params.id), eq(hubDreams.userId, uid))).limit(1);
      if (!d) return res.status(404).json({ error: "Dream not found." });
      const msgs = await db.select().from(hubDreamMessages).where(eq(hubDreamMessages.dreamId, d.id)).orderBy(hubDreamMessages.createdAt);
      res.json({ dream: publicDream(d), messages: msgs.map((m) => ({ role: m.role, content: m.content })) });
    } catch (e) { console.error("hub get", e); res.status(500).json({ error: "Could not load dream." }); }
  });

  // ---- create ----
  app.post("/api/hub/dreams", cors, auth, async (req, res) => {
    try {
      const uid = (req as any).hubUser as string;
      const b = req.body || {};
      const narrative = String(b.narrative || "").trim();
      const dreamtOn = String(b.dreamtOn || "").trim();
      if (!narrative) return res.status(400).json({ error: "Please describe your dream." });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dreamtOn)) return res.status(400).json({ error: "A valid date is required." });
      if (!rateLimit(`create:${uid}`, 60, 60_000)) return res.status(429).json({ error: "Slow down a moment." });
      const values: any = {
        userId: uid, dreamtOn, title: b.title ? String(b.title).slice(0, 200) : null,
        narrative: narrative.slice(0, 8000), mood: b.mood ? String(b.mood).slice(0, 40) : null,
        isLucid: !!b.isLucid, isRecurring: !!b.isRecurring, isNightmare: !!b.isNightmare,
      };
      Object.assign(values, extraFields(b));
      const themes = await extractThemes(narrative);
      if (themes.length) values.themes = themes;
      const [d] = await db.insert(hubDreams).values(values).returning();
      res.json({ dream: publicDream(d) });
    } catch (e) { console.error("hub create", e); res.status(500).json({ error: "Could not save your dream." }); }
  });

  // ---- update ----
  app.patch("/api/hub/dreams/:id", cors, auth, async (req, res) => {
    try {
      const uid = (req as any).hubUser as string;
      const b = req.body || {};
      const patch: any = { updatedAt: new Date() };
      ["title", "narrative", "mood"].forEach((k) => { if (k in b) patch[k] = b[k] == null ? null : String(b[k]).slice(0, k === "narrative" ? 8000 : 200); });
      ["isLucid", "isRecurring", "isNightmare"].forEach((k) => { if (k in b) patch[k] = !!b[k]; });
      Object.assign(patch, extraFields(b));
      if (typeof b.narrative === "string" && b.narrative.trim()) { const th = await extractThemes(b.narrative); if (th.length) patch.themes = th; }
      const [d] = await db.update(hubDreams).set(patch).where(and(eq(hubDreams.id, req.params.id), eq(hubDreams.userId, uid))).returning();
      if (!d) return res.status(404).json({ error: "Dream not found." });
      res.json({ dream: publicDream(d) });
    } catch (e) { console.error("hub update", e); res.status(500).json({ error: "Could not update." }); }
  });

  // ---- delete ----
  app.delete("/api/hub/dreams/:id", cors, auth, async (req, res) => {
    try {
      const uid = (req as any).hubUser as string;
      const [d] = await db.delete(hubDreams).where(and(eq(hubDreams.id, req.params.id), eq(hubDreams.userId, uid))).returning();
      if (!d) return res.status(404).json({ error: "Dream not found." });
      res.json({ ok: true });
    } catch (e) { console.error("hub delete", e); res.status(500).json({ error: "Could not delete." }); }
  });

  async function loadOwned(uid: string, id: string) {
    const [d] = await db.select().from(hubDreams).where(and(eq(hubDreams.id, id), eq(hubDreams.userId, uid))).limit(1);
    return d;
  }

  // ---- share: create or revoke an unguessable public link ----
  app.post("/api/hub/dreams/:id/share", cors, auth, async (req, res) => {
    try {
      const uid = (req as any).hubUser as string;
      const enabled = (req.body || {}).enabled !== false; // default true
      const d = await loadOwned(uid, req.params.id);
      if (!d) return res.status(404).json({ error: "Dream not found." });
      let slug: string | null = d.publicSlug || null;
      if (enabled) {
        if (!slug) { slug = makeSlug(); await db.update(hubDreams).set({ publicSlug: slug, updatedAt: new Date() }).where(eq(hubDreams.id, d.id)); }
      } else {
        slug = null; await db.update(hubDreams).set({ publicSlug: null, updatedAt: new Date() }).where(eq(hubDreams.id, d.id));
      }
      res.json({ publicSlug: slug });
    } catch (e) { console.error("hub share", e); res.status(500).json({ error: "Could not update sharing." }); }
  });

  // ---- public read-only view of a shared dream (no auth) ----
  app.get("/api/hub/shared/:slug", cors, async (req, res) => {
    try {
      const slug = String(req.params.slug || "");
      if (!/^[a-z0-9]{6,40}$/i.test(slug)) return res.status(404).json({ error: "Not found." });
      const [d] = await db.select().from(hubDreams).where(eq(hubDreams.publicSlug, slug)).limit(1);
      if (!d) return res.status(404).json({ error: "This dream link is no longer available." });
      const pd: any = publicDream(d); delete pd.publicSlug;
      res.json({ dream: pd });
    } catch (e) { console.error("hub shared", e); res.status(500).json({ error: "Could not load this dream." }); }
  });

  // ---- AI: interpret ----
  app.post("/api/hub/dreams/:id/interpret", cors, auth, async (req, res) => {
    try {
      const uid = (req as any).hubUser as string;
      if (!rateLimit(`interpret:${uid}`, 20, 60_000)) return res.status(429).json({ error: "Please wait a moment before interpreting again." });
      const lens = DREAM_LENSES[String((req.body || {}).lens)] ? String((req.body || {}).lens) : "emotional";
      const d = await loadOwned(uid, req.params.id);
      if (!d) return res.status(404).json({ error: "Dream not found." });
      const sys = INTERPRET_SYSTEM + " " + DREAM_LENSES[lens];
      const text = await openrouterText(sys, [{ role: "user", content: dreamContext(d) }], 600);
      if (!text) return res.status(502).json({ error: "Could not interpret right now." });
      const interps: Record<string, string> = Object.assign({}, (d as any).interpretations || {}); interps[lens] = text;
      await db.update(hubDreams).set({ interpretations: interps, updatedAt: new Date() }).where(eq(hubDreams.id, d.id));
      res.json({ lens: lens, text: text, interpretations: interps });
    } catch (e) { console.error("hub interpret", e); res.status(502).json({ error: "Could not interpret right now." }); }
  });

  // ---- AI: follow-up chat ----
  app.post("/api/hub/dreams/:id/chat", cors, auth, async (req, res) => {
    try {
      const uid = (req as any).hubUser as string;
      if (!rateLimit(`chat:${uid}`, 40, 60_000)) return res.status(429).json({ error: "Please slow down a moment." });
      const message = String((req.body || {}).message || "").trim();
      if (!message) return res.status(400).json({ error: "Type a question first." });
      const d = await loadOwned(uid, req.params.id);
      if (!d) return res.status(404).json({ error: "Dream not found." });
      const prior = await db.select().from(hubDreamMessages).where(eq(hubDreamMessages.dreamId, d.id)).orderBy(hubDreamMessages.createdAt);
      const interpText = Object.values(((d as any).interpretations || {}) as Record<string, string>).join("\n\n");
      const context = dreamContext(d) + (interpText ? `\n\nEarlier interpretation:\n${interpText}` : "");
      const msgs = [
        { role: "user", content: `Here is my dream for context.\n\n${context}` },
        ...prior.slice(-12).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ];
      const reply = await openrouterText(CHAT_SYSTEM, msgs, 500);
      if (!reply) return res.status(502).json({ error: "No reply right now." });
      await db.insert(hubDreamMessages).values([{ dreamId: d.id, role: "user", content: message.slice(0, 2000) }, { dreamId: d.id, role: "assistant", content: reply }]);
      res.json({ reply });
    } catch (e) { console.error("hub chat", e); res.status(502).json({ error: "Could not reply right now." }); }
  });

  // ---- AI: dream image ----
  app.post("/api/hub/dreams/:id/image", cors, auth, async (req, res) => {
    try {
      const uid = (req as any).hubUser as string;
      if (!rateLimit(`image:${uid}`, 10, 60_000)) return res.status(429).json({ error: "Please wait before generating another image." });
      const d = await loadOwned(uid, req.params.id);
      if (!d) return res.status(404).json({ error: "Dream not found." });
      const dataUrl = await openrouterImage(buildImagePrompt(d.narrative, d.title));
      let url = dataUrl;
      if (isS3Configured()) {
        try { url = await uploadImageToS3(dataUrl, `images/dreams/${d.id}-${Date.now()}.png`, "image/png"); }
        catch (e) { console.error("hub image s3 upload failed, using data url", e); }
      }
      const images = ([{ url: url, createdAt: new Date().toISOString() }] as any[]).concat((d as any).images || []).slice(0, 12);
      await db.update(hubDreams).set({ imageUrl: url, images: images, updatedAt: new Date() }).where(eq(hubDreams.id, d.id));
      res.json({ imageUrl: url, images: images });
    } catch (e) { console.error("hub image", e); res.status(502).json({ error: "Could not create the dream image right now." }); }
  });

  // ---- AI: voice transcription. Audio sent as base64 (data URL) in JSON.
  // Uses OpenRouter (google/gemini-2.5-flash accepts audio input) so it runs on
  // the same working key as the readings; the OpenAI audio API is not used.
  app.post("/api/hub/transcribe", cors, auth, async (req, res) => {
    try {
      const uid = (req as any).hubUser as string;
      if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: "Voice transcription is not configured." });
      if (!rateLimit(`transcribe:${uid}`, 20, 60_000)) return res.status(429).json({ error: "Please wait a moment." });
      const body = req.body || {};
      const audio = String(body.audio || "");
      const b64 = audio.includes(",") ? audio.split(",")[1] : audio;
      if (!b64) return res.status(400).json({ error: "No audio received." });
      const buf = Buffer.from(b64, "base64");
      if (buf.length === 0) return res.status(400).json({ error: "Empty audio." });
      if (buf.length > 25 * 1024 * 1024) return res.status(413).json({ error: "Recording is too long." });
      var format = String(body.format || "wav").toLowerCase().replace(/[^a-z0-9]/g, "");
      var r = await fetch(OPENROUTER, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: [
            { type: "text", text: "Transcribe this audio verbatim. Output only the exact words spoken, with no quotation marks, labels, or commentary. If there is no discernible speech, output nothing." },
            { type: "input_audio", input_audio: { data: b64, format: format } }
          ] }]
        })
      });
      if (!r.ok) { console.error("hub transcribe openrouter", r.status, await r.text()); return res.status(502).json({ error: "Could not transcribe the audio." }); }
      var data: any = await r.json();
      var text = (data?.choices?.[0]?.message?.content || "").trim().replace(/^["'“‘]+|["'”’]+$/g, "").trim();
      res.json({ text: text });
    } catch (e) { console.error("hub transcribe", e); res.status(502).json({ error: "Could not transcribe the audio." }); }
  });

  // =========================================================================
  // Stateless AI reading + chat. NO identity, NO storage: the tool computes a
  // facts object client-side, sends it here, we narrate it and return. Public
  // and rate-limited by IP (like the AI Tarot endpoint). Nothing is saved.
  // =========================================================================
  function clientIp(req: Request): string {
    var fwd = (req.headers["x-forwarded-for"] as string) || "";
    return fwd.split(",")[0].trim() || (req.socket && req.socket.remoteAddress) || "anon";
  }
  var GUARDRAILS =
    " Interpret ONLY the specific data provided in the reading data; every insight must reference a specific factor from that data by name (for example a specific number, sign, house, aspect, or score). Never invent numbers, placements, or facts that are not in the data. This is reflective self-insight, not prediction, and never medical, financial, legal, or life-and-death advice. Frame difficulties as opportunities for growth. Write warmly in the second person as flowing prose, no markdown headings and no bulleted lists. Return plain prose only, with no surrounding tags, labels, or code fences. Do not use em dashes or en dashes.";
  function clean(t: string): string {
    return (t || "").trim()
      .replace(/^\s*<[a-zA-Z_][^>]*>\s*/, "").replace(/\s*<\/[a-zA-Z_][^>]*>\s*$/, "")
      // Normalize every dash-like tell to plain punctuation (em/en dash, or a
      // hyphen used as a dash with surrounding spaces). Hyphenated words such as
      // "long-term" have no surrounding spaces and are untouched.
      .replace(/\s*[—–]\s*/g, ", ")
      .replace(/ +- +/g, ", ")
      .trim();
  }
  var KINDS: Record<string, { role: string; words: number }> = {
    numerology: { role: "You are a wise, warm numerologist giving a personal reading.", words: 320 },
    "birth-chart": { role: "You are an insightful astrologer interpreting a natal chart.", words: 380 },
    compatibility: { role: "You are a relationship astrologer interpreting the synastry between two charts.", words: 340 },
    attachment: { role: "You are a compassionate attachment-style coach.", words: 300 },
    fortune: { role: "You are writing a short, uplifting daily reading.", words: 110 },
    transits: { role: "You are an astrologer describing what current sky transits mean for a person's natal chart right now.", words: 260 },
  };
  function factsMsg(facts: any, extra?: string) {
    return "Here is the reading data (the computed facts). " + (extra || "") + "\n<reading_data>\n" + JSON.stringify(facts, null, 2) + "\n</reading_data>";
  }

  app.post("/api/hub/ai/interpret", cors, async (req, res) => {
    try {
      if (!rateLimit(`ai-interp:${clientIp(req)}`, 15, 60_000)) return res.status(429).json({ error: "Please wait a moment before generating another reading." });
      const b = req.body || {};
      const kind = KINDS[String(b.kind)] ? String(b.kind) : null;
      if (!kind) return res.status(400).json({ error: "Unknown reading type." });
      if (!b.facts || typeof b.facts !== "object") return res.status(400).json({ error: "Missing reading data." });
      const sys = KINDS[kind].role + GUARDRAILS + " Keep the whole reading to about " + KINDS[kind].words + " words.";
      const extra = b.mode ? ("This is a " + String(b.mode).slice(0, 30) + " reading.") : "";
      const text = await openrouterText(sys, [{ role: "user", content: factsMsg(b.facts, extra) }], Math.ceil(KINDS[kind].words * 2.2));
      if (!text) return res.status(502).json({ error: "Could not generate the reading right now." });
      res.json({ text: clean(text) });
    } catch (e) { console.error("hub ai interpret", e); res.status(502).json({ error: "Could not generate the reading right now." }); }
  });

  app.post("/api/hub/ai/chat", cors, async (req, res) => {
    try {
      if (!rateLimit(`ai-chat:${clientIp(req)}`, 30, 60_000)) return res.status(429).json({ error: "Please slow down a moment." });
      const b = req.body || {};
      const kind = KINDS[String(b.kind)] ? String(b.kind) : null;
      if (!kind) return res.status(400).json({ error: "Unknown reading type." });
      if (!b.facts || typeof b.facts !== "object") return res.status(400).json({ error: "Missing reading data." });
      const msgs = Array.isArray(b.messages) ? b.messages : [];
      if (!msgs.length) return res.status(400).json({ error: "Ask a question first." });
      const sys = KINDS[kind].role + " You are continuing a conversation about the person's reading." + GUARDRAILS + " Keep replies to a short paragraph or two.";
      const convo = [{ role: "user", content: factsMsg(b.facts, "Use this as grounding for the conversation.") }]
        .concat(msgs.slice(-12).map(function (m: any) { return { role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 1500) }; }));
      const reply = await openrouterText(sys, convo, 500);
      if (!reply) return res.status(502).json({ error: "No reply right now." });
      res.json({ reply: clean(reply) });
    } catch (e) { console.error("hub ai chat", e); res.status(502).json({ error: "Could not reply right now." }); }
  });

  // Short AI title for a dream narrative (used by the Dream Journal form).
  app.post("/api/hub/ai/title", cors, async (req, res) => {
    try {
      if (!rateLimit(`ai-title:${clientIp(req)}`, 20, 60_000)) return res.status(429).json({ error: "Please wait a moment." });
      var narrative = String((req.body || {}).narrative || "").trim();
      if (!narrative) return res.status(400).json({ error: "Write your dream first." });
      var sys = "You write a short, evocative title for a dream. Output only the title, two to six words, with no quotation marks and no ending punctuation. Do not use em dashes or en dashes.";
      var text = await openrouterText(sys, [{ role: "user", content: "Dream:\n" + narrative.slice(0, 4000) }], 30);
      if (!text) return res.status(502).json({ error: "Could not suggest a title." });
      res.json({ title: clean(text).replace(/["'.]+$/g, "").slice(0, 80) });
    } catch (e) { console.error("hub ai title", e); res.status(502).json({ error: "Could not suggest a title." }); }
  });
}
