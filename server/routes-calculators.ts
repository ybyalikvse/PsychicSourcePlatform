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
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
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
}
