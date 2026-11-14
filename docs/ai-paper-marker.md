# AI Paper Marker implementation status

Phase 1 foundation is implemented. Automated marking is intentionally NOT released.
No AI service receives student documents, and no marks or grades are produced.

## Working

- AI Paper Marker navigation within all four subjects, using existing styling.
- Current generated papers and a private cloud record of new successful Word downloads.
- Immutable per-session question snapshots: generated numbering, original year/session/paper/question number, selected parts, marks, specification tags and per-question mark-scheme source references. Mixed-source papers never share a guessed scheme.
- External QP/answers/MS preparation; PDF/PNG/JPEG signature checks, PDF page count, image decode and dimension checks. Maximum 25 MB/file, 30 files, 60 pages/group and 100 MB/session in the upload UI. Storage independently limits MIME types and file size. Page count/completeness has not yet been independently validated server-side.
- Local preview links, page-file reordering/removal, exact typed answers and explicit verification.
- Private submissions, per-subject history, original-document viewing with two-minute signed URLs, reopen and deletion. Failed uploads remain visible as drafts for cleanup/retry.
- Owner-only RLS and storage path policies. Anonymous roles have no table grants. Authenticated students cannot write AI criteria or results.
- An authenticated API release gate returns 503; it does not simulate AI output.

## Database and API architecture

`marker_papers`: user-owned generated paper snapshots.
`marker_sessions`: subject, mode, status, immutable source snapshot and verified typed responses.
`marker_documents`: ordered private object metadata, linked to session and owner.
`marker_criteria`: future server-extracted official criteria with source references.
`marker_results`: future criterion-linked decisions and review flags.
Private `marker-documents` bucket stores originals under user/session IDs.

Future processing must use separate extraction, transcription/verification and marking jobs.
Use a durable authenticated queue with retry/lease/idempotency controls, server-side file validation,
strict JSON schemas, criterion IDs, maximum/dependency enforcement and a corrections audit trail.
Only a trusted worker may write criteria/results. Never put an AI key in a public environment variable.
The current API deliberately has no provider calls or pretend processing statuses.

## Still required

1. Choose and configure a vision-capable AI provider with a server-only API key.
2. Implement extraction, crop regions and uncertain handwriting verification/corrections.
3. Resolve and extract exact official criteria (including image/table regions), validating selected subparts for every question. A filename match is not a completed criterion match.
4. Implement the asynchronous grading worker and validated mark-level outputs; handle missing schemes, illegibility and disagreement as review rather than zero.
5. Test against supplied human-marked scripts: method marks, ECF, levels, alternate wording, changed MC selections, graphs and uncertainty.
6. Only after validation, release results, reliable PDF annotation (or side comments), Tracker mark allocation and weak-topic practice.
7. Add paper deletion/retention controls for the generated-paper catalogue and server-side quotas before high-volume release.

Old papers downloaded before this change cannot be reconstructed automatically; use the current generator paper or external mode.
Reopening saved sessions currently shows originals/typed responses, not AI feedback.
Existing export and generation rules are preserved. No official grade-boundary claims are made.

## Verification

- Production build and existing Chemistry/Physics/Maths export checks.
- Marker unit checks for missing/incorrect file types and empty/oversize files; mixed-source snapshots and selected parts.
- Hosted database transaction verifies owner access, denial to a different user and no authenticated INSERT privilege on results; transaction rolls back all test data.
- Supabase advisors show no new marker-table RLS warnings. Existing unrelated account-function/password warnings were not changed.
- Signed-in end-to-end upload/reopen/delete, real PDFs/images and provider grading still require representative user acceptance testing.

## Changed files

- src/components/AIPaperMarker.tsx
- src/components/SubjectWorkspace.tsx
- src/lib/paperMarker.ts
- src/app/api/marker/route.ts
- src/app/chemistry/page.tsx
- src/app/physics/page.tsx
- src/app/biology/page.tsx
- src/app/mathematics/page.tsx
- src/app/globals.css
- supabase/ai-paper-marker.sql
- scripts/check-paper-marker.cjs
- docs/ai-paper-marker.md
