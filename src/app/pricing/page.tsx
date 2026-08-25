"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PricingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"monthly"|"yearly"|null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setEmail(data.session.user.email || "Account");
    });
  }, [router]);

  async function checkout(plan: "monthly"|"yearly") {
    setLoading(plan);
    setMessage("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Please log in again.");
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not start checkout.");
      window.location.href = body.url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start checkout.");
    } finally {
      setLoading(null);
    }
  }

  return <main className="pricingPage">
    <header className="nav">
      <div className="brand"><span className="spark">✦</span> MagicQuestions</div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}><div className="badge">{email}</div><button className="accountButton" onClick={() => router.push("/")}>Back to app</button></div>
    </header>

    <section className="pricingHero">
      <p className="eyebrow">SIMPLE PRICING</p>
      <h1>Unlimited custom papers.<br/><span>Less than a coffee.</span></h1>
      <p>Choose monthly flexibility or save with the yearly plan.</p>
    </section>

    <section className="pricingGrid">
      <article className="priceCard">
        <div className="priceLabel">Monthly</div>
        <div className="price"><strong>£1</strong><span>/ month</span></div>
        <div className="usdPrice">≈ $1.36 USD / month</div>
        <ul><li>Unlimited paper generation</li><li>Full formatted question bank</li><li>Word exports</li><li>Swap and reorder questions</li></ul>
        <button onClick={() => checkout("monthly")} disabled={loading!==null}>{loading==="monthly"?"Opening checkout…":"Start monthly"}</button>
      </article>

      <article className="priceCard featured">
        <div className="saveBadge">BEST VALUE · SAVE 17%</div>
        <div className="priceLabel">Yearly</div>
        <div className="price"><strong>£10</strong><span>/ year</span></div>
        <div className="usdPrice">≈ $13.64 USD / year · about £0.83/month</div>
        <ul><li>Everything in Monthly</li><li>2 months effectively free</li><li>One payment per year</li><li>Same unlimited access</li></ul>
        <button onClick={() => checkout("yearly")} disabled={loading!==null}>{loading==="yearly"?"Opening checkout…":"Choose yearly"}</button>
      </article>
    </section>

    {message && <div className="pricingMessage">{message}</div>}
    <p className="pricingFine">USD amounts are approximate and move with the exchange rate. Billing is charged in GBP.</p>
  </main>;
}
