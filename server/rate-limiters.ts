import rateLimit from "express-rate-limit";

/**
 * Strict per-IP rate limiter for endpoints that trigger expensive third-party
 * calls (LLMs, video generation, image generation, scraping). The cap is
 * generous enough not to impact normal admin use but catches runaway loops or
 * a misbehaving client.
 *
 * Behind Vercel/proxies, this depends on `app.set("trust proxy", 1)` in the
 * server entrypoint so req.ip reflects the actual client.
 */
export const expensiveApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 60, // 60 requests / hour / IP for expensive ops
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Rate limit reached for expensive operations. Please wait and try again.",
  },
});
