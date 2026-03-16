/**
 * Generates PDF and PPTX reports from hub data.
 */
import type { HubDataset } from "@/lib/api";

/**
 * Generate a multi-page PDF report.
 */
export async function generatePDFReport(
  hub: HubDataset,
  scenarioName?: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  // Helper
  function addText(text: string, size: number, color: [number, number, number], bold = false) {
    doc.setFontSize(size);
    doc.setTextColor(...color);
    if (bold) doc.setFont("helvetica", "bold");
    else doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentW);
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.5) + 2;
  }

  function addLine() {
    doc.setDrawColor(100, 100, 100);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
  }

  function newPageIfNeeded(needed: number) {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // ── Cover page ──
  y = 80;
  addText(hub.name || "SymbioLink \u00d8ra", 24, [16, 185, 129], true);
  y += 5;
  addText("Prosjektrapport", 16, [148, 163, 184]);
  y += 5;
  addText(new Date().toLocaleDateString("nb-NO", { year: "numeric", month: "long", day: "numeric" }), 12, [148, 163, 184]);
  if (scenarioName) {
    y += 5;
    addText(`Scenario: ${scenarioName}`, 14, [59, 130, 246]);
  }

  // ── KPI Summary ──
  doc.addPage();
  y = margin;
  addText("Nøkkeltall", 18, [16, 185, 129], true);
  y += 3;
  addLine();

  for (const kpi of hub.dashboardKPIs) {
    newPageIfNeeded(15);
    addText(`${kpi.label}: ${kpi.value} ${kpi.unit}`, 11, [226, 232, 240]);
    addText(`  Trend: ${kpi.trend} ${kpi.trendValue}%`, 9, [148, 163, 184]);
    y += 2;
  }

  // ── Companies ──
  newPageIfNeeded(30);
  y += 5;
  addText("Bedrifter i hubben", 18, [16, 185, 129], true);
  y += 3;
  addLine();

  for (const company of Object.values(hub.companies)) {
    newPageIfNeeded(25);
    addText(company.name, 12, [226, 232, 240], true);
    addText(
      `Sektor: ${company.sector} | Energi: ${company.annualEnergyGWh} GWh/år | Avfall: ${company.annualWasteTonnes} t/år | Ansatte: ${company.employeeCount}`,
      9,
      [148, 163, 184]
    );
    y += 3;
  }

  // ── Symbiosis Opportunities ──
  doc.addPage();
  y = margin;
  addText("Symbiosemuligheter", 18, [16, 185, 129], true);
  y += 3;
  addLine();

  for (const opp of hub.symbiosisOpportunities) {
    newPageIfNeeded(30);
    addText(`${opp.title} (${opp.status})`, 11, [226, 232, 240], true);
    addText(opp.description, 9, [148, 163, 184]);
    addText(
      `Verdi: ${opp.estimatedAnnualValueMNOK} MNOK/år | CO₂: -${opp.co2ReductionTonnes} t/år | KI-tillit: ${(opp.aiConfidence * 100).toFixed(0)}%`,
      9,
      [148, 163, 184]
    );
    y += 3;
  }

  // ── Business Cases ──
  newPageIfNeeded(30);
  y += 5;
  addText("Forretningscaser", 18, [16, 185, 129], true);
  y += 3;
  addLine();

  for (const bc of hub.businessCases) {
    newPageIfNeeded(20);
    addText(bc.title, 11, [226, 232, 240], true);
    addText(
      `Investering: ${bc.investmentMNOK} MNOK | IRR: ${(bc.irr * 100).toFixed(0)}% | NPV: ${bc.npvMNOK} MNOK | Tilbakebetaling: ${bc.paybackYears} år`,
      9,
      [148, 163, 184]
    );
    y += 3;
  }

  doc.save(`${hub.name || "rapport"}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Generate a PowerPoint presentation.
 */
export async function generatePPTXReport(
  hub: HubDataset,
  scenarioName?: string
): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  pptx.layout = "LAYOUT_16x9";

  // Dark theme colors
  const bg = "0F172A";
  const emerald = "10B981";
  const textLight = "E2E8F0";
  const textMuted = "94A3B8";

  // ── Title Slide ──
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: bg };
  titleSlide.addText(hub.name || "SymbioLink \u00d8ra", {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 1,
    fontSize: 36,
    bold: true,
    color: emerald,
  });
  titleSlide.addText("Prosjektrapport", {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 0.5,
    fontSize: 20,
    color: textMuted,
  });
  if (scenarioName) {
    titleSlide.addText(`Scenario: ${scenarioName}`, {
      x: 0.5,
      y: 3.2,
      w: 9,
      h: 0.5,
      fontSize: 16,
      color: "3B82F6",
    });
  }
  titleSlide.addText(
    new Date().toLocaleDateString("nb-NO", { year: "numeric", month: "long", day: "numeric" }),
    { x: 0.5, y: 4, w: 9, h: 0.4, fontSize: 12, color: textMuted }
  );

  // ── KPI Overview ──
  const kpiSlide = pptx.addSlide();
  kpiSlide.background = { color: bg };
  kpiSlide.addText("Nøkkeltall", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true, color: emerald });

  hub.dashboardKPIs.forEach((kpi, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    kpiSlide.addText(
      [
        { text: `${kpi.value}`, options: { fontSize: 28, bold: true, color: textLight } },
        { text: ` ${kpi.unit}`, options: { fontSize: 14, color: textMuted } },
        { text: `\n${kpi.label}`, options: { fontSize: 11, color: textMuted } },
      ],
      {
        x: 0.5 + col * 3.1,
        y: 1.2 + row * 1.6,
        w: 2.8,
        h: 1.3,
        fill: { color: "1E293B" },
        shape: pptx.ShapeType.roundRect,
        rectRadius: 0.1,
      }
    );
  });

  // ── Companies ──
  const compSlide = pptx.addSlide();
  compSlide.background = { color: bg };
  compSlide.addText("Bedrifter i hubben", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true, color: emerald });

  const companies = Object.values(hub.companies);
  companies.forEach((c, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    compSlide.addText(
      [
        { text: c.shortName, options: { fontSize: 14, bold: true, color: textLight } },
        { text: `\n${c.sector}`, options: { fontSize: 10, color: textMuted } },
        { text: `\n${c.annualEnergyGWh} GWh | ${c.annualWasteTonnes} t`, options: { fontSize: 9, color: textMuted } },
      ],
      {
        x: 0.5 + col * 3.1,
        y: 1.2 + row * 1.4,
        w: 2.8,
        h: 1.1,
        fill: { color: "1E293B" },
        shape: pptx.ShapeType.roundRect,
        rectRadius: 0.1,
      }
    );
  });

  // ── Symbiosis ──
  const symSlide = pptx.addSlide();
  symSlide.background = { color: bg };
  symSlide.addText("Symbiosemuligheter", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true, color: emerald });

  hub.symbiosisOpportunities.slice(0, 6).forEach((s, i) => {
    const yPos = 1.1 + i * 0.75;
    symSlide.addText(
      [
        { text: s.title, options: { fontSize: 12, bold: true, color: textLight } },
        { text: `  ${s.estimatedAnnualValueMNOK} MNOK/år | -${s.co2ReductionTonnes} t CO₂`, options: { fontSize: 10, color: textMuted } },
      ],
      { x: 0.5, y: yPos, w: 9, h: 0.6 }
    );
  });

  const filename = `${hub.name || "presentasjon"}-${new Date().toISOString().slice(0, 10)}`;
  await pptx.writeFile({ fileName: filename });
}

/**
 * Export hub data as downloadable JSON.
 */
export function exportHubAsJSON(hub: HubDataset): void {
  const blob = new Blob([JSON.stringify(hub, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${hub.name || "hub-data"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export hub data as CSV (one sheet for each entity type).
 */
export function exportHubAsCSV(hub: HubDataset, entity: "companies" | "energyFlows" | "materialFlows" | "symbiosisOpportunities" | "businessCases"): void {
  let csv = "";

  switch (entity) {
    case "companies": {
      csv = "id,name,shortName,sector,annualEnergyGWh,annualWasteTonnes,employeeCount\n";
      for (const c of Object.values(hub.companies)) {
        csv += `${c.id},"${c.name}","${c.shortName}","${c.sector}",${c.annualEnergyGWh},${c.annualWasteTonnes},${c.employeeCount}\n`;
      }
      break;
    }
    case "energyFlows": {
      csv = "source,target,value,type,status\n";
      for (const f of hub.energyFlows) {
        csv += `"${f.source}","${f.target}",${f.value},"${f.type}","${f.status}"\n`;
      }
      break;
    }
    case "materialFlows": {
      csv = "id,source,target,material,volumeTonnesPerYear,status,matchScore\n";
      for (const f of hub.materialFlows) {
        csv += `${f.id},"${f.source}","${f.target}","${f.material}",${f.volumeTonnesPerYear},"${f.status}",${f.matchScore}\n`;
      }
      break;
    }
    case "symbiosisOpportunities": {
      csv = "id,title,type,status,estimatedAnnualValueMNOK,co2ReductionTonnes,aiConfidence\n";
      for (const s of hub.symbiosisOpportunities) {
        csv += `${s.id},"${s.title}","${s.type}","${s.status}",${s.estimatedAnnualValueMNOK},${s.co2ReductionTonnes},${s.aiConfidence}\n`;
      }
      break;
    }
    case "businessCases": {
      csv = "symbiosisId,title,investmentMNOK,irr,paybackYears,npvMNOK,annualRevenueMNOK\n";
      for (const b of hub.businessCases) {
        csv += `${b.symbiosisId},"${b.title}",${b.investmentMNOK},${b.irr},${b.paybackYears},${b.npvMNOK},${b.annualRevenueMNOK}\n`;
      }
      break;
    }
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${hub.name || "data"}-${entity}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
