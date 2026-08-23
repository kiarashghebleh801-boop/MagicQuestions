export type VisualElement = { page: number; x0: number; y0: number; x1: number; y1: number; displayWidth: number; displayHeight: number; kind: "diagram" | "table" | "graph" | "math" | "formula"; };

// ExamWizard rule:
// - type normal text/simple inline algebra in Arial
// - screenshot ONLY the exact element when Word cannot reproduce it cleanly
//   (diagram, table, graph, probability tree, stacked fraction/surd, vector-arrow notation, etc.)
// - never screenshot an entire question/page just to preserve one visual element
//
// IMPORTANT: 2021 and 2022R have been manually audited against the original PDFs.
// Every question containing a genuine visual has an explicit crop below. Automatic
// detection is only a fallback; these manual crops are the source of truth.
export const visualElements: Record<string, VisualElement[]> = {
  // -------------------- JANUARY 2021 1H --------------------
  // Q2 frequency table
  "2021-1H-2": [
    { page: 4, x0: 64, y0: 96, x1: 268, y1: 282, displayWidth: 340, displayHeight: 310, kind: "table" }
  ],
  // Q3 prism/container diagram
  "2021-1H-3": [
    { page: 5, x0: 122, y0: 78, x1: 540, y1: 295, displayWidth: 500, displayHeight: 260, kind: "diagram" }
  ],
  // Q8 shaded semicircular path
  "2021-1H-8": [
    { page: 9, x0: 188, y0: 78, x1: 540, y1: 210, displayWidth: 455, displayHeight: 171, kind: "diagram" }
  ],
  // Q10 isosceles triangle
  "2021-1H-10": [
    { page: 11, x0: 198, y0: 78, x1: 540, y1: 234, displayWidth: 455, displayHeight: 208, kind: "diagram" }
  ],
  // Q11 cumulative-frequency graph
  "2021-1H-11": [
    { page: 12, x0: 102, y0: 104, x1: 480, y1: 712, displayWidth: 420, displayHeight: 676, kind: "graph" }
  ],
  // Q14 probability tree
  "2021-1H-14": [
    { page: 16, x0: 126, y0: 128, x1: 446, y1: 368, displayWidth: 460, displayHeight: 345, kind: "diagram" }
  ],
  // Q16 bearings / ship-position diagram
  "2021-1H-16": [
    { page: 18, x0: 150, y0: 78, x1: 540, y1: 306, displayWidth: 460, displayHeight: 269, kind: "diagram" }
  ],
  // Q17 hemisphere + cylinder
  "2021-1H-17": [
    { page: 20, x0: 228, y0: 112, x1: 540, y1: 304, displayWidth: 410, displayHeight: 252, kind: "diagram" }
  ],
  // Q20 similar solids
  "2021-1H-20": [
    { page: 23, x0: 116, y0: 62, x1: 540, y1: 258, displayWidth: 500, displayHeight: 231, kind: "diagram" }
  ],
  // Q21 transformation/trigonometric graph
  "2021-1H-21": [
    { page: 24, x0: 164, y0: 338, x1: 426, y1: 480, displayWidth: 430, displayHeight: 233, kind: "graph" },
    { page: 24, x0: 42, y0: 198, x1: 165, y1: 238, displayWidth: 155, displayHeight: 50, kind: "math" }
  ],
  // Q23 vector diagram + vector-arrow notation
  "2021-1H-23": [
    { page: 26, x0: 98, y0: 82, x1: 555, y1: 235, displayWidth: 520, displayHeight: 174, kind: "diagram" },
    { page: 26, x0: 40, y0: 232, x1: 235, y1: 268, displayWidth: 220, displayHeight: 41, kind: "math" }
  ],

  // -------------------- JANUARY 2022R 1HR --------------------
  // Q1 number line
  "2022-1HR-1": [
    { page: 3, x0: 90, y0: 368, x1: 500, y1: 424, displayWidth: 500, displayHeight: 68, kind: "graph" }
  ],
  // Q3 shaded composite shape
  "2022-1HR-3": [
    { page: 5, x0: 178, y0: 76, x1: 556, y1: 310, displayWidth: 480, displayHeight: 297, kind: "diagram" }
  ],
  // Q4 table and graph grid
  "2022-1HR-4": [
    { page: 6, x0: 108, y0: 86, x1: 486, y1: 143, displayWidth: 500, displayHeight: 75, kind: "table" },
    { page: 6, x0: 84, y0: 218, x1: 500, y1: 738, displayWidth: 470, displayHeight: 587, kind: "graph" }
  ],
  // Q10 cuboid storage container
  "2022-1HR-10": [
    { page: 12, x0: 145, y0: 82, x1: 540, y1: 214, displayWidth: 480, displayHeight: 160, kind: "diagram" }
  ],
  // Q11 circle sector
  "2022-1HR-11": [
    { page: 14, x0: 188, y0: 78, x1: 540, y1: 215, displayWidth: 455, displayHeight: 177, kind: "diagram" }
  ],
  // Q13 probability tree
  "2022-1HR-13": [
    { page: 16, x0: 64, y0: 198, x1: 430, y1: 504, displayWidth: 500, displayHeight: 418, kind: "diagram" }
  ],
  // Q14 circle-theorem diagram
  "2022-1HR-14": [
    { page: 18, x0: 146, y0: 64, x1: 540, y1: 346, displayWidth: 470, displayHeight: 336, kind: "diagram" }
  ],
  // Q17 Venn diagram
  "2022-1HR-17": [
    { page: 21, x0: 84, y0: 82, x1: 512, y1: 360, displayWidth: 500, displayHeight: 325, kind: "diagram" }
  ],
  // Q20 graph of g(x)
  "2022-1HR-20": [
    { page: 24, x0: 108, y0: 294, x1: 486, y1: 616, displayWidth: 480, displayHeight: 409, kind: "graph" }
  ],
  // Q21 histogram
  "2022-1HR-21": [
    { page: 26, x0: 136, y0: 80, x1: 450, y1: 360, displayWidth: 455, displayHeight: 406, kind: "graph" }
  ],
  // Q22 triangle/bounds diagram
  "2022-1HR-22": [
    { page: 27, x0: 166, y0: 76, x1: 540, y1: 274, displayWidth: 470, displayHeight: 249, kind: "diagram" }
  ],
  // Q24 vector trapezium + vector notation
  "2022-1HR-24": [
    { page: 30, x0: 68, y0: 82, x1: 548, y1: 244, displayWidth: 555, displayHeight: 187, kind: "diagram" },
    { page: 30, x0: 40, y0: 248, x1: 170, y1: 322, displayWidth: 150, displayHeight: 85, kind: "math" }
  ],

  // -------------------- JUNE 2024 1H --------------------
  "2024-1H-2": [{ page: 4, x0: 103.8, y0: 151.3, x1: 500.0, y1: 218.0, displayWidth: 600, displayHeight: 101, kind: "table" }],
  "2024-1H-5": [{ page: 6, x0: 215.6, y0: 80.7, x1: 556.8, y1: 266.4, displayWidth: 451, displayHeight: 245, kind: "diagram" }],
  "2024-1H-6": [{ page: 7, x0: 117.6, y0: 279.5, x1: 243.1, y1: 311.5, displayWidth: 124, displayHeight: 32, kind: "math" }],
  "2024-1H-8": [{ page: 9, x0: 228.7, y0: 84.0, x1: 558.1, y1: 180.1, displayWidth: 346, displayHeight: 101, kind: "diagram" }, { page: 9, x0: 240.4, y0: 225.2, x1: 352.9, y1: 284.7, displayWidth: 154, displayHeight: 82, kind: "formula" }],
  "2024-1H-9": [{ page: 10, x0: 187.5, y0: 86.0, x1: 413.7, y1: 177.5, displayWidth: 355, displayHeight: 144, kind: "table" }],
  "2024-1H-10": [{ page: 11, x0: 135.2, y0: 60.0, x1: 235.9, y1: 82.9, displayWidth: 118, displayHeight: 27, kind: "math" }, { page: 11, x0: 57.4, y0: 197.3, x1: 124.1, y1: 220.2, displayWidth: 163, displayHeight: 56, kind: "math" }, { page: 11, x0: 160.7, y0: 369.9, x1: 224.8, y1: 390.1, displayWidth: 96, displayHeight: 31, kind: "math" }],
  "2024-1H-11": [{ page: 12, x0: 194.7, y0: 80.1, x1: 556.2, y1: 242.2, displayWidth: 413, displayHeight: 185, kind: "diagram" }],
  "2024-1H-12": [{ page: 13, x0: 122.1, y0: 281.8, x1: 216.3, y1: 315.8, displayWidth: 94, displayHeight: 35, kind: "math" }],
  "2024-1H-13": [{ page: 14, x0: 131.9, y0: 172.9, x1: 438.5, y1: 429.1, displayWidth: 538, displayHeight: 449, kind: "diagram" }],
  "2024-1H-14": [{ page: 15, x0: 185.5, y0: 108.8, x1: 205.8, y1: 138.9, displayWidth: 20, displayHeight: 29, kind: "math" }],
  "2024-1H-15": [{ page: 16, x0: 247.6, y0: 88.6, x1: 330.0, y1: 120.6, displayWidth: 154, displayHeight: 60, kind: "math" }],
  "2024-1H-17": [{ page: 18, x0: 114.9, y0: 56.7, x1: 152.9, y1: 97.3, displayWidth: 41, displayHeight: 43, kind: "math" }],
  "2024-1H-19": [{ page: 20, x0: 146.3, y0: 84.0, x1: 558.1, y1: 269.7, displayWidth: 461, displayHeight: 207, kind: "diagram" }],
  "2024-1H-20": [{ page: 21, x0: 207.8, y0: 81.4, x1: 552.9, y1: 271.0, displayWidth: 413, displayHeight: 227, kind: "diagram" }],
  "2024-1H-22": [{ page: 23, x0: 54.1, y0: 95.1, x1: 488.8, y1: 440.3, displayWidth: 566, displayHeight: 450, kind: "graph" }],
  "2024-1H-23": [{ page: 24, x0: 183.6, y0: 99.7, x1: 558.8, y1: 321.9, displayWidth: 413, displayHeight: 244, kind: "diagram" }],
};
