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

  if (!ready) return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#080808",color:"#f5e3a3"}}><div className="authLogo" style={{margin:0,color:"inherit"}}><span style={{color:"#d4af37"}}>✦</span> MagicQuestions</div></main>;

  return <main style={{minHeight:"100vh",background:"#080808",color:"#f4ecd4"}}>
    <header className="nav" style={{background:"rgba(8,8,8,.96)",borderBottom:"1px solid rgba(212,175,55,.22)",color:"#f4ecd4"}}>
      <div className="brand"><span className="spark" style={{color:"#d4af37"}}>✦</span> MagicQuestions <span className="ownerTag" style={{background:"rgba(212,175,55,.10)",color:"#d4af37"}}>IGCSE</span></div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div className="badge" style={{background:"rgba(212,175,55,.08)",borderColor:"rgba(212,175,55,.22)",color:"#d9c98c"}}>{email}</div>
      </div>
    </header>

    <section className="hero" style={{paddingBottom:28}}>
      <p className="eyebrow" style={{color:"#d4af37"}}>INTERNATIONAL GCSE</p>
      <h1 style={{color:"#fffaf0"}}>Choose your<br/><span style={{color:"#d4af37"}}>subject.</span></h1>
      <p className="subtitle" style={{color:"#aaa38f"}}>Pick a subject to open its question generator and question bank.</p>
    </section>

    <section style={{maxWidth:1180,margin:"0 auto 64px",padding:"0 20px",display:"grid",gap:16}}>
      {subjects.map(subject => <button
        key={subject.title}
        onClick={()=>router.push(subject.route)}
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
          color:"#fffaf0",
          background:"#111111",
          border:"1px solid rgba(212,175,55,.24)",
          borderRadius:18,
          boxShadow:"0 8px 24px rgba(0,0,0,.22)",
          transition:"transform .16s ease, border-color .16s ease, background .16s ease",
        }}
        onMouseEnter={e=>{
          e.currentTarget.style.transform="translateY(-1px)";
          e.currentTarget.style.borderColor="rgba(212,175,55,.6)";
          e.currentTarget.style.background="#15130d";
        }}
        onMouseLeave={e=>{
          e.currentTarget.style.transform="translateY(0)";
          e.currentTarget.style.borderColor="rgba(212,175,55,.24)";
          e.currentTarget.style.background="#111111";
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
          border:"1px solid rgba(212,175,55,.12)",
        }}><FolderIcon/></div>

        <div>
          <h2 style={{margin:0,fontSize:"clamp(21px,2vw,27px)",fontWeight:800,letterSpacing:"-.02em"}}>{subject.title}</h2>
          <div className="qMeta" style={{marginTop:5,color:"#9c9584"}}>{subject.subtitle}</div>
        </div>

        <div style={{color:"#d4af37",opacity:.72,display:"grid",placeItems:"center"}}><ChevronIcon/></div>
      </button>)}

      <div style={{
        minHeight:94,
        padding:"18px 22px",
        display:"grid",
        gridTemplateColumns:"56px 1fr",
        alignItems:"center",
        gap:18,
        borderRadius:18,
        border:"1px dashed rgba(212,175,55,.2)",
        background:"#0d0d0d",
        color:"#b6ad94",
        opacity:.82,
      }}>
        <div style={{width:46,height:46,borderRadius:13,display:"grid",placeItems:"center",background:"rgba(212,175,55,.07)",color:"#b99936"}}><FolderIcon/></div>
        <div><h2 style={{margin:0,fontSize:22,color:"#e7ddc3"}}>More subjects</h2><div className="qMeta" style={{marginTop:5,color:"#8f8979"}}>Physics, Biology, Economics and more can be added here.</div></div>
      </div>
    </section>
  </main>;
}
