"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReviewPart, ReviewQuestion } from "@/lib/reviewParts";
import { getReviewParts } from "@/lib/reviewParts";
import { supabase } from "@/lib/supabase";

type QuestionWithParts = { question: ReviewQuestion; parts: ReviewPart[] };
type FocusItem = { qi: number; part: ReviewPart; score: number; ratio: number; question: ReviewQuestion };
type TopicFocus = { topic: string; red: number; yellow: number; worst: number };
type HistoryEntry = {
  id: string;
  savedAt: number;
  percent: number;
  score: number;
  possible: number;
  red: number;
  yellow: number;
  topics: TopicFocus[];
  questionCount: number;
};

type Props = { paper: ReviewQuestion[]; title: string; onClose: () => void };

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
  const [submitted, setSubmitted] = useState(false);
  const [tab, setTab] = useState<"marks" | "focus" | "history">("marks");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const subject = /Chemistry/i.test(title) ? "chemistry" : /Physics/i.test(title) ? "physics" : "mathematics";

  async function historyKey() {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    return userId ? `mq-review-history-${subject}-${userId}` : null;
  }

  async function loadHistory() {
    try {
      const key = await historyKey();
      if (!key) return;
      const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
      setHistory(Array.isArray(parsed) ? parsed : []);
    } catch { setHistory([]); }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setSubmitted(false); setTab("marks"); setScores({});
    void loadHistory();
    Promise.all(paper.map(async question => {
      const raw = await getReviewParts(question);
      const valid = raw.filter(part => Number.isFinite(part.marks) && part.marks >= 1);
      return { question, parts: valid.length ? valid : [{ key: "whole", label: "Whole question", marks: Math.max(1, question.marks) }] };
    })).then(result => { if (!cancelled) { setItems(result); setLoading(false); } });
    return () => { cancelled = true; };
  }, [paper, subject]);

  const totals = useMemo(() => {
    let got=0, possible=0, entered=0, enteredRows=0, rows=0;
    items.forEach((item, qi) => item.parts.forEach(part => {
      const key=`${qi}:${part.key}`; possible+=part.marks; rows++;
      if (scores[key] !== undefined) { got+=scores[key]; entered+=part.marks; enteredRows++; }
    }));
    return { got, possible, entered, enteredRows, rows, percent: entered ? Math.round(got/entered*100) : 0 };
  }, [items, scores]);

  const focusItems = useMemo(() => items.flatMap((item, qi) => item.parts.map(part => {
    const score=scores[`${qi}:${part.key}`];
    return score === undefined || part.marks < 1 ? null : { qi, part, score, ratio: score/part.marks, question:item.question };
  })).filter((x): x is FocusItem => !!x).filter(x=>x.ratio<.75).sort((a,b)=>a.ratio-b.ratio), [items,scores]);

  const topicFocus = useMemo(() => {
    const map=new Map<string,TopicFocus>();
    focusItems.forEach(item => (item.question.topics?.length ? item.question.topics : [item.question.summary]).forEach(topic => {
      const current=map.get(topic)||{topic,red:0,yellow:0,worst:1};
      item.ratio<.5 ? current.red++ : current.yellow++;
      current.worst=Math.min(current.worst,item.ratio); map.set(topic,current);
    }));
    return Array.from(map.values()).sort((a,b)=>(b.red-a.red)||(b.yellow-a.yellow)||(a.worst-b.worst)).slice(0,6);
  },[focusItems]);

  const allFilled=!loading&&totals.rows>0&&totals.enteredRows===totals.rows;
  const redCount=focusItems.filter(x=>x.ratio<.5).length;
  const yellowCount=focusItems.filter(x=>x.ratio>=.5).length;
  const historyStats=useMemo(()=>{
    if(!history.length)return null;
    const avg=Math.round(history.reduce((s,h)=>s+h.percent,0)/history.length);
    const best=Math.max(...history.map(h=>h.percent));
    const latest=history[0]?.percent||0;
    const previous=history[1]?.percent;
    return {avg,best,latest,change:previous===undefined?null:latest-previous};
  },[history]);

  function setScore(key:string,value:string,max:number){
    setSubmitted(false); setTab("marks");
    if(value===""){setScores(current=>{const copy={...current};delete copy[key];return copy;});return;}
    const parsed=Number(value); if(!Number.isFinite(parsed))return;
    setScores(current=>({...current,[key]:Math.max(0,Math.min(max,parsed))}));
  }

  async function finishReview(){
    if(!allFilled)return;
    setSubmitted(true); setTab("focus");
    const now=Date.now();
    try{
      const key=await historyKey();
      if(key){
        const entry:HistoryEntry={id:`${now}-${Math.random().toString(36).slice(2,7)}`,savedAt:now,percent:totals.percent,score:totals.got,possible:totals.possible,red:redCount,yellow:yellowCount,topics:topicFocus,questionCount:paper.length};
        const existing:HistoryEntry[]=JSON.parse(window.localStorage.getItem(key)||"[]");
        const next=[entry,...(Array.isArray(existing)?existing:[])].slice(0,25);
        window.localStorage.setItem(key,JSON.stringify(next)); setHistory(next);
      }
      if(subject==="chemistry" || subject==="physics"){
        const {data}=await supabase.auth.getSession(); const userId=data.session?.user.id;
        if(userId){
          window.localStorage.setItem(`mq-${subject}-review-${userId}`,JSON.stringify({percent:totals.percent,score:totals.got,possible:totals.possible,topics:topicFocus,savedAt:now}));
          window.dispatchEvent(new CustomEvent(`mq-${subject}-review-updated`,{detail:{userId}}));
        }
      }
    }catch{}
  }

  return <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.58)",display:"grid",placeItems:"center",padding:20}} onMouseDown={e=>{if(e.currentTarget===e.target)onClose();}}>
    <div className="panel" style={{width:"min(980px,96vw)",maxHeight:"90vh",overflow:"auto",padding:22,borderRadius:20}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",marginBottom:18}}><div><p className="eyebrow" style={{marginBottom:5}}>PAPER REVIEW</p><h2 style={{margin:0}}>{title}</h2><p className="qMeta" style={{marginTop:6}}>Enter every mark, finish the review, and MagicQuestions will keep a history of your progress.</p></div><button className="accountButton" onClick={onClose}>Close</button></div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12,marginBottom:18}}><div style={{padding:16,border:"1px solid var(--border,rgba(127,127,127,.2))",borderRadius:14}}><div className="qMeta">SCORE ENTERED</div><strong style={{fontSize:28}}>{totals.got}/{totals.entered||0}</strong></div><div style={{padding:16,border:"1px solid var(--border,rgba(127,127,127,.2))",borderRadius:14}}><div className="qMeta">CURRENT %</div><strong style={{fontSize:28}}>{totals.entered?`${totals.percent}%`:"—"}</strong></div><div style={{padding:16,border:"1px solid var(--border,rgba(127,127,127,.2))",borderRadius:14}}><div className="qMeta">COMPLETED</div><strong style={{fontSize:28}}>{totals.enteredRows}/{totals.rows}</strong><span className="qMeta"> mark boxes</span></div></div>

      <div style={{display:"flex",gap:6,background:"rgba(127,127,127,.09)",padding:5,borderRadius:12,marginBottom:16,width:"max-content"}}><button onClick={()=>setTab("marks")} style={{border:0,borderRadius:9,padding:"9px 13px",fontWeight:800,cursor:"pointer",background:tab==="marks"?"var(--panel,#fff)":"transparent",color:"inherit"}}>Marks</button>{submitted&&<button onClick={()=>setTab("focus")} style={{border:0,borderRadius:9,padding:"9px 13px",fontWeight:800,cursor:"pointer",background:tab==="focus"?"var(--panel,#fff)":"transparent",color:"inherit"}}>What to work on</button>}<button onClick={()=>setTab("history")} style={{border:0,borderRadius:9,padding:"9px 13px",fontWeight:800,cursor:"pointer",background:tab==="history"?"var(--panel,#fff)":"transparent",color:"inherit"}}>History {history.length?`(${history.length})`:""}</button></div>

      {loading?<div className="empty" style={{minHeight:180}}><div>✦</div><h3>Preparing your review…</h3><p>Reading the question parts and mark allocations.</p></div>:tab==="marks"?<><div style={{display:"flex",flexDirection:"column",gap:14}}>{items.map((item,qi)=><div key={`${item.question.id}-${qi}`} style={{border:"1px solid var(--border,rgba(127,127,127,.2))",borderRadius:16,padding:15}}><div style={{display:"flex",justifyContent:"space-between",gap:12,marginBottom:10}}><div><div className="qMeta">Question {qi+1} · {item.question.session} {item.question.year} · Paper {item.question.paper}</div><h3 style={{margin:"3px 0 0"}}>{item.question.summary}</h3></div><b>{item.question.marks} marks</b></div><div style={{display:"grid",gap:8}}>{item.parts.map(part=>{const key=`${qi}:${part.key}`;const score=scores[key];const state=band(score,part.marks);return <div key={part.key} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:12,alignItems:"center",padding:"10px 12px",borderRadius:12,background:state.bg,border:`1px solid ${state.border}`}}><div><b>{part.label}</b><div className="qMeta">{part.marks} {part.marks===1?"mark":"marks"}</div></div><span className="qMeta" style={{fontWeight:700}}>{state.label}</span><div style={{display:"flex",alignItems:"center",gap:6}}><input type="number" min={0} max={part.marks} step={1} value={score??""} onChange={e=>setScore(key,e.target.value,part.marks)} style={{width:68,padding:"8px 9px",borderRadius:10,border:"1px solid rgba(127,127,127,.35)",background:"rgba(127,127,127,.10)",color:"inherit",outline:"none",colorScheme:"inherit"}}/><span>/ {part.marks}</span></div></div>})}</div></div>)}</div><div style={{marginTop:18,padding:16,borderRadius:16,background:"rgba(108,76,255,.08)",border:"1px solid rgba(108,76,255,.2)"}}><div className="qMeta">READY TO REVIEW?</div><p style={{margin:"6px 0 12px"}}>{allFilled?"All marks are entered. Finish the review to save it to your history and see what to work on.":`Enter the remaining ${Math.max(0,totals.rows-totals.enteredRows)} mark box${totals.rows-totals.enteredRows===1?"":"es"} to unlock your review.`}</p><button onClick={finishReview} disabled={!allFilled} style={{border:0,borderRadius:11,padding:"11px 16px",fontWeight:850,cursor:allFilled?"pointer":"not-allowed",background:allFilled?"#6d4aff":"rgba(127,127,127,.22)",color:allFilled?"#fff":"inherit",opacity:allFilled?1:.65}}>✓ Finish review</button></div></>:tab==="focus"?<><div style={{padding:18,borderRadius:16,border:"1px solid var(--border,rgba(127,127,127,.2))",marginBottom:14}}><div className="qMeta">YOUR RESULT</div><div style={{display:"flex",alignItems:"baseline",gap:10,marginTop:4}}><strong style={{fontSize:38}}>{totals.percent}%</strong><span>{totals.got}/{totals.possible} marks</span></div><p style={{margin:"8px 0 0"}}>{redCount?`Start with the ${redCount} red item${redCount===1?"":"s"}.`:yellowCount?`No red items — focus on the ${yellowCount} yellow item${yellowCount===1?"":"s"}.`:"Everything is green. Great result."}</p></div><div style={{display:"grid",gridTemplateColumns:"minmax(0,.8fr) minmax(0,1.2fr)",gap:14}}><div style={{border:"1px solid var(--border,rgba(127,127,127,.2))",borderRadius:16,padding:16}}><div className="qMeta">PRIORITY TOPICS</div><h3 style={{margin:"5px 0 12px"}}>What to work on</h3>{!topicFocus.length?<p style={{margin:0}}>No weak topics from this paper 🎉</p>:<div style={{display:"grid",gap:9}}>{topicFocus.map(topic=><div key={topic.topic} style={{padding:"10px 11px",borderRadius:11,background:topic.red?"rgba(220,38,38,.10)":"rgba(234,179,8,.12)",border:`1px solid ${topic.red?"rgba(220,38,38,.28)":"rgba(234,179,8,.30)"}`}}><b>{topic.topic}</b><div className="qMeta" style={{marginTop:3}}>{topic.red?`${topic.red} red${topic.yellow?` · ${topic.yellow} yellow`:""}`:`${topic.yellow} yellow`}</div></div>)}</div>}</div><div style={{border:"1px solid var(--border,rgba(127,127,127,.2))",borderRadius:16,padding:16}}><div className="qMeta">QUESTIONS TO REVISIT</div><h3 style={{margin:"5px 0 12px"}}>Lowest-scoring parts first</h3>{!focusItems.length?<p style={{margin:0}}>Nothing below 75% on this paper.</p>:<div style={{display:"grid",gap:9}}>{focusItems.map((item,index)=>{const state=band(item.score,item.part.marks);return <div key={`${item.qi}-${item.part.key}-${index}`} style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",padding:"10px 11px",borderRadius:11,background:state.bg,border:`1px solid ${state.border}`}}><div><b>Q{item.qi+1} {item.part.label}</b><div className="qMeta" style={{marginTop:2}}>{item.question.summary}</div></div><strong>{item.score}/{item.part.marks}</strong></div>})}</div>}</div></div></>:<div><div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12,marginBottom:16}}><div style={{padding:15,borderRadius:14,border:"1px solid var(--border,rgba(127,127,127,.2))"}}><div className="qMeta">REVIEWS</div><strong style={{fontSize:27}}>{history.length}</strong></div><div style={{padding:15,borderRadius:14,border:"1px solid var(--border,rgba(127,127,127,.2))"}}><div className="qMeta">AVERAGE</div><strong style={{fontSize:27}}>{historyStats?`${historyStats.avg}%`:"—"}</strong></div><div style={{padding:15,borderRadius:14,border:"1px solid var(--border,rgba(127,127,127,.2))"}}><div className="qMeta">BEST</div><strong style={{fontSize:27}}>{historyStats?`${historyStats.best}%`:"—"}</strong></div></div>{historyStats&&historyStats.change!==null&&<div style={{marginBottom:14,padding:"11px 13px",borderRadius:12,background:historyStats.change>=0?"rgba(46,160,67,.10)":"rgba(234,179,8,.12)",border:"1px solid rgba(127,127,127,.18)"}}><b>{historyStats.change>=0?"↑":"↓"} {Math.abs(historyStats.change)} percentage point{Math.abs(historyStats.change)===1?"":"s"}</b> compared with your previous review.</div>}{!history.length?<div className="empty" style={{minHeight:220}}><div>↗</div><h3>No review history yet</h3><p>Finish this paper review and it will appear here automatically.</p></div>:<div style={{display:"grid",gap:10}}>{history.map((entry,index)=><div key={entry.id} style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:14,alignItems:"center",padding:"13px 14px",borderRadius:14,border:"1px solid var(--border,rgba(127,127,127,.2))",background:index===0?"rgba(108,76,255,.06)":"transparent"}}><div style={{width:54,height:54,borderRadius:13,display:"grid",placeItems:"center",background:entry.percent>=75?"rgba(46,160,67,.12)":entry.percent>=50?"rgba(234,179,8,.14)":"rgba(220,38,38,.11)",fontWeight:900}}>{entry.percent}%</div><div><b>{new Date(entry.savedAt).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}{index===0?" · Latest":""}</b><div className="qMeta" style={{marginTop:3}}>{entry.questionCount} questions · {entry.score}/{entry.possible} marks · {entry.red} red · {entry.yellow} yellow</div>{entry.topics?.length>0&&<div className="qMeta" style={{marginTop:4}}>Focus: {entry.topics.slice(0,3).map(t=>t.topic).join(" · ")}</div>}</div><strong>{entry.percent}%</strong></div>)}</div>}</div>}
    </div>
  </div>;
}
