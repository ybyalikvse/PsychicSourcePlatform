import "dotenv/config";
import { runHoroscopeGeneration } from "../horoscope-cron";

export default async function handler(req: any, res: any) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const type = (req.query.type as string) || "daily";
  if (!["daily", "weekly", "monthly"].includes(type)) {
    return res.status(400).json({ error: "Invalid type. Must be daily, weekly, or monthly." });
  }

  try {
    console.log(`[Cron] Running ${type} horoscope generation...`);
    await runHoroscopeGeneration(type);
    res.json({ success: true, type });
  } catch (error: any) {
    console.error(`[Cron] Horoscope generation error:`, error);
    res.status(500).json({ error: error.message });
  }
}
