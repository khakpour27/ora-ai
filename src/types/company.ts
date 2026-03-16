import type { Provenance } from "./provenance";

// Widened from literal union to string for user-configurable data
export type CompanyId = string;

export interface Company {
  id: string;
  name: string;
  shortName: string;
  sector: string;
  description: string;
  color: string;
  icon: string;
  coordinates: [number, number];
  annualEnergyGWh: number;
  annualWasteTonnes: number;
  employeeCount: number;
  provenance?: Provenance;
}
