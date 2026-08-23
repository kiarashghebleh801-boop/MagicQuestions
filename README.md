# MagicQuestions

MagicQuestions builds custom Edexcel International GCSE Mathematics A practice papers from a tagged past-paper question bank.

## MVP

The current `build/mvp` branch includes:

- 73 question records from the three development papers (January 2021 1H, January 2022 1HR, June 2024 1H)
- topic and difficulty filtering
- balanced topic-based question selection
- searchable manual question bank
- generated-paper preview with remove/regenerate controls
- browser Print / Save PDF mode
- Python/PyMuPDF importer that detects questions, extracts text and renders exact question crops
- deterministic topic classifier with a fixed topic vocabulary
- Supabase/PostgreSQL schema for papers, questions and many-to-many topics

## Run the web app

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Import past papers

```bash
python -m pip install -r requirements.txt
python tools/import_papers.py "paper1.pdf" "paper2.pdf"
```

The importer writes metadata to `data/imported/questions.json` and question images to `data/imported/crops/`.

## Storage rule

Do not commit source past-paper PDFs or question crops to a public repository. Store them privately (for example in a private Supabase Storage bucket) and serve them through authorization/signed URLs. Check the relevant exam-board licensing terms before distributing source questions to users.

## Next production integrations

The code is structured so the in-repo development bank can be replaced by Supabase queries. Before public launch, configure Supabase, private object storage, authentication and licensing/access controls.
