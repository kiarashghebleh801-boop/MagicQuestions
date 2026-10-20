"use client";
import type { BiologyQuestionSelection } from "./biologyParts";
import { biologyPartOptions } from "./biologyParts";
import { BIOLOGY_MARKSCHEME_BUCKET, getBiologyMarkSchemeSource } from "./biologyMarkSchemeSources";
import { createScienceMarkSchemeDocument, exportScienceMarkSchemeToWord, selectMarkSchemeEntries, type IndexedPaper } from "./exportScienceMarkScheme";
const config = {
  subject: "Biology", bucket: BIOLOGY_MARKSCHEME_BUCKET,
  getIndex: async () => (await import("./biologyMarkSchemeIndex.json")).default as Record<string, IndexedPaper>,
  getSource: getBiologyMarkSchemeSource, partOptions: biologyPartOptions,
};
export const selectBiologyMarkSchemeEntries = selectMarkSchemeEntries;
export const createBiologyMarkSchemeDocument = (questions: BiologyQuestionSelection[]) => createScienceMarkSchemeDocument(questions, config);
export const exportBiologyMarkSchemeToWord = (questions: BiologyQuestionSelection[]) => exportScienceMarkSchemeToWord(questions, config);
