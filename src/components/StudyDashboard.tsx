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
  const [focus, setFocus] = useState<StudySubject | null>(null);
  const selected = STUDY_SUBJECTS.find(s => s.id === (active?.subject || subject))!;
  const live = active?.runningSince != null ? splitStudy(active, "live", active.runningSince + Math.max(0, elapsed - active.elapsedMs)) : [];
  const all = [...records, ...live];
  const days = Array.from(new Set(all.map(r => r.studied_on))).sort().reverse();
  const filtered = day === "all" ? all : all.filter(r => r.studied_on === day);
  const totals = STUDY_SUBJECTS.map(s => ({ ...s, time: filtered.filter(r => r.subject === s.id).reduce((sum, r) => sum + r.duration_ms, 0) }));
  const total = totals.reduce((sum, s) => sum + s.time, 0);
  const today = all.filter(r => r.studied_on === localDay(new Date())).reduce((sum, r) => sum + r.duration_ms, 0);
  const lifetime = all.reduce((sum, r) => sum + r.duration_ms, 0);
  const dayTotals = days.map(date => ({ date, total: all.filter(r => r.studied_on === date).reduce((sum, r) => sum + r.duration_ms, 0) }));
  const sparkDays = dayTotals.slice(0, 10).reverse();
  const sparkMax = Math.max(...sparkDays.map(d => d.total), 1);
  const sparkPoints = sparkDays.map((d, i) => `${sparkDays.length < 2 ? 50 : i / (sparkDays.length - 1) * 96 + 2},${30 - d.total / sparkMax * 27}`).join(" ");
  const maxDay = Math.max(...dayTotals.map(d => d.total), 1);
  const revision = filtered.filter(r => r.mode === "revision").reduce((sum, r) => sum + r.duration_ms, 0);
  let offset = 0;
  const arcs = totals.map(s => { const share = total ? s.time / total * 100 : 0; const arc = { ...s, share, offset }; offset += share; return arc; });
  const focused = totals.find(s => s.id === focus);
  const maximum = Math.max(...totals.map(s => s.time), 1);
  const labelDay = (value: string) => new Date(value + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return <section className="study-dashboard" aria-labelledby="study-title">
    <div className="study-heading"><div><p className="study-eyebrow">MAKE YOUR TIME COUNT</p><h2 id="study-title">Your study space</h2><p>One session at a time. See where your effort goes.</p></div><div className="study-today"><span>Studied today</span><strong>{duration(today)}</strong></div></div>
    <div className="study-stat-grid">
      <div className="study-stat"><span className="study-stat-icon" aria-hidden="true">◷</span><div><small>Total focus time</small><strong>{duration(lifetime)}</strong><span>Every minute adds up</span></div>{sparkDays.length > 1 && <svg viewBox="0 0 100 32" aria-hidden="true"><polyline points={sparkPoints}/></svg>}</div>
      <div className="study-stat"><span className="study-stat-icon" aria-hidden="true">▦</span><div><small>Active study days</small><strong>{days.length}<em>days</em></strong><span>Your recorded days of progress</span></div><div className="study-stat-dots" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} className={i < Math.min(days.length, 12) ? "lit" : ""}/>)}</div></div>
      <div className="study-stat"><span className="study-stat-icon" aria-hidden="true">↗</span><div><small>Average per study day</small><strong>{duration(days.length ? lifetime / days.length : 0)}</strong><span>Across days you used the timer</span></div></div>
    </div>
    <div className="study-grid">
      <div className="study-card study-timer">
        <div className="study-card-top"><h3>Study timer</h3><span className={`study-status${active?.runningSince != null ? " is-running" : ""}`}><i style={{ background: active?.runningSince != null ? selected.color : "#827c6b" }}/>{active ? active.runningSince === null ? "Paused" : "In progress" : "Ready when you are"}</span></div>
        <div className="study-fields"><label>Subject<select value={active?.subject || subject} disabled={!!active || !loaded} onChange={e => setSubject(e.target.value as StudySubject)}>{STUDY_SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Session type<select value={active?.mode || mode} disabled={!!active || !loaded} onChange={e => setMode(e.target.value as StudyMode)}><option value="revision">Revision</option><option value="past-paper">Past paper</option></select></label></div>
        <div className="study-clock" style={{ borderColor: selected.color + "50" }}><span style={{ color: selected.color }}>{selected.name}</span><output aria-label="Elapsed study time">{clock(elapsed)}</output><small>{active ? active.runningSince === null ? "Take a breath. Resume when you’re ready." : "You’re making progress." : "A little focus goes a long way."}</small></div>
        <div className="study-timer-actions">{!active ? <button className="study-primary" disabled={!loaded} onClick={() => start(subject, mode)}>▶ Start studying</button> : <><button onClick={active.runningSince === null ? resume : pause}>{active.runningSince === null ? "▶ Resume" : "Ⅱ Pause"}</button><button className="study-primary" onClick={finish}>✓ Finish & save</button></>}</div>
        <p className="study-hint">Pause for breaks. Your timer keeps running when you switch pages or refresh.</p>
      </div>
      <div className="study-card study-overview">
        <div className="study-card-top"><div><h3>Time by subject</h3><p>{day === "all" ? "All your recorded study time" : labelDay(day)}</p></div><strong className="study-total">{duration(total)}<small>total</small></strong></div>
        <div className="study-legend study-interactive-legend" aria-label="Subject colour key">{STUDY_SUBJECTS.map(s => <button key={s.id} aria-pressed={focus === s.id} onClick={() => setFocus(focus === s.id ? null : s.id)}><i style={{ background: s.color }}/>{s.name}</button>)}</div>
        <div className="study-distribution">
          <div className="study-donut">
            <svg viewBox="0 0 180 180" role="img" aria-label={`Subject distribution: ${arcs.map(s => `${s.name} ${Math.round(s.share)}%`).join(", ")}`}>
              <circle cx="90" cy="90" r="71" fill="none" stroke="#ffffff09" strokeWidth="13"/>
              <g transform="rotate(-90 90 90)">{arcs.filter(s => s.time > 0).map(s => <circle key={s.id} cx="90" cy="90" r="71" pathLength="100" fill="none" stroke={s.color} strokeWidth={focus === s.id ? 17 : 13} strokeDasharray={`${s.share} ${100 - s.share}`} strokeDashoffset={-s.offset} opacity={focus && focus !== s.id ? .18 : 1}><title>{s.name}: {duration(s.time)} ({Math.round(s.share)}%)</title></circle>)}</g>
              <circle cx="90" cy="90" r="58" className="study-donut-inner"/>
            </svg>
            <div className="study-donut-label"><small>{focused ? focused.name : "FOCUS TIME"}</small><strong style={{ color: focused?.color }}>{duration(focused ? focused.time : total)}</strong><span>{focused ? `${Math.round(total ? focused.time / total * 100 : 0)}% of study time` : day === "all" ? "across all days" : "on this day"}</span></div>
          </div>
          <div className="study-distribution-caption"><span className="study-insight-dot"/> {total ? "Every subject has its own story." : "Your next session starts the story."}<small>Tap a subject in the key to highlight it.</small></div>
        </div>
        <div className="study-bars study-animated-bars" key={day} role="img" aria-label={`Study time ${day === "all" ? "across all days" : "on " + labelDay(day)}. ${totals.map(s => `${s.name}: ${duration(s.time)}`).join(". ")}`}>
          {totals.map((s, index) => <div className="study-bar-row" key={s.id} style={{ opacity: focus && focus !== s.id ? .35 : 1, animationDelay: `${index * 75}ms` }}><div><span><i style={{ background: s.color }}/>{s.name}</span><strong>{duration(s.time)} <small>{Math.round(total ? s.time / total * 100 : 0)}%</small></strong></div><div className="study-bar-track"><div title={`${s.name}: ${duration(s.time)}`} style={{ width: `${s.time / maximum * 100}%`, background: `linear-gradient(90deg, ${s.color}75, ${s.color})`, minWidth: s.time ? 4 : 0, boxShadow: `0 0 16px ${s.color}25` }}/></div></div>)}
        </div>
        <div className="study-mode-balance"><div><span>Revision <strong>{duration(revision)}</strong></span><span>Past papers <strong>{duration(total - revision)}</strong></span></div><div className="study-mode-track"><i style={{ width: `${total ? revision / total * 100 : 0}%` }}/><i style={{ width: `${total ? (total - revision) / total * 100 : 0}%` }}/></div></div>
        {!total && <p className="study-chart-empty">Start your first session and watch your study time build up here.</p>}
      </div>
    </div>
    <div className="study-card study-history"><div className="study-card-top"><div><h3>Your study days</h3><p>Only the days you studied. Select one to explore your time.</p></div><span className="study-day-count">{days.length} {days.length === 1 ? "day" : "days"}</span></div>
      <div className="study-day-filters"><button aria-pressed={day === "all"} onClick={() => setDay("all")}>All days</button></div>
      <div className="study-activity-list">{dayTotals.slice(0, limit).map(({ date, total: daily }) => <button className="study-activity-day" key={date} aria-pressed={day === date} onClick={() => setDay(day === date ? "all" : date)}>
        <span className="study-date-tile"><strong>{new Date(date + "T12:00:00").getDate()}</strong><small>{new Date(date + "T12:00:00").toLocaleDateString(undefined, { month: "short" })}</small></span>
        <span className="study-activity-data"><span className="study-activity-title"><span>{labelDay(date)}</span><strong>{duration(daily)}</strong></span><span className="study-activity-track"><span style={{ width: `${daily / maxDay * 100}%` }}>{STUDY_SUBJECTS.map(s => { const time = all.filter(r => r.studied_on === date && r.subject === s.id).reduce((sum, r) => sum + r.duration_ms, 0); return time > 0 ? <i key={s.id} title={`${s.name}: ${duration(time)}`} style={{ width: `${time / daily * 100}%`, background: s.color }}/> : null; })}</span></span></span><span className="study-activity-arrow" aria-hidden="true">↗</span>
      </button>)}</div>
      {!days.length && <p className="study-hint">Your first study day will appear here once you start the timer.</p>}
      {days.length > limit && <button className="study-more" onClick={() => setLimit(limit + 14)}>Show earlier days</button>}
      {day !== "all" && <div className="study-day-detail"><span>{labelDay(day)}</span><div>{totals.filter(s => s.time > 0).map(s => <span key={s.id}><i style={{ background: s.color }}/>{s.name} <strong>{duration(s.time)}</strong></span>)}</div></div>}
      {syncError && <p className="study-sync" role="status">Your time is kept on this browser. Account sync is waiting. <button onClick={retry}>Retry sync</button></p>}
    </div>
  </section>;
}
