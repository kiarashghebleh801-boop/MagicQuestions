// Run with node scripts/check-chemistry-markschemes.cjs [optional PDF directory].
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const { chemistryQuestions } = require('../src/lib/chemistryQuestions.ts');
const { chemistryPartOptions } = require('../src/lib/chemistryParts.ts');
const { getChemistryMarkSchemeSource } = require('../src/lib/chemistryMarkSchemeSources.ts');
const index = require('../src/lib/chemistryMarkSchemeIndex.json');
const covered = chemistryQuestions.filter(getChemistryMarkSchemeSource);
assert.equal(Object.keys(index).length, 16);
assert.equal(covered.length, 134);
for (const q of covered) {
  const source = index[getChemistryMarkSchemeSource(q)];
  const rows = source.questions[q.questionNumber];
  assert(rows?.length, q.id);
  assert.equal(source.totals[q.questionNumber], q.marks, q.id + ' total');
  for (const part of chemistryPartOptions(q)) assert(rows.some(row => row.part === part.part), `${q.id} (${part.part})`);
  for (const row of rows) {
    assert(row.content?.length || row.notes, q.id + ' empty answer');
    for (const block of row.content) {
      if (block.crop) {
        const { page, rect } = block.crop;
        assert(page >= 1 && rect.length === 4 && rect[2] > rect[0] && rect[3] > rect[1], q.id + ' invalid crop');
      } else assert(!/[\ue000-\uf8ff\ufffd]/.test(block.text), q.id + ' unreadable typed glyph');
    }
  }
}
if (process.argv[2]) for (const [filename, source] of Object.entries(index)) {
  const bytes = fs.readFileSync(path.join(process.argv[2], filename));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), source.sha256, filename);
}
console.log('PASS: 16 schemes, 134 questions, matching totals, selected-part coverage and valid visual regions.');
