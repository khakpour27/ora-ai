/**
 * Seed script: uploads the demo hub dataset to GCS.
 * Run: npx tsx src/seed.ts
 *
 * This reads the pre-built demo JSON from server/data/demo-hub.json
 * and uploads it to gs://gameasseets/suns-ai/hubs/demo.json
 */
import { Storage } from "@google-cloud/storage";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUCKET = process.env.GCS_BUCKET ?? "gameasseets";
const PREFIX = process.env.GCS_PREFIX ?? "suns-ai";

async function main() {
  const storage = new Storage();
  const bucket = storage.bucket(BUCKET);

  const demoPath = resolve(__dirname, "../data/demo-hub.json");
  const demoData = readFileSync(demoPath, "utf-8");

  const file = bucket.file(`${PREFIX}/hubs/demo.json`);
  await file.save(demoData, { contentType: "application/json" });

  console.log(`Seeded demo hub to gs://${BUCKET}/${PREFIX}/hubs/demo.json`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
