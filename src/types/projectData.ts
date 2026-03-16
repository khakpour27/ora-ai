export interface ProjectDocument {
  id: string;
  type: "file" | "url" | "text";
  name: string;
  source: string; // original filename or URL
  mimeType?: string;
  sizeBytes: number;
  tokenEstimate: number;
  status: "processing" | "ready" | "error";
  errorMessage?: string;
  addedAt: number; // Date.now()
}
