import type { Question } from "./questions";

// Verified question numbers and total marks from the source DOCX and Pearson
// January 2012/2013 Higher-tier mark schemes.
type Entry = [marks: number, topics: string, summary: string];
const papers: {year: number; paper: string; entries: Entry[]}[] = [
  {
    "year": 2012,
    "paper": "3H",
    "entries": [
      [
        5,
        "Percentages",
        "Population percentages and increase"
      ],
      [
        2,
        "Probability",
        "Estimate outcomes on a fair spinner"
      ],
      [
        3,
        "Surface Area and Volume",
        "Volume of a cylinder"
      ],
      [
        4,
        "Constructions|Geometry",
        "Construct a rhombus with ruler and compasses"
      ],
      [
        7,
        "Algebra|Factorising|Expanding",
        "Factorising, expanding and substitution"
      ],
      [
        4,
        "Sets",
        "Set notation for subjects studied"
      ],
      [
        6,
        "Grouped Data|Statistics",
        "Grouped frequency modal class and estimated mean"
      ],
      [
        6,
        "Probability|Linear Equations",
        "Changing probability after adding red beads"
      ],
      [
        5,
        "Trigonometry|Bounds",
        "Right triangle sine and bounds"
      ],
      [
        3,
        "Compound Interest|Percentages",
        "Compound interest over three years"
      ],
      [
        3,
        "Algebra|Changing the Subject",
        "Make y the subject of an equation"
      ],
      [
        7,
        "Similarity|Surface Area and Volume",
        "Similar quadrilaterals and scale factors"
      ],
      [
        4,
        "Circle Theorems",
        "Explain circle angles and test a theorem"
      ],
      [
        8,
        "Area and Perimeter|Quadratics",
        "Model a photo-frame area and solve a quadratic"
      ],
      [
        6,
        "Proportion",
        "Inverse-square proportionality of magnetic force"
      ],
      [
        6,
        "Statistics|Cumulative Frequency",
        "Running times and cumulative frequency"
      ],
      [
        2,
        "Recurring Decimals|Fractions",
        "Prove a recurring decimal as a fraction"
      ],
      [
        6,
        "Circle Theorems|Area and Perimeter",
        "Area of a circular segment"
      ],
      [
        3,
        "Surds|Indices",
        "Rewrite an expression in a required surd form"
      ],
      [
        3,
        "Algebraic Fractions",
        "Simplify an algebraic expression fully"
      ],
      [
        7,
        "Quadratics|Area and Perimeter",
        "Trapezium area with algebraic side lengths"
      ]
    ]
  },
  {
    "year": 2012,
    "paper": "4H",
    "entries": [
      [
        2,
        "Fractions",
        "Evaluate a numerical expression as a decimal"
      ],
      [
        3,
        "Speed Distance Time",
        "Aeroplane journey time in minutes"
      ],
      [
        3,
        "Linear Equations",
        "Solve a linear equation"
      ],
      [
        3,
        "Statistics",
        "Mean median and range of three numbers"
      ],
      [
        4,
        "Graphs",
        "Draw a straight-line graph from an equation"
      ],
      [
        5,
        "Ratio|Similarity",
        "Student ratio and scale-model lorry lengths"
      ],
      [
        3,
        "HCF and LCM|Indices",
        "Prime-factor decomposition of 200"
      ],
      [
        2,
        "Indices",
        "Solve an equation using laws of indices"
      ],
      [
        6,
        "Area and Perimeter|Pythagoras",
        "Area and diagonal of a rhombus"
      ],
      [
        4,
        "Inequalities",
        "Solve an inequality and list integer solutions"
      ],
      [
        4,
        "HCF and LCM",
        "Find HCF and LCM of 75 and 90"
      ],
      [
        6,
        "Transformations",
        "Rotation and translation of a triangle"
      ],
      [
        8,
        "Coordinate Geometry|Simultaneous Equations",
        "Gradient and intersection of straight lines"
      ],
      [
        5,
        "Statistics|Grouped Data",
        "Grouped frequency table about elephant ages"
      ],
      [
        2,
        "Inequalities",
        "Solve a quadratic inequality"
      ],
      [
        7,
        "Probability",
        "Probability questions using dominoes"
      ],
      [
        12,
        "Functions|Algebra",
        "Multi-part function and algebra question"
      ],
      [
        3,
        "Trigonometry",
        "Calculate a missing length or angle"
      ],
      [
        4,
        "Sets",
        "Solve set-counting questions"
      ],
      [
        5,
        "Surface Area and Volume",
        "Find cone volume from curved surface area"
      ],
      [
        4,
        "Proportion|Algebra",
        "Express n in terms of p and q"
      ],
      [
        5,
        "Vectors",
        "Vector relationships in a rectangle"
      ]
    ]
  },
  {
    "year": 2013,
    "paper": "3H",
    "entries": [
      [
        4,
        "Probability",
        "Biased spinner probabilities and expected frequency"
      ],
      [
        4,
        "Linear Equations|Area and Perimeter",
        "Equal perimeters of two rectangles"
      ],
      [
        11,
        "Percentages|Speed Distance Time",
        "Pay and travel costs percentage and speed"
      ],
      [
        5,
        "Transformations",
        "Enlargement and rotation on a coordinate grid"
      ],
      [
        3,
        "Simultaneous Equations",
        "Solve two simultaneous linear equations"
      ],
      [
        4,
        "Statistics|Grouped Data",
        "Grouped distances travelled by teachers"
      ],
      [
        4,
        "Inequalities",
        "Inequality and number line"
      ],
      [
        5,
        "Trigonometry|Bounds",
        "Right triangle trigonometry and angle bounds"
      ],
      [
        5,
        "Standard Form",
        "Planet diameters and standard form"
      ],
      [
        5,
        "Coordinate Geometry",
        "Equation of a straight line through points"
      ],
      [
        4,
        "Pythagoras|Geometry",
        "Length of a sloping washing line"
      ],
      [
        2,
        "Changing the Subject|Algebra",
        "Make h the subject of a formula"
      ],
      [
        4,
        "Histograms|Statistics",
        "Read an incomplete histogram and frequency table"
      ],
      [
        6,
        "Probability",
        "Two shots at a target probability"
      ],
      [
        4,
        "Sets",
        "Three-set Venn diagram"
      ],
      [
        3,
        "Trigonometry",
        "Find an unknown angle or length"
      ],
      [
        3,
        "Algebraic Fractions",
        "Simplify an algebraic expression"
      ],
      [
        7,
        "Algebra|Quadratics",
        "Multi-part algebraic problem"
      ],
      [
        8,
        "Quadratics|Area and Perimeter",
        "Extended playground dimensions"
      ],
      [
        5,
        "Vectors",
        "Vector proof in a parallelogram"
      ],
      [
        4,
        "Trigonometry|Pythagoras",
        "Three-dimensional geometry of a pyramid"
      ]
    ]
  },
  {
    "year": 2013,
    "paper": "4H",
    "entries": [
      [
        3,
        "Number",
        "Calculator calculation and significant figures"
      ],
      [
        2,
        "Area and Perimeter",
        "Circumference of a circle"
      ],
      [
        3,
        "Statistics",
        "Mean from a frequency table"
      ],
      [
        2,
        "Probability",
        "Probability of an early or on-time bus"
      ],
      [
        3,
        "Sets",
        "Construct sets with intersection conditions"
      ],
      [
        5,
        "Fractions|Probability",
        "Fractions of right-handed students"
      ],
      [
        4,
        "Area and Perimeter",
        "Area of a composite shape"
      ],
      [
        6,
        "Factorising|Expanding|Algebra",
        "Factorise and expand expressions"
      ],
      [
        3,
        "Pythagoras",
        "Calculate a side of a right-angled triangle"
      ],
      [
        3,
        "Linear Equations",
        "Solve a linear equation"
      ],
      [
        3,
        "Ratio",
        "Share money using a ratio"
      ],
      [
        2,
        "Constructions",
        "Construct an angle bisector"
      ],
      [
        3,
        "Inequalities|Graphs",
        "Write inequalities defining a shaded region"
      ],
      [
        4,
        "Linear Equations|Algebra",
        "Solve an algebraic equation"
      ],
      [
        4,
        "Algebra|Indices",
        "Simplify two algebraic expressions"
      ],
      [
        5,
        "Cumulative Frequency|Statistics",
        "Complete cumulative frequencies for python lengths"
      ],
      [
        7,
        "Similarity|Geometry",
        "Similar triangles with parallel lines"
      ],
      [
        3,
        "Quadratics",
        "Solve a quadratic equation"
      ],
      [
        3,
        "Indices|Surds",
        "Find values of a and k in an algebraic expression"
      ],
      [
        5,
        "Probability",
        "Transfer discs between boxes"
      ],
      [
        5,
        "Proportion",
        "Exposure time and direct square proportion"
      ],
      [
        4,
        "Circle Theorems",
        "Angle between two tangents"
      ],
      [
        3,
        "Functions",
        "Calculate with a function"
      ],
      [
        3,
        "Percentages|Speed Distance Time",
        "Travel time when average speed increases"
      ],
      [
        6,
        "Trigonometry",
        "Calculate the height of a flagpole"
      ],
      [
        6,
        "Simultaneous Equations|Quadratics",
        "Solve linear and quadratic simultaneous equations"
      ]
    ]
  }
];

export const questions_2012_2013_january: Question[] = papers.flatMap(({year,paper,entries}) =>
  entries.map(([marks, topicString, summary], index) => {
    const questionNumber = index + 1;
    return {
      id: `${year}-jan-${paper}-${questionNumber}`,
      year,
      session: "January",
      paper,
      questionNumber,
      marks,
      topics: topicString.split("|"),
      difficulty: questionNumber <= 5 && marks <= 4 ? "Easy" : questionNumber >= 17 ? "Hard" : "Medium",
      summary,
    };
  })
);
