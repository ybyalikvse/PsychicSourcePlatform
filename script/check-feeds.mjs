#!/usr/bin/env node
/**
 * Verifies the public horoscope feeds the way psychicsource.com's nightly job
 * consumes them, and fails loudly when the answer is wrong.
 *
 * This exists because both real outages returned HTTP 200 with valid XML:
 *   - the +3 day simply had not been generated yet, so the pull 404'd
 *   - a stale CDN copy served a previous day's feed under the wrong pubDate
 * Neither is an exception, so error tracking would not have caught either one.
 * The check that catches both is asserting the feed's own pubDate equals the
 * date we asked for.
 *
 * Deliberately dependency-free (node's global fetch) so CI needs no install,
 * and deliberately does NOT cache-bust: we want to see exactly what a consumer
 * sees, stale edge copies included.
 *
 * Usage:  node script/check-feeds.mjs [--self-test]
 * Env:    APP_URL (default: production), REQUEST_TIMEOUT_MS, SLOW_WARN_MS
 */

const APP_URL = (process.env.APP_URL || "https://psychic-source-platform.vercel.app").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 20000);
const SLOW_WARN_MS = Number(process.env.SLOW_WARN_MS || 3000);
const SIGNS_PER_FEED = 12;

// Site/language pairs that have an active prompt. pathforward has no Spanish,
// so it is intentionally absent rather than missing.
const COMBOS = [
  { site: "psychicsource", language: "en" },
  { site: "psychicsource", language: "es" },
  { site: "pathforward", language: "en" },
];

// The consumer requests today+3; -1..3 covers everything it asks for.
const DAILY_OFFSETS = [-1, 0, 1, 2, 3];

const ymd = (d) => d.toISOString().slice(0, 10);

/** Period start the server should resolve to, computed in UTC to match it. */
function expectedPeriodStart(type, now, offsetDays = 0) {
  const d = new Date(now);
  if (type === "daily") {
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return ymd(d);
  }
  if (type === "weekly") {
    const dow = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
    return ymd(d);
  }
  return ymd(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
}

/** Pull the channel-level pubDate and item count out of a feed body. */
export function parseFeed(xml) {
  const pub = xml.match(/<pubDate>([^<]+)<\/pubDate>/);
  const parsed = pub ? new Date(pub[1]) : null;
  return {
    periodStart: parsed && !Number.isNaN(parsed.getTime()) ? ymd(parsed) : null,
    items: (xml.match(/<item>/g) || []).length,
    label: (xml.match(/<description>Horoscopes for ([^<]*)<\/description>/) || [])[1] || null,
  };
}

/** Compare a fetched feed against what it should have been. Pure, so testable. */
export function evaluate({ status, body, expectedStart, ms }) {
  const problems = [];
  if (status !== 200) {
    problems.push(`HTTP ${status}` + (status === 404 ? " — not generated yet" : ""));
    return { ok: false, problems, parsed: null };
  }
  const parsed = parseFeed(body);
  if (parsed.periodStart !== expectedStart) {
    problems.push(`wrong period: asked for ${expectedStart}, got ${parsed.periodStart ?? "unparseable"}` +
      (parsed.periodStart && parsed.periodStart < expectedStart ? " (stale cache?)" : ""));
  }
  if (parsed.items !== SIGNS_PER_FEED) {
    problems.push(`${parsed.items}/${SIGNS_PER_FEED} signs`);
  }
  if (ms != null && ms > REQUEST_TIMEOUT_MS) problems.push(`timed out after ${ms}ms`);
  return { ok: problems.length === 0, problems, parsed };
}

async function fetchFeed(url) {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: "application/xml" } });
    const body = await res.text();
    return { status: res.status, body, ms: Date.now() - started };
  } catch (err) {
    return { status: 0, body: "", ms: Date.now() - started, error: err.name === "AbortError"
      ? `no response within ${REQUEST_TIMEOUT_MS}ms` : String(err.message || err) };
  } finally {
    clearTimeout(timer);
  }
}

function buildChecks(now) {
  const checks = [];
  for (const { site, language } of COMBOS) {
    for (const off of DAILY_OFFSETS) {
      checks.push({
        name: `daily ${language}/${site} PCF=${off}`,
        url: `${APP_URL}/api/horoscopes/feed/daily/${language}/${site}?PCF=${off}`,
        expectedStart: expectedPeriodStart("daily", now, off),
      });
    }
    for (const type of ["weekly", "monthly"]) {
      checks.push({
        name: `${type} ${language}/${site}`,
        url: `${APP_URL}/api/horoscopes/feed/${type}/${language}/${site}`,
        expectedStart: expectedPeriodStart(type, now),
      });
    }
  }
  return checks;
}

async function main() {
  // One timestamp for the whole run, so every expectation is internally
  // consistent. A run straddling UTC midnight could still disagree with the
  // server by a day; it reruns on the next schedule.
  const now = new Date();
  const checks = buildChecks(now);
  console.log(`Checking ${checks.length} feeds against ${APP_URL}`);
  console.log(`Run time: ${now.toISOString()} (all periods in UTC)\n`);

  const failures = [];
  let slow = 0;

  for (const check of checks) {
    const res = await fetchFeed(check.url);
    const verdict = evaluate({ ...res, expectedStart: check.expectedStart });
    if (res.error) verdict.problems.unshift(res.error);
    const bad = !verdict.ok || !!res.error;
    if (bad) failures.push({ ...check, ...verdict, ms: res.ms });
    if (!bad && res.ms > SLOW_WARN_MS) slow++;
    console.log(
      `${bad ? "FAIL" : "ok  "}  ${check.name.padEnd(34)} ` +
      `${String(res.ms).padStart(5)}ms  expected ${check.expectedStart}` +
      (bad ? `  <-- ${verdict.problems.join("; ")}`
           : `  ${verdict.parsed.items} signs${res.ms > SLOW_WARN_MS ? "  (slow)" : ""}`)
    );
  }

  console.log(`\n${checks.length - failures.length}/${checks.length} passed` +
    (slow ? `, ${slow} slower than ${SLOW_WARN_MS}ms` : ""));

  if (failures.length) {
    console.log(`\n${failures.length} feed(s) would fail the consumer's nightly pull:`);
    for (const f of failures) console.log(`  - ${f.name}: ${f.problems.join("; ")}`);
    console.log(`\nA wrong period usually means either the day was never generated,`);
    console.log(`or a CDN entry outlived the day it described.`);
    process.exit(1);
  }
  console.log("\nAll feeds serve the period they were asked for, with a full set of signs.");
}

/** Proves the detector actually detects, without needing a broken deployment. */
function selfTest() {
  const feed = (date, items) =>
    `<rss><channel><description>Horoscopes for x</description><pubDate>${date}</pubDate>` +
    "<item></item>".repeat(items) + "</channel></rss>";
  const cases = [
    ["correct feed passes", { status: 200, body: feed("Thu, 10 Sep 2026 00:00:00 GMT", 12), expectedStart: "2026-09-10" }, true],
    ["stale day is caught", { status: 200, body: feed("Wed, 09 Sep 2026 00:00:00 GMT", 12), expectedStart: "2026-09-10" }, false],
    ["partial sign set is caught", { status: 200, body: feed("Thu, 10 Sep 2026 00:00:00 GMT", 7), expectedStart: "2026-09-10" }, false],
    ["404 is caught", { status: 404, body: "", expectedStart: "2026-09-10" }, false],
    ["future date is caught", { status: 200, body: feed("Fri, 11 Sep 2026 00:00:00 GMT", 12), expectedStart: "2026-09-10" }, false],
  ];
  let bad = 0;
  for (const [name, input, shouldPass] of cases) {
    const { ok, problems } = evaluate(input);
    const good = ok === shouldPass;
    if (!good) bad++;
    console.log(`${good ? "ok  " : "FAIL"}  ${name.padEnd(30)} -> ok=${ok}${problems.length ? ` (${problems.join("; ")})` : ""}`);
  }
  console.log(bad ? `\n${bad} self-test(s) failed` : "\nself-tests passed: the detector flags stale days, short sets and 404s");
  process.exit(bad ? 1 : 0);
}

if (process.argv.includes("--self-test")) selfTest();
else main().catch((err) => { console.error("check-feeds crashed:", err); process.exit(1); });
