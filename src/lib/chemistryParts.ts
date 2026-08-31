import type { ChemistryQuestion } from "./chemistryQuestions";

export type ChemistryQuestionSelection = ChemistryQuestion & { selectedParts?: string[] };

type PartRule = { part: string; marks: number; specTags: string[] };

const partRules: Record<string, PartRule[]> = {
  "chem-2025-1C-1": [
    { part:"a", marks:3, specTags:["1c"] },
    { part:"b", marks:4, specTags:["1c","1d"] },
    { part:"c", marks:1, specTags:["1d"] },
  ],
  "chem-2025-1C-2": [
    { part:"a", marks:2, specTags:["2a"] },
    { part:"b", marks:1, specTags:["2a"] },
    { part:"c", marks:4, specTags:["2f"] },
    { part:"d", marks:1, specTags:["2h"] },
  ],
  "chem-2025-1C-4": [
    { part:"a", marks:2, specTags:["1f"] },
    { part:"b", marks:4, specTags:["1e"] },
    { part:"c", marks:1, specTags:["1e"] },
  ],
  "chem-2025-1C-5": [
    { part:"a", marks:3, specTags:["4a"] },
    { part:"b", marks:4, specTags:["4c"] },
    { part:"c", marks:4, specTags:["4a"] },
    { part:"d", marks:3, specTags:["4b"] },
  ],
  "chem-2025-1C-6": [
    { part:"a", marks:2, specTags:["2d"] },
    { part:"b", marks:1, specTags:["2d"] },
    { part:"c", marks:1, specTags:["2d"] },
    { part:"d", marks:2, specTags:["2h"] },
    { part:"e", marks:7, specTags:["1e","2d"] },
  ],
  "chem-2025-1C-7": [
    { part:"a", marks:2, specTags:["2f"] },
    { part:"b", marks:2, specTags:["3a"] },
    { part:"c", marks:4, specTags:["3a"] },
    { part:"d", marks:2, specTags:["3a"] },
    { part:"e", marks:2, specTags:["3a"] },
  ],
  "chem-2025-1C-9": [
    { part:"a", marks:9, specTags:["1g","4h"] },
    { part:"b", marks:3, specTags:["1e"] },
    { part:"c", marks:5, specTags:["4c","4d"] },
  ],
  "chem-2025-1C-10": [
    { part:"a", marks:4, specTags:["3a"] },
    { part:"b", marks:7, specTags:["3a","4e"] },
  ],

  "chem-2025-2C-1": [
    { part:"a", marks:4, specTags:["1b"] },
    { part:"b", marks:2, specTags:["4b"] },
  ],
  "chem-2025-2C-2": [
    { part:"a", marks:1, specTags:["3a"] },
    { part:"b", marks:1, specTags:["1e"] },
    { part:"c", marks:2, specTags:["3b"] },
    { part:"d", marks:4, specTags:["3b"] },
    { part:"e", marks:5, specTags:["3a"] },
  ],
  "chem-2025-2C-3": [
    { part:"a", marks:5, specTags:["1c"] },
    { part:"b", marks:1, specTags:["2g"] },
    { part:"c", marks:3, specTags:["1f"] },
    { part:"d", marks:5, specTags:["1f"] },
    { part:"e", marks:2, specTags:["1i"] },
  ],
  "chem-2025-2C-4": [
    { part:"a", marks:3, specTags:["4e"] },
    { part:"b", marks:4, specTags:["4f"] },
    { part:"c", marks:5, specTags:["4g"] },
  ],
  "chem-2025-2C-5": [
    { part:"a", marks:2, specTags:["2f"] },
    { part:"b", marks:2, specTags:["2f"] },
    { part:"c", marks:2, specTags:["2f"] },
    { part:"d", marks:7, specTags:["2f","2g"] },
  ],
  "chem-2025-2C-6": [
    { part:"a", marks:2, specTags:["2h","3c"] },
    { part:"b", marks:4, specTags:["3c"] },
    { part:"c", marks:4, specTags:["1e","3c"] },
  ],

  "chem-2025-nov-1C-2": [
    { part:"a", marks:3, specTags:["2c"] },
    { part:"b", marks:2, specTags:["1e"] },
    { part:"c", marks:3, specTags:["2c"] },
  ],
  "chem-2025-nov-1C-3": [
    { part:"a", marks:6, specTags:["1c","1d"] },
    { part:"b", marks:1, specTags:["1c"] },
    { part:"c", marks:4, specTags:["1d"] },
  ],
  "chem-2025-nov-1C-4": [
    { part:"a", marks:2, specTags:["1f"] },
    { part:"b", marks:6, specTags:["2h"] },
    { part:"c", marks:4, specTags:["1a"] },
  ],
  "chem-2025-nov-1C-5": [
    { part:"a", marks:1, specTags:["3a"] },
    { part:"b", marks:2, specTags:["3a"] },
    { part:"c", marks:2, specTags:["3a"] },
    { part:"d", marks:8, specTags:["2d","3a"] },
  ],
  "chem-2025-nov-1C-6": [
    { part:"a", marks:6, specTags:["4b"] },
    { part:"b", marks:3, specTags:["4c"] },
    { part:"c", marks:3, specTags:["4c"] },
    { part:"d", marks:3, specTags:["4h"] },
  ],
  "chem-2025-nov-1C-7": [
    { part:"a", marks:2, specTags:["2f"] },
    { part:"b", marks:3, specTags:["2f"] },
    { part:"c", marks:7, specTags:["3a"] },
  ],
  "chem-2025-nov-1C-9": [
    { part:"a", marks:3, specTags:["4a"] },
    { part:"b", marks:2, specTags:["1g"] },
    { part:"c", marks:5, specTags:["1e","4c","4d"] },
    { part:"d", marks:2, specTags:["4a"] },
  ],
  "chem-2025-nov-1C-10": [
    { part:"a", marks:1, specTags:["1e"] },
    { part:"b", marks:5, specTags:["2g","3b"] },
    { part:"c", marks:6, specTags:["1e"] },
  ],

  "chem-2025-nov-2C-1": [
    { part:"a", marks:5, specTags:["2f","2g"] },
    { part:"b", marks:1, specTags:["2f","2g"] },
    { part:"c", marks:1, specTags:["2f","2g"] },
  ],
  "chem-2025-nov-2C-2": [
    { part:"a", marks:3, specTags:["2b"] },
    { part:"b", marks:1, specTags:["2b"] },
    { part:"c", marks:3, specTags:["1c"] },
    { part:"d", marks:3, specTags:["1c"] },
    { part:"e", marks:5, specTags:["2b"] },
  ],
  "chem-2025-nov-2C-3": [
    { part:"a", marks:3, specTags:["2d"] },
    { part:"b", marks:6, specTags:["2e"] },
    { part:"c", marks:2, specTags:["1e"] },
    { part:"d", marks:4, specTags:["1i"] },
  ],
  "chem-2025-nov-2C-4": [
    { part:"a", marks:3, specTags:["4e"] },
    { part:"b", marks:3, specTags:["4e"] },
    { part:"c", marks:4, specTags:["4g"] },
    { part:"d", marks:4, specTags:["4h"] },
  ],
  "chem-2025-nov-2C-5": [
    { part:"a", marks:2, specTags:["2h"] },
    { part:"b", marks:4, specTags:["3b"] },
    { part:"c", marks:5, specTags:["3b"] },
  ],
  "chem-2025-nov-2C-6": [
    { part:"a", marks:3, specTags:["3a"] },
    { part:"b", marks:5, specTags:["3a"] },
  ],
};

function allSelected(tags: string[], selected: Set<string>) {
  return tags.every(tag => selected.has(tag));
}

export function specialiseChemistryQuestion(q: ChemistryQuestion, selectedTopics: string[]): ChemistryQuestionSelection | null {
  if (!selectedTopics.length) return q;
  const selected = new Set(selectedTopics);
  const rules = partRules[q.id];

  if (!rules) {
    return allSelected(q.specTags, selected) ? q : null;
  }

  // A part is only allowed when every topic attached to that part was selected.
  // This prevents a question chosen for one topic from quietly testing another.
  const matched = rules.filter(rule => allSelected(rule.specTags, selected));
  if (!matched.length) return null;

  if (matched.length === rules.length) return q;

  const usedTags = Array.from(new Set(matched.flatMap(rule => rule.specTags)));
  const selectedParts = matched.map(rule => rule.part);
  return {
    ...q,
    id: `${q.id}-parts-${selectedParts.join("")}`,
    selectedParts,
    specTags: usedTags,
    marks: matched.reduce((sum, rule) => sum + rule.marks, 0),
    summary: `${q.summary} Selected parts: ${selectedParts.map(part => `(${part})`).join(", ")}.`,
  };
}

export function chemistryCandidatesForTopics(selectedTopics: string[]): ChemistryQuestionSelection[] {
  return chemistryQuestionsSafe().map(q => specialiseChemistryQuestion(q, selectedTopics)).filter((q): q is ChemistryQuestionSelection => q !== null);
}

function chemistryQuestionsSafe(): ChemistryQuestion[] {
  // Lazy require avoids a circular dependency during module initialization.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("./chemistryQuestions").chemistryQuestions as ChemistryQuestion[];
}
