"use client";
import type { ChemistryQuestionSelection } from "./chemistryParts";
import { chemistryPartOptions } from "./chemistryParts";
import { CHEMISTRY_MARKSCHEME_BUCKET, getChemistryMarkSchemeSource } from "./chemistryMarkSchemeSources";
import { createScienceMarkSchemeDocument, exportScienceMarkSchemeToWord, selectMarkSchemeEntries, type IndexedPaper } from "./exportScienceMarkScheme";
const config = {
  subject: "Chemistry", bucket: CHEMISTRY_MARKSCHEME_BUCKET,
  getIndex: async () => ({ ...(await import("./chemistryMarkSchemeIndex.json")).default, ...(await import("./chemistryMarkSchemeIndexNov2024.json")).default }) as Record<string, IndexedPaper>,
  getSource: getChemistryMarkSchemeSource, partOptions: chemistryPartOptions,
};
export const selectChemistryMarkSchemeEntries = selectMarkSchemeEntries;
export const createChemistryMarkSchemeDocument = (questions: ChemistryQuestionSelection[]) => createScienceMarkSchemeDocument(questions, config);
export async function exportChemistryMarkSchemeToWord(questions: ChemistryQuestionSelection[]) {
  if (!questions.length) throw new Error("Add at least one question to export a Chemistry mark scheme.");

  // Preflight every selected question before creating the document, so
  // a mixed paper never unexpectedly changes to source-PDF downloads.
  const index = await config.getIndex();
  const unindexed = new Set<string>();
  for (const question of questions) {
    const filename = getChemistryMarkSchemeSource(question);
    if (!filename || !index[filename]?.questions[String(question.questionNumber)]) {
      unindexed.add(`${question.session} ${question.year}, Paper ${question.paper}, Q${question.questionNumber}`);
    }
  }
  if (unindexed.size) {
    throw new Error(
      "Cannot make the editable Word mark scheme yet: the answer tables have not been indexed for " +
      Array.from(unindexed).join("; ") +
      ". The source PDFs may be uploaded, but the answers must be extracted and checked first. " +
      "No PDFs have been downloaded."
    );
  }

  // The only successful export path is ONE .docx containing all questions'
  // answer/notes/marks tables in the selected paper order.
  await exportScienceMarkSchemeToWord(questions, config);
}
