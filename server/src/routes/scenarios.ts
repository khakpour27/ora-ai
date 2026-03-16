import { Router } from "express";
import { v4 as uuid } from "uuid";
import { getHub } from "../storage/gcs.js";
import {
  listScenarios,
  getScenario,
  saveScenario,
  deleteScenario,
} from "../storage/gcs.js";
import type { Scenario, ScenarioMutation } from "../types.js";

export const scenariosRouter = Router();

// List scenarios for a hub
scenariosRouter.get("/:hubId/scenarios", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });

  const scenarios = await listScenarios(req.params.hubId);
  res.json(scenarios);
});

// Get a single scenario
scenariosRouter.get("/:hubId/scenarios/:scenarioId", async (req, res) => {
  const scenario = await getScenario(req.params.hubId, req.params.scenarioId);
  if (!scenario) return res.status(404).json({ error: "Scenario not found" });
  res.json(scenario);
});

// Create a scenario
scenariosRouter.post("/:hubId/scenarios", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });

  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const scenario: Scenario = {
    id: uuid(),
    hubId: req.params.hubId,
    name,
    description: description ?? "",
    mutations: [],
    color: color ?? "#8B5CF6",
    createdAt: new Date().toISOString(),
  };

  await saveScenario(scenario);
  res.status(201).json(scenario);
});

// Update a scenario (full replace)
scenariosRouter.put("/:hubId/scenarios/:scenarioId", async (req, res) => {
  const existing = await getScenario(req.params.hubId, req.params.scenarioId);
  if (!existing) return res.status(404).json({ error: "Scenario not found" });

  const updated: Scenario = {
    ...req.body,
    id: existing.id,
    hubId: existing.hubId,
    createdAt: existing.createdAt,
  };

  await saveScenario(updated);
  res.json(updated);
});

// Add a mutation to a scenario
scenariosRouter.post("/:hubId/scenarios/:scenarioId/mutations", async (req, res) => {
  const scenario = await getScenario(req.params.hubId, req.params.scenarioId);
  if (!scenario) return res.status(404).json({ error: "Scenario not found" });

  const mutation: ScenarioMutation = {
    ...req.body,
    id: uuid(),
  };

  scenario.mutations.push(mutation);
  await saveScenario(scenario);
  res.status(201).json(mutation);
});

// Remove a mutation from a scenario
scenariosRouter.delete(
  "/:hubId/scenarios/:scenarioId/mutations/:mutationId",
  async (req, res) => {
    const scenario = await getScenario(req.params.hubId, req.params.scenarioId);
    if (!scenario) return res.status(404).json({ error: "Scenario not found" });

    const idx = scenario.mutations.findIndex((m) => m.id === req.params.mutationId);
    if (idx === -1) return res.status(404).json({ error: "Mutation not found" });

    scenario.mutations.splice(idx, 1);
    await saveScenario(scenario);
    res.status(204).send();
  }
);

// Delete a scenario
scenariosRouter.delete("/:hubId/scenarios/:scenarioId", async (req, res) => {
  const deleted = await deleteScenario(req.params.hubId, req.params.scenarioId);
  if (!deleted) return res.status(404).json({ error: "Scenario not found" });
  res.status(204).send();
});
