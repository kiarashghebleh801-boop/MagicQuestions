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
- No native Word equations/OMML
- Type every expression that Word/Arial can reproduce cleanly. This includes simple algebra such as `f(x) = 17 − 3x² + 12x`, ordinary indices/superscripts, coordinates, brackets, +, −, =, %, ° and normal variables.
- Only screenshot genuinely difficult visual maths: stacked fractions, nested fractions, surds or special typesetting that cannot be reproduced cleanly as normal Word text.
- Body colour black; mark annotations grey A8AAAD and bold

## Question numbering
- Never reproduce the original Pearson question number from the source paper.
- MagicQuestions supplies its own literal `Q1.`, `Q2.`, etc. in the generated order.

## Question structure
1. Blank spacer paragraph containing a manual line break.
2. Literal `Qn.` paragraph, bold Arial 11.
3. Stem paragraphs: Arial 11, 120 twips before/after, 240 twips line spacing. Use manual line breaks inside a paragraph where appropriate.
4. Subparts `(a)`, `(b)`, `(i)` etc. are literal text, not Word numbering.
5. Continuation lines may use 320 twips left indent.
6. Complex maths/diagrams/tables/graphs/number lines/Venn diagrams are cropped from the source and inserted as centered inline images at the exact point in the typed flow.
7. Answer space is produced using repeated manual line breaks, not text boxes or giant paragraph spacing. Working space must be generous and scale with the mark allocation: about 3 lines for 1 mark, 5 for 2 marks, 7 for 3 marks, 8 for 4 marks, 9 for 5 marks and 10 for 6+ marks.
8. Answer line is right aligned and consists of literal period characters. Variable labels are italic runs; units/symbols remain regular.
9. Subpart mark is a separate right-aligned paragraph, bold Arial 11, colour A8AAAD.
10. Question total is right aligned, bold Arial 11, preserving source wording/capitalisation.
11. A trailing blank spacer closes the block.

## Centered display content
- Short standalone mathematical displays that are typed, such as `f(x) = 17 − 3x² + 12x`, are centered.
- Standalone sequence rows such as `1   4   7   10` are centered and keep clear spacing between terms.
- Tables, diagrams, graphs and graphical maths snippets are centered.

## Hybrid reconstruction rule
Do NOT screenshot an entire question. Type all ordinary readable question wording as real Arial text. Screenshot/crop only the exact graphical or non-typable element from the original source and insert it in-flow. The crop must exclude the Pearson question number, paper border, page header/footer and unrelated whitespace.

Examples of image-only elements: stacked fractions, surds, complex typeset algebra that cannot be reproduced cleanly, tables, diagrams, graph grids, Venn diagrams, number lines and special symbols such as script E when necessary.

## Alignment
- Q number: left
- Stems/subparts: left
- Standalone sequence rows: center
- Standalone simple display maths: center
- Graphical assets: center
- Answer lines: right
- Marks: right
- Question total: right
- Header/footer: right
