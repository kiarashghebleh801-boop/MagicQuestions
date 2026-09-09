"use client";

import JSZip from "jszip";
import type { Question } from "./questions";
import { supabase } from "./supabase";
import { FORMATTED_BUCKET, PHYSICS_BUCKET, getFormattedSource } from "./sourceDocs";

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const W14_NS = "http://schemas.microsoft.com/office/word/2010/wordml";
const FRONT_COVER_FILE = "FrontCover.docx";

type LoadedDoc = {
  filename: string;
  zip: JSZip;
  documentXmlText: string;
  documentXml: XMLDocument;
  relsXmlText: string;
  relsXml: XMLDocument;
  contentTypesText: string;
  contentTypesXml: XMLDocument;
};

type RelState = { xml: string; used: Set<string>; counter: number; mediaCounter: number };
type ContentTypesState = { xml: string };

const cache = new Map<string, Promise<LoadedDoc>>();

function parseXml(text: string): XMLDocument {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("Invalid DOCX XML");
  return doc;
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

async function loadSource(bucket: string, filename: string): Promise<LoadedDoc> {
  const key = `${bucket}/${filename}`;
  if (!cache.has(key)) {
    cache.set(key, (async () => {
      const { data, error } = await supabase.storage.from(bucket).download(filename);
      if (error || !data) throw new Error(`Could not download ${filename} from ${bucket}: ${error?.message || "unknown error"}`);
      const zip = await JSZip.loadAsync(await data.arrayBuffer());
      const documentFile = zip.file("word/document.xml");
      const relsFile = zip.file("word/_rels/document.xml.rels");
      const contentTypesFile = zip.file("[Content_Types].xml");
      if (!documentFile || !relsFile || !contentTypesFile) throw new Error(`${filename} is not a valid Word document`);
      const documentXmlText = await documentFile.async("text");
      const relsXmlText = await relsFile.async("text");
      const contentTypesText = await contentTypesFile.async("text");
      return {
        filename,
        zip,
        documentXmlText,
        documentXml: parseXml(documentXmlText),
        relsXmlText,
        relsXml: parseXml(relsXmlText),
        contentTypesText,
        contentTypesXml: parseXml(contentTypesText),
      };
    })());
  }
  return cache.get(key)!;
}

function bodyBounds(xml: string) {
  const openStart = xml.indexOf("<w:body");
  const openEnd = xml.indexOf(">", openStart);
  const closeStart = xml.lastIndexOf("</w:body>");
  if (openStart < 0 || openEnd < 0 || closeStart < 0) throw new Error("Invalid Word body");
  return { openEnd: openEnd + 1, closeStart };
}

function rawSectPrStart(xml: string): number {
  const { openEnd, closeStart } = bodyBounds(xml);
  const start = xml.lastIndexOf("<w:sectPr", closeStart);
  return start >= openEnd ? start : closeStart;
}

function paragraphStartBefore(xml: string, index: number, from = 0): number {
  const re = /<w:p(?=[\s>])/g;
  re.lastIndex = from;
  let last = -1;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) && match.index <= index) last = match.index;
  return last;
}

function rawParagraphStart(xml: string, paragraph: Element, from = 0): number {
  const paraId = paragraph.getAttributeNS(W14_NS, "paraId") || paragraph.getAttribute("w14:paraId");
  if (paraId) {
    for (const needle of [`w14:paraId=\"${paraId}\"`, `w14:paraId='${paraId}'`]) {
      const attrIndex = xml.indexOf(needle, from);
      if (attrIndex >= 0) {
        const pStart = paragraphStartBefore(xml, attrIndex, from);
        if (pStart >= from) return pStart;
      }
    }
  }
  const q = isQuestionMarker(paragraph);
  if (q !== null) {
    const pattern = new RegExp(`<w:t(?:\\s[^>]*)?>\\s*Q${q}\\.\\s*</w:t>`, "gi");
    pattern.lastIndex = from;
    const match = pattern.exec(xml);
    if (match) {
      const pStart = paragraphStartBefore(xml, match.index, from);
      if (pStart >= from) return pStart;
    }
  }
  throw new Error("Could not locate a question marker in the Physics Word source");
}

function markerParagraphs(doc: XMLDocument): Element[] {
  return Array.from(getBody(doc).childNodes).filter(n => n.nodeType === Node.ELEMENT_NODE && isQuestionMarker(n) !== null) as Element[];
}

function extractQuestion(source: LoadedDoc, questionNumber: number): string {
  const markers = markerParagraphs(source.documentXml);
  const index = markers.findIndex(p => isQuestionMarker(p) === questionNumber);
  if (index < 0) throw new Error(`Could not find Q${questionNumber}. in ${source.filename}`);
  const start = rawParagraphStart(source.documentXmlText, markers[index]);
  const end = index + 1 < markers.length ? rawParagraphStart(source.documentXmlText, markers[index + 1], start + 1) : rawSectPrStart(source.documentXmlText);
  return source.documentXmlText.slice(start, end);
}

function renumberQuestion(xml: string, n: number): string {
  let changed = false;
  const out = xml.replace(/(<w:t(?:\s[^>]*)?>\s*)Q\d+\.(\s*<\/w:t>)/i, (_m, a, b) => {
    changed = true;
    return `${a}Q${n}.${b}`;
  });
  if (!changed) throw new Error("Could not renumber a Physics question");
  return out;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function insertBeforeClosing(xml: string, closing: string, addition: string): string {
  const i = xml.lastIndexOf(closing);
  if (i < 0) throw new Error(`Missing ${closing}`);
  return `${xml.slice(0, i)}${addition}${xml.slice(i)}`;
}

function relationshipMap(rels: XMLDocument): Map<string, Element> {
  const map = new Map<string, Element>();
  for (const rel of Array.from(rels.getElementsByTagName("Relationship"))) {
    const id = rel.getAttribute("Id");
    if (id) map.set(id, rel);
  }
  return map;
}

function referencedRelationshipIds(xml: string): string[] {
  const out = new Set<string>();
  const re = /\br:(?:embed|id|link)=(?:\"([^\"]+)\"|'([^']+)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.add(m[1] || m[2]);
  return Array.from(out);
}

function replaceRelationshipId(xml: string, oldId: string, newId: string): string {
  const escaped = oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return xml
    .replace(new RegExp(`(\\br:(?:embed|id|link)=\")${escaped}(\")`, "g"), `$1${newId}$2`)
    .replace(new RegExp(`(\\br:(?:embed|id|link)=')${escaped}(')`, "g"), `$1${newId}$2`);
}

function usedRelationshipIds(xml: string): Set<string> {
  const out = new Set<string>();
  const re = /\bId=(?:\"([^\"]+)\"|'([^']+)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.add(m[1] || m[2]);
  return out;
}

function contentTypeForExtension(source: LoadedDoc, extension: string): string | null {
  for (const node of Array.from(source.contentTypesXml.getElementsByTagName("Default"))) {
    if ((node.getAttribute("Extension") || "").toLowerCase() === extension.toLowerCase()) return node.getAttribute("ContentType");
  }
  return null;
}

function ensureContentType(xml: string, extension: string, contentType: string): string {
  if (new RegExp(`<Default\\b[^>]*\\bExtension=(?:\"${extension}\"|'${extension}')[^>]*/>`, "i").test(xml)) return xml;
  return insertBeforeClosing(xml, "</Types>", `<Default Extension=\"${escapeXml(extension)}\" ContentType=\"${escapeXml(contentType)}\"/>`);
}

async function remapRelationships(chunk: string, source: LoadedDoc, outputZip: JSZip, relState: RelState, contentState: ContentTypesState): Promise<string> {
  const sourceRels = relationshipMap(source.relsXml);
  let out = chunk;
  for (const oldId of referencedRelationshipIds(chunk)) {
    const rel = sourceRels.get(oldId);
    if (!rel) continue;
    const type = rel.getAttribute("Type") || "";
    const target = rel.getAttribute("Target") || "";
    const targetMode = rel.getAttribute("TargetMode") || "";
    let newId = `rIdMQ${relState.counter++}`;
    while (relState.used.has(newId)) newId = `rIdMQ${relState.counter++}`;
    relState.used.add(newId);
    let newTarget = target;
    const external = targetMode.toLowerCase() === "external";
    const image = /\/image$/i.test(type) || /^media\//i.test(target.replace(/^\.\//, ""));
    if (!external && image) {
      const clean = target.replace(/^\.\//, "");
      const sourceFile = source.zip.file(`word/${clean}`);
      if (!sourceFile) throw new Error(`Missing embedded image ${clean} in ${source.filename}`);
      const ext = (clean.match(/\.([A-Za-z0-9]+)$/)?.[1] || "png").toLowerCase();
      newTarget = `media/mq_physics_${relState.mediaCounter++}.${ext}`;
      outputZip.file(`word/${newTarget}`, await sourceFile.async("uint8array"));
      const ct = contentTypeForExtension(source, ext);
      if (ct) contentState.xml = ensureContentType(contentState.xml, ext, ct);
    } else if (!external && !image) {
      throw new Error(`Unsupported embedded Word object in ${source.filename}`);
    }
    relState.xml = insertBeforeClosing(relState.xml, "</Relationships>", `<Relationship Id=\"${escapeXml(newId)}\" Type=\"${escapeXml(type)}\" Target=\"${escapeXml(newTarget)}\"${targetMode ? ` TargetMode=\"${escapeXml(targetMode)}\"` : ""}/>`);
    out = replaceRelationshipId(out, oldId, newId);
  }
  return out;
}

function setCellText(doc: XMLDocument, cell: Element, value: string) {
  let p = Array.from(cell.getElementsByTagNameNS(W_NS, "p"))[0];
  if (!p) { p = doc.createElementNS(W_NS, "w:p"); cell.appendChild(p); }
  for (const child of Array.from(p.childNodes)) if (child.nodeType === Node.ELEMENT_NODE && (child as Element).localName === "r") p.removeChild(child);
  const run = doc.createElementNS(W_NS, "w:r");
  const text = doc.createElementNS(W_NS, "w:t");
  text.textContent = value;
  run.appendChild(text);
  p.appendChild(run);
}

function buildCover(cover: LoadedDoc, totalMarks: number): string {
  const doc = parseXml(cover.documentXmlText);
  const body = getBody(doc);
  const table = Array.from(body.getElementsByTagNameNS(W_NS, "tbl"))[0];
  const row = table ? Array.from(table.getElementsByTagNameNS(W_NS, "tr"))[0] : undefined;
  const cells = row ? Array.from(row.getElementsByTagNameNS(W_NS, "tc")) : [];
  if (cells.length >= 6) {
    setCellText(doc, cells[1], "Edexcel International GCSE Physics");
    setCellText(doc, cells[3], String(totalMarks));
    setCellText(doc, cells[5], "");
  }
  const serializer = new XMLSerializer();
  let xml = Array.from(body.childNodes)
    .filter(node => !(node.nodeType === Node.ELEMENT_NODE && (node as Element).localName === "sectPr"))
    .map(node => serializer.serializeToString(node)).join("");
  xml += `<w:p><w:r><w:br w:type=\"page\"/></w:r></w:p>`;
  return xml;
}

function mergeNamespaces(templateXml: string, sources: LoadedDoc[]): string {
  const start = templateXml.indexOf("<w:document");
  const end = templateXml.indexOf(">", start);
  if (start < 0 || end < 0) return templateXml;
  const startTag = templateXml.slice(start, end + 1);
  const seen = new Set<string>();
  const re = /\bxmlns:([A-Za-z0-9_]+)=(?:\"([^\"]+)\"|'([^']+)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(startTag))) seen.add(m[1]);
  let additions = "";
  for (const source of sources) {
    for (const attr of Array.from(source.documentXml.documentElement.attributes)) {
      if (!attr.name.startsWith("xmlns:")) continue;
      const prefix = attr.name.slice(6);
      if (seen.has(prefix)) continue;
      seen.add(prefix);
      additions += ` xmlns:${prefix}=\"${escapeXml(attr.value)}\"`;
    }
  }
  return additions ? `${templateXml.slice(0, end)}${additions}${templateXml.slice(end)}` : templateXml;
}

function renumberDrawingIds(xml: string, counter: { value: number }): string {
  return xml
    .replace(/(<(?:[A-Za-z0-9_]+:)?docPr\b[^>]*\bid=(?:\"|'))\d+((?:\"|'))/g, (_m, a, b) => `${a}${counter.value++}${b}`)
    .replace(/(<pic:cNvPr\b[^>]*\bid=(?:\"|'))\d+((?:\"|'))/g, (_m, a, b) => `${a}${counter.value++}${b}`);
}

function download(bytes: Uint8Array) {
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "MagicQuestions-Physics-Paper.docx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function exportPhysicsPaperToWord(questions: Question[]) {
  if (!questions.length) return;
  const filenames = questions.map(q => getFormattedSource(q));
  const missing = questions.filter((q, i) => !filenames[i]);
  if (missing.length) throw new Error(`Physics Word source not mapped for: ${missing.map(q => `${q.paper} Q${q.questionNumber}`).join(", ")}`);

  const sources = await Promise.all(filenames.map(filename => loadSource(PHYSICS_BUCKET, filename!)));
  const cover = await loadSource(FORMATTED_BUCKET, FRONT_COVER_FILE);
  const template = sources[0];
  const outputZip = await JSZip.loadAsync(await template.zip.generateAsync({ type: "uint8array" }));
  const templateXml = mergeNamespaces(template.documentXmlText, [...sources, cover]);
  const { openEnd, closeStart } = bodyBounds(templateXml);
  const sectStart = rawSectPrStart(templateXml);
  const prefix = templateXml.slice(0, openEnd);
  const sectPr = templateXml.slice(sectStart, closeStart);
  const suffix = templateXml.slice(closeStart);
  const relState: RelState = { xml: template.relsXmlText, used: usedRelationshipIds(template.relsXmlText), counter: 1, mediaCounter: 1 };
  const contentState: ContentTypesState = { xml: template.contentTypesText };
  const drawingCounter = { value: 1 };

  let coverChunk = buildCover(cover, questions.reduce((sum, q) => sum + q.marks, 0));
  coverChunk = await remapRelationships(coverChunk, cover, outputZip, relState, contentState);
  coverChunk = renumberDrawingIds(coverChunk, drawingCounter);

  const chunks: string[] = [];
  for (let i = 0; i < questions.length; i++) {
    let chunk = renumberQuestion(extractQuestion(sources[i], questions[i].questionNumber), i + 1);
    chunk = await remapRelationships(chunk, sources[i], outputZip, relState, contentState);
    chunk = renumberDrawingIds(chunk, drawingCounter);
    chunks.push(chunk);
  }

  outputZip.file("word/document.xml", `${prefix}${coverChunk}${chunks.join("")}${sectPr}${suffix}`);
  outputZip.file("word/_rels/document.xml.rels", relState.xml);
  outputZip.file("[Content_Types].xml", contentState.xml);
  download(await outputZip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } }));
}
