// Regression: added working space belongs before the first final answer, never
// between related values. Optional source DOCX exercises the reported Q24 too.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const JSZip = require('jszip');
const file = path.resolve(__dirname, '../src/lib/exportMathsWord.ts');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2020, esModuleInterop:true}}).outputText, filename);
const mod = new Module(file, module); mod.filename = file; mod.paths = Module._nodeModulePaths(path.dirname(file));
mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8') + '\nexport const layoutTest = {rawParagraphs, normalizeMathsPagination, normalizeMathsAnswerLines, ensureMathsWorkingSpace, keepMathsFinalAnswersTogether, improveMathsQuestionLayout};', {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText, file);
const api = mod.exports.layoutTest;
const p = text => `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;
const blank = '<w:p><w:pPr><w:spacing w:line="440" w:lineRule="exact"/></w:pPr><w:r><w:t> </w:t></w:r></w:p>';
const answer = name => p(`${name} = ${'.'.repeat(43)}`);
function check(xml, marks) {
  const out = api.keepMathsFinalAnswersTogether(api.ensureMathsWorkingSpace(xml, marks));
  const ps = api.rawParagraphs(out);
  const a = ps.findIndex(p => p.text.startsWith('a ='));
  const d = ps.findIndex(p => p.text.startsWith('d ='));
  assert.equal(d, a + 1, 'No extra working paragraphs between final answers');
  assert(ps[a].xml.includes('<w:keepNext/>'));
  assert(ps[d].xml.includes('<w:keepNext/>'));
  assert.equal(api.ensureMathsWorkingSpace(out, marks), out, 'Re-exporting does not add more space');
  assert(ps.slice(0,a).filter(p=>!p.text).length >= marks*2, 'Space remains proportional to marks');
  return out;
}
for (const marks of [5,6]) {
  check(p('Q1.')+p('Find a and d. Show your working.')+blank.repeat(2)+answer('a')+answer('d')+p(`(Total for question = ${marks} marks)`), marks);
}
const multiple = p('Q1.')+p('(a) Find a.')+answer('a')+p('(b) Find d.')+answer('d')+p('(Total for question = 6 marks)');
assert.equal(api.ensureMathsWorkingSpace(multiple,6),multiple,'Separate subpart working spaces remain separate');
const visual = p('Q1.')+p('Find a and d.')+answer('a')+'<w:p><w:r><w:drawing/></w:r></w:p>'+answer('d')+p('(Total for question = 5 marks)');
assert.equal(api.keepMathsFinalAnswersTogether(visual),visual,'Never join across a diagram');
const inline = p('Q1.')+p('Find a and d.')+p('a = .................... and d = ....................')+p('(Total for question = 6 marks)');
assert(api.ensureMathsWorkingSpace(inline,6).includes('a = .................... and d = ....................'));
(async()=>{
  if(process.argv[2]) {
    const zip=await JSZip.loadAsync(fs.readFileSync(process.argv[2]));
    const xml=await zip.file('word/document.xml').async('text');
    const paragraphs=api.rawParagraphs(xml);
    const start=paragraphs.find(p=>p.text==='Q24.').start;
    const end=paragraphs.find(p=>p.text==='Q25.').start;
    let raw=api.normalizeMathsAnswerLines(api.normalizeMathsPagination(xml.slice(start,end)));
    assert(raw.includes('2880'),'Reported arithmetic-series question found');
    const fixed=api.improveMathsQuestionLayout(api.keepMathsFinalAnswersTogether(api.ensureMathsWorkingSpace(raw,5)),5,true);
    const ps=api.rawParagraphs(fixed),a=ps.findIndex(p=>p.text.startsWith('a =')),d=ps.findIndex(p=>p.text.startsWith('d ='));
    assert.equal(d,a+1,'Reported source keeps a and d adjacent');
    assert.equal(api.ensureMathsWorkingSpace(fixed,5),fixed);
    if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify({before:raw,after:fixed}));
  }
  console.log('PASS: grouped final answers, proportional 5/6-mark space, repeated exports, subparts, inline answers and diagram boundaries.');
})().catch(error=>{console.error(error);process.exit(1)});
