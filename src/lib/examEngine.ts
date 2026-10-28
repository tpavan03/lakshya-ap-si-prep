import type { Question } from "../data";

export type ExamId = "ap-si" | "nicl-ao";
export type Stage = "prelims" | "mains";
export type Stream = "generalist" | "it";
export type SectionBlueprint = {
  id: string;
  title: string;
  subjects: string[];
  questions: number;
  minutes: number;
};
export type Blueprint = {
  id: string;
  title: string;
  stage: Stage;
  stream?: Stream;
  sections: SectionBlueprint[];
  questions: number;
  minutes: number;
  negativeMark: number;
  marksPerCorrect: number;
  sectionalTiming: boolean;
};
export type ExamDefinition = {
  id: ExamId;
  title: string;
  shortName: string;
  description: string;
  officialUrl: string;
  patternNote: string;
  stages: Record<Stage, Blueprint[]>;
  itStages?: Record<Stage, Blueprint[]>;
};
export type QuizSection = {
  id: string;
  title: string;
  itemIds: string[];
  durationSeconds: number;
};
export type Quiz = {
  id: string;
  examId: ExamId;
  stage?: Stage;
  stream?: Stream;
  mode: "exam" | "practice";
  blueprintId?: string;
  seed: number;
  title: string;
  items: Question[];
  sections: QuizSection[];
  minutes: number;
  negativeMark: number;
  marksPerCorrect: number;
  sectionalTiming: boolean;
  startedAt?: number;
  expiresAt?: number;
  index?: number;
  answers?: Record<string, number>;
  marked?: string[];
  secondsByQuestion?: Record<string, number>;
};
export type ScoreRow = {
  correct: number;
  wrong: number;
  unanswered: number;
  total: number;
  score: number;
};
export type QuestionReview = {
  question: Question;
  selected: number | null;
  result: "correct" | "wrong" | "unanswered";
  seconds: number;
  marks: number;
};
export type Attempt = {
  id: string;
  examId: ExamId;
  title: string;
  date: string;
  mode: "exam" | "practice";
  stage?: Stage;
  stream?: Stream;
  blueprintId?: string;
  score: number;
  maxMarks: number;
  correct: number;
  wrong: number;
  unanswered: number;
  total: number;
  accuracy: number;
  seconds: number;
  negativeMark: number;
  marksPerCorrect: number;
  subjects: Record<string, ScoreRow>;
  sections: Record<string, ScoreRow>;
  review: QuestionReview[];
};

const apPaper = (
  id: string,
  title: string,
  stage: Stage,
  subjects: string[],
  count: number,
): Blueprint => ({
  id,
  title,
  stage,
  sections: [{ id, title, subjects, questions: count, minutes: 180 }],
  questions: count,
  minutes: 180,
  negativeMark: 0,
  marksPerCorrect: 1,
  sectionalTiming: false,
});
const niclSection = (
  id: string,
  title: string,
  subject: string,
  questions: number,
  minutes: number,
): SectionBlueprint => ({ id, title, subjects: [subject], questions, minutes });
export const EXAMS: Record<ExamId, ExamDefinition> = {
  "ap-si": {
    id: "ap-si",
    title: "AP Police Sub Inspector",
    shortName: "AP SI",
    description:
      "Arithmetic, mental ability and general studies. Prepare for the preliminary and final written papers.",
    officialUrl:
      "https://slprb.ap.gov.in/2026_PDFS/SLPRB_AP_SI_Notification_2026.pdf",
    patternNote:
      "AP SI Civil track uses separate 180-minute papers. Final objective papers carry 200 marks each for Civil; AR weighting differs. No deduction is specified in the linked notice; simulations apply zero negative marking. Final language papers are descriptive and qualifying.",
    stages: {
      prelims: [
        apPaper(
          "prelims-paper-1",
          "Paper I · Arithmetic & reasoning",
          "prelims",
          ["Arithmetic", "Reasoning"],
          100,
        ),
        apPaper(
          "prelims-paper-2",
          "Paper II · General studies",
          "prelims",
          ["General Studies", "AP Focus"],
          100,
        ),
      ],
      mains: [
        apPaper(
          "mains-paper-3",
          "Paper III · Arithmetic & mental ability",
          "mains",
          ["Arithmetic", "Reasoning"],
          200,
        ),
        apPaper(
          "mains-paper-4",
          "Paper IV · General studies",
          "mains",
          ["General Studies", "AP Focus"],
          200,
        ),
      ],
    },
  },
  "nicl-ao": {
    id: "nicl-ao",
    title: "NICL Administrative Officer",
    shortName: "NICL AO",
    description:
      "Generalist and IT Specialist preparation for National Insurance: aptitude, language, awareness, computers and professional IT.",
    officialUrl:
      "https://nationalinsurance.nic.co.in/sites/default/files/2026-10/NICL%20AO%20Recruitment%20Advertisment%202026-27_0.pdf",
    patternNote:
      "Both streams share 100-question, 60-minute Prelims. Mains has 250 questions in 180 minutes: Generalist uses five 50-question sections; IT Specialist uses five 40-question common sections and 50 professional IT questions. A separate 30-minute descriptive English test follows. Objective sections are separately timed; wrong answers lose one quarter of the marks assigned to that question.",
    stages: {
      prelims: [
        {
          id: "prelims-generalist",
          title: "Generalist · Full prelims",
          stage: "prelims",
          stream: "generalist",
          questions: 100,
          minutes: 60,
          negativeMark: 0.25,
          marksPerCorrect: 1,
          sectionalTiming: true,
          sections: [
            niclSection("english", "English language", "English", 30, 20),
            niclSection("reasoning", "Reasoning ability", "Reasoning", 35, 20),
            niclSection("quant", "Quantitative aptitude", "Arithmetic", 35, 20),
          ],
        },
      ],
      mains: [
        {
          id: "mains-generalist",
          title: "Generalist · Full mains objective",
          stage: "mains",
          stream: "generalist",
          questions: 250,
          minutes: 180,
          negativeMark: 0.25,
          marksPerCorrect: 1,
          sectionalTiming: true,
          sections: [
            niclSection("reasoning", "Reasoning", "Reasoning", 50, 40),
            niclSection("english", "English language", "English", 50, 40),
            niclSection(
              "awareness",
              "General awareness",
              "General Awareness",
              50,
              30,
            ),
            niclSection(
              "computer",
              "Computer knowledge",
              "Computer Knowledge",
              50,
              30,
            ),
            niclSection("quant", "Quantitative aptitude", "Arithmetic", 50, 40),
          ],
        },
      ],
    },
    itStages: {
      prelims: [
        {
          id: "prelims-it",
          title: "IT Specialist · Full prelims",
          stage: "prelims",
          stream: "it",
          questions: 100,
          minutes: 60,
          negativeMark: 0.25,
          marksPerCorrect: 1,
          sectionalTiming: true,
          sections: [
            niclSection("english", "English language", "English", 30, 20),
            niclSection("reasoning", "Reasoning ability", "Reasoning", 35, 20),
            niclSection("quant", "Quantitative aptitude", "Arithmetic", 35, 20),
          ],
        },
      ],
      mains: [
        {
          id: "mains-it",
          title: "IT Specialist · Full mains objective",
          stage: "mains",
          stream: "it",
          questions: 250,
          minutes: 180,
          negativeMark: 0.25,
          marksPerCorrect: 1,
          sectionalTiming: true,
          sections: [
            niclSection("reasoning", "Reasoning", "Reasoning", 40, 35),
            niclSection(
              "awareness",
              "General awareness",
              "General Awareness",
              40,
              20,
            ),
            niclSection("quant", "Quantitative aptitude", "Arithmetic", 40, 35),
            niclSection("english", "English language", "English", 40, 30),
            niclSection(
              "computer",
              "Computer knowledge",
              "Computer Knowledge",
              40,
              25,
            ),
            niclSection(
              "professional-it",
              "IT professional knowledge",
              "IT Professional Knowledge",
              50,
              35,
            ),
          ],
        },
      ],
    },
  },
};

export const getBlueprints = (
  examId: ExamId,
  stage: Stage,
  stream: Stream = "generalist",
) =>
  stream === "it" && EXAMS[examId].itStages
    ? EXAMS[examId].itStages![stage]
    : EXAMS[examId].stages[stage];

export class BankCoverageError extends Error {
  constructor(section: string, required: number, available: number) {
    super(
      `${section} needs ${required} unique questions; only ${available} match. Choose a smaller custom practice set or add verified content.`,
    );
    this.name = "BankCoverageError";
  }
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const copy = [...items];
  let value = Math.trunc(seed) >>> 0 || 0x9e3779b9;
  const random = () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const normalized = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const contentKey = (q: Question) =>
  `${normalized(q.question)}|${q.options.map(normalized).join("|")}`;
const familyKey = (q: Question) =>
  normalized(q.question).replace(/\d+(?:\s+\d+)*/g, "#");
export function uniqueQuestions(pool: readonly Question[]): Question[] {
  const ids = new Set<string>(),
    stems = new Set<string>();
  return pool.filter((q) => {
    const key = contentKey(q);
    if (!q.id || ids.has(q.id) || stems.has(key)) return false;
    ids.add(q.id);
    stems.add(key);
    return true;
  });
}

// Round-robin topics first, then numerical template families; content never repeats in an attempt.
function balancedSelection(
  pool: Question[],
  count: number,
  seed: number,
): Question[] {
  const groups = new Map<string, Question[]>();
  for (const q of seededShuffle(pool, seed)) {
    const key = `${q.subject}|${q.topic}`;
    const list = groups.get(key) ?? [];
    list.push(q);
    groups.set(key, list);
  }
  const lists = seededShuffle([...groups.values()], seed + 7);
  const selected: Question[] = [],
    used = new Set<string>(),
    families = new Set<string>();
  // Diversity gets first choice; a second pass fills valid variants when coverage requires it.
  for (const familyPass of [true, false]) {
    let progress = true;
    while (selected.length < count && progress) {
      progress = false;
      for (const list of lists) {
        const q = list.find(
          (candidate) =>
            !used.has(candidate.id) &&
            (!familyPass || !families.has(familyKey(candidate))),
        );
        if (q) {
          selected.push(q);
          used.add(q.id);
          families.add(familyKey(q));
          progress = true;
        }
        if (selected.length === count) break;
      }
    }
  }
  return selected;
}

export function selectQuestions(
  pool: readonly Question[],
  count: number,
  seed = 1,
): Question[] {
  const unique = uniqueQuestions(pool);
  if (unique.length < count)
    throw new BankCoverageError("This set", count, unique.length);
  const selected: Question[] = [];
  const targets: Array<[Question["difficulty"], number]> = [
    ["Hard", Math.ceil(count * 0.6)],
    ["Medium", Math.floor(count * 0.3)],
    ["Easy", count - Math.ceil(count * 0.6) - Math.floor(count * 0.3)],
  ];
  for (const [difficulty, target] of targets)
    selected.push(
      ...balancedSelection(
        unique.filter((q) => q.difficulty === difficulty),
        target,
        seed + selected.length + 19,
      ),
    );
  const used = new Set(selected.map((q) => q.id));
  selected.push(
    ...balancedSelection(
      unique.filter((q) => !used.has(q.id)),
      count - selected.length,
      seed + 71,
    ),
  );
  return seededShuffle(selected, seed + 101);
}

export function createExamQuiz(
  examId: ExamId,
  stage: Stage,
  paperId: string,
  seed: number,
  pool: readonly Question[],
): Quiz {
  const blueprint = [
    ...getBlueprints(examId, stage),
    ...getBlueprints(examId, stage, "it"),
  ].find((paper) => paper.id === paperId);
  if (!blueprint)
    throw new Error("Choose a valid paper for this exam and stage.");
  const used = new Set<string>(),
    items: Question[] = [],
    sections: QuizSection[] = [];
  for (const [index, section] of blueprint.sections.entries()) {
    const eligible = uniqueQuestions(
      pool.filter(
        (q) => section.subjects.includes(q.subject) && !used.has(q.id),
      ),
    );
    if (eligible.length < section.questions)
      throw new BankCoverageError(
        section.title,
        section.questions,
        eligible.length,
      );
    const selected = selectQuestions(
      eligible,
      section.questions,
      seed * 937 + index * 71,
    );
    selected.forEach((q) => used.add(q.id));
    items.push(...selected);
    sections.push({
      id: section.id,
      title: section.title,
      itemIds: selected.map((q) => q.id),
      durationSeconds: section.minutes * 60,
    });
  }
  return {
    id: `${examId}-${paperId}-${seed}`,
    examId,
    stage,
    stream: blueprint.stream,
    mode: "exam",
    blueprintId: paperId,
    seed,
    title: `${EXAMS[examId].shortName} · ${blueprint.title} · ${seed}`,
    items,
    sections,
    minutes: blueprint.minutes,
    negativeMark: blueprint.negativeMark,
    marksPerCorrect: blueprint.marksPerCorrect,
    sectionalTiming: blueprint.sectionalTiming,
  };
}

export type PracticeOptions = {
  examId: ExamId;
  stream?: Stream;
  pool: readonly Question[];
  title?: string;
  subjects?: string[];
  topics?: string[];
  difficulty?: "All" | Question["difficulty"];
  count: number;
  minutes: number;
  seed?: number;
  questionIds?: string[];
  negativeMark?: number;
};
export function createPracticeQuiz(options: PracticeOptions): Quiz {
  const {
    examId,
    subjects,
    topics,
    difficulty,
    questionIds,
    pool,
    count,
    minutes,
  } = options;
  if (!Number.isInteger(count) || count < 1 || count > 250)
    throw new Error("Choose between 1 and 250 questions.");
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 360)
    throw new Error("Choose a time limit between 1 and 360 minutes.");
  const eligible = pool.filter(
    (q) =>
      (!subjects?.length || subjects.includes(q.subject)) &&
      (!topics?.length || topics.includes(q.topic)) &&
      (!difficulty || difficulty === "All" || q.difficulty === difficulty) &&
      (!questionIds || questionIds.includes(q.id)),
  );
  const seed = options.seed ?? Date.now();
  const items = selectQuestions(eligible, count, seed);
  return {
    id: `${examId}-practice-${seed}`,
    examId,
    stream: options.stream ?? (examId === "nicl-ao" ? "generalist" : undefined),
    mode: "practice",
    seed,
    title: options.title ?? `${EXAMS[examId].shortName} · Custom practice`,
    items,
    sections: [
      {
        id: "practice",
        title: "Custom practice",
        itemIds: items.map((q) => q.id),
        durationSeconds: minutes * 60,
      },
    ],
    minutes,
    negativeMark: options.negativeMark ?? (examId === "nicl-ao" ? 0.25 : 0),
    marksPerCorrect: 1,
    sectionalTiming: false,
  };
}

export function startQuiz(quiz: Quiz, now = Date.now()): Quiz {
  return {
    ...quiz,
    startedAt: now,
    expiresAt: now + quiz.minutes * 60000,
    index: 0,
    answers: {},
    marked: [],
    secondsByQuestion: {},
  };
}
export function getQuizClock(quiz: Quiz, now = Date.now()) {
  const startedAt = quiz.startedAt ?? now;
  const elapsed = Math.max(0, (now - startedAt) / 1000);
  const totalSeconds = quiz.minutes * 60;
  const remainingSeconds = Math.max(
    0,
    Math.ceil(
      ((quiz.expiresAt ?? startedAt + totalSeconds * 1000) - now) / 1000,
    ),
  );
  let currentSectionIndex = 0,
    sectionStart = 0;
  if (quiz.sectionalTiming) {
    while (
      currentSectionIndex < quiz.sections.length - 1 &&
      elapsed >=
        sectionStart + quiz.sections[currentSectionIndex].durationSeconds
    ) {
      sectionStart += quiz.sections[currentSectionIndex].durationSeconds;
      currentSectionIndex++;
    }
  }
  const currentSection = quiz.sections[currentSectionIndex];
  const sectionRemainingSeconds = quiz.sectionalTiming
    ? Math.max(
        0,
        Math.ceil(
          sectionStart +
            (currentSection?.durationSeconds ?? totalSeconds) -
            elapsed,
        ),
      )
    : remainingSeconds;
  const isFinished = remainingSeconds === 0;
  const allowedItemIds = isFinished
    ? []
    : quiz.sectionalTiming
      ? (currentSection?.itemIds ?? [])
      : quiz.items.map((q) => q.id);
  return {
    remainingSeconds,
    currentSectionIndex,
    sectionRemainingSeconds,
    isFinished,
    allowedItemIds,
  };
}

const emptyScore = (): ScoreRow => ({
  correct: 0,
  wrong: 0,
  unanswered: 0,
  total: 0,
  score: 0,
});
export function scoreQuiz(
  quiz: Quiz,
  answers: Record<string, number>,
  secondsByQuestion: Record<string, number> = {},
  now = Date.now(),
): Attempt {
  const review: QuestionReview[] = quiz.items.map((question) => {
    const selected =
      Number.isInteger(answers[question.id]) &&
      answers[question.id] >= 0 &&
      answers[question.id] < question.options.length
        ? answers[question.id]
        : null;
    const result =
      selected === null
        ? "unanswered"
        : selected === question.answer
          ? "correct"
          : "wrong";
    const marks =
      result === "correct"
        ? quiz.marksPerCorrect
        : result === "wrong"
          ? -quiz.negativeMark
          : 0;
    const seconds = Number.isFinite(secondsByQuestion[question.id])
      ? Math.max(0, secondsByQuestion[question.id])
      : 0;
    return { question, selected, result, seconds, marks };
  });
  const subjects: Record<string, ScoreRow> = {},
    sections: Record<string, ScoreRow> = {};
  const add = (row: ScoreRow, entry: QuestionReview) => {
    row.total++;
    row[entry.result]++;
    row.score += entry.marks;
  };
  for (const entry of review) {
    subjects[entry.question.subject] ??= emptyScore();
    add(subjects[entry.question.subject], entry);
    const sectionId =
      quiz.sections.find((section) =>
        section.itemIds.includes(entry.question.id),
      )?.id ?? "practice";
    sections[sectionId] ??= emptyScore();
    add(sections[sectionId], entry);
  }
  const correct = review.filter((q) => q.result === "correct").length,
    wrong = review.filter((q) => q.result === "wrong").length;
  return {
    id: `${quiz.id}-${now}`,
    examId: quiz.examId,
    stream: quiz.stream,
    title: quiz.title,
    date: new Date(now).toISOString(),
    mode: quiz.mode,
    stage: quiz.stage,
    blueprintId: quiz.blueprintId,
    score: review.reduce((sum, entry) => sum + entry.marks, 0),
    maxMarks: quiz.items.length * quiz.marksPerCorrect,
    correct,
    wrong,
    unanswered: review.length - correct - wrong,
    total: review.length,
    accuracy:
      correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : 0,
    seconds: Math.max(
      0,
      Math.min(
        quiz.minutes * 60,
        Math.round((now - (quiz.startedAt ?? now)) / 1000),
      ),
    ),
    negativeMark: quiz.negativeMark,
    marksPerCorrect: quiz.marksPerCorrect,
    subjects,
    sections,
    review,
  };
}
