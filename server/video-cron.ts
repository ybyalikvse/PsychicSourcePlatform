import cron from "node-cron";
import { storage } from "./storage";

export function startVideoCrons() {
  cron.schedule("0 */6 * * *", async () => {
    console.log("[Video Cron] Checking for expired claimed video requests...");
    try {
      await releaseExpiredClaims();
    } catch (error) {
      console.error("[Video Cron] Error releasing expired claims:", error);
    }
  });

  setTimeout(async () => {
    console.log("[Video Cron] Running startup check for expired claims...");
    try {
      await releaseExpiredClaims();
    } catch (error) {
      console.error("[Video Cron] Startup check error:", error);
    }
  }, 10000);
}

async function releaseExpiredClaims() {
  const claimedRequests = await storage.getVideoRequests("claimed");
  const now = new Date();
  let releasedCount = 0;

  for (const request of claimedRequests) {
    if (request.requiredDate) {
      const requiredDate = new Date(request.requiredDate);
      if (requiredDate < now) {
        await storage.updateVideoRequest(request.id, {
          status: "available",
          claimedBy: null,
          claimedAt: null,
        });
        console.log(`[Video Cron] Released expired claim: ${request.title} (was due ${request.requiredDate})`);
        releasedCount++;
      }
    }
  }

  if (releasedCount > 0) {
    console.log(`[Video Cron] Released ${releasedCount} expired claims`);
  } else {
    console.log("[Video Cron] No expired claims found");
  }
}
