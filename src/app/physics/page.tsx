"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { physicsSections, physicsTopicTitle } from "@/lib/physicsSpec";
import { physicsQuestions } from "@/lib/physicsQuestions";
import type { Question } from "@/lib/questions";
import { supabase } from "@/lib/supabase";
import PaperReview from "@/components/PaperReview";

export default function PhysicsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["1b"]);
  const [count, setCount] = useState(5);
  const [paper, setPaper] = useState<Question[]>([]);
  const [mode, setMode] = useState<"generate" | "bank">("generate");
  const [query, setQuery] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace("/login"); return; }
      setEmail(data.session.user.email || "Account");
      const { data: profile } = await supabase.from("profiles").select("banned").eq("id", data.session.user.id).maybeSingle();
      if (profile?.banned) { router.replace("/banned"); return; }
      await supabase.rpc("touch_last_seen");
      setReady(true);
    });
  }, [router]);

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

  async function signOut() { await supabase.auth.signOut(); router.replace("/login"); }

  return <main>
    <header className="nav">
      <div className="brand"><span className="spark">✦</span> MagicQuestions <span className="ownerTag">Physics</span></div>
      <nav className="tabs">
        <button className={mode === "generate" ? "active" : ""} onClick={() => setMode("generate")}>Generate</button>
        <button className={mode === "bank" ? "active" : ""} onClick={() => setMode("bank")}>Question bank</button>
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
          <div className="paperActions"><button onClick={generate}>↻ Regenerate all</button><button onClick={() => setReviewOpen(true)}>✓ Review paper</button></div>
          {reviewOpen && <PaperReview paper={paper} title="Physics paper review" onClose={() => setReviewOpen(false)}/>} 
        </>}
      </div>
    </section> : <section className="bank panel">
      <div className="bankTop"><div><p className="eyebrow">PHYSICS QUESTION BANK</p><h2>Browse {bankResults.length} matching questions</h2></div><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Physics questions…"/></div>
      <div style={{marginTop:18,display:"flex",flexDirection:"column",gap:12}}>{physicsSections.map(section => <div key={section.number}><div className="qMeta" style={{marginBottom:6}}>{section.number}. {section.title}</div><div className="topics compact" style={{margin:0}}>{section.subtopics.map(sub => { const tag = `${section.number}${sub.code}`; const n = physicsQuestions.filter(q => q.topics.includes(tag)).length; return <button key={tag} className={selectedTopics.includes(tag) ? "topic selected" : "topic"} onClick={() => toggleTopic(tag)}>({sub.code}) {sub.title} · {n}</button>; })}</div></div>)}</div>
      <div className="bankResults" style={{marginTop:20}}>{bankResults.map(q => <article className="bankCard" key={q.id}><div><div className="qMeta">{q.session} {q.year} · Paper {q.paper} · Q{q.questionNumber}</div><h3>{q.summary}</h3><div className="tags">{q.topics.map(tag => <span key={tag}>Spec {tag[0]}({tag.slice(1)}) · {physicsTopicTitle.get(tag)}</span>)}</div></div><div className="bankActions"><b>{q.marks} marks</b><button onClick={() => addQuestion(q)}>+ Add</button></div></article>)}</div>
    </section>}
  </main>;
}
