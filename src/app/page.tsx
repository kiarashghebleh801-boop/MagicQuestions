"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
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

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (!ready) return <main className="authPage"><div className="authLogo"><span>✦</span> MagicQuestions</div></main>;

  return <main>
    <header className="nav">
      <div className="brand"><span className="spark">✦</span> MagicQuestions</div>
      <nav className="tabs"><button className="active">Home</button><button onClick={()=>router.push("/igcse")}>IGCSE</button></nav>
      <div style={{display:"flex",alignItems:"center",gap:8}}><div className="badge">{email}</div><button className="accountButton" onClick={signOut}>Log out</button></div>
    </header>

    <section className="hero" style={{paddingBottom:28}}>
      <p className="eyebrow">MAGICQUESTIONS</p>
      <h1>Build practice around<br/><span>what you actually need.</span></h1>
      <p className="subtitle">Choose your qualification, pick a subject, and generate focused practice from formatted past-paper questions.</p>
    </section>

    <section style={{maxWidth:1100,margin:"0 auto 56px",padding:"0 20px"}}>
      <div className="panel" style={{padding:28}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"center",flexWrap:"wrap"}}>
          <div>
            <p className="eyebrow" style={{marginBottom:6}}>QUALIFICATIONS</p>
            <h2 style={{margin:"0 0 8px",fontSize:30}}>Choose where you want to practise</h2>
            <p className="subtitle" style={{textAlign:"left",margin:0,maxWidth:680}}>Your current question banks are under IGCSE. More qualifications can be added here later without changing the subject pages.</p>
          </div>
          <button className="generate" style={{width:"auto",minWidth:190}} onClick={()=>router.push("/igcse")}>Open IGCSE →</button>
        </div>
      </div>
    </section>
  </main>;
}
