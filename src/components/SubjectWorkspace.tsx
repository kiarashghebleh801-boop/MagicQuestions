"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";

export type SubjectWorkspaceMode = "resources" | "generate" | "bank" | "tracker" | "notes";
type Subject = "Mathematics" | "Chemistry" | "Physics" | "Biology";
type IconName = "menu" | "book" | "resources" | "progress" | "notes" | "questions" | "target" | "timer" | "arrow" | "chevron";
const subjects: { name: Subject; href: string; code: string }[] = [
  { name: "Mathematics", href: "/mathematics", code: "4MA1" },
  { name: "Chemistry", href: "/chemistry", code: "4CH1" },
  { name: "Physics", href: "/physics", code: "4PH1" },
  { name: "Biology", href: "/biology", code: "4BI1" },
];

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    menu: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m6-11-3 3 3 3"/></>,
    book: <><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/><path d="m6 8 3 1m-3 3 3 1m6-4 3-1m-3 5 3-1"/></>,
    resources: <><path d="M7 3h12v16H7a3 3 0 0 0 0 3h14M7 3a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h12M9 6v6"/></>,
    progress: <><path d="M4 18a9 9 0 1 1 16 0l-4-2H8l-4 2Z"/><path d="m12 12 4-4M7 10l1 1m4-6v2m6 3-1 1"/></>,
    notes: <><rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v8l3-2 3 2V3M5 18H3V6"/></>,
    questions: <><rect x="5" y="3" width="15" height="18" rx="2"/><path d="M5 7H2v14h13M10 8a2 2 0 1 1 3 2c-1 .5-1 1-1 2m0 4h.01"/></>,
    target: <><circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4"/><path d="m11 13 9-9m-4 0h4v4"/></>,
    timer: <><circle cx="12" cy="14" r="8"/><path d="M9 2h6m-3 0v4m0 4v4l3 2m4-11 2 2"/></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
    chevron: <path d="m7 10 5 5 5-5"/>,
  };
  return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function SubjectWorkspace({ subject, email, mode, onModeChange, hasTracker = true, questionCount, children, accountActions }: {
  subject: Subject; email: string; mode: SubjectWorkspaceMode; onModeChange: (mode: SubjectWorkspaceMode) => void;
  hasTracker?: boolean; questionCount: number; children: ReactNode; accountActions?: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const course = subjects.find(item => item.name === subject)!;
  useEffect(() => {
    if (!mobileOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
      if (event.key !== "Tab") return;
      const focusable = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>("button, a[href], summary") || []).filter(element => element.offsetParent !== null);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("keydown", close); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, [mobileOpen]);
  function navigate(next: SubjectWorkspaceMode) { onModeChange(next); setMobileOpen(false); }
  function toolButton(value: SubjectWorkspaceMode, label: string, icon: IconName, soon = false) {
    return <button type="button" className={`subject-nav-item${mode === value ? " is-active" : ""}`} aria-current={mode === value ? "page" : undefined} onClick={() => navigate(value)} title={collapsed ? label : undefined}>
      <Icon name={icon}/><span className="subject-nav-label">{label}</span>{soon ? <small className="subject-soon-label">Coming soon</small> : null}
    </button>;
  }
  const title = { resources: "Course resources", generate: "Paper generator", bank: "Question bank", tracker: "Tracker", notes: "Revision notes" }[mode];
  return <main className={`subject-workspace${collapsed ? " is-collapsed" : ""}${mobileOpen ? " is-mobile-open" : ""}`}>
    {mobileOpen ? <button type="button" className="subject-menu-scrim" aria-label="Close course menu" onClick={() => setMobileOpen(false)}/> : null}
    <aside ref={sidebarRef} className="subject-sidebar" id="subject-course-menu" aria-label={`${subject} course navigation`}>
      <button type="button" className="subject-hide-menu" onClick={() => { if (window.matchMedia("(max-width: 900px)").matches) setMobileOpen(false); else setCollapsed(value => !value); }} aria-label={collapsed ? "Show menu" : "Hide menu"} aria-expanded={!collapsed}>
        <Icon name="menu"/><span className="subject-nav-label">Hide menu</span>
      </button>
      <div className="subject-sidebar-inner">
        <p className="subject-nav-heading">Course</p>
        <details className="subject-course-picker" key={subject}>
          <summary aria-label={`Choose course, currently ${subject} Edexcel`} title={`${subject} Edexcel`}><Icon name="book"/><span className="subject-nav-label">{subject} Edexcel</span><span className="subject-course-chevron"><Icon name="chevron"/></span></summary>
          <nav className="subject-course-options" aria-label="Choose a subject">{subjects.map(item => <Link key={item.name} href={item.href} aria-current={subject === item.name ? "page" : undefined}><span>{item.name}</span><small>Edexcel IGCSE</small></Link>)}</nav>
        </details>
        <nav aria-label="Course resources">
          {toolButton("resources", "Course resources", "resources")}
          {hasTracker ? toolButton("tracker", "Tracker", "progress") : null}
          <p className="subject-nav-heading">Exam practice</p>
          {toolButton("bank", "Question bank", "questions")}
          {toolButton("generate", "Paper generator", "target")}
          <Link className="subject-nav-item" href="/study" title={collapsed ? "Study timer" : undefined}><Icon name="timer"/><span className="subject-nav-label">Study timer</span></Link>
        </nav>
      </div>
      <Link href="/igcse" className="subject-all-courses"><Icon name="book"/><span className="subject-nav-label">All subjects</span></Link>
      <Link href="/" className="subject-sidebar-brand"><span>✦</span><span className="subject-nav-label">MagicQuestions</span></Link>
    </aside>
    <div className="subject-main">
      <header className="subject-topbar">
        <div className="subject-breadcrumb"><button type="button" className="subject-mobile-toggle" aria-label="Open course menu" aria-controls="subject-course-menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Icon name="menu"/></button><Link href="/igcse">Subjects</Link><span>/</span><span>{subject}</span><span>/</span><strong>{title}</strong></div>
        <div className="subject-account">{accountActions}<span title={email}>{email}</span></div>
      </header>
      {mode === "resources" ? <section className="subject-resources">
        <p className="subject-course-eyebrow">EDEXCEL INTERNATIONAL GCSE · {course.code}</p>
        <h1>{subject}<span>Course resources</span></h1>
        <p className="subject-resource-intro">Your next study session starts here. Choose a resource and make it your own.</p>
        <div className="subject-resource-grid">
          <button type="button" className="subject-resource-card" onClick={() => navigate("bank")} style={{"--resource-accent":"#d4af37"} as CSSProperties}><span className="subject-resource-icon"><Icon name="questions"/></span><small>EXAM PRACTICE</small><h2>Question bank</h2><p>Explore {questionCount.toLocaleString()} questions and choose the topics you want to practise.</p><span className="subject-card-link">Browse questions <Icon name="arrow"/></span></button>
          <button type="button" className="subject-resource-card" onClick={() => navigate("generate")} style={{"--resource-accent":"#d4af37"} as CSSProperties}><span className="subject-resource-icon"><Icon name="target"/></span><small>MAKE IT YOURS</small><h2>Paper generator</h2><p>Build a custom paper around your topics, then download it with its available mark scheme.</p><span className="subject-card-link">Build a paper <Icon name="arrow"/></span></button>
          {hasTracker ? <button type="button" className="subject-resource-card" onClick={() => navigate("tracker")} style={{"--resource-accent":"#d4af37"} as CSSProperties}><span className="subject-resource-icon"><Icon name="progress"/></span><small>YOUR PROGRESS</small><h2>Tracker</h2><p>Review your results, track topics and decide what to work on next.</p><span className="subject-card-link">View your progress <Icon name="arrow"/></span></button> : null}
          <button type="button" className="subject-resource-card subject-resource-soon" onClick={() => navigate("notes")} style={{"--resource-accent":"#d4af37"} as CSSProperties}><span className="subject-resource-icon"><Icon name="notes"/></span><small>REVISION <span className="subject-card-soon">Coming soon</span></small><h2>Revision notes</h2><p>A space for your {subject.toLowerCase()} revision notes. More resources are on the way.</p><span className="subject-card-link">Coming soon <Icon name="arrow"/></span></button>
        </div>
        <Link className="subject-study-link" href="/study"><span className="subject-resource-icon"><Icon name="timer"/></span><div><strong>A little focus goes a long way.</strong><p>Start a study timer and see your revision add up.</p></div><Icon name="arrow"/></Link>
      </section> : mode === "notes" ? <section className="subject-notes-soon" aria-labelledby="subject-notes-title"><span className="subject-notes-symbol"><Icon name="notes"/></span><span className="subject-coming-pill">Coming soon</span><h1 id="subject-notes-title">{subject} revision notes</h1><p>Revision notes are on the way. In the meantime, keep practising with your question bank and custom papers.</p><button type="button" onClick={() => navigate("bank")}>Explore the question bank <Icon name="arrow"/></button></section> : <div className="subject-tool-content">{children}</div>}
    </div>
  </main>;
}
