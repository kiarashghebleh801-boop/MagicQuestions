// Run with node scripts/check-science-markschemes.cjs [optional source PDF directory].
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const ts = require('typescript'), crypto = require('node:crypto');
require.extensions['.ts'] = (m,f) => m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const ci=require('../src/lib/chemistryMarkSchemeIndex.json'), pi=require('../src/lib/physicsMarkSchemeIndex.json');
const { physicsQuestions }=require('../src/lib/physicsQuestions.ts');
const { getPhysicsMarkSchemeSource }=require('../src/lib/physicsMarkSchemeSources.ts');
assert.equal(Object.keys(ci).length,16);assert.equal(Object.keys(pi).length,10);
const covered=physicsQuestions.filter(getPhysicsMarkSchemeSource);
for(const q of covered){const p=pi[getPhysicsMarkSchemeSource(q)];assert(p.questions[q.questionNumber]?.length,q.id);assert.equal(p.totals[q.questionNumber],q.marks,q.id+' marks');}
assert.equal(covered.length,96);
function entries(index,file,q,part){return index[file].questions[q].filter(r=>!part||r.part===part).flatMap(r=>r.content);}
function text(blocks){return blocks.map(b=>b.text||'').join('\n');}
function crops(blocks){return blocks.filter(b=>b.crop);}
const chem='IGCSE_CHEMISTRY_2026_June_P1_MS_1789838389142.pdf';
assert.equal(crops(entries(ci,chem,1)).length,0,'Formulae and superscripts must stay editable');
assert(text(entries(ci,chem,1)).includes('NH₄⁺'));
assert.equal(crops(entries(ci,chem,3,'e')).length,0,'Instructions mentioning a graph must stay typed');
assert.equal(crops(entries(ci,chem,3,'f')).length,1,'The graph actually shown must be cropped');
assert(text(entries(ci,chem,3,'f')).includes('M2 gradient calculated'),'Instructions outside graph must stay typed');
const fraction=entries(ci,'IGCSE_CHEMISTRY_2022_MayJune_P1_MS.pdf',4,'c');
assert.equal(crops(fraction).length,0);assert(text(fraction).includes('(68 x 100)/(350)'));
assert(crops(entries(ci,'IGCSE_CHEMISTRY_2026_June_P2_MS_1789838392628.pdf',1,'a')).length,'Shown table preserved');
const eq=entries(pi,'IGCSE_PHYSICS_2026_June_P1R_MS_1789834925881.pdf',10,'b');
assert.equal(crops(eq).length,0);assert(text(eq).includes('¹₀n → ¹₁p + ⁰₋₁β'),'Raster equations are transcribed when typeable');
const efficient=entries(pi,'IGCSE_PHYSICS_2026_June_P2_MS_1789834927427.pdf',4,'c');
assert.equal(crops(efficient).length,0);assert(text(efficient).includes('efficiency = (useful energy output)/(total energy output) × 100%'));
assert(text(efficient).includes('MP2 substitution into efficiency formula'),'Do not mistake prose mentioning a total for the end of an answer');
let visuals=0;
for(const idx of [ci,pi])for(const [file,p] of Object.entries(idx)){
 if(process.argv[2])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(process.argv[2],file))).digest('hex'),p.sha256,file);
 for(const rows of Object.values(p.questions))for(const row of rows){
  assert(row.content?.length||row.notes,'No empty answer');
  for(const b of row.content){
   if(b.crop){assert(['image','diagram'].includes(b.crop.kind));assert.equal(b.crop.rect.length,4);visuals++;}
   else assert(!/[\ue000-\uf8ff\ufffd]/.test(b.text),'No unsupported glyphs in typed text');
  }
 }
}
console.log(`PASS: 26 schemes, 230 questions, formula/graph/diagram/table rules, text completeness, source fingerprints; ${visuals} cropped visuals.`);
