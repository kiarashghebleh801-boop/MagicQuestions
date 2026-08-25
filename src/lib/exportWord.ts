"use client";

import JSZip from "jszip";
import type { Question } from "./questions";
import { supabase } from "./supabase";
import { FORMATTED_BUCKET, getFormattedSource } from "./sourceDocs";

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const W14_NS = "http://schemas.microsoft.com/office/word/2010/wordml";

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

function rawParagraphStart(xml: string, paragraph: Element, from = 0): number {
  const paraId = paragraph.getAttributeNS(W14_NS, "paraId") || paragraph.getAttribute("w14:paraId");
  if (paraId) {
    const candidates = [`w14:paraId=\"${paraId}\"`, `w14:paraId='${paraId}'`];
    for (const needle of candidates) {
      const attrIndex = xml.indexOf(needle, from);
      if (attrIndex >= 0) {
        const pStart = xml.lastIndexOf("<w:p", attrIndex);
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
      const pStart = xml.lastIndexOf("<w:p", match.index);
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
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
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
    if ((node.getAttribute("Extension") || "").toLowerCase() === extension.toLowerCase()) {
      return node.getAttribute("ContentType");
    }
  }
  return null;
}

function ensureContentTypeDefault(contentTypesXml: string, extension: string, contentType: string): string {
  const ext = extension.replace(/^\./, "");
  const existing = new RegExp(`<Default\\b[^>]*\\bExtension=(?:\"${ext}\"|'${ext}')[^>]*/>`, "i");
  if (existing.test(contentTypesXml)) return contentTypesXml;
  const addition = `<Default Extension=\"${escapeXml(ext)}\" ContentType=\"${escapeXml(contentType)}\"/>`;
  return insertBeforeClosing(contentTypesXml, "</Types>", addition);
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
    const root = source.documentXml.documentElement;
    for (const attr of Array.from(root.attributes)) {
      if (!attr.name.startsWith("xmlns:")) continue;
      const prefix = attr.name.slice(6);
      if (seen.has(prefix)) continue;
      seen.add(prefix);
      additions += ` xmlns:${prefix}=\"${escapeXml(attr.value)}\"`;
    }
  }

  if (!additions) return templateXml;
  return `${templateXml.slice(0, end)}${additions}${templateXml.slice(end)}`;
}

function renumberDrawingIds(xml: string, counter: { value: number }): string {
  return xml.replace(/(<(?:[A-Za-z0-9_]+:)?docPr\b[^>]*\bid=(?:\"|'))\d+((?:\"|'))/g, (_m, before, after) => {
    return `${before}${counter.value++}${after}`;
  });
}

async function remapQuestionRelationships(
  chunk: string,
  source: LoadedDoc,
  outputZip: JSZip,
  relState: { xml: string; used: Set<string>; counter: number; mediaCounter: number },
  contentTypesState: { xml: string },
): Promise<string> {
  const sourceRels = relationshipMap(source.relsXml);
  let result = chunk;

  for (const oldId of referencedRelationshipIds(chunk)) {
    const sourceRel = sourceRels.get(oldId);
    if (!sourceRel) continue;

    const type = sourceRel.getAttribute("Type") || "";
    const target = sourceRel.getAttribute("Target") || "";
    const targetMode = sourceRel.getAttribute("TargetMode") || "";
    const counterBox = { value: relState.counter };
    const newId = nextRelationshipId(relState.used, counterBox);
    relState.counter = counterBox.value;

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
      if (contentType) {
        contentTypesState.xml = ensureContentTypeDefault(contentTypesState.xml, extension, contentType);
      }
    } else if (!isExternal && !isImage) {
      // Normal formatted exam questions should only reference inline media from the body.
      // Refuse to emit a subtly broken DOCX if Word content introduces an unsupported
      // embedded object/chart relationship.
      throw new Error(`Unsupported embedded Word object in ${source.filename}. Please send this question so I can add support for it.`);
    }

    const relation = `<Relationship Id=\"${escapeXml(newId)}\" Type=\"${escapeXml(type)}\" Target=\"${escapeXml(newTarget)}\"${targetMode ? ` TargetMode=\"${escapeXml(targetMode)}\"` : ""}/>`;
    relState.xml = insertBeforeClosing(relState.xml, "</Relationships>", relation);
    result = replaceRelationshipId(result, oldId, newId);
  }

  return result;
}

function buildSingleSourceDocumentXml(source: LoadedDoc, questions: Question[]): string {
  const { openEnd, closeStart } = bodyBounds(source.documentXmlText);
  const sectPrStart = rawSectPrStart(source.documentXmlText);
  const prefix = source.documentXmlText.slice(0, openEnd);
  const sectPr = source.documentXmlText.slice(sectPrStart, closeStart);
  const suffix = source.documentXmlText.slice(closeStart);
  const drawingCounter = { value: 1 };

  const selected = questions.map((q, index) => {
    let chunk = renumberRawQuestionXml(extractRawQuestionXml(source, q.questionNumber), index + 1);
    chunk = renumberDrawingIds(chunk, drawingCounter);
    return chunk;
  }).join("");

  return `${prefix}${selected}${sectPr}${suffix}`;
}

async function exportFromSingleSource(questions: Question[], source: LoadedDoc) {
  const outputZip = await JSZip.loadAsync(await source.zip.generateAsync({ type: "uint8array" }));
  outputZip.file("word/document.xml", buildSingleSourceDocumentXml(source, questions));
  downloadBlob(await outputZip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } }));
}

async function exportAcrossSources(questions: Question[], sources: LoadedDoc[]) {
  const template = sources[0];
  const outputZip = await JSZip.loadAsync(await template.zip.generateAsync({ type: "uint8array" }));

  let templateXml = mergeRootNamespaces(template.documentXmlText, sources);
  const { openEnd, closeStart } = bodyBounds(templateXml);
  const sectPrStart = rawSectPrStart(templateXml);
  const prefix = templateXml.slice(0, openEnd);
  const sectPr = templateXml.slice(sectPrStart, closeStart);
  const suffix = templateXml.slice(closeStart);

  const relState = {
    xml: template.relsXmlText,
    used: usedRelationshipIds(template.relsXmlText),
    counter: 1,
    mediaCounter: 1,
  };
  const contentTypesState = { xml: template.contentTypesText };
  const drawingCounter = { value: 1 };

  const chunks: string[] = [];
  for (let i = 0; i < questions.length; i++) {
    let chunk = extractRawQuestionXml(sources[i], questions[i].questionNumber);
    chunk = renumberRawQuestionXml(chunk, i + 1);
    chunk = await remapQuestionRelationships(chunk, sources[i], outputZip, relState, contentTypesState);
    chunk = renumberDrawingIds(chunk, drawingCounter);
    chunks.push(chunk);
  }

  outputZip.file("word/document.xml", `${prefix}${chunks.join("")}${sectPr}${suffix}`);
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
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function exportPaperToWord(questions: Question[]) {
  if (!questions.length) return;

  const missing = questions.filter(q => !getFormattedSource(q));
  if (missing.length) {
    const labels = missing.map(q => `${q.session} ${q.year} ${q.paper} Q${q.questionNumber}`).join(", ");
    throw new Error(`Formatted Word source not uploaded/mapped yet for: ${labels}`);
  }

  const filenames = questions.map(q => getFormattedSource(q)!);
  const uniqueFilenames = Array.from(new Set(filenames));

  if (uniqueFilenames.length === 1) {
    await exportFromSingleSource(questions, await loadSource(uniqueFilenames[0]));
    return;
  }

  const sources = await Promise.all(filenames.map(loadSource));
  await exportAcrossSources(questions, sources);
}
