// Shared JSON contracts. No provider keys or server dependencies belong in this file.
export type Criterion = { id: string; text: string; marks: number; notes: string };
export type MarkingQuestion = { label: string; maximum: number; questionText: string; source: string; criteria: Criterion[]; needsReview: boolean; reason: string };
export type Criteria = { questions: MarkingQuestion[] };
export type ReadAnswer = { label: string; text: string; confidence: 'high'|'medium'|'low'; uncertainty: string; location: string; visualDescription: string; needsVisualReview: boolean };
export type Transcription = { answers: ReadAnswer[] };
export type Decision = { criterionId: string; awarded: number; reason: string; evidence: string; evidenceVerified?: boolean };
export type MarkedQuestion = { label: string; decisions: Decision[]; feedback: string; improvedAnswer: string; needsReview: boolean; reviewReason: string; awarded: number|null; maximum: number };
export type MarkingReport = { questions: MarkedQuestion[]; awarded: number; maximum: number; reviewCount: number; percentage: number|null };
export type MarkerState = { criteria?: Criteria; transcription?: Transcription; report?: MarkingReport; corrections?: {label:string;text:string}[] };

const obj = (properties: Record<string, unknown>) => ({ type: 'object', properties, required: Object.keys(properties) });
const str = {type:'string'}, num = {type:'integer'}, bool = {type:'boolean'};
const arr = (items:unknown) => ({type:'array',items});
export const criteriaSchema = obj({questions:arr(obj({label:str,maximum:num,questionText:str,source:str,criteria:arr(obj({id:str,text:str,marks:num,notes:str})),needsReview:bool,reason:str}))});
export const transcriptionSchema = obj({answers:arr(obj({label:str,text:str,confidence:{type:'string',enum:['high','medium','low']},uncertainty:str,location:str,visualDescription:str,needsVisualReview:bool}))});
export const markingSchema = obj({questions:arr(obj({label:str,decisions:arr(obj({criterionId:str,awarded:num,reason:str,evidence:str})),feedback:str,improvedAnswer:str,needsReview:bool,reviewReason:str}))});

function record(v:unknown):Record<string,unknown>{if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Invalid AI response. No marks were saved.');return v as Record<string,unknown>;}
function list(v:unknown,max=100):unknown[]{if(!Array.isArray(v)||v.length>max)throw new Error('AI response exceeded the question limit. Split this marking submission.');return v;}
function text(v:unknown,max=20000):string{if(typeof v!=='string'||v.length>max)throw new Error('Invalid text in AI response.');return v;}
function integer(v:unknown,max=500):number{if(typeof v!=='number'||!Number.isInteger(v)||v<0||v>max)throw new Error('Invalid mark allocation. No marks were saved.');return v;}
function flag(v:unknown):boolean{if(typeof v!=='boolean')throw new Error('Invalid review flag.');return v;}
function unique(labels:string[]){if(labels.some(l=>!l.trim())||new Set(labels).size!==labels.length)throw new Error('Missing or duplicate question / criterion labels.');}
export function validateCriteria(raw:unknown,expected?:{label:string;marks:number}[]):Criteria{
 const questions=list(record(raw).questions).map(v=>{const q=record(v);return {label:text(q.label,80),maximum:integer(q.maximum),questionText:text(q.questionText),source:text(q.source,2000),criteria:list(q.criteria,150).map(v=>{const c=record(v);return {id:text(c.id,100),text:text(c.text),marks:integer(c.marks),notes:text(c.notes)};}),needsReview:flag(q.needsReview),reason:text(q.reason,2000)};});
 if(!questions.length)throw new Error('No official marking criteria could be read.');unique(questions.map(q=>q.label));
 questions.forEach(q=>{unique(q.criteria.map(c=>c.id));if(!q.source||(!q.needsReview&&(!q.maximum||!q.criteria.length||q.criteria.some(c=>!c.text.trim()||!c.marks))))throw new Error('Official marking criteria are incomplete.');});
 if(expected){if(expected.length!==questions.length)throw new Error('The scheme does not match every generated question.');for(const e of expected){const q=questions.find(q=>q.label===e.label);if(!q||q.maximum!==e.marks)throw new Error(`Mark-scheme maximum does not match ${e.label}. Review the selected parts.`);}}
 return {questions};
}
export function validateTranscription(raw:unknown,criteria:Criteria):Transcription{
 const answers=list(record(raw).answers).map(v=>{const a=record(v);if(!['high','medium','low'].includes(String(a.confidence)))throw new Error('Invalid handwriting confidence.');return {label:text(a.label,80),text:text(a.text),confidence:a.confidence as ReadAnswer['confidence'],uncertainty:text(a.uncertainty,2000),location:text(a.location,2000),visualDescription:text(a.visualDescription,4000),needsVisualReview:flag(a.needsVisualReview)};});
 unique(answers.map(a=>a.label));if(answers.length!==criteria.questions.length||criteria.questions.some(q=>!answers.some(a=>a.label===q.label)))throw new Error('Answer labels do not match the paper. Review the document order.');return {answers};
}
export function validateCorrections(raw:unknown,transcription:Transcription){
 const answers=list(raw).map(v=>{const a=record(v);return {label:text(a.label,80),text:text(a.text)};});unique(answers.map(a=>a.label));
 if(answers.length!==transcription.answers.length||transcription.answers.some(a=>!answers.some(b=>a.label===b.label)))throw new Error('Verify every answer before marking.');return answers;
}
export function validateReport(raw:unknown,criteria:Criteria,transcription:Transcription,corrections?:{label:string;text:string}[]):MarkingReport{
 const input=list(record(raw).questions);unique(input.map(v=>text(record(v).label,80)));
 if(input.length!==criteria.questions.length)throw new Error('The marking response missed a question. No result was saved.');
 const questions:MarkedQuestion[]=criteria.questions.map(q=>{
  const r=record(input.find(v=>record(v).label===q.label)),a=transcription.answers.find(a=>a.label===q.label)!;
  const decisions=list(r.decisions,150).map(v=>{const d=record(v),criterionId=text(d.criterionId,100),c=q.criteria.find(c=>c.id===criterionId);if(!c)throw new Error('AI cited a criterion absent from the official scheme.');const awarded=integer(d.awarded,c.marks),evidence=text(d.evidence,4000);return {criterionId,awarded,reason:text(d.reason,4000),evidence};});
  unique(decisions.map(d=>d.criterionId));if(decisions.length!==q.criteria.length)throw new Error('A marking criterion was skipped.');
  const sum=decisions.reduce((n,d)=>n+d.awarded,0);if(sum>q.maximum)throw new Error('AI exceeded the question maximum. No result was saved.');
  const answer=corrections?.find(c=>c.label===q.label)?.text??a.text;
  const normalise=(s:string)=>s.replace(/\s+/g,' ').trim();
  const checkedDecisions=decisions.map(d=>({...d,evidenceVerified:!!normalise(d.evidence)&&normalise(answer).includes(normalise(d.evidence))}));
  const unsupported=checkedDecisions.filter(d=>d.awarded&&!d.evidenceVerified).map(d=>d.criterionId);
  const corrected=normalise(answer)!==normalise(a.text);
  const needsReview=unsupported.length>0||q.needsReview||a.confidence==='low'||a.needsVisualReview||corrected||flag(r.needsReview);
  return {label:q.label,decisions:checkedDecisions,feedback:text(r.feedback),improvedAnswer:text(r.improvedAnswer),needsReview,reviewReason:[unsupported.length?`Evidence for ${unsupported.join(', ')} could not be matched to the verified answer. Proposed marks are withheld pending human review.`:'',q.reason,corrected?'The transcription was corrected; a human must verify the change against the original.':'',a.confidence==='low'?'Original answer was illegible.':'',a.needsVisualReview?'Graph, diagram or other visual answer needs human review.':'',text(r.reviewReason,4000)].filter(Boolean).join(' '),awarded:needsReview?null:sum,maximum:q.maximum};
 });
 const reviewCount=questions.filter(q=>q.needsReview).length,maximum=questions.reduce((n,q)=>n+q.maximum,0),awarded=questions.reduce((n,q)=>n+(q.awarded??0),0);
 return {questions,maximum,awarded,reviewCount,percentage:reviewCount||!maximum?null:Math.round(1000*awarded/maximum)/10};
}
