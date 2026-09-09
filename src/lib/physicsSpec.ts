export type PhysicsSubtopic = { code: string; title: string };
export type PhysicsSection = { number: string; title: string; subtopics: PhysicsSubtopic[] };

// Pearson Edexcel International GCSE Physics (4PH1), with every "Units" subtopic intentionally omitted.
export const physicsSections: PhysicsSection[] = [
  { number: "1", title: "Forces and motion", subtopics: [
    { code: "b", title: "Movement and position" },
    { code: "c", title: "Forces, movement, shape and momentum" },
  ]},
  { number: "2", title: "Electricity", subtopics: [
    { code: "b", title: "Mains electricity" },
    { code: "c", title: "Energy and voltage in circuits" },
    { code: "d", title: "Electric charge" },
  ]},
  { number: "3", title: "Waves", subtopics: [
    { code: "b", title: "Properties of waves" },
    { code: "c", title: "The electromagnetic spectrum" },
    { code: "d", title: "Light and sound" },
  ]},
  { number: "4", title: "Energy resources and energy transfers", subtopics: [
    { code: "b", title: "Energy transfers" },
    { code: "c", title: "Work and power" },
    { code: "d", title: "Energy resources and electricity generation" },
  ]},
  { number: "5", title: "Solids, liquids and gases", subtopics: [
    { code: "b", title: "Density and pressure" },
    { code: "c", title: "Change of state" },
    { code: "d", title: "Ideal gas molecules" },
  ]},
  { number: "6", title: "Magnetism and electromagnetism", subtopics: [
    { code: "b", title: "Magnetism" },
    { code: "c", title: "Electromagnetism" },
    { code: "d", title: "Electromagnetic induction" },
  ]},
  { number: "7", title: "Radioactivity and particles", subtopics: [
    { code: "b", title: "Radioactivity" },
    { code: "c", title: "Fission and fusion" },
  ]},
  { number: "8", title: "Astrophysics", subtopics: [
    { code: "b", title: "Motion in the universe" },
    { code: "c", title: "Stellar evolution" },
    { code: "d", title: "Cosmology" },
  ]},
];

export const physicsTopicTitle = new Map(
  physicsSections.flatMap(section => section.subtopics.map(sub => [`${section.number}${sub.code}`, sub.title] as const))
);
