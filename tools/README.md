# MagicQuestions importer

The importer converts Edexcel International GCSE Mathematics A question papers into question records and exact rendered question crops.

## Setup

```bash
python -m pip install -r requirements.txt
```

## Import papers

```bash
python tools/import_papers.py "paper1.pdf" "paper2.pdf"
```

Output is written to `data/imported/questions.json` and `data/imported/crops/`.

Use `--no-images` to test question detection without rendering PNG crops.

## Current test coverage

The detector has been tested against the development set supplied for MagicQuestions:

- January 2021 Paper 1H: 24/24 questions detected
- January 2022 regional Paper 1HR: 24/24 questions detected
- June 2024 Paper 1H: 25/25 questions detected

Total: 73/73 detected questions.

The next importer stage is topic classification and persistent database/storage integration.
