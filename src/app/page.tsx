"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("banned")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (profile?.banned) {
        router.replace("/banned");
        return;
      }

      router.replace("/igcse");
    });
  }, [router]);

  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#080808",color:"#f5e3a3"}}>
      <div className="authLogo" style={{margin:0,color:"inherit"}}><span style={{color:"#d4af37"}}>✦</span> MagicQuestions</div>
    </main>
  );
}
