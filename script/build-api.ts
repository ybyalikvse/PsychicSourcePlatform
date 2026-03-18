import { build } from "esbuild";

// Bundle the API serverless function into a single file
// so Vercel doesn't need to resolve imports from server/ and shared/
async function buildApi() {
  const entryPoints = [
    "api/index.ts",
    "api/cron/horoscopes.ts",
    "api/cron/video-cleanup.ts",
  ];

  for (const entry of entryPoints) {
    const outfile = entry.replace(".ts", ".js");
    console.log(`bundling ${entry} → ${outfile}...`);

    await build({
      entryPoints: [entry],
      platform: "node",
      bundle: true,
      format: "esm",
      outfile,
      external: [
        // Node built-ins
        "node:*",
        // Heavy native modules that Vercel provides
        "sharp",
        // Packages that don't bundle well — Vercel's node_modules handles them
        "@aws-sdk/*",
        "@google/genai",
        "firebase-admin",
        "firebase-admin/*",
        "pg",
        "pg-native",
      ],
      define: {
        "process.env.NODE_ENV": '"production"',
      },
      logLevel: "info",
      // Keep banner for ESM compat
      banner: {
        js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
      },
    });
  }

  console.log("API functions bundled successfully.");
}

buildApi().catch((err) => {
  console.error(err);
  process.exit(1);
});
