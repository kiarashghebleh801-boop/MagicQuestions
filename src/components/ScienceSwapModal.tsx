"use client";

import { useEffect, useMemo, useState } from "react";
import type { Question } from "@/lib/questions";
import ScienceQuestionDetails from "@/components/ScienceQuestionDetails";

type Props = {
  subject: "Chemistry" | "Physics";
  current: Question;
  paper: Question[];
  questions: Question[];
  onClose: () => void;
  onChoose: (question: Question) => void;
  topicLabel?: (topic: string) => string;
};

export default function ScienceSwapModal({ subject, current, paper, questions, onClose, onChoose, topicLabel }: Props) {
  const [topic, setTopic] = useState(current.topics[0] || "");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const used = useMemo(() => new Set(paper.map(q => q.id)), [paper]);
  const candidates = useMemo(() => questions
    .filter(q => !used.has(q.id) && q.topics.includes(topic))
    .filter(q => !search.trim() || `${q.summary} ${q.session} ${q.year} ${q.paper} Q${q.questionNumber} ${q.topics.join(" ")}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => Math.abs(a.marks - current.marks) - Math.abs(b.marks - current.marks) || b.year - a.year),
    [questions, used, topic, search, current.marks]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => { setExpandedId(null); }, [topic, search]);

  return <div role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.78)",backdropFilter:"blur(7px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div role="dialog" aria-modal="true" aria-label={`Swap ${subject} question`}
      style={{width:"min(800px,96vw)",maxHeight:"88vh",display:"flex",flexDirection:"column",background:"#101010",border:"1px solid rgba(201,162,39,.38)",borderRadius:18,boxShadow:"0 28px 80px rgba(0,0,0,.62)",overflow:"hidden"}}>
      <div style={{padding:"18px 20px 14px",borderBottom:"1px solid rgba(255,255,255,.08)",display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start"}}>
        <div><div style={{fontSize:11,fontWeight:900,letterSpacing:".12em",color:"#d2ad36",marginBottom:5}}>SWAP {subject.toUpperCase()} QUESTION</div>
          <div style={{fontSize:18,fontWeight:850}}>Choose a replacement</div>
          <div style={{fontSize:12,color:"#989898",marginTop:5}}>Click a question to see its full original wording and diagrams before deciding.</div></div>
        <button aria-label="Close swap window" onClick={onClose} style={{border:"1px solid rgba(255,255,255,.12)",background:"#171717",color:"#ddd",borderRadius:9,width:34,height:34,fontSize:18,cursor:"pointer"}}>×</button>
      </div>
      <div style={{padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
        <div style={{fontSize:11,color:"#8f8f8f",marginBottom:7}}>Choose topic</div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:12}}>{current.topics.map(t => <button key={t} onClick={() => setTopic(t)} style={{border:`1px solid ${topic === t ? "#c9a227" : "rgba(255,255,255,.12)"}`,background:topic === t ? "rgba(201,162,39,.15)" : "#151515",color:topic === t ? "#f0d36a" : "#bbb",borderRadius:999,padding:"7px 10px",fontWeight:750,cursor:"pointer"}}>{topicLabel?.(t) || t}</button>)}</div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search year, paper, question or topic…" style={{width:"100%",boxSizing:"border-box",background:"#090909",border:"1px solid rgba(255,255,255,.13)",color:"#eee",borderRadius:10,padding:"11px 12px",outline:"none"}}/>
      </div>
      <div style={{padding:"10px 20px 18px",overflowY:"auto"}}>
        <div style={{fontSize:11,color:"#888",padding:"4px 0 9px"}}>{candidates.length} replacement{candidates.length === 1 ? "" : "s"} available for <b style={{color:"#d7ba55"}}>{topicLabel?.(topic) || topic}</b></div>
        {!candidates.length ? <div style={{padding:"28px 10px",textAlign:"center",color:"#888"}}>No other questions match this topic and search.</div> :
          candidates.map(q => {
            const expanded = expandedId === q.id;
            return <div key={q.id} style={{background:"#141414",border:`1px solid ${expanded ? "rgba(201,162,39,.36)" : "rgba(255,255,255,.08)"}`,borderRadius:12,padding:"13px 14px",marginBottom:8}}>
              <button onClick={() => setExpandedId(expanded ? null : q.id)} aria-expanded={expanded}
                style={{width:"100%",textAlign:"left",display:"grid",gridTemplateColumns:"1fr auto",gap:14,alignItems:"center",cursor:"pointer",background:"transparent",border:0,color:"inherit",padding:0}}>
                <div><div style={{fontSize:11,color:"#9a9a9a",marginBottom:4}}>{q.session} {q.year} · Paper {q.paper} · Q{q.questionNumber}</div>
                  <div style={{fontSize:13,fontWeight:760,color:"#eee",lineHeight:1.35}}>{q.summary}</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:7}}>{q.topics.map(t => <span key={t} style={{fontSize:10,color:t === topic ? "#edcf67" : "#aaa",border:"1px solid rgba(255,255,255,.09)",borderRadius:999,padding:"3px 6px"}}>{topicLabel?.(t) || t}</span>)}</div>
                </div>
                <div style={{textAlign:"right",minWidth:72}}><div style={{fontSize:18,fontWeight:900,color:"#d2ad36"}}>{q.marks}</div><div style={{fontSize:10,color:"#888"}}>marks</div><div style={{fontSize:10,color:"#cdb35b",marginTop:6}}>{expanded ? "Hide details ↑" : "View question ↓"}</div></div>
              </button>
              {expanded && <><ScienceQuestionDetails question={q}/>
                <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}><button onClick={() => onChoose(q)} style={{border:"1px solid #c9a227",background:"#c9a227",color:"#090909",fontWeight:900,borderRadius:9,padding:"9px 14px",cursor:"pointer"}}>Swap to this question →</button></div>
              </>}
            </div>;
          })}
      </div>
    </div>
  </div>;
}
