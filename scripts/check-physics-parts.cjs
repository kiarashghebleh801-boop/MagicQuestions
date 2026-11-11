const fs=require('fs'),assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const {physicsPartLayout,selectPhysicsParts,splitPhysicsMarkScheme}=require('../src/lib/physicsParts.ts');
const {selectMarkSchemeEntries}=require('../src/lib/exportScienceMarkScheme.ts');
const p=t=>`<w:p><w:r><w:t>${t}</w:t></w:r></w:p>`;
const xml=p('Q1.')+p('Shared diagram context')+p('(a) Use the diagram')+p('(i) First calculation')+p('(2)')+p('(ii) Second calculation')+p('(3)')+p('(b) Explain')+p('(4)')+p('(Total for question = 9 marks)');
assert.deepEqual(physicsPartLayout(xml).parts.map(p=>[p.key,p.marks]),[['a.i',2],['a.ii',3],['b',4]]);
const selected=selectPhysicsParts(xml,['a.ii'],3);assert(selected.includes('Shared diagram context'));assert(selected.includes('Use the diagram'));assert(selected.includes('Second calculation'));assert(!selected.includes('First calculation'));assert(!selected.includes('Explain'));assert(selected.includes('= 3 marks'));assert.throws(()=>selectPhysicsParts(xml,[],0));
const inline=p('Q1.')+p('(a) (i) First')+p('(1)')+p('(ii) Second')+p('(2)')+p('(Total for question = 3 marks)');
assert(!selectPhysicsParts(inline,['a.ii'],2).includes('First'));assert(selectPhysicsParts(inline,['a.ii'],2).includes('(a)'));
const index=require('../src/lib/physicsMarkSchemeIndex.json');let count=0;
for(const [file,paper]of Object.entries(index))for(const [q,rows]of Object.entries(paper.questions)){
 try{const split=splitPhysicsMarkScheme(rows);assert.equal(split.reduce((n,r)=>n+r.marks.split(/\s+/).reduce((n,v)=>n+Number(v||0),0),0),rows.reduce((n,r)=>n+r.marks.split(/\s+/).reduce((n,v)=>n+Number(v||0),0),0));
  assert.equal(split.flatMap(r=>r.content).filter(b=>b.crop).length,rows.flatMap(r=>r.content).filter(b=>b.crop).length,'No diagrams lost');
  for(const row of split){if(row.roman){const picked=selectMarkSchemeEntries(split,[`${row.part}.${row.roman}`],true);assert(picked.every(r=>!r.part||(r.part===row.part&&(!r.roman||r.roman===row.roman))));assert(picked.every(r=>!r.part||r.displayPart===`(${row.part})`));}}
  count++;}catch(e){console.log(file,q,e.message);throw e;}
}
console.log(`PASS: nested QP selection, shared context, marks, empty selection, inline labels, ${count} indexed MS questions.`);
if(process.argv[2]) (async()=>{
 const JSZip=require('jszip'),zip=await JSZip.loadAsync(fs.readFileSync(process.argv[2])),xml=await zip.file('word/document.xml').async('text');
 const ps=Array.from(xml.matchAll(/<w:p(?=[\s>])[\s\S]*?<\/w:p>/g));
 const plain=x=>Array.from(x.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)).map(m=>m[1]).join('').trim();
 const starts=ps.filter(p=>/^Q\d+\.$/.test(plain(p[0])));
 for(let i=0;i<starts.length;i++){
  const body=xml.slice(starts[i].index,starts[i+1]?.index||xml.lastIndexOf('<w:sectPr'));
  const expected=Number(plain(body).match(/Total for question\s*=\s*(\d+)/i)?.[1]);
  const layout=physicsPartLayout(body);const rows=splitPhysicsMarkScheme(index['IGCSE_PHYSICS_2026_June_P1_MS_1789834923593.pdf']?.questions[String(i+1)]||[]);console.log(plain(starts[i][0]),expected,layout.parts.map(p=>`${p.key}:${p.marks}`).join(','));
  if(layout.parts.length){assert.equal(layout.parts.reduce((n,p)=>n+p.marks,0),expected);assert(layout.parts.every(p=>p.marks>0));
   for(const part of layout.parts){
    const answerRows=rows.filter(r=>r.part===part.part&&r.roman===part.roman);
    assert(answerRows.length,`Missing MS ${i+1} ${part.key}`);
    assert.equal(answerRows.reduce((n,r)=>n+r.marks.split(/\s+/).reduce((n,v)=>n+Number(v||0),0),0),part.marks,`MS marks ${i+1} ${part.key}`);
    const out=selectPhysicsParts(body,[part.key],part.marks);assert(out.includes(`= ${part.marks} `));}
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
