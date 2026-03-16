import { Router } from "express";
import { getHub } from "../storage/gcs.js";
import { getScenario } from "../storage/gcs.js";
import type { HubDataset } from "../types.js";

export const exportRouter = Router();

// Export hub as JSON (downloadable)
exportRouter.get("/:hubId/export/json", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${hub.name}.json"`);
  res.json(hub);
});

// Export hub as CSV (companies, energy flows, material flows as separate sections)
exportRouter.get("/:hubId/export/csv", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });

  const sections: string[] = [];

  // Companies
  const companies = Object.values(hub.companies);
  if (companies.length > 0) {
    sections.push("# Companies");
    sections.push("id,name,shortName,sector,lat,lng,annualEnergyGWh,annualWasteTonnes,employeeCount");
    for (const c of companies) {
      sections.push(
        [c.id, csvEscape(c.name), csvEscape(c.shortName), csvEscape(c.sector), c.coordinates[0], c.coordinates[1], c.annualEnergyGWh, c.annualWasteTonnes, c.employeeCount].join(",")
      );
    }
  }

  // Energy flows
  if (hub.energyFlows.length > 0) {
    sections.push("");
    sections.push("# Energy Flows");
    sections.push("source,target,value,type,status");
    for (const f of hub.energyFlows) {
      sections.push([f.source, f.target, f.value, f.type, f.status].join(","));
    }
  }

  // Material flows
  if (hub.materialFlows.length > 0) {
    sections.push("");
    sections.push("# Material Flows");
    sections.push("id,source,target,material,volumeTonnesPerYear,status,matchScore");
    for (const f of hub.materialFlows) {
      sections.push(
        [f.id, f.source, f.target, csvEscape(f.material), f.volumeTonnesPerYear, f.status, f.matchScore].join(",")
      );
    }
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${hub.name}.csv"`);
  res.send(sections.join("\n"));
});

// Export KPI summary as JSON
exportRouter.get("/:hubId/export/kpis", async (req, res) => {
  const hub = await getHub(req.params.hubId);
  if (!hub) return res.status(404).json({ error: "Hub not found" });

  const kpis = computeKPIs(hub);
  res.json(kpis);
});

// ── Helpers ──

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function computeKPIs(hub: HubDataset) {
  const companies = Object.values(hub.companies);
  const totalEnergyGWh = companies.reduce((sum, c) => sum + c.annualEnergyGWh, 0);
  const totalWasteTonnes = companies.reduce((sum, c) => sum + c.annualWasteTonnes, 0);
  const symbiosisCount = hub.symbiosisOpportunities.length;
  const potentialCO2Reduction = hub.symbiosisOpportunities.reduce(
    (sum, s) => sum + s.co2ReductionTonnes, 0
  );
  const totalInvestment = hub.businessCases.reduce(
    (sum, b) => sum + b.investmentMNOK, 0
  );
  const totalNPV = hub.businessCases.reduce((sum, b) => sum + b.npvMNOK, 0);
  const energySavings = hub.energyOptimizations.reduce(
    (sum, o) => sum + o.savingGWh, 0
  );

  return {
    hubName: hub.name,
    companyCount: companies.length,
    totalEnergyGWh,
    totalWasteTonnes,
    energyFlowCount: hub.energyFlows.length,
    materialFlowCount: hub.materialFlows.length,
    symbiosisCount,
    potentialCO2Reduction,
    energySavingsGWh: energySavings,
    totalInvestmentMNOK: totalInvestment,
    totalNPVMNOK: totalNPV,
  };
}
