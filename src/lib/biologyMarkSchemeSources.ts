import type { BiologyQuestion } from "./biologyQuestions";
import index from "./biologyMarkSchemeIndex.json";
export const BIOLOGY_MARKSCHEME_BUCKET = "bio markschemes";
export const biologyMarkSchemeFiles: Record<string,string> = {
  "2026|May/June|1B": "IGCSE_BIOLOGY_2026_MayJune_P1_MS_1789837983647.pdf",
  "2026|May/June|1BR": "IGCSE_BIOLOGY_2026_MayJune_P1R_MS_1789837985665.pdf",
  "2026|May/June|2B": "IGCSE_BIOLOGY_2026_MayJune_P2_MS_1789837987379.pdf",
  "2026|May/June|2BR": "IGCSE_BIOLOGY_2026_MayJune_P2R_MS_1789837989049.pdf",
};
export function getBiologyMarkSchemeSource(q: Pick<BiologyQuestion,"year"|"session"|"paper">): string | null {
  const source = biologyMarkSchemeFiles[`${q.year}|${q.session}|${q.paper}`];
  return source && Object.prototype.hasOwnProperty.call(index, source) ? source : null;
}
