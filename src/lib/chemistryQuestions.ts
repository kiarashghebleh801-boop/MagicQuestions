export type ChemistryQuestion = {
  id: string;
  specTags: string[];
  summary: string;
  marks: number;
  year: number;
  session: string;
  paper: "1C" | "2C";
  questionNumber: number;
  sourceFile: string;
};

export const chemistryQuestions: ChemistryQuestion[] = [
  { id:"chem-2025-1C-1", specTags:["1c","1d"], summary:"Atomic structure: subatomic particles, mass number, group, period, electronic configuration and element identification.", marks:8, year:2025, session:"May/June", paper:"1C", questionNumber:1, sourceFile:"May_June_2025_Chemistry_Paper_1C_ExamWizard_Style.docx" },
  { id:"chem-2025-1C-2", specTags:["2a","2f","2h"], summary:"Lithium reacting with water, alkaline solution and pH, hydroxide ions, and the lithium flame test.", marks:8, year:2025, session:"May/June", paper:"1C", questionNumber:2, sourceFile:"May_June_2025_Chemistry_Paper_1C_ExamWizard_Style.docx" },
  { id:"chem-2025-1C-3", specTags:["1b"], summary:"Paper chromatography: pencil start line, solubility, interpreting spots and calculating an Rf value.", marks:11, year:2025, session:"May/June", paper:"1C", questionNumber:3, sourceFile:"May_June_2025_Chemistry_Paper_1C_ExamWizard_Style.docx" },
  { id:"chem-2025-1C-4", specTags:["1e","1f"], summary:"Calcium phosphate: ionic charges, relative formula mass, percentage composition and balancing a reaction equation.", marks:7, year:2025, session:"May/June", paper:"1C", questionNumber:4, sourceFile:"May_June_2025_Chemistry_Paper_1C_ExamWizard_Style.docx" },
  { id:"chem-2025-1C-5", specTags:["4a","4b","4c"], summary:"Butane and alkanes: saturated hydrocarbons, combustion, carbon monoxide, isomers and boiling-point trends.", marks:14, year:2025, session:"May/June", paper:"1C", questionNumber:5, sourceFile:"May_June_2025_Chemistry_Paper_1C_ExamWizard_Style.docx" },
  { id:"chem-2025-1C-6", specTags:["2d","2h","1e"], summary:"Iron rusting and reactivity, galvanising, Fe3+ chemical test, redox, reacting masses and percentage yield.", marks:13, year:2025, session:"May/June", paper:"1C", questionNumber:6, sourceFile:"May_June_2025_Chemistry_Paper_1C_ExamWizard_Style.docx" },
  { id:"chem-2025-1C-7", specTags:["2f","3a"], summary:"Neutralisation experiment: equation and state symbols, improving accuracy, plotting results, anomalies and maximum temperature change.", marks:12, year:2025, session:"May/June", paper:"1C", questionNumber:7, sourceFile:"May_June_2025_Chemistry_Paper_1C_ExamWizard_Style.docx" },
  { id:"chem-2025-1C-8", specTags:["1g"], summary:"Giant covalent structures: explain the melting point of diamond and the softness and electrical conductivity of graphite.", marks:9, year:2025, session:"May/June", paper:"1C", questionNumber:8, sourceFile:"May_June_2025_Chemistry_Paper_1C_ExamWizard_Style.docx" },
  { id:"chem-2025-1C-9", specTags:["1g","1e","4a","4c","4d","4h"], summary:"Organic compounds: covalent bonding, chloroethene and polymers, empirical formula, and reactions of ethane and ethene with bromine.", marks:17, year:2025, session:"May/June", paper:"1C", questionNumber:9, sourceFile:"May_June_2025_Chemistry_Paper_1C_ExamWizard_Style.docx" },
  { id:"chem-2025-1C-10", specTags:["3a","4e"], summary:"Fuel calorimetry using ethanol: control variables, heat energy change and molar enthalpy change.", marks:11, year:2025, session:"May/June", paper:"1C", questionNumber:10, sourceFile:"May_June_2025_Chemistry_Paper_1C_ExamWizard_Style.docx" },

  { id:"chem-2025-2C-1", specTags:["1b","4b"], summary:"Classifying elements, compounds and mixtures, diatomic molecules, and fractional distillation and uses of crude-oil fractions.", marks:6, year:2025, session:"May/June", paper:"2C", questionNumber:1, sourceFile:"May_June_2025_Chemistry_Paper_2C_ExamWizard_Style.docx.docx" },
  { id:"chem-2025-2C-2", specTags:["1e","2d","3a","3b"], summary:"Magnesium and hydrochloric acid: exothermic reaction, equation, rate graph, collision theory and reaction profile.", marks:13, year:2025, session:"May/June", paper:"2C", questionNumber:2, sourceFile:"May_June_2025_Chemistry_Paper_2C_ExamWizard_Style.docx.docx" },
  { id:"chem-2025-2C-3", specTags:["1c","1f","1i","2g"], summary:"Magnesium isotopes and relative atomic mass, solubility, ionic structure and conductivity, and electrolysis of magnesium chloride.", marks:16, year:2025, session:"May/June", paper:"2C", questionNumber:3, sourceFile:"May_June_2025_Chemistry_Paper_2C_ExamWizard_Style.docx.docx" },
  { id:"chem-2025-2C-4", specTags:["4e","4f","4g"], summary:"Ethanol oxidation, reactions of ethanoic acid and preparation and identification of the ester ethyl ethanoate.", marks:12, year:2025, session:"May/June", paper:"2C", questionNumber:4, sourceFile:"May_June_2025_Chemistry_Paper_2C_ExamWizard_Style.docx.docx" },
  { id:"chem-2025-2C-5", specTags:["1e","2f","2g"], summary:"Acid-alkali titration: apparatus, burette readings, concordant titres, concentration calculation and preparation of pure dry crystals.", marks:13, year:2025, session:"May/June", paper:"2C", questionNumber:5, sourceFile:"May_June_2025_Chemistry_Paper_2C_ExamWizard_Style.docx.docx" },
  { id:"chem-2025-2C-6", specTags:["1e","2h","3c"], summary:"Hydrogen and iodine equilibrium: gas test, reversible reaction symbol, effects of temperature and pressure, yield and gas-volume calculation.", marks:10, year:2025, session:"May/June", paper:"2C", questionNumber:6, sourceFile:"May_June_2025_Chemistry_Paper_2C_ExamWizard_Style.docx.docx" },
];
