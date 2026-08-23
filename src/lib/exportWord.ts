"use client";

import { AlignmentType, Document, Footer, Header, ImageRun, Packer, PageNumber, Paragraph, TextRun } from "docx";
import type { Question } from "./questions";
import { questionCrops } from "./questionCrops";
import { visualElements, type VisualElement } from "./visualElements";

const A4_WIDTH_TWIPS = 11907;
const A4_HEIGHT_TWIPS = 16839;
const BODY_SIZE = 22;
const BODY_FONT = "Arial";
const GREY = "A8AAAD";
const LINE_TWIPS = 240;
const RENDER_SCALE = 3;

type PdfTextItem = { str:string; transform:number[]; width:number; height:number };
type PositionedItem = PdfTextItem & { x:number; y:number; w:number; h:number };
type TextLine = { text:string; y:number; items:PositionedItem[] };
type RenderedVisual = VisualElement & { data:Uint8Array };
type DocEvent = { y:number; type:"text"|"visual"; line?:TextLine; visual?:RenderedVisual };

const pdfCache = new Map<string, Promise<any>>();

async function loadPaper(paperKey:string) {
  if (!pdfCache.has(paperKey)) {
    pdfCache.set(paperKey, (async () => {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
      const response = await fetch(`/api/paper?key=${encodeURIComponent(paperKey)}`);
      if (!response.ok) throw new Error(`Could not load ${paperKey}`);
      return pdfjs.getDocument({data:new Uint8Array(await response.arrayBuffer())}).promise;
    })());
  }
  return pdfCache.get(paperKey)!;
}

function clean(text:string) { return text.replace(/\s+/g," ").replace(//g,"").trim(); }
function skip(text:string) {
  const t=clean(text);
  return !t || /^\*P\w+\*$/.test(t) || /^PMT/i.test(t) || /^Turn over$/i.test(t) || /^©/.test(t) || /^Pearson Education/i.test(t);
}

function groupLines(items:PositionedItem[]) {
  const groups:PositionedItem[][]=[];
  for (const item of [...items].sort((a,b)=>a.y-b.y||a.x-b.x)) {
    let g=groups.find(x=>Math.abs(x[0].y-item.y)<=3.2);
    if(!g){g=[];groups.push(g);} g.push(item);
  }
  return groups.map(g=>{
    g.sort((a,b)=>a.x-b.x); let text=""; let right=-Infinity;
    for(const item of g){ if(text && item.x-right>2.2) text+=" "; text+=item.str; right=Math.max(right,item.x+item.w); }
    return {text:clean(text),y:g.reduce((s,i)=>s+i.y,0)/g.length,items:g};
  }).filter(l=>l.text&&!skip(l.text));
}

async function positionedItems(pdf:any,pageNumber:number,crop:{startPage:number;endPage:number;startY:number;endY:number}) {
  const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
  const page=await pdf.getPage(pageNumber);
  const viewport=page.getViewport({scale:1});
  const top=pageNumber===crop.startPage?Math.max(28,crop.startY-8):36;
  const bottom=pageNumber===crop.endPage?Math.min(viewport.height-28,crop.endY+8):viewport.height-36;
  const content=await page.getTextContent();
  const items=(content.items as PdfTextItem[]).filter(i=>typeof i.str==="string"&&i.str.trim()).map(i=>{
    const tx=pdfjs.Util.transform(viewport.transform,i.transform); const h=Math.max(7,Math.abs(i.height||i.transform[3]||10));
    return {...i,x:tx[4],y:tx[5],w:Math.max(1,i.width),h};
  }).filter(i=>i.y>=top-5&&i.y<=bottom+8&&i.x>=18&&i.x<=viewport.width-18);
  return {items,viewport,top,bottom};
}

function overlap(item:PositionedItem,v:VisualElement) {
  const ix0=item.x,ix1=item.x+item.w,iy0=item.y-item.h,iy1=item.y+2;
  const xo=Math.max(0,Math.min(ix1,v.x1)-Math.max(ix0,v.x0));
  const yo=Math.max(0,Math.min(iy1,v.y1)-Math.max(iy0,v.y0));
  return xo*yo/Math.max(1,(ix1-ix0)*(iy1-iy0))>.15 || (item.x>=v.x0&&item.x<=v.x1&&item.y>=v.y0&&item.y<=v.y1);
}

function visualTrigger(text:string) {
  return /\b(diagram|table|graph|histogram|probability tree|tree diagram|venn|number line|grid)\b/i.test(text);
}
function proseAnchor(text:string) {
  const t=clean(text);
  if(!t||visualTrigger(t)||/Diagram NOT accurately drawn/i.test(t)||/^[-+]?\d+(?:\.\d+)?(?:\s+[-+]?\d+(?:\.\d+)?)*$/.test(t)) return false;
  return (t.match(/[A-Za-z]{2,}/g)||[]).length>=4;
}

function inferVisuals(lines:TextLine[],page:number,pageWidth:number,top:number,bottom:number,explicit:VisualElement[]) {
  const inferred:VisualElement[]=[];
  for(let i=0;i<lines.length;i++){
    const line=lines[i]; if(!visualTrigger(line.text)) continue;
    if(explicit.some(v=>v.page===page && line.y>=v.y0-35 && line.y<=v.y1+20)) continue;
    let end=Math.min(bottom,line.y+360);
    for(let j=i+1;j<lines.length;j++){
      if(lines[j].y-line.y<55) continue;
      if(proseAnchor(lines[j].text)){ end=lines[j].y-14; break; }
    }
    const start=line.y+10;
    if(end-start<35) continue;
    inferred.push({page,x0:32,y0:start,x1:pageWidth-32,y1:end,displayWidth:520,displayHeight:260,kind:/table/i.test(line.text)?"table":/graph|histogram|grid/i.test(line.text)?"graph":"diagram"});
  }
  return inferred.filter((v,idx,a)=>!a.some((o,j)=>j<idx&&Math.abs(o.y0-v.y0)<25));
}

async function extractLines(pdf:any,pageNumber:number,crop:any,questionNumber:number,visuals:VisualElement[]) {
  const {items,viewport,top,bottom}=await positionedItems(pdf,pageNumber,crop);
  const filtered=items.filter(i=>!visuals.some(v=>v.page===pageNumber&&overlap(i,v)));
  let lines=groupLines(filtered);
  if(pageNumber===crop.startPage){
    const candidate=lines.findIndex(l=>new RegExp(`^${questionNumber}(?:\\s|$)`).test(clean(l.text))&&Math.min(...l.items.map(i=>i.x))<100&&l.y<top+85);
    if(candidate>=0){const rest=clean(lines[candidate].text.replace(new RegExp(`^${questionNumber}\\s*`),"")); if(rest) lines[candidate]={...lines[candidate],text:rest}; else lines.splice(candidate,1);}
  }
  lines=lines.filter(l=>!(pageNumber===crop.startPage&&clean(l.text)===String(questionNumber)&&Math.min(...l.items.map(i=>i.x))<100));
  return {lines,viewport,top,bottom,rawLines:groupLines(items)};
}

function png(canvas:HTMLCanvasElement):Promise<Uint8Array>{return new Promise((resolve,reject)=>canvas.toBlob(async b=>b?resolve(new Uint8Array(await b.arrayBuffer())):reject(new Error("PNG failed")),"image/png"));}

function trimBox(ctx:CanvasRenderingContext2D,w:number,h:number){
  const data=ctx.getImageData(0,0,w,h).data; let minX=w,minY=h,maxX=-1,maxY=-1;
  for(let y=0;y<h;y+=2) for(let x=0;x<w;x+=2){const p=(y*w+x)*4; if(data[p]<225||data[p+1]<225||data[p+2]<225){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}
  if(maxX<0) return null; const pad=10; return {x:Math.max(0,minX-pad),y:Math.max(0,minY-pad),w:Math.min(w,maxX-minX+pad*2),h:Math.min(h,maxY-minY+pad*2)};
}

async function renderVisuals(pdf:any,pageNumber:number,elements:VisualElement[]):Promise<RenderedVisual[]> {
  if(!elements.length)return[]; const page=await pdf.getPage(pageNumber); const viewport=page.getViewport({scale:RENDER_SCALE});
  const full=document.createElement("canvas"); full.width=Math.ceil(viewport.width); full.height=Math.ceil(viewport.height); const ctx=full.getContext("2d"); if(!ctx)throw new Error("Canvas unavailable");
  ctx.fillStyle="white";ctx.fillRect(0,0,full.width,full.height); await page.render({canvasContext:ctx,viewport}).promise;
  const out:RenderedVisual[]=[];
  for(const e of elements){
    const sx=Math.max(0,Math.round(e.x0*RENDER_SCALE)),sy=Math.max(0,Math.round(e.y0*RENDER_SCALE));
    const sw=Math.max(1,Math.round((e.x1-e.x0)*RENDER_SCALE)),sh=Math.max(1,Math.round((e.y1-e.y0)*RENDER_SCALE));
    const rough=document.createElement("canvas");rough.width=sw;rough.height=sh;const r=rough.getContext("2d");if(!r)continue;r.fillStyle="white";r.fillRect(0,0,sw,sh);r.drawImage(full,sx,sy,sw,sh,0,0,sw,sh);
    const box=trimBox(r,sw,sh); if(!box||box.w<45||box.h<20)continue;
    const tight=document.createElement("canvas");tight.width=box.w;tight.height=box.h;const t=tight.getContext("2d");if(!t)continue;t.fillStyle="white";t.fillRect(0,0,box.w,box.h);t.drawImage(rough,box.x,box.y,box.w,box.h,0,0,box.w,box.h);
    const aspect=box.w/box.h; let dw=e.displayWidth||520; let dh=Math.round(dw/aspect); if(dh>390){dh=390;dw=Math.round(dh*aspect);} if(dw>540){dw=540;dh=Math.round(dw/aspect);}
    out.push({...e,displayWidth:dw,displayHeight:dh,data:await png(tight)});
  }
  return out;
}

function isMark(t:string){return /^\(\d+\)$/.test(clean(t));} function isTotal(t:string){return /^\(Total for (?:q|Q)uestion/i.test(clean(t));} function isAnswer(t:string){return /\.{6,}/.test(t);} function isSubpart(t:string){return /^\((?:[a-z]|i{1,3}|iv|v)\)\s*/i.test(clean(t));}
function isSequence(t:string){return /^(?:-?\d+(?:\.\d+)?\s+){2,}-?\d+(?:\.\d+)?$/.test(clean(t));}
function isDisplayMath(t:string){const s=clean(t);return !isAnswer(s)&&!isMark(s)&&!isTotal(s)&&s.length<70&&/=/.test(s)&&(s.match(/\b(?:where|find|write|show|work|given|and|the|is|are|has|with|for|from|to)\b/gi)||[]).length===0;}
function normalise(t:string){return t.replace(/x2\b/g,"x²").replace(/x3\b/g,"x³").replace(/y2\b/g,"y²").replace(/y3\b/g,"y³").replace(/a2\b/g,"a²").replace(/a3\b/g,"a³").replace(/n2\b/g,"n²").replace(/n3\b/g,"n³");}
function runs(t:string){return normalise(t).split(/([²³]|\b[xymnp]\b|\b[A-Z]{1,2}\b)/g).filter(Boolean).map(p=>new TextRun({text:p,font:BODY_FONT,size:BODY_SIZE,superScript:p==="²"||p==="³",italics:/^[xymnp]$/.test(p)||/^[A-Z]{1,2}$/.test(p)}));}
function para(line:TextLine){const t=normalise(clean(line.text));if(isMark(t))return new Paragraph({alignment:AlignmentType.RIGHT,spacing:{before:0,after:0,line:LINE_TWIPS},children:[new TextRun({text:t,bold:true,color:GREY,font:BODY_FONT,size:BODY_SIZE})]});if(isTotal(t))return new Paragraph({alignment:AlignmentType.RIGHT,spacing:{before:0,after:0,line:LINE_TWIPS},children:[new TextRun({text:t,bold:true,font:BODY_FONT,size:BODY_SIZE})]});if(isAnswer(t))return new Paragraph({alignment:AlignmentType.RIGHT,spacing:{before:0,after:0,line:LINE_TWIPS},children:runs(t)});if(isSequence(t)||isDisplayMath(t))return new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:120,after:120,line:LINE_TWIPS},children:runs(t)});return new Paragraph({spacing:{before:120,after:120,line:LINE_TWIPS},keepNext:isSubpart(t),children:runs(t)});}
function visualPara(v:RenderedVisual){return new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:60,after:60,line:LINE_TWIPS},children:[new ImageRun({data:v.data,type:"png",transformation:{width:v.displayWidth,height:v.displayHeight}})]});}
function spacer(n=1){return new Paragraph({spacing:{before:0,after:0,line:LINE_TWIPS},children:[new TextRun({text:"",break:n,font:BODY_FONT,size:BODY_SIZE})]});}
function gapBreaks(a:DocEvent,b:DocEvent|undefined){if(!b)return 0;const bottom=a.type==="visual"&&a.visual?a.visual.y1:a.y;const gap=b.y-bottom;if(gap<45)return 0;return Math.max(1,Math.min(11,Math.round((gap-22)/16)));}

export async function exportPaperToWord(questions:Question[]){
  if(!questions.length)return; const children:Paragraph[]=[];
  for(let qi=0;qi<questions.length;qi++){
    const q=questions[qi],crop=questionCrops[q.id]; children.push(spacer(1),new Paragraph({keepNext:true,spacing:{after:0,line:LINE_TWIPS},children:[new TextRun({text:`Q${qi+1}.`,bold:true,font:BODY_FONT,size:BODY_SIZE})]})); if(!crop)continue;
    try{
      const pdf=await loadPaper(crop.paperKey); const explicit=visualElements[q.id]??[]; const events:DocEvent[]=[];
      for(let p=crop.startPage;p<=crop.endPage;p++){
        const base=await positionedItems(pdf,p,crop); const rawLines=groupLines(base.items); const pageExplicit=explicit.filter(v=>v.page===p); const auto=inferVisuals(rawLines,p,base.viewport.width,base.top,base.bottom,pageExplicit); const defs=[...pageExplicit,...auto];
        const [{lines},rendered]=await Promise.all([extractLines(pdf,p,crop,q.questionNumber,defs),renderVisuals(pdf,p,defs)]); const off=(p-crop.startPage)*1000; lines.forEach(l=>events.push({y:off+l.y,type:"text",line:l})); rendered.forEach(v=>events.push({y:off+v.y0,type:"visual",visual:v}));
      }
      events.sort((a,b)=>a.y-b.y);
      for(let i=0;i<events.length;i++){const e=events[i];children.push(e.type==="text"&&e.line?para(e.line):visualPara(e.visual!));const n=gapBreaks(e,events[i+1]);if(n&&events[i+1]?.type==="text"&&events[i+1].line&&(isAnswer(events[i+1].line!.text)||isMark(events[i+1].line!.text)||isTotal(events[i+1].line!.text)||isSubpart(events[i+1].line!.text)))children.push(spacer(n));}
      children.push(spacer(1));
    }catch(err){console.error(err);children.push(new Paragraph({children:[new TextRun({text:`Could not load source question ${q.id}.`,color:"AA0000",font:BODY_FONT,size:BODY_SIZE})]}));}
  }
  const doc=new Document({styles:{default:{document:{run:{font:BODY_FONT,size:BODY_SIZE},paragraph:{spacing:{line:LINE_TWIPS}}}}},sections:[{properties:{page:{size:{width:A4_WIDTH_TWIPS,height:A4_HEIGHT_TWIPS},margin:{top:900,bottom:900,left:800,right:800,header:720,footer:720},pageNumbers:{start:1}}},headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Y10H",font:BODY_FONT,size:BODY_SIZE})]})]})},footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({children:[PageNumber.CURRENT],font:BODY_FONT,size:BODY_SIZE})]})]})},children}]});
  const blob=await Packer.toBlob(doc);const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="MagicQuestions-ExamWizard-Paper.docx";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
