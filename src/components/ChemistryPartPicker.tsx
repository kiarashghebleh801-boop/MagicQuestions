"use client";

import {
  chemistryPartOptions,
  selectChemistryQuestionParts,
  type ChemistryQuestionSelection,
} from "@/lib/chemistryParts";

export default function ChemistryPartPicker({
  question,
  onChange,
}: {
  question: ChemistryQuestionSelection;
  onChange: (question: ChemistryQuestionSelection) => void;
}) {
  const options = chemistryPartOptions(question);
  if (options.length < 2) return null;

  const selected = new Set(
    question.selectedParts?.length
      ? question.selectedParts
      : options.map(option => option.part),
  );

  function toggle(part: string) {
    const next = new Set(selected);
    if (next.has(part)) {
      if (next.size === 1) return;
      next.delete(part);
    } else {
      next.add(part);
    }

    const ordered = options
      .map(option => option.part)
      .filter(option => next.has(option));
    const updated = selectChemistryQuestionParts(question, ordered);
    if (updated) onChange(updated);
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: "11px 12px",
        border: "1px solid rgba(201,162,39,.22)",
        borderRadius: 10,
        background: "rgba(201,162,39,.045)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "baseline",
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <b style={{ fontSize: 13 }}>Include lettered parts</b>
        <span className="qMeta">(i), (ii), etc. stay with their parent part</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {options.map(option => {
          const active = selected.has(option.part);
          return (
            <button
              key={option.part}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.part)}
              style={{
                minWidth: 58,
                padding: "7px 10px",
                borderRadius: 8,
                cursor: active && selected.size === 1 ? "not-allowed" : "pointer",
                border: active
                  ? "1px solid rgba(228,198,95,.72)"
                  : "1px solid rgba(127,127,127,.28)",
                background: active
                  ? "rgba(201,162,39,.18)"
                  : "rgba(127,127,127,.06)",
                color: active ? "#f0d77a" : "#9b978b",
                fontWeight: 800,
              }}
              title={
                active && selected.size === 1
                  ? "A question must keep at least one lettered part"
                  : `${active ? "Remove" : "Include"} part (${option.part})`
              }
            >
              ({option.part}) · {option.marks}
            </button>
          );
        })}
      </div>
    </div>
  );
}
