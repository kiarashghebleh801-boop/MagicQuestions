"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setReady(!!data.session);
      if (!data.session) setMessage("Open this page from the password-reset email link.");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setMessage("");
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("The passwords do not match.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password updated successfully. You can now log in with your new password.");
    setPassword("");
    setConfirm("");
    window.setTimeout(() => router.replace("/login"), 1200);
  }

  return <main className="authPage">
    <section className="authCard">
      <div className="authLogo"><span>✦</span> MagicQuestions</div>
      <p className="eyebrow">PASSWORD RECOVERY</p>
      <h1>Choose a new password</h1>
      <p className="authSub">Your old password is never shown or stored in readable form.</p>

      {ready ? <form onSubmit={submit} className="authForm">
        <label>New password<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required /></label>
        <label>Confirm password<input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={6} required /></label>
        {message && <div className="authMessage">{message}</div>}
        <button className="generate" disabled={saving}>{saving ? "Updating…" : "Update password"}</button>
      </form> : <>
        {message && <div className="authMessage">{message}</div>}
        <button className="generate" onClick={() => router.replace("/login")}>Back to login</button>
      </>}
    </section>
  </main>;
}
