"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not continue with Google.");
      setGoogleLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          router.replace("/");
        } else {
          setMessage("Account created. Check your email to confirm your account, then log in.");
          setMode("login");
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authPage">
      <section className="authCard">
        <div className="authLogo"><span>✦</span> MagicQuestions</div>
        <p className="eyebrow">YOUR CUSTOM QUESTION BANK</p>
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="authSub">{mode === "login" ? "Log in to build and export your custom exam papers." : "Sign up to start building personalised exam papers."}</p>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleLoading || loading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "12px 14px",
            margin: "14px 0 4px",
            borderRadius: 12,
            border: "1px solid rgba(127,127,127,.28)",
            background: "var(--panel, #fff)",
            color: "inherit",
            fontWeight: 700,
            cursor: googleLoading || loading ? "not-allowed" : "pointer",
            opacity: googleLoading || loading ? .65 : 1,
          }}
        >
          <span aria-hidden="true" style={{fontSize:18,fontWeight:800}}>G</span>
          {googleLoading ? "Connecting to Google…" : "Continue with Google"}
        </button>

        <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0",opacity:.65}}>
          <div style={{height:1,background:"currentColor",flex:1,opacity:.22}} />
          <span style={{fontSize:12,fontWeight:700}}>OR</span>
          <div style={{height:1,background:"currentColor",flex:1,opacity:.22}} />
        </div>

        <div className="authTabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Log in</button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>Sign up</button>
        </div>
        <form onSubmit={submit} className="authForm">
          <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required /></label>
          {message && <div className="authMessage">{message}</div>}
          <button className="generate" disabled={loading || googleLoading}>{loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
        </form>
      </section>
    </main>
  );
}
