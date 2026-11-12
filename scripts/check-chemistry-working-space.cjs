const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const {ensureChemistryCalculationSpace:ensure}=require('../src/lib/chemistryWorkingSpace.ts');
const p=t=>`<w:p><w:r><w:t>${t}</w:t></w:r></w:p>`, rows=x=>(x.match(/w:line="440"/g)||[]).length;
for(let marks=1;marks<=6;marks++){
 const xml=p('Q1.')+p('(a) (i) Calculate the mass.')+p(`(${marks})`)+p('mass = ........................ g')+p('(ii) Explain the colour change.')+p('(2)')+p('.'.repeat(150))+p('(Total for question = 8 marks)');
 const out=ensure(xml);assert.equal(rows(out),marks*2);assert.equal(ensure(out),out);assert(out.indexOf('w:line="440"')<out.indexOf('mass ='));assert(!out.slice(out.indexOf('(ii)')).includes('w:line="440"'));
 const show=p('Q1.')+p('(a) Show that the energy change is about 500 J.')+p(`(${marks})`)+p('(b) Explain the result.')+p('(2)');assert.equal(rows(ensure(show)),marks*2);
}
assert.equal(rows(ensure(p('Q1.')+p('(a) Explain why this is exothermic.')+p('(3)')+p('.'.repeat(100)))),0);
assert.equal(rows(ensure(p('Q1.')+p('(a) Complete the equation.')+p('(2)')+p('Na... + HCl... → NaCl...'))),0);
assert.equal(rows(ensure(p('Q1.')+p('(a) Draw a diagram to show the apparatus.')+p('(3)'))),0);
const two=p('Q1.')+p('(a) Calculate the mass.')+p('(2)')+p('mass = ................ g')+p('(b) Calculate the concentration.')+p('(4)')+p('concentration = ................ mol/dm3');assert.equal(rows(ensure(two)),12);
assert.equal(rows(ensure(p('Q1.')+p('(a) Show that this gas is oxygen.')+p('(2)'))),0);
assert.equal(rows(ensure(p('Q1.')+p('(a) State the temperature on the thermometer.')+p('(1)')+p('temperature = ................ °C'))),0);
console.log('PASS: 1–6 mark calculations, show-that tasks, per-subpart marks, repeated exports, explanation/equation/diagram exclusions.');
