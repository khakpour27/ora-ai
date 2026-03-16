/**
 * Utility functions for exporting charts as images.
 */
import { toPng, toSvg } from "html-to-image";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportAsPNG(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const dataUrl = await toPng(element, {
    backgroundColor: "#0f172a", // slate-900
    pixelRatio: 2,
  });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  downloadBlob(blob, filename.endsWith(".png") ? filename : `${filename}.png`);
}

export async function exportAsSVG(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const dataUrl = await toSvg(element, {
    backgroundColor: "#0f172a",
  });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  downloadBlob(blob, filename.endsWith(".svg") ? filename : `${filename}.svg`);
}

export async function exportAsPDF(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const dataUrl = await toPng(element, {
    backgroundColor: "#0f172a",
    pixelRatio: 2,
  });

  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });

  const pdf = new jsPDF({
    orientation: img.width > img.height ? "landscape" : "portrait",
    unit: "px",
    format: [img.width / 2, img.height / 2],
  });

  pdf.addImage(dataUrl, "PNG", 0, 0, img.width / 2, img.height / 2);
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
