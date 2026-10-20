"""Index Pearson Chemistry marking tables once; runtime downloads PDFs only for crops.

Usage: python scripts/index-chemistry-markschemes.py /path/to/source-pdfs
Requires PyMuPDF. Keep original filenames, matching chemistryMarkSchemeSources.ts.
The output stores editable text plus precise source regions for visual answers.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

import fitz


def columns(page, words):
    headers = {}
    for w in sorted(words, key=lambda w: w[1]):
        if w[4] in ('Answer', 'Notes', 'Marks') and w[1] < 200:
            headers.setdefault(w[4], w)
    if len(headers) != 3:
        return None
    borders = [d['rect'].x0 for d in page.get_drawings()
               if d['rect'].width < 1.5 and d['rect'].height > 8
               and d['rect'].y0 < headers['Answer'][3] and d['rect'].y1 > headers['Answer'][1]]
    # Some source PDFs use stroked lines instead of thin filled rectangles.
    for d in page.get_drawings():
        for item in d['items']:
            if item[0] == 'l':
                a, b = item[1:3]
                if abs(a.x-b.x) < 1 and min(a.y,b.y) < headers['Answer'][3] and max(a.y,b.y) > headers['Answer'][1]:
                    borders.append(a.x)
    starts = []
    for name in ('Answer', 'Notes', 'Marks'):
        candidates = [x for x in borders if x < headers[name][0] - 1]
        if not candidates:
            h = fitz.Rect(headers[name][:4])
            cells = [d['rect'] for d in page.get_drawings() if d['rect'].contains(h)
                     and d['rect'].height > 18 and d['rect'].width > h.width + 15]
            if not cells:
                raise ValueError(f'No {name} column on page {page.number + 1}')
            candidates = [min(cells, key=lambda r: r.width).x0]
        starts.append(max(candidates) + 0.8)
    return starts, max(w[3] for w in headers.values()) + 2


def text_in(words, rect):
    selected = [w for w in words if rect.x0 <= (w[0] + w[2]) / 2 < rect.x1
                and rect.y0 <= (w[1] + w[3]) / 2 < rect.y1]
    lines = []
    for w in sorted(selected, key=lambda w: (w[1], w[0])):
        line = next((line for line in lines if abs(line[0] - w[1]) < 4), None)
        if line is None:
            lines.append([w[1], [w]])
        else:
            line[1].append(w)
    # Preserve line breaks and horizontal order; do not invent chemical notation.
    return '\n'.join(' '.join(w[4] for w in sorted(line[1], key=lambda w: w[0]))
                     for line in sorted(lines)).strip().replace('\x00', '')


def visual_answer(page, rect, text):
    # Keep nested tables, graphs, bonds, arrows, electron dots and raster diagrams.
    # Outer table borders and Word's invisible filled text boxes are excluded.
    for drawing in page.get_drawings():
        r = drawing['rect']
        if not rect.intersects(r):
            continue
        internal = r.x0 > rect.x0 + 2 and r.x1 < rect.x1 - 2
        if internal and (drawing['type'] != 'f' or r.width < 2 or r.height < 2
                         or any(item[0] == 'c' for item in drawing['items'])):
            return True
    if any(rect.intersects(info['bbox']) for info in page.get_image_info()):
        return True
    if re.search(r'[\ue000-\uf8ff\ufffd]', text):
        return True
    if re.search(r'diagram|drawn|drawing|sketch|graph|plott|circl|displayed|dot.and.cross|repeating unit|structure shown|correct tick', text, re.I):
        return True
    # Sub/superscripts can be lost during plain text extraction; retain the source
    # formula as a small image instead of silently changing its chemistry.
    for block in page.get_text('dict', clip=rect)['blocks']:
        for line in block.get('lines', []):
            spans = line['spans']
            if any(s['size'] < 8.5 and re.search(r'\d|[+−-]', s['text']) for s in spans):
                return True
    return False


def index_pdf(path):
    doc = fitz.open(path)
    questions = {}
    current_q = None
    main_part = ''
    roman_part = ''
    active = False
    totals = {}
    previous_columns = None
    for page in doc:
        words = page.get_text('words')
        layout = columns(page, words)
        if not layout:
            if not active or previous_columns is None:
                continue
            layout = previous_columns, 45
        (answer_x, notes_x, marks_x), header_bottom = layout
        previous_columns = (answer_x, notes_x, marks_x)
        body_bottom = page.rect.height * .94
        labels = [w for w in words if w[0] < answer_x - 1 and w[1] > header_bottom
                  and w[1] < body_bottom and (re.fullmatch(r'\(?[a-hj-uw-z]\)?', w[4])
                  or (w[4].isdigit() and len(w[4]) < 3 and w[0] < answer_x - 40))]
        groups = []
        for word in sorted(labels, key=lambda w: (w[1], w[0])):
            group = next((g for g in groups if abs(g[0] - word[1]) < 4), None)
            if group:
                group[1].append(word)
            else:
                groups.append([word[1], [word]])
        events = []
        for top, group in groups:
            tokens = [w[4] for w in sorted(group, key=lambda w: w[0])]
            events.append((top - 1, 'label', tokens))
        # Total rows end the answer, including the final question on the last page.
        for w in words:
            if w[4].lower() == 'total' and w[0] > notes_x and w[1] > header_bottom:
                tail = text_in(words, fitz.Rect(w[0] - 1, w[1] - 2, page.rect.width, w[3] + 18))
                values = re.findall(r'\d+', tail)
                events.append((w[1] - 1, 'total', int(values[-1]) if values else None))
        events.sort(key=lambda e: e[0])
        filtered = []
        predicted = len(questions)
        for event in events:
            nums = [int(t) for t in event[2] if t.isdigit()] if event[1] == 'label' else []
            if nums and nums[0] not in (current_q, predicted, predicted + 1):
                continue
            if nums and nums[0] == predicted + 1:
                predicted += 1
            if nums and nums[0] == current_q and len(event[2]) == 1:
                continue
            filtered.append(event)
        events = filtered
        if active and (not events or events[0][0] > header_bottom + 8):
            events.insert(0, (header_bottom + 5, 'continue', []))
        for i, (top, kind, tokens) in enumerate(events):
            if kind == 'total':
                if current_q and tokens is not None:
                    totals[str(current_q)] = tokens
                active = False
                continue
            if kind == 'label':
                numbers = [int(t) for t in tokens if t.isdigit()]
                if numbers:
                    q = numbers[0]
                    if q == len(questions) + 1:
                        current_q = q
                        questions[str(q)] = []
                        main_part = roman_part = ''
                        active = True
                    elif q != current_q:
                        # Axis values in a wide graph can enter the label column.
                        continue
                for token in tokens:
                    part = token.strip('()').lower()
                    if token.isdigit():
                        continue
                    if len(part) == 1 and (part not in 'ivx' or part == chr(ord(main_part or '`') + 1)):
                        main_part, roman_part = part, ''
                    else:
                        roman_part = part
            if not active or current_q is None:
                continue
            bottom = events[i+1][0] if i+1 < len(events) else body_bottom
            if bottom <= top + 2:
                continue
            answer_rect = fitz.Rect(answer_x + 1, top, notes_x - 1, bottom)
            roman_words = [(*w[:4], w[4], *w[5:]) for w in words if w[0] < answer_x
                           and re.fullmatch(r'\([ivx]+\)|[ivx]+', w[4], re.I)]
            answer = text_in(words + [(answer_x+1, w[1], answer_x+2, w[3], w[4], *w[5:]) for w in roman_words], answer_rect)
            notes = text_in(words, fitz.Rect(notes_x, top, marks_x - 1, bottom))
            marks = text_in(words, fitz.Rect(marks_x, top, page.rect.width * .96, bottom))
            values = re.findall(r'\b\d+\b', marks)
            marks = ' '.join(values)
            visual = visual_answer(page, answer_rect, answer)
            row = {'part': main_part, 'roman': roman_part, 'answer': answer, 'notes': notes, 'marks': marks}
            if visual:
                content = [fitz.Rect(w[:4]) for w in words if answer_rect.contains(fitz.Point((w[0]+w[2])/2, (w[1]+w[3])/2))]
                content += [fitz.Rect(info['bbox']) & answer_rect for info in page.get_image_info() if answer_rect.intersects(info['bbox'])]
                content += [d['rect'] & answer_rect for d in page.get_drawings()
                            if d['rect'].x0 > answer_rect.x0 + 2 and d['rect'].x1 < answer_rect.x1 - 2
                            and d['rect'].intersects(answer_rect) and (d['type'] != 'f' or d['rect'].width < 2 or d['rect'].height < 2
                            or any(item[0] == 'c' for item in d['items']))]
                if content:
                    roman_here = [w for w in roman_words if top <= w[1] < bottom]
                    left = min([answer_rect.x0] + [w[0]-1 for w in roman_here])
                    crop = fitz.Rect(left, max(top, min(r.y0 for r in content)-2), answer_rect.x1,
                                     min(bottom, max(r.y1 for r in content)+2))
                    row['crop'] = {'page': page.number + 1, 'rect': [round(v, 3) for v in crop]}
            if answer or notes or marks or visual:
                questions[str(current_q)].append(row)
    if not questions:
        raise ValueError(f'No questions in {path}')
    for q, rows in questions.items():
        score = sum(int(n) for row in rows for n in row['marks'].split())
        if not rows:
            raise ValueError(f'{path.name} Q{q}: no extracted answers')
        known_source_typo = path.name == 'IGCSE_CHEMISTRY_2022_MayJune_P1_MS.pdf' and q == '5' and score == 12 and totals.get(q) == 11
        if score != totals.get(q) and not known_source_typo:
            raise ValueError(f'{path.name} Q{q}: parsed marks {score}, printed total {totals.get(q)}')
    return {'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'questions': questions, 'totals': totals}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_dir', type=Path)
    args = parser.parse_args()
    output = Path(__file__).resolve().parents[1] / 'src/lib/chemistryMarkSchemeIndex.json'
    result = {}
    for path in sorted(args.source_dir.glob('IGCSE_CHEMISTRY_*_MS*.pdf')):
        result[path.name] = index_pdf(path)
        questions = result[path.name]['questions']
        print(path.name, len(questions), 'questions;', sum('crop' in r for rows in questions.values() for r in rows), 'visual rows')
    output.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'Wrote {len(result)} indexed papers to {output}')


if __name__ == '__main__':
    main()
