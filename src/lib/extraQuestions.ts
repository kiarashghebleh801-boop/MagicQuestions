import type { Difficulty, Question } from "./questions";

function difficultyForMarks(marks: number): Difficulty {
  return marks <= 2 ? "Easy" : marks <= 4 ? "Medium" : "Hard";
}

function makePaper(prefix: string, year: number, session: string, paper: string, marks: number[], topicRows: string[]): Question[] {
  return marks.map((m, index) => {
    const questionNumber = index + 1;
    const topics = (topicRows[index] || "Mixed").split("|");
    return {
      id: `${prefix}-${questionNumber}`, year, session, paper, questionNumber, marks: m, topics,
      difficulty: difficultyForMarks(m),
      summary: `${topics.join(" · ")} — ${session} ${year}, Paper ${paper}, Question ${questionNumber}.`,
    };
  });
}

export const extraQuestions: Question[] = [
  ...makePaper("2022-2HR", 2022, "January", "2HR",
    [4, 7, 5, 4, 3, 4, 5, 3, 5, 3, 4, 3, 3, 8, 4, 5, 3, 5, 3, 4, 6, 5, 4],
    ["Probability", "Percentages", "Inequalities", "Angles", "Percentages|Compound Interest", "Algebra", "Graphs|Linear Equations|Inequalities|Coordinate Geometry", "Statistics", "Angles|Pythagoras|Trigonometry", "Number", "Graphs|Inequalities", "Angles|Trigonometry", "Surds", "Probability|Statistics|Cumulative Frequency|Graphs", "Algebra", "Angles|Area and Perimeter", "Graphs|Linear Equations|Functions", "Graphs|Quadratics|Coordinate Geometry", "Angles", "Proportion", "Area and Perimeter|Surface Area and Volume", "Graphs|Linear Equations|Angles|Coordinate Geometry", "Functions|Quadratics|Inequalities"],
  ),
  ...makePaper("2021-NOV-1H", 2021, "November", "1H",
    [3, 3, 4, 5, 5, 5, 3, 3, 5, 5, 5, 6, 3, 8, 8, 5, 8, 3, 6, 7],
    ["Expanding|Algebra|Indices", "Angles|Pythagoras|Trigonometry", "Probability", "Algebra", "Angles|Area and Perimeter", "Algebra", "Standard Form|Indices|HCF and LCM", "Percentages", "Inequalities", "Surface Area and Volume", "Statistics|Cumulative Frequency|Graphs|Inequalities", "Angles|Trigonometry", "Bounds|Angles", "Transformations|Angles|Area and Perimeter|Vectors", "Probability", "Probability|Sets", "Factorising|Algebra|Rearranging Formulae", "Inequalities|Fractions|Recurring Decimals", "Angles|Area and Perimeter|Proof", "Graphs|Linear Equations|Angles|Area and Perimeter"],
  ),
  ...makePaper("2021-NOV-2H", 2021, "November", "2H",
    [4, 4, 5, 4, 5, 3, 4, 4, 5, 4, 3, 7, 3, 5, 6, 3, 3, 5, 6, 5, 6, 6],
    ["Algebra", "Angles|Area and Perimeter", "Probability|Statistics|Estimated Mean", "Similar Shapes|Angles", "Angles", "Percentages", "Number", "Quadratics|Factorising|Algebra", "Standard Form", "Graphs|Linear Equations|Angles|Area and Perimeter", "Graphs|Linear Equations|Circle Theorems|Angles", "Expanding|Algebra", "Bounds|Graphs|Linear Equations|Inequalities", "Probability|Histograms|Statistics|Graphs", "Functions", "Probability", "Surds", "Area and Perimeter", "Graphs|Linear Equations|Coordinate Geometry", "Arithmetic Sequences|Sequences", "Transformations|Graphs|Functions|Inequalities", "Area and Perimeter|Surface Area and Volume"],
  ),
  ...makePaper("2025-NOV-1H", 2025, "November", "1H",
    [4, 2, 2, 3, 3, 4, 2, 2, 3, 7, 4, 4, 5, 6, 2, 2, 3, 4, 3, 3, 3, 3, 3, 3, 3, 5, 6, 6],
    ["Statistics|Estimated Mean", "Number", "Angles|Area and Perimeter|Constructions", "Statistics", "Proof", "Ratio", "Bounds", "Algebra", "Percentages", "Factorising|Algebra|Inequalities", "Angles|Pythagoras|Trigonometry", "Angles", "Probability", "Expanding|Algebra", "Area and Perimeter", "Statistics", "Surds|Proof", "Algebra|Rearranging Formulae", "Angles", "Graphs|Linear Equations|Coordinate Geometry", "Algebra", "Probability", "Algebra", "Graphs|Functions|Quadratics|Coordinate Geometry", "Inequalities", "Angles|Trigonometry|Surface Area and Volume", "Graphs|Linear Equations|Vectors", "Graphs|Quadratics|Coordinate Geometry"],
  ),
  ...makePaper("2025-NOV-2H", 2025, "November", "2H",
    [2, 3, 4, 3, 6, 5, 3, 3, 3, 4, 4, 5, 4, 5, 4, 2, 3, 3, 3, 3, 3, 6, 3, 5, 5, 6],
    ["Coordinate Geometry", "Simultaneous Equations", "Algebra", "Similar Shapes", "Percentages|Compound Interest", "Graphs|Linear Equations|Area and Perimeter", "Quadratics|Factorising|Algebra", "Standard Form", "Probability", "Bounds|Graphs|Linear Equations|Inequalities", "Angles|Pythagoras|Trigonometry|Area and Perimeter", "Graphs|Inequalities", "Algebra", "Statistics|Cumulative Frequency|Graphs", "Circle Theorems|Angles", "Proof", "Proportion|Surds", "Probability|Sets", "Functions", "Quadratics", "Histograms|Statistics", "Graphs|Linear Equations|Differentiation", "Similar Shapes|Surface Area and Volume", "Bounds", "Arithmetic Sequences|Sequences", "Surface Area and Volume"],
  ),
];
