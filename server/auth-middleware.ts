import * as firebaseAdmin from "firebase-admin";

// Admin email allowlist — any Firebase user whose verified email is in this list
// is treated as an admin. Keep this in sync with any UI-side admin gating.
export const ADMIN_EMAILS = [
  "ybyalik@gmail.com",
  "ybyalik@vseinc.com",
];

let firebaseInitialized = false;
function ensureFirebaseInit() {
  if (firebaseInitialized) return;
  if (!firebaseAdmin.apps.length) {
    firebaseAdmin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    });
  }
  firebaseInitialized = true;
}

/**
 * Express middleware: requires the caller to present a Firebase ID token via
 * `Authorization: Bearer <idToken>` and for the token's email to be in
 * ADMIN_EMAILS. Attaches `req.adminEmail` on success.
 */
export async function verifyAdminAuth(req: any, res: any, next: any) {
  ensureFirebaseInit();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase();
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: "Admin access required" });
    }
    req.adminEmail = email;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid authentication token" });
  }
}

/**
 * Accepts either a valid admin Firebase ID token OR the shared CRON_SECRET.
 * Use on endpoints that are called from both the admin UI and scheduled crons /
 * GitHub Actions. Sets `req.isCron = true` when the cron path was taken.
 */
export function verifyAdminOrCron(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    req.isCron = true;
    return next();
  }
  return verifyAdminAuth(req, res, next);
}
