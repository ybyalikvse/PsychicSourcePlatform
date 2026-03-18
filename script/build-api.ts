import { build } from "esbuild";
import { mkdir } from "fs/promises";

async function buildApi() {
  await mkdir("api/cron", { recursive: true });

  const builds = [
    { entry: "server/api-entries/index.ts", out: "api/index.js" },
    { entry: "server/api-entries/cron-horoscopes.ts", out: "api/cron/horoscopes.js" },
    { entry: "server/api-entries/cron-video-cleanup.ts", out: "api/cron/video-cleanup.js" },
  ];

  for (const { entry, out } of builds) {
    console.log(`bundling ${entry} → ${out}...`);
    await build({
      entryPoints: [entry],
      platform: "node",
      bundle: true,
      format: "esm",
      outfile: out,
      external: [
        "sharp",
        "pg-native",
      ],
      logLevel: "info",
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
