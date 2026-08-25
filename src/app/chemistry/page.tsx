"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { chemistrySections } from "@/lib/chemistrySpec";
import { supabase } from "@/lib/supabase";

type ChemistryQuestion = {
  id: string;
  section: number;
  subtopic: string;
  summary: string;
  marks: number;
  year: number;
  session: string;
  paper: string;
  questionNumber: number;
};

// Questions from formatted chemistry Word papers will be added here as they are uploaded.
const chemistryQuestions: ChemistryQuestion[] = [];

export default function ChemistryPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
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
    if (!selected) return chemistryQuestions;
    const section = Number(selected.slice(0,1));
    const subtopic = selected.slice(1);
    return chemistryQuestions.filter(q => q.section === section && q.subtopic === subtopic);
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
      <p className="subtitle">Choose a specification section and sub-topic such as 1(a), 2(d), 3(b) or 4(h). Questions from your formatted chemistry papers will appear under the exact specification topic.</p>
    </section>

    <section style={{width:"min(1180px,calc(100% - 32px))",margin:"0 auto 70px",display:"grid",gridTemplateColumns:"minmax(300px,.9fr) minmax(0,1.1fr)",gap:22}}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {chemistrySections.map(section => <div className="panel" key={section.number} style={{padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:13}}>
            <div className="qNumber" style={{width:34,height:34}}>{section.number}</div>
            <div><b style={{fontSize:16}}>{section.title}</b><div className="qMeta">{section.subtopics.length} specification sub-topics</div></div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {section.subtopics.map(subtopic => {
              const key = `${section.number}${subtopic.code}`;
              const count = chemistryQuestions.filter(q=>q.section===section.number&&q.subtopic===subtopic.code).length;
              const active = selected===key;
              return <button key={key} onClick={()=>setSelected(active?null:key)} style={{display:"flex",alignItems:"center",gap:10,textAlign:"left",width:"100%",border:active?"1px solid #9f8cff":"1px solid #e3e5eb",background:active?"#f1eeff":"#fff",borderRadius:10,padding:"10px 11px",cursor:"pointer",color:active?"#5638d8":"inherit"}}>
                <b style={{minWidth:28}}>({subtopic.code})</b><span style={{flex:1,fontWeight:700}}>{subtopic.title}</span><small style={{color:"#8b909c",whiteSpace:"nowrap"}}>{subtopic.specRange} · {count}</small>
              </button>;
            })}
          </div>
        </div>)}
      </div>

      <div className="panel" style={{padding:26,minHeight:540}}>
        <div className="previewHead">
          <div><p>CHEMISTRY QUESTION BANK</p><h2>{selected ? `Specification ${selected[0]}(${selected.slice(1)})` : "All chemistry questions"}</h2></div>
          <span>{chemistryQuestions.length} questions</span>
        </div>
        {visibleQuestions.length===0 ? <div className="empty" style={{height:430}}><div>⚗</div><h3>{chemistryQuestions.length ? "No questions under this sub-topic yet" : "Ready for your chemistry papers"}</h3><p>{chemistryQuestions.length ? "Choose another specification sub-topic." : "The specification structure is ready. Once your formatted chemistry Word papers are added, their questions will be tagged and shown here."}</p></div> : <div className="bankResults" style={{borderTop:0}}>{visibleQuestions.map(q=><article className="bankCard" key={q.id}><div><div className="qMeta">{q.session} {q.year} · Paper {q.paper} · Q{q.questionNumber} · Specification {q.section}({q.subtopic})</div><h3>{q.summary}</h3></div><div className="bankActions"><b>{q.marks} marks</b></div></article>)}</div>}
      </div>
    </section>
  </main>;
}
