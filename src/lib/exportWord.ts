"use client";

import { AlignmentType, Document, Footer, Header, ImageRun, Packer, PageNumber, Paragraph, TextRun } from "docx";
import type { Question } from "./questions";
import { questionCrops } from "./questionCrops";

const A4_WIDTH_TWIPS = 11907;
const A4_HEIGHT_TWIPS = 16839;
const BODY_SIZE = 22;
const BODY_FONT = "Arial";
const PDF_SCALE = 1.7;

type RenderedCrop = { data: Uint8Array; width: number; height: number };
const pdfCache = new Map<string, Promise<any>>();

async function loadPaper(paperKey: string) {
  if (!pdfCache.has(paperKey)) {
    pdfCache.set(paperKey, (async () => {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;
      const response = await fetch(`/api/paper?key=${encodeURIComponent(paperKey)}`);
      if (!response.ok) throw new Error(`Could not load ${paperKey}`);
      const data = new Uint8Array(await response.arrayBuffer());
      return pdfjs.getDocument({ data }).promise;
    })());
  }
  return pdfCache.get(paperKey)!;
}

function canvasPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => canvas.toBlob(async blob => {
    if (!blob) return reject(new Error("Could not create question image"));
    resolve(new Uint8Array(await blob.arrayBuffer()));
  }, "image/png"));
}

async function renderQuestion(question: Question): Promise<RenderedCrop[]> {
  const crop = questionCrops[question.id];
  if (!crop) throw new Error(`No source crop is registered for ${question.id}`);
  const pdf = await loadPaper(crop.paperKey);
  const images: RenderedCrop[] = [];

  for (let pageNumber = crop.startPage; pageNumber <= crop.endPage; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: PDF_SCALE });
    const full = document.createElement("canvas");
    full.width = Math.ceil(viewport.width);
    full.height = Math.ceil(viewport.height);
    const fullContext = full.getContext("2d");
    if (!fullContext) throw new Error("Canvas is unavailable");
    await page.render({ canvasContext: fullContext, viewport }).promise;

    const pdfHeight = viewport.height / PDF_SCALE;
    const topPt = pageNumber === crop.startPage ? Math.max(28, crop.startY - 8) : 36;
    const bottomPt = pageNumber === crop.endPage ? Math.min(pdfHeight - 28, crop.endY + 8) : pdfHeight - 36;
    const leftPt = 28;
    const rightPt = viewport.width / PDF_SCALE - 28;
    const sx = Math.round(leftPt * PDF_SCALE);
    const sy = Math.round(topPt * PDF_SCALE);
    const sw = Math.round((rightPt - leftPt) * PDF_SCALE);
    const sh = Math.round((bottomPt - topPt) * PDF_SCALE);

    const clipped = document.createElement("canvas");
    clipped.width = sw;
    clipped.height = sh;
    const clippedContext = clipped.getContext("2d");
    if (!clippedContext) throw new Error("Canvas is unavailable");
    clippedContext.fillStyle = "white";
    clippedContext.fillRect(0, 0, sw, sh);
    clippedContext.drawImage(full, sx, sy, sw, sh, 0, 0, sw, sh);
    images.push({ data: await canvasPng(clipped), width: sw, height: sh });
  }
  return images;
}

function imageRun(image: RenderedCrop) {
  const maxWidth = 650;
  const maxHeight = 850;
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  return new ImageRun({
    data: image.data,
    transformation: { width: Math.round(image.width * scale), height: Math.round(image.height * scale) },
    type: "png",
  });
}

export async function exportPaperToWord(questions: Question[]) {
  if (!questions.length) return;
  const children: Paragraph[] = [];

  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    children.push(new Paragraph({
      keepNext: true,
      spacing: { before: index ? 180 : 0, after: 80 },
      children: [new TextRun({ text: `Q${index + 1}.`, bold: true, font: BODY_FONT, size: BODY_SIZE })],
    }));

    try {
      const crops = await renderQuestion(question);
      for (const crop of crops) {
        children.push(new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 160 },
          children: [imageRun(crop)],
        }));
      }
    } catch (error) {
      console.error(error);
      children.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: `Could not load the original source for ${question.id}. Please try the download again.`, font: BODY_FONT, size: BODY_SIZE, color: "AA0000" })],
      }));
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: BODY_FONT, size: BODY_SIZE }, paragraph: { spacing: { line: 240 } } } } },
    sections: [{
      properties: {
        page: {
          size: { width: A4_WIDTH_TWIPS, height: A4_HEIGHT_TWIPS },
          margin: { top: 900, bottom: 900, left: 800, right: 800, header: 720, footer: 720 },
          pageNumbers: { start: 1 },
        },
      },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Y10H", font: BODY_FONT, size: BODY_SIZE })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], font: BODY_FONT, size: BODY_SIZE })] })] }) },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "MagicQuestions-ExamWizard-Paper.docx";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
