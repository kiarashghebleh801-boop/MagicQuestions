"use client";
import type { ChemistryQuestionSelection } from "./chemistryParts";
import { chemistryPartOptions } from "./chemistryParts";
import { CHEMISTRY_MARKSCHEME_BUCKET, getChemistryMarkSchemeSource } from "./chemistryMarkSchemeSources";
import { createScienceMarkSchemeDocument, exportScienceMarkSchemeToWord, selectMarkSchemeEntries, type IndexedPaper } from "./exportScienceMarkScheme";
import { supabase } from "./supabase";
const config = {
  subject: "Chemistry", bucket: CHEMISTRY_MARKSCHEME_BUCKET,
  getIndex: async () => (await import("./chemistryMarkSchemeIndex.json")).default as Record<string, IndexedPaper>,
  getSource: getChemistryMarkSchemeSource, partOptions: chemistryPartOptions,
};
export const selectChemistryMarkSchemeEntries = selectMarkSchemeEntries;
export const createChemistryMarkSchemeDocument = (questions: ChemistryQuestionSelection[]) => createScienceMarkSchemeDocument(questions, config);
export async function exportChemistryMarkSchemeToWord(questions: ChemistryQuestionSelection[]) {
  const index = (await import("./chemistryMarkSchemeIndex.json")).default as Record<string, IndexedPaper>;
  const sources = questions.map(question => getChemistryMarkSchemeSource(question));

  const missingSource = questions.find((_, i) => !sources[i]);
  if (missingSource) {
    throw new Error(`A Chemistry mark scheme is not available for ${missingSource.session} ${missingSource.year}, Paper ${missingSource.paper}.`);
  }

  const uniqueSources = Array.from(new Set(sources.filter((source): source is string => Boolean(source))));
  const hasUnindexedSource = uniqueSources.some(filename => !index[filename]);

  if (!hasUnindexedSource) {
    await exportScienceMarkSchemeToWord(questions, config);
    return;
  }

  // A source PDF can exist in Storage before its question-by-question extraction
  // index has been generated. Never make the download button appear broken:
  // fall back to downloading the official Pearson source mark scheme(s).
  for (const filename of uniqueSources) {
    const { data, error } = await supabase.storage.from(CHEMISTRY_MARKSCHEME_BUCKET).download(filename);
    if (error || !data) throw new Error(`Could not download the Chemistry mark scheme: ${error?.message || filename}`);
    const href = URL.createObjectURL(data);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 4000);
    // Give browsers a moment between multiple source-PDF downloads.
    await new Promise(resolve => window.setTimeout(resolve, 120));
  }
}
