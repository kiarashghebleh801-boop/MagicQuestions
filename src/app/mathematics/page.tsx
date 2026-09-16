"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Difficulty, generateQuestions, Question, questions, searchQuestions, topics } from "@/lib/questionBank";
import { exportMathsPaperToWord } from "@/lib/exportMathsWord";
import { exportMarkSchemeToWord } from "@/lib/exportMarkScheme";
import { hasMarkSchemeSource } from "@/lib/markSchemeSources";
import { hasFormattedSource } from "@/lib/sourceDocs";
import { supabase } from "@/lib/supabase";
import PaperReview from "@/components/PaperReview";
import MathsPartPicker, { type MathsPaperQuestion } from "@/components/MathsPartPicker";

export default function MathematicsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [selected, setSelected] = useState<string[]>(["Quadratics", "Algebra"]);
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty | "Mixed">("Mixed");
  const [paper, setPaper] = useState<MathsPaperQuestion[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"generate" | "bank">("generate");

  useEffect(() => {
    let active = true;
    async function checkAccess(session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) {
      if (!active) return;
      if (!session) { router.replace("/login"); return; }
      setEmail(session.user.email || "Account");
      const { data: profile } = await supabase.from("profiles").select("role,banned").eq("id", session.user.id).maybeSingle();
      if (profile?.banned) { router.replace("/banned"); return; }
      setIsOwner(profile?.role === "owner");
      await supabase.rpc("touch_last_seen");
      setReady(true);
    }
    supabase.auth.getSession().then(({ data }) => void checkAccess(data.session));
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => void checkAccess(session));
    const presenceTimer = window.setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) await supabase.rpc("touch_last_seen");
    }, 60000);
    return () => { active = false; auth.subscription.unsubscribe(); window.clearInterval(presenceTimer); };
  }, [router]);

  const formattedQuestions = useMemo(() => questions.filter(hasFormattedSource), []);
  const totalMarks = useMemo(() => paper.reduce((sum, q) => sum + q.marks, 0), [paper]);
  const results = useMemo(() => searchQuestions(query, selected).filter(hasFormattedSource), [query, selected]);

  if (!ready) return <main className="authPage"><div className="authLogo"><span>✦</span> MagicQuestions</div></main>;

  function wrapQuestion(q: Question): MathsPaperQuestion { return { ...q, sourceMarks: q.marks }; }
  function toggleTopic(topic: string) { setSelected(current => current.includes(topic) ? current.filter(item => item !== topic) : [...current, topic]); }
  function generate() {
    const ranked = generateQuestions(selected, questions.length, difficulty).filter(hasFormattedSource);
    setPaper(ranked.slice(0, count).map(wrapQuestion));
  }
  function addQuestion(q: Question) { setPaper(current => current.some(item => item.id === q.id) ? current : [...current, wrapQuestion(q)]); }
  function removeQuestion(id: string) { setPaper(current => current.filter(q => q.id !== id)); }
  function moveQuestion(index: number, direction: number) {
    setPaper(current => { const nextIndex=index+direction; if(nextIndex<0||nextIndex>=current.length)return current; const copy=current.slice(); [copy[index],copy[nextIndex]]=[copy[nextIndex],copy[index]]; return copy; });
  }
  function reorderQuestion(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setPaper(current => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= current.length || toIndex >= current.length) return current;
      const copy = current.slice();
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  }
  function updateQuestionParts(index: number, selectedParts: string[] | undefined, marks: number) {
    setPaper(current => current.map((q, i) => i === index ? { ...q, selectedParts, marks: selectedParts?.length ? marks : (q.sourceMarks ?? q.marks) } : q));
  }
  function replaceQuestion(index: number, replacement: Question) {
    setPaper(current => current.map((q, i) => i === index ? wrapQuestion(replacement) : q));
  }
  async function signOut(){await supabase.auth.signOut();router.replace("/login");}

  return <main>
    <header className="nav">
      <div className="brand"><span className="spark">✦</span> MagicQuestions <span className="ownerTag">Edexcel IGCSE Mathematics</span></div>
      <nav className="tabs"><button className={mode==="generate"?"active":""} onClick={()=>setMode("generate")}>Generate</button><button className={mode==="bank"?"active":""} onClick={()=>setMode("bank")}>Question bank</button><button onClick={()=>router.push("/igcse")}>Subjects</button></nav>
      <div style={{display:"flex",alignItems:"center",gap:8}}>{isOwner&&<button className="accountButton" onClick={()=>router.push("/owner")}>Owner panel</button>}<div className="badge">{email}</div><button className="accountButton" onClick={signOut}>Log out</button></div>
    </header>

    <section className="hero"><p className="eyebrow">EDEXCEL IGCSE MATHEMATICS · PAST PAPERS, BUILT AROUND YOU</p><h1>Your topics. Your paper.<br/><span>Generated in seconds.</span></h1><p className="subtitle">Choose exactly what you want to practise. MagicQuestions selects matching Higher-tier Edexcel IGCSE Mathematics questions from the formatted Word question bank.</p></section>

    {mode==="generate" ? <section className="builder">
      <div className="panel controls">
        <div className="step"><span>1</span><div><b>Choose your topics</b><small>{selected.length} selected</small></div></div>
        <div className="topics">{topics.map(topic=><button key={topic} className={selected.includes(topic)?"topic selected":"topic"} onClick={()=>toggleTopic(topic)}>{selected.includes(topic)?"✓ ":"+ "}{topic}</button>)}</div>
        <div className="divider"/><div className="step"><span>2</span><div><b>Paper settings</b><small>Choose length and difficulty</small></div></div>
        <div className="settingRow"><div className="counter"><button onClick={()=>setCount(Math.max(1,count-1))}>−</button><strong>{count}</strong><button onClick={()=>setCount(Math.min(25,count+1))}>+</button></div><select value={difficulty} onChange={e=>setDifficulty(e.target.value as Difficulty|"Mixed")}><option>Mixed</option><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
        <button className="generate" onClick={generate}>✦ Generate my paper</button>
      </div>
      <PaperPreview paper={paper} totalMarks={totalMarks} formattedQuestions={formattedQuestions} removeQuestion={removeQuestion} regenerate={generate} replaceQuestion={replaceQuestion} moveQuestion={moveQuestion} reorderQuestion={reorderQuestion} updateQuestionParts={updateQuestionParts}/>
    </section> : <section className="bank panel">
      <div className="bankTop"><div><p className="eyebrow">QUESTION BANK</p><h2>Browse all {formattedQuestions.length} formatted questions</h2></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search topics, year, paper…"/></div>
      <div className="topics compact">{topics.map(topic=><button key={topic} className={selected.includes(topic)?"topic selected":"topic"} onClick={()=>toggleTopic(topic)}>{topic}</button>)}</div>
      <div className="bankResults">{results.map(q=><article className="bankCard" key={q.id}><div><div className="qMeta">{q.session} {q.year} · {q.paper} · Q{q.questionNumber} · {q.difficulty}{hasMarkSchemeSource(q)?" · Mark scheme ready":" · Mark scheme unavailable"}</div><h3>{q.summary}</h3><div className="tags">{q.topics.map(t=><span key={t}>{t}</span>)}</div></div><div className="bankActions"><b>{q.marks} marks</b><button onClick={()=>addQuestion(q)}>+ Add</button></div></article>)}</div>
    </section>}
  </main>;
}

type PaperPreviewProps={paper:MathsPaperQuestion[];totalMarks:number;formattedQuestions:Question[];removeQuestion:(id:string)=>void;regenerate:()=>void;replaceQuestion:(index:number,replacement:Question)=>void;moveQuestion:(index:number,direction:number)=>void;reorderQuestion:(fromIndex:number,toIndex:number)=>void;updateQuestionParts:(index:number,selectedParts:string[]|undefined,marks:number)=>void};
function PaperPreview({paper,totalMarks,formattedQuestions,removeQuestion,regenerate,replaceQuestion,moveQuestion,reorderQuestion,updateQuestionParts}:PaperPreviewProps){
  const[exporting,setExporting]=useState(false);
  const[exportingMarkScheme,setExportingMarkScheme]=useState(false);
  const[draggedIndex,setDraggedIndex]=useState<number|null>(null);
  const[reviewOpen,setReviewOpen]=useState(false);
  const[swapIndex,setSwapIndex]=useState<number|null>(null);
  const missingMarkSchemes=paper.filter(q=>!hasMarkSchemeSource(q));
  const hasPartialQuestions=paper.some(q=>q.selectedParts?.length);
  async function downloadWord(){setExporting(true);try{await exportMathsPaperToWord(paper);}catch(error){window.alert(error instanceof Error?error.message:"Could not build the Word paper.");}finally{setExporting(false);}}
  async function downloadMarkScheme(){
    if(hasPartialQuestions){window.alert("Partial Maths questions are supported in the question paper, but cropped sub-question mark schemes are not connected yet. Use the full-question mark scheme for now.");return;}
    if(missingMarkSchemes.length){
      const missing=missingMarkSchemes.map(q=>`${q.session} ${q.year} Paper ${q.paper} Q${q.questionNumber}`).join("\n");
      window.alert(`These selected questions do not have a mark scheme connected yet:\n\n${missing}\n\nYou can still use/export the question paper; only the custom mark-scheme download is unavailable for those questions.`);
      return;
    }
    setExportingMarkScheme(true);try{await exportMarkSchemeToWord(paper);}catch(error){window.alert(error instanceof Error?error.message:"Could not build the mark scheme.");}finally{setExportingMarkScheme(false);}
  }
  return <div className="panel preview"><div className="previewHead"><div><p>YOUR PAPER</p><h2>{paper.length?`${paper.length} questions · ${totalMarks} marks`:"Ready when you are"}</h2></div><span>Higher</span></div>
    {!paper.length?<div className="empty"><div>✦</div><h3>Your custom paper will appear here</h3><p>Pick topics and settings, then generate a balanced selection.</p></div>:<><div className="editorHint"><span>✦</span><div><b>Edit before you export</b><small>Drag and drop questions, swap them, or choose exactly which sub-questions to keep.</small></div></div><div className="questionList">{paper.map((q,index)=><article className="question" key={`${q.id}-${index}`} draggable onDragStart={e=>{setDraggedIndex(index);e.dataTransfer.effectAllowed="move";}} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect="move";}} onDrop={e=>{e.preventDefault();if(draggedIndex!==null)reorderQuestion(draggedIndex,index);setDraggedIndex(null);}} onDragEnd={()=>setDraggedIndex(null)} style={{cursor:"grab",opacity:draggedIndex===index?.55:1,transition:"opacity .15s ease, transform .15s ease"}}><div className="qNumber" title="Drag to reorder">{index+1}<div style={{fontSize:10,lineHeight:1,opacity:.55,marginTop:4}}>⋮⋮</div></div><div className="qBody"><div className="qMeta">{q.session} {q.year} · Paper {q.paper} · Original Q{q.questionNumber} · {q.difficulty}</div><h3>{q.summary}</h3><div className="tags">{q.topics.map(t=><span key={t}>{t}</span>)}</div><MathsPartPicker question={q} onChange={(parts,marks)=>updateQuestionParts(index,parts,marks)}/><div className="questionTools"><button onClick={()=>moveQuestion(index,-1)} disabled={index===0}>↑ Up</button><button onClick={()=>moveQuestion(index,1)} disabled={index===paper.length-1}>↓ Down</button><button onClick={()=>setSwapIndex(index)}>↻ Swap</button><button onClick={()=>removeQuestion(q.id)}>Remove</button></div></div><div className="marks">{q.marks}<small>marks</small></div></article>)}</div><div className="paperActions"><button onClick={regenerate}>↻ Regenerate all</button><button className="word" onClick={downloadWord} disabled={exporting||exportingMarkScheme}>{exporting?"Building paper…":"Download Question Paper"}</button><button className="word" onClick={downloadMarkScheme} disabled={paper.length===0||exporting||exportingMarkScheme}>{exportingMarkScheme?"Building mark scheme…":"Download Mark Scheme"}</button><button onClick={()=>setReviewOpen(true)}>✓ Review paper</button><button className="print" onClick={()=>window.print()}>Print / Save PDF</button></div>{reviewOpen&&<PaperReview paper={paper} title="Mathematics paper review" onClose={()=>setReviewOpen(false)}/>}</>}
    {swapIndex!==null&&paper[swapIndex]&&<SwapQuestionModal current={paper[swapIndex]} paper={paper} questions={formattedQuestions} onClose={()=>setSwapIndex(null)} onChoose={q=>{replaceQuestion(swapIndex,q);setSwapIndex(null);}}/>}
  </div>;
}

function SwapQuestionModal({current,paper,questions,onClose,onChoose}:{current:MathsPaperQuestion;paper:MathsPaperQuestion[];questions:Question[];onClose:()=>void;onChoose:(q:Question)=>void}){
  const[topic,setTopic]=useState(current.topics[0]||"");
  const[search,setSearch]=useState("");
  const usedIds=useMemo(()=>new Set(paper.map(q=>q.id)),[paper]);
  const availableTopics=current.topics;
  const candidates=useMemo(()=>questions
    .filter(q=>!usedIds.has(q.id)&&q.topics.includes(topic))
    .filter(q=>!search.trim()||`${q.summary} ${q.session} ${q.year} ${q.paper} Q${q.questionNumber} ${q.topics.join(" ")}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>Math.abs(a.marks-current.marks)-Math.abs(b.marks-current.marks)||b.year-a.year),[questions,usedIds,topic,search,current.marks]);

  useEffect(()=>{
    const close=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",close);
    return()=>window.removeEventListener("keydown",close);
  },[onClose]);

  return <div onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.78)",backdropFilter:"blur(7px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{width:"min(760px,96vw)",maxHeight:"84vh",display:"flex",flexDirection:"column",background:"#101010",border:"1px solid rgba(201,162,39,.38)",borderRadius:18,boxShadow:"0 28px 80px rgba(0,0,0,.62)",overflow:"hidden"}}>
      <div style={{padding:"18px 20px 14px",borderBottom:"1px solid rgba(255,255,255,.08)",display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start"}}>
        <div><div style={{fontSize:11,fontWeight:900,letterSpacing:".12em",color:"#d2ad36",marginBottom:5}}>SWAP QUESTION</div><div style={{fontSize:18,fontWeight:850}}>Choose the replacement yourself</div><div style={{fontSize:12,color:"#989898",marginTop:5}}>Showing every available formatted question from the same topic. Questions already in your paper are hidden.</div></div>
        <button onClick={onClose} style={{border:"1px solid rgba(255,255,255,.12)",background:"#171717",color:"#ddd",borderRadius:9,width:34,height:34,fontSize:18,cursor:"pointer"}}>×</button>
      </div>
      <div style={{padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
        <div style={{fontSize:11,color:"#8f8f8f",marginBottom:7}}>Choose topic</div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:12}}>{availableTopics.map(t=><button key={t} onClick={()=>setTopic(t)} style={{border:`1px solid ${topic===t?"#c9a227":"rgba(255,255,255,.12)"}`,background:topic===t?"rgba(201,162,39,.15)":"#151515",color:topic===t?"#f0d36a":"#bbb",borderRadius:999,padding:"7px 10px",fontWeight:750,cursor:"pointer"}}>{t}</button>)}</div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search year, paper, question or topic…" style={{width:"100%",boxSizing:"border-box",background:"#090909",border:"1px solid rgba(255,255,255,.13)",color:"#eee",borderRadius:10,padding:"11px 12px",outline:"none"}}/>
      </div>
      <div style={{padding:"10px 20px 18px",overflowY:"auto"}}>
        <div style={{fontSize:11,color:"#888",padding:"4px 0 9px"}}>{candidates.length} replacement{candidates.length===1?"":"s"} available for <b style={{color:"#d7ba55"}}>{topic}</b></div>
        {candidates.length===0?<div style={{padding:"28px 10px",textAlign:"center",color:"#888"}}>No other questions match this topic and search.</div>:candidates.map(q=><button key={q.id} onClick={()=>onChoose(q)} style={{width:"100%",textAlign:"left",display:"grid",gridTemplateColumns:"1fr auto",gap:14,alignItems:"center",background:"#141414",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"13px 14px",marginBottom:8,color:"inherit",cursor:"pointer"}}>
          <div><div style={{fontSize:11,color:"#9a9a9a",marginBottom:4}}>{q.session} {q.year} · Paper {q.paper} · Q{q.questionNumber} · {q.difficulty}</div><div style={{fontSize:13,fontWeight:760,color:"#eee",lineHeight:1.35}}>{q.summary}</div><div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:7}}>{q.topics.map(t=><span key={t} style={{fontSize:10,color:t===topic?"#edcf67":"#aaa",border:"1px solid rgba(255,255,255,.09)",borderRadius:999,padding:"3px 6px"}}>{t}</span>)}</div></div>
          <div style={{textAlign:"right",minWidth:62}}><div style={{fontSize:18,fontWeight:900,color:"#d2ad36"}}>{q.marks}</div><div style={{fontSize:10,color:"#888"}}>marks</div><div style={{fontSize:10,color:"#cdb35b",marginTop:6}}>Select →</div></div>
        </button>)}
      </div>
    </div>
  </div>;
}
