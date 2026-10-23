"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import StudyDashboard from "@/components/StudyDashboard";

export default function StudyPage() {
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
      <nav className="study-back"><Link href="/igcse">← Back to subjects</Link></nav>
      <StudyDashboard/>

    </div>
  </main>;
}
