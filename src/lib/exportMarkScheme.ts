"use client";

import { Document, HeadingLevel, ImageRun, Packer, Paragraph, PageBreak, TextRun } from "docx";
import type { Question } from "./questions";
import { supabase } from "./supabase";
import { getMarkSchemeSource, MARKSCHEME_BUCKET } from "./markSchemeSources";

type PdfDocumentProxy = any;
type PdfPageProxy = any;
type TextItem = { str?: string; transform?: number[]; width?: number; height?: number };

type QuestionStart = {
  pageIndex: number;
  top: number;
};

type Crop = {
  bytes: Uint8Array;
  width: number;
  height: number;
};

const pdfCache = new Map<string, Promise<PdfDocumentProxy>>();

async function getPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@4.10.38/legacy/build/pdf.worker.min.mjs";
  }
  return pdfjs;
}

async function downloadFirstAvailable(filenames: string[]): Promise<{ filename: string; data: Uint8Array }> {
  let lastError = "Mark scheme file was not found.";
  for (const filename of filenames) {
    const { data, error } = await supabase.storage.from(MARKSCHEME_BUCKET).download(filename);
    if (data && !error) return { filename, data: new Uint8Array(await data.arrayBuffer()) };
    if (error?.message) lastError = error.message;
  }
  throw new Error(`Could not download the mark scheme from ${MARKSCHEME_BUCKET}. ${lastError}`);
}

async function loadPdf(filenames: string[]): Promise<{ filename: string; pdf: PdfDocumentProxy }> {
  const cacheKey = filenames.join("|");
  if (!pdfCache.has(cacheKey)) {
    pdfCache.set(cacheKey, (async () => {
      const { filename, data } = await downloadFirstAvailable(filenames);
      const pdfjs = await getPdfJs();
      const loadingTask = pdfjs.getDocument({ data });
      const pdf = await loadingTask.promise;
      (pdf as any).__mqFilename = filename;
      return pdf;
    })());
  }
  const pdf = await pdfCache.get(cacheKey)!;
  return { filename: (pdf as any).__mqFilename || filenames[0], pdf };
}

function questionNumberFromText(value: string): number | null {
  const text = value.replace(/\u00a0/g, " ").trim();

  // Standard Pearson rows: "1", "1 (a)", "1*", "12 (a)" etc.
  let match = text.match(/^(\d{1,2})(?:\s*\*|\s+|\s*\(|$)/);
  if (match) return Number(match[1]);

  // Some Pearson clerical/type-3 schemes use labels such as Q01a / Q04b.
  match = text.match(/^Q0?(\d{1,2})(?:[a-z]|\b)/i);
  return match ? Number(match[1]) : null;
}

function candidateQuestionMarker(item: TextItem, viewportWidth: number): number | null {
  const q = questionNumberFromText(item.str || "");
  if (!q) return null;

  const transform = item.transform || [];
  const x = transform[4] ?? Number.POSITIVE_INFINITY;

  // Question numbers live in the first column. Allow a little more room than the
  // old 105pt cutoff because several Pearson PDFs position the Q column farther in.
  if (x > Math.min(165, viewportWidth * 0.28)) return null;
  return q;
}

async function locateQuestionStarts(pdf: PdfDocumentProxy, maxQuestion: number): Promise<Map<number, QuestionStart>> {
  const candidates = new Map<number, QuestionStart[]>();

  for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex++) {
    const page: PdfPageProxy = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    for (const raw of content.items as TextItem[]) {
      const q = candidateQuestionMarker(raw, viewport.width);
      if (!q || q > maxQuestion) continue;
      const y = raw.transform?.[5];
      if (typeof y !== "number") continue;
      const top = Math.max(0, viewport.height - y - 13);
      const list = candidates.get(q) || [];
      list.push({ pageIndex, top });
      candidates.set(q, list);
    }
  }

  // Ignore front-matter false positives by preferring a monotonic run through the
  // actual mark-scheme tables, but do not require every preceding question to exist.
  const chosen = new Map<number, QuestionStart>();
  let previous: QuestionStart | null = null;
  for (let q = 1; q <= maxQuestion; q++) {
    const all = (candidates.get(q) || []).sort((a, b) => a.pageIndex - b.pageIndex || a.top - b.top);
    if (!all.length) continue;

    let pick: QuestionStart | undefined;
    if (previous) {
      pick = all.find(pos => pos.pageIndex > previous!.pageIndex || (pos.pageIndex === previous!.pageIndex && pos.top > previous!.top + 3));
    }
    if (!pick) {
      // For a missing/odd earlier marker, fall back to the first occurrence on page 4+
      // (index 4 == PDF page 5), where Pearson's actual answer tables normally begin.
      pick = all.find(pos => pos.pageIndex >= 4) || all[0];
    }

    chosen.set(q, pick);
    if (!previous || pick.pageIndex > previous.pageIndex || (pick.pageIndex === previous.pageIndex && pick.top > previous.top)) previous = pick;
  }

  return chosen;
}

async function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(value => value ? resolve(value) : reject(new Error("Could not create mark scheme image.")), "image/jpeg", 0.92);
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function trimWhiteMargins(source: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = source.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;
  const image = ctx.getImageData(0, 0, source.width, source.height);
  const { data, width, height } = image;
  let left = width, right = 0, top = height, bottom = 0;
  const threshold = 247;
  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const i = (y * width + x) * 4;
      if (data[i] < threshold || data[i + 1] < threshold || data[i + 2] < threshold) {
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
  }
  if (right <= left || bottom <= top) return source;
  const pad = 18;
  left = Math.max(0, left - pad); top = Math.max(0, top - pad);
  right = Math.min(width - 1, right + pad); bottom = Math.min(height - 1, bottom + pad);
  const out = document.createElement("canvas");
  out.width = right - left + 1;
  out.height = bottom - top + 1;
  out.getContext("2d")?.drawImage(source, left, top, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

async function renderCrop(page: PdfPageProxy, fromTop: number, toTop: number): Promise<Crop> {
  const scale = 2.15;
  const viewport = page.getViewport({ scale });
  const full = document.createElement("canvas");
  full.width = Math.ceil(viewport.width);
  full.height = Math.ceil(viewport.height);
  const fullCtx = full.getContext("2d");
  if (!fullCtx) throw new Error("Canvas is unavailable in this browser.");
  await page.render({ canvasContext: fullCtx, viewport }).promise;

  const topPx = Math.max(0, Math.floor((fromTop - 8) * scale));
  const bottomPx = Math.min(full.height, Math.ceil((toTop + 8) * scale));
  const cropHeight = Math.max(24, bottomPx - topPx);
  const cropped = document.createElement("canvas");
  cropped.width = full.width;
  cropped.height = cropHeight;
  cropped.getContext("2d")?.drawImage(full, 0, topPx, full.width, cropHeight, 0, 0, full.width, cropHeight);
  const trimmed = trimWhiteMargins(cropped);
  const bytes = await canvasToJpeg(trimmed);
  return { bytes, width: trimmed.width, height: trimmed.height };
}

async function extractQuestionCrops(pdf: PdfDocumentProxy, starts: Map<number, QuestionStart>, questionNumber: number): Promise<Crop[]> {
  const start = starts.get(questionNumber);
  if (!start) {
    const found = Array.from(starts.keys()).sort((a, b) => a - b).join(", ");
    throw new Error(`Could not locate Q${questionNumber} in this Pearson mark scheme. Detected questions: ${found || "none"}.`);
  }

  // Find the next detected question, not merely q+1. This handles schemes where a
  // question marker is split/omitted and clerical schemes that contain selected parts.
  const nextNumber = Array.from(starts.keys()).filter(n => n > questionNumber).sort((a, b) => a - b)[0];
  const next = nextNumber ? starts.get(nextNumber)! : null;
  const crops: Crop[] = [];

  const lastPage = next ? next.pageIndex : pdf.numPages - 1;
  for (let pageIndex = start.pageIndex; pageIndex <= lastPage; pageIndex++) {
    const page: PdfPageProxy = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1 });
    let fromTop = pageIndex === start.pageIndex ? start.top : 0;
    let toTop = viewport.height;
    if (next && pageIndex === next.pageIndex) toTop = next.top;
    if (toTop - fromTop < 10) continue;
    crops.push(await renderCrop(page, fromTop, toTop));
    if (next && pageIndex === next.pageIndex) break;
  }
  return crops;
}

function imageParagraph(crop: Crop): Paragraph {
  const maxWidth = 610;
  const maxHeight = 760;
  const scale = Math.min(maxWidth / crop.width, maxHeight / crop.height, 1);
  return new Paragraph({
    children: [new ImageRun({ data: crop.bytes, transformation: { width: Math.round(crop.width * scale), height: Math.round(crop.height * scale) }, type: "jpg" })],
    spacing: { after: 120 },
  });
}

export async function exportMarkSchemeToWord(questions: Question[]) {
  if (!questions.length) throw new Error("Add at least one question before downloading a mark scheme.");

  const grouped = new Map<string, { source: NonNullable<ReturnType<typeof getMarkSchemeSource>>; pdf: PdfDocumentProxy; starts: Map<number, QuestionStart> }>();

  for (const q of questions) {
    const source = getMarkSchemeSource(q);
    if (!source) throw new Error(`A formatted mark scheme is not available yet for ${q.session} ${q.year} Paper ${q.paper}.`);
    const key = `${q.year}|${q.session}|${q.paper}`;
    if (!grouped.has(key)) {
      const { pdf } = await loadPdf(source.filenames);
      const starts = await locateQuestionStarts(pdf, source.maxQuestion);
      grouped.set(key, { source, pdf, starts });
    }
  }

  const children: Paragraph[] = [
    new Paragraph({
      text: "MagicQuestions Mark Scheme",
      heading: HeadingLevel.TITLE,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Pearson Edexcel examination materials are © Pearson Education Limited. MagicQuestions is not affiliated with or endorsed by Pearson.", italics: true, size: 18 })],
      spacing: { after: 260 },
    }),
  ];

  for (let index = 0; index < questions.length; index++) {
    const q = questions[index];
    const key = `${q.year}|${q.session}|${q.paper}`;
    const loaded = grouped.get(key)!;
    children.push(new Paragraph({ children: [new TextRun({ text: `Q${index + 1}.`, bold: true, size: 28 })], spacing: { before: index ? 180 : 0, after: 100 } }));
    const crops = await extractQuestionCrops(loaded.pdf, loaded.starts, q.questionNumber);
    crops.forEach(crop => children.push(imageParagraph(crop)));
    if (index < questions.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = "MagicQuestions-Mark-Scheme.docx";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 2000);
}
