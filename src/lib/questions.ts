export type Question = {
  id: string;
  year: number;
  session: string;
  paper: string;
  questionNumber: number;
  marks: number;
  topics: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  summary: string;
};

// Initial development dataset taken from the three test papers.
// This will later be replaced by the automatic PDF importer + database.
export const questions: Question[] = [
  { id: "2021-1H-1", year: 2021, session: "January", paper: "1H", questionNumber: 1, marks: 4, topics: ["Fractions", "Ratio"], difficulty: "Easy", summary: "Fraction of an amount followed by ratio sharing." },
  { id: "2021-1H-2", year: 2021, session: "January", paper: "1H", questionNumber: 2, marks: 5, topics: ["Statistics", "Grouped Data", "Estimated Mean"], difficulty: "Medium", summary: "Modal class and estimated mean from grouped frequency data." },
  { id: "2021-1H-4", year: 2021, session: "January", paper: "1H", questionNumber: 4, marks: 2, topics: ["Sets"], difficulty: "Easy", summary: "Intersection and union of sets." },
  { id: "2021-1H-5", year: 2021, session: "January", paper: "1H", questionNumber: 5, marks: 5, topics: ["Algebra", "Factorising", "Linear Equations"], difficulty: "Medium", summary: "Factorising and solving an equation." },
  { id: "2021-1H-6", year: 2021, session: "January", paper: "1H", questionNumber: 6, marks: 2, topics: ["Standard Form"], difficulty: "Easy", summary: "Convert between standard form and ordinary numbers." },
  { id: "2021-1H-7", year: 2021, session: "January", paper: "1H", questionNumber: 7, marks: 6, topics: ["Percentages", "Compound Interest"], difficulty: "Medium", summary: "Compound growth and reverse percentage change." },
  { id: "2021-1H-9", year: 2021, session: "January", paper: "1H", questionNumber: 9, marks: 5, topics: ["Algebra", "Indices", "Quadratics"], difficulty: "Medium", summary: "Index laws, factorising a quadratic and solving it." },
  { id: "2022-1HR-1", year: 2022, session: "January", paper: "1HR", questionNumber: 1, marks: 3, topics: ["Inequalities"], difficulty: "Easy", summary: "Integer inequality and representation on a number line." },
  { id: "2022-1HR-2", year: 2022, session: "January", paper: "1HR", questionNumber: 2, marks: 2, topics: ["Probability"], difficulty: "Easy", summary: "Estimate a frequency from a probability." },
  { id: "2022-1HR-4", year: 2022, session: "January", paper: "1HR", questionNumber: 4, marks: 4, topics: ["Quadratics", "Graphs"], difficulty: "Medium", summary: "Complete a value table and draw a quadratic graph." },
  { id: "2022-1HR-6", year: 2022, session: "January", paper: "1HR", questionNumber: 6, marks: 4, topics: ["HCF and LCM", "Prime Factors"], difficulty: "Medium", summary: "LCM and algebraic HCF using prime factor powers." },
  { id: "2022-1HR-9", year: 2022, session: "January", paper: "1HR", questionNumber: 9, marks: 5, topics: ["Algebra", "Indices", "Quadratics"], difficulty: "Medium", summary: "Index laws and factorising a quadratic." },
  { id: "2024-1H-1", year: 2024, session: "June", paper: "1H", questionNumber: 1, marks: 3, topics: ["Sequences", "Arithmetic Sequences"], difficulty: "Easy", summary: "Find an nth term and evaluate another arithmetic sequence." },
  { id: "2024-1H-2", year: 2024, session: "June", paper: "1H", questionNumber: 2, marks: 4, topics: ["Probability", "Algebra"], difficulty: "Medium", summary: "Use total probability and algebra to find an expected number." },
  { id: "2024-1H-3", year: 2024, session: "June", paper: "1H", questionNumber: 3, marks: 2, topics: ["HCF and LCM"], difficulty: "Easy", summary: "Find the HCF of two integers." },
  { id: "2024-1H-4", year: 2024, session: "June", paper: "1H", questionNumber: 4, marks: 3, topics: ["Percentages", "Reverse Percentages"], difficulty: "Medium", summary: "Reverse a percentage increase." },
  { id: "2024-1H-6", year: 2024, session: "June", paper: "1H", questionNumber: 6, marks: 5, topics: ["Algebra", "Expanding", "Linear Equations"], difficulty: "Medium", summary: "Expand brackets and solve a linear equation." },
  { id: "2024-1H-7", year: 2024, session: "June", paper: "1H", questionNumber: 7, marks: 5, topics: ["Sets"], difficulty: "Medium", summary: "Union, intersection, complement and empty-set reasoning." },
  { id: "2024-1H-9", year: 2024, session: "June", paper: "1H", questionNumber: 9, marks: 3, topics: ["Standard Form"], difficulty: "Easy", summary: "Standard-form conversion and calculation." },
  { id: "2024-1H-10", year: 2024, session: "June", paper: "1H", questionNumber: 10, marks: 4, topics: ["Indices", "Algebra"], difficulty: "Medium", summary: "Zero, negative and power-of-a-power index laws." }
];

export const topics = Array.from(new Set(questions.flatMap((q) => q.topics))).sort();

export function generateQuestions(selectedTopics: string[], count: number): Question[] {
  if (!selectedTopics.length) return [];

  const scored = questions
    .map((question) => ({
      question,
      score: question.topics.filter((topic) => selectedTopics.includes(topic)).length * 10 + (question.difficulty === "Medium" ? 2 : 0) + Math.random()
    }))
    .filter(({ score }) => score >= 10)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, Math.max(1, count)).map(({ question }) => question);
}
