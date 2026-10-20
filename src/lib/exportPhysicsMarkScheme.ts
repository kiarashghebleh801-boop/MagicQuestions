"use client";
import type { Question } from "./questions";
import { PHYSICS_MARKSCHEME_BUCKET, getPhysicsMarkSchemeSource } from "./physicsMarkSchemeSources";
import { createScienceMarkSchemeDocument, exportScienceMarkSchemeToWord, type IndexedPaper } from "./exportScienceMarkScheme";
const config = {
  subject: "Physics", bucket: PHYSICS_MARKSCHEME_BUCKET,
  getIndex: async () => (await import("./physicsMarkSchemeIndex.json")).default as Record<string, IndexedPaper>,
  getSource: getPhysicsMarkSchemeSource,
};
export const createPhysicsMarkSchemeDocument = (questions: Question[]) => createScienceMarkSchemeDocument(questions, config);
export const exportPhysicsMarkSchemeToWord = (questions: Question[]) => exportScienceMarkSchemeToWord(questions, config);
