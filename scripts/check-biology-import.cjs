// Verify catalogue, source DOCX boundaries, every lettered-part export and MS pairing.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{
 let code=fs.readFileSync(f,'utf8');
 if(f.endsWith('/exportWord.ts'))code+='\nexport const __biologyTest = {selectQuestionParts,partStarts,normalizeChemistryMarkColors,normalizeChemistryParagraphSpacing,improveChemistryPageLayout};';
 m._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
};
const {biologyQuestions:questions}=require('../src/lib/biologyQuestions.ts');
const {biologyPartOptions,selectBiologyQuestionParts,specialiseBiologyQuestion}=require('../src/lib/biologyParts.ts');
const {getFormattedSource,getFormattedSourceBucket}=require('../src/lib/sourceDocs.ts');
const {getBiologyMarkSchemeSource}=require('../src/lib/biologyMarkSchemeSources.ts');
const {__biologyTest:word}=require('../src/lib/exportWord.ts');
const {selectMarkSchemeEntries,createScienceMarkSchemeDocument}=require('../src/lib/exportScienceMarkScheme.ts');
const index=require('../src/lib/biologyMarkSchemeIndex.json');
const {Packer}=require('docx'),JSZip=require('jszip');
const directory=process.argv[2];
const sourceYear=process.argv[3] ? Number(process.argv[3]) : null;
(async()=>{
 assert.equal(questions.length,67);assert.equal(questions.reduce((n,q)=>n+q.marks,0),720);assert.equal(Object.keys(index).length,8);
 let checked=0,visuals=0;const sourceXml=new Map();
 for(const q of questions){
  assert.equal(getFormattedSource(q),q.sourceFile);assert.equal(getFormattedSourceBucket(q),'bio papers');
  const name=getBiologyMarkSchemeSource(q);assert(name,q.id);const scheme=index[name];assert.equal(scheme.totals[q.questionNumber],q.marks,q.id);
  const entries=scheme.questions[q.questionNumber];assert(entries.length,q.id);
  assert.equal(entries.reduce((n,r)=>n+r.marks.split(/\s+/).reduce((s,m)=>s+Number(m||0),0),0),q.marks,q.id);
  for(const row of entries)for(const b of row.content){
   if(b.crop){visuals++;assert(b.crop.rect.length===4 && b.crop.rect[3]>b.crop.rect[1]);}
   else assert(!/[\ue000-\uf8ff\ufffd]/.test(b.text),q.id+' unsupported glyph');
  }
  if(!directory || (sourceYear && q.year!==sourceYear))continue;
  if(!sourceXml.has(q.sourceFile)){const z=await JSZip.loadAsync(fs.readFileSync(path.join(directory,q.sourceFile)));sourceXml.set(q.sourceFile,await z.file('word/document.xml').async('text'));}
  const xml=sourceXml.get(q.sourceFile);const paragraphs=[...xml.matchAll(/<w:p(?=[\s>])[\s\S]*?<\/w:p>/g)];
  const labels=paragraphs.map(p=>({offset:p.index,text:[...p[0].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(m=>m[1]).join('')})).filter(p=>/^Q\d+\.$/.test(p.text));
  const start=labels.findIndex(p=>p.text===`Q${q.questionNumber}.`);assert(start>=0,q.id);
  const raw=xml.slice(labels[start].offset,labels[start+1]?.offset??xml.lastIndexOf('<w:sectPr'));
  const options=biologyPartOptions(q);assert.equal(options.reduce((n,p)=>n+p.marks,0)||q.marks,q.marks);
  if(options.length)assert.deepEqual(word.partStarts(raw,options.map(p=>p.part)).map(p=>p.part),options.map(p=>p.part),q.id+' boundaries');
  for(const option of options){
   const selection=selectBiologyQuestionParts(q,[option.part]);assert(selection);
   const result=word.improveChemistryPageLayout(word.normalizeChemistryParagraphSpacing(word.normalizeChemistryMarkColors(word.selectQuestionParts(raw,[option.part],selection.marks))));
   assert(result.includes(`Total for question = ${option.marks} `),q.id+' total');
   assert(!/w:color w:val="(?:A8AAAD)"/.test(result));
   const selected=selectMarkSchemeEntries(entries,[option.part]);assert(selected.length,q.id+' selected MS');
   assert(selected.every(r=>r.part===option.part&&r.displayPart==='(a)'),q.id+' part renumbering');
   assert.equal(selected.reduce((n,r)=>n+r.marks.split(/\s+/).reduce((s,m)=>s+Number(m||0),0),0),option.marks,q.id+' selected marks');
   const matched=specialiseBiologyQuestion(q,option.specTags);assert(matched?.specTags.every(tag=>option.specTags.includes(tag)),q.id+' unrelated topics');checked++;
  }
 }
 if(directory)for(const [name,s]of Object.entries(index)){
  if(sourceYear && !questions.some(q=>q.year===sourceYear && getBiologyMarkSchemeSource(q)===name))continue;
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(directory,name))).digest('hex'),s.sha256,name);
 }
 assert.equal(visuals,1,'Only the actual table should remain an image');
 const plain=questions.filter(q=>!index[getBiologyMarkSchemeSource(q)].questions[q.questionNumber].some(r=>r.content.some(b=>b.crop)));
 const doc=await createScienceMarkSchemeDocument(plain,{subject:'Biology',bucket:'bio markschemes',getIndex:async()=>index,getSource:getBiologyMarkSchemeSource,partOptions:biologyPartOptions});
 if(directory){fs.mkdirSync('tmp/bioimport',{recursive:true});fs.writeFileSync('tmp/bioimport/markscheme-qa.docx',await Packer.toBuffer(doc));}
 console.log(`PASS: 8 papers, 67 questions, 720 marks, ${checked} selected-part exports, all answer totals and source fingerprints; ${visuals} genuine table image. Text-only mark schemes built without PDF downloads.`);
})().catch(e=>{console.error(e);process.exit(1)});
