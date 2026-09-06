"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EmailConfirmedPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "verified" | "login">("checking");

  useEffect(() => {
    let active = true;

    async function finish() {
      // detectSessionInUrl is enabled on the shared Supabase client, so if the
      // confirmation link includes a session it is picked up automatically.
      await new Promise(resolve => setTimeout(resolve, 350));
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        setStatus("verified");
        setTimeout(() => router.replace("/"), 900);
      } else {
        // The email can still be successfully confirmed even when Supabase
        // does not create a browser session from the confirmation link.
        setStatus("login");
      }
    }

    void finish();
    return () => { active = false; };
  }, [router]);

  return (
    <main className="authPage">
      <section className="authCard" style={{textAlign:"center"}}>
        <div className="authLogo"><span>✦</span> MagicQuestions</div>
        <p className="eyebrow">EMAIL VERIFICATION</p>
        {status === "checking" ? <>
          <h1>Verifying your email…</h1>
          <p className="authSub">Just a moment while we finish confirming your account.</p>
        </> : status === "verified" ? <>
          <h1>Email verified ✓</h1>
          <p className="authSub">Your account is confirmed. Taking you into MagicQuestions now.</p>
        </> : <>
          <h1>Email verified ✓</h1>
          <p className="authSub">Your account is confirmed. You can log in normally now.</p>
          <button className="generate" onClick={() => router.replace("/login")}>Continue to log in</button>
        </>}
      </section>
    </main>
  );
}
