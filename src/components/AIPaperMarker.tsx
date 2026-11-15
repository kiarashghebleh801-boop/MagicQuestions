"use client";
import MarkerReview from './MarkerReview';
import { MarkerIcon, MarkerHeading, MarkerJourney, MarkerStat } from './MarkerUI';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MARKER_BUCKET, inspectMarkerFile, paperSnapshot, type MarkerSubject, type MarkerQuestion } from '@/lib/paperMarker';
type Upload={id:string;file:File;pages:number;url:string;role:string};
type Answer={label:string;text:string};
type Session={id:string;title:string;status:string;mode:string;created_at:string;responses:Answer[];paper_snapshot:ReturnType<typeof paperSnapshot>|null};
type Paper={id:string;title:string;questions:ReturnType<typeof paperSnapshot>};
type DocumentRow={id:string;path:string;name:string;role:string;position:number;pages:number};
export default function AIPaperMarker({subject,paper=[]}:{subject:MarkerSubject;paper?:MarkerQuestion[]}){
 const [mode,setMode]=useState<'generated'|'external'>('generated'),[title,setTitle]=useState(''),[papers,setPapers]=useState<Paper[]>([]),[chosen,setChosen]=useState('current');
 const [uploads,setUploads]=useState<Upload[]>([]),[answers,setAnswers]=useState<Answer[]>([]),[sessions,setSessions]=useState<Session[]>([]),[opened,setOpened]=useState<Session|null>(null),[documents,setDocuments]=useState<DocumentRow[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[confirmed,setConfirmed]=useState(false);
 const snapshot=chosen==='current'?paperSnapshot(subject,paper):papers.find(p=>p.id===chosen)?.questions||[];
 useEffect(()=>{let alive=true;void (async()=>{const [a,b]=await Promise.all([supabase.from('marker_papers').select('*').eq('subject',subject).order('created_at',{ascending:false}).limit(30),supabase.from('marker_sessions').select('*').eq('subject',subject).order('created_at',{ascending:false}).limit(100)]);if(!alive)return;if(a.error||b.error)setError('Could not load your marker history. Refresh to try again.');else{setPapers(a.data||[]);setSessions(b.data||[]);}})();return()=>{alive=false;};},[subject]);
 const previewUrls=useRef(new Set<string>());
 useEffect(()=>{uploads.forEach(u=>previewUrls.current.add(u.url));},[uploads]);
 useEffect(()=>()=>{previewUrls.current.forEach(url=>URL.revokeObjectURL(url));},[]);
 async function add(role:string,files:File[]){setBusy(true);setError('');try{
  if(uploads.length+files.length>30)throw new Error('Use at most 30 files in one session.');
  if(uploads.reduce((n,u)=>n+u.file.size,0)+files.reduce((n,f)=>n+f.size,0)>100*1024*1024)throw new Error('Keep the combined upload under 100 MB.');
  const checked:Omit<Upload,'url'>[]=[];for(const file of files)checked.push({id:crypto.randomUUID(),role,file,pages:await inspectMarkerFile(file)});
  if(uploads.filter(u=>u.role===role).reduce((n,u)=>n+u.pages,0)+checked.reduce((n,u)=>n+u.pages,0)>60)throw new Error('Each document group can contain at most 60 pages.');
  setUploads(old=>[...old,...checked.map(u=>({...u,url:URL.createObjectURL(u.file)}))]);
 }catch(e){setError(e instanceof Error?e.message:'Could not read the upload.');}finally{setBusy(false);}}
 function reorder(id:string,dir:number){setUploads(old=>{const next=[...old],i=next.findIndex(u=>u.id===id);const indexes=next.map((u,j)=>u.role===next[i].role?j:-1).filter(j=>j>=0),target=indexes[indexes.indexOf(i)+dir];if(target===undefined)return old;[next[i],next[target]]=[next[target],next[i]];return next;});}
 async function open(s:Session){setBusy(true);setError('');const {data,error}=await supabase.from('marker_documents').select('*').eq('session_id',s.id).order('position');if(error)setError(error.message);else{setOpened(s);setDocuments(data||[]);}setBusy(false);}
 async function preview(d:DocumentRow){const {data,error}=await supabase.storage.from(MARKER_BUCKET).createSignedUrl(d.path,120);if(error)setError('Could not open this document.');else window.open(data.signedUrl,'_blank','noopener,noreferrer');}
 async function remove(s:Session){if(!window.confirm('Delete this marking session and its uploaded documents?'))return;setBusy(true);setError('');try{
  const list=await supabase.storage.from(MARKER_BUCKET).list(`${(await supabase.auth.getUser()).data.user?.id}/${s.id}`,{limit:100});if(list.error)throw list.error;
  const {data}=await supabase.auth.getUser();const paths=(list.data||[]).map(d=>`${data.user!.id}/${s.id}/${d.name}`);
  if(paths.length){const r=await supabase.storage.from(MARKER_BUCKET).remove(paths);if(r.error)throw r.error;}
  const r=await supabase.from('marker_sessions').delete().eq('id',s.id);if(r.error)throw r.error;
  setSessions(old=>old.filter(x=>x.id!==s.id));if(opened?.id===s.id)setOpened(null);
 }catch{setError('Deletion did not finish. Your session is retained so you can retry.');}finally{setBusy(false);}}
 async function save(){setBusy(true);setError('');setMessage('');let sessionId:string|undefined;const savedPaths:string[]=[];try{
  if(!title.trim())throw new Error('Give your paper a name.');
  if(mode==='generated'&&!snapshot.length)throw new Error('Generate a paper first, or choose a saved paper.');
  for(const role of mode==='external'?['questions','answers','scheme']:['answers'])if(!uploads.some(u=>u.role===role)&&!(role==='answers'&&answers.some(a=>a.text.trim())))throw new Error(`Add the ${role==='scheme'?'official mark scheme':role==='questions'?'original question paper':'completed answers'} before saving.`);
  if(answers.some(a=>a.text.trim()&&!a.label.trim()))throw new Error('Give each typed answer a question label.');
  if(new Set(answers.filter(a=>a.text.trim()).map(a=>a.label.trim().toLowerCase())).size!==answers.filter(a=>a.text.trim()).length)throw new Error('Use a unique question label for each answer.');
  if(!confirmed)throw new Error('Review the page order and typed answers, then confirm them.');
  const {data:auth}=await supabase.auth.getUser();if(!auth.user)throw new Error('Sign in again to save your session.');
  sessionId=crypto.randomUUID();const row={id:sessionId,user_id:auth.user.id,subject,title:title.trim(),mode,status:'draft',responses:answers.filter(a=>a.text.trim()),paper_snapshot:mode==='generated'?snapshot:null};
  const r=await supabase.from('marker_sessions').insert(row).select().single();if(r.error)throw r.error;
  // Retain an interrupted session in history, so cleanup can always be retried.
  setSessions(old=>[r.data,...old]);
  const activeUploads=uploads.filter(u=>mode==='external'||u.role==='answers');
  for(let i=0;i<activeUploads.length;i++){const u=activeUploads[i],path=`${auth.user.id}/${sessionId}/${u.id}.${u.file.type==='application/pdf'?'pdf':u.file.type==='image/png'?'png':'jpg'}`;
   const result=await supabase.storage.from(MARKER_BUCKET).upload(path,u.file,{contentType:u.file.type,upsert:false});if(result.error)throw result.error;savedPaths.push(path);
   const meta=await supabase.from('marker_documents').insert({session_id:sessionId,user_id:auth.user.id,role:u.role,path,name:u.file.name,mime:u.file.type,bytes:u.file.size,pages:u.pages,position:i});if(meta.error)throw meta.error;
  }
  const finalized=await supabase.from('marker_sessions').update({status:'verified'}).eq('id',sessionId);if(finalized.error)throw finalized.error;
  setSessions(old=>old.map(s=>s.id===sessionId?{...s,status:'verified'}:s));
  uploads.forEach(u=>URL.revokeObjectURL(u.url));
  setMessage('Saved privately. Open this submission in history to read and mark it with Gemini.');setUploads([]);setAnswers([]);setConfirmed(false);setTitle('');
 }catch(e){if(sessionId){await supabase.from('marker_sessions').update({status:'draft'}).eq('id',sessionId);setSessions(old=>old.map(s=>s.id===sessionId?{...s,status:'draft'}:s));}
 setError((e instanceof Error?e.message:'Could not save.')+(sessionId?' This incomplete session is in history. Delete it to clear the uploads, then retry.':''));}finally{setBusy(false);}}
 return <section className="marker-page">
  <header className="marker-hero"><div className="marker-hero-copy"><span className="marker-kicker"><span className="marker-live-dot"/> YOUR {subject.toUpperCase()} REVIEW STUDIO</span><h1>AI Paper Marker<span>Practice. Understand. Improve.</span></h1><p className="subtitle">A clearer picture of every answer. Bring your paper, check the reading, and explore feedback grounded in the official mark scheme.</p><div className="marker-hero-tags"><span><MarkerIcon name="shield"/> Private submissions</span><span><MarkerIcon name="file"/> Official marking criteria</span><span className="marker-beta">BETA</span></div></div><div className="marker-hero-art" aria-hidden="true"><div className="marker-orbit"/><div className="marker-paper-art"><i/><i/><i/><div><MarkerIcon name="check"/><span>Answer by answer</span></div><i/><i/></div><span className="marker-art-spark"><MarkerIcon/></span></div></header>
  <div className="marker-stat-grid"><MarkerStat icon="file" value={opened?documents.length:uploads.length} label={opened?'Saved documents':'Files added'}/><MarkerStat icon="clock" value={sessions.length} label="Private submissions"/><MarkerStat icon="shield" value="You stay in control" label="Review answers before marking"/></div>
  <div className="marker-notice" role="status"><span className="marker-notice-icon"><MarkerIcon/></span><div><b>Gemini marking · Beta</b><p>Save a submission, then open it in history to match the official scheme, verify the answers and request provisional marking. For adult parents and teachers. Human review is required for uncertain or visual answers.</p></div></div>
  {error&&<p role="alert" className="marker-error">{error}</p>}{message&&<p className="marker-success" role="status"><MarkerIcon name="check"/>{message}</p>}
  {opened?<div className="marker-card marker-submission"><button onClick={()=>setOpened(null)}>← Back to submissions</button><h2 className="marker-submission-title">{opened.title}</h2><p className="marker-submission-meta">{opened.status==='draft'?'Incomplete upload':'Documents verified'} ·  {new Date(opened.created_at).toLocaleDateString()}</p>
   {documents.map(d=><div className="marker-file" key={d.id}><span>{d.role} · {d.name} · {d.pages} pages</span><button onClick={()=>void preview(d)}>View original</button></div>)}
   <details className="marker-source-list"><summary>Source questions <span className="marker-chip">{opened.paper_snapshot?.length||0} linked</span></summary>{opened.paper_snapshot?.map(q=><details key={q.label}><summary>{q.label} · {q.question.marks} marks · {q.question.summary}</summary><p>Source: {q.source.session} {q.source.year}, {q.source.paper}, Q{q.source.questionNumber}. Parts: {q.source.selectedParts?.join(', ')||'All'}.</p><p>Mark scheme: {q.source.scheme?'Matched to source paper; criteria extraction pending':'Not available — manual scheme matching required'}</p></details>)}</details>
   {opened.responses.map((a,i)=><div key={i}><b>{a.label} · Typed answer</b><p style={{whiteSpace:'pre-wrap'}}>{a.text}</p></div>)}
   <MarkerReview key={opened.id} sessionId={opened.id} verified={opened.status==='verified'}/><button disabled={busy} onClick={()=>void remove(opened)}>Delete session and documents</button>
  </div>:<>
  <MarkerJourney active={confirmed?3:uploads.length||answers.some(a=>a.text.trim())?2:title.trim()&&(mode==='external'||snapshot.length)?1:0} steps={[{label:'Choose paper',detail:'Select your starting point'},{label:'Add answers',detail:'Upload and arrange'},{label:'Check details',detail:'Review your submission'},{label:'Save privately',detail:'Ready for AI review'}]}/>
  <div className="marker-card marker-setup"><MarkerHeading number="01" title="Choose your paper" description="Start with a paper from your question bank, or bring your own."/><div className="marker-actions"><button aria-pressed={mode==='generated'} disabled={busy} onClick={()=>{setMode('generated');setConfirmed(false);}}><MarkerIcon name="spark"/><span><b>MagicQuestions paper</b><small>Questions & schemes linked for you</small></span></button><button aria-pressed={mode==='external'} disabled={busy} onClick={()=>{setMode('external');setConfirmed(false);}}><MarkerIcon name="file"/><span><b>External paper</b><small>Add your question paper & scheme</small></span></button></div>
   <label>Paper name<input value={title} maxLength={160} onChange={e=>{setTitle(e.target.value);setConfirmed(false);}} placeholder={`${subject} practice paper`}/></label>
   {mode==='generated'&&<><label>Generated paper<select value={chosen} onChange={e=>{setChosen(e.target.value);setAnswers([]);setConfirmed(false);}}><option value="current">Current paper ({paper.length} questions)</option>{papers.map(p=><option value={p.id} key={p.id}>{p.title} · {p.id.slice(0,6)}</option>)}</select></label><p>{snapshot.length} questions · {snapshot.reduce((n,q)=>n+q.question.marks,0)} available marks</p><p className="qMeta">New Word downloads are remembered for this subject. You can also use the current paper from the generator.</p>{snapshot.map(q=><p className="qMeta" key={q.label}>{q.label} · {q.question.marks} marks · {q.question.session} {q.question.year} {q.question.paper}, original Q{q.question.questionNumber}{!q.source.scheme?' · Mark scheme missing':''}</p>)}</>}
  </div>
  <div className="marker-card marker-upload-card"><MarkerHeading number="02" title="Bring your answers" description="Your work, in the right order. Preview any file before saving."/><p>PDF, PNG or JPEG · 25 MB per file · 60 pages per group · 100 MB total. Check every page before saving.</p>
   {(mode==='external'?['questions','answers','scheme']:['answers']).map(role=><div className="marker-upload-zone" key={role}><span className="marker-upload-symbol"><MarkerIcon name="upload"/></span><label>{role==='questions'?'Original question paper':role==='scheme'?'Official mark scheme':'Completed answers'}<input type="file" accept="application/pdf,image/png,image/jpeg" multiple disabled={busy} onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';setConfirmed(false);void add(role,files);}}/></label>{uploads.filter(u=>u.role===role).map((u,i)=><div className="marker-file" key={u.id}><a href={u.url} target="_blank" rel="noreferrer">{i+1}. {u.file.name} · {u.pages} pages — Preview</a><div><button disabled={busy} onClick={()=>{reorder(u.id,-1);setConfirmed(false);}} aria-label={`Move ${u.file.name} earlier`}>↑</button><button disabled={busy} onClick={()=>{reorder(u.id,1);setConfirmed(false);}} aria-label={`Move ${u.file.name} later`}>↓</button><button disabled={busy} onClick={()=>{setUploads(old=>old.filter(x=>x.id!==u.id));setConfirmed(false);}}>Remove</button></div></div>)}</div>)}
  </div>
  <div className="marker-card"><MarkerHeading number="03" title="A final check" description="Make sure everything is present before creating your private submission."/><p>You may enter typed answers instead of uploading an answer document. Gemini can read your uploaded answers after saving. You must verify its transcription before marking; uploads are preserved as originals.</p>
   {answers.map((a,i)=><div key={i} className="marker-answer"><label>Question / subpart<input value={a.label} maxLength={40} onChange={e=>{setAnswers(old=>old.map((x,j)=>j===i?{...x,label:e.target.value}:x));setConfirmed(false);}}/></label><label>Your exact answer<textarea maxLength={20000} value={a.text} onChange={e=>{setAnswers(old=>old.map((x,j)=>j===i?{...x,text:e.target.value}:x));setConfirmed(false);}}/></label><button onClick={()=>{setAnswers(old=>old.filter((_,j)=>j!==i));setConfirmed(false);}}>Remove answer</button></div>)}
   <button disabled={busy||answers.length>=100} onClick={()=>{setAnswers(old=>[...old,{label:`Q${old.length+1}`,text:''}]);setConfirmed(false);}}>+ Add typed answer</button>
   <label className="marker-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/> I have checked document completeness, page order and typed answers.</label>
   <button className="generate" disabled={busy||!confirmed} onClick={()=>void save()}>{busy?'Processing documents…':'Save private submission'}</button>
   <p className="qMeta">Saving alone does not send documents to Gemini. Open the saved submission and confirm AI processing to start.</p>
  </div>
  <div className="marker-card marker-history"><MarkerHeading number="↗" title={`${subject} marking history`} description="Pick up where you left off. Your submissions stay in your account."/>{!sessions.length?<div className="marker-empty"><MarkerIcon name="clock"/><h3>Your progress starts here</h3><p>No submissions yet.</p><small>Your first saved paper will appear here, ready to open and review.</small></div>:sessions.map(s=><div className="marker-file" key={s.id}><div><b>{s.title}</b><p className="qMeta">{new Date(s.created_at).toLocaleDateString()} · {s.status==='draft'?'Incomplete upload':'Verified submission'} · Open for AI progress</p></div><div><button disabled={busy} onClick={()=>void open(s)}>Open</button><button disabled={busy} onClick={()=>void remove(s)}>Delete</button></div></div>)}</div></>}
 </section>;
}
