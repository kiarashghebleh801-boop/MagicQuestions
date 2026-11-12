// Work space belongs to the marked calculation subpart, not its parent question.
const ROW_HEIGHT = 440; // 22 points, two rows per mark.
const textOf = (xml: string) => Array.from(xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g))
  .map(m => m[1]).join('').replace(/&amp;/g, '&').replace(/&#160;|&nbsp;/g, ' ').trim();
const paragraphsOf = (xml: string) => Array.from(xml.matchAll(/<w:p(?=[\s>])[\s\S]*?<\/w:p>/g))
  .map(m => ({ start: m.index!, end: m.index! + m[0].length, xml: m[0], text: textOf(m[0]) }));
const markOf = (text: string) => /^\((\d{1,2})\)$/.exec(text)?.[1];
const calculation = /\b(?:calculat\w*|work out)\b/i;
const showThat = /\bshow\b[^.!?]{0,100}\b(?:that|by calculation)\b/i;
const quantity = /\b(?:mass|volume|concentration|amount|moles?|percentage|yield|enthalpy|energy|temperature|mean|rate|relative (?:atomic|formula|molecular) mass|empirical formula|molecular formula|ΔH|Q|Rf)\b/i;

export function ensureChemistryCalculationSpace(xml: string): string {
  const ps = paragraphsOf(xml);
  const boundaries = ps.map((p, i) => /^Q\d+\.$|^\([a-z]+\)(?:\s|\(|$)|Total for question/i.test(p.text) ? i : -1).filter(i => i >= 0);
  if (boundaries[0] !== 0) boundaries.unshift(0);
  boundaries.push(ps.length);
  const insertions: Array<{ at: number; rows: number; answerField: boolean }> = [];
  const markEdits = new Map<number, { end: number; xml: string }>();
  for (let b = 0; b < boundaries.length - 1; b++) {
    const start = boundaries[b], end = boundaries[b + 1];
    if (/Total for question/i.test(ps[start]?.text || '')) continue;
    const section = ps.slice(start, end);
    const prompt = section.filter(p => !markOf(p.text) && !/^Q\d+\.$/.test(p.text)).map(p => p.text).join(' ');
    const isShowThat = showThat.test(prompt) && (/\d/.test(prompt) || quantity.test(prompt));
    const isCalculation = calculation.test(prompt) || isShowThat
      || (/\b(?:determine|find|deduce|what is)\b/i.test(prompt) && quantity.test(prompt));
    // A short final answer field must have a meaningful quantity label. Pure
    // dotted explanation lines and equation-completion blanks are not fields.
    const fields = section.filter(p => {
      const m = /^(.+?)\s*\.{8,90}\s*([^.]*)$/.exec(p.text);
      return m && !/\.{8,}/.test(m[1]) && m[2].length <= 30
        && isCalculation
        && !/\b(?:advantage|disadvantage|reason|name|colour|observation|test|result)\s*(?:=|:)?\s*$/i.test(m[1]);
    });
    const targets = fields.length ? fields : isShowThat ? [null] : [];
    let previousFieldEnd = ps[start]?.start || 0;
    for (const field of targets) {
      const insertion = field?.start ?? (ps[end]?.start ?? xml.length);
      const eligible = section.filter(p => p.start >= previousFieldEnd && markOf(p.text));
      const before = eligible.filter(p => p.start < insertion);
      const mark = before[before.length - 1] || eligible[0];
      const marks = Number(mark && markOf(mark.text));
      if (!marks || marks > 12) continue;
      let existing = 0;
      for (let i = end - 1; i >= start; i--) {
        const p = ps[i];
        if (p.start >= insertion) continue;
        if (markOf(p.text)) continue;
        const blank = !p.text || /^\.{10,}$/.test(p.text.replace(/\s/g, ''))
          || (!p.text && /w:leader="dot"/.test(p.xml));
        if (!blank || /<(?:w:(?:drawing|pict|object)|m:oMath)\b/i.test(p.xml)) break;
        const exact = /w:line="440"[^>]*w:lineRule="exact"/.test(p.xml);
        const dotted = /\.{10,}|w:leader="dot"/.test(p.xml);
        existing += ((p.xml.match(/<w:br\b/g) || []).length + 1) * (exact ? ROW_HEIGHT : dotted ? 493 : 253);
      }
      const rows = Math.max(0, Math.ceil((marks * 2 * ROW_HEIGHT - existing) / ROW_HEIGHT));
      if (rows) {
        insertions.push({ at: insertion, rows, answerField: Boolean(field) });
        if (mark && mark.start < insertion && !/<w:keepNext\b/.test(mark.xml)) {
          const updated = /<w:pPr\b/.test(mark.xml)
            ? mark.xml.replace(/<w:pPr\b([^>]*)>/, '<w:pPr$1><w:keepNext/>')
            : mark.xml.replace(/<w:p(?=[\s>])([^>]*)>/, '<w:p$1><w:pPr><w:keepNext/></w:pPr>');
          markEdits.set(mark.start, { end: mark.end, xml: updated });
        }
      }
      if (field) previousFieldEnd = field.end;
    }
  }
  // Independent, breakable rows let long calculations continue without forcing
  // a large unbreakable block or producing an otherwise empty page.
  const row = '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="440" w:lineRule="exact"/><w:keepLines/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>';
  const edits = insertions.map(item => ({ start: item.at, end: item.at,
    xml: row.repeat(item.rows - 1) + (item.answerField ? row.replace('<w:keepLines/>', '<w:keepLines/><w:keepNext/>') : row) }));
  for (const [start, edit] of Array.from(markEdits)) edits.push({ start, ...edit });
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    xml = xml.slice(0, edit.start) + edit.xml + xml.slice(edit.end);
  }
  return xml;
}
