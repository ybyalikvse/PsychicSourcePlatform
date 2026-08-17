/* Creates the Member Tools Hub Dream Journal tables in the (Supabase) database.
 * Surgical and non-destructive: CREATE TABLE IF NOT EXISTS + indexes, then
 * enable RLS (the app connects as the postgres role, which bypasses RLS, so
 * this does not affect the app; it just denies direct PostgREST access, matching
 * the rest of the public tables). Run: tsx script/create-hub-tables.ts
 */
import pg from "pg";

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const SQL = `
CREATE TABLE IF NOT EXISTS hub_dreams (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  dreamt_on date NOT NULL,
  title text,
  narrative text NOT NULL,
  mood text,
  is_lucid boolean NOT NULL DEFAULT false,
  is_recurring boolean NOT NULL DEFAULT false,
  is_nightmare boolean NOT NULL DEFAULT false,
  tags jsonb,
  interpretation text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hub_dreams_user_idx ON hub_dreams(user_id);
CREATE INDEX IF NOT EXISTS hub_dreams_dreamt_idx ON hub_dreams(dreamt_on);

CREATE TABLE IF NOT EXISTS hub_dream_messages (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  dream_id text NOT NULL REFERENCES hub_dreams(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hub_dream_msgs_dream_idx ON hub_dream_messages(dream_id);

ALTER TABLE hub_dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_dream_messages ENABLE ROW LEVEL SECURITY;
`;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(SQL);
    const { rows } = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name IN ('hub_dreams','hub_dream_messages') ORDER BY table_name"
    );
    console.log("Tables present:", rows.map((r) => r.table_name).join(", "));
  } finally {
    await pool.end();
  }
}
main().then(() => { console.log("done"); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
