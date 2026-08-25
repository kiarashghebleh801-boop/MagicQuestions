import { questions as baseQuestions } from "./questions";
import type { Difficulty, Question } from "./questions";
import { extraQuestions } from "./extraQuestions";
import { questions_2025_june_2h } from "./questions2025June2H";
import { questions_2025_may_1h } from "./questions2025May1H";
import { questions_2024_november_1h } from "./questions2024November1H";
import { questions_2024_november_2h } from "./questions2024November2H";

export type { Difficulty, Question } from "./questions";

export const questions: Question[] = [
  ...baseQuestions,
  ...extraQuestions,
  ...questions_2025_june_2h,
  ...questions_2025_may_1h,
  ...questions_2024_november_1h,
  ...questions_2024_november_2h,
];
export const topics = Array.from(new Set(questions.flatMap(q => q.topics))).sort();

export function generateQuestions(selectedTopics: string[], count: number, difficulty: Difficulty | "Mixed" = "Mixed"): Question[] {
  if (!selectedTopics.length) return [];
  const candidates = questions.filter(q => q.topics.some(t => selectedTopics.includes(t)) && (difficulty === "Mixed" || q.difficulty === difficulty));
  const chosen: Question[] = [];
  const remaining = [...candidates];
  const coverage = new Map(selectedTopics.map(topic => [topic, 0]));

  while (chosen.length < count && remaining.length) {
    remaining.sort((a,b) => {
      const score = (q: Question) => q.topics.reduce((sum,t) => sum + (coverage.has(t) ? 12 / (1 + (coverage.get(t) || 0)) : 0), 0) + (q.difficulty === "Medium" ? 1 : 0) + q.year / 10000;
      return score(b) - score(a);
    });
    const next = remaining.shift()!;
    chosen.push(next);
    next.topics.forEach(t => coverage.has(t) && coverage.set(t, (coverage.get(t) || 0) + 1));
  }
  return chosen;
}

export function searchQuestions(query: string, selectedTopics: string[] = []): Question[] {
  const needle = query.trim().toLowerCase();
  return questions.filter(q => {
    const topicMatch = !selectedTopics.length || q.topics.some(t => selectedTopics.includes(t));
    const textMatch = !needle || `${q.summary} ${q.topics.join(" ")} ${q.session} ${q.year} ${q.paper} Q${q.questionNumber}`.toLowerCase().includes(needle);
    return topicMatch && textMatch;
  });
}
