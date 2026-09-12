"use client";

import JSZip from "jszip";
import type { Question } from "./questions";
import { supabase } from "./supabase";
import { FORMATTED_BUCKET, getFormattedSource } from "./sourceDocs";

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const W14_NS = "http://schemas.microsoft.com/office/word/2010/wordml";
const FRONT_COVER_FILE = "FrontCover.docx";
const TARGET_ANSWER_DOTS = 43;

type MathsExportQuestion = Question & { selectedParts?: string[] };
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

function getBody(doc: XMLDocument): Element {
  const body = Array.from(doc.getElementsByTagNameNS(W_NS, "body"))[0];
  if (!body) throw new Error("DOCX has no Word body");
  return body;
}

function isQuestionMarker(node: Node): number | null {
  if (node.nodeType !== Node.ELEMENT_NODE || (node as Element).localName !== "p") return null;
  const match = nodeText(node).match(/^Q(\d+)\.$/i);
  return match ? Number(match[1]) : null;
}

async function loadSource(filename: string): Promise<LoadedDoc> {
  if (!cache.has(filename)) {
    cache.set(filename, (async () => {
      const { data, error } = await supabase.storage.from(FORMATTED_BUCKET).download(filename);
      if (error || !data) throw new Error(`Could not download ${filename} from ${FORMATTED_BUCKET}: ${error?.message || "unknown error"}`);
      const zip = await JSZip.loadAsync(await data.arrayBuffer());
      const documentFile = zip.file("word/document.xml");
      const relsFile = zip.file("word/_rels/document.xml.rels");
      const contentTypesFile = zip.file("[Content_Types].xml");
      if (!documentFile || !relsFile || !contentTypesFile) throw new Error(`${filename} is not a valid Word document`);
      const documentXmlText = await documentFile.async("text");
      const relsXmlText = await relsFile.async("text");
      const contentTypesText = await contentTypesFile.async("text");
      return {
        filename, zip, documentXmlText, documentXml: parseXml(documentXmlText),
        relsXmlText, relsXml: parseXml(relsXmlText), contentTypesText,
        contentTypesXml: parseXml(contentTypesText),
      };
    })());
  }
  return cache.get(filename)!;
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
  throw new Error("Could not locate a question marker in the Maths Word source");
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

function paragraphText(xml: string): string {
  const texts: string[] = [];
  const re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) texts.push(m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'"));
  return texts.join("").replace(/\s+/g, " ").trim();
}

function rawParagraphs(xml: string): { start: number; end: number; xml: string; text: string }[] {
  const out: { start: number; end: number; xml: string; text: string }[] = [];
  const re = /<w:p(?=[\s>])[\s\S]*?<\/w:p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push({ start: m.index, end: m.index + m[0].length, xml: m[0], text: paragraphText(m[0]) });
  return out;
}

function partStarts(xml: string, selectedParts: string[]): { part: string; start: number }[] {
  const paragraphs = rawParagraphs(xml);
  const detected: { part: string; start: number }[] = [];
  let expected = "a".charCodeAt(0);
  for (const p of paragraphs) {
    const match = p.text.match(/^\(([a-z])\)(?:\s|$)/i);
    if (!match) continue;
    const part = match[1].toLowerCase();
    if (part.charCodeAt(0) !== expected) continue;
    detected.push({ part, start: p.start });
    expected++;
  }

  const requested = selectedParts.map(p => p.toLowerCase());
  const available = new Set(detected.map(x => x.part));
  for (const missing of requested.filter(p => !available.has(p))) {
    const code = missing.charCodeAt(0);
    const prev = detected.find(x => x.part.charCodeAt(0) === code - 1);
    const next = detected.find(x => x.part.charCodeAt(0) === code + 1);
    if (!prev || !next) continue;
    const between = paragraphs.filter(p => p.start > prev.start && p.start < next.start);
    const drawings = between.filter(p => /<w:drawing\b/i.test(p.xml) || /<w:pict\b/i.test(p.xml));
    if (!drawings.length) continue;
    detected.push({ part: missing, start: drawings[drawings.length - 1].start });
    available.add(missing);
  }
  return detected.sort((a, b) => a.start - b.start);
}

function removeOriginalTotal(xml: string): string {
  return xml.replace(/<w:p\b[^>]*>(?:(?!<\/w:p>)[\s\S])*?Total for question(?:(?!<\/w:p>)[\s\S])*?<\/w:p>/gi, "");
}

function renumberPartMarker(xml: string, oldPart: string, newPart: string): string {
  const escaped = oldPart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return xml.replace(new RegExp(`(<w:t(?:\\s[^>]*)?>\\s*)\\(${escaped}\\)(?=\\s|<)`, "i"), `$1(${newPart})`);
}

function removeFirstPartLabel(xml: string): string {
  const paragraphs = rawParagraphs(xml);
  const first = paragraphs.find(p => /^\([a-z]\)(?:\s|$)/i.test(p.text));
  if (!first) return xml;
  const updated = first.xml.replace(/(<w:t(?:\s[^>]*)?>\s*)\([a-z]\)(\s*)/i, "$1$2");
  return `${xml.slice(0, first.start)}${updated}${xml.slice(first.end)}`;
}

function stripPageBreaks(xml: string): string {
  return xml
    .replace(/<w:lastRenderedPageBreak\s*\/>/gi, "")
    .replace(/<w:br\b[^>]*w:type=(?:\"page\"|'page')[^>]*\/>/gi, "")
    .replace(/<w:pageBreakBefore\b[^>]*\/>/gi, "");
}

function selectQuestionParts(xml: string, selectedParts: string[] | undefined, marks: number): string {
  if (!selectedParts?.length) return xml;
  const boundaries = partStarts(xml, selectedParts);
  if (!boundaries.length) throw new Error("Could not locate the selected Maths sub-question labels in the Word source.");
  const wanted = new Set(selectedParts.map(p => p.toLowerCase()));
  const available = new Set(boundaries.map(p => p.part));
  const missing = selectedParts.filter(p => !available.has(p.toLowerCase()));
  if (missing.length) throw new Error(`Could not isolate Maths part(s) ${missing.map(p => `(${p})`).join(", ")}.`);

  const preamble = xml.slice(0, boundaries[0].start);
  const chunks: string[] = [];
  let newIndex = 0;
  for (let i = 0; i < boundaries.length; i++) {
    const current = boundaries[i];
    if (!wanted.has(current.part)) continue;
    const end = i + 1 < boundaries.length ? boundaries[i + 1].start : xml.length;
    let chunk = xml.slice(current.start, end);
    chunk = removeOriginalTotal(chunk);
    chunk = stripPageBreaks(chunk);
    chunk = renumberPartMarker(chunk, current.part, String.fromCharCode(97 + newIndex));
    newIndex++;
    chunks.push(chunk);
  }

  let selected = stripPageBreaks(`${preamble}${chunks.join("")}`);
  if (selectedParts.length === 1) selected = removeFirstPartLabel(selected);
  const total = `<w:p><w:pPr><w:jc w:val=\"right\"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>(Total for question = ${marks} ${marks === 1 ? "mark" : "marks"})</w:t></w:r></w:p>`;
  return `${selected}${total}`;
}

function renumberQuestion(xml: string, n: number): string {
  let changed = false;
  const out = xml.replace(/(<w:t(?:\s[^>]*)?>\s*)Q\d+\.(\s*<\/w:t>)/i, (_m, a, b) => {
    changed = true;
    return `${a}Q${n}.${b}`;
  });
  if (!changed) throw new Error("Could not renumber a Maths question");
  return out;
}

function normalizeMathsAnswerLines(xml: string): string {
  const target = ".".repeat(TARGET_ANSWER_DOTS);
  return xml.replace(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>/gi, textNode => textNode.replace(/\.{55,}/g, target));
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
    let newId = `rIdMQMath${relState.counter++}`;
    while (relState.used.has(newId)) newId = `rIdMQMath${relState.counter++}`;
    relState.used.add(newId);
    let newTarget = target;
    const external = targetMode.toLowerCase() === "external";
    const image = /\/image$/i.test(type) || /^media\//i.test(target.replace(/^\.\//, ""));
    if (!external && image) {
      const clean = target.replace(/^\.\//, "");
      const sourceFile = source.zip.file(`word/${clean}`);
      if (!sourceFile) throw new Error(`Missing embedded image ${clean} in ${source.filename}`);
      const ext = (clean.match(/\.([A-Za-z0-9]+)$/)?.[1] || "png").toLowerCase();
      newTarget = `media/mq_maths_${relState.mediaCounter++}.${ext}`;
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
  run.appendChild(text); p.appendChild(run);
}

function buildCover(cover: LoadedDoc, totalMarks: number): string {
  const doc = parseXml(cover.documentXmlText);
  const body = getBody(doc);
  const table = Array.from(body.getElementsByTagNameNS(W_NS, "tbl"))[0];
  const row = table ? Array.from(table.getElementsByTagNameNS(W_NS, "tr"))[0] : undefined;
  const cells = row ? Array.from(row.getElementsByTagNameNS(W_NS, "tc")) : [];
  if (cells.length >= 6) {
    setCellText(doc, cells[1], "Edexcel IGCSE Mathematics");
    setCellText(doc, cells[3], String(totalMarks));
    setCellText(doc, cells[5], "");
  }
  const serializer = new XMLSerializer();
  let xml = Array.from(body.childNodes).filter(node => !(node.nodeType === Node.ELEMENT_NODE && (node as Element).localName === "sectPr")).map(node => serializer.serializeToString(node)).join("");
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
  a.href = url; a.download = "MagicQuestions-Mathematics-Paper.docx";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function exportMathsPaperToWord(inputQuestions: Question[]) {
  if (!inputQuestions.length) return;
  const questions = inputQuestions as MathsExportQuestion[];
  const filenames = questions.map(q => getFormattedSource(q));
  const missing = questions.filter((q, i) => !filenames[i]);
  if (missing.length) throw new Error(`Maths Word source not mapped for: ${missing.map(q => `${q.paper} Q${q.questionNumber}`).join(", ")}`);

  const sources = await Promise.all(filenames.map(filename => loadSource(filename!)));
  const cover = await loadSource(FRONT_COVER_FILE);
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
    let chunk = extractQuestion(sources[i], questions[i].questionNumber);
    chunk = selectQuestionParts(chunk, questions[i].selectedParts, questions[i].marks);
    chunk = renumberQuestion(chunk, i + 1);
    chunk = normalizeMathsAnswerLines(chunk);
    chunk = await remapRelationships(chunk, sources[i], outputZip, relState, contentState);
    chunk = renumberDrawingIds(chunk, drawingCounter);
    chunks.push(chunk);
  }

  outputZip.file("word/document.xml", `${prefix}${coverChunk}${chunks.join("")}${sectPr}${suffix}`);
  outputZip.file("word/_rels/document.xml.rels", relState.xml);
  outputZip.file("[Content_Types].xml", contentState.xml);
  download(await outputZip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } }));
}
