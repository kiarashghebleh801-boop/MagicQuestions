import type { Question } from "./questions";

export const MARKSCHEME_BUCKET = "examwizard-markschemes";

type MarkSchemeSource = {
  filenames: string[];
  maxQuestion: number;
};

const markSchemeByPaper: Record<string, MarkSchemeSource> = {
  "2022|January|1HR": {
    filenames: [
      "January 2022 (R) MS (1)(1).pdf",
      "January 2022 (R) MS(1).pdf",
      "January 2022 (R) MS.pdf",
    ],
    maxQuestion: 24,
  },
  "2022|January|2HR": {
    filenames: [
      "January 2022 (R) MS (1)(2).pdf",
      "January 2022 (R) MS (1).pdf",
    ],
    maxQuestion: 23,
  },
  "2024|November|1H": {
    filenames: ["IGCSE_MATHEMATICS_A_2024_Nov_Higher_P1_MS.pdf"],
    maxQuestion: 25,
  },
  "2024|November|2H": {
    filenames: ["IGCSE_MATHEMATICS_A_2024_Nov_Higher_P2_MS.pdf"],
    maxQuestion: 25,
  },
  "2025|May|1H": {
    filenames: ["Paper_1H_MS_1777739708688.pdf"],
    maxQuestion: 25,
  },
  "2025|June|2H": {
    filenames: ["Paper_2H_MS_1777739712232.pdf"],
    maxQuestion: 26,
  },
  "2025|November|1H": {
    filenames: ["IGCSE_MATHEMATICS_A_2025_Nov_Higher_P1_MS.pdf"],
    maxQuestion: 28,
  },
  "2025|November|2H": {
    filenames: ["IGCSE_MATHEMATICS_A_2025_Nov_Higher_P2_MS.pdf"],
    maxQuestion: 26,
  },
};

export function getMarkSchemeSource(q: Question): MarkSchemeSource | null {
  return markSchemeByPaper[`${q.year}|${q.session}|${q.paper}`] ?? null;
}

export function hasMarkSchemeSource(q: Question): boolean {
  return getMarkSchemeSource(q) !== null;
}
