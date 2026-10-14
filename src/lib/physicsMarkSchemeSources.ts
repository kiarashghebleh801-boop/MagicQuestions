import type { Question } from "./questions";

export const PHYSICS_MARKSCHEME_BUCKET = "physics-markschemes";

const sourceByPaper: Record<string, string> = {
  "2025|November|1P": "IGCSE_PHYSICS_2025_Nov_P1_MS (1).pdf",
  "2025|November|2P": "IGCSE_PHYSICS_2025_Nov_P2_MS.pdf",
  "2025|May/June|1P": "IGCSE_PHYSICS_2025_MayJune_P1_MS.pdf",
  "2025|May/June|1PR": "P1R_MS_1777741119967.pdf",
  "2025|May/June|2P": "IGCSE_PHYSICS_2025_MayJune_P2_MS.pdf",
  "2025|May/June|2PR": "P2R_MS_1777741158837.pdf",
  "2026|May/June|1P": "IGCSE_PHYSICS_2026_June_P1_MS_1789834923593.pdf",
  "2026|May/June|1PR": "IGCSE_PHYSICS_2026_June_P1R_MS_1789834925881.pdf",
  "2026|May/June|2P": "IGCSE_PHYSICS_2026_June_P2_MS_1789834927427.pdf",
  "2026|May/June|2PR": "IGCSE_PHYSICS_2026_June_P2R_MS_1789834929154.pdf",
};

export function getPhysicsMarkSchemeSource(question: Question): string | null {
  return sourceByPaper[`${question.year}|${question.session}|${question.paper}`] || null;
}

