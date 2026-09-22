"use client";

import { useEffect, useState } from "react";
import JSZip from "jszip";
import type { Question } from "@/lib/questions";
import { getFormattedSource, getFormattedSourceBucket } from "@/lib/sourceDocs";
import { supabase } from "@/lib/supabase";

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

type Block =
  | { kind: "text"; text: string }
  | { kind: "table"; rows: string[][] }
  | { kind: "image"; src: string };

function textOf(node: Node): string {
  const out: string[] = [];
  const walk = (n: Node) => {
    if (n.nodeType === Node.ELEMENT_NODE) {
      const local = (n as Element).localName;
      if (local === "t") out.push(n.textContent || "");
      if (local === "tab") out.push(" ");
      if (local === "br") out.push("\n");
    }
    n.childNodes.forEach(walk);
  };
  walk(node);
  return out.join("").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

function questionMarker(node: Node): number | null {
  if (node.nodeType !== Node.ELEMENT_NODE || (node as Element).localName !== "p") return null;
  const match = textOf(node).match(/^Q(\d+)\.$/i);
  return match ? Number(match[1]) : null;
}

export default function ScienceQuestionDetails({ question }: { question: Question }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];

    async function load() {
      setLoading(true);
      setError("");
      try {
        const filename = getFormattedSource(question);
        if (!filename) throw new Error("Formatted source unavailable.");
        const { data, error } = await supabase.storage.from(getFormattedSourceBucket(question)).download(filename);
        if (error || !data) throw new Error(error?.message || "Could not download source question.");

        const zip = await JSZip.loadAsync(await data.arrayBuffer());
        const documentText = await zip.file("word/document.xml")?.async("text");
        const relsText = await zip.file("word/_rels/document.xml.rels")?.async("text");
        if (!documentText || !relsText) throw new Error("Invalid Word source.");

        const parser = new DOMParser();
        const xml = parser.parseFromString(documentText, "application/xml");
        const relXml = parser.parseFromString(relsText, "application/xml");
        const rels = new Map<string, string>();
        Array.from(relXml.getElementsByTagName("Relationship")).forEach(rel => {
          const id = rel.getAttribute("Id");
          const target = rel.getAttribute("Target");
          if (id && target) rels.set(id, target.replace(/^\.\//, ""));
        });

        const body = Array.from(xml.getElementsByTagNameNS(W_NS, "body"))[0];
        if (!body) throw new Error("Question source has no document body.");
        const children = Array.from(body.childNodes).filter(n => n.nodeType === Node.ELEMENT_NODE) as Element[];
        const start = children.findIndex(node => questionMarker(node) === question.questionNumber);
        if (start < 0) throw new Error(`Could not find Q${question.questionNumber} in the source paper.`);
        let end = children.length;
        for (let i = start + 1; i < children.length; i++) {
          if (questionMarker(children[i]) !== null) { end = i; break; }
        }

        const next: Block[] = [];
        for (const node of children.slice(start, end)) {
          if (node.localName === "tbl") {
            const rows = Array.from(node.getElementsByTagNameNS(W_NS, "tr")).map(row =>
              Array.from(row.getElementsByTagNameNS(W_NS, "tc")).map(cell => textOf(cell))
            );
            if (rows.length) next.push({ kind: "table", rows });
            continue;
          }
          if (node.localName !== "p") continue;
          const text = textOf(node);
          if (/^Q\d+\.$/i.test(text) || /total\s+for\s+(?:question|paper)/i.test(text) || /^\.{10,}/.test(text)) {
            continue;
          }
          if (text) next.push({ kind: "text", text });

          const drawing = node.getElementsByTagNameNS(W_NS, "drawing")[0] || node.getElementsByTagNameNS(W_NS, "pict")[0];
          if (drawing) {
            const all = Array.from(drawing.getElementsByTagName("*"));
            const ref = all.find(el => el.hasAttribute("r:embed") || el.hasAttribute("r:id"));
            const relId = ref?.getAttribute("r:embed") || ref?.getAttribute("r:id");
            const target = relId ? rels.get(relId) : undefined;
            if (target) {
              const file = zip.file(`word/${target}`);
              if (file) {
                const ext = target.split(".").pop()?.toLowerCase() || "png";
                const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : "image/png";
                const url = URL.createObjectURL(new Blob([await file.async("uint8array")], { type: mime }));
                objectUrls.push(url);
                next.push({ kind: "image", src: url });
              }
            }
          }
        }

        if (active) setBlocks(next);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load question details.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [question.id, question.questionNumber, question.paper, question.year, question.session]);

  if (loading) return <div style={{padding:"14px 0",fontSize:12,color:"#a7a7a7"}}>Loading full question…</div>;
  if (error) return <div style={{padding:"12px 0",fontSize:12,color:"#ff9a9a"}}>{error}</div>;

  return <div style={{marginTop:10,padding:"14px",background:"#0a0a0a",border:"1px solid rgba(201,162,39,.18)",borderRadius:10}}>
    <div style={{fontSize:10,fontWeight:900,letterSpacing:".12em",color:"#cdb35b",marginBottom:10}}>FULL QUESTION</div>
    <div style={{fontFamily:"Arial, Helvetica, sans-serif",fontSize:13,lineHeight:1.52,color:"#ededed"}}>
      {blocks.length===0 ? <div style={{color:"#888"}}>No additional question text was found.</div> : blocks.map((block,index)=>{
        if(block.kind==="text") return <div key={index} style={{margin:"5px 0",whiteSpace:"pre-wrap"}}>{block.text}</div>;
        if(block.kind==="image") return <img key={index} src={block.src} alt="Question diagram" style={{display:"block",maxWidth:"100%",maxHeight:300,objectFit:"contain",margin:"10px auto"}}/>;
        return <div key={index} style={{overflowX:"auto",margin:"10px 0"}}><table style={{borderCollapse:"collapse",fontSize:12,minWidth:"55%"}}><tbody>{block.rows.map((row,r)=><tr key={r}>{row.map((cell,c)=><td key={c} style={{border:"1px solid #666",padding:"6px 8px"}}>{cell}</td>)}</tr>)}</tbody></table></div>;
      })}
    </div>
  </div>;
}
