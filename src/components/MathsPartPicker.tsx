"use client";

import { useEffect, useMemo, useState } from "react";
import type { Question } from "@/lib/questions";
import { getReviewParts, type ReviewPart } from "@/lib/reviewParts";
import MathsQuestionDetails from "./MathsQuestionDetails";

export type MathsPaperQuestion = Question & {
  selectedParts?: string[];
  sourceMarks?: number;
};

type Props = {
  question: MathsPaperQuestion;
  onChange: (selectedParts: string[] | undefined, marks: number) => void;
};

export default function MathsPartPicker({ question, onChange }: Props) {
  const [parts, setParts] = useState<ReviewPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFullQuestion, setShowFullQuestion] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setShowFullQuestion(false);
    const baseQuestion = {
      ...question,
      marks: question.sourceMarks ?? question.marks,
      selectedParts: undefined,
    };
    getReviewParts(baseQuestion).then(result => {
      if (!active) return;
      setParts(result.filter(part => part.marks > 0));
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setParts([]);
      setLoading(false);
    });
    return () => { active = false; };
  }, [question.id, question.questionNumber, question.sourceMarks]);

  const selectable = useMemo(() => parts.filter(part => part.originalPart), [parts]);
  const allParts = selectable.map(part => part.originalPart!);
  const selected = question.selectedParts?.length ? question.selectedParts : allParts;
  const selectedSet = new Set(selected);

  function toggle(part: ReviewPart) {
    if (!part.originalPart) return;
    let next = selectedSet.has(part.originalPart)
      ? selected.filter(item => item !== part.originalPart)
      : [...selected, part.originalPart];
    if (!next.length) return;
    next = allParts.filter(item => next.includes(item));
    const marks = selectable.filter(item => item.originalPart && next.includes(item.originalPart)).reduce((sum, item) => sum + item.marks, 0);
    onChange(next.length === allParts.length ? undefined : next, marks);
  }

  return <div style={{marginTop:10}}>
    <button
      type="button"
      onClick={() => setShowFullQuestion(current => !current)}
      style={{
        border:"1px solid rgba(201,162,39,.28)",
        background:showFullQuestion ? "rgba(201,162,39,.13)" : "rgba(255,255,255,.035)",
        color:showFullQuestion ? "#f0d36a" : "#d3d3d3",
        borderRadius:9,
        padding:"7px 10px",
        fontSize:11,
        fontWeight:800,
        cursor:"pointer",
        marginBottom:showFullQuestion ? 2 : 0
      }}
    >{showFullQuestion ? "▾ Hide full question" : "▸ View full question"}</button>

    {showFullQuestion && <MathsQuestionDetails question={question}/>} 

    {loading ? <small style={{display:"block",opacity:.62,marginTop:10}}>Loading sub-questions…</small> : selectable.length > 1 ? <div style={{marginTop:10}}>
      <div style={{fontSize:11,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",opacity:.68,marginBottom:6}}>Choose sub-questions</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
        {selectable.map(part => {
          const active = selectedSet.has(part.originalPart!);
          return <button
            key={part.originalPart}
            type="button"
            onClick={() => toggle(part)}
            style={{
              border:`1px solid ${active ? "#c9a227" : "rgba(255,255,255,.16)"}`,
              background:active ? "rgba(201,162,39,.16)" : "rgba(255,255,255,.035)",
              color:active ? "#f4d76b" : "#c8c8c8",
              borderRadius:999,
              padding:"6px 10px",
              fontSize:12,
              fontWeight:700,
              cursor:"pointer"
            }}
          >{active ? "✓ " : "+ "}{part.label} · {part.marks} {part.marks === 1 ? "mark" : "marks"}</button>;
        })}
      </div>
    </div> : null}
  </div>;
}
