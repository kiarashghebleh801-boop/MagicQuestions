"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const subjects = [
  {
    title: "Mathematics",
    subtitle: "Edexcel IGCSE Mathematics A",
    description: "Generate Higher-tier custom papers, browse the question bank, and download matching mark schemes.",
    route: "/mathematics",
    icon: "∑",
  },
  {
    title: "Chemistry",
    subtitle: "Edexcel International GCSE Chemistry 4CH1",
    description: "Build topic-specific Chemistry papers, browse the bank, and track specification progress.",
    route: "/chemistry",
    icon: "⚗",
  },
];

export default function IgcsePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace("/login"); return; }
      setEmail(data.session.user.email || "Account");
      const { data: profile } = await supabase.from("profiles").select("banned").eq("id", data.session.user.id).maybeSingle();
      if (profile?.banned) { router.replace("/banned"); return; }
      setReady(true);
    });
  }, [router]);

  if (!ready) return <main className="authPage"><div className="authLogo"><span>✦</span> MagicQuestions</div></main>;

  return <main>
    <header className="nav">
      <div className="brand"><span className="spark">✦</span> MagicQuestions <span className="ownerTag">IGCSE</span></div>
      <nav className="tabs"><button onClick={()=>router.push("/")}>Home</button><button className="active">IGCSE</button></nav>
      <div style={{display:"flex",alignItems:"center",gap:8}}><div className="badge">{email}</div><button className="accountButton" onClick={()=>router.push("/")}>Back</button></div>
    </header>

    <section className="hero" style={{paddingBottom:28}}>
      <p className="eyebrow">INTERNATIONAL GCSE</p>
      <h1>Choose your<br/><span>subject.</span></h1>
      <p className="subtitle">Pick a subject to open its question generator and question bank. New subjects can be added here as MagicQuestions grows.</p>
    </section>

    <section style={{maxWidth:1050,margin:"0 auto 56px",padding:"0 20px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20}}>
      {subjects.map(subject => <button key={subject.title} onClick={()=>router.push(subject.route)} className="panel" style={{padding:28,textAlign:"left",cursor:"pointer",border:"1px solid var(--border, rgba(127,127,127,.2))",color:"inherit"}}>
        <div style={{width:52,height:52,borderRadius:16,display:"grid",placeItems:"center",fontSize:26,marginBottom:22,background:"rgba(108,76,255,.12)"}}>{subject.icon}</div>
        <div className="qMeta" style={{marginBottom:7}}>{subject.subtitle}</div>
        <h2 style={{margin:"0 0 10px",fontSize:28}}>{subject.title}</h2>
        <p style={{margin:"0 0 22px",lineHeight:1.6,opacity:.72}}>{subject.description}</p>
        <strong>Open {subject.title} →</strong>
      </button>)}

      <div className="panel" style={{padding:28,borderStyle:"dashed",opacity:.7}}>
        <div style={{width:52,height:52,borderRadius:16,display:"grid",placeItems:"center",fontSize:26,marginBottom:22,background:"rgba(127,127,127,.1)"}}>+</div>
        <div className="qMeta" style={{marginBottom:7}}>COMING LATER</div>
        <h2 style={{margin:"0 0 10px",fontSize:28}}>More subjects</h2>
        <p style={{margin:0,lineHeight:1.6}}>Physics, Biology, Economics and anything else you add can appear here as another subject card.</p>
      </div>
    </section>
  </main>;
}
