import { Storage } from "@google-cloud/storage";
import type { HubDataset, Scenario } from "../types.js";

const BUCKET_NAME = process.env.GCS_BUCKET ?? "gameasseets";
const BASE_PREFIX = process.env.GCS_PREFIX ?? "suns-ai";

const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

function hubPath(hubId: string): string {
  return `${BASE_PREFIX}/hubs/${hubId}.json`;
}

function scenarioPath(hubId: string, scenarioId: string): string {
  return `${BASE_PREFIX}/scenarios/${hubId}/${scenarioId}.json`;
}

// ── Hub CRUD ──

export async function listHubs(): Promise<{ id: string; name: string; updatedAt: string }[]> {
  const [files] = await bucket.getFiles({ prefix: `${BASE_PREFIX}/hubs/` });
  const hubs: { id: string; name: string; updatedAt: string }[] = [];

  for (const file of files) {
    if (!file.name.endsWith(".json")) continue;
    try {
      const [content] = await file.download();
      const data = JSON.parse(content.toString()) as HubDataset;
      hubs.push({ id: data.id, name: data.name, updatedAt: data.updatedAt });
    } catch {
      // Skip malformed files
    }
  }

  return hubs;
}

export async function getHub(hubId: string): Promise<HubDataset | null> {
  try {
    const [content] = await bucket.file(hubPath(hubId)).download();
    return JSON.parse(content.toString()) as HubDataset;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 404) {
      return null;
    }
    throw err;
  }
}

export async function saveHub(dataset: HubDataset): Promise<void> {
  dataset.updatedAt = new Date().toISOString();
  const file = bucket.file(hubPath(dataset.id));
  await file.save(JSON.stringify(dataset, null, 2), {
    contentType: "application/json",
  });
}

export async function deleteHub(hubId: string): Promise<boolean> {
  try {
    await bucket.file(hubPath(hubId)).delete();
    // Also delete all scenarios for this hub
    const [scenarioFiles] = await bucket.getFiles({
      prefix: `${BASE_PREFIX}/scenarios/${hubId}/`,
    });
    await Promise.all(scenarioFiles.map((f) => f.delete()));
    return true;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 404) {
      return false;
    }
    throw err;
  }
}

// ── Scenario CRUD ──

export async function listScenarios(hubId: string): Promise<Scenario[]> {
  const [files] = await bucket.getFiles({
    prefix: `${BASE_PREFIX}/scenarios/${hubId}/`,
  });
  const scenarios: Scenario[] = [];

  for (const file of files) {
    if (!file.name.endsWith(".json")) continue;
    try {
      const [content] = await file.download();
      scenarios.push(JSON.parse(content.toString()) as Scenario);
    } catch {
      // Skip malformed files
    }
  }

  return scenarios;
}

export async function getScenario(hubId: string, scenarioId: string): Promise<Scenario | null> {
  try {
    const [content] = await bucket.file(scenarioPath(hubId, scenarioId)).download();
    return JSON.parse(content.toString()) as Scenario;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 404) {
      return null;
    }
    throw err;
  }
}

export async function saveScenario(scenario: Scenario): Promise<void> {
  const file = bucket.file(scenarioPath(scenario.hubId, scenario.id));
  await file.save(JSON.stringify(scenario, null, 2), {
    contentType: "application/json",
  });
}

export async function deleteScenario(hubId: string, scenarioId: string): Promise<boolean> {
  try {
    await bucket.file(scenarioPath(hubId, scenarioId)).delete();
    return true;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 404) {
      return false;
    }
    throw err;
  }
}
