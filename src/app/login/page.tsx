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
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirmed`,
          },
        });
        if (error) throw error;

        const existingAccount = data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;
        if (existingAccount) {
          setMode("login");
          setPassword("");
          setMessage("You already have an account with this email. Log in instead.");
          return;
        }

        if (data.session) {
          router.replace("/");
        } else {
          setMessage("Account created. Check your email to confirm your account.");
          setMode("login");
        }
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : "Something went wrong.";
      if (mode === "signup" && /already|registered|exists/i.test(text)) {
        setMode("login");
        setPassword("");
        setMessage("You already have an account with this email. Log in instead.");
      } else {
        setMessage(text);
      }
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
        <div className="authTabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Log in</button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>Sign up</button>
        </div>
        <form onSubmit={submit} className="authForm">
          <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required /></label>
          {message && <div className="authMessage">{message}</div>}
          <button className="generate" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
        </form>
      </section>
    </main>
  );
}
