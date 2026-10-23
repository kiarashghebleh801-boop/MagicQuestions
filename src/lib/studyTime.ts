export const STUDY_SUBJECTS = [
  { id: "biology", name: "Biology", color: "#69d5a4", route: "/biology" },
  { id: "mathematics", name: "Mathematics", color: "#a89bff", route: "/mathematics" },
  { id: "chemistry", name: "Chemistry", color: "#f2bd67", route: "/chemistry" },
  { id: "physics", name: "Physics", color: "#71bdf8", route: "/physics" },
] as const;
export type StudySubject = typeof STUDY_SUBJECTS[number]["id"];
export type StudyMode = "revision" | "past-paper";
export type StudyRecord = { id: string; user_id: string; subject: StudySubject; mode: StudyMode; started_at: string; ended_at: string; duration_ms: number; studied_on: string };
export type ActiveStudy = { id: string; subject: StudySubject; mode: StudyMode; runningSince: number | null; elapsedMs: number };
export function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
export function duration(ms: number) {
  if (ms > 0 && ms < 60000) return `${Math.max(1, Math.floor(ms / 1000))}s`;
  const m = Math.floor(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}
// Split at local midnight, including DST days, so overnight study is attributed correctly.
export function splitStudy(active: ActiveStudy, userId: string, end: number): StudyRecord[] {
  if (active.runningSince === null || end <= active.runningSince) return [];
  const records: StudyRecord[] = [];
  let cursor = active.runningSince;
  while (cursor < end) {
    const date = new Date(cursor);
    const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
    const until = Math.min(end, midnight);
    records.push({ id: active.id.slice(0, -4) + records.length.toString(16).padStart(4, "0"), user_id: userId, subject: active.subject, mode: active.mode, started_at: new Date(cursor).toISOString(), ended_at: new Date(until).toISOString(), duration_ms: until - cursor, studied_on: localDay(date) });
    cursor = until;
  }
  return records;
}
