export type VisualElement = { page: number; x0: number; y0: number; x1: number; y1: number; displayWidth: number; displayHeight: number; kind: "diagram" | "table" | "graph" | "math" | "formula"; };

// Tight, element-only crops derived from the user's June 2024 ExamWizard reference.
// These are deliberately NOT full-question crops: only tables, diagrams, graphs,
// or maths snippets that should remain graphical are listed here.
export const visualElements: Record<string, VisualElement[]> = {
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
  "2024-1H-25": [{ page: 28, x0: 59.4, y0: 59.6, x1: 199.3, y1: 82.5, displayWidth: 146, displayHeight: 24, kind: "math" }],
};
