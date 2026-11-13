const ELEMENTS = new Set(('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og').split(' '));

// Match complete formula tokens across formatting runs; change atom counts only.
export function normalizeChemistryFormulaSubscripts(xml: string): string {
  return xml.replace(/<w:p(?=[\s>])[\s\S]*?<\/w:p>/g, paragraph => {
    const text = Array.from(paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g), m => m[1]).join('');
    const digits = new Set<number>();
    for (const match of Array.from(text.matchAll(/(?<![A-Za-z])(?:[A-Z]|\([A-Z])[A-Za-z0-9()]*/g))) {
      const token = match[0];
      if (!/\d/.test(token) || /^(?:\+|-|−)/.test(text.slice(match.index! + token.length))) continue;
      const parts = Array.from(token.matchAll(/[A-Z][a-z]?|\d+|[()]/g));
      if (parts.map(p => p[0]).join('') !== token || parts.some(p => /^[A-Z]/.test(p[0]) && !ELEMENTS.has(p[0]))) continue;
      let depth = 0, valid = true;
      for (const p of parts) {
        if (p[0] === '(') depth++;
        if (p[0] === ')' && --depth < 0) valid = false;
      }
      if (!valid || depth !== 0) continue;
      for (const p of parts) if (/^\d/.test(p[0])) {
        for (let j = 0; j < p[0].length; j++) digits.add(match.index! + p.index! + j);
      }
    }
    if (!digits.size) return paragraph;
    let offset = 0;
    return paragraph.replace(/<w:r(?=[\s>])[\s\S]*?<\/w:r>/g, run => {
      const ts = Array.from(run.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g));
      const start = offset;
      offset += ts.reduce((n, t) => n + t[1].length, 0);
      if (ts.length !== 1 || /<w:(?:vertAlign|drawing|pict|tab|br|fldChar)\b/.test(run)) return run;
      const value = ts[0][1];
      if (!Array.from(value).some((_, i) => digits.has(start + i))) return run;
      const props = /<w:rPr\b[^>]*>[\s\S]*?<\/w:rPr>/.exec(run)?.[0] || '<w:rPr></w:rPr>';
      let result = '', from = 0;
      while (from < value.length) {
        const subscript = digits.has(start + from);
        let end = from + 1;
        while (end < value.length && digits.has(start + end) === subscript) end++;
        const pr = subscript ? props.replace('</w:rPr>', '<w:vertAlign w:val="subscript"/></w:rPr>') : props;
        result += '<w:r>' + pr + '<w:t xml:space="preserve">' + value.slice(from, end) + '</w:t></w:r>';
        from = end;
      }
      return result;
    });
  });
}
