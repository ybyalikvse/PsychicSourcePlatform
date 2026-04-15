import { storage } from "./storage";

async function runAllSweeps() {
  try { await releaseExpiredClaims(); } catch (e) { console.error("[Video Cron] releaseExpiredClaims:", e); }
  try { await failStuckVspGenerations(); } catch (e) { console.error("[Video Cron] failStuckVspGenerations:", e); }
  try { await sweepOrphanedS3Uploads(); } catch (e) { console.error("[Video Cron] sweepOrphanedS3Uploads:", e); }
}

export async function startVideoCrons() {
  const cron = (await import("node-cron")).default;
  cron.schedule("0 */6 * * *", async () => {
    console.log("[Video Cron] Running scheduled cleanup sweeps...");
    await runAllSweeps();
  });

  setTimeout(async () => {
    console.log("[Video Cron] Running startup cleanup sweeps...");
    await runAllSweeps();
  }, 10000);
}

export async function releaseExpiredClaims() {
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

/**
 * VSP video generation jobs (Veo/Kling/etc) leave projects in `video_generating`
 * for the duration of the long-poll. If the function instance dies mid-job
 * (Vercel function timeout, browser closed, server crash) the project status
 * never advances and the project becomes a zombie. Mark anything stuck >2h as
 * failed so the user can retry.
 */
const VSP_STUCK_STATUSES = new Set([
  "video_generating",
  "script_generating",
  "audio_generating",
]);
const STUCK_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function failStuckVspGenerations() {
  const projects = await storage.getVspProjects();
  const now = Date.now();
  let failedCount = 0;

  for (const p of projects as any[]) {
    if (!VSP_STUCK_STATUSES.has(p.status)) continue;
    const last = p.updatedAt ? new Date(p.updatedAt).getTime() : (p.createdAt ? new Date(p.createdAt).getTime() : 0);
    if (!last || now - last < STUCK_THRESHOLD_MS) continue;

    try {
      await storage.updateVspProject(p.id, {
        status: "error",
        errorMessage: `Generation stuck in "${p.status}" for over ${Math.round((now - last) / 3600000)}h — auto-failed by cleanup.`,
      } as any);
      console.log(`[Video Cron] Failed stuck VSP project ${p.id} (was ${p.status} since ${p.updatedAt})`);
      failedCount++;
    } catch (err) {
      console.error(`[Video Cron] Could not fail stuck project ${p.id}:`, err);
    }
  }

  if (failedCount > 0) {
    console.log(`[Video Cron] Failed ${failedCount} stuck VSP generation(s)`);
  } else {
    console.log("[Video Cron] No stuck VSP generations");
  }
}

/**
 * Delete S3 objects under video-submissions/ that aren't referenced by any
 * video_request.videoUrl. Catches the orphaned-upload case where the browser
 * uploaded to S3 but the confirm-upload step never landed (network drop,
 * function crash, etc.).
 *
 * Only deletes objects older than the GRACE_MS window so we don't race with
 * an in-flight upload that just hasn't called confirm-upload yet.
 */
const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function sweepOrphanedS3Uploads() {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log("[Video Cron] S3 not configured — skipping orphan sweep");
    return;
  }

  const { S3Client, ListObjectsV2Command, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  // Build the set of in-use S3 keys (from videoUrl + watermarkedVideoUrl across all requests).
  const allRequests = await storage.getVideoRequests();
  const inUse = new Set<string>();
  for (const r of allRequests) {
    if (r.videoUrl) inUse.add(stripUrlToKey(r.videoUrl));
    if (r.watermarkedVideoUrl) inUse.add(stripUrlToKey(r.watermarkedVideoUrl));
  }

  // Walk video-submissions/ pages, delete unreferenced objects older than the grace window.
  const cutoff = Date.now() - ORPHAN_GRACE_MS;
  let deletedCount = 0;
  let continuationToken: string | undefined;
  do {
    const list = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: "video-submissions/",
      ContinuationToken: continuationToken,
    }));
    for (const obj of list.Contents || []) {
      if (!obj.Key) continue;
      if (inUse.has(obj.Key)) continue;
      if (obj.LastModified && obj.LastModified.getTime() > cutoff) continue;
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key }));
        console.log(`[Video Cron] Deleted orphaned S3 object: ${obj.Key} (modified ${obj.LastModified?.toISOString()})`);
        deletedCount++;
      } catch (err) {
        console.error(`[Video Cron] Failed to delete S3 object ${obj.Key}:`, err);
      }
    }
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  if (deletedCount > 0) {
    console.log(`[Video Cron] S3 sweep deleted ${deletedCount} orphaned object(s)`);
  } else {
    console.log("[Video Cron] S3 sweep found no orphans");
  }
}

function stripUrlToKey(value: string): string {
  // videoUrl stored either as the raw S3 key or as a full https URL — normalize
  // to the key (path after the bucket).
  if (!value.startsWith("http")) return value;
  try {
    const u = new URL(value);
    return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
  } catch {
    return value;
  }
}
