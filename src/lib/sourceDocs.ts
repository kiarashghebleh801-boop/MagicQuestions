import type { Question } from "./questions";

export const FORMATTED_BUCKET = "examwizard-papers";
export const PHYSICS_BUCKET = "physics-papers";

const sourceByPaper: Record<string, string> = {
  "2022|January|1HR": "January_2022_R_ExamWizard_Style.docx",
  "2022|January|2HR": "January_2022_R_Paper_2_ExamWizard_Style.docx",
  "2021|November|1H": "November_2021_ExamWizard_Style.docx",
  "2021|November|2H": "November_2021_Paper_2_ExamWizard_Style.docx",
  "2025|November|1H": "November_2025_Paper_1_ExamWizard_Style_TOTAL_FIXED.docx",
  "2025|November|2H": "November_2025_Paper_2_ExamWizard_Style_FINAL.docx",
  "2025|May|1H": "May_2025_Paper_1_ExamWizard_Style.docx",
  "2025|June|2H": "June_2025_Paper_2_ExamWizard_Style.docx",
  "2024|November|1H": "November_2024_Paper_1_ExamWizard_Style.docx",
  "2024|November|2H": "November_2024_Paper_2_ExamWizard_Style (1).docx",

  // Chemistry formatted papers.
  "2023|November|1C": "November_2023_Chemistry_Paper_1C_ExamWizard_Style_FINAL.docx",
  "2023|November|2C": "November_2023_Chemistry_Paper_2C_ExamWizard_Style_FINAL.docx",
  "2024|May/June|1C": "May_June_2024_Chemistry_Paper_1C_ExamWizard_Style_FINAL.docx",
  "2024|May/June|2C": "May_June_2024_Chemistry_Paper_2C_ExamWizard_Style_FINAL.docx",
  "2024|November|1C": "November_2024_Chemistry_Paper_1C_ExamWizard_Style_FINAL.docx",
  "2024|November|2C": "November_2024_Chemistry_Paper_2C_ExamWizard_Style_FINAL.docx",
  "2025|May/June|1C": "May_June_2025_Chemistry_Paper_1C_ExamWizard_Style.docx",
  "2025|May/June|2C": "May_June_2025_Chemistry_Paper_2C_ExamWizard_Style.docx.docx",
  "2025|November|1C": "November_2025_Chemistry_Paper_1C_ExamWizard_Style_FINAL.docx",
  "2025|November|2C": "November_2025_Chemistry_Paper_2C_ExamWizard_Style.docx",

  // Physics formatted papers live in the physics-papers bucket.
  "2025|November|1P": "November_2025_Physics_Paper_1P.docx",
  "2025|November|2P": "November_2025_Physics_Paper_2P.docx",
  "2025|May/June|1P": "May_June_2025_Physics_Paper_1P.docx",
  "2025|May/June|2P": "May_June_2025_Physics_Paper_2P.docx",
  "2025|May/June|1PR": "May_June_2025_Physics_Paper_1PR.docx",
  "2025|May/June|2PR": "May_June_2025_Physics_Paper_2PR.docx",
};

export function getFormattedSource(q: Question): string | null {
  return sourceByPaper[`${q.year}|${q.session}|${q.paper}`] ?? null;
}

export function getFormattedSourceBucket(q: Question): string {
  return /P(?:R)?$/i.test(q.paper) && !/C$/i.test(q.paper) ? PHYSICS_BUCKET : FORMATTED_BUCKET;
}

export function hasFormattedSource(q: Question): boolean {
  return getFormattedSource(q) !== null;
}
