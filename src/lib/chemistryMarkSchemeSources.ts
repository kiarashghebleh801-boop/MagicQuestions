import type { ChemistryQuestion } from "./chemistryQuestions";

export const CHEMISTRY_MARKSCHEME_BUCKET = "chemistry markschemes";

const sourceByPaper: Record<string, string> = {
  "2022|May/June|1C": "IGCSE_CHEMISTRY_2022_MayJune_P1_MS.pdf",
  "2022|May/June|2C": "IGCSE_CHEMISTRY_2022_MayJune_P2_MS.pdf",
  "2023|November|1C": "IGCSE_CHEMISTRY_2023_Nov_P1_MS.pdf",
  "2023|November|2C": "IGCSE_CHEMISTRY_2023_Nov_P2_MS.pdf",
  "2024|May/June|1C": "IGCSE_CHEMISTRY_2024_MayJune_P1_MS.pdf",
  "2024|May/June|2C": "IGCSE_CHEMISTRY_2024_MayJune_P2_MS.pdf",
  "2025|May/June|1CR": "IGCSE_CHEMISTRY_2025_MayJune_P1R_MS (1).pdf",
  "2025|May/June|1C": "IGCSE_CHEMISTRY_2025_MayJune_P1_MS (1).pdf",
  "2025|May/June|2CR": "IGCSE_CHEMISTRY_2025_MayJune_P2R_MS (1).pdf",
  "2025|May/June|2C": "IGCSE_CHEMISTRY_2025_MayJune_P2_MS (1).pdf",
  "2025|November|1C": "IGCSE_CHEMISTRY_2025_Nov_P1_MS (1).pdf",
  "2025|November|2C": "IGCSE_CHEMISTRY_2025_Nov_P2_MS (1).pdf",
  "2026|May/June|1CR": "IGCSE_CHEMISTRY_2026_June_P1R_MS_1789838391064.pdf",
  "2026|May/June|1C": "IGCSE_CHEMISTRY_2026_June_P1_MS_1789838389142.pdf",
  "2026|May/June|2CR": "IGCSE_CHEMISTRY_2026_June_P2R_MS_1789838394334.pdf",
  "2026|May/June|2C": "IGCSE_CHEMISTRY_2026_June_P2_MS_1789838392628.pdf",
};

export function getChemistryMarkSchemeSource(question: Pick<ChemistryQuestion, "year" | "session" | "paper">): string | null {
  return sourceByPaper[`${question.year}|${question.session}|${question.paper}`] || null;
}
