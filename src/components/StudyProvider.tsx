"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ActiveStudy, clock, splitStudy, StudyMode, StudyRecord, StudySubject, STUDY_SUBJECTS } from "@/lib/studyTime";

type StudyContext = { active: ActiveStudy | null; records: StudyRecord[]; elapsed: number; loaded: boolean; syncError: boolean; start: (subject: StudySubject, mode: StudyMode) => void; pause: () => void; resume: () => void; finish: () => void; retry: () => void };
const Context = createContext<StudyContext | null>(null);
export function useStudy() { const context = useContext(Context); if (!context) throw new Error("StudyProvider missing"); return context; }
type Cache = { active: ActiveStudy | null; records: StudyRecord[]; pending: string[] };
const empty = (): Cache => ({ active: null, records: [], pending: [] });
export default function StudyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Cache>(empty);
  const cache = useRef<Cache>(empty());
  const user = useRef<string | null>(null);
  const syncing = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [now, setNow] = useState(Date.now());
  const pathname = usePathname();
  const persist = useCallback((value: Cache) => {
    cache.current = value; setState(value);
    if (user.current) try { localStorage.setItem(`mq-study-v1-${user.current}`, JSON.stringify(value)); } catch { /* Cloud save still works without local storage. */ }
  }, []);
  const sync = useCallback(async () => {
    const id = user.current;
    if (!id || syncing.current) return;
    syncing.current = true;
    try {
      const pending = cache.current.records.filter(r => cache.current.pending.includes(r.id));
      if (pending.length) {
        const { error } = await supabase.from("study_sessions").upsert(pending, { onConflict: "id" });
        if (error) throw error;
        if (user.current !== id) return;
        const sent = new Set(pending.map(r => r.id));
        persist({ ...cache.current, pending: cache.current.pending.filter(key => !sent.has(key)) });
      }
      const all: StudyRecord[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from("study_sessions").select("id,user_id,subject,mode,started_at,ended_at,duration_ms,studied_on").eq("user_id", id).order("id").range(from, from + 999);
        if (error) throw error;
        all.push(...(data || []) as StudyRecord[]);
        if (!data || data.length < 1000) break;
      }
      if (user.current !== id) return;
      const merged = new Map(all.map(r => [r.id, r]));
      cache.current.records.forEach(r => merged.set(r.id, r));
      persist({ ...cache.current, records: Array.from(merged.values()) });
      setSyncError(false);
    } catch { if (user.current === id) setSyncError(true); }
    finally { syncing.current = false; }
  }, [persist]);
  useEffect(() => {
    let alive = true;
    const initialize = (id: string | null) => {
      if (!alive || id === user.current && loaded) return;
      user.current = id;
      let value = empty();
      if (id) try {
        const saved = JSON.parse(localStorage.getItem(`mq-study-v1-${id}`) || "null");
        if (saved && Array.isArray(saved.records) && Array.isArray(saved.pending)) {
          value = { active: saved.active && STUDY_SUBJECTS.some(s => s.id === saved.active.subject) && Number.isFinite(saved.active.elapsedMs) && (saved.active.runningSince === null || Number.isFinite(saved.active.runningSince)) ? saved.active : null, records: saved.records.filter((r: StudyRecord) => r.user_id === id && Number.isFinite(r.duration_ms) && r.duration_ms > 0), pending: saved.pending };
        }
      } catch { /* Ignore invalid browser cache. */ }
      cache.current = value; setState(value); setSyncError(false); setLoaded(true); void sync();
    };
    void supabase.auth.getSession().then(({ data }) => initialize(data.session?.user.id || null));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.id !== user.current) setTimeout(() => initialize(session?.user.id || null), 0);
    });
    const storage = (event: StorageEvent) => {
      if (event.key !== `mq-study-v1-${user.current}` || !event.newValue) return;
      try { const value = JSON.parse(event.newValue); if (Array.isArray(value.records) && Array.isArray(value.pending)) { cache.current = value; setState(value); } } catch { /* Ignore invalid cache. */ }
    };
    window.addEventListener("storage", storage); window.addEventListener("online", sync);
    const refresh = window.setInterval(sync, 30000);
    return () => { alive = false; subscription.subscription.unsubscribe(); window.removeEventListener("storage", storage); window.removeEventListener("online", sync); clearInterval(refresh); };
    // Auth changes are handled by the subscription; mounting does not depend on loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync]);
  useEffect(() => {
    if (state.active?.runningSince == null) return;
    const tick = () => setNow(Date.now()); tick();
    const interval = window.setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [state.active?.runningSince]);
  const start = (subject: StudySubject, mode: StudyMode) => {
    if (!user.current || cache.current.active) return;
    const time = Date.now(); setNow(time);
    persist({ ...cache.current, active: { id: crypto.randomUUID(), subject, mode, runningSince: time, elapsedMs: 0 } });
  };
  const pause = () => {
    const active = cache.current.active;
    if (!user.current || !active || active.runningSince === null) return;
    const end = Date.now(); const added = splitStudy(active, user.current, end);
    const merged = new Map(cache.current.records.map(r => [r.id, r])); added.forEach(r => merged.set(r.id, r));
    persist({ records: Array.from(merged.values()), pending: Array.from(new Set([...cache.current.pending, ...added.map(r => r.id)])), active: { ...active, runningSince: null, elapsedMs: active.elapsedMs + Math.max(0, end - active.runningSince) } });
    void sync();
  };
  const resume = () => {
    const active = cache.current.active; if (!active || active.runningSince !== null) return;
    const time = Date.now(); setNow(time); persist({ ...cache.current, active: { ...active, id: crypto.randomUUID(), runningSince: time } });
  };
  const finish = () => { pause(); persist({ ...cache.current, active: null }); void sync(); };
  const elapsed = state.active ? state.active.elapsedMs + (state.active.runningSince === null ? 0 : Math.max(0, now - state.active.runningSince)) : 0;
  const subject = STUDY_SUBJECTS.find(s => s.id === state.active?.subject);
  const showMini = state.active && pathname !== "/igcse" && !["/login", "/banned"].includes(pathname);
  return <Context.Provider value={{ active: state.active, records: state.records, elapsed, loaded, syncError, start, pause, resume, finish, retry: sync }}>
    {children}
    {showMini && <aside className="study-mini" aria-label="Active study timer" style={{ borderColor: subject?.color }}>
      <Link href="/igcse" className="study-mini-info"><span style={{ color: subject?.color }}>{subject?.name} · {state.active?.runningSince === null ? "Paused" : "Studying"}</span><strong>{clock(elapsed)}</strong></Link>
      <button onClick={state.active?.runningSince === null ? resume : pause}>{state.active?.runningSince === null ? "Resume" : "Pause"}</button><button className="study-primary" onClick={finish}>Finish</button>
    </aside>}
  </Context.Provider>;
}
