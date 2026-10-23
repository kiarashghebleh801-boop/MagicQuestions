"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { STUDY_SUBJECTS } from "@/lib/studyTime";
import StudyDashboard from "@/components/StudyDashboard";

export default function IgcsePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("banned").eq("id", data.session.user.id).maybeSingle();
      if (!alive) return;
      if (profile?.banned) { router.replace("/banned"); return; }
      setEmail(data.session.user.email || "Account"); setReady(true);
    });
    return () => { alive = false; };
  }, [router]);
  if (!ready) return <main className="study-loading"><div className="authLogo"><span>✦</span> MagicQuestions</div></main>;
  return <main className="study-home">
    <header className="study-nav"><Link className="study-brand" href="/igcse"><span>✦</span> MagicQuestions</Link><span className="study-account">{email}</span></header>
    <div className="study-home-content">
      <section className="study-welcome"><div><p className="study-eyebrow">YOUR INTERNATIONAL GCSE WORKSPACE</p><h1>A little focus.<br/><span>A lot of progress.</span></h1><p>Build a paper, practise a topic, or settle into a study session.</p></div>
        <details className="study-subject-menu"><summary>Subjects <span aria-hidden="true">⌄</span></summary><nav aria-label="Subjects">{STUDY_SUBJECTS.map(s => <Link key={s.id} href={s.route}><i style={{ background: s.color }}/><span>{s.name}<small>Generator · Question bank · Tracker</small></span><b aria-hidden="true">↗</b></Link>)}</nav></details>
      </section>
      <StudyDashboard/>
      <section className="study-quick" aria-label="Open a subject"><p className="study-eyebrow">READY TO PRACTISE?</p><div>{STUDY_SUBJECTS.map(s => <Link key={s.id} href={s.route}><i style={{ background: s.color }}/>{s.name}<span aria-hidden="true">↗</span></Link>)}</div></section>
    </div>
  </main>;
}
