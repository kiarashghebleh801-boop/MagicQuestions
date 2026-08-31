"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { chemistrySections } from "@/lib/chemistrySpec";
import { chemistryQuestions, type ChemistryQuestion } from "@/lib/chemistryQuestions";
import { specialiseChemistryQuestion, type ChemistryQuestionSelection } from "@/lib/chemistryParts";
import { exportPaperToWord } from "@/lib/exportWord";
import type { Question } from "@/lib/questions";
import { supabase } from "@/lib/supabase";

type PartialExportQuestion = Question & { selectedParts?: string[] };

function asExportQuestion(q: ChemistryQuestionSelection): PartialExportQuestion {
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
    selectedParts: q.selectedParts,
  };
}

export default function ChemistryPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [trackerKey, setTrackerKey] = useState("mq-chemistry-tracker");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["1c"]);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [count, setCount] = useState(5);
  const [paper, setPaper] = useState<ChemistryQuestionSelection[]>([]);
  const [mode, setMode] = useState<"generate" | "bank" | "tracker">("generate");
  const [query, setQuery] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace("/login"); return; }
      setEmail(data.session.user.email || "Account");
      const key = `mq-chemistry-tracker-${data.session.user.id}`;
      setTrackerKey(key);
      try {
        const saved = JSON.parse(window.localStorage.getItem(key) || "[]");
        if (Array.isArray(saved)) setCompletedTopics(saved.filter(x => typeof x === "string"));
      } catch {}
      const { data: profile } = await supabase.from("profiles").select("banned").eq("id", data.session.user.id).maybeSingle();
      if (profile?.banned) { router.replace("/banned"); return; }
      setReady(true);
    });
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(trackerKey, JSON.stringify(completedTopics));
  }, [completedTopics, ready, trackerKey]);

  const allSpecTopics = useMemo(() => chemistrySections.flatMap(section => section.subtopics.map(sub => ({
    tag: `${section.number}${sub.code}`,
    sectionNumber: section.number,
    sectionTitle: section.title,
    code: sub.code,
    title: sub.title,
  }))), []);
  const trackerPercent = allSpecTopics.length ? Math.round((completedTopics.length / allSpecTopics.length) * 100) : 0;
  const totalMarks = useMemo(() => paper.reduce((sum,q)=>sum+q.marks,0), [paper]);
  const topicSpecificQuestions = useMemo(() => chemistryQuestions.map(q => specialiseChemistryQuestion(q, selectedTopics)).filter((q): q is ChemistryQuestionSelection => q !== null), [selectedTopics]);
  const filteredBank = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return topicSpecificQuestions.filter(q => !needle || `${q.summary} ${q.session} ${q.year} ${q.paper} q${q.questionNumber} ${q.specTags.join(" ")}`.toLowerCase().includes(needle));
  }, [query, topicSpecificQuestions]);

  if (!ready) return <main className="authPage"><div className="authLogo"><span>✦</span> MagicQuestions Chemistry</div></main>;

  function toggleTopic(tag: string) {
    setSelectedTopics(current => current.includes(tag) ? current.filter(x=>x!==tag) : [...current, tag]);
  }

  function toggleCompleted(tag: string) {
    setCompletedTopics(current => current.includes(tag) ? current.filter(x => x !== tag) : [...current, tag]);
  }

  function generate() {
    const shuffled = [...topicSpecificQuestions].sort(() => Math.random() - .5);
    setPaper(shuffled.slice(0, Math.min(count, shuffled.length)));
  }

  function addQuestion(q: ChemistryQuestion) {
    const specialised = specialiseChemistryQuestion(q, selectedTopics);
    if (!specialised) { window.alert("That question contains material outside the selected specification topic(s)."); return; }
    setPaper(current => current.some(x=>x.id===specialised.id) ? current : [...current,specialised]);
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
    const candidates=topicSpecificQuestions.filter(q=>!used.has(q.id)&&q.specTags.some(tag=>old.specTags.includes(tag)));
    if(!candidates.length){window.alert("No other topic-specific Chemistry question is available yet.");return;}
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
      <p className="subtitle">Choose exact specification sections. MagicQuestions now keeps only the parts of each question that test the topic(s) you selected, removes unrelated parts, and renumbers the remaining parts from (a).</p>
    </section>

    <div style={{display:"flex",justifyContent:"center",margin:"-8px 0 24px"}}><nav className="tabs"><button className={mode==="generate"?"active":""} onClick={()=>setMode("generate")}>Generate</button><button className={mode==="bank"?"active":""} onClick={()=>setMode("bank")}>Question bank</button><button className={mode==="tracker"?"active":""} onClick={()=>setMode("tracker")}>Tracker</button></nav></div>

    {mode==="generate" ? <section className="builder">
      <div className="panel controls">
        <div className="step"><span>1</span><div><b>Choose specification topics</b><small>{selectedTopics.length} selected · topic-specific parts only</small></div></div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>{chemistrySections.map(section=><div key={section.number}><div className="qMeta" style={{marginBottom:8}}>{section.number}. {section.title}</div><div className="topics">{section.subtopics.map(sub=>{const tag=`${section.number}${sub.code}`;return <button key={tag} className={selectedTopics.includes(tag)?"topic selected":"topic"} onClick={()=>toggleTopic(tag)}>({sub.code}) {sub.title}</button>})}</div></div>)}</div>
        <div className="divider"/>
        <div className="step"><span>2</span><div><b>Paper settings</b><small>Choose how many questions</small></div></div>
        <div className="settingRow"><div className="counter"><button onClick={()=>setCount(Math.max(1,count-1))}>−</button><strong>{count}</strong><button onClick={()=>setCount(Math.min(16,count+1))}>+</button></div></div>
        <button className="generate" onClick={generate}>⚗ Generate Chemistry paper</button>
      </div>

      <div className="panel preview">
        <div className="previewHead"><div><p>YOUR CHEMISTRY PAPER</p><h2>{paper.length?`${paper.length} questions · ${totalMarks} marks`:"Ready when you are"}</h2></div><span>4CH1</span></div>
        {!paper.length?<div className="empty"><div>⚗</div><h3>Your Chemistry paper will appear here</h3><p>Pick specification topics, choose the number of questions, then generate.</p></div>:<><div className="editorHint"><span>✦</span><div><b>Topic-specific extraction is on</b><small>Unrelated subparts are removed. If original parts (c) and (d) are kept, they export as (a) and (b).</small></div></div><div className="questionList">{paper.map((q,index)=><article className="question" key={`${q.id}-${index}`}><div className="qNumber">{index+1}</div><div className="qBody"><div className="qMeta">{q.session} {q.year} · Paper {q.paper} · Original Q{q.questionNumber}{q.selectedParts?.length?` · Parts ${q.selectedParts.map(p=>`(${p})`).join(", ")}`:""}</div><h3>{q.summary}</h3><div className="tags">{q.specTags.map(tag=><span key={tag}>Spec {tag[0]}({tag.slice(1)})</span>)}</div><div className="questionTools"><button onClick={()=>moveQuestion(index,-1)} disabled={index===0}>↑ Up</button><button onClick={()=>moveQuestion(index,1)} disabled={index===paper.length-1}>↓ Down</button><button onClick={()=>swapQuestion(index)}>↻ Swap</button><button onClick={()=>removeQuestion(q.id)}>Remove</button></div></div><div className="marks">{q.marks}<small>marks</small></div></article>)}</div><div className="paperActions"><button onClick={generate}>↻ Regenerate all</button><button className="word" onClick={downloadWord} disabled={exporting}>{exporting?"Building Word…":"Download Word"}</button></div></>}
      </div>
    </section> : mode==="bank" ? <section className="bank panel">
      <div className="bankTop"><div><p className="eyebrow">CHEMISTRY QUESTION BANK</p><h2>{selectedTopics.length ? `Browse ${filteredBank.length} topic-specific question selections` : `Browse all ${chemistryQuestions.length} formatted questions`}</h2></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Chemistry questions…"/></div>
      <div style={{marginTop:18,display:"flex",flexDirection:"column",gap:12}}>{chemistrySections.map(section=><div key={section.number}><div className="qMeta" style={{marginBottom:6}}>{section.number}. {section.title}</div><div className="topics compact" style={{margin:0}}>{section.subtopics.map(sub=>{const tag=`${section.number}${sub.code}`;const n=chemistryQuestions.map(q=>specialiseChemistryQuestion(q,[tag])).filter(Boolean).length;return <button key={tag} className={selectedTopics.includes(tag)?"topic selected":"topic"} onClick={()=>toggleTopic(tag)}>({sub.code}) {sub.title} · {n}</button>})}</div></div>)}</div>
      <div className="bankResults" style={{marginTop:20}}>{filteredBank.map(q=><article className="bankCard" key={q.id}><div><div className="qMeta">{q.session} {q.year} · Paper {q.paper} · Q{q.questionNumber}{q.selectedParts?.length?` · ${q.selectedParts.map(p=>`(${p})`).join(", ")}`:""}</div><h3>{q.summary}</h3><div className="tags">{q.specTags.map(tag=><span key={tag}>Spec {tag[0]}({tag.slice(1)})</span>)}</div></div><div className="bankActions"><b>{q.marks} marks</b><button onClick={()=>setPaper(current => current.some(x=>x.id===q.id) ? current : [...current,q])}>+ Add</button></div></article>)}</div>
    </section> : <section className="bank panel" style={{maxWidth:1100,margin:"0 auto 48px"}}>
      <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:28,alignItems:"center",marginBottom:28}}>
        <div style={{width:180,height:180,borderRadius:"50%",display:"grid",placeItems:"center",background:`conic-gradient(var(--accent, #6c4cff) ${trackerPercent}%, rgba(127,127,127,.18) 0)`,padding:14,margin:"0 auto"}}>
          <div style={{width:"100%",height:"100%",borderRadius:"50%",background:"var(--panel, #fff)",display:"grid",placeItems:"center",textAlign:"center"}}><div><strong style={{fontSize:38}}>{trackerPercent}%</strong><div className="qMeta">complete</div></div></div>
        </div>
        <div><p className="eyebrow">CHEMISTRY SPECIFICATION TRACKER</p><h2 style={{margin:"4px 0 8px"}}>{completedTopics.length} of {allSpecTopics.length} topics completed</h2><p className="subtitle" style={{textAlign:"left",margin:"0 0 16px",maxWidth:650}}>Tick each Edexcel IGCSE Chemistry specification topic when you finish revising it. Your progress is saved on this device.</p><div style={{height:16,borderRadius:999,background:"rgba(127,127,127,.18)",overflow:"hidden"}}><div style={{height:"100%",width:`${trackerPercent}%`,borderRadius:999,background:"var(--accent, #6c4cff)",transition:"width .25s ease"}}/></div><div className="qMeta" style={{marginTop:8}}>{trackerPercent}% towards 100%</div></div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:18}}>{chemistrySections.map(section => {
        const sectionTags = section.subtopics.map(sub => `${section.number}${sub.code}`);
        const sectionDone = sectionTags.filter(tag => completedTopics.includes(tag)).length;
        const sectionPercent = Math.round((sectionDone / sectionTags.length) * 100);
        return <div key={section.number} style={{border:"1px solid var(--border, rgba(127,127,127,.2))",borderRadius:16,padding:18}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",marginBottom:12}}><div><div className="qMeta">SECTION {section.number}</div><h3 style={{margin:"2px 0"}}>{section.title}</h3></div><b>{sectionPercent}%</b></div>
          <div style={{height:8,borderRadius:999,background:"rgba(127,127,127,.16)",overflow:"hidden",marginBottom:14}}><div style={{height:"100%",width:`${sectionPercent}%`,background:"var(--accent, #6c4cff)",borderRadius:999}}/></div>
          <div style={{display:"grid",gap:9}}>{section.subtopics.map(sub => { const tag = `${section.number}${sub.code}`; const done = completedTopics.includes(tag); return <label key={tag} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:12,cursor:"pointer",background:done?"rgba(108,76,255,.10)":"rgba(127,127,127,.06)"}}><input type="checkbox" checked={done} onChange={()=>toggleCompleted(tag)} style={{width:18,height:18}}/><span style={{textDecoration:done?"line-through":"none",opacity:done?.7:1}}><b>{section.number}({sub.code})</b> {sub.title}</span></label> })}</div>
        </div>
      })}</div>
    </section>}
  </main>;
}
