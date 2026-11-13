// Optional: node scripts/check-physics-formatting.cjs INPUT.docx OUTPUT.docx
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),Module=require('node:module'),ts=require('typescript'),JSZip=require('jszip');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const filename=path.resolve(__dirname,'../src/lib/exportPhysicsWord.ts');
const source=fs.readFileSync(filename,'utf8')+'\nexport { physicsReferenceText, physicsReferenceSection, normalizePhysicsParagraphSpacing, keepPhysicsPartsTogether, preventPhysicsTableRowSplits, boldPhysicsMultipleChoiceOptions };';
const mod=new Module(filename,module);mod.filename=filename;mod.paths=Module._nodeModulePaths(path.dirname(filename));mod._compile(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);const f=mod.exports;
const p=t=>`<w:p><w:r><w:t>${t}</w:t></w:r></w:p>`;
const plain=x=>Array.from(x.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g),m=>m[1]).join('').trim();
const text=f.physicsReferenceText(p('(ii) Explain.'));
assert(text.includes('w:left="320"'));assert(text.includes('w:sz w:val="22"'));assert(text.includes('Arial'));
assert(f.physicsReferenceText(p('(2)')).includes('A8AAAD'));assert(f.physicsReferenceText(p('(Total for question = 2 marks)')).includes('000000'));
for(const label of ['','1','advantage']){
 const line=f.normalizePhysicsParagraphSpacing(p(label+'.'.repeat(145)));
 assert(line.includes('w:pos="8790"'));assert(line.includes('w:line="373"'));assert(!line.includes('.'.repeat(10)));assert.equal(plain(line),label);
 assert.equal(f.normalizePhysicsParagraphSpacing(line),line);
}
assert(f.normalizePhysicsParagraphSpacing(p('Explain.')).includes('w:line="240"'));
const field=p('force = ............................ N');assert(f.normalizePhysicsParagraphSpacing(field).includes('force = ............................ N'));
const space='<w:p><w:r><w:br/><w:br/><w:br/></w:r></w:p>';assert(f.normalizePhysicsParagraphSpacing(space).includes('<w:br/><w:br/><w:br/>'));
const split=f.keepPhysicsPartsTogether(p('Q1.')+p('(a) Explain.')+p('(2)')+p('.'.repeat(100))+p('(b) Calculate.')+p('(3)')+space+field);
assert(!split.includes('pageBreakBefore'),'Word decides when parts move to the next page');
assert(f.physicsReferenceSection('<w:sectPr><w:pgMar w:left="648"/></w:sectPr>').includes('w:left="800"'));
console.log('PASS: reference font, margins, marks, indents, answer lines, body spacing, calculation-space preservation and automatic pagination.');
if(process.argv[2]&&process.argv[3])(async()=>{
 const zip=await JSZip.loadAsync(fs.readFileSync(process.argv[2]));const xml=await zip.file('word/document.xml').async('text');
 const ps=Array.from(xml.matchAll(/<w:p(?=[\s>])[\s\S]*?<\/w:p>/g));const starts=ps.filter(p=>/^Q\d+\.$/.test(plain(p[0]))),end=xml.lastIndexOf('<w:sectPr');
 let result=xml.slice(0,starts[0].index);
 starts.forEach((start,i)=>{let chunk=xml.slice(start.index,starts[i+1]?.index||end);chunk=f.normalizePhysicsParagraphSpacing(f.physicsReferenceText(chunk));chunk=f.boldPhysicsMultipleChoiceOptions(chunk);chunk=f.preventPhysicsTableRowSplits(chunk);chunk=f.keepPhysicsPartsTogether(chunk);result+=chunk;});
 result+=f.physicsReferenceSection(xml.slice(end));zip.file('word/document.xml',result);fs.writeFileSync(process.argv[3],await zip.generateAsync({type:'nodebuffer'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
