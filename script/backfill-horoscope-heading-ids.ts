// One-time backfill: add stable section-heading ids to existing horoscope
// entries. Idempotent — addHeadingIds skips headings that already have an id,
// so rows are only rewritten when their content actually changes.
import "dotenv/config";
import pg from "pg";
import { addHeadingIds } from "../server/horoscope-headings";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const { rows } = await pool.query(
    "select id, site, type, content from horoscope_entries"
  );
  console.log(`Scanning ${rows.length} entries...`);

  let updated = 0;
  let unchanged = 0;
  const byKey: Record<string, number> = {};

  for (const row of rows) {
    const next = addHeadingIds(row.content, row.site, row.type);
    if (next === row.content) {
      unchanged += 1;
      continue;
    }
    await pool.query("update horoscope_entries set content = $1 where id = $2", [
      next,
      row.id,
    ]);
    updated += 1;
    const k = `${row.site}/${row.type}`;
    byKey[k] = (byKey[k] || 0) + 1;
  }

  console.log("\nDone.");
  console.log(`  updated:   ${updated}`);
  console.log(`  unchanged: ${unchanged}`);
  console.log("  by site/type:");
  for (const [k, n] of Object.entries(byKey).sort()) {
    console.log(`    ${k}: ${n}`);
  }
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
