import { Router } from "express";
import { v4 as uuid } from "uuid";
import { getHub, saveHub } from "../storage/gcs.js";
import type { Company } from "../types.js";

export const companiesRouter = Router();

// List companies for a hub
companiesRouter.get("/:hubId/companies", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });
  res.json(Object.values(hub.companies));
});

// Get a single company
companiesRouter.get("/:hubId/companies/:companyId", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });
  const company = hub.companies[req.params.companyId];
  if (!company) return res.status(404).json({ error: "Company not found" });
  res.json(company);
});

// Add a company
companiesRouter.post("/:hubId/companies", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });

  const company: Company = {
    ...req.body,
    id: req.body.id || uuid(),
  };

  hub.companies[company.id] = company;
  await saveHub(hub);
  res.status(201).json(company);
});

// Update a company
companiesRouter.put("/:hubId/companies/:companyId", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });
  if (!hub.companies[req.params.companyId]) {
    return res.status(404).json({ error: "Company not found" });
  }

  const updated: Company = {
    ...hub.companies[req.params.companyId],
    ...req.body,
    id: req.params.companyId,
  };

  hub.companies[req.params.companyId] = updated;
  await saveHub(hub);
  res.json(updated);
});

// Delete a company
companiesRouter.delete("/:hubId/companies/:companyId", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });
  if (!hub.companies[req.params.companyId]) {
    return res.status(404).json({ error: "Company not found" });
  }

  delete hub.companies[req.params.companyId];
  await saveHub(hub);
  res.status(204).send();
});
