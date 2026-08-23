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
import { visualElements, type VisualElement } from "./visualElements";

const A4_WIDTH_TWIPS = 11907;
const A4_HEIGHT_TWIPS = 16839;
const BODY_SIZE = 22;
const BODY_FONT = "Arial";
const GREY = "A8AAAD";
const RENDER_SCALE = 2;

type PdfTextItem = { str: string; transform: number[]; width: number; height: number };
type PositionedItem = PdfTextItem & { x: number; y: number; w: number; h: number };
type TextLine = { text: string; y: number; items: PositionedItem[] };
type RenderedVisual = VisualElement & { data: Uint8Array };

const pdfCache = new Map<string, Promise<any>>();

async function loadPaper(paperKey: string) {
  if (!pdfCache.has(paperKey)) {
    pdfCache.set(paperKey, (async () => {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
      const response = await fetch(`/api/paper?key=${encodeURIComponent(paperKey)}`);
      if (!response.ok) throw new Error(`Could not load ${paperKey}`);
      return pdfjs.getDocument({ data: new Uint8Array(await response.arrayBuffer()) }).promise;
    })());
  }
  return pdfCache.get(paperKey)!;
}

function clean(text: string) {
  return text.replace(/\s+/g, " ").replace(//g, "").trim();
}

function skip(text: string) {
  const t = clean(text);
  return !t || /^\*P\w+\*$/.test(t) || /^PMT/i.test(t) || /^Turn over$/i.test(t) || /^©/.test(t) || /^Pearson Education/i.test(t);
}

function groupLines(items: PositionedItem[]) {
  const groups: PositionedItem[][] = [];
  for (const item of [...items].sort((a,b) => a.y - b.y || a.x - b.x)) {
    let group = groups.find(g => Math.abs(g[0].y - item.y) <= 3.5);
    if (!group) { group = []; groups.push(group); }
    group.push(item);
  }
  return groups.map(group => {
    group.sort((a,b) => a.x - b.x);
    let text = "";
    let previousRight = -Infinity;
    for (const item of group) {
      const gap = item.x - previousRight;
      if (text && gap > 2.2) text += " ";
      text += item.str;
      previousRight = Math.max(previousRight, item.x + item.w);
    }
    return { text: clean(text), y: group.reduce((s,i)=>s+i.y,0)/group.length, items: group };
  }).filter(line => line.text && !skip(line.text));
}

function overlapsVisual(item: PositionedItem, visual: VisualElement) {
  const ix0 = item.x, ix1 = item.x + item.w;
  const iy0 = item.y - item.h, iy1 = item.y + 2;
  const xOverlap = Math.max(0, Math.min(ix1, visual.x1) - Math.max(ix0, visual.x0));
  const yOverlap = Math.max(0, Math.min(iy1, visual.y1) - Math.max(iy0, visual.y0));
  const intersection = xOverlap * yOverlap;
  const area = Math.max(1, (ix1 - ix0) * (iy1 - iy0));
  return intersection / area > 0.18 || (item.x >= visual.x0 && item.x <= visual.x1 && item.y >= visual.y0 && item.y <= visual.y1);
}

async function extractLines(pdf:any, pageNumber:number, crop:{startPage:number;endPage:number;startY:number;endY:number}, questionNumber:number, visuals:VisualElement[]) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const top = pageNumber === crop.startPage ? Math.max(28, crop.startY - 8) : 36;
  const bottom = pageNumber === crop.endPage ? Math.min(viewport.height - 28, crop.endY + 8) : viewport.height - 36;
  const content = await page.getTextContent();

  const positioned: PositionedItem[] = (content.items as PdfTextItem[])
    .filter(item => typeof item.str === "string" && item.str.trim())
    .map(item => {
      const tx = pdfjs.Util.transform(viewport.transform, item.transform);
      const h = Math.max(7, Math.abs(item.height || item.transform[3] || 10));
      return { ...item, x: tx[4], y: tx[5], w: Math.max(1, item.width), h };
    })
    .filter(item => item.y >= top - 5 && item.y <= bottom + 8 && item.x >= 20 && item.x <= viewport.width - 20)
    .filter(item => !visuals.some(v => overlapsVisual(item, v)));

  let lines = groupLines(positioned);

  // Remove only the original Pearson question number from the first page.
  if (pageNumber === crop.startPage) {
    const candidate = lines.findIndex(line => {
      const t = clean(line.text);
      const startsCorrectly = new RegExp(`^${questionNumber}(?:\\s|$)`).test(t);
      const leftMost = Math.min(...line.items.map(i => i.x));
      return startsCorrectly && leftMost < 90 && line.y < top + 70;
    });
    if (candidate >= 0) {
      const t = clean(lines[candidate].text.replace(new RegExp(`^${questionNumber}\\s*`), ""));
      if (t) lines[candidate] = { ...lines[candidate], text: t };
      else lines.splice(candidate, 1);
    }
  }

  // Do not allow an isolated original question number to leak through.
  lines = lines.filter(line => !(pageNumber === crop.startPage && clean(line.text) === String(questionNumber) && Math.min(...line.items.map(i=>i.x)) < 90));
  return lines;
}

function canvasPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve,reject) => canvas.toBlob(async blob => {
    if (!blob) return reject(new Error("Could not create element image"));
    resolve(new Uint8Array(await blob.arrayBuffer()));
  }, "image/png"));
}

async function renderVisuals(pdf:any, pageNumber:number, elements:VisualElement[]): Promise<RenderedVisual[]> {
  if (!elements.length) return [];
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: RENDER_SCALE });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "white";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;

  const out: RenderedVisual[] = [];
  for (const element of elements) {
    const sx = Math.max(0, Math.round(element.x0 * RENDER_SCALE));
    const sy = Math.max(0, Math.round(element.y0 * RENDER_SCALE));
    const sw = Math.max(1, Math.round((element.x1 - element.x0) * RENDER_SCALE));
    const sh = Math.max(1, Math.round((element.y1 - element.y0) * RENDER_SCALE));
    const piece = document.createElement("canvas");
    piece.width = sw; piece.height = sh;
    const pctx = piece.getContext("2d");
    if (!pctx) continue;
    pctx.fillStyle = "white";
    pctx.fillRect(0,0,sw,sh);
    pctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    out.push({ ...element, data: await canvasPng(piece) });
  }
  return out;
}

function isMark(text:string) { return /^\(\d+\)$/.test(text); }
function isTotal(text:string) { return /^\(Total for question/i.test(text) || /^\(Total for Question/i.test(text); }
function isAnswer(text:string) { return /\.{6,}/.test(text); }
function isContinuation(text:string) { return /^(Show your working|Show clear|Give your answer|You must show|Write down)/i.test(text); }

function normaliseMathText(text:string) {
  return text.replace(/x2\b/g,"x²").replace(/x3\b/g,"x³").replace(/y2\b/g,"y²").replace(/y3\b/g,"y³").replace(/a2\b/g,"a²").replace(/a3\b/g,"a³").replace(/b2\b/g,"b²").replace(/b3\b/g,"b³").replace(/n2\b/g,"n²").replace(/n3\b/g,"n³");
}

function runs(text:string) {
  const t = normaliseMathText(text);
  const parts = t.split(/([²³])/g).filter(Boolean);
  return parts.map(part => new TextRun({ text: part, font: BODY_FONT, size: BODY_SIZE, superScript: part === "²" || part === "³" }));
}

function paragraphFor(line:TextLine) {
  const text = normaliseMathText(clean(line.text));
  if (isMark(text)) return new Paragraph({ alignment:AlignmentType.RIGHT, spacing:{before:0,after:0,line:240}, children:[new TextRun({text,bold:true,color:GREY,font:BODY_FONT,size:BODY_SIZE})] });
  if (isTotal(text)) return new Paragraph({ alignment:AlignmentType.RIGHT, spacing:{before:0,after:0,line:240}, children:[new TextRun({text,bold:true,font:BODY_FONT,size:BODY_SIZE})] });
  if (isAnswer(text)) {
    const match = text.match(/^([A-Za-z])\s*(=\s*\.{5,}.*)$/);
    return new Paragraph({ alignment:AlignmentType.RIGHT, spacing:{before:0,after:0,line:240}, children: match ? [new TextRun({text:match[1],italics:true,font:BODY_FONT,size:BODY_SIZE}),new TextRun({text:` ${match[2]}`,font:BODY_FONT,size:BODY_SIZE})] : runs(text) });
  }
  return new Paragraph({ indent:isContinuation(text)?{left:320}:undefined, spacing:{before:120,after:120,line:240}, children:runs(text) });
}

function visualParagraph(visual:RenderedVisual) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60, line: 240 },
    children: [new ImageRun({ data: visual.data, type:"png", transformation:{ width:visual.displayWidth, height:visual.displayHeight } })],
  });
}

export async function exportPaperToWord(questions:Question[]) {
  if (!questions.length) return;
  const children: Paragraph[] = [];

  for (let index=0; index<questions.length; index++) {
    const question = questions[index];
    const crop = questionCrops[question.id];
    children.push(new Paragraph({ spacing:{after:0,line:240}, children:[new TextRun({text:"\n",font:BODY_FONT,size:BODY_SIZE})] }));
    children.push(new Paragraph({ keepNext:true, spacing:{after:0,line:240}, children:[new TextRun({text:`Q${index+1}.`,bold:true,font:BODY_FONT,size:BODY_SIZE})] }));
    if (!crop) continue;

    try {
      const pdf = await loadPaper(crop.paperKey);
      const allVisuals = visualElements[question.id] ?? [];
      const events: Array<{y:number; type:"text"|"visual"; line?:TextLine; visual?:RenderedVisual}> = [];

      for (let pageNumber=crop.startPage; pageNumber<=crop.endPage; pageNumber++) {
        const pageVisualDefs = allVisuals.filter(v => v.page === pageNumber);
        const [lines, rendered] = await Promise.all([
          extractLines(pdf,pageNumber,crop,question.questionNumber,pageVisualDefs),
          renderVisuals(pdf,pageNumber,pageVisualDefs),
        ]);
        const offset = (pageNumber-crop.startPage)*1000;
        lines.forEach(line => events.push({y:offset+line.y,type:"text",line}));
        rendered.forEach(visual => events.push({y:offset+visual.y0,type:"visual",visual}));
      }

      events.sort((a,b)=>a.y-b.y);
      for (const event of events) {
        if (event.type === "text" && event.line) children.push(paragraphFor(event.line));
        if (event.type === "visual" && event.visual) children.push(visualParagraph(event.visual));
      }
      children.push(new Paragraph({ spacing:{after:0,line:240}, children:[new TextRun({text:"\n",font:BODY_FONT,size:BODY_SIZE})] }));
    } catch (error) {
      console.error(error);
      children.push(new Paragraph({ spacing:{before:120,after:120,line:240}, children:[new TextRun({text:`Could not load source question ${question.id}.`,font:BODY_FONT,size:BODY_SIZE,color:"AA0000"})] }));
    }
  }

  const doc = new Document({
    styles:{default:{document:{run:{font:BODY_FONT,size:BODY_SIZE},paragraph:{spacing:{line:240}}}}},
    sections:[{
      properties:{page:{size:{width:A4_WIDTH_TWIPS,height:A4_HEIGHT_TWIPS},margin:{top:900,bottom:900,left:800,right:800,header:720,footer:720},pageNumbers:{start:1}}},
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Y10H",font:BODY_FONT,size:BODY_SIZE})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({children:[PageNumber.CURRENT],font:BODY_FONT,size:BODY_SIZE})]})]})},
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
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
