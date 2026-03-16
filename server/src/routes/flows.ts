import { Router } from "express";
import { v4 as uuid } from "uuid";
import { getHub, saveHub } from "../storage/gcs.js";
import type { EnergyFlow, MaterialFlow } from "../types.js";

export const flowsRouter = Router();

// ── Energy Flows ──

flowsRouter.get("/:hubId/energy-flows", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });
  res.json(hub.energyFlows);
});

flowsRouter.post("/:hubId/energy-flows", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });

  const flow: EnergyFlow = { ...req.body };
  hub.energyFlows.push(flow);

  // Auto-update sankey nodes
  updateSankeyNodes(hub);
  await saveHub(hub);
  res.status(201).json(flow);
});

flowsRouter.put("/:hubId/energy-flows/:index", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });

  const idx = parseInt(req.params.index, 10);
  if (idx < 0 || idx >= hub.energyFlows.length) {
    return res.status(404).json({ error: "Flow not found" });
  }

  hub.energyFlows[idx] = { ...hub.energyFlows[idx], ...req.body };
  updateSankeyNodes(hub);
  await saveHub(hub);
  res.json(hub.energyFlows[idx]);
});

flowsRouter.delete("/:hubId/energy-flows/:index", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });

  const idx = parseInt(req.params.index, 10);
  if (idx < 0 || idx >= hub.energyFlows.length) {
    return res.status(404).json({ error: "Flow not found" });
  }

  hub.energyFlows.splice(idx, 1);
  updateSankeyNodes(hub);
  await saveHub(hub);
  res.status(204).send();
});

// Bulk replace all energy flows
flowsRouter.put("/:hubId/energy-flows", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });

  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: "Body must be an array of energy flows" });
  }

  hub.energyFlows = req.body;
  updateSankeyNodes(hub);
  await saveHub(hub);
  res.json(hub.energyFlows);
});

// ── Material Flows ──

flowsRouter.get("/:hubId/material-flows", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });
  res.json(hub.materialFlows);
});

flowsRouter.post("/:hubId/material-flows", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });

  const flow: MaterialFlow = {
    ...req.body,
    id: req.body.id || uuid(),
  };

  hub.materialFlows.push(flow);
  await saveHub(hub);
  res.status(201).json(flow);
});

flowsRouter.put("/:hubId/material-flows/:flowId", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });

  const idx = hub.materialFlows.findIndex((f) => f.id === req.params.flowId);
  if (idx === -1) return res.status(404).json({ error: "Flow not found" });

  hub.materialFlows[idx] = { ...hub.materialFlows[idx], ...req.body, id: req.params.flowId };
  await saveHub(hub);
  res.json(hub.materialFlows[idx]);
});

flowsRouter.delete("/:hubId/material-flows/:flowId", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });

  const idx = hub.materialFlows.findIndex((f) => f.id === req.params.flowId);
  if (idx === -1) return res.status(404).json({ error: "Flow not found" });

  hub.materialFlows.splice(idx, 1);
  await saveHub(hub);
  res.status(204).send();
});

// ── Helper: Auto-generate sankey nodes from flow sources/targets + companies ──

function updateSankeyNodes(hub: import("../types.js").HubDataset): void {
  const nodeIds = new Set<string>();
  const companyIds = new Set(Object.keys(hub.companies));

  for (const flow of hub.energyFlows) {
    nodeIds.add(flow.source);
    nodeIds.add(flow.target);
  }

  // Default colors for intermediary nodes
  const intermediaryColors: Record<string, string> = {
    strøm: "#FBBF24",
    spillvarme: "#F97316",
    fjernvarme: "#EF4444",
    biogass: "#22C55E",
    hydrogen: "#38BDF8",
  };

  hub.sankeyNodes = Array.from(nodeIds).map((id) => {
    const company = hub.companies[id];
    if (company) {
      return { id, label: company.name, color: company.color };
    }
    return {
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      color: intermediaryColors[id] ?? "#94A3B8",
    };
  });
}
