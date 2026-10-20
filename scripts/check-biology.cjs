const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const mod = {exports:{}}; cache.set(file, mod.exports);
  new Function('require','module','exports', code)(name => name.startsWith('.') ? load(path.resolve(path.dirname(file),name+'.ts')) : require(name),mod,mod.exports);
  cache.set(file,mod.exports); return mod.exports;
}
const spec = load('src/lib/biologySpec.ts');
const parts = load('src/lib/biologyParts.ts');
const bank = load('src/lib/biologyQuestions.ts').biologyQuestions;
assert.equal(spec.biologyTopicTitle.size,19);
assert.equal(spec.biologyTopicForLesson('1A3 Enzymes'),'1A');
assert.equal(spec.biologyTopicForLesson('3D4 Germination Practical'),'3D');
for (const ignored of ['Science Skills 1','Revision and Test','3B4 Practical: Review','5A4 Cell Division - Revision','END OF Y11 CONTENT']) assert.equal(spec.biologyTopicForLesson(ignored),null);
const q = {id:'fixture',specTags:['1A','2B'],summary:'fixture',marks:5,year:2026,session:'May/June',paper:'1B',questionNumber:1,sourceFile:'fixture.docx'};
assert.equal(parts.specialiseBiologyQuestion(q,['1A']),null);
parts.partRules.fixture = [{part:'a',marks:2,specTags:['1A']},{part:'b',marks:3,specTags:['2B']}];
const selected = parts.specialiseBiologyQuestion(q,['1A']);
assert.deepEqual(selected.selectedParts,['a']); assert.equal(selected.marks,2);
assert.deepEqual(selected.availableParts,['a','b']);
assert.equal(parts.selectBiologyQuestionParts(selected,['b']).marks,3);
assert.equal(parts.selectBiologyQuestionParts(selected,[]),null);
for (const question of bank) {
  assert(question.specTags.length && question.specTags.every(tag=>spec.biologyTopicTitle.has(tag)));
  assert(question.sourceFile.endsWith('.docx'));
  const rules = parts.partRules[question.id];
  if (rules) assert.equal(rules.reduce((n,p)=>n+p.marks,0),question.marks);
}
console.log(`Biology: 19 topics, exclusion rules, strict part filtering, optional parts and ${bank.length} source records verified.`);
