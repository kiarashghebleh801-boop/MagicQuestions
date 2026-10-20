export type BiologyQuestion = {
  id: string; specTags: string[]; summary: string; marks: number;
  year: number; session: string; paper: "1B" | "1BR" | "2B" | "2BR";
  questionNumber: number; sourceFile: string;
};
// Populate only after a formatted source has been uploaded and its question/part tags verified.
// The four 2026 mark schemes alone do not provide question-paper sources.
export const biologyQuestions: BiologyQuestion[] = [];
