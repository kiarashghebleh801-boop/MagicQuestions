"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReviewPart, ReviewQuestion } from "@/lib/reviewParts";
import { getReviewParts } from "@/lib/reviewParts";

type QuestionWithParts = { question: ReviewQuestion; parts: ReviewPart[] };

type Props = {
  paper: ReviewQuestion[];
  title: string;
  onClose: () => void;
};

function band(score: number | undefined, max: number) {
  if (score === undefined) return { bg: "rgba(127,127,127,.08)", border: "rgba(127,127,127,.22)", label: "Not marked" };
  const ratio = max > 0 ? score / max : 0;
  if (ratio >= .75) return { bg: "rgba(46,160,67,.12)", border: "rgba(46,160,67,.45)", label: "Strong" };
  if (ratio >= .5) return { bg: "rgba(234,179,8,.14)", border: "rgba(234,179,8,.5)", label: "Nearly there" };
  return { bg: "rgba(220,38,38,.11)", border: "rgba(220,38,38,.42)", label: "Review" };
}

export default function PaperReview({ paper, title, onClose }: Props) {
  const [items, setItems] = useState<QuestionWithParts[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all(paper.map(async question => ({ question, parts: await getReviewParts(question) }))).then(result => {
      if (!cancelled) { setItems(result); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [paper]);

  const totals = useMemo(() => {
    let got = 0, possible = 0, entered = 0;
    for (let qi = 0; qi < items.length; qi++) {
      for (const part of items[qi].parts) {
        const key = `${qi}:${part.key}`;
        possible += part.marks;
        if (scores[key] !== undefined) { got += scores[key]; entered += part.marks; }
      }
    }
    return { got, possible, entered, percent: entered ? Math.round((got / entered) * 100) : 0 };
  }, [items, scores]);

  const weak = useMemo(() => items.flatMap((item, qi) => item.parts.map(part => {
    const key = `${qi}:${part.key}`;
    const score = scores[key];
    return score === undefined ? null : { qi, part, score, ratio: part.marks ? score / part.marks : 0, question: item.question };
  })).filter((x): x is NonNullable<typeof x> => !!x).filter(x => x.ratio < .5), [items, scores]);

  function setScore(key: string, value: string, max: number) {
    if (value === "") { setScores(current => { const copy = { ...current }; delete copy[key]; return copy; }); return; }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    setScores(current => ({ ...current, [key]: Math.max(0, Math.min(max, parsed)) }));
  }

  return <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.58)",display:"grid",placeItems:"center",padding:20}} onMouseDown={e=>{if(e.currentTarget===e.target)onClose();}}>
    <div className="panel" style={{width:"min(980px,96vw)",maxHeight:"90vh",overflow:"auto",padding:22,borderRadius:20}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",marginBottom:18}}>
        <div><p className="eyebrow" style={{marginBottom:5}}>PAPER REVIEW</p><h2 style={{margin:0}}>{title}</h2><p className="qMeta" style={{marginTop:6}}>Enter the marks you earned for each question part. MagicQuestions highlights your strongest and weakest areas.</p></div>
        <button className="accountButton" onClick={onClose}>Close</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12,marginBottom:18}}>
        <div style={{padding:16,border:"1px solid var(--border,rgba(127,127,127,.2))",borderRadius:14}}><div className="qMeta">SCORE ENTERED</div><strong style={{fontSize:28}}>{totals.got}/{totals.entered || 0}</strong></div>
        <div style={{padding:16,border:"1px solid var(--border,rgba(127,127,127,.2))",borderRadius:14}}><div className="qMeta">CURRENT %</div><strong style={{fontSize:28}}>{totals.entered ? `${totals.percent}%` : "—"}</strong></div>
        <div style={{padding:16,border:"1px solid var(--border,rgba(127,127,127,.2))",borderRadius:14}}><div className="qMeta">FULL PAPER</div><strong style={{fontSize:28}}>{totals.possible} marks</strong></div>
      </div>

      {loading ? <div className="empty" style={{minHeight:180}}><div>✦</div><h3>Preparing your review…</h3><p>Reading the question parts and mark allocations.</p></div> : <>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>{items.map((item, qi) => <div key={`${item.question.id}-${qi}`} style={{border:"1px solid var(--border,rgba(127,127,127,.2))",borderRadius:16,padding:15}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:12,marginBottom:10}}><div><div className="qMeta">Question {qi+1} · {item.question.session} {item.question.year} · Paper {item.question.paper}</div><h3 style={{margin:"3px 0 0"}}>{item.question.summary}</h3></div><b>{item.question.marks} marks</b></div>
          <div style={{display:"grid",gap:8}}>{item.parts.map(part => {
            const key = `${qi}:${part.key}`;
            const score = scores[key];
            const state = band(score, part.marks);
            return <div key={part.key} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:12,alignItems:"center",padding:"10px 12px",borderRadius:12,background:state.bg,border:`1px solid ${state.border}`}}>
              <div><b>{part.label}</b><div className="qMeta">{part.marks} {part.marks===1?"mark":"marks"}</div></div>
              <span className="qMeta" style={{fontWeight:700}}>{state.label}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}><input aria-label={`Question ${qi+1} ${part.label} score`} type="number" min={0} max={part.marks} step={1} value={score ?? ""} onChange={e=>setScore(key,e.target.value,part.marks)} style={{width:68,padding:"8px 9px",borderRadius:10,border:"1px solid var(--border,rgba(127,127,127,.25))",background:"var(--panel,#fff)",color:"inherit"}}/><span>/ {part.marks}</span></div>
            </div>;
          })}</div>
        </div>)}</div>

        <div style={{marginTop:18,padding:16,borderRadius:16,background:"rgba(108,76,255,.08)",border:"1px solid rgba(108,76,255,.2)"}}>
          <div className="qMeta">REVISION SIGNAL</div>
          {totals.entered===0 ? <p style={{margin:"6px 0 0"}}>Enter your marks above and I’ll flag the parts that need the most attention.</p> : weak.length ? <p style={{margin:"6px 0 0"}}>You have <b>{weak.length}</b> red part{weak.length===1?"":"s"}. Prioritise those first when you revise or generate your next practice paper.</p> : <p style={{margin:"6px 0 0"}}>No red parts so far. Your entered scores are all at least 50% — keep pushing the yellow ones into green.</p>}
        </div>
      </>}
    </div>
  </div>;
}
