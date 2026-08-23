from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path

import fitz
from classify_topics import classify_text, difficulty_from_marks

QUESTION_START_RE = re.compile(r"^\s*(\d{1,2})(?:\s+[\t ]+(.+))?\s*$", re.S)
TOTAL_RE = re.compile(r"Total for Question\s+(\d+)\s+is\s+(\d+)\s+marks", re.I)
PAPER_RE = re.compile(r"4MA1/(\dH[R]?)", re.I)
YEAR_RE = re.compile(r"\b(20\d{2})\b")


@dataclass
class Question:
    id: str
    question_number: int
    marks: int
    start_page: int
    end_page: int
    crop_files: list[str]
    source_file: str
    paper: str | None
    year: int | None
    session: str | None
    text: str
    topics: list[str]
    difficulty: str


def page_blocks(page: fitz.Page) -> list[dict]:
    return [{"x0": b[0], "y0": b[1], "x1": b[2], "y1": b[3], "text": b[4]} for b in page.get_text("blocks")]


def document_header(doc: fitz.Document) -> str:
    return "\n".join(doc[i].get_text("text") for i in range(min(2, len(doc))))


def find_paper(doc: fitz.Document) -> str | None:
    match = PAPER_RE.search(document_header(doc))
    return match.group(1).upper() if match else None


def find_year(doc: fitz.Document, filename: str) -> int | None:
    match = YEAR_RE.search(filename) or YEAR_RE.search(document_header(doc))
    return int(match.group(1)) if match else None


def find_session(doc: fitz.Document, filename: str) -> str | None:
    text = (filename + "\n" + document_header(doc)).lower()
    for session in ("January", "June", "November"):
        if session.lower() in text:
            return session
    return None


def detect_questions(doc: fitz.Document) -> list[tuple[int, int, int, float, int, float]]:
    starts: dict[int, tuple[int, float]] = {}
    totals: dict[int, tuple[int, float, int]] = {}
    for page_index, page in enumerate(doc):
        for block in page_blocks(page):
            text = block["text"].strip()
            total = TOTAL_RE.search(text)
            if total:
                totals[int(total.group(1))] = (page_index, block["y1"], int(total.group(2)))
            start = QUESTION_START_RE.match(text)
            if not start:
                continue
            number = int(start.group(1))
            if block["x0"] >= 100 or not 1 <= number <= 40:
                continue
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


def extract_question_text(doc: fitz.Document, item: tuple[int, int, int, float, int, float]) -> str:
    _, _, start_page, start_y, end_page, end_y = item
    parts: list[str] = []
    for page_index in range(start_page, end_page + 1):
        for block in page_blocks(doc[page_index]):
            if page_index == start_page and block["y1"] < start_y - 2:
                continue
            if page_index == end_page and block["y0"] > end_y + 4:
                continue
            text = block["text"].strip()
            if not text or text in {"Turn over", "PMT", ""}:
                continue
            if re.fullmatch(r"\*P\d+A\d+\*", text):
                continue
            parts.append(text)
    return re.sub(r"[ \t]+", " ", "\n".join(parts)).strip()


def render_question(doc: fitz.Document, item: tuple[int, int, int, float, int, float], output_dir: Path, stem: str, dpi: int = 150) -> list[str]:
    number, _, start_page, start_y, end_page, end_y = item
    files: list[str] = []
    for page_index in range(start_page, end_page + 1):
        page = doc[page_index]
        top = start_y - 8 if page_index == start_page else 36
        bottom = end_y + 8 if page_index == end_page else page.rect.height - 36
        clip = fitz.Rect(28, max(28, top), page.rect.width - 28, min(page.rect.height - 28, bottom))
        pixmap = page.get_pixmap(matrix=fitz.Matrix(dpi / 72, dpi / 72), clip=clip, alpha=False)
        suffix = "" if start_page == end_page else f"-p{page_index - start_page + 1}"
        filename = f"{stem}-q{number:02d}{suffix}.png"
        pixmap.save(output_dir / filename)
        files.append(filename)
    return files


def import_pdf(pdf_path: Path, output_dir: Path, render_images: bool = True) -> list[Question]:
    doc = fitz.open(pdf_path)
    paper = find_paper(doc)
    year = find_year(doc, pdf_path.name)
    session = find_session(doc, pdf_path.name)
    detected = detect_questions(doc)
    stem = re.sub(r"[^A-Za-z0-9_-]+", "-", pdf_path.stem).strip("-")
    crop_dir = output_dir / "crops" / stem
    if render_images:
        crop_dir.mkdir(parents=True, exist_ok=True)

    questions: list[Question] = []
    for item in detected:
        number, marks, start_page, _, end_page, _ = item
        text = extract_question_text(doc, item)
        topics = classify_text(text)
        crops = render_question(doc, item, crop_dir, stem) if render_images else []
        qid = f"{year or 'unknown'}-{paper or 'paper'}-{number}"
        questions.append(Question(qid, number, marks, start_page + 1, end_page + 1, crops, pdf_path.name, paper, year, session, text, topics, difficulty_from_marks(marks, topics)))
    return questions


def main() -> None:
    parser = argparse.ArgumentParser(description="Import and classify Edexcel Maths past-paper questions")
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
    output.write_text(json.dumps([asdict(q) for q in questions], indent=2), encoding="utf-8")
    print(f"Imported {len(questions)} questions -> {output}")


if __name__ == "__main__":
    main()
