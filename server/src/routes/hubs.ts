import { Router } from "express";
import { v4 as uuid } from "uuid";
import { listHubs, getHub, saveHub, deleteHub } from "../storage/gcs.js";
import type { HubDataset } from "../types.js";

export const hubsRouter = Router();

// List all hubs (id, name, updatedAt only)
hubsRouter.get("/", async (_req, res) => {
  const hubs = await listHubs();
  res.json(hubs);
});

// Get a single hub with all data
hubsRouter.get("/:hubId", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });
  res.json(hub);
});

// Create a new hub
hubsRouter.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name is required" });
  }

  const now = new Date().toISOString();
  const dataset: HubDataset = {
    id: uuid(),
    name,
    createdAt: now,
    updatedAt: now,
    companies: {},
    sankeyNodes: [],
    energyFlows: [],
    surplusDeficitData: [],
    energyOptimizations: [],
    materialFlows: [],
    wasteStreams: [],
    matchingMatrix: [],
    symbiosisOpportunities: [],
    businessCases: [],
    dashboardKPIs: [],
    workPackageStatuses: [],
    aiInsights: [],
  };

  await saveHub(dataset);
  res.status(201).json(dataset);
});

// Update a hub (full replace)
hubsRouter.put("/:hubId", async (req, res) => {
  const existing = await getHub(req.params.hubId);
  if (!existing) return res.status(404).json({ error: "Hub not found" });

  const updated: HubDataset = {
    ...req.body,
    id: existing.id, // Prevent ID change
    createdAt: existing.createdAt, // Preserve creation date
  };

  await saveHub(updated);
  res.json(updated);
});

// Patch specific fields of a hub
hubsRouter.patch("/:hubId", async (req, res) => {
  const existing = await getHub(req.params.hubId);
  if (!existing) return res.status(404).json({ error: "Hub not found" });

  const updated: HubDataset = {
    ...existing,
    ...req.body,
    id: existing.id,
    createdAt: existing.createdAt,
  };

  await saveHub(updated);
  res.json(updated);
});

// Delete a hub and its scenarios
hubsRouter.delete("/:hubId", async (req, res) => {
  const deleted = await deleteHub(req.params.hubId);
  if (!deleted) return res.status(404).json({ error: "Hub not found" });
  res.status(204).send();
});
