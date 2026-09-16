"use client";

import { useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import type { MathsPaperQuestion } from "./MathsPartPicker";
import { FORMATTED_BUCKET, getFormattedSource } from "@/lib/sourceDocs";
import { supabase } from "@/lib/supabase";

type PreviewBlock =
  | { kind: "paragraph"; text: string; image?: string; align?: "left" | "center" | "right"; bold?: boolean }
  | { kind: "table"; rows: string[][] };

type LoadedPreviewDoc = {
  zip: JSZip;
  xml: XMLDocument;
  rels: Map<string, string>;
};

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const cache = new Map<string, Promise<LoadedPreviewDoc>>();

function textOf(node: Node): string {
  const parts: string[] = [];
  const walk = (current: Node) => {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const local = (current as Element).localName;
      if (local === "t") parts.push(current.textContent || "");
      else if (local === "tab") parts.push("\t");
      else if (local === "br") parts.push("\n");
    }
    current.childNodes.forEach(walk);
  };
  walk(node);
  return parts.join("").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

function paragraphQuestionNumber(node: Node): number | null {
  if (node.nodeType !== Node.ELEMENT_NODE || (node as Element).localName !== "p") return null;
  const match = textOf(node).match(/^Q(\d+)\.$/i);
  return match ? Number(match[1]) : null;
}

async function loadPreviewDoc(filename: string): Promise<LoadedPreviewDoc> {
  if (!cache.has(filename)) {
    cache.set(filename, (async () => {
      const { data, error } = await supabase.storage.from(FORMATTED_BUCKET).download(filename);
      if (error || !data) throw new Error(error?.message || `Could not download ${filename}`);
      const zip = await JSZip.loadAsync(await data.arrayBuffer());
      const documentText = await zip.file("word/document.xml")?.async("text");
      const relsText = await zip.file("word/_rels/document.xml.rels")?.async("text");
      if (!documentText || !relsText) throw new Error(`${filename} is not a valid Word document`);
      const parser = new DOMParser();
      const xml = parser.parseFromString(documentText, "application/xml");
      const relXml = parser.parseFromString(relsText, "application/xml");
      const rels = new Map<string, string>();
      Array.from(relXml.getElementsByTagName("Relationship")).forEach(rel => {
        const id = rel.getAttribute("Id");
        const target = rel.getAttribute("Target");
        if (id && target) rels.set(id, target.replace(/^\.\//, ""));
      });
      return { zip, xml, rels };
    })());
  }
  return cache.get(filename)!;
}

async function imageFor(node: Element, doc: LoadedPreviewDoc): Promise<string | undefined> {
  const drawing = node.getElementsByTagNameNS(W_NS, "drawing")[0] || node.getElementsByTagNameNS(W_NS, "pict")[0];
  if (!drawing) return undefined;
  const all = Array.from(drawing.getElementsByTagName("*"));
  const embedder = all.find(el => el.hasAttribute("r:embed") || el.hasAttribute("r:id"));
  const relId = embedder?.getAttribute("r:embed") || embedder?.getAttribute("r:id");
  if (!relId) return undefined;
  const target = doc.rels.get(relId);
  if (!target) return undefined;
  const file = doc.zip.file(`word/${target}`);
  if (!file) return undefined;
  const ext = target.split(".").pop()?.toLowerCase() || "png";
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : "image/png";
  return URL.createObjectURL(new Blob([await file.async("uint8array")], { type: mime }));
}

function paragraphAlign(node: Element): "left" | "center" | "right" {
  const jc = node.getElementsByTagNameNS(W_NS, "jc")[0]?.getAttributeNS(W_NS, "val") || node.getElementsByTagNameNS(W_NS, "jc")[0]?.getAttribute("w:val");
  if (jc === "center") return "center";
  if (jc === "right" || jc === "end") return "right";
  return "left";
}

async function blocksForQuestion(question: MathsPaperQuestion): Promise<PreviewBlock[]> {
  const filename = getFormattedSource(question);
  if (!filename) throw new Error(`No formatted source for ${question.paper} Q${question.questionNumber}`);
  const doc = await loadPreviewDoc(filename);
  const body = Array.from(doc.xml.getElementsByTagNameNS(W_NS, "body"))[0];
  if (!body) throw new Error("Word document has no body");
  const children = Array.from(body.childNodes).filter(n => n.nodeType === Node.ELEMENT_NODE) as Element[];
  const start = children.findIndex(node => paragraphQuestionNumber(node) === question.questionNumber);
  if (start < 0) throw new Error(`Could not find Q${question.questionNumber} in ${filename}`);
  let end = children.length;
  for (let i = start + 1; i < children.length; i++) {
    if (paragraphQuestionNumber(children[i]) !== null) { end = i; break; }
  }

  const blocks: PreviewBlock[] = [];
  for (const node of children.slice(start, end)) {
    if (node.localName === "sectPr") continue;
    if (node.localName === "tbl") {
      const rows = Array.from(node.getElementsByTagNameNS(W_NS, "tr")).map(row =>
        Array.from(row.getElementsByTagNameNS(W_NS, "tc")).map(cell => textOf(cell))
      );
      if (rows.length) blocks.push({ kind: "table", rows });
      continue;
    }
    if (node.localName !== "p") continue;
    const text = textOf(node);
    if (/total\s+for\s+paper/i.test(text)) continue;
    const image = await imageFor(node, doc);
    const bold = !!node.getElementsByTagNameNS(W_NS, "b").length;
    if (text || image) blocks.push({ kind: "paragraph", text, image, align: paragraphAlign(node), bold });
  }

  const selected = question.selectedParts?.map(p => p.toLowerCase());
  if (!selected?.length) return blocks;

  const partStarts: { index: number; part: string }[] = [];
  blocks.forEach((block, index) => {
    if (block.kind !== "paragraph") return;
    const match = block.text.match(/^\(([a-z])\)(?:\s|$)/i);
    if (match) partStarts.push({ index, part: match[1].toLowerCase() });
  });
  if (!partStarts.length) return blocks;

  const first = partStarts[0].index;
  const output = blocks.slice(0, first);
  let newPartIndex = 0;
  for (let i = 0; i < partStarts.length; i++) {
    const current = partStarts[i];
    if (!selected.includes(current.part)) continue;
    const next = i + 1 < partStarts.length ? partStarts[i + 1].index : blocks.length;
    const slice = blocks.slice(current.index, next).map(block => ({ ...block })) as PreviewBlock[];
    const firstBlock = slice[0];
    if (firstBlock?.kind === "paragraph") {
      if (selected.length === 1) firstBlock.text = firstBlock.text.replace(/^\([a-z]\)\s*/i, "");
      else firstBlock.text = firstBlock.text.replace(/^\([a-z]\)/i, `(${String.fromCharCode(97 + newPartIndex)})`);
    }
    output.push(...slice);
    newPartIndex++;
  }
  output.push({ kind: "paragraph", text: `(Total for question = ${question.marks} ${question.marks === 1 ? "mark" : "marks"})`, align: "right", bold: true });
  return output;
}

function cleanAnswerLine(text: string): { text: string; answerOnly: boolean } {
  const trimmed = text.trim();
  if (/^\.{20,}$/.test(trimmed.replace(/\s/g, ""))) return { text: "·".repeat(34), answerOnly: true };
  return { text: text.replace(/\.{45,}/g, "·".repeat(34)), answerOnly: false };
}

export default function MathsVisualPreview({ paper }: { paper: MathsPaperQuestion[] }) {
  const [questions, setQuestions] = useState<PreviewBlock[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const key = useMemo(() => paper.map(q => `${q.id}:${q.marks}:${q.selectedParts?.join("") || "all"}`).join("|"), [paper]);

  useEffect(() => {
    let active = true;
    const urlsBefore = new Set<string>();
    setLoading(true);
    setError("");
    Promise.all(paper.map(blocksForQuestion)).then(result => {
      if (!active) return;
      setQuestions(result);
      setLoading(false);
      result.flat().forEach(block => { if (block.kind === "paragraph" && block.image) urlsBefore.add(block.image); });
    }).catch(err => {
      if (!active) return;
      setError(err instanceof Error ? err.message : "Could not build the preview.");
      setLoading(false);
    });
    return () => {
      active = false;
      urlsBefore.forEach(url => URL.revokeObjectURL(url));
    };
  }, [key]);

  if (!paper.length) return <div style={{padding:30,textAlign:"center",opacity:.6}}>Generate a Maths paper to preview it.</div>;

  return <div style={{position:"relative"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:10}}>
      <div><b style={{fontSize:13}}>Live Word-style preview</b><div style={{fontSize:11,opacity:.58,marginTop:2}}>Scroll through the paper before downloading it.</div></div>
      {loading && <span style={{fontSize:11,color:"#d2ad36"}}>Updating…</span>}
    </div>
    {error && <div style={{padding:12,border:"1px solid rgba(255,100,100,.25)",borderRadius:10,color:"#ff9b9b",fontSize:12,marginBottom:10}}>{error}</div>}
    <div style={{height:"72vh",overflowY:"auto",overflowX:"hidden",background:"#080808",border:"1px solid rgba(201,162,39,.22)",borderRadius:14,padding:"16px 10px"}}>
      <div style={{width:"100%",maxWidth:720,margin:"0 auto",background:"white",color:"#111",minHeight:960,boxShadow:"0 10px 36px rgba(0,0,0,.42)",padding:"54px 58px",fontFamily:"Arial, Helvetica, sans-serif",fontSize:13,lineHeight:1.48}}>
        <div style={{borderBottom:"2px solid #111",paddingBottom:12,marginBottom:28,display:"flex",justifyContent:"space-between",gap:12}}>
          <div><div style={{fontWeight:800,fontSize:18}}>Edexcel IGCSE Mathematics</div><div style={{fontSize:11,marginTop:4,color:"#555"}}>MagicQuestions custom paper preview</div></div>
          <div style={{fontWeight:700,textAlign:"right"}}>{paper.reduce((sum,q)=>sum+q.marks,0)} marks</div>
        </div>
        {questions.map((blocks, qIndex) => <section key={`${paper[qIndex]?.id}-${qIndex}`} style={{marginBottom:34,pageBreakInside:"avoid"}}>
          {blocks.map((block, index) => {
            if (block.kind === "table") return <table key={index} style={{borderCollapse:"collapse",margin:"10px auto 14px",fontSize:12}}><tbody>{block.rows.map((row,r)=><tr key={r}>{row.map((cell,c)=><td key={c} style={{border:"1px solid #555",padding:"6px 10px"}}>{cell}</td>)}</tr>)}</tbody></table>;
            const answer = cleanAnswerLine(block.text);
            const isQuestion = /^Q\d+\.$/.test(block.text);
            return <div key={index} style={{textAlign:answer.answerOnly?"right":block.align||"left",fontWeight:isQuestion||block.bold?700:400,margin:isQuestion?"22px 0 10px":"5px 0",whiteSpace:"pre-wrap"}}>
              {block.image && <img src={block.image} alt="Question diagram" style={{display:"block",maxWidth:"78%",maxHeight:330,objectFit:"contain",margin:block.align==="center"?"10px auto":"10px 0"}}/>}
              {answer.text && <span>{isQuestion ? `Q${qIndex+1}.` : answer.text}</span>}
            </div>;
          })}
        </section>)}
      </div>
    </div>
    <div style={{fontSize:10,opacity:.48,marginTop:8,lineHeight:1.45}}>Preview is designed to closely mirror the generated Word paper. Word may make small page-break or font-rendering adjustments when the DOCX is opened.</div>
  </div>;
}
