// bank.js
// Minimal-but-working sample bank to prove the generator + blueprint.
// Expand by adding more items/passages with the same schema.

export const STRANDS = {
  MATH: ["NO", "FR", "ALG", "GEOM", "MD"], // Numbers&Opr, Fractions/Ratios, Algebraic Thinking/EE, Geometry, Measurement&Data/Stats
  ELA_PASSAGE_TYPES: ["RL", "RI"], // Reading Literature / Reading Informational
  ELA_LANG: ["LANG"], // Language/Grammar
  ELA_WRITE: ["W"]   // Writing
};

// Item forms to help vary structure
export const FORMS = {
  SINGLE: "single",      // 1 correct choice
  MULTI: "multi",        // 2–3 correct choices
  NUMERIC: "numeric",    // number entry
  SHORT: "short"         // short justification (1–2 sentences)
};

// Difficulty bands
export const DIFF = { CORE: "core", ON: "on", STRETCH: "stretch" };

// --- Math items --------------------------------------------------------------
// Each item: {id, grade_min, grade_max, strand, form, diff, stem, choices?, answer, rubric?}
export const MATH_ITEMS = [
  // Numbers & Operations (NO)
  {
    id: "NO-3-001",
    grade_min: 3, grade_max: 3,
    strand: "NO", form: FORMS.SINGLE, diff: DIFF.CORE,
    stem: "What is 427 rounded to the nearest ten?",
    choices: ["420", "430", "400", "500"],
    answer: "430"
  },
  {
    id: "NO-4-002",
    grade_min: 4, grade_max: 4,
    strand: "NO", form: FORMS.NUMERIC, diff: DIFF.ON,
    stem: "Compute 3,406 − 1,879.",
    answer: "1527"
  },
  // Fractions/Ratios (FR)
  {
    id: "FR-4-003",
    grade_min: 4, grade_max: 4,
    strand: "FR", form: FORMS.SINGLE, diff: DIFF.CORE,
    stem: "Which fraction is equivalent to 1/2?",
    choices: ["2/6", "2/4", "3/8", "4/10"],
    answer: "2/4"
  },
  {
    id: "FR-5-004",
    grade_min: 5, grade_max: 5,
    strand: "FR", form: FORMS.NUMERIC, diff: DIFF.ON,
    stem: "Compute: 2/3 + 1/6 = ?",
    answer: "5/6"
  },
  {
    id: "FR-6-005",
    grade_min: 6, grade_max: 6,
    strand: "FR", form: FORMS.NUMERIC, diff: DIFF.ON,
    stem: "A car travels 156 miles in 3 hours. What is the unit rate (mph)?",
    answer: "52"
  },
  // Algebraic Thinking / Expressions & Equations (ALG)
  {
    id: "ALG-6-006",
    grade_min: 6, grade_max: 6,
    strand: "ALG", form: FORMS.NUMERIC, diff: DIFF.CORE,
    stem: "Solve: 3x + 9 = 24. What is x?",
    answer: "5"
  },
  {
    id: "ALG-7-007",
    grade_min: 7, grade_max: 7,
    strand: "ALG", form: FORMS.SINGLE, diff: DIFF.ON,
    stem: "Which expression is equivalent to 4(2x − 5) + 3x?",
    choices: ["8x − 20 + 3x", "8x − 5 + 3x", "8x − 20 + 3", "8 − 20x + 3x"],
    answer: "8x − 20 + 3x"
  },
  {
    id: "ALG-8-008",
    grade_min: 8, grade_max: 8,
    strand: "ALG", form: FORMS.SHORT, diff: DIFF.STRETCH,
    stem: "Solve for y in the system: y = 2x + 1 and y = −x + 7. Show your work briefly.",
    rubric: { max: 2, note: "1 pt correct solution (x=2, y=5); 1 pt brief reasoning." },
    answer: "x=2,y=5"
  },
  // Geometry (GEOM)
  {
    id: "GEOM-4-009",
    grade_min: 4, grade_max: 4,
    strand: "GEOM", form: FORMS.SINGLE, diff: DIFF.CORE,
    stem: "Which triangle has one 90° angle?",
    choices: ["Acute", "Obtuse", "Right", "Equilateral"],
    answer: "Right"
  },
  {
    id: "GEOM-6-010",
    grade_min: 6, grade_max: 6,
    strand: "GEOM", form: FORMS.NUMERIC, diff: DIFF.ON,
    stem: "Find the area of a right triangle with legs 6 cm and 9 cm.",
    answer: "27"
  },
  {
    id: "GEOM-8-011",
    grade_min: 8, grade_max: 8,
    strand: "GEOM", form: FORMS.NUMERIC, diff: DIFF.STRETCH,
    stem: "The legs of a right triangle are 5 and 12. What is the hypotenuse length?",
    answer: "13"
  },
  // Measurement & Data / Statistics (MD)
  {
    id: "MD-3-012",
    grade_min: 3, grade_max: 3,
    strand: "MD", form: FORMS.SINGLE, diff: DIFF.CORE,
    stem: "Which measure describes the amount of space inside a shape?",
    choices: ["Perimeter", "Area", "Angle", "Line segment"],
    answer: "Area"
  },
  {
    id: "MD-5-013",
    grade_min: 5, grade_max: 5,
    strand: "MD", form: FORMS.NUMERIC, diff: DIFF.ON,
    stem: "Volume of a 3×4×5 rectangular prism (cubic units)?",
    answer: "60"
  },
  {
    id: "MD-6-014",
    grade_min: 6, grade_max: 6,
    strand: "MD", form: FORMS.NUMERIC, diff: DIFF.ON,
    stem: "The data set has values 2, 4, 4, 7, 9. What is the median?",
    answer: "4"
  }
];

// --- ELA passages ------------------------------------------------------------
// Each passage: {id, grade_band:[min,max], type:'RL'|'RI', text, questions:[{id, stem, choices, answer, standard}]}
export const PASSAGES = [
  {
    id: "RL-4A",
    grade_band: [4,5],
    type: "RL",
    text:
`Lena gripped the rope as the ferry rocked. The river mist curled around the deck like breath on a cold morning. 
She watched the far bank—a new town, a new school—creep closer. 
When the captain blew the horn, Lena jumped but smiled; the sound felt like a starting bell.`,
    questions: [
      { id:"RL-4A-Q1", stem:"What is the main feeling Lena has about the move?", choices:["Angry","Excited but nervous","Bored","Confused"], answer:"Excited but nervous", standard:"RL4.2" },
      { id:"RL-4A-Q2", stem:"Which detail best supports your answer?", choices:[
        "She gripped the rope.", "The mist curled around the deck.", 
        "She watched the far bank creep closer.", "She jumped but smiled at the horn."
      ], answer:"She jumped but smiled at the horn.", standard:"RL4.1" },
      { id:"RL-4A-Q3", stem:"What does the horn symbolize in the passage?", choices:["Danger","Anger","A beginning","An ending"], answer:"A beginning", standard:"RL4.4" },
      { id:"RL-4A-Q4", stem:"Which sentence shows setting most clearly?", choices:[
        "Lena gripped the rope.", "The river mist curled around the deck.", 
        "She watched the far bank creep closer.", "The captain blew the horn."
      ], answer:"The river mist curled around the deck.", standard:"RL4.3" },
      { id:"RL-4A-Q5", stem:"What point of view is used?", choices:["First-person","Second-person","Third-person limited","Third-person omniscient"], answer:"Third-person limited", standard:"RL4.6" },
      { id:"RL-4A-Q6", stem:"Which word best describes Lena?", choices:["Timid","Hopeful","Shy","Careless"], answer:"Hopeful", standard:"RL4.3" }
    ]
  },
  {
    id: "RI-5B",
    grade_band: [5,6],
    type: "RI",
    text:
`Bees communicate using a “waggle dance.” 
By shaking their bodies at specific angles relative to the sun, they tell other bees the direction and distance to flowers. 
This system allows a hive to find food efficiently—even when blossoms are miles away.`,
    questions: [
      { id:"RI-5B-Q1", stem:"What is the main idea of the passage?", choices:[
        "Bees sting to protect themselves.", "Bees use dance to share food locations.", 
        "Sunlight helps bees fly faster.", "Flowers are always near the hive."
      ], answer:"Bees use dance to share food locations.", standard:"RI5.2" },
      { id:"RI-5B-Q2", stem:"What does 'relative to the sun' help bees communicate?", choices:[
        "Temperature", "Direction", "Speed", "Color"
      ], answer:"Direction", standard:"RI5.4" },
      { id:"RI-5B-Q3", stem:"Which evidence supports the main idea best?", choices:[
        "Bees communicate using a 'waggle dance.'", 
        "They shake their bodies at specific angles.",
        "The system lets the hive find food efficiently.",
        "Blossoms are miles away."
      ], answer:"The system lets the hive find food efficiently.", standard:"RI5.8" },
      { id:"RI-5B-Q4", stem:"Which text structure is used most?", choices:[
        "Sequence", "Compare/contrast", "Cause/effect", "Problem/solution"
      ], answer:"Cause/effect", standard:"RI5.5" },
      { id:"RI-5B-Q5", stem:"What is the best summary?", choices:[
        "Bees dance for fun.", 
        "A waggle dance uses angles to show where food is, helping the hive find flowers.",
        "Flowers are miles away from hives.", 
        "Angles are math."
      ], answer:"A waggle dance uses angles to show where food is, helping the hive find flowers.", standard:"RI5.2" },
      { id:"RI-5B-Q6", stem:"Which feature would best support this text?", choices:[
        "A timeline", "A map of bee migrations", "A diagram showing dance angles", "A poem about bees"
      ], answer:"A diagram showing dance angles", standard:"RI5.7" }
    ]
  }
];

// --- ELA Language (grammar) items -------------------------------------------
export const LANG_ITEMS = [
  {
    id:"LANG-5-001",
    grade_min:5, grade_max:6,
    strand:"LANG", form: FORMS.SINGLE, diff: DIFF.CORE,
    stem:"Choose the correctly punctuated sentence.",
    choices:[
      "I brought pencils, paper and, snacks.",
      "I brought pencils, paper, and snacks.",
      "I brought, pencils, paper and snacks.",
      "I brought pencils paper, and snacks."
    ],
    answer:"I brought pencils, paper, and snacks."
  },
  {
    id:"LANG-6-002",
    grade_min:6, grade_max:6,
    strand:"LANG", form: FORMS.SINGLE, diff: DIFF.ON,
    stem:"Select the sentence with a nonrestrictive clause correctly set off by commas.",
    choices:[
      "My brother who plays guitar won.",
      "My brother, who plays guitar won.",
      "My brother, who plays guitar, won.",
      "My brother who, plays guitar, won."
    ],
    answer:"My brother, who plays guitar, won."
  },
  {
    id:"LANG-7-003",
    grade_min:7, grade_max:7,
    strand:"LANG", form: FORMS.SINGLE, diff: DIFF.ON,
    stem:"Which sentence contains a misplaced modifier?",
    choices:[
      "Running down the hall, the bell startled Maya.",
      "Running down the hall, Maya heard the bell.",
      "While Maya ran, the bell rang.",
      "Maya, running down the hall, heard the bell."
    ],
    answer:"Running down the hall, the bell startled Maya."
  }
];

// --- Writing prompts + rubric ------------------------------------------------
export const WRITING_PROMPTS = [
  {
    id:"W-OP-5-6",
    grade_band:[5,6],
    type:"opinion",
    prompt:"Do you agree or disagree that schools should start later in the morning? Use one reason from your own experience and one from the passages."
  },
  {
    id:"W-INF-4-5",
    grade_band:[4,5],
    type:"informative",
    prompt:"Explain how a signal helps a group work together (for example, bees, teams, or traffic). Use details from a passage."
  },
  {
    id:"W-NAR-6-8",
    grade_band:[6,8],
    type:"narrative",
    prompt:"Write the next scene after the passage, from the main character’s point of view. Include thoughts, actions, and a clear ending."
  }
];

// Simple 0–4 rubric with 3 traits (ideas, organization, language)
export const WRITING_RUBRIC = {
  traits: ["Ideas/Evidence","Organization","Language/Conventions"],
  scale: [0,1,2,3,4],
  descriptors: {
    4: "Clear focus, relevant evidence, logical order; few errors.",
    3: "Mostly clear focus, some evidence; minor errors.",
    2: "Partially on topic; thin evidence; choppy order; noticeable errors.",
    1: "Minimal or off-topic; little evidence; disorganized; frequent errors.",
    0: "Blank or indecipherable."
  }
};

