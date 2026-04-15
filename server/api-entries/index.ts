import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../routes";
import { createServer } from "http";

const app = express();

// On Vercel the function runs behind their proxy; tell express to trust the
// first hop so req.ip reflects the actual client (needed for rate limiting).
app.set("trust proxy", 1);

app.use(
  express.json({
    limit: "4mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false, limit: "4mb" }));

// Diagnostic endpoint — check env vars without hitting the database
app.get("/api/health", (_req: any, res: any) => {
  const dbUrl = process.env.DATABASE_URL || "";
  res.json({
    ok: true,
    env: {
      DATABASE_URL: dbUrl ? dbUrl.replace(/:[^@]+@/, ":***@") : "NOT SET",
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "NOT SET",
      VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || "NOT SET",
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? "SET" : "NOT SET",
      NODE_ENV: process.env.NODE_ENV || "NOT SET",
    },
  });
});

let initialized = false;

async function ensureInitialized() {
  if (initialized) return;
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  initialized = true;
}

export default async function handler(req: Request, res: Response) {
  await ensureInitialized();
  app(req, res);
}
