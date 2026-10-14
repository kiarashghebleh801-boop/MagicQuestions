"use client";

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { Question } from "./questions";
import { supabase } from "./supabase";
import { getPhysicsMarkSchemeSource, PHYSICS_MARKSCHEME_BUCKET } from "./physicsMarkSchemeSources";

type PdfDocumentProxy = any;
type PdfPageProxy = any;
type TextItem = { str?: string; transform?: number[]; width?: number; height?: number };

type SourceLine = {
  pageIndex: number;
  top: number;
  question: string;
  answer: string;
  notes: string;
  marks: string;
};

type MarkSchemeEntry = {
  part: string;
  answer: string;
  notes: string;
  marks: string;
};

type QuestionBounds = { startPage: number; startTop: number; endPage: number; endTop: number };
type ParsedMarkScheme = {
  entries: Map<number, MarkSchemeEntry[]>;
  bounds: Map<number, QuestionBounds>;
};
type Crop = { bytes: Uint8Array; width: number; height: number };

const pdfCache = new Map<string, Promise<PdfDocumentProxy>>();
const parsedCache = new Map<string, Promise<ParsedMarkScheme>>();

async function getPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@4.10.38/legacy/build/pdf.worker.min.mjs";
  }
  return pdfjs;
}

async function loadPdf(filename: string): Promise<PdfDocumentProxy> {
  if (!pdfCache.has(filename)) {
    pdfCache.set(filename, (async () => {
      const { data, error } = await supabase.storage.from(PHYSICS_MARKSCHEME_BUCKET).download(filename);
      if (error || !data) {
        throw new Error(`Could not download ${filename} from ${PHYSICS_MARKSCHEME_BUCKET}. ${error?.message || "File not found."}`);
      }
      const pdfjs = await getPdfJs();
      return await pdfjs.getDocument({ data: new Uint8Array(await data.arrayBuffer()) }).promise;
    })());
  }
  return pdfCache.get(filename)!;
}

function cleanCellText(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/([[(])\s+/g, "$1")
    .replace(/\s+([)\]])/g, "$1")
    .replace(/\s+([×÷=])/g, " $1")
    .replace(/([×÷=])\s+/g, "$1 ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function joinCellText(current: string, addition: string): string {
  const clean = cleanCellText(addition);
  if (!clean) return current;
  if (!current) return clean;
  const separator = /[;:.]$/.test(current) || /^(?:MP\d+|allow|accept|reject|ignore|condone|e\.g\.)\b/i.test(clean)
    ? "\n"
    : " ";
  return cleanCellText(`${current}${separator}${clean}`);
}

function looksLikeHeader(line: SourceLine): boolean {
  const combined = `${line.question} ${line.answer} ${line.notes} ${line.marks}`.toLowerCase();
  return combined.includes("question") && combined.includes("answer") && combined.includes("marks");
}

async function extractSourceLines(pdf: PdfDocumentProxy): Promise<SourceLine[]> {
  const pdfjs = await getPdfJs();
  const lines: SourceLine[] = [];

  for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex++) {
    const page: PdfPageProxy = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const positioned = (content.items as TextItem[])
      .filter(item => typeof item.str === "string" && item.str!.trim() && item.transform?.length)
      .map(item => {
        const [x, y] = pdfjs.Util.applyTransform([item.transform![4], item.transform![5]], viewport.transform);
        return { text: item.str!.trim(), x, top: y };
      })
      .sort((a, b) => a.top - b.top || a.x - b.x);

    const grouped: Array<{ top: number; items: typeof positioned }> = [];
    for (const item of positioned) {
      const existing = grouped.find(line => Math.abs(line.top - item.top) <= 2.6);
      if (existing) {
        existing.items.push(item);
        existing.top = (existing.top + item.top) / 2;
      } else {
        grouped.push({ top: item.top, items: [item] });
      }
    }

    for (const group of grouped.sort((a, b) => a.top - b.top)) {
      if (group.top < viewport.height * 0.07 || group.top > viewport.height * 0.955) continue;
      const headerItems = group.items.filter(item => /^(Question|Number|Answer|Notes|Marks)$/i.test(item.text));
      if (headerItems.length >= 2) continue;

      const question: string[] = [];
      const answer: string[] = [];
      const notes: string[] = [];
      const marks: string[] = [];
      for (const item of group.items.sort((a, b) => a.x - b.x)) {
        const ratio = item.x / viewport.width;
        const isQuestionLabel = /^(?:\d{1,2}|\([a-z0-9]+\))$/i.test(item.text);
        if (ratio < 0.195 && isQuestionLabel) question.push(item.text);
        else if (ratio < 0.575) answer.push(item.text);
        else if (ratio < 0.81) notes.push(item.text);
        else marks.push(item.text);
      }
      const line: SourceLine = {
        pageIndex,
        top: group.top / viewport.height,
        question: cleanCellText(question.join(" ")).replace(/^(\d)\s+(\d)(?=\s|$)/, "$1$2"),
        answer: cleanCellText(answer.join(" ")),
        notes: cleanCellText(notes.join(" ")),
        marks: cleanCellText(marks.join(" ")),
      };
      if (!looksLikeHeader(line) && (line.question || line.answer || line.notes || line.marks)) lines.push(line);
    }
  }
  return lines;
}

function isPageFurniture(line: SourceLine): boolean {
  const text = `${line.question} ${line.answer} ${line.notes} ${line.marks}`.trim();
  return /^(?:Pearson|Turn over|P\d+[A-Z]*|\d+)$/i.test(text) && line.top > 0.9;
}

function parseEntries(lines: SourceLine[], pageCount: number): ParsedMarkScheme {
  const questions = new Map<number, MarkSchemeEntry[]>();
  const starts: Array<{ questionNumber: number; pageIndex: number; top: number }> = [];
  let currentQuestion: number | null = null;
  let currentEntry: MarkSchemeEntry | null = null;
  let expectedQuestion = 1;

  for (const line of lines) {
    if (isPageFurniture(line)) continue;
    if (/Total for Question/i.test(`${line.question} ${line.answer} ${line.notes} ${line.marks}`)) continue;
    const startMatch = line.question.match(/^(\d{1,2})(?:\s+|$)(.*)$/);
    if (startMatch && Number(startMatch[1]) === expectedQuestion) {
      currentQuestion = expectedQuestion++;
      starts.push({ questionNumber: currentQuestion, pageIndex: line.pageIndex, top: line.top });
      if (!questions.has(currentQuestion)) questions.set(currentQuestion, []);
      currentEntry = null;
      line.question = startMatch[2].trim();
    }
    if (currentQuestion === null) continue;

    const hasPart = /^\([a-z0-9]+\)(?:\s+\([a-z0-9]+\))*$/i.test(line.question);
    const hasMark = /\d/.test(line.marks);
    const startsEntry = !currentEntry || hasPart || (line.question && !/^\d+$/.test(line.question)) || hasMark;

    if (startsEntry) {
      currentEntry = {
        part: line.question,
        answer: line.answer,
        notes: line.notes,
        marks: line.marks,
      };
      questions.get(currentQuestion)!.push(currentEntry);
    } else if (currentEntry) {
      currentEntry.answer = joinCellText(currentEntry.answer, line.answer);
      currentEntry.notes = joinCellText(currentEntry.notes, line.notes);
      currentEntry.marks = joinCellText(currentEntry.marks, line.marks);
      if (line.question) currentEntry.part = joinCellText(currentEntry.part, line.question);
    }
  }

  for (const [questionNumber, entries] of Array.from(questions.entries())) {
    const useful = entries.filter(entry => {
      const combined = `${entry.part} ${entry.answer} ${entry.notes} ${entry.marks}`;
      if (/Total for Question/i.test(combined)) return false;
      if (/Question\s+Answer\s+(?:number\s+)?Notes\s+Marks/i.test(combined)) return false;
      return Boolean(entry.part || entry.answer || entry.notes || entry.marks);
    });
    if (!useful.some(entry => entry.answer || entry.notes)) questions.delete(questionNumber);
    else questions.set(questionNumber, useful);
  }

  const bounds = new Map<number, QuestionBounds>();
  for (let index = 0; index < starts.length; index++) {
    const start = starts[index];
    const next = starts[index + 1];
    bounds.set(start.questionNumber, {
      startPage: start.pageIndex,
      startTop: Math.max(0.04, start.top - 0.008),
      endPage: next?.pageIndex ?? pageCount - 1,
      endTop: next ? Math.max(0.04, next.top - 0.008) : 0.94,
    });
  }
  return { entries: questions, bounds };
}

async function parseMarkScheme(filename: string): Promise<ParsedMarkScheme> {
  if (!parsedCache.has(filename)) {
    parsedCache.set(filename, (async () => {
      const pdf = await loadPdf(filename);
      return parseEntries(await extractSourceLines(pdf), pdf.numPages);
    })());
  }
  return parsedCache.get(filename)!;
}

function needsVisualReference(entries: MarkSchemeEntry[]): boolean {
  return entries.some(entry => /(?:correct tick|correct row|diagram|drawn|drawing|sketch|graph|ray|arrow|label|circuit|plotted)/i.test(entry.answer)
    || /(?:e\.g\.|example)\s*$/i.test(entry.answer.trim()));
}

function trimCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const context = source.getContext("2d", { willReadFrequently: true });
  if (!context) return source;
  const image = context.getImageData(0, 0, source.width, source.height);
  let left = source.width, right = 0, top = source.height, bottom = 0;
  for (let y = 0; y < source.height; y += 2) {
    for (let x = 0; x < source.width; x += 2) {
      const offset = (y * source.width + x) * 4;
      if (image.data[offset] < 246 || image.data[offset + 1] < 246 || image.data[offset + 2] < 246) {
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
  }
  if (right <= left || bottom <= top) return source;
  const padding = 12;
  left = Math.max(0, left - padding); top = Math.max(0, top - padding);
  right = Math.min(source.width - 1, right + padding); bottom = Math.min(source.height - 1, bottom + padding);
  const output = document.createElement("canvas");
  output.width = right - left + 1;
  output.height = bottom - top + 1;
  output.getContext("2d")?.drawImage(source, left, top, output.width, output.height, 0, 0, output.width, output.height);
  return output;
}

async function canvasToPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(value => value ? resolve(value) : reject(new Error("Could not create a visual mark-scheme reference.")), "image/png");
  });
  return new Uint8Array(await blob.arrayBuffer());
}

async function renderVisualReference(filename: string, bounds: QuestionBounds, fullTable = false): Promise<Crop[]> {
  const pdf = await loadPdf(filename);
  const crops: Crop[] = [];
  for (let pageIndex = bounds.startPage; pageIndex <= bounds.endPage; pageIndex++) {
    const page: PdfPageProxy = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 2.2 });
    const full = document.createElement("canvas");
    full.width = Math.ceil(viewport.width);
    full.height = Math.ceil(viewport.height);
    const context = full.getContext("2d");
    if (!context) continue;
    await page.render({ canvasContext: context, viewport }).promise;

    const fromTop = pageIndex === bounds.startPage ? bounds.startTop : 0.14;
    const toTop = pageIndex === bounds.endPage ? bounds.endTop : 0.94;
    const left = Math.floor(full.width * (fullTable ? 0.07 : 0.19));
    const right = Math.ceil(full.width * 0.94);
    const top = Math.max(0, Math.floor(full.height * fromTop));
    const bottom = Math.min(full.height, Math.ceil(full.height * toTop));
    if (right <= left || bottom <= top + 8) continue;
    const cropped = document.createElement("canvas");
    cropped.width = right - left;
    cropped.height = bottom - top;
    cropped.getContext("2d")?.drawImage(full, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
    const trimmed = trimCanvas(cropped);
    crops.push({ bytes: await canvasToPng(trimmed), width: trimmed.width, height: trimmed.height });
  }
  return crops;
}

function arialRun(text: string, options: { bold?: boolean; italics?: boolean; size?: number; color?: string } = {}) {
  return new TextRun({
    text,
    font: "Arial",
    bold: options.bold,
    italics: options.italics,
    size: options.size || 20,
    color: options.color,
  });
}

function cellParagraph(text: string, options: { bold?: boolean; color?: string; centered?: boolean } = {}) {
  const lines = text.split(/\n+/).map(value => value.trim()).filter(Boolean);
  return new Paragraph({
    children: lines.length
      ? lines.flatMap((line, index) => [arialRun(line, { bold: options.bold, color: options.color }), ...(index < lines.length - 1 ? [arialRun("\n")] : [])])
      : [arialRun("")],
    alignment: options.centered ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { before: 0, after: 0, line: 250 },
  });
}

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "B8BDC7" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "B8BDC7" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "B8BDC7" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "B8BDC7" },
};

function tableCell(text: string, width: number, options: { header?: boolean; centered?: boolean } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: options.header ? { type: ShadingType.CLEAR, fill: "E8EBF0", color: "auto" } : undefined,
    borders: cellBorders,
    margins: { top: 90, bottom: 90, left: 100, right: 100 },
    children: [cellParagraph(text, { bold: options.header, centered: options.centered })],
  });
}

function questionTable(entries: MarkSchemeEntry[]) {
  const rows = entries.map(entry => new TableRow({
    cantSplit: true,
    children: [
      tableCell(entry.part || "", 13, { centered: true }),
      tableCell(entry.answer || "", 49),
      tableCell(entry.notes || "", 28),
      tableCell(entry.marks || "", 10, { centered: true }),
    ],
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          tableCell("Part", 13, { header: true, centered: true }),
          tableCell("Answer", 49, { header: true }),
          tableCell("Notes", 28, { header: true }),
          tableCell("Marks", 10, { header: true, centered: true }),
        ],
      }),
      ...rows,
    ],
  });
}

function visualReferenceParagraph(crop: Crop) {
  const ratio = Math.min(500 / crop.width, 350 / crop.height, 1);
  return new Paragraph({
    children: [new ImageRun({
      data: crop.bytes,
      type: "png",
      transformation: { width: Math.round(crop.width * ratio), height: Math.round(crop.height * ratio) },
    })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 60 },
  });
}

function downloadBlob(blob: Blob) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = "MagicQuestions-Physics-Mark-Scheme.docx";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 2000);
}

export async function exportPhysicsMarkSchemeToWord(questions: Question[]) {
  if (!questions.length) throw new Error("Add at least one question before downloading a mark scheme.");

  const sourceFiles = new Map<string, Promise<ParsedMarkScheme>>();
  for (const question of questions) {
    const filename = getPhysicsMarkSchemeSource(question);
    if (!filename) {
      throw new Error(`A Physics mark scheme is not mapped for ${question.session} ${question.year} Paper ${question.paper}.`);
    }
    if (!sourceFiles.has(filename)) sourceFiles.set(filename, parseMarkScheme(filename));
  }
  await Promise.all(Array.from(sourceFiles.values()));

  const children: Array<Paragraph | Table> = [
    new Paragraph({
      text: "MagicQuestions Physics Mark Scheme",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      style: "Title",
    }),
    new Paragraph({
      children: [arialRun(`Generated for ${questions.length} ${questions.length === 1 ? "question" : "questions"}`, { size: 20, color: "5F6672" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 260 },
    }),
  ];

  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    const filename = getPhysicsMarkSchemeSource(question)!;
    const parsed = await sourceFiles.get(filename)!;
    const entries = parsed.entries.get(question.questionNumber);
    const bounds = parsed.bounds.get(question.questionNumber);
    if (!entries?.length && !bounds) {
      throw new Error(`Could not read the typed mark scheme for ${question.session} ${question.year} Paper ${question.paper}, original Q${question.questionNumber}.`);
    }
    if (index > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({
      children: [arialRun(`Q${index + 1}.`, { bold: true, size: 28 })],
      spacing: { before: 0, after: 90 },
      keepNext: true,
    }));
    if (entries?.length) children.push(questionTable(entries));
    if (!entries?.length || needsVisualReference(entries)) {
      if (bounds) {
        children.push(new Paragraph({
          children: [arialRun("Visual answer detail", { bold: true, size: 18, color: "5F6672" })],
          spacing: { before: 100, after: 30 },
          keepNext: true,
        }));
        const crops = await renderVisualReference(filename, bounds, !entries?.length);
        for (const crop of crops) children.push(visualReferenceParagraph(crop));
      }
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 20 }, paragraph: { spacing: { after: 0, line: 250 } } },
        title: { run: { font: "Arial", bold: true, size: 34, color: "111827" } },
      },
    },
    sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children }],
  });
  downloadBlob(await Packer.toBlob(doc));
}

