from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path

import fitz

QUESTION_START_RE = re.compile(r"^\s*(\d{1,2})(?:\s+[\t ]+(.+))?\s*$", re.S)
TOTAL_RE = re.compile(r"Total for Question\s+(\d+)\s+is\s+(\d+)\s+marks", re.I)
PAPER_RE = re.compile(r"4MA1/(\dH[R]?)", re.I)


@dataclass
class Question:
    question_number: int
    marks: int
    start_page: int
    end_page: int
    crop_files: list[str]
    source_file: str
    paper: str | None


def page_blocks(page: fitz.Page) -> list[dict]:
    return [
        {"x0": b[0], "y0": b[1], "x1": b[2], "y1": b[3], "text": b[4]}
        for b in page.get_text("blocks")
    ]


def find_paper(doc: fitz.Document) -> str | None:
    first_pages = "\n".join(doc[i].get_text("text") for i in range(min(2, len(doc))))
    match = PAPER_RE.search(first_pages)
    return match.group(1).upper() if match else None


def detect_questions(doc: fitz.Document) -> list[tuple[int, int, int, float, int, float]]:
    starts: dict[int, tuple[int, float]] = {}
    totals: dict[int, tuple[int, float, int]] = {}

    for page_index, page in enumerate(doc):
        for block in page_blocks(page):
            text = block["text"].strip()

            total = TOTAL_RE.search(text)
            if total:
                totals[int(total.group(1))] = (
                    page_index,
                    block["y1"],
                    int(total.group(2)),
                )

            start = QUESTION_START_RE.match(text)
            if not start:
                continue

            number = int(start.group(1))
            if block["x0"] >= 100 or not 1 <= number <= 40:
                continue

            # Diagram-heavy Edexcel pages sometimes put the question number in its
            # own PDF text block. Only accept an isolated number near the page top,
            # preventing answer values and page numbers from becoming false starts.
            has_body = bool(start.group(2) and start.group(2).strip())
            if has_body or block["y0"] < 180:
                starts.setdefault(number, (page_index, block["y0"]))

    questions = []
    for number, (start_page, start_y) in sorted(starts.items()):
        if number not in totals:
            continue
        end_page, end_y, marks = totals[number]
        if end_page >= start_page:
            questions.append((number, marks, start_page, start_y, end_page, end_y))

    return questions


def render_question(
    doc: fitz.Document,
    item: tuple[int, int, int, float, int, float],
    output_dir: Path,
    stem: str,
    dpi: int = 150,
) -> list[str]:
    number, _, start_page, start_y, end_page, end_y = item
    files: list[str] = []

    for page_index in range(start_page, end_page + 1):
        page = doc[page_index]
        page_rect = page.rect
        top = start_y - 8 if page_index == start_page else 36
        bottom = end_y + 8 if page_index == end_page else page_rect.height - 36
        clip = fitz.Rect(
            28,
            max(28, top),
            page_rect.width - 28,
            min(page_rect.height - 28, bottom),
        )
        pixmap = page.get_pixmap(
            matrix=fitz.Matrix(dpi / 72, dpi / 72),
            clip=clip,
            alpha=False,
        )
        suffix = "" if start_page == end_page else f"-p{page_index - start_page + 1}"
        filename = f"{stem}-q{number:02d}{suffix}.png"
        pixmap.save(output_dir / filename)
        files.append(filename)

    return files


def import_pdf(pdf_path: Path, output_dir: Path, render_images: bool = True) -> list[Question]:
    doc = fitz.open(pdf_path)
    paper = find_paper(doc)
    detected = detect_questions(doc)
    stem = re.sub(r"[^A-Za-z0-9_-]+", "-", pdf_path.stem).strip("-")
    crop_dir = output_dir / "crops" / stem

    if render_images:
        crop_dir.mkdir(parents=True, exist_ok=True)

    questions: list[Question] = []
    for item in detected:
        number, marks, start_page, _, end_page, _ = item
        crops = render_question(doc, item, crop_dir, stem) if render_images else []
        questions.append(
            Question(
                question_number=number,
                marks=marks,
                start_page=start_page + 1,
                end_page=end_page + 1,
                crop_files=crops,
                source_file=pdf_path.name,
                paper=paper,
            )
        )

    return questions


def main() -> None:
    parser = argparse.ArgumentParser(description="Import Edexcel Maths past-paper questions")
    parser.add_argument("pdfs", nargs="+", type=Path)
    parser.add_argument("--out", type=Path, default=Path("data/imported"))
    parser.add_argument("--no-images", action="store_true")
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    questions: list[Question] = []
    for pdf in args.pdfs:
        imported = import_pdf(pdf, args.out, not args.no_images)
        print(f"{pdf.name}: {len(imported)} questions")
        questions.extend(imported)

    output = args.out / "questions.json"
    output.write_text(
        json.dumps([asdict(question) for question in questions], indent=2),
        encoding="utf-8",
    )
    print(f"Imported {len(questions)} questions -> {output}")


if __name__ == "__main__":
    main()
