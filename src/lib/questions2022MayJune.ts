import type { Difficulty, Question } from "./questions";

function difficultyForMarks(marks: number): Difficulty {
  return marks <= 2 ? "Easy" : marks <= 5 ? "Medium" : "Hard";
}

function makePaper(prefix: string, paper: string, marks: number[], topicRows: string[]): Question[] {
  return marks.map((m, index) => {
    const questionNumber = index + 1;
    const topics = (topicRows[index] || "Mixed").split("|");
    return {
      id: `${prefix}-${questionNumber}`,
      year: 2022,
      session: "May/June",
      paper,
      questionNumber,
      marks: m,
      topics,
      difficulty: difficultyForMarks(m),
      summary: `May/June 2022 Paper ${paper} Q${questionNumber} — ${topics.join(", ")}.`,
    };
  });
}

export const questions_2022_may_june: Question[] = [
  ...makePaper("2022-mj-1H", "1H",
    [3,4,4,4,5,6,4,2,4,4,5,4,5,4,4,3,5,5,5,2,3,5,6,4],
    [
      "Arithmetic Sequences|Sequences","Probability","HCF and LCM","Angles|Polygons","Expanding|Linear Equations|Algebra",
      "Percentages|Reverse Percentages|Compound Interest","Surface Area and Volume|Pressure","Standard Form","Indices|Algebra","Coordinate Geometry|Pythagoras",
      "Factorising|Algebraic Fractions","Probability","Percentages","Functions|Inverse Functions","Probability",
      "Proof|Surds","Differentiation","Trigonometry","Area and Perimeter|Circle Theorems|Quadratics","Graphs|Functions",
      "Histograms|Statistics","Surface Area and Volume|Trigonometry","Arithmetic Sequences|Angles|Polygons","Completing the Square|Quadratics|Algebra"
    ]
  ),
  ...makePaper("2022-mj-1HR", "1HR",
    [4,4,3,4,5,3,3,3,2,3,6,3,2,4,3,6,5,4,3,4,4,7,5,5,5],
    [
      "Probability","Sequences|Algebra","Statistics|Mean","Percentages|Ratio","Expanding|Factorising|Quadratics",
      "Proof","Surface Area and Volume|Density","Percentages|Compound Interest","Inequalities","Graphs|Linear Equations",
      "Pythagoras|Area and Perimeter","HCF and LCM|Indices","Statistics|Interquartile Range","Simultaneous Equations","Circle Theorems|Angles",
      "Expanding|Algebraic Fractions","Trigonometry|Area and Perimeter","Pythagoras|Surds|Surface Area and Volume","Histograms|Statistics","Similar Shapes|Surface Area and Volume|Percentages",
      "Surds","Quadratics|Graphs|Functions","Completing the Square|Quadratics|Graphs","Probability|Algebra","Arithmetic Sequences|Sequences|Algebra"
    ]
  ),
  ...makePaper("2022-mj-2H", "2H",
    [3,4,3,3,4,3,3,5,3,3,3,3,7,7,7,8,4,3,3,4,5,7,2,3],
    [
      "Statistics|Median|Mode|Range","Graphs|Linear Equations|Inequalities","Speed|Ratio","Proof|Fractions","Area and Perimeter",
      "Trigonometry","Speed|Ratio","Fractions|Percentages","Percentages|Compound Interest","Simultaneous Equations",
      "Factorising|Quadratics","Statistics|Mean","Cumulative Frequency|Statistics","Expanding|Rearranging Formulae|Algebra","Quadratics|Inequalities",
      "Sets|Probability","Proportion","Bounds","Surds|Algebra","Area and Perimeter|Circle",
      "Vectors","Coordinate Geometry|Trigonometry|Area and Perimeter","Trigonometry|Graphs","Algebra|Rearranging Formulae"
    ]
  ),
  ...makePaper("2022-mj-2HR", "2HR",
    [4,3,3,5,4,8,2,3,4,5,7,3,3,3,3,3,2,4,4,4,5,4,3,6,5],
    [
      "Transformations","HCF and LCM|Prime Factors","Statistics|Median|Range","Sets","Area and Perimeter|Circle",
      "Algebra|Indices|Factorising|Linear Equations","Rearranging Formulae|Algebra","Percentages|Reverse Percentages","Standard Form","Angles|Trigonometry|Polygons",
      "Cumulative Frequency|Statistics","Angles|Parallel Lines","Area and Perimeter|Circle","Probability","Trigonometry|Area and Perimeter",
      "Graphs|Functions","Proof|Algebra","Bounds|Speed","Functions|Quadratics","Coordinate Geometry|Circle",
      "Simultaneous Equations|Quadratics","Transformations|Functions|Graphs","Algebraic Fractions","Similar Shapes|Surface Area and Volume|Algebra","Vectors"
    ]
  ),
];
