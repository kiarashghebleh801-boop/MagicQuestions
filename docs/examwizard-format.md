# ExamWizard / Y10H formatting contract

This is the canonical MagicQuestions Word-export format. It applies to question content only.

## Page
- A4: 11907 × 16839 twips
- Margins: top 900, bottom 900, left 800, right 800 twips
- Header/footer distance: 720 twips
- Header: right-aligned `Y10H`
- Footer: right-aligned PAGE field
- Page numbering starts at 1

## Typography
- Body font: Arial only
- Base body size: 11 pt (22 half-points)
- Larger maths-image lines may visually correspond to 16 pt
- No native Word equations/OMML
- Simple keyboard-safe maths may be typed; stacked fractions, surds, typeset indices and complex algebra are images
- Body colour black; mark annotations grey A8AAAD and bold

## Question structure
1. Blank spacer paragraph containing a manual line break.
2. Literal `Qn.` paragraph, bold Arial 11.
3. Stem paragraphs: Arial 11, 120 twips before/after, 240 twips line spacing. Use manual line breaks inside a paragraph where appropriate.
4. Subparts `(a)`, `(b)`, `(i)` etc. are literal text, not Word numbering.
5. Continuation lines may use 320 twips left indent.
6. Complex maths/diagrams/tables/graphs/number lines/Venn diagrams are cropped from the source and inserted as centered inline images at the exact point in the typed flow.
7. Answer space is produced using repeated manual line breaks, not text boxes or giant paragraph spacing.
8. Answer line is right aligned and consists of literal period characters. Variable labels are italic runs; units/symbols remain regular.
9. Subpart mark is a separate right-aligned paragraph, bold Arial 11, colour A8AAAD.
10. Question total is right aligned, bold Arial 11, preserving source wording/capitalisation.
11. A trailing blank spacer closes the block.

## Hybrid reconstruction rule
Do NOT screenshot an entire question. Type all ordinary readable question wording as real Arial text. Screenshot/crop only the graphical or non-Arial-safe portions of the original source and insert them in-flow. Examples: stacked fractions, surds, complex typeset algebra, tables, diagrams, graph grids, Venn diagrams, number lines and special symbols such as script E when necessary.

## Alignment
- Q number: left
- Stems/subparts: left
- Graphical assets: centered
- Answer lines: right
- Marks: right
- Question total: right
- Header/footer: right
