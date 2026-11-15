"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MarkerIcon, MarkerJourney, MarkerResultOverview } from './MarkerUI';
import type { MarkerState } from '@/lib/markerAI';
export default function MarkerReview({sessionId,verified,onRefresh}:{sessionId:string;verified:boolean;onRefresh?:()=>void}){
 const [state,setState]=useState<MarkerState>({}),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(''),[error,setError]=useState(''),[adult,setAdult]=useState(false),[confirmed,setConfirmed]=useState(false),[corrections,setCorrections]=useState<{label:string;text:string}[]>([]);
 async function run(action:'history'|'criteria'|'transcribe'|'mark'){
  setBusy(action);setError('');try{
   const {data}=await supabase.auth.getSession();if(!data.session)throw new Error('Sign in again to use the marker.');
   const res=await fetch('/api/marker',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${data.session.access_token}`},body:JSON.stringify({action,sessionId,adultConfirmed:adult,corrections:action==='mark'?corrections:undefined})});
   const body=await res.json();if(!res.ok)throw new Error(body.error||'The marking step could not finish.');setState(body);setLoaded(true);
   if(body.transcription)setCorrections(body.corrections||body.transcription.answers.map((a:{label:string;text:string})=>({label:a.label,text:a.text})));
   if(action!=='mark')setConfirmed(false);onRefresh?.();
  }catch(e){setError(e instanceof Error?e.message:'Could not connect to the marker.');}finally{setBusy('');}
 }
 useEffect(()=>{void run('history');},[sessionId]);
 function download(){const blob=new Blob([JSON.stringify({paperSession:sessionId,...state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`MagicQuestions-marking-${sessionId.slice(0,8)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <div className="marker-card marker-review"><div className="marker-review-header"><span className="marker-review-symbol"><MarkerIcon/></span><div><span className="marker-kicker">YOUR MARKING WORKSPACE</span><h2>From answers to understanding.</h2><p>Gemini paper marking · Beta</p></div><span className="marker-chip">{state.report?'Report ready':state.transcription?'Ready to verify':state.criteria?'Scheme matched':'Ready to begin'}</span></div>
  <MarkerJourney active={state.report?3:state.transcription?2:state.criteria?1:0} steps={[{label:'Match criteria',detail:'Official scheme'},{label:'Read answers',detail:'Preserve your work'},{label:'Verify & mark',detail:'You check the reading'},{label:'Explore results',detail:'Feedback that helps'}]}/>
  <p className="marker-review-disclaimer">Adult parent / teacher review. Results are provisional and may need correction by a human examiner. No official grade or Tracker score is assigned.</p>
  {!verified?<p>Finish and verify the upload before using AI marking.</p>:<>
   {!loaded&&!busy&&<button disabled={!!busy} onClick={()=>void run('history')}>Load saved AI progress</button>}
   <div className="marker-consent"><label className="marker-confirm"><input type="checkbox" checked={adult} onChange={e=>setAdult(e.target.checked)}/> I am 18 or older, a parent or teacher, and authorised to send these documents to Google Gemini for processing.</label>
   <details className="marker-data-details"><summary>Data privacy & usage limits <MarkerIcon name="shield"/></summary><p className="qMeta">Google’s free API tier may use submitted content to improve its products. Remove student names, IDs and other personal details before uploading. AI testing is limited to 12 steps/hour and 36 steps/day per account; Gemini may impose a lower limit. Each step supports up to 12 MB of source files.</p></details></div>
   {error&&<p role="alert" className="marker-error">{error}</p>}
   {busy&&<div className="marker-processing" role="status"><span className="marker-spinner" aria-hidden="true"/><div><b>{busy==='history'?'Loading saved progress…':busy==='criteria'?'Reading the official mark scheme and matching questions…':busy==='transcribe'?'Reading the completed answers…':'Comparing verified answers with the official criteria…'}</b><p>Keep this page open. Your completed steps are saved.</p></div><div className="marker-scan-track" aria-hidden="true"/></div>}
   {loaded&&!state.criteria&&<button className="generate" disabled={!!busy||!adult} onClick={()=>void run('criteria')}>1. Read official mark scheme</button>}
   {state.criteria&&<><details className="marker-criteria-group" open={!state.transcription}><summary><span><span className="marker-kicker">STEP 01 · OFFICIAL SOURCES</span><b>Official criteria matched</b></span><span className="marker-chip"><MarkerIcon name="check"/> Matched</span></summary><p>{state.criteria.questions.length} questions · {state.criteria.questions.reduce((n,q)=>n+q.maximum,0)} available marks</p>
    {state.criteria.questions.map(q=><details key={q.label}><summary>{q.label} · {q.maximum} marks{q.needsReview?' · Review required':''}</summary><p style={{whiteSpace:'pre-wrap'}}>{q.questionText}</p><p className="qMeta">{q.source}</p>{q.reason&&<p className="marker-error">{q.reason}</p>}{q.criteria.map(c=><p key={c.id} style={{whiteSpace:'pre-wrap'}}><b>{c.id} · {c.marks} marks:</b> {c.text}<br/>{c.notes}</p>)}</details>)}</details>
    {!state.transcription&&<button className="generate" disabled={!!busy||!adult} onClick={()=>void run('transcribe')}>2. Read completed answers</button>}
   </>}
   {state.transcription&&<><div className="marker-block-heading"><span className="marker-kicker">STEP 02 · ANSWER REVIEW</span><h3>Verify the transcription</h3></div><p>Compare every answer with the originals above. Correct reading errors only; preserve the student’s mistakes. Added or materially changed answers require human review. A blank text box represents a blank answer only after you verify it.</p>
    {state.transcription.answers.map(a=><div className="marker-answer marker-transcript" key={a.label}><div className="marker-transcript-header"><b>{a.label}</b><span className={`marker-confidence is-${a.confidence}`}>{a.confidence} reading confidence</span></div><p className="qMeta">{a.location}</p>{(a.uncertainty||a.needsVisualReview)&&<p className="marker-error">{a.uncertainty} {a.needsVisualReview?'Visual answer requires human review.':''}</p>}{a.visualDescription&&<p>{a.visualDescription}</p>}<details><summary>Original AI transcription</summary><p style={{whiteSpace:'pre-wrap'}}>{a.text||'(blank)'}</p></details><label>Verified exact answer<textarea value={corrections.find(c=>c.label===a.label)?.text||''} maxLength={20000} disabled={!!busy} onChange={e=>{setCorrections(old=>old.map(c=>c.label===a.label?{...c,text:e.target.value}:c));setConfirmed(false);}}/></label></div>)}
    <label className="marker-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> I checked every transcription against the original, including blank answers, question labels and subparts.</label>
    <button className="generate" disabled={!!busy||!adult||!confirmed} onClick={()=>void run('mark')}>3. Mark verified answers</button>
   </>}
   {state.report&&<div className="marker-results" aria-live="polite"><div className="marker-block-heading"><span className="marker-kicker">THE NEXT STEP IN YOUR PROGRESS</span><h3>Provisional marking results</h3></div><MarkerResultOverview report={state.report}/>
    {state.report.questions.map(q=><details className="marker-result-question" key={q.label} open={q.needsReview}><summary><span className="marker-question-label">{q.label}</span><span>{q.needsReview?'A closer look is needed':'Mark breakdown & feedback'}</span><span className={`marker-result-badge ${q.needsReview?'needs-review':''}`}>{q.awarded===null?'Human review required':`${q.awarded}/${q.maximum} marks`}</span></summary>{q.needsReview&&<p className="marker-error">{q.reviewReason}</p>}
     {q.decisions.map(d=><div key={d.criterionId} className={`marker-decision ${q.needsReview?'is-review':d.awarded?'is-awarded':'is-missing'}`}><b style={{color:q.needsReview?'#d7af58':d.awarded?'#86d59c':'#e79a91'}}>{d.criterionId} · {q.needsReview?'Proposed ':''}{d.awarded} marks</b><p>{d.reason}</p>{d.evidenceVerified===false&&d.awarded>0&&<p className="marker-error">Unverified citation: the text below was proposed by AI and could not be found in the verified answer. No question score is awarded.</p>}{d.evidence&&<p style={{whiteSpace:'pre-wrap'}}>Answer evidence: “{d.evidence}”</p>}</div>)}<p>{q.feedback}</p><div className="marker-improved"><span className="marker-kicker"><MarkerIcon name="spark"/> A STRONGER ANSWER</span><p style={{whiteSpace:'pre-wrap'}}>{q.improvedAnswer}</p></div></details>)}
    <button onClick={download}><MarkerIcon name="file"/> Download marking report (JSON)</button>
   </div>}
  </>}
 </div>;
}
