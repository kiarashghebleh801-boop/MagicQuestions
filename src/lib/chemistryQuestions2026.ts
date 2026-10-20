import type { ChemistryQuestion } from "./chemistryQuestions";

type Part = [part: string, marks: number, ...specTags: string[]];
type Entry = [summary: string, ...parts: Part[]];

const papers: Record<ChemistryQuestion["paper"], Entry[]> = {
  "1C": [
    ["Ammonium carbonate: ion formulae, compounds, carbon dioxide tests, ammonia composition and acid-base behaviour.", ["a",1,"1f"], ["b",1,"1f"], ["c",2,"1b"], ["d",6,"2h","1e","2f"]],
    ["Group 1 metals: reactions with water and oxygen, mole calculations, activation energy and sodium oxide.", ["a",8,"2a","1e"], ["b",6,"2a","1e","3a","1f","2g"]],
    ["Hydrogen peroxide decomposition: catalysts, controlled variables, oxygen tests, graph plotting and tangent rates.", ["a",1,"3b"], ["b",2,"3b"], ["c",1,"2h"], ["d",2,"3b"], ["e",2,"3b"], ["f",4,"3b"]],
    ["Isoprene: hydrocarbons, empirical formula, alkenes, combustion, addition reactions and percentage yield.", ["a",2,"4a"], ["b",3,"1e","4a"], ["c",2,"4d"], ["d",3,"1e","4a"], ["e",4,"4d","1e"]],
    ["Crude oil: fractional distillation, cracking, fuels and pollution caused by sulfur impurities.", ["a",6,"4b"], ["b",5,"4b"]],
    ["Ethane: incomplete combustion, covalent bonding, gaseous particles, boiling points, bromination and isomers.", ["a",2,"4c"], ["b",2,"1g","4c"], ["c",2,"1a"], ["d",2,"4b"], ["e",3,"4c"], ["f",2,"4a"]],
    ["Copper sulfate: hydrated salts, reversible reactions, water tests and preparing salts with excess copper oxide.", ["a",7,"3c","1e"], ["b",6,"2g","2d","1e"]],
    ["Fluorine: electron configuration, period, covalent molecules, particle calculations and lithium fluoride bonding.", ["a",2,"1c","1d"], ["b",5,"1g","1e"], ["c",5,"1f"]],
    ["Metal displacement: equations, oxidising agents, reactivity and testing for sulfate ions.", ["a",5,"2d","1e"], ["b",2,"2d"], ["c",4,"2h"]],
  ],
  "1CR": [
    ["Atomic structure: subatomic particles, mass number, group, period, neutrality and ion charge.", ["a",1,"1c"], ["b",1,"1c"], ["c",2,"1c","1d"], ["d",1,"1c"], ["e",2,"1c","1d"]],
    ["Iron: rusting conditions, metal-acid reaction rates, hydrogen tests and iron oxide properties.", ["a",2,"2d"], ["b",2,"2d","2h","3b"], ["c",1,"2g"]],
    ["Paper chromatography: method, interpreting mixtures, changing solvents and calculating Rf.", ["a",6,"1b"], ["b",3,"1b"]],
    ["Physical changes: changes of state, evaporation and identifying purity by melting point.", ["a",3,"1a"], ["b",2,"1a"], ["c",3,"1b"]],
    ["Gases: properties and tests, noble gases, hydrogen volume percentage and redox using copper oxide.", ["a",4,"2c","2h"], ["b",8,"1d","1e","2d","2c"]],
    ["Ionic compounds: formulae, ammonium nitrate composition, magnesium chloride bonding and chloride tests.", ["a",6,"1e","1f"], ["b",6,"1f","2h"]],
    ["Zinc and hydrochloric acid: plotting gas volumes, anomalies, tangent rates and completion of a reaction.", ["a",7,"3b"], ["b",2,"3b"]],
    ["Organic structures: hydrocarbons, unsaturation, empirical formulae, isomers, cracking and addition polymerisation.", ["a",4,"4a","4d"], ["b",6,"4b"], ["c",3,"4h"]],
    ["Copper: isotope abundances, relative atomic mass, displacement, reducing agents and excess-reactant calculations.", ["a",2,"1c"], ["b",5,"1e","2d"], ["c",2,"1e","2d"]],
    ["Zinc sulfate: neutralisation, salt preparation, water of crystallisation and percentage yield.", ["a",2,"2g","2f"], ["b",6,"2g"], ["c",3,"1e"], ["d",4,"1e","2g"]],
    ["Carbon allotropes: elements, graphite lubrication, diamond and fullerene bonding, and molecular mass calculations.", ["a",1,"1b"], ["b",2,"1g"], ["c",5,"1g"], ["d",3,"1e"]],
  ],
  "2C": [
    ["Polymerisation: monomers and repeating units, poly(propene), dicarboxylic acids and polyester structure.", ["a",4,"4h"], ["b",1,"4h"], ["c",5,"4h","4f","1e"]],
    ["Titration: soluble salts, apparatus and method improvements, concordant results, alkalis and enthalpy calculations.", ["a",1,"2g"], ["b",2,"2f"], ["c",3,"2f"], ["d",3,"2f"], ["e",5,"2f","3a","1e"]],
    ["Electrolysis: covalent bonding and conductivity, molten lead bromide, electrode reactions and chlorine gas volume.", ["a",3,"1g","1i"], ["b",5,"1i"], ["c",7,"1i","1e"]],
    ["Potassium chloride: flame tests, chloride-ion tests and preparing a standard solution by calculation.", ["a",1,"2h"], ["b",3,"2h"], ["c",6,"1e"]],
    ["Esterification: ethanoic acid and ethanol, displayed formulae, equilibrium, catalysts and temperature effects.", ["a",2,"4g"], ["b",1,"3c"], ["c",4,"3b","3c"], ["d",5,"3b","3c"]],
    ["Potassium sulfate: formula, solubility practical, independent variables and crystallisation calculations.", ["a",1,"1e"], ["b",1,"1b"], ["c",1,"1b"], ["d",1,"2g"], ["e",5,"1b"]],
  ],
  "2CR": [
    ["Elements, compounds and mixtures: flame tests, fractional distillation, the Periodic Table and hydrogen chloride.", ["a",1,"2h"], ["b",1,"1b"], ["c",2,"1b","1d"], ["d",2,"1b"]],
    ["Aluminium: metallic conductivity and malleability, extraction by electrolysis and uses of the metal.", ["a",3,"1h"], ["b",3,"2e","1i"], ["c",1,"2e"]],
    ["Solubility: saturated solutions, comparing salt-solubility curves, crystallisation and a solubility practical.", ["a",1,"1b"], ["b",3,"1b"], ["c",4,"1b"]],
    ["Halogens: predicting astatine properties, isotopes and abundance, displacement and trends in reactivity.", ["a",2,"2b"], ["b",4,"1c"], ["c",6,"2b"]],
    ["Alcohols: ethanol fermentation, propanol calorimetry, molar enthalpy, bond energies and energy-level diagrams.", ["a",2,"4e"], ["b",6,"3a","4e","1e"], ["c",5,"3a"]],
    ["Sugars: empirical formula, molar concentration and molecular mass from combustion gas volumes.", ["a",4,"1e"], ["b",3,"1e"], ["c",3,"1e"]],
    ["Nitric acid: reversible reactions, dynamic equilibrium, effects of conditions on rate and yield, and accurate titration.", ["a",3,"3c"], ["b",6,"3b","3c"], ["c",5,"2f"]],
  ],
};

export const chemistryQuestions2026: ChemistryQuestion[] = [];
export const chemistryPartRules2026: Record<string, { part: string; marks: number; specTags: string[] }[]> = {};

for (const [paper, entries] of Object.entries(papers)) {
  entries.forEach(([summary, ...parts], index) => {
    const id = `chem-2026-mj-${paper}-${index + 1}`;
    const rules = parts.map(([part, marks, ...specTags]) => ({ part, marks, specTags }));
    chemistryPartRules2026[id] = rules;
    chemistryQuestions2026.push({
      id, year: 2026, session: "May/June", paper: paper as ChemistryQuestion["paper"],
      questionNumber: index + 1, summary,
      marks: rules.reduce((sum, part) => sum + part.marks, 0),
      specTags: Array.from(new Set(rules.flatMap(part => part.specTags))),
      sourceFile: `June_2026_Chemistry_Paper_${paper}_ExamWizard_Style.docx`,
    });
  });
}
