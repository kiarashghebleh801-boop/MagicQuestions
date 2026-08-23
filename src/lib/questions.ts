export type Difficulty = "Easy" | "Medium" | "Hard";

export type Question = {
  id: string;
  year: number;
  session: string;
  paper: string;
  questionNumber: number;
  marks: number;
  topics: string[];
  difficulty: Difficulty;
  summary: string;
};

export const questions: Question[] = [
  { id:"2021-1H-1",year:2021,session:"January",paper:"1H",questionNumber:1,marks:4,topics:["Fractions","Ratio"],difficulty:"Medium",summary:"Fractions of an amount and ratio sharing." },
  { id:"2021-1H-2",year:2021,session:"January",paper:"1H",questionNumber:2,marks:5,topics:["Statistics","Grouped Data","Estimated Mean"],difficulty:"Medium",summary:"Grouped frequency table, modal class and estimated mean." },
  { id:"2021-1H-3",year:2021,session:"January",paper:"1H",questionNumber:3,marks:4,topics:["Surface Area and Volume"],difficulty:"Medium",summary:"Volume of a prism and rate of emptying." },
  { id:"2021-1H-4",year:2021,session:"January",paper:"1H",questionNumber:4,marks:2,topics:["Sets"],difficulty:"Easy",summary:"Set intersection and union." },
  { id:"2021-1H-5",year:2021,session:"January",paper:"1H",questionNumber:5,marks:5,topics:["Algebra","Factorising","Linear Equations"],difficulty:"Medium",summary:"Factorising and solving an equation." },
  { id:"2021-1H-6",year:2021,session:"January",paper:"1H",questionNumber:6,marks:2,topics:["Standard Form"],difficulty:"Easy",summary:"Convert between ordinary numbers and standard form." },
  { id:"2021-1H-7",year:2021,session:"January",paper:"1H",questionNumber:7,marks:6,topics:["Percentages","Compound Interest","Reverse Percentages"],difficulty:"Hard",summary:"Compound growth and reverse percentage change." },
  { id:"2021-1H-8",year:2021,session:"January",paper:"1H",questionNumber:8,marks:5,topics:["Probability"],difficulty:"Medium",summary:"Probability calculations from given information." },
  { id:"2021-1H-9",year:2021,session:"January",paper:"1H",questionNumber:9,marks:5,topics:["Indices","Quadratics","Factorising"],difficulty:"Medium",summary:"Index laws and factorising a quadratic." },
  { id:"2021-1H-10",year:2021,session:"January",paper:"1H",questionNumber:10,marks:4,topics:["Angles","Circle Theorems"],difficulty:"Medium",summary:"Angle reasoning in a geometry diagram." },
  { id:"2021-1H-11",year:2021,session:"January",paper:"1H",questionNumber:11,marks:5,topics:["Algebra","Algebraic Fractions"],difficulty:"Medium",summary:"Algebraic manipulation including fractions." },
  { id:"2021-1H-12",year:2021,session:"January",paper:"1H",questionNumber:12,marks:4,topics:["Graphs","Linear Equations"],difficulty:"Medium",summary:"Straight-line graph and equation skills." },
  { id:"2021-1H-13",year:2021,session:"January",paper:"1H",questionNumber:13,marks:3,topics:["Graphs"],difficulty:"Medium",summary:"Gradient and perpendicular straight lines." },
  { id:"2021-1H-14",year:2021,session:"January",paper:"1H",questionNumber:14,marks:5,topics:["Probability"],difficulty:"Medium",summary:"Probability tree for two snooker games." },
  { id:"2021-1H-15",year:2021,session:"January",paper:"1H",questionNumber:15,marks:3,topics:["Bounds"],difficulty:"Medium",summary:"Calculate an upper bound from rounded measurements." },
  { id:"2021-1H-16",year:2021,session:"January",paper:"1H",questionNumber:16,marks:5,topics:["Bearings","Trigonometry"],difficulty:"Medium",summary:"Calculate a bearing using a non-right-angled triangle." },
  { id:"2021-1H-17",year:2021,session:"January",paper:"1H",questionNumber:17,marks:5,topics:["Surface Area and Volume","Algebra"],difficulty:"Medium",summary:"Hemisphere and cylinder volume expressed algebraically." },
  { id:"2021-1H-18",year:2021,session:"January",paper:"1H",questionNumber:18,marks:3,topics:["Algebra"],difficulty:"Medium",summary:"Use a prime-number condition in an algebraic identity." },
  { id:"2021-1H-19",year:2021,session:"January",paper:"1H",questionNumber:19,marks:5,topics:["Simultaneous Equations","Quadratics"],difficulty:"Hard",summary:"Solve simultaneous nonlinear equations." },
  { id:"2021-1H-20",year:2021,session:"January",paper:"1H",questionNumber:20,marks:3,topics:["Similar Shapes","Surface Area and Volume"],difficulty:"Medium",summary:"Use scale factors for similar solids." },
  { id:"2021-1H-21",year:2021,session:"January",paper:"1H",questionNumber:21,marks:4,topics:["Functions","Graphs"],difficulty:"Medium",summary:"Transform minimum points on function graphs." },
  { id:"2021-1H-22",year:2021,session:"January",paper:"1H",questionNumber:22,marks:3,topics:["Functions","Quadratics"],difficulty:"Medium",summary:"Find an inverse function with a restricted domain." },
  { id:"2021-1H-23",year:2021,session:"January",paper:"1H",questionNumber:23,marks:6,topics:["Vectors"],difficulty:"Hard",summary:"Vector proof with midpoint and ratio points." },
  { id:"2021-1H-24",year:2021,session:"January",paper:"1H",questionNumber:24,marks:4,topics:["Arithmetic Sequences","Algebra"],difficulty:"Hard",summary:"Relate sums of an arithmetic series algebraically." },

  { id:"2022-1HR-1",year:2022,session:"January",paper:"1HR",questionNumber:1,marks:3,topics:["Inequalities"],difficulty:"Easy",summary:"Integer inequalities and a number line." },
  { id:"2022-1HR-2",year:2022,session:"January",paper:"1HR",questionNumber:2,marks:2,topics:["Probability"],difficulty:"Easy",summary:"Estimate a frequency from a probability." },
  { id:"2022-1HR-3",year:2022,session:"January",paper:"1HR",questionNumber:3,marks:4,topics:["Area and Perimeter","Trigonometry"],difficulty:"Medium",summary:"Perimeter of a shape made from right-angled triangles." },
  { id:"2022-1HR-4",year:2022,session:"January",paper:"1HR",questionNumber:4,marks:4,topics:["Quadratics","Graphs"],difficulty:"Medium",summary:"Complete a table and draw a quadratic graph." },
  { id:"2022-1HR-5",year:2022,session:"January",paper:"1HR",questionNumber:5,marks:4,topics:["Statistics"],difficulty:"Medium",summary:"Determine missing marks from mode, median and range." },
  { id:"2022-1HR-6",year:2022,session:"January",paper:"1HR",questionNumber:6,marks:4,topics:["HCF and LCM","Indices"],difficulty:"Medium",summary:"LCM and algebraic HCF using prime factors." },
  { id:"2022-1HR-7",year:2022,session:"January",paper:"1HR",questionNumber:7,marks:4,topics:["Ratio"],difficulty:"Medium",summary:"Average speed over a multi-stage journey." },
  { id:"2022-1HR-8",year:2022,session:"January",paper:"1HR",questionNumber:8,marks:4,topics:["Standard Form"],difficulty:"Medium",summary:"Convert and calculate with standard form." },
  { id:"2022-1HR-9",year:2022,session:"January",paper:"1HR",questionNumber:9,marks:5,topics:["Indices","Quadratics","Factorising"],difficulty:"Medium",summary:"Index laws and factorising a quadratic." },
  { id:"2022-1HR-10",year:2022,session:"January",paper:"1HR",questionNumber:10,marks:6,topics:["Area and Perimeter","Percentages"],difficulty:"Hard",summary:"Surface area, paint coverage and percentage cost." },
  { id:"2022-1HR-11",year:2022,session:"January",paper:"1HR",questionNumber:11,marks:2,topics:["Area and Perimeter","Angles"],difficulty:"Easy",summary:"Area of a sector." },
  { id:"2022-1HR-12",year:2022,session:"January",paper:"1HR",questionNumber:12,marks:5,topics:["Expanding","Algebraic Fractions"],difficulty:"Medium",summary:"Expand a cubic expression and simplify an algebraic fraction." },
  { id:"2022-1HR-13",year:2022,session:"January",paper:"1HR",questionNumber:13,marks:7,topics:["Probability"],difficulty:"Hard",summary:"Multi-stage probability with counters." },
  { id:"2022-1HR-14",year:2022,session:"January",paper:"1HR",questionNumber:14,marks:4,topics:["Circle Theorems","Angles"],difficulty:"Medium",summary:"Circle theorem angle reasoning with reasons." },
  { id:"2022-1HR-15",year:2022,session:"January",paper:"1HR",questionNumber:15,marks:3,topics:["Proof","Algebra"],difficulty:"Medium",summary:"Algebraic proof involving consecutive integers." },
  { id:"2022-1HR-16",year:2022,session:"January",paper:"1HR",questionNumber:16,marks:4,topics:["Arithmetic Sequences"],difficulty:"Medium",summary:"Sum a selected range of an arithmetic series." },
  { id:"2022-1HR-17",year:2022,session:"January",paper:"1HR",questionNumber:17,marks:4,topics:["Sets"],difficulty:"Medium",summary:"Read set counts from a three-set Venn diagram." },
  { id:"2022-1HR-18",year:2022,session:"January",paper:"1HR",questionNumber:18,marks:4,topics:["Similar Shapes","Surface Area and Volume"],difficulty:"Hard",summary:"Combine area and volume scale factors for similar solids." },
  { id:"2022-1HR-19",year:2022,session:"January",paper:"1HR",questionNumber:19,marks:3,topics:["Indices","Quadratics"],difficulty:"Medium",summary:"Fractional indices and completing the square." },
  { id:"2022-1HR-20",year:2022,session:"January",paper:"1HR",questionNumber:20,marks:6,topics:["Functions","Graphs"],difficulty:"Hard",summary:"Function transformations and graph intersections." },
  { id:"2022-1HR-21",year:2022,session:"January",paper:"1HR",questionNumber:21,marks:3,topics:["Histograms"],difficulty:"Medium",summary:"Use frequency density to find total frequency." },
  { id:"2022-1HR-22",year:2022,session:"January",paper:"1HR",questionNumber:22,marks:4,topics:["Bounds","Trigonometry"],difficulty:"Hard",summary:"Upper bound in a triangle using rounded measurements." },
  { id:"2022-1HR-23",year:2022,session:"January",paper:"1HR",questionNumber:23,marks:6,topics:["Differentiation","Inequalities"],difficulty:"Hard",summary:"Compare particle motion using derivatives and inequalities." },
  { id:"2022-1HR-24",year:2022,session:"January",paper:"1HR",questionNumber:24,marks:5,topics:["Vectors"],difficulty:"Hard",summary:"Vector method in a trapezium to determine a ratio." },

  { id:"2024-1H-1",year:2024,session:"June",paper:"1H",questionNumber:1,marks:3,topics:["Sequences","Arithmetic Sequences"],difficulty:"Easy",summary:"Find an nth term and evaluate an arithmetic sequence." },
  { id:"2024-1H-2",year:2024,session:"June",paper:"1H",questionNumber:2,marks:4,topics:["Probability","Algebra"],difficulty:"Medium",summary:"Use total probability and algebra to find a frequency." },
  { id:"2024-1H-3",year:2024,session:"June",paper:"1H",questionNumber:3,marks:2,topics:["HCF and LCM"],difficulty:"Easy",summary:"Find the HCF of two integers." },
  { id:"2024-1H-4",year:2024,session:"June",paper:"1H",questionNumber:4,marks:3,topics:["Percentages","Reverse Percentages"],difficulty:"Medium",summary:"Reverse a percentage increase." },
  { id:"2024-1H-5",year:2024,session:"June",paper:"1H",questionNumber:5,marks:4,topics:["Angles"],difficulty:"Medium",summary:"Angles in a regular pentagon." },
  { id:"2024-1H-6",year:2024,session:"June",paper:"1H",questionNumber:6,marks:5,topics:["Expanding","Linear Equations","Algebra"],difficulty:"Medium",summary:"Expand brackets and solve a linear equation." },
  { id:"2024-1H-7",year:2024,session:"June",paper:"1H",questionNumber:7,marks:5,topics:["Sets"],difficulty:"Medium",summary:"Union, intersection, complement and empty-set reasoning." },
  { id:"2024-1H-8",year:2024,session:"June",paper:"1H",questionNumber:8,marks:3,topics:["Surface Area and Volume"],difficulty:"Medium",summary:"Cylinder volume, area and pressure." },
  { id:"2024-1H-9",year:2024,session:"June",paper:"1H",questionNumber:9,marks:3,topics:["Standard Form"],difficulty:"Easy",summary:"Standard-form conversion and calculation." },
  { id:"2024-1H-10",year:2024,session:"June",paper:"1H",questionNumber:10,marks:4,topics:["Indices","Algebra"],difficulty:"Medium",summary:"Zero, negative and power-of-a-power indices." },
  { id:"2024-1H-11",year:2024,session:"June",paper:"1H",questionNumber:11,marks:4,topics:["Trigonometry","Area and Perimeter"],difficulty:"Medium",summary:"Roof support lengths and total material cost." },
  { id:"2024-1H-12",year:2024,session:"June",paper:"1H",questionNumber:12,marks:5,topics:["Factorising","Quadratics","Algebraic Fractions"],difficulty:"Hard",summary:"Factorise a quadratic and combine algebraic fractions." },
  { id:"2024-1H-13",year:2024,session:"June",paper:"1H",questionNumber:13,marks:5,topics:["Probability"],difficulty:"Medium",summary:"Complete and use a probability tree." },
  { id:"2024-1H-14",year:2024,session:"June",paper:"1H",questionNumber:14,marks:5,topics:["Percentages","Ratio"],difficulty:"Medium",summary:"Savings problem combining percentage increase and ratio." },
  { id:"2024-1H-15",year:2024,session:"June",paper:"1H",questionNumber:15,marks:4,topics:["Functions","Algebra"],difficulty:"Hard",summary:"Excluded domain value and inverse function." },
  { id:"2024-1H-16",year:2024,session:"June",paper:"1H",questionNumber:16,marks:4,topics:["Probability"],difficulty:"Medium",summary:"Probability without replacement using coloured sweets." },
  { id:"2024-1H-17",year:2024,session:"June",paper:"1H",questionNumber:17,marks:3,topics:["Proof","Indices"],difficulty:"Medium",summary:"Show an expression can be written in a required exact form." },
  { id:"2024-1H-18",year:2024,session:"June",paper:"1H",questionNumber:18,marks:5,topics:["Differentiation","Graphs"],difficulty:"Hard",summary:"Find points on a cubic with a specified gradient." },
  { id:"2024-1H-19",year:2024,session:"June",paper:"1H",questionNumber:19,marks:5,topics:["Trigonometry","Angles"],difficulty:"Hard",summary:"Find an angle in a quadrilateral using trigonometry." },
  { id:"2024-1H-20",year:2024,session:"June",paper:"1H",questionNumber:20,marks:4,topics:["Area and Perimeter","Angles"],difficulty:"Hard",summary:"Use segment area to find the perimeter of a sector segment." },
  { id:"2024-1H-21",year:2024,session:"June",paper:"1H",questionNumber:21,marks:2,topics:["Functions","Graphs"],difficulty:"Easy",summary:"Transform a minimum point on a function graph." },
  { id:"2024-1H-22",year:2024,session:"June",paper:"1H",questionNumber:22,marks:3,topics:["Histograms"],difficulty:"Medium",summary:"Complete an incomplete histogram from frequency information." },
  { id:"2024-1H-23",year:2024,session:"June",paper:"1H",questionNumber:23,marks:5,topics:["Surface Area and Volume"],difficulty:"Hard",summary:"Cone with a hemisphere removed: volume and surface area." },
  { id:"2024-1H-24",year:2024,session:"June",paper:"1H",questionNumber:24,marks:6,topics:["Arithmetic Sequences","Angles","Algebra"],difficulty:"Hard",summary:"Interior polygon angles forming an arithmetic sequence." },
  { id:"2024-1H-25",year:2024,session:"June",paper:"1H",questionNumber:25,marks:4,topics:["Quadratics","Algebra"],difficulty:"Medium",summary:"Complete the square for a quadratic function." }
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
    const textMatch = !needle || `${q.summary} ${q.topics.join(" ")} ${q.year} ${q.paper}`.toLowerCase().includes(needle);
    return topicMatch && textMatch;
  });
}
