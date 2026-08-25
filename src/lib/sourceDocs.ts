import type { Question } from "./questions";

export const FORMATTED_BUCKET = "examwizard-papers";

const sourceByPaper: Record<string, string> = {
  // Exact match for the current January 2022 R Paper 1 bank.
  "2022|January|1HR": "January_2022_R_ExamWizard_Style.docx",

  // Ready for these banks as soon as their metadata/questions are added to questions.ts.
  "2022|January|2HR": "January_2022_R_Paper_2_ExamWizard_Style.docx",
  "2021|November|1H": "November_2021_ExamWizard_Style.docx",
  "2021|November|2H": "November_2021_Paper_2_ExamWizard_Style.docx",
  "2025|November|1H": "November_2025_Paper_1_ExamWizard_Style_TOTAL_FIXED.docx",
  "2025|November|2H": "November_2025_Paper_2_ExamWizard_Style_FINAL.docx",
};

export function getFormattedSource(q: Question): string | null {
  return sourceByPaper[`${q.year}|${q.session}|${q.paper}`] ?? null;
}

export function hasFormattedSource(q: Question): boolean {
  return getFormattedSource(q) !== null;
}
