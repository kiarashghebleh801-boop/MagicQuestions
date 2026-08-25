"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = { id:string; email:string|null; role:"user"|"owner"; banned:boolean; created_at:string };
type Membership = { user_id:string; plan:"none"|"monthly"|"yearly"|"lifetime"; status:"inactive"|"active"|"past_due"|"cancelled"; source:"admin"|"stripe"; current_period_end:string|null };
type Row = Profile & { membership?: Membership };

export default function OwnerPage() {
  const router = useRouter();
  const [ready,setReady] = useState(false);
  const [owner,setOwner] = useState(false);
  const [query,setQuery] = useState("");
  const [rows,setRows] = useState<Row[]>([]);
  const [message,setMessage] = useState("");

  async function load() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) { router.replace("/login"); return; }

    let { data: me } = await supabase.from("profiles").select("id,email,role,banned,created_at").eq("id",user.id).maybeSingle();
    if (!me) {
      setReady(true);
      return;
    }

    if (me.role !== "owner") {
      const { data: claimed } = await supabase.rpc("claim_first_owner");
      if (claimed) {
        const refreshed = await supabase.from("profiles").select("id,email,role,banned,created_at").eq("id",user.id).single();
        me = refreshed.data;
      }
    }

    const isOwner = me?.role === "owner";
    setOwner(isOwner);
    if (!isOwner) { setReady(true); return; }

    const [{data:profiles},{data:memberships}] = await Promise.all([
      supabase.from("profiles").select("id,email,role,banned,created_at").order("created_at",{ascending:false}),
      supabase.from("memberships").select("user_id,plan,status,source,current_period_end"),
    ]);
    const membershipMap = new Map((memberships||[]).map(m => [m.user_id,m as Membership]));
    setRows((profiles||[]).map(p => ({...(p as Profile),membership:membershipMap.get(p.id)})));
    setReady(true);
  }

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => (r.email||"").toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
  },[rows,query]);

  async function setMembership(userId:string,plan:"none"|"monthly"|"yearly"|"lifetime") {
    const active = plan !== "none";
    const { data: auth } = await supabase.auth.getUser();
    const ownerId = auth.user?.id || null;
    const { error } = await supabase.from("memberships").update({
      plan,
      status: active ? "active" : "inactive",
      source:"admin",
      granted_by:ownerId,
      current_period_end:null,
      updated_at:new Date().toISOString(),
    }).eq("user_id",userId);
    if (error) setMessage(error.message); else { setMessage("Membership updated."); await load(); }
  }

  async function toggleBan(row:Row) {
    const { error } = await supabase.from("profiles").update({banned:!row.banned,updated_at:new Date().toISOString()}).eq("id",row.id);
    if (error) setMessage(error.message); else { setMessage(row.banned?"User unbanned.":"User banned."); await load(); }
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
        <div><p className="eyebrow">OWNER CONTROL PANEL</p><h1>Manage accounts</h1><p>Grant memberships manually, remove access, or ban accounts.</p></div>
        <div className="ownerStats"><div><b>{rows.length}</b><span>accounts</span></div><div><b>{rows.filter(r=>r.membership?.status==="active").length}</b><span>active</span></div><div><b>{rows.filter(r=>r.banned).length}</b><span>banned</span></div></div>
      </div>

      <div className="panel ownerPanel">
        <div className="ownerToolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search email or user ID…"/><button onClick={()=>void load()}>Refresh</button></div>
        {message && <div className="ownerMessage">{message}</div>}
        <div className="ownerTableWrap"><table className="ownerTable"><thead><tr><th>User</th><th>Membership</th><th>Source</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {visible.map(row => <tr key={row.id}>
            <td><b>{row.email||"No email"}</b><small>{row.id.slice(0,8)}… {row.role==="owner"?"· owner":""}</small></td>
            <td><span className="planPill">{row.membership?.plan||"none"}</span></td>
            <td>{row.membership?.source||"admin"}</td>
            <td><span className={row.banned?"statusPill banned":"statusPill active"}>{row.banned?"Banned":row.membership?.status||"inactive"}</span></td>
            <td><div className="ownerActions">
              <select value={row.membership?.plan||"none"} onChange={e=>void setMembership(row.id,e.target.value as "none"|"monthly"|"yearly"|"lifetime")} disabled={row.role==="owner"}>
                <option value="none">No access</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="lifetime">Lifetime</option>
              </select>
              <button className={row.banned?"unban":"ban"} onClick={()=>void toggleBan(row)} disabled={row.role==="owner"}>{row.banned?"Unban":"Ban"}</button>
            </div></td>
          </tr>)}
        </tbody></table></div>
      </div>
    </section>
  </main>;
}
