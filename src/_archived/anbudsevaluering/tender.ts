export interface TenderBid {
  id: string;
  supplierName: string;
  submittedDate: string;
  scores: {
    understanding: number;
    competence: number;
    methodology: number;
    price: number;
  };
  totalWeightedScore: number;
  priceExVatNOK: number;
  workPackages: string[];
  teamSize: number;
  complianceFlags: ComplianceItem[];
}

export interface ComplianceItem {
  requirement: string;
  met: boolean;
  aiNote: string;
}

export interface EvaluationWeight {
  criterion: string;
  weight: number;
  description: string;
}
