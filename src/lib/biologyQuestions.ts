export type BiologyQuestion = {
  id: string; specTags: string[]; summary: string; marks: number;
  year: number; session: string; paper: "1B" | "1BR" | "2B" | "2BR";
  questionNumber: number; sourceFile: string;
};
// Verified against the uploaded June 2026 formatted papers and matching mark schemes.
export const biologyQuestions: BiologyQuestion[] = [
  {
    "id": "bio-2026-mj-1B-1",
    "specTags": [
      "1A",
      "1B"
    ],
    "summary": "Bacterial structures, magnification and comparison with animal cells, plant cells and viruses.",
    "marks": 11,
    "year": 2026,
    "session": "May/June",
    "paper": "1B",
    "questionNumber": 1,
    "sourceFile": "May_June_2026_Biology_Paper_1B_ExamWizard_Style (2).docx"
  },
  {
    "id": "bio-2026-mj-1B-2",
    "specTags": [
      "2B"
    ],
    "summary": "Recommended dietary allowances, nutrient requirements and pregnancy.",
    "marks": 9,
    "year": 2026,
    "session": "May/June",
    "paper": "1B",
    "questionNumber": 2,
    "sourceFile": "May_June_2026_Biology_Paper_1B_ExamWizard_Style (2).docx"
  },
  {
    "id": "bio-2026-mj-1B-3",
    "specTags": [
      "3A"
    ],
    "summary": "Pondweed photosynthesis: light colour, oxygen production, graph plotting and light absorption.",
    "marks": 11,
    "year": 2026,
    "session": "May/June",
    "paper": "1B",
    "questionNumber": 3,
    "sourceFile": "May_June_2026_Biology_Paper_1B_ExamWizard_Style (2).docx"
  },
  {
    "id": "bio-2026-mj-1B-4",
    "specTags": [
      "1A"
    ],
    "summary": "Diffusion in agar cubes, surface area to volume ratio and factors affecting diffusion.",
    "marks": 12,
    "year": 2026,
    "session": "May/June",
    "paper": "1B",
    "questionNumber": 4,
    "sourceFile": "May_June_2026_Biology_Paper_1B_ExamWizard_Style (2).docx"
  },
  {
    "id": "bio-2026-mj-1B-5",
    "specTags": [
      "2A"
    ],
    "summary": "Alveoli, smoking, COPD and changes to bronchi and gas exchange.",
    "marks": 10,
    "year": 2026,
    "session": "May/June",
    "paper": "1B",
    "questionNumber": 5,
    "sourceFile": "May_June_2026_Biology_Paper_1B_ExamWizard_Style (2).docx"
  },
  {
    "id": "bio-2026-mj-1B-6",
    "specTags": [
      "2F"
    ],
    "summary": "Human reproductive structures, meiosis, testosterone and the menstrual cycle.",
    "marks": 10,
    "year": 2026,
    "session": "May/June",
    "paper": "1B",
    "questionNumber": 6,
    "sourceFile": "May_June_2026_Biology_Paper_1B_ExamWizard_Style (2).docx"
  },
  {
    "id": "bio-2026-mj-1B-7",
    "specTags": [
      "2B"
    ],
    "summary": "Small intestine, villi, microvilli, absorption and the lacteal.",
    "marks": 9,
    "year": 2026,
    "session": "May/June",
    "paper": "1B",
    "questionNumber": 7,
    "sourceFile": "May_June_2026_Biology_Paper_1B_ExamWizard_Style (2).docx"
  },
  {
    "id": "bio-2026-mj-1B-8",
    "specTags": [
      "3D"
    ],
    "summary": "Seed germination and the roles of water, oxygen and temperature.",
    "marks": 6,
    "year": 2026,
    "session": "May/June",
    "paper": "1B",
    "questionNumber": 8,
    "sourceFile": "May_June_2026_Biology_Paper_1B_ExamWizard_Style (2).docx"
  },
  {
    "id": "bio-2026-mj-1B-9",
    "specTags": [
      "5C"
    ],
    "summary": "Selective breeding of sheep and interpreting changes in fleece mass.",
    "marks": 8,
    "year": 2026,
    "session": "May/June",
    "paper": "1B",
    "questionNumber": 9,
    "sourceFile": "May_June_2026_Biology_Paper_1B_ExamWizard_Style (2).docx"
  },
  {
    "id": "bio-2026-mj-1B-10",
    "specTags": [
      "4A",
      "4B"
    ],
    "summary": "Carbon cycle, increased atmospheric carbon dioxide and fertiliser pollution.",
    "marks": 10,
    "year": 2026,
    "session": "May/June",
    "paper": "1B",
    "questionNumber": 10,
    "sourceFile": "May_June_2026_Biology_Paper_1B_ExamWizard_Style (2).docx"
  },
  {
    "id": "bio-2026-mj-1B-11",
    "specTags": [
      "5A",
      "5B"
    ],
    "summary": "Genes and alleles, dominant and recessive inheritance, genetic crosses and test crosses.",
    "marks": 8,
    "year": 2026,
    "session": "May/June",
    "paper": "1B",
    "questionNumber": 11,
    "sourceFile": "May_June_2026_Biology_Paper_1B_ExamWizard_Style (2).docx"
  },
  {
    "id": "bio-2026-mj-1B-12",
    "specTags": [
      "6A"
    ],
    "summary": "Investigating the effect of salt on yeast fermentation and bread dough expansion.",
    "marks": 6,
    "year": 2026,
    "session": "May/June",
    "paper": "1B",
    "questionNumber": 12,
    "sourceFile": "May_June_2026_Biology_Paper_1B_ExamWizard_Style (2).docx"
  },
  {
    "id": "bio-2026-mj-1BR-1",
    "specTags": [
      "1A",
      "1B",
      "2C"
    ],
    "summary": "Living characteristics, malaria pathogens, magnification and white blood cell defences.",
    "marks": 7,
    "year": 2026,
    "session": "May/June",
    "paper": "1BR",
    "questionNumber": 1,
    "sourceFile": "May_June_2026_Biology_Paper_1BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-1BR-2",
    "specTags": [
      "2F"
    ],
    "summary": "Male reproductive structures, meiosis, sperm counts, fertility and embryo formation.",
    "marks": 10,
    "year": 2026,
    "session": "May/June",
    "paper": "1BR",
    "questionNumber": 2,
    "sourceFile": "May_June_2026_Biology_Paper_1BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-1BR-3",
    "specTags": [
      "1A",
      "2B"
    ],
    "summary": "Protein digestion, proteases, food tests and the effect of temperature on enzymes.",
    "marks": 10,
    "year": 2026,
    "session": "May/June",
    "paper": "1BR",
    "questionNumber": 3,
    "sourceFile": "May_June_2026_Biology_Paper_1BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-1BR-4",
    "specTags": [
      "4A",
      "4B"
    ],
    "summary": "Carbon cycle and greenhouse gases: cattle farming, climate impacts and solar energy.",
    "marks": 9,
    "year": 2026,
    "session": "May/June",
    "paper": "1BR",
    "questionNumber": 4,
    "sourceFile": "May_June_2026_Biology_Paper_1BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-1BR-5",
    "specTags": [
      "1A",
      "3A"
    ],
    "summary": "Palisade cells, photosynthesis adaptations and investigating carbon dioxide and temperature.",
    "marks": 13,
    "year": 2026,
    "session": "May/June",
    "paper": "1BR",
    "questionNumber": 5,
    "sourceFile": "May_June_2026_Biology_Paper_1BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-1BR-6",
    "specTags": [
      "3D",
      "4B",
      "5C",
      "6B"
    ],
    "summary": "Flowers, selective breeding of broccoli and genetically modified pest-resistant crops.",
    "marks": 12,
    "year": 2026,
    "session": "May/June",
    "paper": "1BR",
    "questionNumber": 6,
    "sourceFile": "May_June_2026_Biology_Paper_1BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-1BR-7",
    "specTags": [
      "2B"
    ],
    "summary": "Villus surface area, nutrient absorption, coeliac disease and growth graphs.",
    "marks": 16,
    "year": 2026,
    "session": "May/June",
    "paper": "1BR",
    "questionNumber": 7,
    "sourceFile": "May_June_2026_Biology_Paper_1BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-1BR-8",
    "specTags": [
      "4A",
      "5A",
      "5B",
      "5C"
    ],
    "summary": "Snail inheritance, population sampling, natural selection and continuous variation.",
    "marks": 15,
    "year": 2026,
    "session": "May/June",
    "paper": "1BR",
    "questionNumber": 8,
    "sourceFile": "May_June_2026_Biology_Paper_1BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-1BR-9",
    "specTags": [
      "2D"
    ],
    "summary": "Reflex arcs, synapses, pupil responses and the effects of atropine.",
    "marks": 12,
    "year": 2026,
    "session": "May/June",
    "paper": "1BR",
    "questionNumber": 9,
    "sourceFile": "May_June_2026_Biology_Paper_1BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-1BR-10",
    "specTags": [
      "2A"
    ],
    "summary": "Designing an investigation into temperature and gill movements in mayfly nymphs.",
    "marks": 6,
    "year": 2026,
    "session": "May/June",
    "paper": "1BR",
    "questionNumber": 10,
    "sourceFile": "May_June_2026_Biology_Paper_1BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-2B-1",
    "specTags": [
      "1A",
      "2C",
      "5A",
      "5B",
      "5C",
      "6B"
    ],
    "summary": "Gene editing, DNA base pairing, translation, sickle cell inheritance, natural selection and stem cells.",
    "marks": 17,
    "year": 2026,
    "session": "May/June",
    "paper": "2B",
    "questionNumber": 1,
    "sourceFile": "May_June_2026_Biology_Paper_2B_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-2B-2",
    "specTags": [
      "4A",
      "4B"
    ],
    "summary": "Deforestation, mineral leaching, ecological communities and biodiversity sampling.",
    "marks": 7,
    "year": 2026,
    "session": "May/June",
    "paper": "2B",
    "questionNumber": 2,
    "sourceFile": "May_June_2026_Biology_Paper_2B_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-2B-3",
    "specTags": [
      "3B"
    ],
    "summary": "Investigating light intensity and water loss from a plant shoot using mass measurements.",
    "marks": 11,
    "year": 2026,
    "session": "May/June",
    "paper": "2B",
    "questionNumber": 3,
    "sourceFile": "May_June_2026_Biology_Paper_2B_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-2B-4",
    "specTags": [
      "1A",
      "1B",
      "2E"
    ],
    "summary": "Eukaryotes and excretion, kidney function, ADH and the mechanism of dialysis.",
    "marks": 12,
    "year": 2026,
    "session": "May/June",
    "paper": "2B",
    "questionNumber": 4,
    "sourceFile": "May_June_2026_Biology_Paper_2B_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-2B-5",
    "specTags": [
      "2D"
    ],
    "summary": "Reflex arc neurones and comparing sight and touch using a ruler-drop investigation.",
    "marks": 10,
    "year": 2026,
    "session": "May/June",
    "paper": "2B",
    "questionNumber": 5,
    "sourceFile": "May_June_2026_Biology_Paper_2B_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-2B-6",
    "specTags": [
      "1A",
      "3A",
      "4A",
      "4B"
    ],
    "summary": "Integrated aquaculture: food chains, nitrogen cycling, plant nutrition and environmental advantages.",
    "marks": 13,
    "year": 2026,
    "session": "May/June",
    "paper": "2B",
    "questionNumber": 6,
    "sourceFile": "May_June_2026_Biology_Paper_2B_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-2BR-1",
    "specTags": [
      "1A",
      "3A",
      "3B",
      "4B"
    ],
    "summary": "Hydroponics and aeroponics: mineral nutrition, enzymes, oxygen supply, water use and vertical farming.",
    "marks": 18,
    "year": 2026,
    "session": "May/June",
    "paper": "2BR",
    "questionNumber": 1,
    "sourceFile": "May_June_2026_Biology_Paper_2BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-2BR-2",
    "specTags": [
      "2B"
    ],
    "summary": "Bread nutrients and fibre, dietary comparisons and food energy calorimetry.",
    "marks": 14,
    "year": 2026,
    "session": "May/June",
    "paper": "2BR",
    "questionNumber": 2,
    "sourceFile": "May_June_2026_Biology_Paper_2BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-2BR-3",
    "specTags": [
      "1A",
      "3A"
    ],
    "summary": "Stomatal structures, opening and closing, and gas exchange at different light intensities.",
    "marks": 10,
    "year": 2026,
    "session": "May/June",
    "paper": "2BR",
    "questionNumber": 3,
    "sourceFile": "May_June_2026_Biology_Paper_2BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-2BR-4",
    "specTags": [
      "3D"
    ],
    "summary": "Conditions for seed germination, seedling growth and asexual reproduction in plants.",
    "marks": 9,
    "year": 2026,
    "session": "May/June",
    "paper": "2BR",
    "questionNumber": 4,
    "sourceFile": "May_June_2026_Biology_Paper_2BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-2BR-5",
    "specTags": [
      "4B"
    ],
    "summary": "Traditional fishing and fish farming: production data, yield methods and importance.",
    "marks": 10,
    "year": 2026,
    "session": "May/June",
    "paper": "2BR",
    "questionNumber": 5,
    "sourceFile": "May_June_2026_Biology_Paper_2BR_ExamWizard_Style.docx"
  },
  {
    "id": "bio-2026-mj-2BR-6",
    "specTags": [
      "4A",
      "4B"
    ],
    "summary": "Nitrogen cycle and the effects of deforestation on gases, water cycling and soil.",
    "marks": 9,
    "year": 2026,
    "session": "May/June",
    "paper": "2BR",
    "questionNumber": 6,
    "sourceFile": "May_June_2026_Biology_Paper_2BR_ExamWizard_Style.docx"
  }
];
