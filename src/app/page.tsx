"use client";

import { useMemo, useState } from "react";
import { Difficulty, generateQuestions, Question, questions, searchQuestions, topics } from "@/lib/questions";
import { exportPaperToWord } from "@/lib/exportWord";

export default function Home() {
  const [selected, setSelected] = useState<string[]>(["Quadratics", "Algebra"]);
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty | "Mixed">("Mixed");
  const [paper, setPaper] = useState<Question[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"generate" | "bank">("generate");

  const totalMarks = useMemo(() => paper.reduce((sum, q) => sum + q.marks, 0), [paper]);
  const results = useMemo(() => searchQuestions(query, selected), [query, selected]);

  function toggleTopic(topic: string) {
    setSelected(current => current.includes(topic) ? current.filter(item => item !== topic) : [...current, topic]);
  }
  function generate() { setPaper(generateQuestions(selected, count, difficulty)); }
  function addQuestion(q: Question) { setPaper(current => current.some(item => item.id === q.id) ? current : [...current, q]); }
  function removeQuestion(id: string) { setPaper(current => current.filter(q => q.id !== id)); }

  return (
    <main>
      <header className="nav">
        <div className="brand"><span className="spark">✦</span> MagicQuestions</div>
        <nav className="tabs"><button className={mode === "generate" ? "active" : ""} onClick={() => setMode("generate")}>Generate</button><button className={mode === "bank" ? "active" : ""} onClick={() => setMode("bank")}>Question bank</button></nav>
        <div className="badge">{questions.length} questions · Edexcel IGCSE Maths A</div>
      </header>

      <section className="hero">
        <p className="eyebrow">PAST PAPERS, BUILT AROUND YOU</p>
        <h1>Your topics. Your paper.<br /><span>Generated in seconds.</span></h1>
        <p className="subtitle">Choose exactly what you want to practise. MagicQuestions selects matching Higher-tier questions from the imported past-paper bank.</p>
      </section>

      {mode === "generate" ? <section className="builder">
        <div className="panel controls">
          <div className="step"><span>1</span><div><b>Choose your topics</b><small>{selected.length} selected</small></div></div>
          <div className="topics">{topics.map(topic => <button key={topic} className={selected.includes(topic) ? "topic selected" : "topic"} onClick={() => toggleTopic(topic)}>{selected.includes(topic) ? "✓ " : "+ "}{topic}</button>)}</div>
          <div className="divider" />
          <div className="step"><span>2</span><div><b>Paper settings</b><small>Choose length and difficulty</small></div></div>
          <div className="settingRow"><div className="counter"><button onClick={() => setCount(Math.max(1,count-1))}>−</button><strong>{count}</strong><button onClick={() => setCount(Math.min(25,count+1))}>+</button></div><select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty | "Mixed")}><option>Mixed</option><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
          <button className="generate" onClick={generate}>✦ Generate my paper</button>
        </div>
        <PaperPreview paper={paper} totalMarks={totalMarks} removeQuestion={removeQuestion} regenerate={generate} />
      </section> : <section className="bank panel">
        <div className="bankTop"><div><p className="eyebrow">QUESTION BANK</p><h2>Browse all {questions.length} questions</h2></div><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search topics, year, paper…" /></div>
        <div className="topics compact">{topics.map(topic => <button key={topic} className={selected.includes(topic) ? "topic selected" : "topic"} onClick={() => toggleTopic(topic)}>{topic}</button>)}</div>
        <div className="bankResults">{results.map(q => <article className="bankCard" key={q.id}><div><div className="qMeta">{q.session} {q.year} · {q.paper} · Q{q.questionNumber} · {q.difficulty}</div><h3>{q.summary}</h3><div className="tags">{q.topics.map(t => <span key={t}>{t}</span>)}</div></div><div className="bankActions"><b>{q.marks} marks</b><button onClick={() => addQuestion(q)}>+ Add</button></div></article>)}</div>
      </section>}
    </main>
  );
}

function PaperPreview({paper,totalMarks,removeQuestion,regenerate}:{paper:Question[];totalMarks:number;removeQuestion:(id:string)=>void;regenerate:()=>void}) {
  const [exporting, setExporting] = useState(false);

  async function downloadWord() {
    setExporting(true);
    try {
      await exportPaperToWord(paper);
    } finally {
      setExporting(false);
    }
  }

  return <div className="panel preview">
    <div className="previewHead"><div><p>YOUR PAPER</p><h2>{paper.length ? `${paper.length} questions · ${totalMarks} marks` : "Ready when you are"}</h2></div><span>Higher</span></div>
    {!paper.length ? <div className="empty"><div>✦</div><h3>Your custom paper will appear here</h3><p>Pick topics and settings, then generate a balanced selection.</p></div> : <><div className="questionList">{paper.map((q,index) => <article className="question" key={q.id}><div className="qNumber">{index+1}</div><div className="qBody"><div className="qMeta">{q.session} {q.year} · Paper {q.paper} · Original Q{q.questionNumber} · {q.difficulty}</div><h3>{q.summary}</h3><div className="tags">{q.topics.map(t => <span key={t}>{t}</span>)}</div></div><div className="marks">{q.marks}<small>marks</small><button className="remove" onClick={() => removeQuestion(q.id)}>×</button></div></article>)}</div><div className="paperActions"><button onClick={regenerate}>↻ Regenerate</button><button className="word" onClick={downloadWord} disabled={exporting}>{exporting ? "Building Word…" : "Download Word"}</button><button className="print" onClick={() => window.print()}>Print / Save PDF</button></div></>}
  </div>;
}
