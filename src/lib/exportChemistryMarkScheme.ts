"use client";
import type { ChemistryQuestionSelection } from "./chemistryParts";
import { chemistryPartOptions } from "./chemistryParts";
import { CHEMISTRY_MARKSCHEME_BUCKET, getChemistryMarkSchemeSource } from "./chemistryMarkSchemeSources";
import { createScienceMarkSchemeDocument, exportScienceMarkSchemeToWord, selectMarkSchemeEntries, type IndexedPaper } from "./exportScienceMarkScheme";
const config = {
  subject: "Chemistry", bucket: CHEMISTRY_MARKSCHEME_BUCKET,
  getIndex: async () => (await import("./chemistryMarkSchemeIndex.json")).default as Record<string, IndexedPaper>,
  getSource: getChemistryMarkSchemeSource, partOptions: chemistryPartOptions,
};
export const selectChemistryMarkSchemeEntries = selectMarkSchemeEntries;
export const createChemistryMarkSchemeDocument = (questions: ChemistryQuestionSelection[]) => createScienceMarkSchemeDocument(questions, config);
export const exportChemistryMarkSchemeToWord = (questions: ChemistryQuestionSelection[]) => exportScienceMarkSchemeToWord(questions, config);
