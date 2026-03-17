// standards.js — NYS Next Generation standards helpers for grades 2–5

export const STANDARD_MAP = {
  // Grade 2 Math
  "2NBT.A.1": "Understand place value of hundreds, tens, and ones.",
  "2NBT.A.3": "Read, write, compare, and use place value to reason about numbers to 1,000.",
  "2NBT.B.5": "Fluently add and subtract within 100.",
  "2NBT.B.7": "Add and subtract within 1,000 using place value and properties of operations.",
  "2OA.A.1": "Solve one- and two-step word problems using addition and subtraction within 100.",
  "2OA.C.3": "Determine whether a group of objects is odd or even.",
  "2MD.A.1": "Measure lengths using standard units.",
  "2MD.B.5": "Use addition and subtraction to solve length word problems.",
  "2MD.C.7": "Tell and write time to the nearest five minutes.",
  "2MD.C.8": "Solve money word problems using dollar bills, quarters, dimes, nickels, and pennies.",
  "2G.A.1": "Recognize and draw shapes with given attributes.",
  "2G.A.3": "Partition circles and rectangles into equal shares and describe the shares as fractions.
",
  // Grade 3 Math
  "3NBT.A.1": "Use place value to round whole numbers to the nearest 10 or 100.",
  "3NBT.A.2": "Fluently add and subtract within 1,000.",
  "3NBT.A.3": "Multiply one-digit whole numbers by multiples of 10.",
  "3OA.A.1": "Interpret products of whole numbers.",
  "3OA.A.2": "Interpret whole-number quotients and equal groups.",
  "3OA.A.3": "Use multiplication and division within 100 to solve word problems.",
  "3OA.D.8": "Solve two-step word problems using the four operations.",
  "3NF.A.1": "Understand a fraction 1/b as one part of a whole and a/b as a parts of size 1/b.",
  "3NF.A.3": "Explain equivalence of fractions and compare fractions.",
  "3NF.A.3d": "Compare two fractions with the same numerator or denominator.",
  "3MD.A.1": "Tell and write time to the nearest minute and solve elapsed-time problems.",
  "3MD.B.3": "Draw and interpret scaled picture graphs and bar graphs.",
  "3MD.C.7": "Relate area to multiplication and addition.",
  "3MD.D.8": "Solve real-world perimeter problems.",
  "3G.A.1": "Understand that shapes in different categories may share attributes.",
  "3G.A.2": "Partition shapes into equal shares and express areas as unit fractions.
",
  // Grade 4 Math
  "4NBT.A.1": "Recognize that a digit in one place represents ten times what it represents in the place to its right.",
  "4NBT.A.3": "Use place value understanding to round multi-digit whole numbers.",
  "4NBT.B.4": "Fluently add and subtract multi-digit whole numbers.",
  "4NBT.B.5": "Multiply a whole number of up to four digits by a one-digit whole number.",
  "4NBT.B.6": "Find whole-number quotients and remainders with up to four-digit dividends and one-digit divisors.",
  "4OA.A.1": "Interpret multiplication equations as comparisons.",
  "4OA.A.2": "Multiply or divide to solve word problems involving multiplicative comparison.",
  "4OA.A.3": "Solve multistep word problems using the four operations.",
  "4NF.A.1": "Explain why a fraction is equivalent to another fraction.",
  "4NF.B.3a": "Understand addition and subtraction of fractions as joining and separating parts referring to the same whole.",
  "4NF.B.3b": "Decompose a fraction into a sum of fractions with the same denominator.",
  "4NF.B.3c": "Add and subtract mixed numbers with like denominators.",
  "4NF.B.4c": "Solve word problems involving multiplication of a fraction by a whole number.",
  "4NF.C.5": "Express a fraction with denominator 10 as an equivalent fraction with denominator 100.",
  "4MD.A.1": "Know relative sizes of measurement units and convert measurements.",
  "4MD.A.2": "Use the four operations to solve word problems involving measurement, including time and distance.",
  "4MD.A.3": "Apply area and perimeter formulas for rectangles.",
  "4G.A.1": "Draw points, lines, line segments, rays, angles, and classify lines and angles.",
  "4G.A.2": "Classify two-dimensional figures based on parallel and perpendicular lines and angle size.",
  "4G.A.3": "Recognize line symmetry and draw lines of symmetry.
",
  // Grade 5 Math
  "5NBT.A.3": "Read, write, and compare decimals to thousandths using place value.",
  "5NBT.B.5": "Fluently multiply multi-digit whole numbers.",
  "5NBT.B.7": "Add, subtract, multiply, and divide decimals to hundredths.",
  "5OA.A.1": "Use parentheses, brackets, or braces and evaluate expressions.",
  "5OA.A.2": "Write simple expressions and solve problems by translating verbal statements to expressions or equations.",
  "5OA.B.3": "Generate and analyze numerical patterns.",
  "5NF.A.1": "Add and subtract fractions with unlike denominators.",
  "5NF.B.4": "Apply and extend previous understandings of multiplication to multiply a fraction or whole number by a fraction.",
  "5NF.B.7": "Apply and extend previous understandings of division to divide unit fractions and whole numbers.",
  "5MD.A.1": "Convert among different-sized standard measurement units within a system.",
  "5MD.C.5": "Relate volume to multiplication and additivity and solve volume problems.",
  "5G.A.1": "Use coordinate systems to locate points in the first quadrant.",
  "5G.A.2": "Represent real-world and mathematical problems by graphing points in the first quadrant.",

  // Grades 2–5 Language
  "2L.1": "Demonstrate command of standard English grammar and usage.",
  "2L.2": "Demonstrate command of capitalization, punctuation, and spelling.",
  "2L.4": "Determine or clarify the meaning of unknown and multiple-meaning words and phrases.",
  "2L.5": "Demonstrate understanding of word relationships and nuances in word meanings.",
  "3L.1": "Demonstrate command of standard English grammar and usage.",
  "3L.2": "Demonstrate command of capitalization, punctuation, and spelling.",
  "3L.3": "Use knowledge of language and its conventions when writing, speaking, reading, or listening.",
  "3L.4": "Determine or clarify the meaning of unknown and multiple-meaning words and phrases.",
  "3L.5": "Demonstrate understanding of word relationships and nuances in word meanings.",
  "4L.1": "Demonstrate command of standard English grammar and usage.",
  "4L.2": "Demonstrate command of capitalization, punctuation, and spelling.",
  "4L.3": "Use knowledge of language and its conventions when writing, speaking, reading, or listening.",
  "4L.4": "Determine or clarify the meaning of unknown and multiple-meaning words and phrases.",
  "4L.5": "Demonstrate understanding of figurative language, word relationships, and nuances in word meanings.",
  "5L.1": "Demonstrate command of standard English grammar and usage.",
  "5L.2": "Demonstrate command of capitalization, punctuation, and spelling.",
  "5L.3": "Use knowledge of language and its conventions when writing, speaking, reading, or listening.",
  "5L.4": "Determine or clarify the meaning of unknown and multiple-meaning words and phrases.",
  "5L.5": "Demonstrate understanding of figurative language, word relationships, and nuances in word meanings."
};

const READ_SKILL_MAP = {
  RL: {
    Q1: { skill: "main idea or theme", codeByGrade: {2:"2R2",3:"3R2",4:"4R2",5:"5R2"} },
    Q2: { skill: "supporting details and text evidence", codeByGrade: {2:"2R1",3:"3R1",4:"4R1",5:"5R1"} },
    Q3: { skill: "character inference and response to events", codeByGrade: {2:"2R3",3:"3R3",4:"4R3",5:"5R3"} }
  },
  RI: {
    Q1: { skill: "main idea or central idea", codeByGrade: {2:"2R2",3:"3R2",4:"4R2",5:"5R2"} },
    Q2: { skill: "supporting details and text evidence", codeByGrade: {2:"2R1",3:"3R1",4:"4R1",5:"5R1"} },
    Q3: { skill: "author purpose or point of view", codeByGrade: {2:"2R6",3:"3R6",4:"4R6",5:"5R6"} }
  }
};

const READ_LABEL_MAP = {
  "2R1": "Ask and answer questions to show understanding of key ideas and details.",
  "2R2": "Identify the main topic or central idea and key details; summarize parts of a text.",
  "2R3": "Describe character responses to major events or describe connections among ideas, concepts, or events.",
  "2R6": "Identify how illustrations, text features, and details support the point of view or purpose of a text.",
  "3R1": "Develop and answer questions using relevant details to support an answer or inference.",
  "3R2": "Determine a theme or central idea and explain how key details support it; summarize portions of a text.",
  "3R3": "Describe characters, events, or relationships among ideas using specific details.",
  "3R6": "Discuss how the reader’s perspective may differ from that of the author, narrator, or characters.",
  "4R1": "Refer to relevant details and evidence when explaining what a text says explicitly or implicitly.",
  "4R2": "Determine a theme or central idea and explain how it is supported by key details; summarize a text.",
  "4R3": "Describe characters, settings, events, procedures, ideas, or concepts using specific evidence.",
  "4R6": "Analyze point of view in literary or informational texts.",
  "5R1": "Locate and refer to relevant details and evidence when explaining what a text says explicitly or implicitly.",
  "5R2": "Determine a theme or central idea and explain how it is supported by key details; summarize a text.",
  "5R3": "Compare, contrast, or explain relationships among characters, settings, events, ideas, or concepts using specific details.",
  "5R6": "Explain or analyze how point of view shapes a text or account."
};

export function readingStandardFor(grade, domain, qid){
  const entry = READ_SKILL_MAP[domain]?.[qid];
  if (!entry) return null;
  const code = entry.codeByGrade?.[grade] || null;
  return code ? { code, label: READ_LABEL_MAP[code] || "Reading standard", skill: entry.skill } : null;
}

export function standardMetaForItem(item, grade){
  if (!item) return null;
  if (item.standard_code) {
    return {
      code: item.standard_code,
      label: STANDARD_MAP[item.standard_code] || item.standard_code,
      skill: item.skill_tag || item.standard_code
    };
  }
  if (item.domain && (item.domain === "RL" || item.domain === "RI") && item.qid) {
    return readingStandardFor(item.grade || grade, item.domain, item.qid);
  }
  return null;
}
