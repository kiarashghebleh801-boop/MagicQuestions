"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Difficulty, generateQuestions, Question, questions, searchQuestions, topics } from "@/lib/questionBank";
import { exportPaperToWord } from "@/lib/exportWord";
import { hasFormattedSource } from "@/lib/sourceDocs";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<string[]>(["Quadratics", "Algebra"]);
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty | "Mixed">("Mixed");
  const [paper, setPaper] = useState<Question[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"generate" | "bank">("generate");

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) router.replace("/login");
      else {
        setEmail(data.session.user.email || "Account");
        setReady(true);
      }
    });
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
      else {
        setEmail(session.user.email || "Account");
        setReady(true);
      }
    });
    return () => { active = false; auth.subscription.unsubscribe(); };
  }, [router]);

  const formattedQuestions = useMemo(() => questions.filter(hasFormattedSource), []);
  const totalMarks = useMemo(() => paper.reduce((sum, q) => sum + q.marks, 0), [paper]);
  const results = useMemo(() => searchQuestions(query, selected).filter(hasFormattedSource), [query, selected]);

  if (!ready) return <main className="authPage"><div className="authLogo"><span>✦</span> MagicQuestions</div></main>;

  function toggleTopic(topic: string) {
    setSelected(current => current.includes(topic) ? current.filter(item => item !== topic) : [...current, topic]);
  }

  function generate() {
    const ranked = generateQuestions(selected, questions.length, difficulty).filter(hasFormattedSource);
    setPaper(ranked.slice(0, count));
  }

  function addQuestion(q: Question) {
    setPaper(current => current.some(item => item.id === q.id) ? current : [...current, q]);
  }

  function removeQuestion(id: string) {
    setPaper(current => current.filter(q => q.id !== id));
  }

  function moveQuestion(index: number, direction: number) {
    setPaper(current => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const copy = current.slice();
      const temp = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = temp;
      return copy;
    });
  }

  function swapQuestion(index: number) {
    const old = paper[index];
    if (!old) return;

    const usedIds = new Set(paper.map(q => q.id));
    const candidates = formattedQuestions.filter(candidate => {
      if (usedIds.has(candidate.id)) return false;
      return candidate.topics.some(topic => old.topics.includes(topic));
    });

    if (!candidates.length) {
      window.alert("No other formatted question for the same topic is available yet.");
      return;
    }

    candidates.sort((a, b) => {
      const aOverlap = a.topics.filter(t => old.topics.includes(t)).length;
      const bOverlap = b.topics.filter(t => old.topics.includes(t)).length;
      const aScore = aOverlap * 10 + (a.difficulty === old.difficulty ? 3 : 0) - Math.abs(a.marks - old.marks);
      const bScore = bOverlap * 10 + (b.difficulty === old.difficulty ? 3 : 0) - Math.abs(b.marks - old.marks);
      return bScore - aScore;
    });

    setPaper(current => current.map((q, i) => i === index ? candidates[0] : q));
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <main>
      <header className="nav">
        <div className="brand"><span className="spark">✦</span> MagicQuestions</div>
        <nav className="tabs">
          <button className={mode === "generate" ? "active" : ""} onClick={() => setMode("generate")}>Generate</button>
          <button className={mode === "bank" ? "active" : ""} onClick={() => setMode("bank")}>Question bank</button>
        </nav>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div className="badge">{email}</div>
          <button className="accountButton" onClick={signOut}>Log out</button>
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">PAST PAPERS, BUILT AROUND YOU</p>
        <h1>Your topics. Your paper.<br /><span>Generated in seconds.</span></h1>
        <p className="subtitle">Choose exactly what you want to practise. MagicQuestions selects matching Higher-tier questions from the formatted Word question bank.</p>
      </section>

      {mode === "generate" ? (
        <section className="builder">
          <div className="panel controls">
            <div className="step"><span>1</span><div><b>Choose your topics</b><small>{selected.length} selected</small></div></div>
            <div className="topics">
              {topics.map(topic => (
                <button key={topic} className={selected.includes(topic) ? "topic selected" : "topic"} onClick={() => toggleTopic(topic)}>
                  {selected.includes(topic) ? "✓ " : "+ "}{topic}
                </button>
              ))}
            </div>
            <div className="divider" />
            <div className="step"><span>2</span><div><b>Paper settings</b><small>Choose length and difficulty</small></div></div>
            <div className="settingRow">
              <div className="counter"><button onClick={() => setCount(Math.max(1,count-1))}>−</button><strong>{count}</strong><button onClick={() => setCount(Math.min(25,count+1))}>+</button></div>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty | "Mixed")}>
                <option>Mixed</option><option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
            <button className="generate" onClick={generate}>✦ Generate my paper</button>
          </div>

          <PaperPreview
            paper={paper}
            totalMarks={totalMarks}
            removeQuestion={removeQuestion}
            regenerate={generate}
            swapQuestion={swapQuestion}
            moveQuestion={moveQuestion}
          />
        </section>
      ) : (
        <section className="bank panel">
          <div className="bankTop">
            <div><p className="eyebrow">QUESTION BANK</p><h2>Browse all {formattedQuestions.length} formatted questions</h2></div>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search topics, year, paper…" />
          </div>
          <div className="topics compact">
            {topics.map(topic => <button key={topic} className={selected.includes(topic) ? "topic selected" : "topic"} onClick={() => toggleTopic(topic)}>{topic}</button>)}
          </div>
          <div className="bankResults">
            {results.map(q => (
              <article className="bankCard" key={q.id}>
                <div>
                  <div className="qMeta">{q.session} {q.year} · {q.paper} · Q{q.questionNumber} · {q.difficulty}</div>
                  <h3>{q.summary}</h3>
                  <div className="tags">{q.topics.map(t => <span key={t}>{t}</span>)}</div>
                </div>
                <div className="bankActions"><b>{q.marks} marks</b><button onClick={() => addQuestion(q)}>+ Add</button></div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

type PaperPreviewProps = {
  paper: Question[];
  totalMarks: number;
  removeQuestion: (id: string) => void;
  regenerate: () => void;
  swapQuestion: (index: number) => void;
  moveQuestion: (index: number, direction: number) => void;
};

function PaperPreview({ paper, totalMarks, removeQuestion, regenerate, swapQuestion, moveQuestion }: PaperPreviewProps) {
  const [exporting, setExporting] = useState(false);

  async function downloadWord() {
    setExporting(true);
    try {
      await exportPaperToWord(paper);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not build the Word paper.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="panel preview">
      <div className="previewHead">
        <div><p>YOUR PAPER</p><h2>{paper.length ? `${paper.length} questions · ${totalMarks} marks` : "Ready when you are"}</h2></div>
        <span>Higher</span>
      </div>

      {!paper.length ? (
        <div className="empty"><div>✦</div><h3>Your custom paper will appear here</h3><p>Pick topics and settings, then generate a balanced selection.</p></div>
      ) : (
        <>
          <div style={{margin:"14px 0",padding:"12px 14px",background:"#f6f3ff",borderRadius:12,color:"#5c3de1",fontSize:13,fontWeight:700}}>
            Edit your paper before downloading — swap, reorder, or remove any question.
          </div>

          <div className="questionList">
            {paper.map((q,index) => (
              <article className="question" key={`${q.id}-${index}`}>
                <div className="qNumber">{index+1}</div>
                <div className="qBody">
                  <div className="qMeta">{q.session} {q.year} · Paper {q.paper} · Original Q{q.questionNumber} · {q.difficulty}</div>
                  <h3>{q.summary}</h3>
                  <div className="tags">{q.topics.map(t => <span key={t}>{t}</span>)}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
                    <button onClick={() => moveQuestion(index,-1)} disabled={index===0}>↑ Up</button>
                    <button onClick={() => moveQuestion(index,1)} disabled={index===paper.length-1}>↓ Down</button>
                    <button onClick={() => swapQuestion(index)}>↻ Swap</button>
                    <button onClick={() => removeQuestion(q.id)}>Remove</button>
                  </div>
                </div>
                <div className="marks">{q.marks}<small>marks</small></div>
              </article>
            ))}
          </div>

          <div className="paperActions">
            <button onClick={regenerate}>↻ Regenerate all</button>
            <button className="word" onClick={downloadWord} disabled={exporting}>{exporting ? "Building Word…" : "Download Word"}</button>
            <button className="print" onClick={() => window.print()}>Print / Save PDF</button>
          </div>
        </>
      )}
    </div>
  );
}
