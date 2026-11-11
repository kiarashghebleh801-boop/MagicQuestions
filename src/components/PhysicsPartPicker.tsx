"use client";
import { useState } from "react";
import { loadPhysicsPartOptions } from "@/lib/exportPhysicsWord";
import type { PhysicsPart, PhysicsSelection } from "@/lib/physicsParts";
export default function PhysicsPartPicker({ question, onChange }: {
    question: PhysicsSelection;
    onChange: (question: PhysicsSelection) => void;
}) {
    const [parts, setParts] = useState<PhysicsPart[] | null>(null), [open, setOpen] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState("");
    async function show() {
        setOpen(!open);
        if ((parts && !error) || loading)
            return;
        setLoading(true);
        setError("");
        try {
            setParts(await loadPhysicsPartOptions(question));
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Could not load parts.");
        }
        finally {
            setLoading(false);
        }
    }
    const selected = question.selectedParts || parts?.map(p => p.key) || [];
    function toggle(keys: string[]) {
        if (!parts)
            return;
        const remove = keys.every(k => selected.includes(k));
        const next = parts.filter(p => remove ? selected.includes(p.key) && !keys.includes(p.key) : selected.includes(p.key) || keys.includes(p.key));
        if (!next.length)
            return;
        onChange({ ...question, selectedParts: next.length === parts.length ? undefined : next.map(p => p.key), marks: next.reduce((n, p) => n + p.marks, 0) });
    }
    return <div style={{ marginTop: 12 }}><button type="button" onClick={() => void show()} aria-expanded={open}>{open ? "Hide part selection" : "Choose question parts"}</button>{open && <div style={{ marginTop: 10 }}>{loading && <p role="status">Loading question parts…</p>}{error && <p role="alert">{error} The full question remains available.</p>}{parts?.length === 0 && <p>This question has no separate selectable parts.</p>}{parts && Array.from(new Set(parts.map(p => p.part))).map(part => {
                const group = parts.filter(p => p.part === part), all = group.every(p => selected.includes(p.key));
                return <fieldset key={part} style={{ border: "1px solid rgba(201,162,39,.3)", borderRadius: 8, margin: "8px 0", padding: 10 }}><legend>Part ({part})</legend><label><input type="checkbox" ref={input => { if (input)
                    input.indeterminate = !all && group.some(p => selected.includes(p.key)); }} disabled={all && selected.length === group.length} checked={all} onChange={() => toggle(group.map(p => p.key))}/> All of ({part}) · {group.reduce((n, p) => n + p.marks, 0)} marks</label>{group.some(p => p.roman) && <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>{group.map(p => <label key={p.key}><input type="checkbox" disabled={selected.includes(p.key) && selected.length === 1} checked={selected.includes(p.key)} onChange={() => toggle([p.key])}/> ({part})({p.roman}) · {p.marks} {p.marks === 1 ? "mark" : "marks"}</label>)}</div>}</fieldset>;
            })}{parts && parts.length > 0 && <small>Keep at least one part selected. Shared context is included; original part labels are kept in the exports.</small>}</div>}</div>;
}
