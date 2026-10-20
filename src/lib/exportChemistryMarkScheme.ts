"use client";

import { AlignmentType, BorderStyle, Document, ImageRun, Packer, Paragraph, Table, TableCell, TableLayoutType, TableRow, TextRun, WidthType } from "docx";
import type { ChemistryQuestionSelection } from "./chemistryParts";
import { chemistryPartOptions } from "./chemistryParts";
import { CHEMISTRY_MARKSCHEME_BUCKET, getChemistryMarkSchemeSource } from "./chemistryMarkSchemeSources";
import { supabase } from "./supabase";

type CropRegion = { page: number; rect: number[] };
type Entry = { part: string; roman: string; answer: string; notes: string; marks: string; crop?: CropRegion };
type IndexedPaper = { sha256: string; questions: Record<string, Entry[]>; totals: Record<string, number> };
type Crop = { bytes: Uint8Array; width: number; height: number };
const pdfCache = new Map<string, Promise<any>>();
const cropCache = new Map<string, Promise<Crop>>();
let indexPromise: Promise<Record<string, IndexedPaper>> | undefined;

function getIndex() {
  return indexPromise ??= import("./chemistryMarkSchemeIndex.json").then(module => module.default as Record<string, IndexedPaper>);
}

async function loadPdf(filename: string, sha256: string) {
  if (!pdfCache.has(filename)) {
    const promise = (async () => {
      const { data, error } = await supabase.storage.from(CHEMISTRY_MARKSCHEME_BUCKET).download(filename);
      if (error || !data) throw new Error(`Could not download the Chemistry mark scheme: ${error?.message || filename}`);
      const bytes = new Uint8Array(await data.arrayBuffer());
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map(n => n.toString(16).padStart(2, "0")).join("");
      if (hash !== sha256) throw new Error(`The source mark scheme ${filename} has changed. Its answer index needs updating before it can be exported.`);
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      if (!pdfjs.GlobalWorkerOptions.workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@4.10.38/legacy/build/pdf.worker.min.mjs";
      return pdfjs.getDocument({ data: bytes }).promise;
    })();
    pdfCache.set(filename, promise);
    promise.catch(() => pdfCache.delete(filename));
  }
  return pdfCache.get(filename)!;
}

function trimCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const context = source.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Could not render the Chemistry diagram.");
  const image = context.getImageData(0, 0, source.width, source.height);
  let left = source.width, right = 0, top = source.height, bottom = 0;
  for (let y = 0; y < source.height; y += 2) for (let x = 0; x < source.width; x += 2) {
    const i = (y * source.width + x) * 4;
    if (image.data[i] < 240 || image.data[i + 1] < 240 || image.data[i + 2] < 240) {
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  if (right <= left || bottom <= top) throw new Error("The visual answer region is empty. Please report this question.");
  left = Math.max(0, left - 8); top = Math.max(0, top - 8);
  right = Math.min(source.width - 1, right + 8); bottom = Math.min(source.height - 1, bottom + 8);
  const out = document.createElement("canvas");
  out.width = right - left + 1; out.height = bottom - top + 1;
  out.getContext("2d")!.drawImage(source, left, top, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

async function renderCrop(filename: string, sha256: string, crop: CropRegion): Promise<Crop> {
  const key = `${filename}|${crop.page}|${crop.rect.join(",")}`;
  if (!cropCache.has(key)) {
    const promise = (async () => {
      const pdf = await loadPdf(filename, sha256);
      const page = await pdf.getPage(crop.page);
      const scale = 2.2;
      const viewport = page.getViewport({ scale });
      const [x0, y0, x1, y1] = crop.rect;
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil((x1 - x0) * scale); canvas.height = Math.ceil((y1 - y0) * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not create the Chemistry diagram canvas.");
      await page.render({ canvasContext: context, viewport, transform: [1, 0, 0, 1, -x0 * scale, -y0 * scale] }).promise;
      const trimmed = trimCanvas(canvas);
      const blob = await new Promise<Blob>((resolve, reject) => trimmed.toBlob(b => b ? resolve(b) : reject(new Error("Could not save the Chemistry diagram.")), "image/png"));
      return { bytes: new Uint8Array(await blob.arrayBuffer()), width: trimmed.width, height: trimmed.height };
    })();
    cropCache.set(key, promise);
    promise.catch(() => cropCache.delete(key));
  }
  return cropCache.get(key)!;
}

const run = (text: string, bold = false) => new TextRun({ text, font: "Arial", size: 20, bold });
function paragraphs(text: string, bold = false) {
  return (text.split(/\n/).filter(Boolean).length ? text.split(/\n/).filter(Boolean) : [""]).map(line => new Paragraph({ children: [run(line, bold)], spacing: { before: 0, after: 35, line: 250 } }));
}
const borders = Object.fromEntries(["top", "bottom", "left", "right"].map(edge => [edge, { style: BorderStyle.SINGLE, size: 4, color: "B8BDC7" }]));
function cell(children: Paragraph[], width: number, header = false) {
  return new TableCell({ children, width: { size: width * 100, type: WidthType.DXA }, borders, margins: { top: 80, bottom: 80, left: 90, right: 90 }, shading: header ? { fill: "E8EBF0" } : undefined });
}

export function selectChemistryMarkSchemeEntries(entries: Entry[], selectedParts?: string[]) {
  const allParts = Array.from(new Set(entries.map(entry => entry.part).filter(Boolean)));
  // The question-paper exporter keeps source order when renumbering parts.
  const kept = selectedParts?.length ? allParts.filter(part => selectedParts.includes(part)) : allParts;
  if (selectedParts?.some(part => !allParts.includes(part))) throw new Error("A selected question part is missing from its Chemistry mark scheme.");
  return entries.filter(entry => !entry.part || kept.includes(entry.part)).map(entry => ({ ...entry, displayPart: entry.part ? `(${selectedParts?.length ? String.fromCharCode(97 + kept.indexOf(entry.part)) : entry.part})` : "" }));
}

export async function createChemistryMarkSchemeDocument(questions: ChemistryQuestionSelection[]) {
  if (!questions.length) throw new Error("Add at least one question before downloading a mark scheme.");
  const index = await getIndex();
  const sources = questions.map(question => {
    const filename = getChemistryMarkSchemeSource(question);
    if (!filename || !index[filename]?.questions[String(question.questionNumber)]) throw new Error(`A Chemistry mark scheme is not available for ${question.session} ${question.year}, Paper ${question.paper}. Remove that question or choose one with an uploaded mark scheme.`);
    return { filename, source: index[filename] };
  });
  const children: Array<Paragraph | Table> = [
    new Paragraph({ children: [new TextRun({ text: "MagicQuestions Chemistry Mark Scheme", font: "Arial", bold: true, size: 32 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
    new Paragraph({ children: [run(`Generated for ${questions.length} ${questions.length === 1 ? "question" : "questions"}`)], alignment: AlignmentType.CENTER, spacing: { after: 240 } }),
  ];
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const { filename, source } = sources[i];
    const entries = selectChemistryMarkSchemeEntries(source.questions[String(question.questionNumber)], question.selectedParts);
    const options = chemistryPartOptions(question);
    children.push(new Paragraph({ children: [new TextRun({ text: `Q${i + 1}.`, font: "Arial", bold: true, size: 28 })], pageBreakBefore: i > 0, keepNext: true, spacing: { before: 0, after: 90 } }));
    const seen = new Set<string>();
    const rows = [new TableRow({ tableHeader: true, cantSplit: true, children: [cell(paragraphs("Part", true), 10, true), cell(paragraphs("Answer", true), 52, true), cell(paragraphs("Notes", true), 28, true), cell(paragraphs("Marks", true), 10, true)] })];
    for (const entry of entries) {
      let answer: Paragraph[];
      if (entry.crop) {
        const crop = await renderCrop(filename, source.sha256, entry.crop);
        const ratio = Math.min(277 / crop.width, 470 / crop.height, 1);
        answer = [new Paragraph({ children: [new ImageRun({ type: "png", data: crop.bytes, transformation: { width: Math.round(crop.width * ratio), height: Math.round(crop.height * ratio) }, altText: { title: `Answer ${entry.displayPart}`, description: "Original diagram, table or chemical notation from the marking scheme", name: "Chemistry visual answer" } })], spacing: { before: 0, after: 0 } })];
      } else answer = paragraphs(entry.answer);
      const samePart = entries.filter(row => row.part === entry.part);
      const marks = options.find(option => option.part === entry.part)?.marks
        ?? samePart.reduce((sum, row) => sum + row.marks.split(/\s+/).reduce((n, value) => n + Number(value || 0), 0), 0);
      // The 2022 source repeats a stray 1 beside Q5(a)(i); its printed total is 11.
      const corrected = question.year === 2022 && question.paper === "1C" && question.questionNumber === 5 && entry.part === "a" ? 6 : marks;
      rows.push(new TableRow({ children: [cell(paragraphs(entry.displayPart), 10), cell(answer, 52), cell(paragraphs(entry.notes), 28), cell(paragraphs(seen.has(entry.part) ? "" : String(corrected)), 10)] }));
      seen.add(entry.part);
    }
    children.push(new Table({ width: { size: 10000, type: WidthType.DXA }, columnWidths: [1000, 5200, 2800, 1000], layout: TableLayoutType.FIXED, rows }));
  }
  return new Document({ styles: { default: { document: { run: { font: "Arial", size: 20 }, paragraph: { spacing: { after: 0, line: 250 } } } } }, sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children }] });
}

export async function exportChemistryMarkSchemeToWord(questions: ChemistryQuestionSelection[]) {
  const blob = await Packer.toBlob(await createChemistryMarkSchemeDocument(questions));
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href; anchor.download = "MagicQuestions-Chemistry-Mark-Scheme.docx";
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 2000);
}
