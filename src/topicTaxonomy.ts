/**
 * Canonical topic taxonomy for the AP SI subjects.
 *
 * The AP bank grew in layers (starter items, templates, knowledge factories,
 * the severe bank), each with its own topic names ("Ratio", "Ratio and
 * proportion", "Profit & loss" vs "Profit and loss", "Polity" vs "Indian
 * Polity" …). Topic-wise practice lists the distinct topic strings, so the
 * layers must share one syllabus-aligned vocabulary. `canonicalTopic` maps
 * every AP-subject question onto that vocabulary at bank assembly time
 * (src/data.ts) without touching ids, text, options or answers.
 *
 * The same function is used when displaying or filtering stored question
 * copies (saved quizzes, past attempts), so older records that carry a
 * pre-taxonomy topic name still show and group under the canonical name.
 *
 * NICL questions are a separate bank and are never mapped: their Arithmetic
 * and Reasoning topics keep their own names (see `canonicalTopicFor`).
 */

export const AP_TOPIC_SUBJECTS = ['Arithmetic', 'Reasoning', 'General Studies', 'AP Focus'] as const
export type ApTopicSubject = (typeof AP_TOPIC_SUBJECTS)[number]

export const AP_TOPIC_TAXONOMY: Readonly<Record<ApTopicSubject, readonly string[]>> = {
  Arithmetic: [
    'Number system',
    'Simplification, surds and indices',
    'Algebra and quadratic equations',
    'Percentages',
    'Profit, loss and discount',
    'Simple and compound interest',
    'Ratio, proportion and partnership',
    'Averages and ages',
    'Mixtures and alligation',
    'Time and work',
    'Time, speed and distance',
    'Mensuration and geometry',
    'Permutation and combination',
    'Probability',
    'Data interpretation',
    'Data sufficiency (arithmetic)',
  ],
  Reasoning: [
    'Number and alphabet series',
    'Alphabet test',
    'Analogy',
    'Classification',
    'Coding-decoding',
    'Blood relations',
    'Directions',
    'Ranking and order',
    'Linear seating arrangement',
    'Circular seating arrangement',
    'Floor and box puzzles',
    'Scheduling puzzles',
    'Syllogism',
    'Venn diagrams',
    'Coded inequalities',
    'Mathematical operations',
    'Input-output',
    'Data sufficiency (reasoning)',
    'Clocks and calendars',
    'Cubes, dice and spatial reasoning',
    'Statements and logical deduction',
  ],
  'General Studies': [
    'Ancient India',
    'Medieval India',
    'Modern India and freedom struggle',
    'Constitutional foundations',
    'Parliament and federalism',
    'Executive, judiciary and accountability',
    'Indian economy and macroeconomics',
    'Banking and public finance',
    'Physics and chemistry',
    'Biology and health',
    'Ecology and environment',
    'Climate and disaster management',
    'Indian geography',
    'Physical geography',
  ],
  'AP Focus': [
    'AP ancient history',
    'AP medieval history',
    'AP modern history and social movements',
    'AP formation and governance',
    'AP physical geography',
    'AP rivers and water projects',
    'AP economy and agriculture',
    'AP literature and performing arts',
    'AP heritage, crafts and textiles',
    'AP forests, wildlife and wetlands',
  ],
}

/** Legacy topic name → canonical topic, per subject. */
const BY_NAME: Readonly<Record<ApTopicSubject, Readonly<Record<string, string>>>> = {
  Arithmetic: {
    'Number system': 'Number system',
    'HCF and LCM': 'Number system',
    Remainders: 'Number system',
    // Odd-day counting is modular arithmetic; the reasoning topic owns clocks and calendars.
    Calendar: 'Number system',
    Simplification: 'Simplification, surds and indices',
    Fractions: 'Simplification, surds and indices',
    Decimals: 'Simplification, surds and indices',
    Surds: 'Simplification, surds and indices',
    Indices: 'Simplification, surds and indices',
    Algebra: 'Algebra and quadratic equations',
    'Quadratic equations': 'Algebra and quadratic equations',
    Percentages: 'Percentages',
    'Profit & loss': 'Profit, loss and discount',
    'Profit and loss': 'Profit, loss and discount',
    'Profit, loss and discount': 'Profit, loss and discount',
    Discount: 'Profit, loss and discount',
    'Simple interest': 'Simple and compound interest',
    'Compound interest': 'Simple and compound interest',
    Ratio: 'Ratio, proportion and partnership',
    'Ratio and proportion': 'Ratio, proportion and partnership',
    Partnership: 'Ratio, proportion and partnership',
    Average: 'Averages and ages',
    Ages: 'Averages and ages',
    Mixtures: 'Mixtures and alligation',
    'Mixtures and alligation': 'Mixtures and alligation',
    'Time & work': 'Time and work',
    'Time and work': 'Time and work',
    'Work and wages': 'Time and work',
    'Pipes and cisterns': 'Time and work',
    'Time & distance': 'Time, speed and distance',
    'Time and distance': 'Time, speed and distance',
    Trains: 'Time, speed and distance',
    'Boats and streams': 'Time, speed and distance',
    // Clock-hand problems are relative-speed problems.
    Clocks: 'Time, speed and distance',
    Mensuration: 'Mensuration and geometry',
    Geometry: 'Mensuration and geometry',
    Trigonometry: 'Mensuration and geometry',
    'Permutation and combination': 'Permutation and combination',
    Probability: 'Probability',
    'Data interpretation': 'Data interpretation',
    'Data sufficiency': 'Data sufficiency (arithmetic)',
  },
  Reasoning: {
    'Number series': 'Number and alphabet series',
    'Alphabet series': 'Number and alphabet series',
    'Alphabet test': 'Alphabet test',
    Analogy: 'Analogy',
    'Number analogy': 'Analogy',
    'Letter analogy': 'Analogy',
    Classification: 'Classification',
    Coding: 'Coding-decoding',
    'Coding-decoding': 'Coding-decoding',
    'Blood relations': 'Blood relations',
    Directions: 'Directions',
    Ranking: 'Ranking and order',
    'Order and sequence': 'Ranking and order',
    'Logical sequence': 'Ranking and order',
    'Seating arrangement': 'Linear seating arrangement',
    'Circular arrangement': 'Circular seating arrangement',
    'Circular seating': 'Circular seating arrangement',
    Puzzle: 'Floor and box puzzles',
    Scheduling: 'Scheduling puzzles',
    Syllogism: 'Syllogism',
    'Logical reasoning': 'Syllogism',
    'Venn diagrams': 'Venn diagrams',
    'Coded inequalities': 'Coded inequalities',
    'Mathematical operations': 'Mathematical operations',
    'Input-output': 'Input-output',
    'Data sufficiency': 'Data sufficiency (reasoning)',
    Clock: 'Clocks and calendars',
    Calendar: 'Clocks and calendars',
    // The only mirror-image item is a clock-face reading.
    'Mirror images': 'Clocks and calendars',
    Cubes: 'Cubes, dice and spatial reasoning',
    Dice: 'Cubes, dice and spatial reasoning',
    // Paper folding and punching, stated in words.
    'Non-verbal reasoning': 'Cubes, dice and spatial reasoning',
    'Statement and assumption': 'Statements and logical deduction',
    'Statement and conclusion': 'Statements and logical deduction',
    'Statement and course of action': 'Statements and logical deduction',
    'Cause and effect': 'Statements and logical deduction',
    'Logical deduction': 'Statements and logical deduction',
    'Binary logic': 'Statements and logical deduction',
  },
  'General Studies': {
    'Ancient India': 'Ancient India',
    'Medieval India': 'Medieval India',
    'Modern India': 'Modern India and freedom struggle',
    History: 'Modern India and freedom struggle',
    'Indian History': 'Modern India and freedom struggle',
    'Constitutional foundations': 'Constitutional foundations',
    Polity: 'Constitutional foundations',
    'Indian Polity': 'Constitutional foundations',
    'Parliament and federalism': 'Parliament and federalism',
    'Executive judiciary and accountability': 'Executive, judiciary and accountability',
    Macroeconomics: 'Indian economy and macroeconomics',
    Economy: 'Banking and public finance',
    'Indian Economy': 'Indian economy and macroeconomics',
    'Banking and public finance': 'Banking and public finance',
    'Physics and chemistry': 'Physics and chemistry',
    Physics: 'Physics and chemistry',
    'General Science': 'Physics and chemistry',
    Science: 'Biology and health',
    'Biology and health': 'Biology and health',
    'Ecology and biodiversity': 'Ecology and environment',
    Environment: 'Ecology and environment',
    'Climate and disaster management': 'Climate and disaster management',
    'Indian geography': 'Indian geography',
    Geography: 'Indian geography',
    'Indian Geography': 'Indian geography',
    'Physical geography': 'Physical geography',
  },
  'AP Focus': {
    'AP formation and governance': 'AP formation and governance',
    'State formation': 'AP formation and governance',
    Polity: 'AP formation and governance',
    Civics: 'AP formation and governance',
    'AP ancient and medieval history': 'AP medieval history',
    'Ancient history': 'AP ancient history',
    History: 'AP ancient history',
    'Buddhist heritage': 'AP ancient history',
    'Medieval history': 'AP medieval history',
    'AP modern history and social movements': 'AP modern history and social movements',
    'Freedom movement': 'AP modern history and social movements',
    'AP physical geography': 'AP physical geography',
    'Physical geography': 'AP physical geography',
    Geography: 'AP physical geography',
    'Coast and islands': 'AP physical geography',
    'Coastal geography': 'AP physical geography',
    'AP rivers and water projects': 'AP rivers and water projects',
    Rivers: 'AP rivers and water projects',
    'River projects': 'AP rivers and water projects',
    'AP economy and agriculture': 'AP economy and agriculture',
    Economy: 'AP economy and agriculture',
    Agriculture: 'AP economy and agriculture',
    'Soils and agriculture': 'AP economy and agriculture',
    'AP literature and performing arts': 'AP literature and performing arts',
    Literature: 'AP literature and performing arts',
    Dance: 'AP literature and performing arts',
    'Folk arts': 'AP literature and performing arts',
    'Performing arts': 'AP literature and performing arts',
    Culture: 'AP literature and performing arts',
    'AP heritage crafts and biodiversity': 'AP heritage, crafts and textiles',
    Handicrafts: 'AP heritage, crafts and textiles',
    'Art and craft': 'AP heritage, crafts and textiles',
    Architecture: 'AP heritage, crafts and textiles',
    'Religion and heritage': 'AP heritage, crafts and textiles',
    'Protected areas': 'AP forests, wildlife and wetlands',
    Forests: 'AP forests, wildlife and wetlands',
    Wetlands: 'AP forests, wildlife and wetlands',
    'Coast and environment': 'AP forests, wildlife and wetlands',
  },
}

const ids = (topic: string, list: string) => Object.fromEntries(list.trim().split(/\s+/).map(id => [id, topic]))
const range = (prefix: string, from: number, to: number, pad = 3) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${prefix}${String(from + i).padStart(pad, '0')}`).join(' ')
/** Knowledge-factory ids carry seven variants per fact (`xap011v1` … `xap011v7`). */
const factIds = (prefix: string, from: number, to: number) =>
  range(prefix, from, to).split(' ').flatMap(base => Array.from({ length: 7 }, (_, v) => `${base}v${v + 1}`)).join(' ')

/**
 * Per-question overrides where a legacy name spans several canonical topics
 * (e.g. "Indian Polity" covers rights, Parliament and constitutional bodies).
 */
const BY_ID: Readonly<Record<string, string>> = {
  // General Studies — starter items
  ...ids('Parliament and federalism', 'g02'),
  ...ids('Physics and chemistry', 'g08'),
  // General Studies — Indian Polity (default: Constitutional foundations)
  ...ids('Parliament and federalism', 'gs004 gs005 gs007 gs009 gs010 gs013 gs014 gs101 gs102 gs104'),
  ...ids('Executive, judiciary and accountability', 'gs006 gs008 gs012 gs015 gs091 gs103'),
  // General Studies — Indian History (default: Modern India and freedom struggle)
  ...ids('Ancient India', 'gs016 gs017 gs018 gs098 gs106'),
  ...ids('Medieval India', 'gs019 gs020'),
  // General Studies — Indian Geography (default: Indian geography)
  ...ids('Physical geography', 'gs036 gs037 gs038 gs039 gs040 gs099 gs109'),
  // General Studies — Indian Economy (default: Indian economy and macroeconomics)
  ...ids('Banking and public finance', 'gs048 gs049 gs050 gs053 gs056 gs057 gs112'),
  // General Studies — General Science (default: Physics and chemistry)
  ...ids('Biology and health', 'gs062 gs064 gs069 gs070 gs073 gs075 gs115'),
  // General Studies — Environment (default: Ecology and environment)
  ...ids('Climate and disaster management', 'gs076'),
  // AP Focus — starter and legacy items whose name is too broad
  ...ids('AP rivers and water projects', 'ap04 ap050 ap064'),
  ...ids('AP economy and agriculture', 'ap05'),
  ...ids('AP heritage, crafts and textiles', 'ap052'),
  // AP Focus — knowledge-factory facts (xap011–020 history; xap071–080 crafts and biodiversity)
  ...ids('AP ancient history', factIds('xap', 11, 15)),
  ...ids('AP medieval history', factIds('xap', 16, 18) + ' ' + factIds('xap', 20, 20)),
  ...ids('AP heritage, crafts and textiles', factIds('xap', 19, 19) + ' ' + factIds('xap', 71, 75)),
  ...ids('AP forests, wildlife and wetlands', factIds('xap', 76, 80)),
  // AP Focus — severe items from the former combined topics
  ...ids('AP ancient history', 'svp-his-001 svp-his-002 svp-his-003 svp-his-004 svp-his-005 svp-his-006 svp-his-018 svp-his-023'),
  ...ids('AP heritage, crafts and textiles', 'svp-his-016 svp-his-017 svp-his-019 ' + range('svp-bio-', 1, 6) + ' svp-bio-017 svp-bio-018 svp-bio-019'),
  ...ids('AP forests, wildlife and wetlands', range('svp-bio-', 7, 16) + ' svp-bio-020 svp-bio-021'),
}

const CANONICAL: Readonly<Record<string, ReadonlySet<string>>> = Object.fromEntries(
  AP_TOPIC_SUBJECTS.map(subject => [subject, new Set(AP_TOPIC_TAXONOMY[subject])]),
)

export const isApTopicSubject = (subject: string): subject is ApTopicSubject =>
  (AP_TOPIC_SUBJECTS as readonly string[]).includes(subject)

/**
 * Canonical topic of an AP-bank question (or of a stored copy of one). Unknown
 * legacy names fall through unchanged; the test suite asserts that none remain
 * in the assembled bank.
 */
export const canonicalTopic = (q: { id: string; subject: string; topic: string }): string => {
  if (!isApTopicSubject(q.subject)) return q.topic
  const override = BY_ID[q.id]
  if (override) return override
  if (CANONICAL[q.subject].has(q.topic)) return q.topic
  return BY_NAME[q.subject][q.topic] ?? q.topic
}

/** Exam-aware form: only AP SI questions are mapped; NICL keeps its own topic names. */
export const canonicalTopicFor = (examId: string, q: { id: string; subject: string; topic: string }) =>
  examId === 'ap-si' ? canonicalTopic(q) : q.topic

/** Canonical names a (possibly legacy) topic label stands for, across the AP subjects. */
export const canonicalTopicNames = (topic: string): string[] => {
  const out = new Set<string>([topic])
  for (const subject of AP_TOPIC_SUBJECTS) {
    const mapped = BY_NAME[subject][topic]
    if (mapped) out.add(mapped)
  }
  return [...out]
}
