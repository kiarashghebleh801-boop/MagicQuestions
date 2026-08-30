"use client";

import { Document, HeadingLevel, ImageRun, Packer, Paragraph, PageBreak, TextRun } from "docx";
import type { Question } from "./questions";
import { supabase } from "./supabase";
import { getMarkSchemeSource, MARKSCHEME_BUCKET, type MarkSchemeSource } from "./markSchemeSources";

type PdfDocumentProxy = any;
type PdfPageProxy = any;
type Crop = { bytes: Uint8Array; width: number; height: number };

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

async function loadPdf(filenames: string[]): Promise<PdfDocumentProxy> {
  const cacheKey = filenames.join("|");
  if (!pdfCache.has(cacheKey)) {
    pdfCache.set(cacheKey, (async () => {
      const { data } = await downloadFirstAvailable(filenames);
      const pdfjs = await getPdfJs();
      return await pdfjs.getDocument({ data }).promise;
    })());
  }
  return pdfCache.get(cacheKey)!;
}

async function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(value => value ? resolve(value) : reject(new Error("Could not create mark scheme image.")), "image/jpeg", 0.94);
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function trimWhiteMargins(source: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = source.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;
  const image = ctx.getImageData(0, 0, source.width, source.height);
  const { data, width, height } = image;
  let left = width, right = 0, top = height, bottom = 0;
  const threshold = 248;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      if (data[i] < threshold || data[i + 1] < threshold || data[i + 2] < threshold) {
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
  }
  if (right <= left || bottom <= top) return source;
  const pad = 14;
  left = Math.max(0, left - pad); top = Math.max(0, top - pad);
  right = Math.min(width - 1, right + pad); bottom = Math.min(height - 1, bottom + pad);
  const out = document.createElement("canvas");
  out.width = right - left + 1;
  out.height = bottom - top + 1;
  out.getContext("2d")?.drawImage(source, left, top, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

async function renderCrop(page: PdfPageProxy, fromRatio: number, toRatio: number): Promise<Crop> {
  const scale = 2.2;
  const viewport = page.getViewport({ scale });
  const full = document.createElement("canvas");
  full.width = Math.ceil(viewport.width);
  full.height = Math.ceil(viewport.height);
  const ctx = full.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  await page.render({ canvasContext: ctx, viewport }).promise;

  const topPx = Math.max(0, Math.floor(fromRatio * full.height) - 10);
  const bottomPx = Math.min(full.height, Math.ceil(toRatio * full.height) + 10);
  if (bottomPx <= topPx + 20) throw new Error("Invalid mark scheme crop boundary.");

  const cropped = document.createElement("canvas");
  cropped.width = full.width;
  cropped.height = bottomPx - topPx;
  cropped.getContext("2d")?.drawImage(full, 0, topPx, full.width, cropped.height, 0, 0, full.width, cropped.height);
  const trimmed = trimWhiteMargins(cropped);
  return { bytes: await canvasToJpeg(trimmed), width: trimmed.width, height: trimmed.height };
}

function nextPosition(source: MarkSchemeSource, questionNumber: number) {
  for (let q = questionNumber + 1; q <= 99; q++) {
    if (source.positions[q]) return source.positions[q];
  }
  return null;
}

async function extractQuestionCrops(pdf: PdfDocumentProxy, source: MarkSchemeSource, questionNumber: number): Promise<Crop[]> {
  const start = source.positions[questionNumber];
  if (!start) throw new Error(`Mark scheme mapping is not available for original Q${questionNumber}.`);
  const next = nextPosition(source, questionNumber);
  const [startPage, startTop] = start;
  const endPage = next ? next[0] : pdf.numPages - 1;
  const crops: Crop[] = [];

  for (let pageIndex = startPage; pageIndex <= endPage; pageIndex++) {
    const page: PdfPageProxy = await pdf.getPage(pageIndex + 1);
    let from = pageIndex === startPage ? startTop : 0.045;
    let to = 0.955;
    if (next && pageIndex === next[0]) to = next[1];
    if (to - from < 0.015) continue;
    crops.push(await renderCrop(page, from, to));
    if (next && pageIndex === next[0]) break;
  }
  if (!crops.length) throw new Error(`No mark scheme image could be built for original Q${questionNumber}.`);
  return crops;
}

function imageParagraph(crop: Crop): Paragraph {
  const maxWidth = 610;
  const maxHeight = 730;
  const ratio = Math.min(maxWidth / crop.width, maxHeight / crop.height, 1);
  return new Paragraph({
    children: [new ImageRun({ data: crop.bytes, transformation: { width: Math.round(crop.width * ratio), height: Math.round(crop.height * ratio) }, type: "jpg" })],
    spacing: { after: 120 },
  });
}

export async function exportMarkSchemeToWord(questions: Question[]) {
  if (!questions.length) throw new Error("Add at least one question before downloading a mark scheme.");

  const grouped = new Map<string, { source: MarkSchemeSource; pdf: PdfDocumentProxy }>();
  for (const q of questions) {
    const source = getMarkSchemeSource(q);
    if (!source || !source.positions[q.questionNumber]) {
      throw new Error(`A verified mark scheme is not available yet for ${q.session} ${q.year} Paper ${q.paper}, original Q${q.questionNumber}.`);
    }
    const key = `${q.year}|${q.session}|${q.paper}`;
    if (!grouped.has(key)) grouped.set(key, { source, pdf: await loadPdf(source.filenames) });
  }

  const children: Paragraph[] = [
    new Paragraph({ text: "MagicQuestions Mark Scheme", heading: HeadingLevel.TITLE, spacing: { after: 120 } }),
    new Paragraph({
      children: [new TextRun({ text: "Pearson Edexcel examination materials are © Pearson Education Limited. MagicQuestions is not affiliated with or endorsed by Pearson.", italics: true, size: 18 })],
      spacing: { after: 260 },
    }),
  ];

  for (let index = 0; index < questions.length; index++) {
    const q = questions[index];
    const key = `${q.year}|${q.session}|${q.paper}`;
    const loaded = grouped.get(key)!;
    children.push(new Paragraph({
      children: [new TextRun({ text: `Q${index + 1}.`, bold: true, size: 28 })],
      spacing: { before: index ? 180 : 0, after: 100 },
    }));
    const crops = await extractQuestionCrops(loaded.pdf, loaded.source, q.questionNumber);
    for (const crop of crops) children.push(imageParagraph(crop));
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
