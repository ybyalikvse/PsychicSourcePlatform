import type { Express, Request, Response, NextFunction } from "express";
import citiesData from "./assets/cities.json";

// GeoNames cities with population over 15,000. Fields are shortened to keep
// the bundle lean: n=name, a=ascii name (only when it differs), r=region,
// c=country, t=IANA timezone, y=lat, x=lon, p=population. Sorted by
// population descending so prefix search returns major cities first.
type City = { n: string; a?: string; r: string; c: string; t: string; y: number; x: number; p: number };
const CITIES = citiesData as City[];

// Former or common alternate city names people still type.
const CITY_ALIASES: Record<string, string> = {
  kiev: "kyiv",
  bombay: "mumbai",
  calcutta: "kolkata",
  madras: "chennai",
  saigon: "ho chi minh city",
  peking: "beijing",
  canton: "guangzhou",
  rangoon: "yangon",
  leningrad: "saint petersburg",
  constantinople: "istanbul",
};

function fold(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Precompute folded search keys once at startup.
const SEARCH_KEYS: string[][] = CITIES.map(city => {
  const keys = [fold(city.n)];
  if (city.a) keys.push(fold(city.a));
  return keys;
});

export function registerCalculatorRoutes(app: Express) {
  // The calculators are embedded on external sites, so these endpoints
  // must be callable cross-origin.
  const cors = (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
  };

  app.options("/api/calculators/cities", cors, (_req, res) => res.sendStatus(204));

  app.get("/api/calculators/cities", cors, (req, res) => {
    const raw = (req.query.q as string) || "";
    let q = fold(raw.trim());
    if (q.length < 2) return res.json([]);
    if (CITY_ALIASES[q]) q = CITY_ALIASES[q];

    const results: { name: string; region: string; country: string; timezone: string; lat: number; lon: number }[] = [];
    for (let i = 0; i < CITIES.length && results.length < 8; i++) {
      if (SEARCH_KEYS[i].some(k => k.startsWith(q))) {
        const city = CITIES[i];
        results.push({
          name: city.n,
          region: city.r,
          country: city.c,
          timezone: city.t,
          lat: city.y,
          lon: city.x,
        });
      }
    }
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.json(results);
  });

  // ---------- AI Tarot reading ----------
  // Public, cross-origin. The OpenRouter key stays server-side. Light
  // per-IP rate limit and a hard token cap keep costs bounded.
  const MAJOR_ARCANA = new Set([
    "The Fool","The Magician","The High Priestess","The Empress","The Emperor","The Hierophant",
    "The Lovers","The Chariot","Strength","The Hermit","Wheel of Fortune","Justice","The Hanged Man",
    "Death","Temperance","The Devil","The Tower","The Star","The Moon","The Sun","Judgement","The World",
  ]);
  const aiHits: Record<string, number[]> = {};
  function rateLimited(ip: string): boolean {
    const now = Date.now();
    const win = (aiHits[ip] || []).filter(t => now - t < 60000);
    win.push(now);
    aiHits[ip] = win;
    return win.length > 8; // max 8 readings/min/IP
  }

  app.options("/api/calculators/ai-tarot", cors, (_req, res) => res.sendStatus(204));

  app.post("/api/calculators/ai-tarot", cors, async (req: any, res) => {
    try {
      var ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").toString().split(",")[0].trim();
      if (rateLimited(ip)) return res.status(429).json({ error: "Please wait a moment before drawing again." });

      var body = req.body || {};
      var question = String(body.question || "").slice(0, 300).replace(/[<>]/g, "");
      var positions = ["Past", "Present", "Future"];
      var cards = Array.isArray(body.cards) ? body.cards.slice(0, 3) : [];
      if (cards.length !== 3 || !cards.every((c: any) => MAJOR_ARCANA.has(c))) {
        return res.status(400).json({ error: "Invalid cards." });
      }
      var spread = cards.map((c: string, i: number) => positions[i] + ": " + c).join("; ");
      var prompt =
        "You are a warm, insightful tarot reader giving a three-card Past/Present/Future reading. " +
        "The querent's question is: " + (question ? "\"" + question + "\"" : "(no specific question, a general reading)") + ". " +
        "The cards drawn are: " + spread + ". " +
        "Write a flowing, personal reading of about 180 to 240 words. Address the querent directly as 'you'. " +
        "Weave the three cards together into one narrative (how the past shaped the present and where it is heading), " +
        "not three disconnected blurbs. Be encouraging and specific but never make medical, legal, financial, or " +
        "life-or-death predictions. Do not use em dashes or en dashes. Do not use markdown headings. Plain paragraphs only.";

      var OpenAI = (await import("openai")).default;
      var openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: "https://openrouter.ai/api/v1" });
      var completion = await openai.chat.completions.create({
        model: "anthropic/claude-sonnet-4-5",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.85,
      });
      var reading = (completion.choices[0]?.message?.content || "").trim();
      if (!reading) return res.status(502).json({ error: "The cards are quiet right now. Please try again." });
      res.json({ reading: reading });
    } catch (e: any) {
      console.error("[AI Tarot] error:", e && e.message);
      res.status(500).json({ error: "Something interrupted the reading. Please try again." });
    }
  });
}
