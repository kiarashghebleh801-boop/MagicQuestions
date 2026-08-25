"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { chemistrySections } from "@/lib/chemistrySpec";
import { chemistryQuestions } from "@/lib/chemistryQuestions";
import { supabase } from "@/lib/supabase";

export default function ChemistryPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace("/login"); return; }
      setEmail(data.session.user.email || "Account");
      const { data: profile } = await supabase.from("profiles").select("banned").eq("id",data.session.user.id).maybeSingle();
      if (profile?.banned) { router.replace("/banned"); return; }
      setReady(true);
    });
  }, [router]);

  const visibleQuestions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return chemistryQuestions.filter(q => {
      const topicMatch = !selected || q.specTags.includes(selected);
      const textMatch = !needle || `${q.summary} ${q.session} ${q.year} ${q.paper} Q${q.questionNumber} ${q.specTags.join(" ")}`.toLowerCase().includes(needle);
      return topicMatch && textMatch;
    });
  }, [selected, query]);

  const selectedLabel = useMemo(() => {
    if (!selected) return null;
    const sectionNumber = Number(selected[0]);
    const code = selected.slice(1);
    const section = chemistrySections.find(s => s.number === sectionNumber);
    const subtopic = section?.subtopics.find(s => s.code === code);
    return subtopic ? `${sectionNumber}(${code}) ${subtopic.title}` : selected;
  }, [selected]);

  if (!ready) return <main className="authPage"><div className="authLogo"><span>✦</span> MagicQuestions Chemistry</div></main>;

  return <main>
    <header className="nav">
      <div className="brand"><span className="spark">✦</span> MagicQuestions <span className="ownerTag">Chemistry</span></div>
      <nav className="tabs"><button onClick={()=>router.push("/")}>Maths</button><button className="active">Chemistry</button></nav>
      <div style={{display:"flex",alignItems:"center",gap:8}}><div className="badge">{email}</div><button className="accountButton" onClick={()=>router.push("/")}>Back</button></div>
    </header>

    <section className="hero" style={{paddingBottom:28}}>
      <p className="eyebrow">EDEXCEL INTERNATIONAL GCSE CHEMISTRY 4CH1</p>
      <h1 style={{fontSize:"clamp(36px,4.4vw,58px)"}}>Chemistry question bank.<br/><span>Organised by the specification.</span></h1>
      <p className="subtitle">Choose an exact specification sub-topic such as 1(c), 2(d), 3(b) or 4(h). Questions can appear in more than one section when they test several parts of the specification.</p>
    </section>

    <section style={{width:"min(1180px,calc(100% - 32px))",margin:"0 auto 70px",display:"grid",gridTemplateColumns:"minmax(300px,.9fr) minmax(0,1.1fr)",gap:22}}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <button className="accountButton" onClick={()=>setSelected(null)} style={{alignSelf:"stretch",padding:"12px 14px",fontWeight:800}}>All chemistry questions ({chemistryQuestions.length})</button>
        {chemistrySections.map(section => <div className="panel" key={section.number} style={{padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:13}}>
            <div className="qNumber" style={{width:34,height:34}}>{section.number}</div>
            <div><b style={{fontSize:16}}>{section.title}</b><div className="qMeta">{section.subtopics.length} specification sub-topics</div></div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {section.subtopics.map(subtopic => {
              const key = `${section.number}${subtopic.code}`;
              const count = chemistryQuestions.filter(q=>q.specTags.includes(key)).length;
              const active = selected===key;
              return <button key={key} onClick={()=>setSelected(active?null:key)} style={{display:"flex",alignItems:"center",gap:10,textAlign:"left",width:"100%",border:active?"1px solid #9f8cff":"1px solid var(--border, #e3e5eb)",background:active?"#f1eeff":"var(--panel, #fff)",borderRadius:10,padding:"10px 11px",cursor:"pointer",color:active?"#5638d8":"inherit"}}>
                <b style={{minWidth:28}}>({subtopic.code})</b><span style={{flex:1,fontWeight:700}}>{subtopic.title}</span><small style={{color:"#8b909c",whiteSpace:"nowrap"}}>{subtopic.specRange} · {count}</small>
              </button>;
            })}
          </div>
        </div>)}
      </div>

      <div className="panel" style={{padding:26,minHeight:540,alignSelf:"start",position:"sticky",top:18}}>
        <div className="previewHead" style={{gap:14,alignItems:"flex-start"}}>
          <div><p>CHEMISTRY QUESTION BANK</p><h2>{selectedLabel || "All chemistry questions"}</h2></div>
          <span>{visibleQuestions.length} shown</span>
        </div>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search chemistry questions…" style={{width:"100%",padding:"12px 14px",border:"1px solid #dfe2e8",borderRadius:10,margin:"8px 0 18px",font:"inherit"}}/>
        {visibleQuestions.length===0 ? <div className="empty" style={{height:360}}><div>⚗</div><h3>No matching questions</h3><p>Try another specification sub-topic or clear the search.</p></div> : <div className="bankResults" style={{borderTop:0}}>{visibleQuestions.map(q=><article className="bankCard" key={q.id}><div><div className="qMeta">{q.session} {q.year} · Paper {q.paper} · Q{q.questionNumber}</div><h3>{q.summary}</h3><div className="tags">{q.specTags.map(tag=><span key={tag}>Spec {tag[0]}({tag.slice(1)})</span>)}</div></div><div className="bankActions"><b>{q.marks} marks</b></div></article>)}</div>}
      </div>
    </section>
  </main>;
}
