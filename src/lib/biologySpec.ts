/** Main headings transcribed from the supplied lesson screenshots.
 * Lessons guide question tagging; revision, tests and general science skills are excluded.
 * Practical subject lessons remain with the topic whose biology they assess.
 */
export type BiologyTopic = { code: string; title: string; lessons: string[] };
export type BiologySection = { number: number; title: string; subtopics: BiologyTopic[] };
export const biologySections: BiologySection[] = [
  {
    "number": 1,
    "title": "Life processes and living organisms",
    "subtopics": [
      {
        "code": "A",
        "title": "Life processes",
        "lessons": [
          "Characteristics of living organisms",
          "Cell structure",
          "Enzymes",
          "Temperature and enzyme activity",
          "pH and enzyme activity",
          "Aerobic respiration",
          "Anaerobic respiration",
          "Respiration practical",
          "Movement of molecules",
          "Diffusion practical",
          "Factors affecting diffusion",
          "Osmosis practical",
          "Levels of organisation",
          "Cell differentiation",
          "Stem cells"
        ]
      },
      {
        "code": "B",
        "title": "The Variety of Living Organisms",
        "lessons": [
          "Eukaryotes",
          "Prokaryotes",
          "Pathogens"
        ]
      }
    ]
  },
  {
    "number": 2,
    "title": "Animal Physiology",
    "subtopics": [
      {
        "code": "A",
        "title": "Breathing and Gas Exchange",
        "lessons": [
          "The gas exchange system",
          "Ventilation",
          "Smoking",
          "Investigating breathing practical"
        ]
      },
      {
        "code": "B",
        "title": "Food and Digestion",
        "lessons": [
          "Biological molecules",
          "Food tests practical",
          "Balanced diet",
          "Energy requirements",
          "Energy in food practical",
          "Alimentary canal",
          "Digestion",
          "Absorption"
        ]
      },
      {
        "code": "C",
        "title": "Blood and Circulation",
        "lessons": [
          "Circulatory systems",
          "The heart",
          "Effect of exercise",
          "Blood vessels",
          "Coronary heart disease",
          "Blood",
          "Blood clotting",
          "Immune system",
          "Vaccination"
        ]
      },
      {
        "code": "D",
        "title": "Coordination",
        "lessons": [
          "Stimulus and response",
          "The central nervous system",
          "Eye structure",
          "Eye function",
          "Reflex arcs",
          "Synapses",
          "Hormonal control"
        ]
      },
      {
        "code": "E",
        "title": "Homeostasis and Excretion",
        "lessons": [
          "Homeostasis",
          "Excretion and the urinary system",
          "Nephron structure and function",
          "ADH and osmoregulation",
          "Control of body temperature"
        ]
      },
      {
        "code": "F",
        "title": "Reproduction in Humans",
        "lessons": [
          "Sexual reproduction",
          "Mitosis",
          "Meiosis",
          "Reproductive systems",
          "Development of the embryo",
          "Menstrual cycle",
          "Secondary sexual characteristics"
        ]
      }
    ]
  },
  {
    "number": 3,
    "title": "Plant Physiology",
    "subtopics": [
      {
        "code": "A",
        "title": "Plants and Food",
        "lessons": [
          "Photosynthesis",
          "Gas exchange in plants",
          "Photosynthesis practicals",
          "Measuring photosynthesis",
          "Minerals"
        ]
      },
      {
        "code": "B",
        "title": "Transport in Plants",
        "lessons": [
          "Plant transport tissues",
          "Transpiration",
          "Effect of conditions on transpiration practical"
        ]
      },
      {
        "code": "C",
        "title": "Chemical Coordination",
        "lessons": [
          "Plant tropisms",
          "Plant hormones"
        ]
      },
      {
        "code": "D",
        "title": "Reproduction in Plants",
        "lessons": [
          "Asexual reproduction",
          "Flower structure",
          "Fertilisation",
          "Germination practical"
        ]
      }
    ]
  },
  {
    "number": 4,
    "title": "Ecology and the Environment",
    "subtopics": [
      {
        "code": "A",
        "title": "Ecosystems",
        "lessons": [
          "Components of ecosystems",
          "Measuring populations practical",
          "Biodiversity",
          "Abiotic and biotic factors",
          "Food chains and food webs",
          "Energy transfer",
          "Ecological pyramids",
          "Carbon cycle",
          "Nitrogen cycle"
        ]
      },
      {
        "code": "B",
        "title": "Human Influences on the Environment",
        "lessons": [
          "Crop plant yields",
          "Pest control",
          "Fish farming",
          "Air pollution",
          "Greenhouse gases",
          "Water pollution",
          "Deforestation"
        ]
      }
    ]
  },
  {
    "number": 5,
    "title": "Variation and Selection",
    "subtopics": [
      {
        "code": "A",
        "title": "Chromosomes, Genes and DNA",
        "lessons": [
          "DNA",
          "The genetic code and protein synthesis",
          "Mutations",
          "Variation"
        ]
      },
      {
        "code": "B",
        "title": "Genes and Inheritance",
        "lessons": [
          "Inheritance",
          "Monohybrid inheritance",
          "Pedigree diagrams",
          "Sex determination",
          "Codominance",
          "Polygenic inheritance"
        ]
      },
      {
        "code": "C",
        "title": "Natural Selection, Evolution and Cloning",
        "lessons": [
          "Natural selection and evolution",
          "Selective breeding",
          "Cloning plants",
          "Cloning animals"
        ]
      }
    ]
  },
  {
    "number": 6,
    "title": "Use of Biological Resources",
    "subtopics": [
      {
        "code": "A",
        "title": "Using Microorganisms",
        "lessons": [
          "Yeast and breadmaking",
          "Anaerobic respiration practical",
          "Bacteria and yoghurt"
        ]
      },
      {
        "code": "B",
        "title": "Genetic Modification",
        "lessons": [
          "Genetic modification",
          "Genetically modified plants",
          "Transgenic animals"
        ]
      }
    ]
  }
];
export const biologyTopicTitle = new Map(biologySections.flatMap(section => section.subtopics.map(topic => [`${section.number}${topic.code}`, `${section.number}${topic.code} ${topic.title}`])));

/** Resolve explicit lesson codes, never guess a question's topic from an ambiguous keyword. */
export function biologyTopicForLesson(lesson: string): string | null {
  if (/science skills|revision|revise|test|review|extra:|end of|summer exam/i.test(lesson)) return null;
  const code = lesson.trim().match(/^(\d[A-Z])(?:\d+)?(?:\s|$)/i)?.[1].toUpperCase();
  return code && biologyTopicTitle.has(code) ? code : null;
}
