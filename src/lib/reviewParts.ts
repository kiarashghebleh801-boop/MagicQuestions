"use client";

import JSZip from "jszip";
import type { Question } from "./questions";
import { FORMATTED_BUCKET, getFormattedSource } from "./sourceDocs";
import { supabase } from "./supabase";

export type ReviewQuestion = Question & { selectedParts?: string[] };
export type ReviewPart = {
  key: string;
  originalPart?: string;
  label: string;
  marks: number;
};

const cache = new Map<string, Promise<string>>();

function textOf(node: Element): string {
  return Array.from(node.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "t"))
    .map(n => n.textContent || "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

async function documentXml(filename: string): Promise<string> {
  if (!cache.has(filename)) {
    cache.set(filename, (async () => {
      const { data, error } = await supabase.storage.from(FORMATTED_BUCKET).download(filename);
      if (error || !data) throw new Error(`Could not load ${filename}`);
      const zip = await JSZip.loadAsync(await data.arrayBuffer());
      const file = zip.file("word/document.xml");
      if (!file) throw new Error(`${filename} is not a valid Word document`);
      return file.async("text");
    })());
  }
  return cache.get(filename)!;
}

function questionNodes(xml: string, questionNumber: number): Element[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const body = Array.from(doc.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "body"))[0];
  if (!body) return [];
  const children = Array.from(body.children);
  let inside = false;
  const out: Element[] = [];
  for (const child of children) {
    const text = textOf(child);
    const q = text.match(/^Q(\d+)\.$/i);
    if (q) {
      if (inside) break;
      inside = Number(q[1]) === questionNumber;
      if (inside) out.push(child);
      continue;
    }
    if (inside) out.push(child);
  }
  return out;
}

function extractParts(nodes: Element[], totalMarks: number): ReviewPart[] {
  const paragraphs: string[] = [];
  for (const node of nodes) {
    if (node.localName === "p") paragraphs.push(textOf(node));
    else {
      for (const p of Array.from(node.getElementsByTagNameNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "p"))) {
        paragraphs.push(textOf(p));
      }
    }
  }

  const parts: { part: string; marks: number }[] = [];
  let current: { part: string; marks: number } | null = null;
  for (const text of paragraphs) {
    const main = text.match(/^\(([a-z])\)(?:\s|$)/i);
    if (main) {
      if (current) parts.push(current);
      current = { part: main[1].toLowerCase(), marks: 0 };
      continue;
    }
    if (!current) continue;
    const mark = text.match(/^\((\d+)\)$/);
    if (mark) current.marks += Number(mark[1]);
  }
  if (current) parts.push(current);

  if (!parts.length) return [{ key: "whole", label: "Whole question", marks: totalMarks }];
  const known = parts.reduce((sum, p) => sum + p.marks, 0);
  if (known !== totalMarks) {
    // Keep the structured parts, but make sure their maximum adds up to the bank total.
    // Any marks not exposed as standalone Word mark labels are assigned to the last part.
    parts[parts.length - 1].marks = Math.max(0, parts[parts.length - 1].marks + (totalMarks - known));
  }
  return parts.map(p => ({ key: p.part, originalPart: p.part, label: `(${p.part})`, marks: p.marks }));
}

export async function getReviewParts(q: ReviewQuestion): Promise<ReviewPart[]> {
  const filename = getFormattedSource(q);
  if (!filename) return [{ key: "whole", label: "Whole question", marks: q.marks }];
  try {
    const parts = extractParts(questionNodes(await documentXml(filename), q.questionNumber), q.marks);
    if (!q.selectedParts?.length || parts.length === 1 && parts[0].key === "whole") return parts;
    const wanted = new Set(q.selectedParts.map(p => p.toLowerCase()));
    const selected = parts.filter(p => p.originalPart && wanted.has(p.originalPart));
    if (!selected.length) return [{ key: "whole", label: "Whole question", marks: q.marks }];
    return selected.map((p, i) => ({ ...p, key: `${p.key}-${i}`, label: selected.length === 1 ? "Question" : `(${String.fromCharCode(97 + i)})` }));
  } catch {
    return [{ key: "whole", label: "Whole question", marks: q.marks }];
  }
}
