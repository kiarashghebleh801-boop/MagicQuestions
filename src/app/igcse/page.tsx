"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const subjects = [
  {
    title: "Mathematics",
    subtitle: "Edexcel IGCSE Mathematics A",
    route: "/mathematics",
  },
  {
    title: "Chemistry",
    subtitle: "Edexcel International GCSE Chemistry 4CH1",
    route: "/chemistry",
  },
];

function FolderIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3.5 6.75c0-1.1.9-2 2-2h4.15c.53 0 1.04.21 1.41.59l1.1 1.1c.28.28.66.44 1.06.44h5.28c1.1 0 2 .9 2 2v8.37c0 1.1-.9 2-2 2h-13c-1.1 0-2-.9-2-2V6.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
  </svg>;
}

function ChevronIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

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
      <p className="subtitle">Pick a subject to open its question generator and question bank.</p>
    </section>

    <section style={{maxWidth:1180,margin:"0 auto 64px",padding:"0 20px",display:"grid",gap:16}}>
      {subjects.map(subject => <button
        key={subject.title}
        onClick={()=>router.push(subject.route)}
        className="panel"
        style={{
          width:"100%",
          minHeight:94,
          padding:"18px 22px",
          display:"grid",
          gridTemplateColumns:"56px 1fr auto",
          alignItems:"center",
          gap:18,
          textAlign:"left",
          cursor:"pointer",
          color:"inherit",
          border:"1px solid var(--border, rgba(127,127,127,.22))",
          borderRadius:18,
          transition:"transform .16s ease, border-color .16s ease, background .16s ease",
        }}
        onMouseEnter={e=>{
          e.currentTarget.style.transform="translateY(-1px)";
          e.currentTarget.style.borderColor="rgba(212,175,55,.42)";
        }}
        onMouseLeave={e=>{
          e.currentTarget.style.transform="translateY(0)";
          e.currentTarget.style.borderColor="var(--border, rgba(127,127,127,.22))";
        }}
      >
        <div style={{
          width:46,
          height:46,
          borderRadius:13,
          display:"grid",
          placeItems:"center",
          background:"rgba(212,175,55,.10)",
          color:"#d4af37",
        }}><FolderIcon/></div>

        <div>
          <h2 style={{margin:0,fontSize:"clamp(21px,2vw,27px)",fontWeight:800,letterSpacing:"-.02em"}}>{subject.title}</h2>
          <div className="qMeta" style={{marginTop:5,opacity:.7}}>{subject.subtitle}</div>
        </div>

        <div style={{opacity:.6,display:"grid",placeItems:"center"}}><ChevronIcon/></div>
      </button>)}

      <div className="panel" style={{
        minHeight:94,
        padding:"18px 22px",
        display:"grid",
        gridTemplateColumns:"56px 1fr",
        alignItems:"center",
        gap:18,
        borderRadius:18,
        borderStyle:"dashed",
        opacity:.62,
      }}>
        <div style={{width:46,height:46,borderRadius:13,display:"grid",placeItems:"center",background:"rgba(127,127,127,.09)",color:"inherit"}}><FolderIcon/></div>
        <div><h2 style={{margin:0,fontSize:22}}>More subjects</h2><div className="qMeta" style={{marginTop:5}}>Physics, Biology, Economics and more can be added here.</div></div>
      </div>
    </section>
  </main>;
}
