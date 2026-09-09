"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const GOLD = "#d4af37";
const GOLD_SOFT = "#e6ce78";
const BG = "#070707";
const PANEL = "#101010";

const subjects = [
  {
    title: "Mathematics",
    subtitle: "Edexcel International GCSE Mathematics A 4MA1",
    route: "/mathematics",
  },
  {
    title: "Chemistry",
    subtitle: "Edexcel International GCSE Chemistry 4CH1",
    route: "/chemistry",
  },
  {
    title: "Physics",
    subtitle: "Edexcel International GCSE Physics 4PH1",
    route: "/physics",
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

  if (!ready) return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:BG,color:"#f5ecd1"}}><div className="authLogo" style={{margin:0,color:"inherit"}}><span style={{color:GOLD}}>✦</span> MagicQuestions</div></main>;

  return <main style={{minHeight:"100vh",background:BG,color:"#f7f1df"}}>
    <header style={{height:72,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 max(5vw,28px)",background:"#090909",borderBottom:"1px solid rgba(212,175,55,.22)",position:"sticky",top:0,zIndex:10}}>
      <div style={{fontSize:21,fontWeight:850,letterSpacing:"-.5px"}}><span style={{color:GOLD,marginRight:7}}>✦</span> MagicQuestions</div>
      <div style={{fontSize:12,fontWeight:750,color:"#cdbf91",background:"rgba(212,175,55,.08)",border:"1px solid rgba(212,175,55,.20)",padding:"8px 12px",borderRadius:999}}>{email}</div>
    </header>

    <section style={{textAlign:"center",padding:"58px 20px 34px"}}>
      <p style={{fontSize:12,fontWeight:850,letterSpacing:2,color:GOLD,margin:"0 0 14px"}}>INTERNATIONAL GCSE</p>
      <h1 style={{fontSize:"clamp(38px,5vw,64px)",lineHeight:1.02,letterSpacing:"-3px",margin:"0 0 18px",color:"#fffaf0"}}>Choose your<br/><span style={{color:GOLD}}>subject.</span></h1>
      <p style={{maxWidth:700,margin:"0 auto",color:"#aaa28c",fontSize:17,lineHeight:1.6}}>Pick a subject to open its question generator and question bank.</p>
    </section>

    <section style={{maxWidth:1180,margin:"0 auto 64px",padding:"0 20px",display:"grid",gap:16}}>
      {subjects.map(subject => <button
        key={subject.title}
        onClick={()=>router.push(subject.route)}
        style={{
          width:"100%",
          minHeight:96,
          padding:"18px 22px",
          display:"grid",
          gridTemplateColumns:"56px 1fr auto",
          alignItems:"center",
          gap:18,
          textAlign:"left",
          cursor:"pointer",
          color:"#fffaf0",
          background:PANEL,
          border:"1px solid rgba(212,175,55,.24)",
          borderRadius:18,
          boxShadow:"0 8px 24px rgba(0,0,0,.24)",
          transition:"transform .16s ease, border-color .16s ease, background .16s ease",
        }}
        onMouseEnter={e=>{
          e.currentTarget.style.transform="translateY(-1px)";
          e.currentTarget.style.borderColor="rgba(212,175,55,.68)";
          e.currentTarget.style.background="#15130d";
        }}
        onMouseLeave={e=>{
          e.currentTarget.style.transform="translateY(0)";
          e.currentTarget.style.borderColor="rgba(212,175,55,.24)";
          e.currentTarget.style.background=PANEL;
        }}
      >
        <div style={{width:46,height:46,borderRadius:13,display:"grid",placeItems:"center",background:"rgba(212,175,55,.10)",color:GOLD,border:"1px solid rgba(212,175,55,.13)"}}><FolderIcon/></div>
        <div>
          <h2 style={{margin:0,fontSize:"clamp(21px,2vw,27px)",fontWeight:800,letterSpacing:"-.02em",color:"#fffaf0"}}>{subject.title}</h2>
          <div style={{marginTop:5,fontSize:11,fontWeight:700,color:"#a89f88"}}>{subject.subtitle}</div>
        </div>
        <div style={{color:GOLD_SOFT,opacity:.78,display:"grid",placeItems:"center"}}><ChevronIcon/></div>
      </button>)}

      <div style={{minHeight:96,padding:"18px 22px",display:"grid",gridTemplateColumns:"56px 1fr",alignItems:"center",gap:18,borderRadius:18,border:"1px dashed rgba(212,175,55,.22)",background:"#0b0b0b",color:"#b9b098"}}>
        <div style={{width:46,height:46,borderRadius:13,display:"grid",placeItems:"center",background:"rgba(212,175,55,.07)",color:"#b99936"}}><FolderIcon/></div>
        <div><h2 style={{margin:0,fontSize:22,color:"#e8dec4"}}>More subjects</h2><div style={{marginTop:5,fontSize:11,fontWeight:700,color:"#918978"}}>Biology, Economics and more can be added here.</div></div>
      </div>
    </section>
  </main>;
}
