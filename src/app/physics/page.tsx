"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { physicsSections, physicsTopicTitle } from "@/lib/physicsSpec";
import { physicsQuestions } from "@/lib/physicsQuestions";
import type { Question } from "@/lib/questions";
import { supabase } from "@/lib/supabase";
import { exportPhysicsPaperToWord } from "@/lib/exportPhysicsWord";
import PaperReview from "@/components/PaperReview";
import PhysicsReviewTracker from "@/components/PhysicsReviewTracker";

export default function PhysicsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [trackerKey, setTrackerKey] = useState("mq-physics-tracker");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["1b"]);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [count, setCount] = useState(5);
  const [paper, setPaper] = useState<Question[]>([]);
  const [mode, setMode] = useState<"generate" | "bank" | "tracker">("generate");
  const [query, setQuery] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace("/login"); return; }
      setEmail(data.session.user.email || "Account");
      const key = `mq-physics-tracker-${data.session.user.id}`;
      setTrackerKey(key);
      try {
        const saved = JSON.parse(window.localStorage.getItem(key) || "[]");
        if (Array.isArray(saved)) setCompletedTopics(saved.filter(x => typeof x === "string"));
      } catch {}
      const { data: profile } = await supabase.from("profiles").select("banned").eq("id", data.session.user.id).maybeSingle();
      if (profile?.banned) { router.replace("/banned"); return; }
      await supabase.rpc("touch_last_seen");
      setReady(true);
    });
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(trackerKey, JSON.stringify(completedTopics));
  }, [completedTopics, ready, trackerKey]);

  const allSpecTopics = useMemo(() => physicsSections.flatMap(section => section.subtopics.map(sub => ({ tag: `${section.number}${sub.code}`, sectionNumber: section.number, sectionTitle: section.title, code: sub.code, title: sub.title }))), []);
  const trackerPercent = allSpecTopics.length ? Math.round((completedTopics.length / allSpecTopics.length) * 100) : 0;

  const matchingQuestions = useMemo(() => {
    if (!selectedTopics.length) return physicsQuestions;
    return physicsQuestions.filter(q => q.topics.some(tag => selectedTopics.includes(tag)));
  }, [selectedTopics]);

  const bankResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return matchingQuestions.filter(q => !needle || `${q.summary} ${q.session} ${q.year} ${q.paper} q${q.questionNumber} ${q.topics.map(t => physicsTopicTitle.get(t) || t).join(" ")}`.toLowerCase().includes(needle));
  }, [matchingQuestions, query]);

  const totalMarks = useMemo(() => paper.reduce((sum, q) => sum + q.marks, 0), [paper]);

  if (!ready) return <main className="authPage"><div className="authLogo"><span>✦</span> MagicQuestions Physics</div></main>;

  function toggleTopic(tag: string) {
    setSelectedTopics(current => current.includes(tag) ? current.filter(x => x !== tag) : [...current, tag]);
  }

  function toggleCompleted(tag: string) {
    setCompletedTopics(current => current.includes(tag) ? current.filter(x => x !== tag) : [...current, tag]);
  }

  function generate() {
    const shuffled = [...matchingQuestions].sort(() => Math.random() - .5);
    setPaper(shuffled.slice(0, Math.min(count, shuffled.length)));
  }

  function addQuestion(q: Question) {
    setPaper(current => current.some(x => x.id === q.id) ? current : [...current, q]);
  }

  function removeQuestion(id: string) {
    setPaper(current => current.filter(q => q.id !== id));
  }

  function moveQuestion(index: number, direction: number) {
    setPaper(current => {
      const next = index + direction;
      if (next < 0 || next >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  }

  function swapQuestion(index: number) {
    const old = paper[index];
    if (!old) return;
    const used = new Set(paper.map(q => q.id));
    const candidates = matchingQuestions.filter(q => !used.has(q.id) && q.topics.some(tag => old.topics.includes(tag)));
    if (!candidates.length) { window.alert("No other Physics question is available for this specification area yet."); return; }
    setPaper(current => current.map((q, i) => i === index ? candidates[Math.floor(Math.random() * candidates.length)] : q));
  }

  async function downloadWord() {
    if (!paper.length || exporting) return;
    setExporting(true);
    try {
      await exportPhysicsPaperToWord(paper);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not create the Physics Word paper.");
    } finally {
      setExporting(false);
    }
  }

  async function signOut() { await supabase.auth.signOut(); router.replace("/login"); }

  return <main>
    <header className="nav">
      <div className="brand"><span className="spark">✦</span> MagicQuestions <span className="ownerTag">Physics</span></div>
      <nav className="tabs">
        <button className={mode === "generate" ? "active" : ""} onClick={() => setMode("generate")}>Generate</button>
        <button className={mode === "bank" ? "active" : ""} onClick={() => setMode("bank")}>Question bank</button>
        <button className={mode === "tracker" ? "active" : ""} onClick={() => setMode("tracker")}>Tracker</button>
        <button onClick={() => router.push("/igcse")}>Subjects</button>
      </nav>
      <div style={{display:"flex",alignItems:"center",gap:8}}><div className="badge">{email}</div><button className="accountButton" onClick={signOut}>Log out</button></div>
    </header>

    <section className="hero">
      <p className="eyebrow">EDEXCEL INTERNATIONAL GCSE PHYSICS 4PH1</p>
      <h1>Your topics. Your Physics paper.<br/><span>Generated in seconds.</span></h1>
      <p className="subtitle">Choose from the official Physics specification areas. The repeated “Units” subtopics are intentionally hidden, as requested.</p>
    </section>

    {mode === "generate" ? <section className="builder">
      <div className="panel controls">
        <div className="step"><span>1</span><div><b>Choose specification topics</b><small>{selectedTopics.length} selected · Units excluded</small></div></div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {physicsSections.map(section => <div key={section.number}>
            <div className="qMeta" style={{marginBottom:8}}>{section.number}. {section.title}</div>
            <div className="topics">{section.subtopics.map(sub => { const tag = `${section.number}${sub.code}`; return <button key={tag} className={selectedTopics.includes(tag) ? "topic selected" : "topic"} onClick={() => toggleTopic(tag)}>({sub.code}) {sub.title}</button>; })}</div>
          </div>)}
        </div>
        <div className="divider"/>
        <div className="step"><span>2</span><div><b>Paper settings</b><small>Choose how many questions</small></div></div>
        <div className="settingRow"><div className="counter"><button onClick={() => setCount(Math.max(1, count - 1))}>−</button><strong>{count}</strong><button onClick={() => setCount(Math.min(20, count + 1))}>+</button></div></div>
        <button className="generate" onClick={generate}>✦ Generate Physics paper</button>
      </div>

      <div className="panel preview">
        <div className="previewHead"><div><p>YOUR PHYSICS PAPER</p><h2>{paper.length ? `${paper.length} questions · ${totalMarks} marks` : "Ready when you are"}</h2></div><span>4PH1</span></div>
        {!paper.length ? <div className="empty"><div>✦</div><h3>Your Physics paper will appear here</h3><p>Pick specification topics, choose the number of questions, then generate.</p></div> : <>
          <div className="editorHint"><span>✦</span><div><b>November 2025 bank connected</b><small>Questions are organised using the official 4PH1 specification subtopics, with Units excluded.</small></div></div>
          <div className="questionList">{paper.map((q, index) => <article className="question" key={`${q.id}-${index}`}>
            <div className="qNumber">{index + 1}</div>
            <div className="qBody"><div className="qMeta">{q.session} {q.year} · Paper {q.paper} · Original Q{q.questionNumber} · {q.difficulty}</div><h3>{q.summary}</h3><div className="tags">{q.topics.map(tag => <span key={tag}>Spec {tag[0]}({tag.slice(1)}) · {physicsTopicTitle.get(tag)}</span>)}</div><div className="questionTools"><button onClick={() => moveQuestion(index, -1)} disabled={index === 0}>↑ Up</button><button onClick={() => moveQuestion(index, 1)} disabled={index === paper.length - 1}>↓ Down</button><button onClick={() => swapQuestion(index)}>↻ Swap</button><button onClick={() => removeQuestion(q.id)}>Remove</button></div></div>
            <div className="marks">{q.marks}<small>marks</small></div>
          </article>)}</div>
          <div className="paperActions"><button onClick={generate}>↻ Regenerate all</button><button className="word" onClick={() => void downloadWord()} disabled={exporting}>{exporting ? "Creating Word…" : "↓ Download Word"}</button><button onClick={() => setReviewOpen(true)}>✓ Review paper</button></div>
          {reviewOpen && <PaperReview paper={paper} title="Physics paper review" onClose={() => setReviewOpen(false)}/>} 
        </>}
      </div>
    </section> : mode === "bank" ? <section className="bank panel">
      <div className="bankTop"><div><p className="eyebrow">PHYSICS QUESTION BANK</p><h2>Browse {bankResults.length} matching questions</h2></div><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Physics questions…"/></div>
      <div style={{marginTop:18,display:"flex",flexDirection:"column",gap:12}}>{physicsSections.map(section => <div key={section.number}><div className="qMeta" style={{marginBottom:6}}>{section.number}. {section.title}</div><div className="topics compact" style={{margin:0}}>{section.subtopics.map(sub => { const tag = `${section.number}${sub.code}`; const n = physicsQuestions.filter(q => q.topics.includes(tag)).length; return <button key={tag} className={selectedTopics.includes(tag) ? "topic selected" : "topic"} onClick={() => toggleTopic(tag)}>({sub.code}) {sub.title} · {n}</button>; })}</div></div>)}</div>
      <div className="bankResults" style={{marginTop:20}}>{bankResults.map(q => <article className="bankCard" key={q.id}><div><div className="qMeta">{q.session} {q.year} · Paper {q.paper} · Q{q.questionNumber}</div><h3>{q.summary}</h3><div className="tags">{q.topics.map(tag => <span key={tag}>Spec {tag[0]}({tag.slice(1)}) · {physicsTopicTitle.get(tag)}</span>)}</div></div><div className="bankActions"><b>{q.marks} marks</b><button onClick={() => addQuestion(q)}>+ Add</button></div></article>)}</div>
    </section> : <section className="bank panel" style={{maxWidth:1100,margin:"0 auto 48px"}}>
      <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:28,alignItems:"center",marginBottom:28}}>
        <div style={{width:180,height:180,borderRadius:"50%",display:"grid",placeItems:"center",background:`conic-gradient(var(--accent, #d4af37) ${trackerPercent}%, rgba(127,127,127,.18) 0)`,padding:14,margin:"0 auto"}}><div style={{width:"100%",height:"100%",borderRadius:"50%",background:"var(--panel, #11100d)",display:"grid",placeItems:"center",textAlign:"center"}}><div><strong style={{fontSize:38}}>{trackerPercent}%</strong><div className="qMeta">complete</div></div></div></div>
        <div><p className="eyebrow">PHYSICS SPECIFICATION TRACKER</p><h2 style={{margin:"4px 0 8px"}}>{completedTopics.length} of {allSpecTopics.length} topics completed</h2><p className="subtitle" style={{textAlign:"left",margin:"0 0 16px",maxWidth:650}}>Tick each Edexcel International GCSE Physics specification topic when you finish revising it. Your progress is saved on this device. Units are excluded.</p><div style={{height:16,borderRadius:999,background:"rgba(127,127,127,.18)",overflow:"hidden"}}><div style={{height:"100%",width:`${trackerPercent}%`,borderRadius:999,background:"var(--accent, #d4af37)",transition:"width .25s ease"}}/></div><div className="qMeta" style={{marginTop:8}}>{trackerPercent}% towards 100%</div></div>
      </div>

      <PhysicsReviewTracker/>

      <div style={{display:"flex",flexDirection:"column",gap:18}}>{physicsSections.map(section => {
        const sectionTags = section.subtopics.map(sub => `${section.number}${sub.code}`);
        const sectionDone = sectionTags.filter(tag => completedTopics.includes(tag)).length;
        const sectionPercent = Math.round((sectionDone / sectionTags.length) * 100);
        return <div key={section.number} style={{border:"1px solid var(--border, rgba(212,175,55,.22))",borderRadius:16,padding:18}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",marginBottom:12}}><div><div className="qMeta">SECTION {section.number}</div><h3 style={{margin:"2px 0"}}>{section.title}</h3></div><b>{sectionPercent}%</b></div>
          <div style={{height:8,borderRadius:999,background:"rgba(127,127,127,.16)",overflow:"hidden",marginBottom:14}}><div style={{height:"100%",width:`${sectionPercent}%`,background:"var(--accent, #d4af37)",borderRadius:999}}/></div>
          <div style={{display:"grid",gap:9}}>{section.subtopics.map(sub => {
            const tag = `${section.number}${sub.code}`;
            const done = completedTopics.includes(tag);
            return <label key={tag} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:12,cursor:"pointer",background:done?"rgba(212,175,55,.10)":"rgba(127,127,127,.06)"}}><input type="checkbox" checked={done} onChange={()=>toggleCompleted(tag)} style={{width:18,height:18}}/><span style={{textDecoration:done?"line-through":"none",opacity:done?.72:1}}><b>{section.number}({sub.code})</b> {sub.title}</span></label>;
          })}</div>
        </div>;
      })}</div>
    </section>}
  </main>;
}
