"use client";

import {
  AlignmentType,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
} from "docx";
import type { Question } from "./questions";
import { questionCrops } from "./questionCrops";

const A4_WIDTH_TWIPS = 11907;
const A4_HEIGHT_TWIPS = 16839;
const BODY_SIZE = 22; // 11 pt
const BODY_FONT = "Arial";
const PDF_SCALE = 2;
const GREY = "A8AAAD";

type PdfTextItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
};

type PositionedItem = PdfTextItem & {
  x: number;
  y: number;
  w: number;
  h: number;
};

type TextLine = {
  text: string;
  y: number;
  items: PositionedItem[];
};

type VisualBand = {
  data: Uint8Array;
  width: number;
  height: number;
  y: number;
};

type PageContent = {
  lines: TextLine[];
  visuals: VisualBand[];
};

const pdfCache = new Map<string, Promise<any>>();

async function loadPaper(paperKey: string) {
  if (!pdfCache.has(paperKey)) {
    pdfCache.set(
      paperKey,
      (async () => {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc =
          "https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
        const response = await fetch(`/api/paper?key=${encodeURIComponent(paperKey)}`);
        if (!response.ok) throw new Error(`Could not load ${paperKey}`);
        return pdfjs.getDocument({ data: new Uint8Array(await response.arrayBuffer()) }).promise;
      })(),
    );
  }
  return pdfCache.get(paperKey)!;
}

function cleanLine(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(//g, "")
    .trim();
}

function shouldSkipLine(text: string) {
  const t = cleanLine(text);
  if (!t) return true;
  if (/^\*P\w+\*$/.test(t)) return true;
  if (/^PMT/i.test(t)) return true;
  if (/^Turn over$/i.test(t)) return true;
  if (/^\d{1,2}$/.test(t)) return true; // page numbers / isolated diagram labels stay graphical
  return false;
}

function isMarkLine(text: string) {
  return /^\(\d+\)$/.test(text.trim());
}

function isTotalLine(text: string) {
  return /^\(Total for Question/i.test(text.trim()) || /^\(Total for question/i.test(text.trim());
}

function isAnswerLine(text: string) {
  return /\.{8,}/.test(text);
}

function looksLikeProse(text: string) {
  const words = text.match(/[A-Za-z]{2,}/g) ?? [];
  return words.length >= 3 || text.length >= 35;
}

function looksLikeSubpart(text: string) {
  return /^\((?:[a-z]|i{1,3}|iv|v)\)\s+/i.test(text);
}

function looksLikeSimpleAnswer(text: string) {
  return /^[A-Za-z]?\s*=\s*\.{5,}/.test(text) || /^[£$€]?\.{5,}.*$/.test(text);
}

function shouldTypeLine(text: string) {
  const t = cleanLine(text);
  if (shouldSkipLine(t)) return false;
  if (isMarkLine(t) || isTotalLine(t) || isAnswerLine(t) || looksLikeSimpleAnswer(t)) return true;
  if (looksLikeSubpart(t)) return true;
  if (looksLikeProse(t)) return true;

  // Short isolated maths, labels, coordinates and diagram labels remain as graphics.
  // This is deliberate: complex fractions/surds/equations must not be rebuilt in Arial.
  const mathChars = (t.match(/[0-9=+\-×÷√^<>≤≥π]/g) ?? []).length;
  if (mathChars >= 2 && t.length < 32) return false;
  if (/^[A-Z](?:\s+[A-Z])+$/.test(t)) return false;

  return t.length > 18;
}

function groupLines(items: PositionedItem[]) {
  const groups: PositionedItem[][] = [];
  for (const item of [...items].sort((a, b) => a.y - b.y || a.x - b.x)) {
    let group = groups.find((g) => Math.abs(g[0].y - item.y) <= 3.5);
    if (!group) {
      group = [];
      groups.push(group);
    }
    group.push(item);
  }

  return groups
    .map((group) => {
      group.sort((a, b) => a.x - b.x);
      let text = "";
      let previousRight = -Infinity;
      for (const item of group) {
        const gap = item.x - previousRight;
        if (text && gap > 2.2) text += " ";
        text += item.str;
        previousRight = Math.max(previousRight, item.x + item.w);
      }
      return { text: cleanLine(text), y: group.reduce((s, i) => s + i.y, 0) / group.length, items: group };
    })
    .filter((line) => line.text);
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error("Could not create image"));
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, "image/png");
  });
}

function findVisualBands(canvas: HTMLCanvasElement, cropTopPx: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return [] as { top: number; bottom: number; left: number; right: number }[];
  const { width, height } = canvas;
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const rowInk = new Array(height).fill(0);

  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      if (pixels[i] < 235 || pixels[i + 1] < 235 || pixels[i + 2] < 235) count++;
    }
    rowInk[y] = count;
  }

  const raw: { top: number; bottom: number }[] = [];
  let start = -1;
  for (let y = 0; y < height; y++) {
    const active = rowInk[y] >= 3;
    if (active && start < 0) start = y;
    if ((!active || y === height - 1) && start >= 0) {
      raw.push({ top: start, bottom: active ? y : y - 1 });
      start = -1;
    }
  }

  // Merge nearby rows into logical visual blocks.
  const merged: { top: number; bottom: number }[] = [];
  for (const band of raw) {
    const last = merged[merged.length - 1];
    if (last && band.top - last.bottom <= 20) last.bottom = band.bottom;
    else merged.push({ ...band });
  }

  const output: { top: number; bottom: number; left: number; right: number }[] = [];
  for (const band of merged) {
    if (band.bottom - band.top < 5) continue;
    let left = width;
    let right = -1;
    for (let y = band.top; y <= band.bottom; y++) {
      for (let x = 0; x < width; x += 2) {
        const i = (y * width + x) * 4;
        if (pixels[i] < 235 || pixels[i + 1] < 235 || pixels[i + 2] < 235) {
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
      }
    }
    if (right < left) continue;
    const w = right - left;
    const h = band.bottom - band.top;
    // Ignore tiny specks left by anti-aliasing after text masking.
    if (w < 28 && h < 18) continue;
    output.push({ top: Math.max(0, band.top - 5), bottom: Math.min(height - 1, band.bottom + 5), left: Math.max(0, left - 8), right: Math.min(width - 1, right + 8) });
  }
  return output;
}

async function extractPageContent(pdf: any, pageNumber: number, crop: { startPage: number; endPage: number; startY: number; endY: number }): Promise<PageContent> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const page = await pdf.getPage(pageNumber);
  const viewport1 = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: PDF_SCALE });
  const topPt = pageNumber === crop.startPage ? Math.max(28, crop.startY - 8) : 36;
  const bottomPt = pageNumber === crop.endPage ? Math.min(viewport1.height - 28, crop.endY + 8) : viewport1.height - 36;
  const textContent = await page.getTextContent();

  const positioned: PositionedItem[] = (textContent.items as PdfTextItem[])
    .filter((item) => typeof item.str === "string" && item.str.trim())
    .map((item) => {
      const tx = pdfjs.Util.transform(viewport1.transform, item.transform);
      const h = Math.max(7, Math.abs(item.height || item.transform[3] || 10));
      return { ...item, x: tx[4], y: tx[5], w: Math.max(1, item.width), h };
    })
    .filter((item) => item.y >= topPt - 5 && item.y <= bottomPt + 8 && item.x >= 20 && item.x <= viewport1.width - 20);

  let lines = groupLines(positioned);

  // Remove the original Pearson question number so our own literal Qn. is used.
  const firstVisible = lines.findIndex((line) => !shouldSkipLine(line.text));
  if (firstVisible >= 0 && /^\d{1,2}(?:\s|$)/.test(lines[firstVisible].text)) {
    lines[firstVisible] = {
      ...lines[firstVisible],
      text: cleanLine(lines[firstVisible].text.replace(/^\d{1,2}\s*/, "")),
    };
  }

  const typedLines = lines.filter((line) => shouldTypeLine(line.text));
  const typedItems = new Set(typedLines.flatMap((line) => line.items));

  // Render the original page, then remove only the text that we are recreating in Word.
  // Anything deliberately not typed (fractions, diagrams, graph grids, short maths labels)
  // remains in the graphics layer.
  const full = document.createElement("canvas");
  full.width = Math.ceil(viewport.width);
  full.height = Math.ceil(viewport.height);
  const fullCtx = full.getContext("2d");
  if (!fullCtx) throw new Error("Canvas unavailable");
  await page.render({ canvasContext: fullCtx, viewport }).promise;

  const leftPt = 28;
  const rightPt = viewport1.width - 28;
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = Math.round((rightPt - leftPt) * PDF_SCALE);
  cropCanvas.height = Math.round((bottomPt - topPt) * PDF_SCALE);
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) throw new Error("Canvas unavailable");
  cropCtx.fillStyle = "white";
  cropCtx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
  cropCtx.drawImage(
    full,
    Math.round(leftPt * PDF_SCALE),
    Math.round(topPt * PDF_SCALE),
    cropCanvas.width,
    cropCanvas.height,
    0,
    0,
    cropCanvas.width,
    cropCanvas.height,
  );

  cropCtx.fillStyle = "white";
  for (const item of positioned) {
    if (!typedItems.has(item)) continue;
    const x = (item.x - leftPt) * PDF_SCALE;
    const y = (item.y - topPt - item.h) * PDF_SCALE;
    const w = (item.w + 3) * PDF_SCALE;
    const h = (item.h + 5) * PDF_SCALE;
    cropCtx.fillRect(Math.max(0, x - 3), Math.max(0, y - 3), w + 6, h + 7);
  }

  const bands = findVisualBands(cropCanvas, topPt * PDF_SCALE);
  const visuals: VisualBand[] = [];
  for (const band of bands) {
    const w = band.right - band.left + 1;
    const h = band.bottom - band.top + 1;
    const piece = document.createElement("canvas");
    piece.width = w;
    piece.height = h;
    const pieceCtx = piece.getContext("2d");
    if (!pieceCtx) continue;
    pieceCtx.fillStyle = "white";
    pieceCtx.fillRect(0, 0, w, h);
    pieceCtx.drawImage(cropCanvas, band.left, band.top, w, h, 0, 0, w, h);
    visuals.push({ data: await canvasToPng(piece), width: w, height: h, y: topPt + band.top / PDF_SCALE });
  }

  return { lines: typedLines, visuals };
}

function visualRun(visual: VisualBand) {
  const maxWidth = 620;
  const maxHeight = 400;
  const scale = Math.min(1, maxWidth / visual.width, maxHeight / visual.height);
  return new ImageRun({
    data: visual.data,
    transformation: {
      width: Math.round(visual.width * scale),
      height: Math.round(visual.height * scale),
    },
    type: "png",
  });
}

function paragraphForLine(line: TextLine) {
  const t = cleanLine(line.text);

  if (isMarkLine(t)) {
    return new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 0, line: 240 },
      children: [new TextRun({ text: t, bold: true, color: GREY, font: BODY_FONT, size: BODY_SIZE })],
    });
  }

  if (isTotalLine(t)) {
    return new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 0, line: 240 },
      children: [new TextRun({ text: t, bold: true, font: BODY_FONT, size: BODY_SIZE })],
    });
  }

  if (isAnswerLine(t) || looksLikeSimpleAnswer(t)) {
    const match = t.match(/^([A-Za-z])\s*(=\s*\.{5,}.*)$/);
    return new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 0, line: 240 },
      children: match
        ? [
            new TextRun({ text: match[1], italics: true, font: BODY_FONT, size: BODY_SIZE }),
            new TextRun({ text: ` ${match[2]}`, font: BODY_FONT, size: BODY_SIZE }),
          ]
        : [new TextRun({ text: t, font: BODY_FONT, size: BODY_SIZE })],
    });
  }

  const continuation = /^(Show your working|Give your answer|You must show|Write down)/i.test(t);
  return new Paragraph({
    spacing: { before: 120, after: 120, line: 240 },
    indent: continuation ? { left: 320 } : undefined,
    children: [new TextRun({ text: t, font: BODY_FONT, size: BODY_SIZE })],
  });
}

function spacer(lines = 1) {
  return new Paragraph({
    spacing: { after: 0, line: 240 },
    children: [new TextRun({ text: "", break: lines, font: BODY_FONT, size: BODY_SIZE })],
  });
}

export async function exportPaperToWord(questions: Question[]) {
  if (!questions.length) return;
  const children: Paragraph[] = [];

  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    const source = questionCrops[question.id];
    if (!source) continue;

    children.push(spacer(1));
    children.push(
      new Paragraph({
        keepNext: true,
        spacing: { after: 0, line: 240 },
        children: [
          new TextRun({ text: `Q${index + 1}.`, bold: true, font: BODY_FONT, size: BODY_SIZE, break: 1 }),
        ],
      }),
    );

    try {
      const pdf = await loadPaper(source.paperKey);
      for (let pageNumber = source.startPage; pageNumber <= source.endPage; pageNumber++) {
        const content = await extractPageContent(pdf, pageNumber, source);
        const elements: Array<{ y: number; kind: "text"; line: TextLine } | { y: number; kind: "visual"; visual: VisualBand }> = [
          ...content.lines.map((line) => ({ y: line.y, kind: "text" as const, line })),
          ...content.visuals.map((visual) => ({ y: visual.y, kind: "visual" as const, visual })),
        ];
        elements.sort((a, b) => a.y - b.y || (a.kind === "text" ? -1 : 1));

        for (const element of elements) {
          if (element.kind === "text") {
            children.push(paragraphForLine(element.line));
          } else {
            children.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 100, line: 240 },
                children: [visualRun(element.visual)],
              }),
            );
          }
        }
      }
    } catch (error) {
      console.error(error);
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Could not reconstruct ${question.id}. Please try again.`,
              color: "AA0000",
              font: BODY_FONT,
              size: BODY_SIZE,
            }),
          ],
        }),
      );
    }

    children.push(spacer(1));
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: BODY_FONT, size: BODY_SIZE },
          paragraph: { spacing: { line: 240 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: A4_WIDTH_TWIPS, height: A4_HEIGHT_TWIPS },
            margin: {
              top: 900,
              bottom: 900,
              left: 800,
              right: 800,
              header: 720,
              footer: 720,
            },
            pageNumbers: { start: 1 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "Y10H", font: BODY_FONT, size: BODY_SIZE })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ children: [PageNumber.CURRENT], font: BODY_FONT, size: BODY_SIZE }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
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
