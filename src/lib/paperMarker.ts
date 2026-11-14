import type { Question } from './questions';
import { supabase } from './supabase';
import { getFormattedSource, getFormattedSourceBucket } from './sourceDocs';
import { getMarkSchemeSource, MARKSCHEME_BUCKET } from './markSchemeSources';
import { getPhysicsMarkSchemeSource, PHYSICS_MARKSCHEME_BUCKET } from './physicsMarkSchemeSources';
import { getChemistryMarkSchemeSource, CHEMISTRY_MARKSCHEME_BUCKET } from './chemistryMarkSchemeSources';
import { getBiologyMarkSchemeSource, BIOLOGY_MARKSCHEME_BUCKET } from './biologyMarkSchemeSources';
export type MarkerSubject = 'Chemistry'|'Physics'|'Biology'|'Mathematics';
export const MARKER_BUCKET='marker-documents';
export type MarkerQuestion = Pick<Question,'id'|'year'|'session'|'paper'|'questionNumber'|'marks'|'summary'> & Partial<Pick<Question,'topics'|'difficulty'>> & {selectedParts?: string[]; specTags?: string[]; sourceFile?: string};
export function paperSnapshot(subject: MarkerSubject, questions: MarkerQuestion[]) {
 return questions.map((q,i)=>{
  const sourceQuestion: Question={...q,topics:q.topics||q.specTags||[],difficulty:q.difficulty||'Medium'};
  const scheme=subject==='Physics'?getPhysicsMarkSchemeSource(sourceQuestion):subject==='Chemistry'?getChemistryMarkSchemeSource(sourceQuestion as Parameters<typeof getChemistryMarkSchemeSource>[0]):subject==='Biology'?getBiologyMarkSchemeSource(sourceQuestion as Parameters<typeof getBiologyMarkSchemeSource>[0]):getMarkSchemeSource(sourceQuestion);
  return {label:`Q${i+1}`,question:q,source:{year:q.year,session:q.session,paper:q.paper,questionNumber:q.questionNumber,selectedParts:q.selectedParts||null,questionFile:q.sourceFile||getFormattedSource(sourceQuestion),questionBucket:getFormattedSourceBucket(sourceQuestion),scheme,schemeBucket:subject==='Physics'?PHYSICS_MARKSCHEME_BUCKET:subject==='Chemistry'?CHEMISTRY_MARKSCHEME_BUCKET:subject==='Biology'?BIOLOGY_MARKSCHEME_BUCKET:MARKSCHEME_BUCKET},topics:q.specTags||q.topics||[]};
 });
}
export async function rememberMarkerPaper(subject: MarkerSubject, questions: MarkerQuestion[]) {
 const {data}=await supabase.auth.getUser(); if(!data.user||!questions.length)return;
 const {error}=await supabase.from('marker_papers').insert({user_id:data.user.id,subject,title:`${subject} paper · ${questions.length} questions`,questions:paperSnapshot(subject,questions)});
 if(error) throw new Error('The paper downloaded, but its AI Marker copy could not be saved. Open AI Paper Marker to save the current paper.');
}
export async function inspectMarkerFile(file: File):Promise<number> {
 if(!file.size||file.size>25*1024*1024)throw new Error('Each file must be between 1 byte and 25 MB.');
 const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
 if(file.type==='application/pdf' && String.fromCharCode(...Array.from(bytes.slice(0,5)))==='%PDF-'){
  const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc="https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
  const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});
  try{const doc=await task.promise;if(doc.numPages>60)throw new Error('A document can contain at most 60 pages.');return doc.numPages;}finally{await task.destroy();}
 }
 const png=file.type==='image/png'&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
 const jpeg=file.type==='image/jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(!png&&!jpeg)throw new Error('Upload a valid PDF, PNG or JPEG.');
 const image=await createImageBitmap(file);try{if(image.width*image.height>40_000_000)throw new Error('Images must be at most 40 megapixels.');}finally{image.close();}return 1;
}
