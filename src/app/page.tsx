"use client";

import { useMemo, useState } from "react";
import { generateQuestions, Question, topics } from "@/lib/questions";

export default function Home() {
  const [selected, setSelected] = useState<string[]>(["Quadratics", "Algebra"]);
  const [count, setCount] = useState(5);
  const [paper, setPaper] = useState<Question[]>([]);

  const totalMarks = useMemo(() => paper.reduce((sum, q) => sum + q.marks, 0), [paper]);

  function toggleTopic(topic: string) {
    setSelected((current) => current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]);
  }

  function generate() {
    setPaper(generateQuestions(selected, count));
  }

  return (
    <main>
      <header className="nav">
        <div className="brand"><span className="spark">✦</span> MagicQuestions</div>
        <div className="badge">MVP · Edexcel IGCSE Maths A</div>
      </header>

      <section className="hero">
        <p className="eyebrow">PAST PAPERS, BUILT AROUND YOU</p>
        <h1>Your topics. Your paper.<br /><span>Generated in seconds.</span></h1>
        <p className="subtitle">Choose exactly what you want to practise. MagicQuestions finds matching Higher-tier past-paper questions and builds a focused paper.</p>
      </section>

      <section className="builder">
        <div className="panel controls">
          <div className="step"><span>1</span><div><b>Choose your topics</b><small>Select one or more areas to practise</small></div></div>
          <div className="topics">
            {topics.map((topic) => (
              <button key={topic} className={selected.includes(topic) ? "topic selected" : "topic"} onClick={() => toggleTopic(topic)}>
                {selected.includes(topic) ? "✓ " : "+ "}{topic}
              </button>
            ))}
          </div>

          <div className="divider" />
          <div className="step"><span>2</span><div><b>Number of questions</b><small>How long should the practice paper be?</small></div></div>
          <div className="counter">
            <button onClick={() => setCount(Math.max(1, count - 1))}>−</button>
            <strong>{count}</strong>
            <button onClick={() => setCount(Math.min(20, count + 1))}>+</button>
          </div>

          <button className="generate" onClick={generate}>✦ Generate my paper</button>
        </div>

        <div className="panel preview">
          <div className="previewHead"><div><p>YOUR PAPER</p><h2>{paper.length ? `${paper.length} questions · ${totalMarks} marks` : "Ready when you are"}</h2></div><span>Higher</span></div>
          {!paper.length ? (
            <div className="empty"><div>✦</div><h3>Your custom paper will appear here</h3><p>Pick some topics, choose the number of questions, then hit Generate.</p></div>
          ) : (
            <div className="questionList">
              {paper.map((q, index) => (
                <article className="question" key={q.id}>
                  <div className="qNumber">{index + 1}</div>
                  <div className="qBody">
                    <div className="qMeta">{q.session} {q.year} · Paper {q.paper} · Original Q{q.questionNumber}</div>
                    <h3>{q.summary}</h3>
                    <div className="tags">{q.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
                  </div>
                  <div className="marks">{q.marks}<small>marks</small></div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
