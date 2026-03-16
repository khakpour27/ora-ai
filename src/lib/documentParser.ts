/**
 * Client-side document parsing utilities.
 * Extracts text from uploaded files (TXT, MD, CSV, PDF) and fetched URLs.
 */

// ---------------------------------------------------------------------------
// PDF parsing via pdfjs-dist (CDN worker)
// ---------------------------------------------------------------------------

let pdfjsLoaded = false;

async function ensurePDFJS() {
  if (pdfjsLoaded) return;
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  pdfjsLoaded = true;
}

async function parsePDF(file: File): Promise<string> {
  await ensurePDFJS();
  const pdfjs = await import("pdfjs-dist");
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n\n");
}

// ---------------------------------------------------------------------------
// Text file parsing
// ---------------------------------------------------------------------------

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const TEXT_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/tab-separated-values",
  "application/json",
  "application/xml",
  "text/xml",
];

export async function parseFile(file: File): Promise<string> {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    return parsePDF(file);
  }

  // Text-based formats
  const isText =
    TEXT_TYPES.some((t) => file.type.startsWith(t)) ||
    /\.(txt|md|csv|tsv|json|xml)$/i.test(file.name);

  if (isText) {
    return readAsText(file);
  }

  throw new Error(
    `Filtypen "${file.type || file.name.split(".").pop()}" støttes ikke. Støttede formater: PDF, TXT, MD, CSV, JSON.`
  );
}

// ---------------------------------------------------------------------------
// URL fetching via CORS proxy
// ---------------------------------------------------------------------------

export function stripHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : "Nettside";
}

export async function fetchURLContent(
  url: string
): Promise<{ title: string; text: string }> {
  // Use allorigins.win CORS proxy
  const proxyURL = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

  const res = await fetch(proxyURL);
  if (!res.ok) throw new Error(`Kunne ikke hente URL (${res.status})`);

  const data = (await res.json()) as { contents: string };
  const html = data.contents;

  const title = extractTitle(html);
  const text = stripHTML(html);

  return { title, text };
}

// ---------------------------------------------------------------------------
// Token estimation
// ---------------------------------------------------------------------------

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
