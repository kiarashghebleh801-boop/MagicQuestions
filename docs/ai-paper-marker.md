# Gemini paper marker — provisional beta

The private Phase 1 submissions now support real server-side Gemini requests.
The application reads GEMINI_API_KEY from the deployed server environment; it
never sends the key to the browser or prints it. Billing settings are unchanged.
Default model: gemini-3.5-flash-lite. GEMINI_MARKER_MODEL can select another supported
vision/JSON model. No paid fallback, provider upgrade or automatic retries.

## Flow

1. Save a verified generated or external paper in a subject's AI Paper Marker.
2. Open it in history and load saved AI progress.
3. An adult parent/teacher explicitly authorises sending documents to Google.
4. Read the official criteria. External mode uses the uploaded QP and MS.
   Generated mode resolves each question's canonical original QP and MS from
   the existing source maps, preserving mixed years and selected-part mapping.
5. Read completed answers. This separate AI call does NOT receive mark-scheme
   answers. It records text, question labels, original location, legibility and
   uncertainty; diagrams/graphs that need visual judgement require human review.
6. Compare every transcription with the original document links, correct reading
   errors, and explicitly confirm all responses before requesting marking.
7. Marking uses official criteria, with per-criterion evidence and mark caps.
   Any edited transcription, illegible answer, visual ambiguity or scheme issue
   withholds a question score for human review. No complete percentage is shown
   when a question requires review. No official IGCSE grade is assigned.
8. Reopen stored progress or download the JSON report. Deleting the submission
   also cascades its AI artifacts; the existing document deletion removes originals.

## Controls

- POST /api/marker authenticates with Supabase getUser and applies owner-only
  queries/RLS; it never accepts client-provided file URLs or marking criteria.
- Each AI step validates file signatures and parses PDF page counts on the server.
  Up to 12 MB raw source input per step, 60 pages per file, 120 source pages per
  step; generated mode supports up to eight distinct source files. Larger saved
  submissions remain private but need splitting before AI processing.
- Requests have a 45-second provider timeout and a 60-second function duration.
  Each durable stage can be retried independently; cached stages avoid new calls.
  This beta uses bounded synchronous steps, not a background queue. Keep the page
  open; a timed-out step can be retried after its 90-second lease window.
- An authenticated database claim function serialises quotas and verifies session
  ownership/status. Limits: 12 steps/hour and 36 steps/day per account, 300 steps/day
  globally. Gemini's own quotas may be lower. A separate metadata-only usage ledger
  survives submission deletion, so deletion cannot reset the limit.
- The claim function intentionally uses SECURITY DEFINER to insert usage records
  without allowing clients to reset quotas. Its empty search_path, auth.uid check,
  qualified object names and explicit grants restrict it to signed-in owners.
- AI artifacts are stored as text plus an HMAC signature using the server key and
  a marker-specific domain prefix. Clients can only update their own payload and
  signature columns. The API ignores artifacts without a valid server signature,
  bound to the owner/session/run/stage. Client-authored marks are never trusted.
  Rotating GEMINI_API_KEY invalidates old artifact signatures: keep the old key
  securely available before rotation if preserving verified history is needed;
  this beta otherwise requires reprocessing those sessions.
- Strict runtime validation rejects missing/duplicate labels, unsupported criterion
  references, noninteger/negative/excess marks, incomplete marking and awarded
  evidence absent from the verified answer. Totals/percentages are computed in code.
- Documents are untrusted content, never instructions. No tools or code execution
  are enabled. No prompts, originals, provider response bodies or keys are logged.
- The UI discloses Google's free-tier data usage. Names/IDs should be removed first.
  Adult account/operator confirmation does not constitute a Google compliance
  determination about the entire site; deployment follows the user's clarified
  adult parent/teacher use case. Operator must establish applicable provider terms.

## Deliberate beta limits

This is not calibrated to a certified examiner. Dependency/ECF/level rules are
provided in official criteria and model instructions but still need representative
human-marked calibration. Criterion transcription and source matching can be wrong;
check them in the UI before marking. Visual answers are conservatively referred to
a human instead of graded from guessed measurements. Original whole files/pages
are viewable; automatic handwriting crops and anchored PDF annotation are not yet
implemented. Annotated PDF exports, automatic Tracker allocation, weak-topic
practice and a durable background worker remain future work. The original
marker_criteria/marker_results tables stay locked to client writes; provisional
beta artifacts do not populate official results or Tracker records.

## Verification

Build/type checks; existing export regression checks; JSON/mark-integrity tests;
provider success/quota/auth/timeout/truncation tests with mocked HTTP; signed
artifact tampering and cross-owner checks; database transaction tests for ownership,
quota persistence, concurrent-step lease and anonymous/direct-insert denial.
No real key is retrieved into the development workspace. Production key metadata
is present. A representative signed-in upload/AI round trip and human-marked
calibration still need live user testing; do not treat mocked tests as model-accuracy
validation.

## Answer-reading diagnostics update

Production records showed criterion extraction succeeded while answer reading failed.
The previous generic error discarded the upstream status, so the historical cause
cannot be established from the retained logs. The app now logs only the HTTP code,
an allowlisted Google error status and a static reason category, never raw messages.
The interface distinguishes request rejection, capacity errors and quota failures.
Typed answer PDFs with native text on every page and no drawing/image/annotation
operators are parsed directly; scans and visual PDFs still use vision. The uploaded
three-page test PDF was checked with this text path, preserving its deliberate errors.
Use MARKER_TEST_TYPED_PDF to run that optional fixture check with a local PDF.
