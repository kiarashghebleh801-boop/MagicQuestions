"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  email: string | null;
  role: "user" | "owner";
  banned: boolean;
  created_at: string;
  last_seen: string | null;
};

function activityLabel(lastSeen: string | null) {
  if (!lastSeen) return { label: "Never seen", kind: "offline" };
  const age = Date.now() - new Date(lastSeen).getTime();
  if (age < 2 * 60 * 1000) return { label: "Online now", kind: "online" };
  if (age < 15 * 60 * 1000) return { label: "Recently active", kind: "recent" };
  return { label: new Date(lastSeen).toLocaleString(), kind: "offline" };
}

export default function OwnerPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [owner, setOwner] = useState(false);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Profile[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) { router.replace("/login"); return; }

    let { data: me } = await supabase.from("profiles").select("id,email,role,banned,created_at,last_seen").eq("id", user.id).maybeSingle();
    if (!me) { setReady(true); return; }

    if (me.role !== "owner") {
      const { data: claimed } = await supabase.rpc("claim_first_owner");
      if (claimed) {
        const refreshed = await supabase.from("profiles").select("id,email,role,banned,created_at,last_seen").eq("id", user.id).single();
        me = refreshed.data;
      }
    }

    const isOwner = me?.role === "owner";
    setOwner(isOwner);
    if (!isOwner) { setReady(true); return; }

    await supabase.rpc("touch_last_seen");
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id,email,role,banned,created_at,last_seen")
      .order("last_seen", { ascending: false, nullsFirst: false });

    if (error) setMessage(error.message);
    setRows((profiles || []) as Profile[]);
    setReady(true);
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => (r.email || "").toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
  }, [rows, query]);

  const onlineCount = rows.filter(r => r.last_seen && Date.now() - new Date(r.last_seen).getTime() < 2 * 60 * 1000 && !r.banned).length;

  async function toggleBan(row: Profile) {
    const { error } = await supabase.from("profiles").update({ banned: !row.banned, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) setMessage(error.message);
    else {
      setMessage(row.banned ? "User unbanned." : "User banned.");
      await load();
    }
  }

  if (!ready) return <main className="authPage"><div className="authLogo"><span>✦</span> MagicQuestions</div></main>;

  if (!owner) return <main className="ownerPage"><div className="ownerDenied panel"><h1>Owner access only</h1><p>This account is not the MagicQuestions owner.</p><button onClick={() => router.push("/")}>Back to app</button></div></main>;

  return <main className="ownerPage">
    <header className="nav">
      <div className="brand"><span className="spark">✦</span> MagicQuestions <span className="ownerTag">Owner</span></div>
      <button className="accountButton" onClick={() => router.push("/")}>Back to app</button>
    </header>

    <section className="ownerWrap">
      <div className="ownerTop">
        <div>
          <p className="eyebrow">OWNER CONTROL PANEL</p>
          <h1>User management</h1>
          <p>See registered users, who is active right now, and ban or unban accounts.</p>
        </div>
        <div className="ownerStats">
          <div><b>{rows.length}</b><span>accounts</span></div>
          <div><b>{onlineCount}</b><span>online now</span></div>
          <div><b>{rows.filter(r => r.banned).length}</b><span>banned</span></div>
        </div>
      </div>

      <div className="panel ownerPanel">
        <div className="ownerToolbar">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search email or user ID…" />
          <button onClick={() => void load()}>Refresh</button>
        </div>
        {message && <div className="ownerMessage">{message}</div>}
        <div className="ownerTableWrap">
          <table className="ownerTable">
            <thead><tr><th>User</th><th>Joined</th><th>Last activity</th><th>Account</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.map(row => {
                const activity = activityLabel(row.last_seen);
                return <tr key={row.id}>
                  <td><b>{row.email || "No email"}</b><small>{row.id.slice(0, 8)}… {row.role === "owner" ? "· owner" : ""}</small></td>
                  <td>{new Date(row.created_at).toLocaleDateString()}</td>
                  <td><span className={`statusPill ${activity.kind === "online" ? "active" : ""}`}>{activity.label}</span></td>
                  <td><span className={row.banned ? "statusPill banned" : "statusPill active"}>{row.banned ? "Banned" : "Allowed"}</span></td>
                  <td><div className="ownerActions"><button className={row.banned ? "unban" : "ban"} onClick={() => void toggleBan(row)} disabled={row.role === "owner"}>{row.banned ? "Unban" : "Ban"}</button></div></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </main>;
}
