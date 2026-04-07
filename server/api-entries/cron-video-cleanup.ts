import "dotenv/config";
import { releaseExpiredClaims } from "../video-cron";

export default async function handler(req: any, res: any) {
  // Accept Vercel native cron header OR the manual CRON_SECRET
  const isVercelCron = req.headers["x-vercel-cron"] === "true" || req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
  if (!isVercelCron) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("[Cron] Running video cleanup...");
    await releaseExpiredClaims();
    res.json({ success: true });
  } catch (error: any) {
    console.error("[Cron] Video cleanup error:", error);
    res.status(500).json({ error: error.message });
  }
}
