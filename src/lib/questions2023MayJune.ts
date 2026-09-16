import type { Difficulty, Question } from "./questions";

function difficultyForMarks(marks: number): Difficulty {
  return marks <= 2 ? "Easy" : marks <= 4 ? "Medium" : "Hard";
}

function makePaper(prefix: string, paper: string, marks: number[], topicRows: string[]): Question[] {
  return marks.map((marksValue, index) => {
    const questionNumber = index + 1;
    const topics = (topicRows[index] || "Mixed").split("|");
    return {
      id: `${prefix}-${questionNumber}`,
      year: 2023,
      session: "May/June",
      paper,
      questionNumber,
      marks: marksValue,
      topics,
      difficulty: difficultyForMarks(marksValue),
      summary: `${topics.join(" · ")} — May/June 2023, Paper ${paper}, Question ${questionNumber}.`,
    };
  });
}

export const questions_2023_may_june: Question[] = [
  ...makePaper("2023-mj-1H", "1H",
    [3,3,4,8,4,8,4,4,3,2,6,4,3,3,6,3,4,4,5,6,2,6,5],
    [
      "Ratio","Statistics|Grouped Data|Estimated Mean","Percentages","Transformations|Coordinate Geometry",
      "Area and Perimeter|Pythagoras","Indices|Factorising|Quadratics","Inequalities|Graphs","HCF and LCM|Number",
      "Simultaneous Equations","Statistics","Differentiation|Graphs","Cumulative Frequency|Statistics|Graphs",
      "Linear Equations|Coordinate Geometry|Graphs","Factorising|Algebra","Indices|Standard Form|Percentages","Sets",
      "Functions|Algebra","Histograms|Statistics","Vectors","Arithmetic Sequences|Sequences","Functions|Graphs|Transformations",
      "Area and Perimeter|Polygons","Similar Shapes|Surface Area and Volume"
    ]),

  ...makePaper("2023-mj-1HR", "1HR",
    [3,3,4,5,2,4,3,3,3,2,3,5,3,6,4,2,4,4,5,7,6,4,4,5,6],
    [
      "HCF and LCM|Number","Sets","Similar Shapes","Area and Perimeter|Pythagoras","Probability","Indices",
      "Expanding|Factorising|Quadratics","Standard Form","Percentages|Compound Interest","Transformations",
      "Surface Area and Volume","Probability|Simultaneous Equations","Probability","Cumulative Frequency|Statistics|Graphs",
      "Angles|Polygons","Proof|Algebra","Proportion","Bounds","Pythagoras|Trigonometry","Functions|Graphs|Transformations",
      "Differentiation|Inequalities","Histograms|Statistics","Surds","Quadratics|Rearranging Formulae","Trigonometry|Area and Perimeter|Quadratics"
    ]),

  ...makePaper("2023-mj-2H", "2H",
    [3,3,4,4,4,2,3,3,3,4,3,4,4,4,7,5,7,3,3,3,5,5,4,6,4],
    [
      "Fractions|Proof","Probability","Angles|Linear Equations","Quadratics|Graphs","Ratio","Standard Form",
      "Circle Theorems|Angles","Percentages|Compound Interest","Ratio","Statistics","Angles|Polygons","Pythagoras|Trigonometry",
      "Probability","Circle Theorems|Angles","Indices|Algebra","Proportion|Percentages","Expanding|Rearranging Formulae|Algebra",
      "Graphs|Functions","Quadratics|Completing the Square","Probability","Simultaneous Equations|Quadratics","Pythagoras|Trigonometry",
      "Surds|Surface Area and Volume","Coordinate Geometry|Vectors","Bounds|Surface Area and Volume"
    ]),

  ...makePaper("2023-mj-2HR", "2HR",
    [4,4,3,2,4,7,2,5,6,3,2,3,3,4,3,3,4,3,4,2,5,5,5,5,6,3],
    [
      "Algebra|Expanding","HCF and LCM|Number","Ratio","Arithmetic Sequences|Sequences","Area and Perimeter",
      "Percentages|Reverse Percentages","Indices","Inequalities|Graphs","Trigonometry|Surface Area and Volume","Statistics",
      "Surds","Graphs|Functions","Percentages|Compound Interest","Statistics","Probability","Surds|Proof",
      "Rearranging Formulae|Algebra","Circle Theorems","Probability|Sets","Circle Theorems|Angles",
      "Simultaneous Equations|Coordinate Geometry","Pythagoras|Surface Area and Volume","Arithmetic Sequences|Sequences",
      "Similar Shapes|Surface Area and Volume","Coordinate Geometry|Linear Equations","Graphs|Trigonometry"
    ]),
];
