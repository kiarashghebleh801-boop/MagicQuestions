const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const {validateCriteria,validateTranscription,validateCorrections,validateReport}=require('../src/lib/markerAI.ts');
const {signArtifact,verifiedArtifact,geminiJSON}=require('../src/lib/markerGemini.server.ts');
const c=validateCriteria({questions:[{label:'Q1',maximum:2,questionText:'Explain.',source:'Official MS.pdf, page 3',criteria:[{id:'M1',text:'More shells',marks:1,notes:''},{id:'M2',text:'More shielding',marks:1,notes:'M2 dependent on M1'}],needsReview:false,reason:''}]},[{label:'Q1',marks:2}]);
const t=validateTranscription({answers:[{label:'Q1',text:'More shells and shielding',confidence:'high',uncertainty:'',location:'answers.pdf page 1',visualDescription:'',needsVisualReview:false}]},c);
const raw={questions:[{label:'Q1',decisions:[{criterionId:'M1',awarded:1,reason:'States more shells',evidence:'More shells'},{criterionId:'M2',awarded:1,reason:'States shielding',evidence:'shielding'}],feedback:'Both points met.',improvedAnswer:'More shells and shielding.',needsReview:false,reviewReason:''}]};
assert.equal(validateReport(raw,c,t).awarded,2);
assert.equal(validateReport(raw,c,t).percentage,100);
const clone=x=>JSON.parse(JSON.stringify(x));
assert.equal(validateReport(raw,c,t,[{label:'Q1',text:'More shells and shielding now'}]).reviewCount,1);
assert.throws(()=>validateReport(raw,c,t,[{label:'Q1',text:'Nothing relevant'}]),/absent/);
let bad=clone(raw);bad.questions[0].decisions[0].awarded=2;assert.throws(()=>validateReport(bad,c,t),/allocation/);
bad=clone(raw);bad.questions[0].decisions[0].awarded=-1;assert.throws(()=>validateReport(bad,c,t),/allocation/);
bad=clone(raw);bad.questions[0].decisions[0].criterionId='invented';assert.throws(()=>validateReport(bad,c,t),/absent/);
bad=clone(raw);bad.questions[0].decisions.pop();assert.throws(()=>validateReport(bad,c,t),/skipped/);
bad=clone(raw);bad.questions[0].decisions[0].evidence='';assert.throws(()=>validateReport(bad,c,t),/evidence/);
const low=clone(t);low.answers[0].confidence='low';assert.equal(validateReport(raw,c,low).questions[0].awarded,null);assert.equal(validateReport(raw,c,low).percentage,null);
const visual=clone(t);visual.answers[0].needsVisualReview=true;assert.equal(validateReport(raw,c,visual).reviewCount,1);
assert.throws(()=>validateCriteria(c,[{label:'Q1',marks:6}]),/maximum/);
assert.throws(()=>validateCorrections([{label:'Q2',text:'x'}],t),/Verify/);
const secret='dummy-test-secret',row={id:'r',stage:'mark',payload:JSON.stringify({version:1,user:'u',session:'s',run:'r',stage:'mark',result:raw})};row.signature=signArtifact(row.payload,secret);
assert.ok(verifiedArtifact(row,'u','s',secret));assert.equal(verifiedArtifact(row,'other-user','s',secret),null);assert.equal(verifiedArtifact({...row,payload:row.payload+' '},'u','s',secret),null);assert.equal(verifiedArtifact({...row,id:'other-run'},'u','s',secret),null);
(async()=>{
 process.env.GEMINI_API_KEY='dummy-unit-test-key';
 const good=await geminiJSON('Extract',[],{},async(url,opts)=>{assert.equal(url.includes(process.env.GEMINI_API_KEY),false);assert.equal(opts.headers['x-goog-api-key'],'dummy-unit-test-key');const body=JSON.parse(opts.body);assert.equal(body.generationConfig.responseMimeType,'application/json');assert.equal(body.tools,undefined);return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"ok":true}'}]}}]}),{status:200});});assert.equal(good.ok,true);
 await assert.rejects(()=>geminiJSON('',[],{},async()=>new Response('secret provider data',{status:429})),/free usage limit/);
 await assert.rejects(()=>geminiJSON('',[],{},async()=>new Response('{}',{status:403})),/permissions/);
 await assert.rejects(()=>geminiJSON('',[],{},async()=>new Response(JSON.stringify({candidates:[{finishReason:'MAX_TOKENS'}]}),{status:200})),/incomplete/);
 await assert.rejects(()=>geminiJSON('',[],{},async()=>{throw new Error('sensitive internal error');}),/did not respond/);
 delete process.env.GEMINI_API_KEY;
 await assert.rejects(()=>geminiJSON('',[],{}),/no Gemini key/);
 console.log('PASS: criterion integrity, mark caps, missing evidence/answers, review withholding, signed-artifact ownership/tamper checks, server-only key transport, quotas and provider failures.');
})().catch(e=>{console.error(e);process.exitCode=1;});
// Exercise the real server-side PDF reader/worker, not just metadata or a mock.
(async()=>{
 const {Documents}=require('../src/lib/markerGemini.server.ts');
 const parts=['1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n','2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n','3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>\nendobj\n','4 0 obj\n<< /Length 0 >>\nstream\n\nendstream\nendobj\n'];
 let pdf='%PDF-1.4\n',offsets=[0];for(const p of parts){offsets.push(Buffer.byteLength(pdf));pdf+=p;}
 const xref=Buffer.byteLength(pdf);pdf+='xref\n0 5\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
 const fakeDb={storage:{from:()=>({download:async()=>({data:new Blob([pdf],{type:'application/pdf'}),error:null})})}};
 const d=new Documents(fakeDb);await d.add('marker-documents','user/session/test.pdf','Test QP','application/pdf');assert.equal(d.pages,1);assert.ok(d.parts.some(p=>p.inlineData?.mimeType==='application/pdf'));
 await assert.rejects(()=>d.add('marker-documents','../another/file.pdf','Invalid'),/path/);
 await assert.rejects(()=>d.add('marker-documents','user/session/test.pdf','Wrong MIME','image/png'),/declared type/);
 console.log('PASS: server-side PDF parsing and explicit worker, real page count, file/path signature validation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
