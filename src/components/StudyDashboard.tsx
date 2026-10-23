"use client";
import { useState } from "react";
import { useStudy } from "./StudyProvider";
import { clock, duration, localDay, splitStudy, STUDY_SUBJECTS, StudySubject, StudyMode } from "@/lib/studyTime";

export default function StudyDashboard() {
  const { active, records, elapsed, loaded, syncError, start, pause, resume, finish, retry } = useStudy();
  const [subject, setSubject] = useState<StudySubject>("biology");
  const [mode, setMode] = useState<StudyMode>("revision");
  const [day, setDay] = useState("all");
  const [limit, setLimit] = useState(7);
  const selected = STUDY_SUBJECTS.find(s => s.id === (active?.subject || subject))!;
  const live = active?.runningSince != null ? splitStudy(active, "live", Date.now()) : [];
  const all = [...records, ...live];
  const days = Array.from(new Set(all.map(r => r.studied_on))).sort().reverse();
  const filtered = day === "all" ? all : all.filter(r => r.studied_on === day);
  const totals = STUDY_SUBJECTS.map(s => ({ ...s, time: filtered.filter(r => r.subject === s.id).reduce((sum, r) => sum + r.duration_ms, 0) }));
  const total = totals.reduce((sum, s) => sum + s.time, 0);
  const today = all.filter(r => r.studied_on === localDay(new Date())).reduce((sum, r) => sum + r.duration_ms, 0);
  const maximum = Math.max(...totals.map(s => s.time), 1);
  const labelDay = (value: string) => new Date(value + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return <section className="study-dashboard" aria-labelledby="study-title">
    <div className="study-heading"><div><p className="study-eyebrow">MAKE YOUR TIME COUNT</p><h2 id="study-title">Your study space</h2><p>One session at a time. See where your effort goes.</p></div><div className="study-today"><span>Studied today</span><strong>{duration(today)}</strong></div></div>
    <div className="study-grid">
      <div className="study-card study-timer">
        <div className="study-card-top"><h3>Study timer</h3><span className="study-status"><i style={{ background: active?.runningSince != null ? selected.color : "#827c6b" }}/>{active ? active.runningSince === null ? "Paused" : "In progress" : "Ready when you are"}</span></div>
        <div className="study-fields"><label>Subject<select value={active?.subject || subject} disabled={!!active || !loaded} onChange={e => setSubject(e.target.value as StudySubject)}>{STUDY_SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Session type<select value={active?.mode || mode} disabled={!!active || !loaded} onChange={e => setMode(e.target.value as StudyMode)}><option value="revision">Revision</option><option value="past-paper">Past paper</option></select></label></div>
        <div className="study-clock" style={{ borderColor: selected.color + "50" }}><span style={{ color: selected.color }}>{selected.name}</span><output aria-label="Elapsed study time">{clock(elapsed)}</output><small>{active ? active.runningSince === null ? "Take a breath. Resume when you’re ready." : "You’re making progress." : "A little focus goes a long way."}</small></div>
        <div className="study-timer-actions">{!active ? <button className="study-primary" disabled={!loaded} onClick={() => start(subject, mode)}>▶ Start studying</button> : <><button onClick={active.runningSince === null ? resume : pause}>{active.runningSince === null ? "▶ Resume" : "Ⅱ Pause"}</button><button className="study-primary" onClick={finish}>✓ Finish & save</button></>}</div>
        <p className="study-hint">Pause for breaks. Your timer keeps running when you switch pages or refresh.</p>
      </div>
      <div className="study-card study-overview">
        <div className="study-card-top"><div><h3>Time by subject</h3><p>{day === "all" ? "All your recorded study time" : labelDay(day)}</p></div><strong className="study-total">{duration(total)}<small>total</small></strong></div>
        <div className="study-legend" aria-label="Subject colour key">{STUDY_SUBJECTS.map(s => <span key={s.id}><i style={{ background: s.color }}/>{s.name}</span>)}</div>
        <div className="study-bars" role="img" aria-label={`Study time ${day === "all" ? "across all days" : "on " + labelDay(day)}. ${totals.map(s => `${s.name}: ${duration(s.time)}`).join(". ")}`}>
          {totals.map(s => <div className="study-bar-row" key={s.id}><div><span>{s.name}</span><strong>{duration(s.time)}</strong></div><div className="study-bar-track"><div style={{ width: `${s.time / maximum * 100}%`, background: s.color, minWidth: s.time ? 4 : 0 }}/></div></div>)}
        </div>
        {!total && <p className="study-chart-empty">Start your first session and watch your study time build up here.</p>}
      </div>
    </div>
    <div className="study-card study-history"><div className="study-card-top"><div><h3>Your study days</h3><p>Only the days you studied. Select one to explore your time.</p></div><span className="study-day-count">{days.length} {days.length === 1 ? "day" : "days"}</span></div>
      <div className="study-day-filters"><button aria-pressed={day === "all"} onClick={() => setDay("all")}>All days</button>{days.slice(0, limit).map(date => { const time = all.filter(r => r.studied_on === date).reduce((sum, r) => sum + r.duration_ms, 0); return <button key={date} aria-pressed={day === date} onClick={() => setDay(date)}><span>{labelDay(date)}</span><strong>{duration(time)}</strong></button>; })}</div>
      {!days.length && <p className="study-hint">Your first study day will appear here once you start the timer.</p>}
      {days.length > limit && <button className="study-more" onClick={() => setLimit(limit + 14)}>Show earlier days</button>}
      {day !== "all" && <div className="study-day-detail"><span>{labelDay(day)}</span><div>{totals.filter(s => s.time > 0).map(s => <span key={s.id}><i style={{ background: s.color }}/>{s.name} <strong>{duration(s.time)}</strong></span>)}</div></div>}
      {syncError && <p className="study-sync" role="status">Your time is kept on this browser. Account sync is waiting. <button onClick={retry}>Retry sync</button></p>}
    </div>
  </section>;
}
