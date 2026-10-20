import type { BiologyQuestion } from "./biologyQuestions";
export type BiologyQuestionSelection = BiologyQuestion & { selectedParts?: string[]; availableParts?: string[] };
export type BiologyPartOption = { part: string; marks: number; specTags: string[] };
type PartRule = BiologyPartOption;
// Verified main lettered parts only; roman numerals stay with their parent.
export const partRules: Record<string, PartRule[]> = {
  "bio-2026-mj-1B-1": [
    {
      "part": "a",
      "marks": 3,
      "specTags": [
        "1B"
      ]
    },
    {
      "part": "b",
      "marks": 4,
      "specTags": [
        "1B"
      ]
    },
    {
      "part": "c",
      "marks": 2,
      "specTags": [
        "1A",
        "1B"
      ]
    },
    {
      "part": "d",
      "marks": 2,
      "specTags": [
        "1B"
      ]
    }
  ],
  "bio-2026-mj-1B-2": [
    {
      "part": "a",
      "marks": 2,
      "specTags": [
        "2B"
      ]
    },
    {
      "part": "b",
      "marks": 4,
      "specTags": [
        "2B"
      ]
    },
    {
      "part": "c",
      "marks": 3,
      "specTags": [
        "2B"
      ]
    }
  ],
  "bio-2026-mj-1B-3": [
    {
      "part": "a",
      "marks": 1,
      "specTags": [
        "3A"
      ]
    },
    {
      "part": "b",
      "marks": 1,
      "specTags": [
        "3A"
      ]
    },
    {
      "part": "c",
      "marks": 5,
      "specTags": [
        "3A"
      ]
    },
    {
      "part": "d",
      "marks": 4,
      "specTags": [
        "3A"
      ]
    }
  ],
  "bio-2026-mj-1B-4": [
    {
      "part": "a",
      "marks": 2,
      "specTags": [
        "1A"
      ]
    },
    {
      "part": "b",
      "marks": 10,
      "specTags": [
        "1A"
      ]
    }
  ],
  "bio-2026-mj-1B-5": [
    {
      "part": "a",
      "marks": 6,
      "specTags": [
        "2A"
      ]
    },
    {
      "part": "b",
      "marks": 2,
      "specTags": [
        "2A"
      ]
    },
    {
      "part": "c",
      "marks": 2,
      "specTags": [
        "2A"
      ]
    }
  ],
  "bio-2026-mj-1B-6": [
    {
      "part": "a",
      "marks": 6,
      "specTags": [
        "2F"
      ]
    },
    {
      "part": "b",
      "marks": 4,
      "specTags": [
        "2F"
      ]
    }
  ],
  "bio-2026-mj-1B-7": [
    {
      "part": "a",
      "marks": 1,
      "specTags": [
        "2B"
      ]
    },
    {
      "part": "b",
      "marks": 8,
      "specTags": [
        "2B"
      ]
    }
  ],
  "bio-2026-mj-1B-8": [
    {
      "part": "a",
      "marks": 2,
      "specTags": [
        "3D"
      ]
    },
    {
      "part": "b",
      "marks": 4,
      "specTags": [
        "3D"
      ]
    }
  ],
  "bio-2026-mj-1B-9": [
    {
      "part": "a",
      "marks": 3,
      "specTags": [
        "5C"
      ]
    },
    {
      "part": "b",
      "marks": 5,
      "specTags": [
        "5C"
      ]
    }
  ],
  "bio-2026-mj-1B-10": [
    {
      "part": "a",
      "marks": 2,
      "specTags": [
        "4A"
      ]
    },
    {
      "part": "b",
      "marks": 4,
      "specTags": [
        "4B"
      ]
    },
    {
      "part": "c",
      "marks": 4,
      "specTags": [
        "4B"
      ]
    }
  ],
  "bio-2026-mj-1B-11": [
    {
      "part": "a",
      "marks": 2,
      "specTags": [
        "5A",
        "5B"
      ]
    },
    {
      "part": "b",
      "marks": 6,
      "specTags": [
        "5B"
      ]
    }
  ],
  "bio-2026-mj-1BR-1": [
    {
      "part": "a",
      "marks": 4,
      "specTags": [
        "1A",
        "1B"
      ]
    },
    {
      "part": "b",
      "marks": 3,
      "specTags": [
        "2C"
      ]
    }
  ],
  "bio-2026-mj-1BR-2": [
    {
      "part": "a",
      "marks": 3,
      "specTags": [
        "2F"
      ]
    },
    {
      "part": "b",
      "marks": 7,
      "specTags": [
        "2F"
      ]
    }
  ],
  "bio-2026-mj-1BR-3": [
    {
      "part": "a",
      "marks": 4,
      "specTags": [
        "2B"
      ]
    },
    {
      "part": "b",
      "marks": 6,
      "specTags": [
        "1A"
      ]
    }
  ],
  "bio-2026-mj-1BR-4": [
    {
      "part": "a",
      "marks": 1,
      "specTags": [
        "4A"
      ]
    },
    {
      "part": "b",
      "marks": 1,
      "specTags": [
        "4B"
      ]
    },
    {
      "part": "c",
      "marks": 7,
      "specTags": [
        "4B"
      ]
    }
  ],
  "bio-2026-mj-1BR-5": [
    {
      "part": "a",
      "marks": 5,
      "specTags": [
        "1A",
        "3A"
      ]
    },
    {
      "part": "b",
      "marks": 8,
      "specTags": [
        "3A"
      ]
    }
  ],
  "bio-2026-mj-1BR-6": [
    {
      "part": "a",
      "marks": 2,
      "specTags": [
        "3D"
      ]
    },
    {
      "part": "b",
      "marks": 2,
      "specTags": [
        "5C"
      ]
    },
    {
      "part": "c",
      "marks": 8,
      "specTags": [
        "6B",
        "4B"
      ]
    }
  ],
  "bio-2026-mj-1BR-7": [
    {
      "part": "a",
      "marks": 7,
      "specTags": [
        "2B"
      ]
    },
    {
      "part": "b",
      "marks": 9,
      "specTags": [
        "2B"
      ]
    }
  ],
  "bio-2026-mj-1BR-8": [
    {
      "part": "a",
      "marks": 5,
      "specTags": [
        "5B"
      ]
    },
    {
      "part": "b",
      "marks": 10,
      "specTags": [
        "4A",
        "5A",
        "5B",
        "5C"
      ]
    }
  ],
  "bio-2026-mj-1BR-9": [
    {
      "part": "a",
      "marks": 6,
      "specTags": [
        "2D"
      ]
    },
    {
      "part": "b",
      "marks": 6,
      "specTags": [
        "2D"
      ]
    }
  ],
  "bio-2026-mj-2B-1": [
    {
      "part": "a",
      "marks": 3,
      "specTags": [
        "5A",
        "6B"
      ]
    },
    {
      "part": "b",
      "marks": 3,
      "specTags": [
        "5A"
      ]
    },
    {
      "part": "c",
      "marks": 1,
      "specTags": [
        "5A",
        "6B"
      ]
    },
    {
      "part": "d",
      "marks": 7,
      "specTags": [
        "2C",
        "5B",
        "5C"
      ]
    },
    {
      "part": "e",
      "marks": 2,
      "specTags": [
        "1A"
      ]
    },
    {
      "part": "f",
      "marks": 1,
      "specTags": [
        "6B"
      ]
    }
  ],
  "bio-2026-mj-2B-2": [
    {
      "part": "a",
      "marks": 2,
      "specTags": [
        "4B"
      ]
    },
    {
      "part": "b",
      "marks": 5,
      "specTags": [
        "4A",
        "4B"
      ]
    }
  ],
  "bio-2026-mj-2B-3": [
    {
      "part": "a",
      "marks": 3,
      "specTags": [
        "3B"
      ]
    },
    {
      "part": "b",
      "marks": 8,
      "specTags": [
        "3B"
      ]
    }
  ],
  "bio-2026-mj-2B-4": [
    {
      "part": "a",
      "marks": 2,
      "specTags": [
        "1A",
        "1B"
      ]
    },
    {
      "part": "b",
      "marks": 5,
      "specTags": [
        "2E"
      ]
    },
    {
      "part": "c",
      "marks": 5,
      "specTags": [
        "1A",
        "2E"
      ]
    }
  ],
  "bio-2026-mj-2B-5": [
    {
      "part": "a",
      "marks": 2,
      "specTags": [
        "2D"
      ]
    },
    {
      "part": "b",
      "marks": 8,
      "specTags": [
        "2D"
      ]
    }
  ],
  "bio-2026-mj-2B-6": [
    {
      "part": "a",
      "marks": 8,
      "specTags": [
        "1A",
        "3A",
        "4A"
      ]
    },
    {
      "part": "b",
      "marks": 5,
      "specTags": [
        "4B"
      ]
    }
  ],
  "bio-2026-mj-2BR-1": [
    {
      "part": "a",
      "marks": 1,
      "specTags": [
        "3A"
      ]
    },
    {
      "part": "b",
      "marks": 2,
      "specTags": [
        "3A"
      ]
    },
    {
      "part": "c",
      "marks": 2,
      "specTags": [
        "1A"
      ]
    },
    {
      "part": "d",
      "marks": 3,
      "specTags": [
        "3A"
      ]
    },
    {
      "part": "e",
      "marks": 3,
      "specTags": [
        "1A",
        "3A"
      ]
    },
    {
      "part": "f",
      "marks": 5,
      "specTags": [
        "3B",
        "4B"
      ]
    },
    {
      "part": "g",
      "marks": 1,
      "specTags": [
        "4B"
      ]
    },
    {
      "part": "h",
      "marks": 1,
      "specTags": [
        "4B"
      ]
    }
  ],
  "bio-2026-mj-2BR-2": [
    {
      "part": "a",
      "marks": 4,
      "specTags": [
        "2B"
      ]
    },
    {
      "part": "b",
      "marks": 3,
      "specTags": [
        "2B"
      ]
    },
    {
      "part": "c",
      "marks": 7,
      "specTags": [
        "2B"
      ]
    }
  ],
  "bio-2026-mj-2BR-3": [
    {
      "part": "a",
      "marks": 3,
      "specTags": [
        "1A",
        "3A"
      ]
    },
    {
      "part": "b",
      "marks": 4,
      "specTags": [
        "3A"
      ]
    },
    {
      "part": "c",
      "marks": 3,
      "specTags": [
        "3A"
      ]
    }
  ],
  "bio-2026-mj-2BR-4": [
    {
      "part": "a",
      "marks": 6,
      "specTags": [
        "3D"
      ]
    },
    {
      "part": "b",
      "marks": 3,
      "specTags": [
        "3D"
      ]
    }
  ],
  "bio-2026-mj-2BR-5": [
    {
      "part": "a",
      "marks": 5,
      "specTags": [
        "4B"
      ]
    },
    {
      "part": "b",
      "marks": 4,
      "specTags": [
        "4B"
      ]
    },
    {
      "part": "c",
      "marks": 1,
      "specTags": [
        "4B"
      ]
    }
  ],
  "bio-2026-mj-2BR-6": [
    {
      "part": "a",
      "marks": 3,
      "specTags": [
        "4A"
      ]
    },
    {
      "part": "b",
      "marks": 6,
      "specTags": [
        "4B"
      ]
    }
  ]
};
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
