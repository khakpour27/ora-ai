export interface Provenance {
  source: string;
  page?: string;
  date?: string;
  confidence: "verified" | "estimated" | "projected";
}
