export type ChemistrySubtopic = {
  code: string;
  title: string;
  specRange: string;
};

export type ChemistrySection = {
  number: number;
  title: string;
  subtopics: ChemistrySubtopic[];
};

export const chemistrySections: ChemistrySection[] = [
  {
    number: 1,
    title: "Principles of chemistry",
    subtopics: [
      { code: "a", title: "States of matter", specRange: "1.1–1.7C" },
      { code: "b", title: "Elements, compounds and mixtures", specRange: "1.8–1.13" },
      { code: "c", title: "Atomic structure", specRange: "1.14–1.17" },
      { code: "d", title: "The Periodic Table", specRange: "1.18–1.24" },
      { code: "e", title: "Chemical formulae, equations and calculations", specRange: "1.25–1.36C" },
      { code: "f", title: "Ionic bonding", specRange: "1.37–1.43" },
      { code: "g", title: "Covalent bonding", specRange: "1.44–1.51" },
      { code: "h", title: "Metallic bonding", specRange: "1.52C–1.54C" },
      { code: "i", title: "Electrolysis", specRange: "1.55C–1.60C" },
    ],
  },
  {
    number: 2,
    title: "Inorganic chemistry",
    subtopics: [
      { code: "a", title: "Group 1 (alkali metals) – lithium, sodium and potassium", specRange: "2.1–2.4C" },
      { code: "b", title: "Group 7 (halogens) – chlorine, bromine and iodine", specRange: "2.5–2.8C" },
      { code: "c", title: "Gases in the atmosphere", specRange: "2.9–2.14" },
      { code: "d", title: "Reactivity series", specRange: "2.15–2.21" },
      { code: "e", title: "Extraction and uses of metals", specRange: "2.22C–2.27C" },
      { code: "f", title: "Acids, alkalis and titrations", specRange: "2.28–2.33C" },
      { code: "g", title: "Acids, bases and salt preparations", specRange: "2.34–2.43C" },
      { code: "h", title: "Chemical tests", specRange: "2.44–2.50" },
    ],
  },
  {
    number: 3,
    title: "Physical chemistry",
    subtopics: [
      { code: "a", title: "Energetics", specRange: "3.1–3.8" },
      { code: "b", title: "Rates of reaction", specRange: "3.9–3.16" },
      { code: "c", title: "Reversible reactions and equilibria", specRange: "3.17–3.22C" },
    ],
  },
  {
    number: 4,
    title: "Organic chemistry",
    subtopics: [
      { code: "a", title: "Introduction", specRange: "4.1–4.6" },
      { code: "b", title: "Crude oil", specRange: "4.7–4.18" },
      { code: "c", title: "Alkanes", specRange: "4.19–4.22" },
      { code: "d", title: "Alkenes", specRange: "4.23–4.28" },
      { code: "e", title: "Alcohols", specRange: "4.29C–4.33C" },
      { code: "f", title: "Carboxylic acids", specRange: "4.34C–4.37C" },
      { code: "g", title: "Esters", specRange: "4.38C–4.40C" },
      { code: "h", title: "Synthetic polymers", specRange: "4.41C–4.44C" },
    ],
  },
];

export const chemistrySubtopicKeys = chemistrySections.flatMap(section =>
  section.subtopics.map(subtopic => `${section.number}${subtopic.code}`)
);
