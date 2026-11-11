"use client";
import { splitPhysicsMarkScheme, type PhysicsSelection } from "./physicsParts";
import { PHYSICS_MARKSCHEME_BUCKET, getPhysicsMarkSchemeSource } from "./physicsMarkSchemeSources";
import { createScienceMarkSchemeDocument, exportScienceMarkSchemeToWord, type IndexedPaper } from "./exportScienceMarkScheme";
const config = {
  subject: "Physics", bucket: PHYSICS_MARKSCHEME_BUCKET,
  getIndex: async () => {
    const index = (await import("./physicsMarkSchemeIndex.json")).default as Record<string, IndexedPaper>;
    return Object.fromEntries(Object.entries(index).map(([filename,paper]) => [filename, {...paper, questions:Object.fromEntries(Object.entries(paper.questions).map(([q,rows])=>[q,splitPhysicsMarkScheme(rows)]))}]));
  },
  getSource: getPhysicsMarkSchemeSource,
};
export const createPhysicsMarkSchemeDocument = (questions: PhysicsSelection[]) => createScienceMarkSchemeDocument(questions, config);
export const exportPhysicsMarkSchemeToWord = (questions: PhysicsSelection[]) => exportScienceMarkSchemeToWord(questions, config);
