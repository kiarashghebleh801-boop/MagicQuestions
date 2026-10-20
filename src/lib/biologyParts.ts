import type { BiologyQuestion } from "./biologyQuestions";
export type BiologyQuestionSelection = BiologyQuestion & { selectedParts?: string[]; availableParts?: string[] };
export type BiologyPartOption = { part: string; marks: number; specTags: string[] };
type PartRule = BiologyPartOption;
// Verified main lettered parts only; roman numerals stay with their parent.
export const partRules: Record<string, PartRule[]> = {};
function allSelected(tags: string[], selected: Set<string>) { return tags.length > 0 && tags.every(tag => selected.has(tag)); }
function baseQuestionId(id: string): string {
  return id.replace(/-parts-[a-z]+$/i, "");
}

function rulesForQuestion(q: BiologyQuestionSelection): PartRule[] | undefined {
  return partRules[baseQuestionId(q.id)];
}

export function biologyPartOptions(q: BiologyQuestionSelection): BiologyPartOption[] {
  const rules = rulesForQuestion(q);
  if (!rules) return [];
  const available = q.availableParts?.length ? new Set(q.availableParts) : null;
  return rules.filter(rule => !available || available.has(rule.part));
}

export function selectBiologyQuestionParts(
  q: BiologyQuestionSelection,
  selectedParts: string[],
): BiologyQuestionSelection | null {
  const rules = rulesForQuestion(q);
  if (!rules) return q;
  const availableParts = biologyPartOptions(q).map(rule => rule.part);
  const available = new Set(availableParts);
  const uniqueSelection = Array.from(new Set(selectedParts)).filter(part => available.has(part));
  if (!uniqueSelection.length) return null;
  const chosen = rules.filter(rule => uniqueSelection.includes(rule.part));
  const baseSummary = q.summary.replace(/\s*Selected parts:.*$/i, "").trim();
  return {
    ...q,
    id: `${baseQuestionId(q.id)}-parts-${uniqueSelection.join("")}`,
    selectedParts: uniqueSelection,
    availableParts,
    marks: chosen.reduce((sum, rule) => sum + rule.marks, 0),
    specTags: Array.from(new Set(chosen.flatMap(rule => rule.specTags))),
    summary: `${baseSummary} Selected parts: ${uniqueSelection.map(part => `(${part})`).join(", ")}.`,
  };
}

export function specialiseBiologyQuestion(q: BiologyQuestion, selectedTopics: string[]): BiologyQuestionSelection | null {
  const rules = partRules[q.id];
  if (!selectedTopics.length) {
    return rules ? { ...q, availableParts: rules.map(rule => rule.part) } : q;
  }
  const selected = new Set(selectedTopics);

  if (!rules) {
    return allSelected(q.specTags, selected) ? q : null;
  }

  // A part is only allowed when every topic attached to that part was selected.
  // This prevents a question chosen for one topic from quietly testing another.
  const matched = rules.filter(rule => allSelected(rule.specTags, selected));
  if (!matched.length) return null;

  if (matched.length === rules.length) {
    return { ...q, availableParts: rules.map(rule => rule.part) };
  }

  const usedTags = Array.from(new Set(matched.flatMap(rule => rule.specTags)));
  const selectedParts = matched.map(rule => rule.part);
  return {
    ...q,
    id: `${q.id}-parts-${selectedParts.join("")}`,
    selectedParts,
    // Show every lettered part in the picker. Topic-matched parts start
    // selected, while the remaining parts stay available as opt-ins.
    availableParts: rules.map(rule => rule.part),
    specTags: usedTags,
    marks: matched.reduce((sum, rule) => sum + rule.marks, 0),
    summary: `${q.summary} Selected parts: ${selectedParts.map(part => `(${part})`).join(", ")}.`,
  };
}

export function biologyCandidatesForTopics(selectedTopics: string[]): BiologyQuestionSelection[] {
  return biologyQuestionsSafe().map(q => specialiseBiologyQuestion(q, selectedTopics)).filter((q): q is BiologyQuestionSelection => q !== null);
}

function biologyQuestionsSafe(): BiologyQuestion[] {
  // Lazy require avoids a circular dependency during module initialization.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("./biologyQuestions").biologyQuestions as BiologyQuestion[];
}
