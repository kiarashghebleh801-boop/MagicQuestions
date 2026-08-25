"use client";

import JSZip from "jszip";
import type { Question } from "./questions";
import { supabase } from "./supabase";
import { FORMATTED_BUCKET, getFormattedSource } from "./sourceDocs";

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships";

type LoadedDoc = {
  filename: string;
  zip: JSZip;
  documentXml: XMLDocument;
  relsXml: XMLDocument;
};

const sourceCache = new Map<string, Promise<LoadedDoc>>();

function parseXml(text: string): XMLDocument {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("Invalid DOCX XML");
  return doc;
}

function serializeXml(doc: XMLDocument): string {
  return new XMLSerializer().serializeToString(doc);
}

function nodeText(node: Node): string {
  const out: string[] = [];
  const walk = (n: Node) => {
    if (n.nodeType === Node.ELEMENT_NODE && (n as Element).localName === "t") out.push(n.textContent || "");
    n.childNodes.forEach(walk);
  };
  walk(node);
  return out.join("").replace(/\s+/g, " ").trim();
}

function isQuestionMarker(node: Node): number | null {
  if (node.nodeType !== Node.ELEMENT_NODE || (node as Element).localName !== "p") return null;
  const match = nodeText(node).match(/^Q(\d+)\.$/i);
  return match ? Number(match[1]) : null;
}

function getBody(doc: XMLDocument): Element {
  const body = Array.from(doc.getElementsByTagNameNS(W_NS, "body"))[0];
  if (!body) throw new Error("DOCX has no Word body");
  return body;
}

function extractQuestionNodes(doc: XMLDocument, questionNumber: number): Node[] {
  const children = Array.from(getBody(doc).childNodes).filter(n => n.nodeType === Node.ELEMENT_NODE);
  const start = children.findIndex(n => isQuestionMarker(n) === questionNumber);
  if (start < 0) throw new Error(`Could not find Q${questionNumber}. in formatted source`);

  let end = children.length;
  for (let i = start + 1; i < children.length; i++) {
    if (isQuestionMarker(children[i]) !== null || (children[i] as Element).localName === "sectPr") {
      end = i;
      break;
    }
  }
  return children.slice(start, end).map(n => n.cloneNode(true));
}

function renumberQuestionMarker(nodes: Node[], newNumber: number) {
  const first = nodes.find(n => isQuestionMarker(n) !== null) as Element | undefined;
  if (!first) return;
  const texts = Array.from(first.getElementsByTagNameNS(W_NS, "t"));
  for (const t of texts) {
    if (/Q\d+\./i.test(t.textContent || "")) {
      t.textContent = (t.textContent || "").replace(/Q\d+\./i, `Q${newNumber}.`);
      return;
    }
  }
}

async function loadSource(filename: string): Promise<LoadedDoc> {
  if (!sourceCache.has(filename)) {
    sourceCache.set(filename, (async () => {
      const { data, error } = await supabase.storage.from(FORMATTED_BUCKET).download(filename);
      if (error || !data) throw new Error(`Could not download ${filename}: ${error?.message || "unknown error"}`);
      const zip = await JSZip.loadAsync(await data.arrayBuffer());
      const documentFile = zip.file("word/document.xml");
      const relsFile = zip.file("word/_rels/document.xml.rels");
      if (!documentFile || !relsFile) throw new Error(`${filename} is not a valid Word document`);
      return {
        filename,
        zip,
        documentXml: parseXml(await documentFile.async("text")),
        relsXml: parseXml(await relsFile.async("text")),
      };
    })());
  }
  return sourceCache.get(filename)!;
}

function relationshipMap(rels: XMLDocument) {
  const map = new Map<string, Element>();
  for (const rel of Array.from(rels.getElementsByTagName("Relationship"))) {
    const id = rel.getAttribute("Id");
    if (id) map.set(id, rel);
  }
  return map;
}

function referencedRelationshipIds(nodes: Node[]): Set<string> {
  const ids = new Set<string>();
  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      for (const attr of Array.from(el.attributes)) {
        if (attr.namespaceURI === R_NS || attr.name === "r:embed" || attr.name === "r:id" || attr.name === "r:link") {
          if (attr.value) ids.add(attr.value);
        }
      }
    }
    node.childNodes.forEach(walk);
  };
  nodes.forEach(walk);
  return ids;
}

function replaceRelationshipId(nodes: Node[], oldId: string, newId: string) {
  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      for (const attr of Array.from(el.attributes)) {
        if ((attr.namespaceURI === R_NS || attr.name.startsWith("r:")) && attr.value === oldId) {
          el.setAttributeNS(R_NS, attr.name, newId);
        }
      }
    }
    node.childNodes.forEach(walk);
  };
  nodes.forEach(walk);
}

function nextRelationshipId(rels: XMLDocument, counter: { value: number }): string {
  const used = new Set(Array.from(rels.getElementsByTagName("Relationship")).map(r => r.getAttribute("Id")));
  let id = `rIdMQ${counter.value++}`;
  while (used.has(id)) id = `rIdMQ${counter.value++}`;
  return id;
}

async function copyRelationships(
  nodes: Node[],
  source: LoadedDoc,
  targetZip: JSZip,
  targetRels: XMLDocument,
  counters: { rel: number; media: number },
) {
  const sourceMap = relationshipMap(source.relsXml);
  const ids = referencedRelationshipIds(nodes);

  for (const oldId of ids) {
    const sourceRel = sourceMap.get(oldId);
    if (!sourceRel) continue;

    const type = sourceRel.getAttribute("Type") || "";
    const target = sourceRel.getAttribute("Target") || "";
    const mode = sourceRel.getAttribute("TargetMode");
    const newId = nextRelationshipId(targetRels, { value: counters.rel });
    counters.rel++;

    let newTarget = target;
    const isMedia = /\/image$/i.test(type) || target.startsWith("media/");

    if (isMedia) {
      const sourcePath = `word/${target.replace(/^\.\//, "")}`;
      const sourceFile = source.zip.file(sourcePath);
      if (!sourceFile) throw new Error(`Missing embedded image ${sourcePath} in ${source.filename}`);
      const ext = (target.match(/\.([A-Za-z0-9]+)$/)?.[1] || "png").toLowerCase();
      newTarget = `media/mq_${counters.media++}.${ext}`;
      targetZip.file(`word/${newTarget}`, await sourceFile.async("uint8array"));
    }

    const rel = targetRels.createElementNS(REL_NS, "Relationship");
    rel.setAttribute("Id", newId);
    rel.setAttribute("Type", type);
    rel.setAttribute("Target", newTarget);
    if (mode) rel.setAttribute("TargetMode", mode);
    targetRels.documentElement.appendChild(rel);
    replaceRelationshipId(nodes, oldId, newId);
  }
}

function renumberDrawingIds(doc: XMLDocument) {
  let id = 1;
  const all = Array.from(doc.getElementsByTagName("*"));
  for (const el of all) {
    if (el.localName === "docPr") el.setAttribute("id", String(id++));
  }
}

function downloadBlob(bytes: Uint8Array) {
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "MagicQuestions-ExamWizard-Paper.docx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function exportPaperToWord(questions: Question[]) {
  if (!questions.length) return;

  const missing = questions.filter(q => !getFormattedSource(q));
  if (missing.length) {
    const labels = missing.map(q => `${q.session} ${q.year} ${q.paper} Q${q.questionNumber}`).join(", ");
    throw new Error(`Formatted Word source not uploaded/mapped yet for: ${labels}`);
  }

  const sources = await Promise.all(questions.map(q => loadSource(getFormattedSource(q)!)));

  // Use the first selected formatted paper as the package/style/header/footer template.
  const templateBytes = await sources[0].zip.generateAsync({ type: "uint8array" });
  const outputZip = await JSZip.loadAsync(templateBytes);
  const outputDocFile = outputZip.file("word/document.xml");
  const outputRelsFile = outputZip.file("word/_rels/document.xml.rels");
  if (!outputDocFile || !outputRelsFile) throw new Error("Template Word document is incomplete");

  const outputDoc = parseXml(await outputDocFile.async("text"));
  const outputRels = parseXml(await outputRelsFile.async("text"));
  const body = getBody(outputDoc);
  const sectPr = Array.from(body.childNodes).find(n => n.nodeType === Node.ELEMENT_NODE && (n as Element).localName === "sectPr")?.cloneNode(true) || null;

  while (body.firstChild) body.removeChild(body.firstChild);

  const counters = { rel: 1, media: 1 };
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const source = sources[i];
    const nodes = extractQuestionNodes(source.documentXml, q.questionNumber);
    renumberQuestionMarker(nodes, i + 1);
    await copyRelationships(nodes, source, outputZip, outputRels, counters);
    for (const node of nodes) body.appendChild(outputDoc.importNode(node, true));
  }

  if (sectPr) body.appendChild(outputDoc.importNode(sectPr, true));
  renumberDrawingIds(outputDoc);

  outputZip.file("word/document.xml", serializeXml(outputDoc));
  outputZip.file("word/_rels/document.xml.rels", serializeXml(outputRels));

  const result = await outputZip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  downloadBlob(result);
}
