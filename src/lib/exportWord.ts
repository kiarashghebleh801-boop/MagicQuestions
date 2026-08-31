"use client";

import JSZip from "jszip";
import type { Question } from "./questions";
import { supabase } from "./supabase";
import { FORMATTED_BUCKET, getFormattedSource } from "./sourceDocs";

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

type ExportOptions = { subject?: string };
type RelState = { xml: string; used: Set<string>; counter: number; mediaCounter: number };
type ContentTypesState = { xml: string };
type ExportQuestion = Question & { selectedParts?: string[] };

const sourceCache = new Map<string, Promise<LoadedDoc>>();

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

async function loadSource(filename: string): Promise<LoadedDoc> {
  if (!sourceCache.has(filename)) {
    sourceCache.set(filename, (async () => {
      const { data, error } = await supabase.storage.from(FORMATTED_BUCKET).download(filename);
      if (error || !data) throw new Error(`Could not download ${filename}: ${error?.message || "unknown error"}`);

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
  return sourceCache.get(filename)!;
}

function bodyBounds(xml: string) {
  const openStart = xml.indexOf("<w:body");
  if (openStart < 0) throw new Error("DOCX XML has no w:body");
  const openEnd = xml.indexOf(">", openStart);
  const closeStart = xml.lastIndexOf("</w:body>");
  if (openEnd < 0 || closeStart < 0 || closeStart <= openEnd) throw new Error("DOCX XML has an invalid w:body");
  return { openStart, openEnd: openEnd + 1, closeStart };
}

function markerParagraphs(doc: XMLDocument): Element[] {
  return Array.from(getBody(doc).childNodes)
    .filter(n => n.nodeType === Node.ELEMENT_NODE && isQuestionMarker(n) !== null) as Element[];
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
    const { closeStart } = bodyBounds(xml);
    const pattern = new RegExp(`<w:t(?:\\s[^>]*)?>\\s*Q${q}\\.\\s*</w:t>`, "gi");
    pattern.lastIndex = from;
    const match = pattern.exec(xml.slice(0, closeStart));
    if (match) {
      const pStart = paragraphStartBefore(xml, match.index, from);
      if (pStart >= from) return pStart;
    }
  }
  throw new Error("Could not locate a question marker in the original Word XML");
}

function rawSectPrStart(xml: string): number {
  const { openEnd, closeStart } = bodyBounds(xml);
  const start = xml.lastIndexOf("<w:sectPr", closeStart);
  return start >= openEnd ? start : closeStart;
}

function extractRawQuestionXml(source: LoadedDoc, questionNumber: number): string {
  const markers = markerParagraphs(source.documentXml);
  const markerIndex = markers.findIndex(p => isQuestionMarker(p) === questionNumber);
  if (markerIndex < 0) throw new Error(`Could not find Q${questionNumber}. in ${source.filename}`);
  const start = rawParagraphStart(source.documentXmlText, markers[markerIndex]);
  const end = markerIndex + 1 < markers.length
    ? rawParagraphStart(source.documentXmlText, markers[markerIndex + 1], start + 1)
    : rawSectPrStart(source.documentXmlText);
  if (end <= start) throw new Error(`Could not isolate Q${questionNumber}. in ${source.filename}`);
  return source.documentXmlText.slice(start, end);
}

function removeOriginalTotalParagraph(xml: string): string {
  return xml.replace(/<w:p\b[^>]*>(?:(?!<\/w:p>)[\s\S])*?Total for question(?:(?!<\/w:p>)[\s\S])*?<\/w:p>/gi, "");
}

function partStarts(xml: string): { part: string; start: number }[] {
  const found: { part: string; start: number }[] = [];
  const re = /<w:t(?:\s[^>]*)?>\s*\(([a-z])\)(?=\s|<)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    const start = paragraphStartBefore(xml, match.index);
    if (start < 0) continue;
    if (!found.some(item => item.start === start)) found.push({ part: match[1].toLowerCase(), start });
  }
  return found.sort((a,b)=>a.start-b.start);
}

function renumberPartMarker(xml: string, oldPart: string, newPart: string): string {
  const escaped = oldPart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(<w:t(?:\\s[^>]*)?>\\s*)\\(${escaped}\\)(?=\\s|<)`, "i");
  return xml.replace(re, `$1(${newPart})`);
}

function selectQuestionParts(xml: string, selectedParts: string[] | undefined, marks: number): string {
  if (!selectedParts?.length) return xml;
  const boundaries = partStarts(xml);
  if (!boundaries.length) throw new Error("Could not locate Chemistry sub-question labels in the formatted Word source.");
  const wanted = new Set(selectedParts.map(p=>p.toLowerCase()));
  const available = new Set(boundaries.map(b=>b.part));
  const missing = selectedParts.filter(p=>!available.has(p.toLowerCase()));
  if (missing.length) throw new Error(`Could not locate Chemistry part(s) ${missing.map(p=>`(${p})`).join(", ")} in the formatted Word source.`);

  const preamble = xml.slice(0, boundaries[0].start);
  const chunks: string[] = [];
  let newIndex = 0;
  for (let i=0;i<boundaries.length;i++) {
    const current = boundaries[i];
    if (!wanted.has(current.part)) continue;
    const end = i+1<boundaries.length ? boundaries[i+1].start : xml.length;
    let chunk = xml.slice(current.start, end);
    chunk = removeOriginalTotalParagraph(chunk);
    chunk = renumberPartMarker(chunk, current.part, String.fromCharCode(97 + newIndex));
    newIndex++;
    chunks.push(chunk);
  }
  const total = `<w:p><w:pPr><w:jc w:val=\"right\"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val=\"A8AAAD\"/></w:rPr><w:t>(Total for question = ${marks} ${marks === 1 ? "mark" : "marks"})</w:t></w:r></w:p>`;
  return `${preamble}${chunks.join("")}${total}`;
}

function renumberRawQuestionXml(xml: string, newNumber: number): string {
  let replaced = false;
  const result = xml.replace(/(<w:t(?:\s[^>]*)?>\s*)Q\d+\.(\s*<\/w:t>)/i, (_all, before, after) => {
    replaced = true;
    return `${before}Q${newNumber}.${after}`;
  });
  if (!replaced) throw new Error("Could not renumber a question marker in the Word XML");
  return result;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
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
  const ids = new Set<string>();
  const re = /\br:(?:embed|id|link)=(?:\"([^\"]+)\"|'([^']+)')/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) ids.add(match[1] || match[2]);
  return Array.from(ids);
}

function replaceRelationshipId(xml: string, oldId: string, newId: string): string {
  const escaped = oldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return xml
    .replace(new RegExp(`(\\br:(?:embed|id|link)=\")${escaped}(\")`, "g"), `$1${newId}$2`)
    .replace(new RegExp(`(\\br:(?:embed|id|link)=')${escaped}(')`, "g"), `$1${newId}$2`);
}

function insertBeforeClosing(xml: string, closingTag: string, addition: string): string {
  const index = xml.lastIndexOf(closingTag);
  if (index < 0) throw new Error(`Invalid OOXML: missing ${closingTag}`);
  return `${xml.slice(0, index)}${addition}${xml.slice(index)}`;
}

function usedRelationshipIds(relsXml: string): Set<string> {
  const used = new Set<string>();
  const re = /\bId=(?:\"([^\"]+)\"|'([^']+)')/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(relsXml))) used.add(match[1] || match[2]);
  return used;
}

function nextRelationshipId(used: Set<string>, counter: { value: number }): string {
  let id = `rIdMQ${counter.value++}`;
  while (used.has(id)) id = `rIdMQ${counter.value++}`;
  used.add(id);
  return id;
}

function contentTypeForExtension(source: LoadedDoc, extension: string): string | null {
  for (const node of Array.from(source.contentTypesXml.getElementsByTagName("Default"))) {
    if ((node.getAttribute("Extension") || "").toLowerCase() === extension.toLowerCase()) return node.getAttribute("ContentType");
  }
  return null;
}

function ensureContentTypeDefault(contentTypesXml: string, extension: string, contentType: string): string {
  const ext = extension.replace(/^\./, "");
  if (new RegExp(`<Default\\b[^>]*\\bExtension=(?:\"${ext}\"|'${ext}')[^>]*/>`, "i").test(contentTypesXml)) return contentTypesXml;
  return insertBeforeClosing(contentTypesXml, "</Types>", `<Default Extension=\"${escapeXml(ext)}\" ContentType=\"${escapeXml(contentType)}\"/>`);
}

function mergeRootNamespaces(templateXml: string, sources: LoadedDoc[]): string {
  const start = templateXml.indexOf("<w:document");
  if (start < 0) return templateXml;
  const end = templateXml.indexOf(">", start);
  if (end < 0) return templateXml;
  const startTag = templateXml.slice(start, end + 1);
  let additions = "";
  const seen = new Set<string>();
  const nsRegex = /\bxmlns:([A-Za-z0-9_]+)=(?:\"([^\"]+)\"|'([^']+)')/g;
  let m: RegExpExecArray | null;
  while ((m = nsRegex.exec(startTag))) seen.add(m[1]);
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
  return xml.replace(/(<(?:[A-Za-z0-9_]+:)?docPr\b[^>]*\bid=(?:\"|'))\d+((?:\"|'))/g, (_m, before, after) => `${before}${counter.value++}${after}`)
    .replace(/(<pic:cNvPr\b[^>]*\bid=(?:\"|'))\d+((?:\"|'))/g, (_m, before, after) => `${before}${counter.value++}${after}`);
}

async function remapRelationships(
  chunk: string,
  source: LoadedDoc,
  outputZip: JSZip,
  relState: RelState,
  contentTypesState: ContentTypesState,
): Promise<string> {
  const sourceRels = relationshipMap(source.relsXml);
  let result = chunk;
  for (const oldId of referencedRelationshipIds(chunk)) {
    const sourceRel = sourceRels.get(oldId);
    if (!sourceRel) continue;
    const type = sourceRel.getAttribute("Type") || "";
    const target = sourceRel.getAttribute("Target") || "";
    const targetMode = sourceRel.getAttribute("TargetMode") || "";
    const box = { value: relState.counter };
    const newId = nextRelationshipId(relState.used, box);
    relState.counter = box.value;
    let newTarget = target;
    const isExternal = targetMode.toLowerCase() === "external";
    const isImage = /\/image$/i.test(type) || /^media\//i.test(target.replace(/^\.\//, ""));
    if (!isExternal && isImage) {
      const cleanTarget = target.replace(/^\.\//, "");
      const sourcePath = `word/${cleanTarget}`;
      const sourceFile = source.zip.file(sourcePath);
      if (!sourceFile) throw new Error(`Missing embedded image ${sourcePath} in ${source.filename}`);
      const extension = (cleanTarget.match(/\.([A-Za-z0-9]+)$/)?.[1] || "png").toLowerCase();
      newTarget = `media/mq_${relState.mediaCounter++}.${extension}`;
      outputZip.file(`word/${newTarget}`, await sourceFile.async("uint8array"));
      const contentType = contentTypeForExtension(source, extension);
      if (contentType) contentTypesState.xml = ensureContentTypeDefault(contentTypesState.xml, extension, contentType);
    } else if (!isExternal && !isImage) {
      throw new Error(`Unsupported embedded Word object in ${source.filename}. Please send this question so I can add support for it.`);
    }
    relState.xml = insertBeforeClosing(
      relState.xml,
      "</Relationships>",
      `<Relationship Id=\"${escapeXml(newId)}\" Type=\"${escapeXml(type)}\" Target=\"${escapeXml(newTarget)}\"${targetMode ? ` TargetMode=\"${escapeXml(targetMode)}\"` : ""}/>`
    );
    result = replaceRelationshipId(result, oldId, newId);
  }
  return result;
}

function setCellText(doc: XMLDocument, cell: Element, value: string) {
  let p = Array.from(cell.getElementsByTagNameNS(W_NS, "p"))[0];
  if (!p) {
    p = doc.createElementNS(W_NS, "w:p");
    cell.appendChild(p);
  }
  for (const child of Array.from(p.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE && (child as Element).localName === "r") p.removeChild(child);
  }
  const run = doc.createElementNS(W_NS, "w:r");
  const runPr = doc.createElementNS(W_NS, "w:rPr");
  const fonts = doc.createElementNS(W_NS, "w:rFonts");
  fonts.setAttributeNS(W_NS, "w:ascii", "Arial");
  fonts.setAttributeNS(W_NS, "w:hAnsi", "Arial");
  runPr.appendChild(fonts);
  run.appendChild(runPr);
  const text = doc.createElementNS(W_NS, "w:t");
  text.textContent = value;
  run.appendChild(text);
  p.appendChild(run);
}

function buildCoverChunk(cover: LoadedDoc, subject: string, totalMarks: number): string {
  const doc = parseXml(cover.documentXmlText);
  const body = getBody(doc);
  const firstTable = Array.from(body.getElementsByTagNameNS(W_NS, "tbl"))[0];
  if (!firstTable) throw new Error("FrontCover.docx is missing its first table");
  const firstRow = Array.from(firstTable.getElementsByTagNameNS(W_NS, "tr"))[0];
  const cells = firstRow ? Array.from(firstRow.getElementsByTagNameNS(W_NS, "tc")) : [];
  if (cells.length < 6) throw new Error("FrontCover.docx top row format is not recognised");
  setCellText(doc, cells[1], subject);
  setCellText(doc, cells[3], String(totalMarks));
  setCellText(doc, cells[5], "");
  for (const paragraph of Array.from(firstTable.getElementsByTagNameNS(W_NS, "p"))) {
    const numPr = Array.from(paragraph.getElementsByTagNameNS(W_NS, "numPr"))[0];
    if (!numPr) continue;
    numPr.parentNode?.removeChild(numPr);
    const text = Array.from(paragraph.getElementsByTagNameNS(W_NS, "t"))[0];
    if (text && !text.textContent?.startsWith("• ")) text.textContent = `• ${text.textContent || ""}`;
  }
  const serializer = new XMLSerializer();
  let xml = Array.from(body.childNodes).filter(node => !(node.nodeType === Node.ELEMENT_NODE && (node as Element).localName === "sectPr")).map(node => serializer.serializeToString(node)).join("");
  xml += `<w:p><w:r><w:br w:type=\"page\"/></w:r></w:p>`;
  return xml;
}

function buildQuestionChunk(source: LoadedDoc, q: ExportQuestion, newNumber: number): string {
  let chunk = extractRawQuestionXml(source, q.questionNumber);
  chunk = selectQuestionParts(chunk, q.selectedParts, q.marks);
  return renumberRawQuestionXml(chunk, newNumber);
}

async function exportSingleSource(questions: ExportQuestion[], source: LoadedDoc, cover: LoadedDoc, subject: string) {
  const outputZip = await JSZip.loadAsync(await source.zip.generateAsync({ type: "uint8array" }));
  const templateXml = mergeRootNamespaces(source.documentXmlText, [source, cover]);
  const { openEnd, closeStart } = bodyBounds(templateXml);
  const sectPrStart = rawSectPrStart(templateXml);
  const prefix = templateXml.slice(0, openEnd);
  const sectPr = templateXml.slice(sectPrStart, closeStart);
  const suffix = templateXml.slice(closeStart);
  const relState: RelState = { xml: source.relsXmlText, used: usedRelationshipIds(source.relsXmlText), counter: 1, mediaCounter: 1 };
  const contentTypesState: ContentTypesState = { xml: source.contentTypesText };
  const drawingCounter = { value: 1 };
  let coverChunk = buildCoverChunk(cover, subject, questions.reduce((sum, q) => sum + q.marks, 0));
  coverChunk = await remapRelationships(coverChunk, cover, outputZip, relState, contentTypesState);
  coverChunk = renumberDrawingIds(coverChunk, drawingCounter);
  const selected = questions.map((q, index) => renumberDrawingIds(buildQuestionChunk(source, q, index + 1), drawingCounter)).join("");
  outputZip.file("word/document.xml", `${prefix}${coverChunk}${selected}${sectPr}${suffix}`);
  outputZip.file("word/_rels/document.xml.rels", relState.xml);
  outputZip.file("[Content_Types].xml", contentTypesState.xml);
  downloadBlob(await outputZip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } }));
}

async function exportAcrossSources(questions: ExportQuestion[], sources: LoadedDoc[], cover: LoadedDoc, subject: string) {
  const template = sources[0];
  const outputZip = await JSZip.loadAsync(await template.zip.generateAsync({ type: "uint8array" }));
  const templateXml = mergeRootNamespaces(template.documentXmlText, [...sources, cover]);
  const { openEnd, closeStart } = bodyBounds(templateXml);
  const sectPrStart = rawSectPrStart(templateXml);
  const prefix = templateXml.slice(0, openEnd);
  const sectPr = templateXml.slice(sectPrStart, closeStart);
  const suffix = templateXml.slice(closeStart);
  const relState: RelState = { xml: template.relsXmlText, used: usedRelationshipIds(template.relsXmlText), counter: 1, mediaCounter: 1 };
  const contentTypesState: ContentTypesState = { xml: template.contentTypesText };
  const drawingCounter = { value: 1 };
  let coverChunk = buildCoverChunk(cover, subject, questions.reduce((sum, q) => sum + q.marks, 0));
  coverChunk = await remapRelationships(coverChunk, cover, outputZip, relState, contentTypesState);
  coverChunk = renumberDrawingIds(coverChunk, drawingCounter);
  const chunks: string[] = [];
  for (let i = 0; i < questions.length; i++) {
    let chunk = buildQuestionChunk(sources[i], questions[i], i + 1);
    chunk = await remapRelationships(chunk, sources[i], outputZip, relState, contentTypesState);
    chunk = renumberDrawingIds(chunk, drawingCounter);
    chunks.push(chunk);
  }
  outputZip.file("word/document.xml", `${prefix}${coverChunk}${chunks.join("")}${sectPr}${suffix}`);
  outputZip.file("word/_rels/document.xml.rels", relState.xml);
  outputZip.file("[Content_Types].xml", contentTypesState.xml);
  downloadBlob(await outputZip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } }));
}

function downloadBlob(bytes: Uint8Array) {
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "MagicQuestions-ExamWizard-Paper.docx";
  document.body.appendChild(a);
  a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function exportPaperToWord(questions: Question[], options: ExportOptions = {}) {
  if (!questions.length) return;
  const exportQuestions = questions as ExportQuestion[];
  const missing = exportQuestions.filter(q => !getFormattedSource(q));
  if (missing.length) {
    const labels = missing.map(q => `${q.session} ${q.year} ${q.paper} Q${q.questionNumber}`).join(", ");
    throw new Error(`Formatted Word source not uploaded/mapped yet for: ${labels}`);
  }
  let cover: LoadedDoc;
  try { cover = await loadSource(FRONT_COVER_FILE); }
  catch { throw new Error(`Front cover template not found. Upload ${FRONT_COVER_FILE} to the ${FORMATTED_BUCKET} Supabase bucket.`); }
  const rawSubject = options.subject || "Mathematics";
  const subject = /^Edexcel IGCSE\b/i.test(rawSubject) ? rawSubject : `Edexcel IGCSE ${rawSubject}`;
  const filenames = exportQuestions.map(q => getFormattedSource(q)!);
  const uniqueFilenames = Array.from(new Set(filenames));
  if (uniqueFilenames.length === 1) {
    await exportSingleSource(exportQuestions, await loadSource(uniqueFilenames[0]), cover, subject);
    return;
  }
  const sources = await Promise.all(filenames.map(loadSource));
  await exportAcrossSources(exportQuestions, sources, cover, subject);
}