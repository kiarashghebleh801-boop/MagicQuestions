const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const {paperSnapshot,inspectMarkerFile}=require('../src/lib/paperMarker.ts');
const q=(year,session,paper,questionNumber)=>({id:`${year}-${paper}-${questionNumber}`,year,session,paper,questionNumber,marks:3,summary:'Test question',selectedParts:['a.ii'],topics:['Electricity']});
const pack=paperSnapshot('Physics',[q(2025,'May/June','1P',3),q(2024,'November','2P',4)]);
assert.deepEqual(pack.map(p=>p.label),['Q1','Q2']);assert.notEqual(pack[0].source.scheme,pack[1].source.scheme);assert.equal(pack[0].source.questionNumber,3);assert.equal(pack[1].source.questionNumber,4);assert.deepEqual(pack[0].source.selectedParts,['a.ii']);assert.equal(pack[0].question.marks,3);assert.equal(pack[0].topics[0],'Electricity');
assert.equal(paperSnapshot('Physics',[q(1900,'Unknown','1P',1)])[0].source.scheme,null);
(async()=>{
 await assert.rejects(()=>inspectMarkerFile(new File([], 'empty.pdf',{type:'application/pdf'})),/25 MB/);
 await assert.rejects(()=>inspectMarkerFile(new File([new Uint8Array(25*1024*1024+1)], 'large.pdf',{type:'application/pdf'})),/25 MB/);
 await assert.rejects(()=>inspectMarkerFile(new File(['not a PDF'], 'fake.pdf',{type:'application/pdf'})),/valid PDF/);
 await assert.rejects(()=>inspectMarkerFile(new File(['<script>'], 'file.html',{type:'text/html'})),/valid PDF/);
 console.log('PASS: mixed-source schemes, original question numbering, selected parts, marks/topics, missing schemes and invalid/empty/oversize uploads.');
})().catch(e=>{console.error(e);process.exitCode=1;});
