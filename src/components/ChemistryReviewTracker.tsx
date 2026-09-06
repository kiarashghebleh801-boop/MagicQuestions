"use client";

import { useEffect, useMemo, useState } from "react";
import { chemistrySections } from "@/lib/chemistrySpec";
import { supabase } from "@/lib/supabase";

type TopicInsight = { topic: string; red: number; yellow: number; worst: number };
type ReviewSnapshot = { percent: number; score: number; possible: number; topics: TopicInsight[]; savedAt: number };

export default function ChemistryReviewTracker() {
  const [snapshot, setSnapshot] = useState<ReviewSnapshot | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase.auth.getSession();
      const id = data.session?.user.id || null;
      if (!active) return;
      setUserId(id);
      if (!id) return;
      try {
        const raw = window.localStorage.getItem(`mq-chemistry-review-${id}`);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && Array.isArray(parsed.topics)) setSnapshot(parsed);
      } catch {}
    }
    void load();
    const onUpdate = () => void load();
    window.addEventListener("mq-chemistry-review-updated", onUpdate);
    return () => { active = false; window.removeEventListener("mq-chemistry-review-updated", onUpdate); };
  }, []);

  const names = useMemo(() => {
    const map = new Map<string,string>();
    for (const section of chemistrySections) for (const sub of section.subtopics) map.set(`${section.number}${sub.code}`, `${section.number}(${sub.code}) ${sub.title}`);
    return map;
  }, []);

  if (!userId || !snapshot) return <div style={{marginBottom:20,padding:16,borderRadius:16,border:"1px dashed var(--border,rgba(127,127,127,.28))",background:"rgba(127,127,127,.04)"}}><div className="qMeta">PAPER REVIEW LINK</div><h3 style={{margin:"5px 0 7px"}}>No review data yet</h3><p style={{margin:0}}>Finish a Chemistry paper review and your red/yellow topics will appear here automatically.</p></div>;

  const weakTopics = snapshot.topics.filter(t => names.has(t.topic));
  const redTopics = weakTopics.filter(t => t.red > 0).length;
  const yellowOnly = weakTopics.filter(t => t.red === 0 && t.yellow > 0).length;
  const date = snapshot.savedAt ? new Date(snapshot.savedAt).toLocaleDateString() : "latest review";

  return <div style={{marginBottom:22,padding:18,borderRadius:16,border:"1px solid var(--border,rgba(127,127,127,.2))",background:"rgba(108,76,255,.06)"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",marginBottom:12}}>
      <div><div className="qMeta">LINKED TO YOUR LATEST PAPER REVIEW</div><h3 style={{margin:"5px 0 4px"}}>{weakTopics.length ? `${weakTopics.length} topic${weakTopics.length===1?"":"s"} need attention` : "No weak Chemistry topics from your latest review"}</h3><div className="qMeta">{date} · {snapshot.score}/{snapshot.possible} marks · {snapshot.percent}%</div></div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",justifyContent:"flex-end"}}>{redTopics>0&&<span style={{padding:"6px 9px",borderRadius:999,background:"rgba(220,38,38,.12)",border:"1px solid rgba(220,38,38,.28)",fontSize:11,fontWeight:850}}>{redTopics} red</span>}{yellowOnly>0&&<span style={{padding:"6px 9px",borderRadius:999,background:"rgba(234,179,8,.14)",border:"1px solid rgba(234,179,8,.3)",fontSize:11,fontWeight:850}}>{yellowOnly} yellow</span>}</div>
    </div>
    {!weakTopics.length ? <p style={{margin:0}}>Everything tested in that paper was green. Keep the tracker moving by completing your next topics.</p> : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:9}}>{weakTopics.map(topic => <div key={topic.topic} style={{padding:"11px 12px",borderRadius:12,background:topic.red?"rgba(220,38,38,.10)":"rgba(234,179,8,.12)",border:`1px solid ${topic.red?"rgba(220,38,38,.25)":"rgba(234,179,8,.28)"}`}}><b>{names.get(topic.topic)}</b><div className="qMeta" style={{marginTop:4}}>{topic.red?`${topic.red} red${topic.yellow?` · ${topic.yellow} yellow`:""}`:`${topic.yellow} yellow`} · weakest {Math.round(topic.worst*100)}%</div></div>)}</div>}
  </div>;
}
