"use client";

import { useState, type CSSProperties } from "react";
import { loadPhysicsPartOptions } from "@/lib/exportPhysicsWord";
import type { PhysicsPart, PhysicsSelection } from "@/lib/physicsParts";

function chipStyle(active: boolean, locked: boolean, partial = false): CSSProperties {
  return {
    minWidth: 58,
    padding: "7px 10px",
    borderRadius: 8,
    cursor: locked ? "not-allowed" : "pointer",
    border: active || partial ? "1px solid rgba(228,198,95,.72)" : "1px solid rgba(127,127,127,.28)",
    background: active ? "rgba(201,162,39,.18)" : "rgba(127,127,127,.06)",
    color: active || partial ? "#f0d77a" : "#9b978b",
    fontWeight: 800,
  };
}

export default function PhysicsPartPicker({ question, onChange }: {
  question: PhysicsSelection;
  onChange: (question: PhysicsSelection) => void;
}) {
  const [parts, setParts] = useState<PhysicsPart[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function show() {
    setOpen(!open);
    if ((parts && !error) || loading) return;
    setLoading(true);
    setError("");
    try {
      setParts(await loadPhysicsPartOptions(question));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load parts.");
    } finally {
      setLoading(false);
    }
  }

  const selected = question.selectedParts || parts?.map(p => p.key) || [];
  const groups = parts ? Array.from(new Set(parts.map(p => p.part))) : [];
  function toggle(keys: string[]) {
    if (!parts) return;
    const remove = keys.every(k => selected.includes(k));
    const next = parts.filter(p => remove ? selected.includes(p.key) && !keys.includes(p.key) : selected.includes(p.key) || keys.includes(p.key));
    if (!next.length) return;
    onChange({ ...question, selectedParts: next.length === parts.length ? undefined : next.map(p => p.key), marks: next.reduce((n, p) => n + p.marks, 0) });
  }

  return <div style={{ marginTop: 12, padding: "11px 12px", border: "1px solid rgba(201,162,39,.22)", borderRadius: 10, background: "rgba(201,162,39,.045)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", flexWrap: "wrap", marginBottom: open ? 8 : 0 }}>
      <b style={{ fontSize: 13 }}>Include question parts</b>
      <button type="button" onClick={() => void show()} aria-expanded={open} style={{ border: 0, padding: "2px 0", background: "transparent", color: "#f0d77a", font: "inherit", fontSize: 12, cursor: "pointer" }}>
        {open ? "Hide parts" : "Choose parts"}
      </button>
    </div>
    {open && <div>
      {loading && <p className="qMeta" role="status">Loading question parts…</p>}
      {error && <p role="alert">{error} The full question remains available.</p>}
      {parts?.length === 0 && <p className="qMeta">This question has no separate selectable parts.</p>}
      {parts && parts.length > 0 && <>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {groups.map(part => {
            const group = parts.filter(p => p.part === part);
            const all = group.every(p => selected.includes(p.key));
            const partial = !all && group.some(p => selected.includes(p.key));
            const locked = all && selected.length === group.length;
            return <button key={part} type="button" aria-pressed={partial ? "mixed" : all} disabled={locked} onClick={() => toggle(group.map(p => p.key))} style={chipStyle(all, locked, partial)} title={locked ? "Keep at least one part selected" : `${all ? "Remove" : "Include"} all of part (${part})`}>
              ({part}) · {group.reduce((n, p) => n + p.marks, 0)}{partial ? " · some selected" : ""}
            </button>;
          })}
        </div>
        {groups.map(part => {
          const group = parts.filter(p => p.part === part);
          if (!group.some(p => p.roman)) return null;
          return <div key={part} role="group" aria-label={`Subparts of (${part})`} style={{ marginTop: 10 }}>
            <div className="qMeta" style={{ marginBottom: 6 }}>Part ({part}) subparts</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {group.map(p => {
                const active = selected.includes(p.key);
                const locked = active && selected.length === 1;
                return <button key={p.key} type="button" aria-pressed={active} disabled={locked} onClick={() => toggle([p.key])} style={chipStyle(active, locked)} title={locked ? "Keep at least one part selected" : `${active ? "Remove" : "Include"} part (${part})${p.roman ? `(${p.roman})` : ""}`}>
                  ({part}){p.roman ? `(${p.roman})` : ""} · {p.marks}
                </button>;
              })}
            </div>
          </div>;
        })}
        <div className="qMeta" style={{ marginTop: 9 }}>Gold parts are included. Select a letter to include all its subparts, or choose individual subparts below.</div>
      </>}
    </div>}
  </div>;
}
