import type { Question } from "./questions";
import type { MarkSchemeEntry } from "./exportScienceMarkScheme";
export type PhysicsSelection = Question & {
    selectedParts?: string[];
};
export type PhysicsPart = {
    key: string;
    part: string;
    roman: string;
    marks: number;
    start: number;
    end: number;
};
const romans = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
function plain(xml: string) {
    return Array.from(xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)).map(m => m[1]).join("").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}
function paragraphs(xml: string) {
    return Array.from(xml.matchAll(/<w:p(?=[\s>])[\s\S]*?<\/w:p>/g)).map(m => ({ start: m.index!, end: m.index! + m[0].length, text: plain(m[0]), xml: m[0] }));
}
export function physicsPartLayout(xml: string) {
    const ps = paragraphs(xml), groups: {
        part: string;
        start: number;
        end: number;
        introEnd: number;
        leaves: PhysicsPart[];
    }[] = [];
    let group: typeof groups[number] | undefined;
    for (const p of ps) {
        const main = p.text.match(/^\(([a-z])\)/i);
        if (main && main[1] === String.fromCharCode(97 + groups.length)) {
            if (group)
                group.end = p.start;
            group = { part: main[1], start: p.start, end: xml.length, introEnd: p.end, leaves: [] };
            groups.push(group);
        }
        if (!group)
            continue;
        const label = p.text.replace(new RegExp(`^\\(${group.part}\\)\\s*`), "").match(/^\(([ivx]+)\)/i);
        if (label && label[1] === romans[group.leaves.length]) {
            if (!group.leaves.length)
                group.introEnd = p.start;
            group.leaves.push({ key: `${group.part}.${label[1]}`, part: group.part, roman: label[1], marks: 0, start: p.start, end: xml.length });
        }
    }
    const total = ps.find(p => /total for (?:question|q\d)/i.test(p.text))?.start ?? xml.length;
    for (const g of groups) {
        g.end = Math.min(g.end, total);
        if (!g.leaves.length)
            g.leaves = [{ key: g.part, part: g.part, roman: "", marks: 0, start: g.start, end: g.end }];
        g.leaves.forEach((leaf, i) => {
            leaf.end = g.leaves[i + 1]?.start ?? g.end;
            // Every selectable boundary must be a top-level paragraph, never inside a table.
            const before = xml.slice(0, leaf.start);
            if ((before.match(/<w:tbl(?=[\s>])/g) || []).length !== (before.match(/<\/w:tbl>/g) || []).length)
                throw new Error("This question has parts inside a table and cannot be split safely.");
            leaf.marks = paragraphs(xml.slice(leaf.start, leaf.end)).reduce((n, p) => n + (p.text.match(/^\((\d+)\)$/)?.[1] ? Number(p.text.match(/^\((\d+)\)$/)![1]) : 0), 0);
        });
    }
    return { groups, parts: groups.flatMap(g => g.leaves), total };
}
export function selectPhysicsParts(xml: string, selected: string[] | undefined, marks: number) {
    if (!selected)
        return xml;
    const layout = physicsPartLayout(xml), available = new Set(layout.parts.map(p => p.key));
    if (!selected.length || selected.some(k => !available.has(k)))
        throw new Error("Choose at least one available Physics question part.");
    let out = xml.slice(0, layout.groups[0].start);
    for (const g of layout.groups) {
        const leaves = g.leaves.filter(p => selected.includes(p.key));
        if (!leaves.length)
            continue;
        if (g.leaves[0].roman) {
            if (g.introEnd > g.start)
                out += xml.slice(g.start, g.introEnd);
            else if (!selected.includes(g.leaves[0].key))
                out += `<w:p><w:r><w:t>(${g.part})</w:t></w:r></w:p>`;
        }
        out += leaves.map(p => xml.slice(p.start, p.end)).join("");
    }
    out = out.replace(/<w:br\b[^>]*w:type="page"[^>]*\/?\s*>/g, "").replace(/<w:pageBreakBefore\b[^>]*\/?\s*>/g, "");
    return out + `<w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="000000"/></w:rPr><w:t>(Total for question = ${marks} ${marks === 1 ? "mark" : "marks"})</w:t></w:r></w:p>`;
}
// Older Physics indexes store several roman answers in a single main-part row.
// Split those rows once in memory, keeping each diagram beside its own answer.
export function splitPhysicsMarkScheme(entries: MarkSchemeEntry[]): MarkSchemeEntry[] {
    const out: MarkSchemeEntry[] = [];
    let previousPart = "", previousRoman = "", pendingMarks: string[] = [];
    for (const row of entries) {
        if (row.part !== previousPart) {
            previousPart = row.part;
            previousRoman = "";
        }
        if (row.roman) {
            out.push(row);
            previousRoman = row.roman;
            continue;
        }
        const chunks: MarkSchemeEntry[] = [], fresh: MarkSchemeEntry[] = [];
        let active: MarkSchemeEntry = { ...row, roman: previousRoman, marks: "", content: [] };
        for (const block of row.content) {
            if (block.crop) {
                active.content.push(block);
                continue;
            }
            const text = block.text || "";
            let pos = 0;
            for (const m of Array.from(text.matchAll(/(?:^|\n)\(([ivx]+)\)\s*/g))) {
                if (m.index! > pos)
                    active.content.push({ text: text.slice(pos, m.index).trim() });
                if (active.content.length)
                    chunks.push(active);
                active = { ...row, roman: m[1], marks: "", content: [] };
                fresh.push(active);
                pos = m.index! + m[0].length;
            }
            if (pos < text.length)
                active.content.push({ text: text.slice(pos).trim() });
        }
        if (active.content.length)
            chunks.push(active);
        const scored = fresh, values = [...pendingMarks, ...row.marks.trim().split(/\s+/).filter(Boolean)];
        pendingMarks = [];
        if (scored.length && values.length >= scored.length) {
            scored.forEach((c, i) => c.marks = values[i]);
            pendingMarks = values.slice(scored.length);
        }
        else if (chunks.length === 1)
            chunks[0].marks = values.join(" ");
        else if (row.marks.trim())
            throw new Error("Could not separate the marks for this Physics answer reliably.");
        out.push(...chunks);
        previousRoman = active.roman;
    }
    if (pendingMarks.length)
        throw new Error("Some Physics marks could not be assigned to an answer.");
    return out;
}
