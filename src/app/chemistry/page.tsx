"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { chemistrySections } from "@/lib/chemistrySpec";
import { chemistryQuestions, type ChemistryQuestion } from "@/lib/chemistryQuestions";
import { exportPaperToWord } from "@/lib/exportWord";
import type { Question } from "@/lib/questions";
import { supabase } from "@/lib/supabase";

function asExportQuestion(q: ChemistryQuestion): Question {
  return {
    id: q.id,
    year: q.year,
    session: q.session,
    paper: q.paper,
    questionNumber: q.questionNumber,
    marks: q.marks,
    topics: q.specTags,
    difficulty: "Medium",
    summary: q.summary,
  };
}

export default function ChemistryPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["1c"]);
  const [count, setCount] = useState(5);
  const [paper, setPaper] = useState<ChemistryQuestion[]>([]);
  const [mode, setMode] = useState<"generate" | "bank">("generate");
  const [query, setQuery] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace("/login"); return; }
      setEmail(data.session.user.email || "Account");
      const { data: profile } = await supabase.from("profiles").select("banned").eq("id", data.session.user.id).maybeSingle();
      if (profile?.banned) { router.replace("/banned"); return; }
      setReady(true);
    });
  }, [router]);

  const totalMarks = useMemo(() => paper.reduce((sum,q)=>sum+q.marks,0), [paper]);
  const filteredBank = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return chemistryQuestions.filter(q => {
      const topicMatch = !selectedTopics.length || q.specTags.some(tag => selectedTopics.includes(tag));
      const textMatch = !needle || `${q.summary} ${q.session} ${q.year} ${q.paper} q${q.questionNumber} ${q.specTags.join(" ")}`.toLowerCase().includes(needle);
      return topicMatch && textMatch;
    });
  }, [query, selectedTopics]);

  if (!ready) return <main className="authPage"><div className="authLogo"><span>✦</span> MagicQuestions Chemistry</div></main>;

  function toggleTopic(tag: string) {
    setSelectedTopics(current => current.includes(tag) ? current.filter(x=>x!==tag) : [...current, tag]);
  }

  function generate() {
    const candidates = chemistryQuestions.filter(q => !selectedTopics.length || q.specTags.some(tag => selectedTopics.includes(tag)));
    const shuffled = [...candidates].sort(() => Math.random() - .5);
    setPaper(shuffled.slice(0, Math.min(count, shuffled.length)));
  }

  function addQuestion(q: ChemistryQuestion) {
    setPaper(current => current.some(x=>x.id===q.id) ? current : [...current,q]);
  }

  function removeQuestion(id: string) {
    setPaper(current => current.filter(q=>q.id!==id));
  }

  function moveQuestion(index:number,direction:number) {
    setPaper(current => {
      const next=index+direction;
      if(next<0||next>=current.length) return current;
      const copy=[...current];
      [copy[index],copy[next]]=[copy[next],copy[index]];
      return copy;
    });
  }

  function swapQuestion(index:number) {
    const old=paper[index];
    if(!old) return;
    const used=new Set(paper.map(q=>q.id));
    const candidates=chemistryQuestions.filter(q=>!used.has(q.id)&&q.specTags.some(tag=>old.specTags.includes(tag)));
    if(!candidates.length){window.alert("No other Chemistry question for the same specification topic is available yet.");return;}
    setPaper(current=>current.map((q,i)=>i===index?candidates[0]:q));
  }

  async function downloadWord() {
    if(!paper.length) return;
    setExporting(true);
    try {
      await exportPaperToWord(paper.map(asExportQuestion), { subject: "Chemistry" });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not build the Chemistry Word paper.");
    } finally {
      setExporting(false);
    }
  }

  return <main>
    <header className="nav">
      <div className="brand"><span className="spark">✦</span> MagicQuestions <span className="ownerTag">Chemistry</span></div>
      <nav className="tabs"><button onClick={()=>router.push("/")}>Maths</button><button className="active">Chemistry</button></nav>
      <div style={{display:"flex",alignItems:"center",gap:8}}><div className="badge">{email}</div><button className="accountButton" onClick={()=>router.push("/")}>Back</button></div>
    </header>

    <section className="hero">
      <p className="eyebrow">EDEXCEL INTERNATIONAL GCSE CHEMISTRY 4CH1</p>
      <h1>Your topics. Your Chemistry paper.<br/><span>Generated in seconds.</span></h1>
      <p className="subtitle">Choose exact specification sections such as 1(c) Atomic structure, 2(d) Reactivity series or 3(a) Energetics, then build a formatted Word paper from the Chemistry question bank.</p>
    </section>

    <div style={{display:"flex",justifyContent:"center",margin:"-8px 0 24px"}}><nav className="tabs"><button className={mode==="generate"?"active":""} onClick={()=>setMode("generate")}>Generate</button><button className={mode==="bank"?"active":""} onClick={()=>setMode("bank")}>Question bank</button></nav></div>

    {mode==="generate" ? <section className="builder">
      <div className="panel controls">
        <div className="step"><span>1</span><div><b>Choose specification topics</b><small>{selectedTopics.length} selected</small></div></div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>{chemistrySections.map(section=><div key={section.number}><div className="qMeta" style={{marginBottom:8}}>{section.number}. {section.title}</div><div className="topics">{section.subtopics.map(sub=>{const tag=`${section.number}${sub.code}`;return <button key={tag} className={selectedTopics.includes(tag)?"topic selected":"topic"} onClick={()=>toggleTopic(tag)}>({sub.code}) {sub.title}</button>})}</div></div>)}</div>
        <div className="divider"/>
        <div className="step"><span>2</span><div><b>Paper settings</b><small>Choose how many questions</small></div></div>
        <div className="settingRow"><div className="counter"><button onClick={()=>setCount(Math.max(1,count-1))}>−</button><strong>{count}</strong><button onClick={()=>setCount(Math.min(16,count+1))}>+</button></div></div>
        <button className="generate" onClick={generate}>⚗ Generate Chemistry paper</button>
      </div>

      <div className="panel preview">
        <div className="previewHead"><div><p>YOUR CHEMISTRY PAPER</p><h2>{paper.length?`${paper.length} questions · ${totalMarks} marks`:"Ready when you are"}</h2></div><span>4CH1</span></div>
        {!paper.length?<div className="empty"><div>⚗</div><h3>Your Chemistry paper will appear here</h3><p>Pick specification topics, choose the number of questions, then generate.</p></div>:<><div className="editorHint"><span>✦</span><div><b>Edit before you export</b><small>Swap, reorder, or remove any Chemistry question.</small></div></div><div className="questionList">{paper.map((q,index)=><article className="question" key={`${q.id}-${index}`}><div className="qNumber">{index+1}</div><div className="qBody"><div className="qMeta">{q.session} {q.year} · Paper {q.paper} · Original Q{q.questionNumber}</div><h3>{q.summary}</h3><div className="tags">{q.specTags.map(tag=><span key={tag}>Spec {tag[0]}({tag.slice(1)})</span>)}</div><div className="questionTools"><button onClick={()=>moveQuestion(index,-1)} disabled={index===0}>↑ Up</button><button onClick={()=>moveQuestion(index,1)} disabled={index===paper.length-1}>↓ Down</button><button onClick={()=>swapQuestion(index)}>↻ Swap</button><button onClick={()=>removeQuestion(q.id)}>Remove</button></div></div><div className="marks">{q.marks}<small>marks</small></div></article>)}</div><div className="paperActions"><button onClick={generate}>↻ Regenerate all</button><button className="word" onClick={downloadWord} disabled={exporting}>{exporting?"Building Word…":"Download Word"}</button></div></>}
      </div>
    </section> : <section className="bank panel">
      <div className="bankTop"><div><p className="eyebrow">CHEMISTRY QUESTION BANK</p><h2>Browse all {chemistryQuestions.length} formatted questions</h2></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Chemistry questions…"/></div>
      <div style={{marginTop:18,display:"flex",flexDirection:"column",gap:12}}>{chemistrySections.map(section=><div key={section.number}><div className="qMeta" style={{marginBottom:6}}>{section.number}. {section.title}</div><div className="topics compact" style={{margin:0}}>{section.subtopics.map(sub=>{const tag=`${section.number}${sub.code}`;const n=chemistryQuestions.filter(q=>q.specTags.includes(tag)).length;return <button key={tag} className={selectedTopics.includes(tag)?"topic selected":"topic"} onClick={()=>toggleTopic(tag)}>({sub.code}) {sub.title} · {n}</button>})}</div></div>)}</div>
      <div className="bankResults" style={{marginTop:20}}>{filteredBank.map(q=><article className="bankCard" key={q.id}><div><div className="qMeta">{q.session} {q.year} · Paper {q.paper} · Q{q.questionNumber}</div><h3>{q.summary}</h3><div className="tags">{q.specTags.map(tag=><span key={tag}>Spec {tag[0]}({tag.slice(1)})</span>)}</div></div><div className="bankActions"><b>{q.marks} marks</b><button onClick={()=>addQuestion(q)}>+ Add</button></div></article>)}</div>
    </section>}
  </main>;
}
