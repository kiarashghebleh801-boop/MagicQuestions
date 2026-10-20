# Biology question bank

The Biology route mirrors Chemistry: generator, searchable bank, selected lettered
parts, reorder/remove/swap, Word export, mark scheme export, paper review/history,
and an account-scoped device-local tracker. Only the 19 main topic titles are
shown. `biologySpec.ts` retains the lesson names for classifying imports.

Question papers have not yet been uploaded to the site's formatted paper storage.
The bank deliberately starts empty, while the tracker works immediately. No
question records or available exports are inferred from mark scheme files alone.

When importing:

1. Upload the formatted DOCX to the existing `examwizard-papers` bucket. Preserve
   the established separate `Q1.` markers, figures, answer lines and mark totals.
2. Add verified question records to `biologyQuestions.ts`; `sourceFile` must match
   the exact uploaded filename. Source preview and Word export resolve this field.
3. Classify each lettered part using the lessons in `biologySpec.ts`. Store main
   tags such as `1A`, not lesson tags such as `1A3`. Use `biologyTopicForLesson`
   for explicit lesson codes; manually review the biology assessed. Cross-topic
   parts must carry every tag they assess.
4. Add main lettered parts and their verified marks to `biologyParts.ts`.
   Roman subparts stay with their parent. Part marks must sum to the question
   total. Unknown cross-topic questions are withheld unless all tags are selected.
5. Index the corresponding PDF in `biologyMarkSchemeIndex.json` using the shared
   `IndexedPaper` schema. The four verified 2026 PDF filenames are registered in
   `biologyMarkSchemeSources.ts`; export remains disabled until indexed.
6. Run `node scripts/check-biology.cjs`, `npx tsc --noEmit`, and `npm run build`.

Exclude general science skills, revision/test/review materials, and extras.
Keep subject practicals (osmosis, food tests, photosynthesis, etc.) in their topic.
