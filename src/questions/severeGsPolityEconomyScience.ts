import type { Question } from '../data'
import { severe, TWO_STATEMENTS } from './severeKit'

/**
 * Severe General Studies bank: hand-authored hard items on Polity, Economy,
 * General Science and Environment in the multi-statement / match / A-R styles
 * of recent APPSC, TSPSC Group-2 and AP/TS SI Paper II papers. Only stable,
 * non-time-sensitive facts are used; every explanation states why each
 * statement is true or false.
 */

const SUBJECT = 'General Studies' as const

const T = {
  cf: 'Constitutional foundations',
  pf: 'Parliament and federalism',
  ej: 'Executive judiciary and accountability',
  macro: 'Macroeconomics',
  bank: 'Banking and public finance',
  pc: 'Physics and chemistry',
  bio: 'Biology and health',
  eco: 'Ecology and biodiversity',
  climate: 'Climate and disaster management',
} as const

type Topic = (typeof T)[keyof typeof T]

const HOW_MANY_3 = ['Only one', 'Only two', 'All three', 'None']
const HOW_MANY_4 = ['Only one', 'Only two', 'Only three', 'All four']
const AR_OPTIONS = [
  'Both A and R are true and R is the correct explanation of A',
  'Both A and R are true but R is not the correct explanation of A',
  'A is true but R is false',
  'A is false but R is true',
]

/** Deterministic rotation of the correct option for items whose options have no natural order. */
const SLOTS = [2, 0, 3, 1, 1, 3, 0, 2]
let turn = 0
const place = (correct: string, traps: [string, string, string]) => {
  const answer = SLOTS[turn++ % SLOTS.length]
  const options = [...traps]
  options.splice(answer, 0, correct)
  return { options, answer }
}

type Meta = { id: string; topic: Topic; explanation: string; hint: string; seconds?: number }

const numbered = (items: string[]) => items.map((s, i) => `${i + 1}. ${s}`).join('\n')

/** "Consider the following statements" with combination options (rotated). */
const ms = (m: Meta, lead: string, statements: string[], correct: string, traps: [string, string, string]): Question => {
  const { options, answer } = place(correct, traps)
  return severe({
    ...m,
    subject: SUBJECT,
    question: `${lead}\n${numbered(statements)}\nWhich of the statements given above is/are correct?`,
    options,
    answer,
    seconds: m.seconds ?? 100,
  })
}

/** Two-statement item with the standard fixed option set. */
const two = (m: Meta, lead: string, statements: [string, string], answer: 0 | 1 | 2 | 3): Question =>
  severe({
    ...m,
    subject: SUBJECT,
    question: `${lead}\n${numbered(statements)}\nWhich of the statements given above is/are correct?`,
    options: [...TWO_STATEMENTS],
    answer,
    seconds: m.seconds ?? 75,
  })

/** "How many of the above are correct?" with fixed count options. */
const howMany = (m: Meta, lead: string, statements: string[], answer: 0 | 1 | 2 | 3): Question =>
  severe({
    ...m,
    subject: SUBJECT,
    question: `${lead}\n${numbered(statements)}\nHow many of the statements given above are correct?`,
    options: statements.length === 4 ? [...HOW_MANY_4] : [...HOW_MANY_3],
    answer,
    seconds: m.seconds ?? 110,
  })

/** Assertion-Reason with the fixed four standard options. */
const ar = (m: Meta, a: string, r: string, answer: 0 | 1 | 2 | 3): Question =>
  severe({
    ...m,
    subject: SUBJECT,
    question: `Consider the following:\nAssertion (A): ${a}\nReason (R): ${r}\nChoose the correct answer.`,
    options: [...AR_OPTIONS],
    answer,
    seconds: m.seconds ?? 90,
  })

/** Match List I with List II; options are code strings (rotated). */
const match = (m: Meta, listI: string[], listII: string[], correct: string, traps: [string, string, string]): Question => {
  const { options, answer } = place(correct, traps)
  const letters = 'ABCD'
  return severe({
    ...m,
    subject: SUBJECT,
    question: `Match List I with List II:\nList I\n${listI.map((s, i) => `${letters[i]}. ${s}`).join('\n')}\nList II\n${numbered(listII)}\nSelect the correct code:`,
    options,
    answer,
    seconds: m.seconds ?? 120,
  })
}

/** Single-answer item (chronology, odd-one-out, precise recall), rotated. */
const single = (m: Meta, question: string, correct: string, traps: [string, string, string]): Question => {
  const { options, answer } = place(correct, traps)
  return severe({ ...m, subject: SUBJECT, question, options, answer, seconds: m.seconds ?? 75 })
}

const C = 'Consider the following statements:'

export const severeGsPolityEconomyScienceQuestions: Question[] = [
  // ───────────────────────── Polity: Constitutional foundations ─────────────────────────
  ms(
    {
      id: 'svg-pol-001',
      topic: T.cf,
      explanation:
        '1 is correct: the 42nd Amendment Act, 1976 inserted "Socialist", "Secular" and "Integrity" into the Preamble. 2 is correct: in Kesavananda Bharati (1973) the Supreme Court held the Preamble to be a part of the Constitution, reversing the Berubari (1960) view. 3 is incorrect: the Preamble has been amended only once, by the 42nd Amendment.',
      hint: 'Berubari (1960) and Kesavananda (1973) took opposite views on the Preamble.',
    },
    `${C} (Preamble of the Constitution of India)`,
    [
      'The words "Socialist" and "Secular" were added by the 42nd Amendment Act, 1976.',
      'In Kesavananda Bharati case, the Supreme Court held that the Preamble is a part of the Constitution.',
      'The Preamble has been amended on more than one occasion.',
    ],
    '1 and 2 only',
    ['2 and 3 only', '1 and 3 only', '1, 2 and 3'],
  ),
  single(
    {
      id: 'svg-pol-002',
      topic: T.cf,
      explanation:
        'Articles 15, 16, 19, 29 and 30 are available only to citizens. Article 15 (non-discrimination on grounds of religion, race, caste, sex, place of birth) and Article 19 (six freedoms) are citizen-only. Article 14 (equality before law) and Article 21 (life and personal liberty) are available to all persons, including foreigners.',
      hint: 'Equality before law and right to life protect "any person".',
    },
    'Consider the following Articles of the Constitution of India:\n1. Article 14\n2. Article 15\n3. Article 19\n4. Article 21\nThe Fundamental Rights under which of the above are available ONLY to citizens of India?',
    '2 and 3 only',
    ['1 and 4 only', '1, 2 and 3 only', '2, 3 and 4 only'],
  ),
  match(
    {
      id: 'svg-pol-003',
      topic: T.cf,
      explanation:
        'Article 17 abolishes untouchability (A-3). Article 18 abolishes titles, except military and academic distinctions (B-1). Article 23 prohibits traffic in human beings and forced labour (C-4). Article 24 prohibits employment of children below 14 years in factories, mines and hazardous employment (D-2).',
      hint: 'Articles 17-18 close the Right to Equality; 23-24 form the Right against Exploitation.',
    },
    ['Article 17', 'Article 18', 'Article 23', 'Article 24'],
    [
      'Abolition of titles',
      'Prohibition of employment of children in factories and mines',
      'Abolition of untouchability',
      'Prohibition of traffic in human beings and forced labour',
    ],
    'A-3, B-1, C-4, D-2',
    ['A-1, B-3, C-4, D-2', 'A-3, B-1, C-2, D-4', 'A-1, B-3, C-2, D-4'],
  ),
  ar(
    {
      id: 'svg-pol-004',
      topic: T.ej,
      explanation:
        'A is true: the writ jurisdiction of High Courts is wider than that of the Supreme Court under Article 32. R is true: Article 226 lets High Courts issue writs for enforcement of Fundamental Rights "and for any other purpose", i.e. ordinary legal rights too, whereas Article 32 is confined to Fundamental Rights. R therefore directly explains A.',
      hint: 'Compare the closing words of Article 226 with the scope of Article 32.',
    },
    'The writ jurisdiction of High Courts is wider than that of the Supreme Court under Article 32.',
    'Article 226 empowers High Courts to issue writs not only for enforcement of Fundamental Rights but also "for any other purpose".',
    0,
  ),
  ms(
    {
      id: 'svg-pol-005',
      topic: T.ej,
      explanation:
        '1 is incorrect: quo warranto lies only against a person holding a substantive public office created by statute or the Constitution, not a private office or body. 2 is correct: mandamus cannot be issued against the President or the Governor of a State acting in their personal capacity (Article 361 immunity), nor against a private individual. 3 is correct: habeas corpus can be issued against public authorities as well as private individuals who unlawfully detain a person.',
      hint: 'Which writ protects personal liberty from anyone who detains?',
    },
    `${C} (Writs)`,
    [
      'The writ of quo warranto can be issued to restrain a person from holding an office in a private company.',
      'The writ of mandamus cannot be issued against the President of India or the Governor of a State.',
      'The writ of habeas corpus can be issued against private individuals as well as public authorities.',
    ],
    '2 and 3 only',
    ['1 and 2 only', '1 and 3 only', '3 only'],
  ),
  match(
    {
      id: 'svg-pol-006',
      topic: T.cf,
      explanation:
        'Article 40 directs organisation of village panchayats (A-2). Article 44 speaks of a Uniform Civil Code (B-4). Article 48A, added by the 42nd Amendment, deals with protection of environment, forests and wildlife (C-1). Article 50 directs separation of the judiciary from the executive (D-3).',
      hint: '48A came with the 42nd Amendment; 44 is the much-debated civil code.',
    },
    ['Article 40', 'Article 44', 'Article 48A', 'Article 50'],
    [
      'Protection and improvement of environment, forests and wildlife',
      'Organisation of village panchayats',
      'Separation of judiciary from executive',
      'Uniform civil code for the citizens',
    ],
    'A-2, B-4, C-1, D-3',
    ['A-4, B-2, C-1, D-3', 'A-2, B-4, C-3, D-1', 'A-2, B-1, C-4, D-3'],
  ),
  ms(
    {
      id: 'svg-pol-007',
      topic: T.cf,
      explanation:
        '1 is correct: the ten original Fundamental Duties were added by the 42nd Amendment, 1976 on the recommendation of the Swaran Singh Committee. 2 is correct: the 86th Amendment Act, 2002 added the eleventh duty, for a parent or guardian to provide opportunities for education to a child between 6 and 14 years. 3 is incorrect: Fundamental Duties are non-justiciable; no writ lies for their direct enforcement.',
      hint: 'The same 2002 amendment also inserted Article 21A.',
    },
    `${C} (Fundamental Duties)`,
    [
      'They were incorporated on the recommendation of the Swaran Singh Committee.',
      'The eleventh duty was added by the 86th Constitutional Amendment Act, 2002.',
      'They can be enforced directly through writs issued by the Supreme Court.',
    ],
    '1 and 2 only',
    ['1 only', '2 and 3 only', '1, 2 and 3'],
  ),
  howMany(
    {
      id: 'svg-pol-008',
      topic: T.cf,
      explanation:
        '1 is correct: under Article 368 an amendment Bill can be introduced in either House, not in a State Legislature. 2 is correct: each House must pass it separately; there is no provision for a joint sitting on a Constitution Amendment Bill. 3 is incorrect: after the 24th Amendment Act, 1971 the President must give assent to a Constitution Amendment Bill; he can neither withhold assent nor return it. So only two are correct.',
      hint: 'The 24th Amendment changed "may" to "shall" for Presidential assent.',
    },
    `${C} (Amendment under Article 368)`,
    [
      'A Constitution Amendment Bill can be introduced in either House of Parliament.',
      'A deadlock between the two Houses over a Constitution Amendment Bill cannot be resolved by a joint sitting.',
      'The President may withhold assent to a Constitution Amendment Bill duly passed by Parliament.',
    ],
    1,
  ),
  single(
    {
      id: 'svg-pol-009',
      topic: T.ej,
      explanation:
        'Golaknath (1967) held Parliament cannot amend Fundamental Rights; Kesavananda Bharati (1973) laid down the basic structure doctrine; Minerva Mills (1980) held limited amending power and the FR-DPSP balance to be basic features; S.R. Bommai (1994) subjected President’s Rule under Article 356 to judicial review. Correct order: 2, 4, 1, 3.',
      hint: 'Basic structure came between the "FR cannot be amended" case and its reaffirmation.',
      seconds: 90,
    },
    'Arrange the following Supreme Court judgments in chronological order:\n1. Minerva Mills case\n2. Golaknath case\n3. S.R. Bommai case\n4. Kesavananda Bharati case',
    '2, 4, 1, 3',
    ['4, 2, 1, 3', '2, 4, 3, 1', '4, 2, 3, 1'],
  ),
  match(
    {
      id: 'svg-pol-010',
      topic: T.ej,
      explanation:
        'Kesavananda Bharati (1973) propounded the basic structure doctrine (A-3). Maneka Gandhi (1978) held that the procedure under Article 21 must be just, fair and reasonable (B-4). Indra Sawhney (1992) upheld OBC reservation with a creamy-layer exclusion and a 50% ceiling (C-1). S.R. Bommai (1994) held that a proclamation under Article 356 is subject to judicial review (D-2).',
      hint: 'Mandal case is the reservation one.',
    },
    ['Kesavananda Bharati', 'Maneka Gandhi', 'Indra Sawhney', 'S.R. Bommai'],
    [
      'Creamy layer and 50% ceiling on reservations',
      'Judicial review of President’s Rule',
      'Basic structure doctrine',
      'Procedure established by law must be just, fair and reasonable',
    ],
    'A-3, B-4, C-1, D-2',
    ['A-3, B-1, C-4, D-2', 'A-4, B-3, C-1, D-2', 'A-3, B-4, C-2, D-1'],
  ),
  match(
    {
      id: 'svg-pol-011',
      topic: T.cf,
      explanation:
        'The Seventh Schedule distributes subjects in the Union, State and Concurrent Lists (A-4). The Eighth Schedule lists the recognised languages (B-1). The Ninth Schedule protects certain Acts and Regulations (mostly land reform laws) and was added by the First Amendment, 1951 (C-2). The Tenth Schedule contains the anti-defection provisions (D-3).',
      hint: 'Schedules 7 to 10 in order: lists, languages, protected laws, defection.',
    },
    ['Seventh Schedule', 'Eighth Schedule', 'Ninth Schedule', 'Tenth Schedule'],
    [
      'Languages',
      'Validation of certain Acts and Regulations',
      'Disqualification on ground of defection',
      'Union, State and Concurrent Lists',
    ],
    'A-4, B-1, C-2, D-3',
    ['A-4, B-1, C-3, D-2', 'A-1, B-4, C-2, D-3', 'A-2, B-1, C-4, D-3'],
  ),
  howMany(
    {
      id: 'svg-pol-012',
      topic: T.cf,
      explanation:
        '1 is correct: the Fifth Schedule governs Scheduled Areas and Scheduled Tribes in all States other than Assam, Meghalaya, Tripura and Mizoram. 2 is correct: the Sixth Schedule provides for autonomous district councils in the tribal areas of these four States. 3 is correct: in I.R. Coelho (2007) the Supreme Court held that laws placed in the Ninth Schedule after 24 April 1973 (the Kesavananda judgment date) can be tested against the basic structure. All three are correct.',
      hint: 'Four north-eastern States sit under a different Schedule.',
    },
    C,
    [
      'The Fifth Schedule deals with administration of Scheduled Areas in States other than Assam, Meghalaya, Tripura and Mizoram.',
      'The Sixth Schedule deals with administration of tribal areas in Assam, Meghalaya, Tripura and Mizoram.',
      'Laws inserted in the Ninth Schedule after 24 April 1973 are open to judicial review on the touchstone of basic structure.',
    ],
    2,
  ),
  single(
    {
      id: 'svg-pol-013',
      topic: T.ej,
      explanation:
        'The National Commission for Scheduled Castes (Article 338), the National Commission for Scheduled Tribes (Article 338A) and the National Commission for Backward Classes (Article 338B, given constitutional status by the 102nd Amendment, 2018) are constitutional bodies. The National Human Rights Commission is a statutory body under the Protection of Human Rights Act, 1993.',
      hint: 'One of these was created by an ordinary Act of 1993.',
    },
    'Which one of the following is a statutory body and NOT a constitutional body?',
    'National Human Rights Commission',
    ['National Commission for Scheduled Castes', 'National Commission for Backward Classes', 'National Commission for Scheduled Tribes'],
  ),
  ms(
    {
      id: 'svg-pol-014',
      topic: T.ej,
      explanation:
        '1 is correct: under Article 148 the CAG is removable only in the manner and on the grounds of a Supreme Court judge. 2 is incorrect: the CAG is not eligible for any further office under the Government of India or of any State after ceasing to hold office. 3 is correct: under Article 151 the CAG’s reports on Union accounts go to the President, who causes them to be laid before each House of Parliament.',
      hint: 'Independence of the CAG is secured by barring post-retirement office.',
    },
    `${C} (Comptroller and Auditor General of India)`,
    [
      'The CAG can be removed from office only in like manner and on like grounds as a judge of the Supreme Court.',
      'After retirement, the CAG is eligible for appointment as a Governor of a State.',
      'The reports of the CAG relating to the accounts of the Union are submitted to the President.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '2 and 3 only', '1, 2 and 3'],
  ),
  ms(
    {
      id: 'svg-pol-015',
      topic: T.ej,
      explanation:
        '1 is correct: Article 324 vests superintendence, direction and control of elections to Parliament, State Legislatures and the offices of President and Vice-President in the Election Commission. 2 is incorrect: elections to panchayats and municipalities are conducted by State Election Commissions (Articles 243K and 243ZA). 3 is correct: under Article 324(5) the Chief Election Commissioner can be removed only like a Supreme Court judge.',
      hint: 'Local body polls have their own State-level commission.',
    },
    `${C} (Election Commission of India)`,
    [
      'It conducts elections to the offices of the President and the Vice-President.',
      'It conducts elections to panchayats and municipalities in the States.',
      'The Chief Election Commissioner can be removed only in the manner and on the grounds of a Supreme Court judge.',
    ],
    '1 and 3 only',
    ['1 only', '2 and 3 only', '1, 2 and 3'],
  ),
  howMany(
    {
      id: 'svg-pol-016',
      topic: T.pf,
      explanation:
        '1 is correct: the Finance Commission is constituted by the President under Article 280, every five years or earlier. 2 is correct: it consists of a Chairman and four other members. 3 is incorrect: its recommendations are advisory and not binding on the Union Government. So only two are correct.',
      hint: 'A quasi-judicial body whose report is only recommendatory.',
    },
    `${C} (Finance Commission)`,
    [
      'It is constituted by the President under Article 280.',
      'It consists of a Chairman and four other members.',
      'Its recommendations are binding on the Union Government.',
    ],
    1,
  ),
  two(
    {
      id: 'svg-pol-017',
      topic: T.ej,
      explanation:
        '1 is correct: members of a State Public Service Commission are appointed by the Governor but can be removed only by the President (Article 317). 2 is incorrect: under Article 319 the Chairman of the UPSC is ineligible for any further employment under the Government of India or of a State.',
      hint: 'Appointment and removal of SPSC members rest with different authorities.',
    },
    `${C} (Public Service Commissions)`,
    [
      'Members of a State Public Service Commission are appointed by the Governor but can be removed only by the President.',
      'The Chairman of the UPSC is eligible for further employment under the Government of India after ceasing to hold office.',
    ],
    0,
  ),
  two(
    {
      id: 'svg-pol-018',
      topic: T.ej,
      explanation:
        '1 is correct: under Article 88 the Attorney General has the right to speak and take part in proceedings of either House (and joint sittings and committees) but not to vote. 2 is correct: under Article 76 the Attorney General must be qualified to be appointed a judge of the Supreme Court.',
      hint: 'He may participate in Parliament without being a member.',
    },
    `${C} (Attorney General of India)`,
    [
      'He has the right to speak in either House of Parliament but has no right to vote there.',
      'He must be a person qualified to be appointed a judge of the Supreme Court.',
    ],
    2,
  ),
  // ───────────────────────── Polity: Parliament and federalism ─────────────────────────
  ms(
    {
      id: 'svg-pol-019',
      topic: T.pf,
      explanation:
        '1 is correct: a Money Bill can be introduced only in the Lok Sabha and only on the recommendation of the President (Articles 109, 117). 2 is correct: the Rajya Sabha must return it within 14 days, with or without recommendations, which the Lok Sabha may accept or reject. 3 is incorrect: Article 108 joint sittings are not available for Money Bills, since the Rajya Sabha cannot block them.',
      hint: 'The Rajya Sabha can only delay, not reject, a Money Bill.',
    },
    `${C} (Money Bills)`,
    [
      'A Money Bill can be introduced only in the Lok Sabha and only on the recommendation of the President.',
      'The Rajya Sabha can withhold a Money Bill for a maximum period of 14 days.',
      'A deadlock over a Money Bill is resolved by a joint sitting of both Houses.',
    ],
    '1 and 2 only',
    ['1 only', '2 and 3 only', '1, 2 and 3'],
  ),
  ms(
    {
      id: 'svg-pol-020',
      topic: T.pf,
      explanation:
        '1 is incorrect: in the absence of the Speaker, a joint sitting is presided over by the Deputy Speaker of the Lok Sabha, and in his absence by the Deputy Chairman of the Rajya Sabha; the Vice-President does not preside. 2 is correct: the Speaker of the Lok Sabha presides over a joint sitting. 3 is correct: Article 108 applies to ordinary and financial bills but not to Money Bills or Constitution Amendment Bills.',
      hint: 'The Chairman of the Rajya Sabha is not a member of either House.',
    },
    `${C} (Joint sitting under Article 108)`,
    [
      'In the absence of the Speaker, the Vice-President presides over a joint sitting.',
      'A joint sitting is presided over by the Speaker of the Lok Sabha.',
      'A joint sitting can be summoned for an ordinary bill but not for a Constitution Amendment Bill.',
    ],
    '2 and 3 only',
    ['1 and 2 only', '3 only', '1, 2 and 3'],
  ),
  ms(
    {
      id: 'svg-pol-021',
      topic: T.pf,
      explanation:
        '1 is correct: under Article 249 the Rajya Sabha, by a resolution supported by two-thirds of members present and voting, can authorise Parliament to legislate on a State List matter in the national interest. 2 is incorrect: such a resolution remains in force for one year and can be extended by one year at a time. 3 is correct: under Article 312 the Rajya Sabha can, by a similar resolution, authorise Parliament to create new All India Services.',
      hint: 'Both special powers flow from the Rajya Sabha’s role as the federal chamber.',
    },
    `${C} (Special powers of the Rajya Sabha)`,
    [
      'It can authorise Parliament to make a law on a State List subject by a resolution supported by two-thirds of members present and voting.',
      'A resolution under Article 249 remains in force for two years.',
      'It can authorise the creation of a new All India Service.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '2 and 3 only', '1, 2 and 3'],
  ),
  howMany(
    {
      id: 'svg-pol-022',
      topic: T.pf,
      explanation:
        '1 is correct: the Tenth Schedule was added by the 52nd Amendment Act, 1985. 2 is correct: the 91st Amendment Act, 2003 deleted the exception for a split by one-third of a legislature party; only a merger supported by two-thirds is protected. 3 is correct: in Kihoto Hollohan (1992) the Supreme Court held the Presiding Officer’s decision under the Tenth Schedule to be subject to judicial review. All three are correct.',
      hint: 'Split was dropped; merger remains.',
    },
    `${C} (Anti-defection law)`,
    [
      'The Tenth Schedule was added by the 52nd Amendment Act, 1985.',
      'The 91st Amendment Act, 2003 removed the exemption for a "split" in a legislature party.',
      'The decision of the Presiding Officer on disqualification is subject to judicial review.',
    ],
    2,
  ),
  ms(
    {
      id: 'svg-pol-023',
      topic: T.pf,
      explanation:
        '1 is incorrect: the Speaker does not vote in the first instance; he exercises only a casting vote in case of a tie. 2 is correct: under Article 96, when a resolution for his removal is under consideration he cannot preside, but he can speak and vote in the first instance (though not cast a casting vote). 3 is incorrect: under Article 94 the Speaker does not vacate office on dissolution; he continues until immediately before the first meeting of the new Lok Sabha.',
      hint: 'Removal proceedings reverse the normal voting rule.',
    },
    `${C} (Speaker of the Lok Sabha)`,
    [
      'The Speaker votes in the first instance on every question before the House.',
      'When a resolution for his removal is under consideration, the Speaker can vote in the first instance.',
      'The Speaker vacates office immediately on the dissolution of the Lok Sabha.',
    ],
    '2 only',
    ['1 and 2 only', '2 and 3 only', '1 and 3 only'],
  ),
  match(
    {
      id: 'svg-pol-024',
      topic: T.pf,
      explanation:
        'A policy cut motion seeks to reduce the demand to Re 1, representing disapproval of the policy (A-2). An economy cut seeks to reduce the demand by a specified amount (B-3). A token cut seeks to reduce the demand by ₹100, to ventilate a specific grievance (C-1).',
      hint: 'The rupee-one cut signals the deepest disapproval.',
      seconds: 90,
    },
    ['Policy cut', 'Economy cut', 'Token cut'],
    [
      'Demand reduced by ₹100 to express a specific grievance',
      'Demand reduced to Re 1 to show disapproval of the policy',
      'Demand reduced by a specified amount representing economy',
    ],
    'A-2, B-3, C-1',
    ['A-3, B-2, C-1', 'A-2, B-1, C-3', 'A-1, B-3, C-2'],
  ),
  ms(
    {
      id: 'svg-pol-025',
      topic: T.pf,
      explanation:
        '1 is correct: the Constitution does not use the word "Budget"; Article 112 refers to the "Annual Financial Statement". 2 is incorrect: Article 267 places the Contingency Fund of India at the disposal of the President, not the Finance Minister. 3 is correct: under Article 266(3) and 114, no money can be withdrawn from the Consolidated Fund of India except under appropriation made by law.',
      hint: 'Advances from the Contingency Fund are made by the Head of State.',
    },
    `${C} (Union finance)`,
    [
      'The term "Budget" is not used in the Constitution; it refers to the Annual Financial Statement.',
      'The Contingency Fund of India is placed at the disposal of the Finance Minister.',
      'No money can be withdrawn from the Consolidated Fund of India except under appropriation made by law.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '3 only', '1, 2 and 3'],
  ),
  single(
    {
      id: 'svg-pol-026',
      topic: T.pf,
      explanation:
        'Emoluments of the President, salaries and allowances of Supreme Court judges and of the CAG are charged on the Consolidated Fund of India. Salaries and allowances of High Court judges are charged on the Consolidated Fund of the State (only their pensions are charged on the Consolidated Fund of India).',
      hint: 'Salary and pension of this office come from different funds.',
    },
    'Which one of the following is NOT charged on the Consolidated Fund of India?',
    'Salaries and allowances of judges of High Courts',
    ['Emoluments and allowances of the President', 'Salaries and allowances of judges of the Supreme Court', 'Salary and allowances of the Comptroller and Auditor General'],
  ),
  ms(
    {
      id: 'svg-pol-027',
      topic: T.pf,
      explanation:
        '1 is incorrect: under Article 248 and Entry 97 of the Union List, residuary powers vest in Parliament, not the States. 2 is correct: "Police" is Entry 2 of the State List. 3 is correct: the 42nd Amendment, 1976 shifted education (along with forests, weights and measures, protection of wild animals and birds, and administration of justice) from the State List to the Concurrent List.',
      hint: 'India follows the Canadian, not the American, model of residuary power.',
    },
    `${C} (Distribution of legislative powers)`,
    [
      'Residuary powers of legislation are vested in the State Legislatures.',
      'Police is a subject in the State List.',
      'Education was transferred from the State List to the Concurrent List by the 42nd Amendment Act, 1976.',
    ],
    '2 and 3 only',
    ['1 and 2 only', '3 only', '1, 2 and 3'],
  ),
  two(
    {
      id: 'svg-pol-028',
      topic: T.pf,
      explanation:
        '1 is incorrect: Article 263 only empowers the President to establish an Inter-State Council if public interest so requires; it is not a body created directly by the Constitution (it was set up by Presidential order in 1990, following the Sarkaria Commission). 2 is correct: Zonal Councils are statutory bodies under the States Reorganisation Act, 1956.',
      hint: 'One is enabled by the Constitution, the other created by an Act.',
    },
    `${C} (Centre-State coordination)`,
    [
      'The Inter-State Council is a permanent body established directly by the Constitution itself.',
      'Zonal Councils are statutory bodies created under the States Reorganisation Act, 1956.',
    ],
    1,
  ),
  howMany(
    {
      id: 'svg-pol-029',
      topic: T.pf,
      explanation:
        '1 is correct: a proclamation under Article 356 must be approved by both Houses within two months. 2 is correct: once approved it continues for six months and can be extended, with Parliament’s approval every six months, up to a maximum of three years. 3 is incorrect: the approving resolution needs only a simple majority, unlike Article 352 which needs a special majority. So only two are correct.',
      hint: 'Contrast the majority needed with that for a National Emergency.',
    },
    `${C} (President’s Rule under Article 356)`,
    [
      'The proclamation must be approved by both Houses of Parliament within two months.',
      'It can be extended up to a maximum of three years with the approval of Parliament every six months.',
      'The resolution approving the proclamation must be passed by a special majority.',
    ],
    1,
  ),
  ms(
    {
      id: 'svg-pol-030',
      topic: T.pf,
      explanation:
        '1 is correct: the 44th Amendment, 1978 replaced "internal disturbance" with "armed rebellion" in Article 352. 2 is correct: after the 44th Amendment the proclamation must be approved within one month by each House by a special majority. 3 is correct: under Article 358, when emergency is declared on the ground of war or external aggression, Article 19 is automatically suspended. 4 is incorrect: by the 44th Amendment, the rights under Articles 20 and 21 cannot be suspended even during an emergency.',
      hint: 'Two Articles of Part III are emergency-proof after 1978.',
      seconds: 130,
    },
    `${C} (National Emergency)`,
    [
      'The 44th Amendment Act replaced the words "internal disturbance" with "armed rebellion".',
      'The proclamation must be approved by each House of Parliament within one month by a special majority.',
      'Article 19 is automatically suspended when emergency is declared on the ground of war or external aggression.',
      'The President can suspend the enforcement of Articles 20 and 21 during an emergency.',
    ],
    '1, 2 and 3 only',
    ['1 and 4 only', '2, 3 and 4 only', '1, 2, 3 and 4'],
  ),
  howMany(
    {
      id: 'svg-pol-031',
      topic: T.pf,
      explanation:
        '1 is correct: a Financial Emergency under Article 360 must be approved by both Houses within two months. 2 is incorrect: once approved it continues indefinitely until revoked; no repeated approval every six months is needed. 3 is correct: during a Financial Emergency the President may direct reduction of salaries of all persons serving the Union, including judges of the Supreme Court and High Courts. So only two are correct.',
      hint: 'There is no maximum period for this emergency.',
    },
    `${C} (Financial Emergency under Article 360)`,
    [
      'It must be approved by both Houses of Parliament within two months.',
      'It must be renewed by Parliament every six months to remain in force.',
      'The President may direct reduction of salaries of judges of the Supreme Court and High Courts.',
    ],
    1,
  ),
  // ───────────────────────── Polity: Executive, judiciary and accountability ─────────────────────────
  ms(
    {
      id: 'svg-pol-032',
      topic: T.ej,
      explanation:
        '1 is correct: Article 155 provides that the Governor is appointed by the President by warrant under his hand and seal. 2 is correct: the Governor’s ordinance-making power is in Article 213 (the President’s is Article 123). 3 is incorrect: the Governor holds office during the pleasure of the President (Article 156); there is no removal by resolution of the State Legislature.',
      hint: 'Ordinance Articles: 123 for the Union, 213 for States.',
    },
    `${C} (Governor)`,
    [
      'The Governor is appointed by the President by warrant under his hand and seal.',
      'The ordinance-making power of the Governor is provided under Article 213.',
      'The Governor can be removed only by a resolution passed by the State Legislative Assembly.',
    ],
    '1 and 2 only',
    ['2 only', '2 and 3 only', '1, 2 and 3'],
  ),
  ms(
    {
      id: 'svg-pol-033',
      topic: T.ej,
      explanation:
        '1 is correct: under Article 72 the President can grant pardon in cases of punishment by a court martial. 2 is incorrect: the Governor’s power under Article 161 does not extend to court-martial sentences. 3 is correct: the President can pardon a sentence of death.',
      hint: 'Military court sentences are a Union-only matter.',
    },
    `${C} (Pardoning powers)`,
    [
      'The President can grant pardon to a person punished by a court martial.',
      'The Governor of a State can grant pardon to a person punished by a court martial.',
      'The President can grant pardon in all cases where the sentence is a sentence of death.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '2 and 3 only', '1 only'],
  ),
  ms(
    {
      id: 'svg-pol-034',
      topic: T.ej,
      explanation:
        '1 is correct: under Article 54 the electoral college for the President consists of elected members of both Houses of Parliament and elected members of State Legislative Assemblies, including those of Delhi and Puducherry (added by the 70th Amendment, 1992). 2 is incorrect: nominated members of Parliament do not take part in the Presidential election. 3 is correct: the Vice-President is elected by all members of both Houses, elected and nominated (Article 66).',
      hint: 'State legislators vote for one office but not the other.',
    },
    `${C} (Election of President and Vice-President)`,
    [
      'Elected members of the Legislative Assemblies of the NCT of Delhi and Puducherry participate in the election of the President.',
      'Nominated members of Parliament participate in the election of the President.',
      'Nominated members of Parliament participate in the election of the Vice-President.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '2 and 3 only', '3 only'],
  ),
  howMany(
    {
      id: 'svg-pol-035',
      topic: T.ej,
      explanation:
        '1 is correct: the Vice-President is the ex-officio Chairman of the Rajya Sabha (Article 64). 2 is correct: under Article 67(b) he can be removed by a resolution of the Rajya Sabha passed by a majority of all its then members and agreed to by the Lok Sabha. 3 is incorrect: disputes about the election of the President or Vice-President are decided by the Supreme Court (Article 71), not the Election Commission. So only two are correct.',
      hint: 'Election disputes of the two highest offices go to the apex court.',
    },
    `${C} (Vice-President of India)`,
    [
      'He is the ex-officio Chairman of the Rajya Sabha.',
      'He can be removed by a resolution of the Rajya Sabha passed by a majority of all its then members and agreed to by the Lok Sabha.',
      'Disputes regarding his election are decided by the Election Commission of India.',
    ],
    1,
  ),
  ms(
    {
      id: 'svg-pol-036',
      topic: T.ej,
      explanation:
        '1 is correct: the 91st Amendment Act, 2003 capped the Union Council of Ministers, including the PM, at 15% of the total strength of the Lok Sabha (Article 75(1A)). 2 is incorrect: in a State the number of Ministers including the Chief Minister shall not be less than 12 (not 15), subject to the 15% ceiling of the Assembly strength (Article 164(1A)). 3 is correct: the same amendment introduced these limits.',
      hint: 'The floor for States is a dozen.',
    },
    `${C} (Size of Council of Ministers)`,
    [
      'The total number of Ministers including the Prime Minister shall not exceed 15% of the total strength of the Lok Sabha.',
      'In a State, the number of Ministers including the Chief Minister shall not be less than 15.',
      'These limits were introduced by the 91st Constitutional Amendment Act.',
    ],
    '1 and 3 only',
    ['1 only', '2 and 3 only', '1, 2 and 3'],
  ),
  match(
    {
      id: 'svg-pol-037',
      topic: T.ej,
      explanation:
        'Original jurisdiction over disputes between the Centre and States is in Article 131 (A-2). Advisory jurisdiction is in Article 143 (B-4). The power to review its own judgments is in Article 137 (C-1). The right to move the Supreme Court for enforcement of Fundamental Rights is in Article 32 (D-3).',
      hint: 'President’s reference to the Court is the 140s.',
    },
    ['Original jurisdiction in Centre-State disputes', 'Advisory jurisdiction', 'Review of its own judgments', 'Enforcement of Fundamental Rights'],
    ['Article 137', 'Article 131', 'Article 32', 'Article 143'],
    'A-2, B-4, C-1, D-3',
    ['A-4, B-2, C-1, D-3', 'A-2, B-1, C-4, D-3', 'A-2, B-4, C-3, D-1'],
  ),
  howMany(
    {
      id: 'svg-pol-038',
      topic: T.ej,
      explanation:
        '1 is correct: the collegium system evolved through the Second Judges case (1993) and was elaborated in the Third Judges case (1998). 2 is correct: in 2015 the Supreme Court struck down the 99th Amendment and the NJAC Act. 3 is incorrect: High Court judges retire at 62, while Supreme Court judges retire at 65. So only two are correct.',
      hint: 'Retirement ages of the two courts differ by three years.',
    },
    `${C} (Higher judiciary)`,
    [
      'The collegium system of appointment evolved through the Second Judges case (1993).',
      'The Supreme Court struck down the National Judicial Appointments Commission in 2015.',
      'Judges of High Courts and of the Supreme Court retire at the same age.',
    ],
    1,
  ),
  ms(
    {
      id: 'svg-pol-039',
      topic: T.pf,
      explanation:
        '1 is correct: the 73rd Amendment added Part IX and the Eleventh Schedule. 2 is correct: the Eleventh Schedule contains 29 subjects. 3 is correct: Article 243D reserves not less than one-third of seats (and offices of chairpersons) for women. 4 is incorrect: Article 243-I provides for the State Finance Commission; Article 243K concerns the State Election Commission.',
      hint: 'Finance Commission is 243-I; Election Commission is 243K.',
      seconds: 120,
    },
    `${C} (73rd Constitutional Amendment)`,
    [
      'It added Part IX and the Eleventh Schedule to the Constitution.',
      'The Eleventh Schedule contains 29 subjects.',
      'Not less than one-third of the seats in panchayats are reserved for women.',
      'Article 243K provides for constitution of a State Finance Commission to review panchayat finances.',
    ],
    '1, 2 and 3 only',
    ['1 and 2 only', '2, 3 and 4 only', '1, 2, 3 and 4'],
  ),
  match(
    {
      id: 'svg-pol-040',
      topic: T.pf,
      explanation:
        'Article 243-I: State Finance Commission (A-3). Article 243K: State Election Commission for panchayats (B-1). Article 243ZD: District Planning Committee (C-4). Article 243ZE: Metropolitan Planning Committee (D-2).',
      hint: 'ZD comes before ZE as district comes before metropolis.',
    },
    ['Article 243-I', 'Article 243K', 'Article 243ZD', 'Article 243ZE'],
    ['State Election Commission', 'Metropolitan Planning Committee', 'State Finance Commission', 'District Planning Committee'],
    'A-3, B-1, C-4, D-2',
    ['A-1, B-3, C-4, D-2', 'A-3, B-1, C-2, D-4', 'A-1, B-3, C-2, D-4'],
  ),
  two(
    {
      id: 'svg-pol-041',
      topic: T.pf,
      explanation:
        '1 is correct: the Panchayats (Extension to the Scheduled Areas) Act, 1996 extends Part IX to the Fifth Schedule areas with modifications. 2 is incorrect: Sixth Schedule areas are governed by autonomous district councils and are outside PESA.',
      hint: 'PESA follows the Bhuria Committee recommendations for one Schedule only.',
    },
    `${C} (PESA Act, 1996)`,
    [
      'It extends the provisions of Part IX of the Constitution to the Scheduled Areas under the Fifth Schedule.',
      'It applies to the tribal areas covered by the Sixth Schedule.',
    ],
    0,
  ),
  ms(
    {
      id: 'svg-pol-042',
      topic: T.cf,
      explanation:
        '1 is correct: citizenship is dealt with in Part II, Articles 5 to 11. 2 is correct: Article 11 empowers Parliament to regulate citizenship by law, under which the Citizenship Act, 1955 was enacted. 3 is incorrect: Overseas Citizenship of India is not citizenship; India does not permit dual citizenship and OCI cardholders do not get voting rights or constitutional offices.',
      hint: 'OCI is a status, not a second citizenship.',
    },
    `${C} (Citizenship)`,
    [
      'Citizenship is dealt with in Articles 5 to 11 in Part II of the Constitution.',
      'The Citizenship Act, 1955 was enacted by Parliament under Article 11.',
      'An Overseas Citizen of India cardholder enjoys dual citizenship with the right to vote in Lok Sabha elections.',
    ],
    '1 and 2 only',
    ['2 only', '1 and 3 only', '1, 2 and 3'],
  ),
  single(
    {
      id: 'svg-pol-043',
      topic: T.cf,
      explanation:
        'The Constituent Assembly first met on 9 December 1946; Nehru moved the Objectives Resolution on 13 December 1946; the Constitution was adopted on 26 November 1949; the First Amendment Act was passed in 1951. Correct order: 3, 1, 4, 2.',
      hint: 'The Objectives Resolution came four days after the first sitting.',
    },
    'Arrange the following in chronological order:\n1. Moving of the Objectives Resolution\n2. Enactment of the First Constitutional Amendment Act\n3. First meeting of the Constituent Assembly\n4. Adoption of the Constitution by the Constituent Assembly',
    '3, 1, 4, 2',
    ['1, 3, 4, 2', '3, 1, 2, 4', '1, 3, 2, 4'],
  ),
  howMany(
    {
      id: 'svg-pol-044',
      topic: T.cf,
      explanation:
        '1 is correct: Dr. Rajendra Prasad was the permanent President of the Constituent Assembly. 2 is correct: Dr. B.R. Ambedkar chaired the Drafting Committee. 3 is incorrect: the temporary President was Dr. Sachchidananda Sinha; H.C. Mukherjee was a Vice-President. 4 is correct: the Objectives Resolution was moved by Jawaharlal Nehru. So only three are correct.',
      hint: 'The oldest member presided at the first sitting.',
    },
    `${C} (Constituent Assembly)`,
    [
      'Dr. Rajendra Prasad was elected its permanent President.',
      'Dr. B.R. Ambedkar was the Chairman of its Drafting Committee.',
      'H.C. Mukherjee was its temporary President at the first meeting.',
      'The Objectives Resolution was moved by Jawaharlal Nehru.',
    ],
    2,
  ),
  match(
    {
      id: 'svg-pol-045',
      topic: T.cf,
      explanation:
        'Directive Principles were borrowed from the Irish Constitution (A-3). Fundamental Rights were borrowed from the US Constitution (B-1). The Concurrent List was borrowed from Australia (C-4). Suspension of Fundamental Rights during emergency was borrowed from the Weimar Constitution of Germany (D-2).',
      hint: 'Ireland itself drew its directives from Spain.',
    },
    ['Directive Principles of State Policy', 'Fundamental Rights', 'Concurrent List', 'Suspension of Fundamental Rights during emergency'],
    ['USA', 'Germany (Weimar)', 'Ireland', 'Australia'],
    'A-3, B-1, C-4, D-2',
    ['A-1, B-3, C-4, D-2', 'A-3, B-1, C-2, D-4', 'A-4, B-1, C-3, D-2'],
  ),
  single(
    {
      id: 'svg-pol-046',
      topic: T.cf,
      explanation:
        'Valuing and preserving the rich heritage of our composite culture is a Fundamental Duty under Article 51A(f) with no parallel Directive Principle. Equal justice and free legal aid (Article 39A), protection of monuments (Article 49) and organisation of agriculture and animal husbandry (Article 48) are Directive Principles, not Fundamental Duties.',
      hint: 'Three options are duties of the State; one is a duty of the citizen.',
    },
    'Which one of the following is a Fundamental Duty but NOT a Directive Principle of State Policy?',
    'To value and preserve the rich heritage of our composite culture',
    ['To promote equal justice and free legal aid', 'To protect monuments and places of national importance', 'To organise agriculture and animal husbandry on modern lines'],
  ),
  match(
    {
      id: 'svg-pol-047',
      topic: T.cf,
      explanation:
        'Article 343: official language of the Union is Hindi in Devanagari script (A-2). Article 348: language of the Supreme Court and High Courts (B-4). Article 350A: facilities for instruction in mother tongue at primary stage (C-1). Article 351: directive for development of the Hindi language (D-3).',
      hint: 'Part XVII opens at 343 and closes with the Hindi directive.',
    },
    ['Article 343', 'Article 348', 'Article 350A', 'Article 351'],
    ['Instruction in mother tongue at primary stage', 'Official language of the Union', 'Directive for development of Hindi', 'Language of Supreme Court and High Courts'],
    'A-2, B-4, C-1, D-3',
    ['A-2, B-1, C-4, D-3', 'A-4, B-2, C-1, D-3', 'A-2, B-4, C-3, D-1'],
  ),
  ms(
    {
      id: 'svg-pol-048',
      topic: T.ej,
      explanation:
        '1 is incorrect: an ordinance cannot amend the Constitution; it has the same force as an Act of Parliament and is subject to the same limits. 2 is correct: Article 123 allows an ordinance when both Houses are not in session, so it can be issued when only one House is in session. 3 is correct: an ordinance must be laid before both Houses and ceases to operate six weeks after Parliament reassembles unless approved earlier.',
      hint: 'The bar is "except when both Houses are in session".',
    },
    `${C} (Ordinance-making power of the President)`,
    [
      'An ordinance can be issued to amend the Constitution.',
      'An ordinance can be promulgated when only one House of Parliament is in session.',
      'An ordinance ceases to operate at the expiry of six weeks from the reassembly of Parliament unless approved earlier.',
    ],
    '2 and 3 only',
    ['1 and 2 only', '3 only', '1, 2 and 3'],
  ),
  ar(
    {
      id: 'svg-pol-049',
      topic: T.ej,
      explanation:
        'A is true: Article 61 provides that the President can be impeached for "violation of the Constitution". R is false: the impeachment resolution must be passed by a majority of not less than two-thirds of the total membership of each House, not a simple majority of those present and voting.',
      hint: 'Impeachment needs a heavier majority than any ordinary motion.',
    },
    'The President of India can be impeached for violation of the Constitution.',
    'The impeachment resolution must be passed by a simple majority of members present and voting in each House.',
    2,
  ),
  ar(
    {
      id: 'svg-pol-050',
      topic: T.ej,
      explanation:
        'A is false: the Chief Minister is appointed by the Governor, not the President. R is true: Article 164(1) provides that the Chief Minister shall be appointed by the Governor and other ministers on the CM’s advice.',
      hint: 'Read Article 164 for States, Article 75 for the Union.',
    },
    'The Chief Minister of a State is appointed by the President of India.',
    'Article 164 provides that the Chief Minister shall be appointed by the Governor.',
    3,
  ),
  ar(
    {
      id: 'svg-pol-051',
      topic: T.cf,
      explanation:
        'A is true: Fundamental Duties under Article 51A are non-justiciable. R is true and explains A: the Constitution does not provide for their direct enforcement by courts or any sanction for their violation; Parliament may enforce them only through suitable legislation.',
      hint: 'Ask whether R gives the reason the duties cannot be enforced.',
    },
    'Fundamental Duties are non-justiciable in nature.',
    'The Constitution does not provide for their direct enforcement by the courts.',
    0,
  ),
  single(
    {
      id: 'svg-pol-052',
      topic: T.pf,
      explanation:
        'Zero Hour is not mentioned in the Rules of Procedure; it is an Indian parliamentary innovation, the time immediately after Question Hour. Adjournment motion, calling attention motion and no-confidence motion are all provided for in the Rules of Procedure of the Lok Sabha.',
      hint: 'The informal device follows Question Hour.',
    },
    'Which one of the following parliamentary devices is NOT mentioned in the Rules of Procedure of the Lok Sabha?',
    'Zero Hour',
    ['Adjournment motion', 'Calling attention motion', 'No-confidence motion'],
  ),
  ms(
    {
      id: 'svg-pol-053',
      topic: T.pf,
      explanation:
        '1 is incorrect: a no-confidence motion can be moved only in the Lok Sabha, since the Council of Ministers is collectively responsible to the Lok Sabha (Article 75(3)). 2 is correct: it needs the support of at least 50 members for admission. 3 is correct: it need not state reasons, unlike a censure motion.',
      hint: 'Censure motions need reasons; this one does not.',
    },
    `${C} (No-confidence motion)`,
    [
      'It can be moved in either House of Parliament.',
      'It requires the support of at least 50 members to be admitted.',
      'It need not state the reasons for its adoption.',
    ],
    '2 and 3 only',
    ['1 and 2 only', '2 only', '1, 2 and 3'],
  ),
  // ───────────────────────── Economy: Banking and public finance ─────────────────────────
  ms(
    {
      id: 'svg-eco-001',
      topic: T.bank,
      explanation:
        '1 is correct: a higher Cash Reserve Ratio locks more deposits with the RBI and reduces banks’ lendable resources. 2 is incorrect: SLR assets (cash, gold, approved securities) are maintained by banks themselves, not deposited with the RBI; it is CRR that is kept with the RBI. 3 is correct: repo rate is the rate at which the RBI lends short-term funds to banks against government securities.',
      hint: 'One reserve sits with the RBI, the other stays in the bank’s own books.',
    },
    `${C} (Monetary policy instruments)`,
    [
      'An increase in the Cash Reserve Ratio reduces the lendable resources of commercial banks.',
      'Assets held under the Statutory Liquidity Ratio are deposited with the Reserve Bank of India.',
      'Repo rate is the rate at which the RBI lends short-term funds to banks against government securities.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '2 and 3 only', '1, 2 and 3'],
  ),
  match(
    {
      id: 'svg-eco-002',
      topic: T.bank,
      explanation:
        'Repo rate is RBI lending to banks against government securities (A-4). Reverse repo rate is RBI borrowing from (absorbing liquidity from) banks (B-1). Bank rate is the rate at which RBI buys or rediscounts bills of exchange and other commercial paper (C-2). Marginal Standing Facility lets banks borrow overnight by dipping into their SLR portfolio beyond the regular window (D-3).',
      hint: 'Only one of these allows dipping into the SLR holding.',
    },
    ['Repo rate', 'Reverse repo rate', 'Bank rate', 'Marginal Standing Facility'],
    [
      'Rate at which RBI borrows from banks',
      'Rate at which RBI rediscounts bills of exchange',
      'Overnight borrowing by banks by dipping into their SLR securities',
      'Rate at which RBI lends to banks against government securities',
    ],
    'A-4, B-1, C-2, D-3',
    ['A-1, B-4, C-2, D-3', 'A-4, B-1, C-3, D-2', 'A-3, B-1, C-2, D-4'],
  ),
  ms(
    {
      id: 'svg-eco-003',
      topic: T.bank,
      explanation:
        '1 is correct: the Monetary Policy Committee was given a statutory basis by amending the RBI Act, 1934 (through the Finance Act, 2016). 2 is correct: it has six members, three from the RBI including the Governor and three appointed by the Central Government. 3 is correct: the Governor has a casting vote in case of a tie. 4 is incorrect: the inflation target is set by the Central Government in consultation with the RBI, not by the RBI alone.',
      hint: 'The target is fixed by the Government; the MPC then sets the policy rate.',
      seconds: 120,
    },
    `${C} (Monetary Policy Committee)`,
    [
      'It is a statutory body under the Reserve Bank of India Act, 1934.',
      'It consists of six members, three of whom are from the RBI including the Governor.',
      'The Governor of the RBI has a casting vote in case of a tie.',
      'The inflation target is fixed by the RBI on its own.',
    ],
    '1, 2 and 3 only',
    ['1 and 2 only', '2, 3 and 4 only', '1, 2, 3 and 4'],
  ),
  ar(
    {
      id: 'svg-eco-004',
      topic: T.bank,
      explanation:
        'A is true: an open market sale of government securities by the RBI reduces liquidity in the banking system. R is true and explains A: banks and others pay for the securities from their reserves, so money moves out of the system to the RBI.',
      hint: 'Follow the money when the RBI sells.',
    },
    'An open market sale of government securities by the RBI reduces liquidity in the economy.',
    'Buyers pay the RBI for the securities, which drains reserves from the banking system.',
    0,
  ),
  ar(
    {
      id: 'svg-eco-005',
      topic: T.macro,
      explanation:
        'A is true: raising the repo rate is a standard tool to check demand-pull inflation. R is true and explains A: a higher policy rate raises borrowing costs, reduces credit-financed spending and so lowers aggregate demand.',
      hint: 'Demand-pull inflation responds to the cost of credit.',
    },
    'Demand-pull inflation can be checked by raising the repo rate.',
    'A higher repo rate raises the cost of borrowing and reduces aggregate demand.',
    0,
  ),
  ms(
    {
      id: 'svg-eco-006',
      topic: T.bank,
      explanation:
        '1 is correct: payments banks can accept demand deposits (savings and current accounts). 2 is incorrect: they cannot issue credit cards. 3 is correct: they can issue ATM/debit cards. 4 is incorrect: payments banks cannot undertake lending activities.',
      hint: 'A payments bank may hold your money but may not lend it.',
      seconds: 110,
    },
    `${C} (Payments banks in India)`,
    [
      'They can accept demand deposits.',
      'They can issue credit cards.',
      'They can issue ATM/debit cards.',
      'They can undertake lending activities.',
    ],
    '1 and 3 only',
    ['1, 2 and 3 only', '1 and 4 only', '2 and 4 only'],
  ),
  single(
    {
      id: 'svg-eco-007',
      topic: T.bank,
      explanation:
        'The Reserve Bank of India was nationalised in 1949; the State Bank of India was created in 1955 from the Imperial Bank of India; 14 major commercial banks were nationalised in 1969; Regional Rural Banks were set up in 1975. Correct order: 2, 4, 1, 3.',
      hint: 'The central bank was nationalised soon after Independence.',
    },
    'Arrange the following events in chronological order:\n1. Nationalisation of 14 major commercial banks\n2. Nationalisation of the Reserve Bank of India\n3. Establishment of Regional Rural Banks\n4. Creation of the State Bank of India',
    '2, 4, 1, 3',
    ['4, 2, 1, 3', '2, 4, 3, 1', '2, 1, 4, 3'],
  ),
  match(
    {
      id: 'svg-eco-008',
      topic: T.bank,
      explanation:
        'NABARD is the apex institution for agriculture and rural development credit (A-3). SIDBI is the principal institution for financing and development of micro, small and medium enterprises (B-1). National Housing Bank refinances housing finance institutions (C-4). EXIM Bank finances and promotes India’s foreign trade (D-2).',
      hint: 'Match each acronym to its sector: rural, small industry, housing, trade.',
    },
    ['NABARD', 'SIDBI', 'National Housing Bank', 'EXIM Bank'],
    ['Micro, small and medium enterprises', 'Foreign trade finance', 'Agriculture and rural credit', 'Refinance for housing finance institutions'],
    'A-3, B-1, C-4, D-2',
    ['A-1, B-3, C-4, D-2', 'A-3, B-1, C-2, D-4', 'A-3, B-4, C-1, D-2'],
  ),
  howMany(
    {
      id: 'svg-eco-009',
      topic: T.bank,
      explanation:
        '1 is correct: a term loan becomes a Non-Performing Asset when interest or instalment remains overdue for more than 90 days. 2 is correct: the SARFAESI Act, 2002 allows secured creditors to enforce security interest without intervention of courts. 3 is incorrect: the Insolvency and Bankruptcy Code was enacted in 2016, not 2012. So only two are correct.',
      hint: 'The bankruptcy code came in the same year as demonetisation.',
    },
    `${C} (Stressed assets)`,
    [
      'A term loan becomes a Non-Performing Asset if interest or instalment remains overdue for more than 90 days.',
      'The SARFAESI Act, 2002 enables banks to enforce security interest without the intervention of courts.',
      'The Insolvency and Bankruptcy Code was enacted in 2012.',
    ],
    1,
  ),
  ms(
    {
      id: 'svg-eco-010',
      topic: T.bank,
      explanation:
        '1 is correct: M1 (narrow money) = currency with the public + demand deposits with banks + other deposits with the RBI. 2 is correct: M3 (broad money) = M1 + time deposits with banks. 3 is correct: M2 and M4 add post office savings deposits (M2) and total post office deposits (M4). 4 is incorrect: M1 is the most liquid measure and M4 the least liquid.',
      hint: 'Liquidity falls as you move from M1 to M4.',
      seconds: 120,
    },
    `${C} (Measures of money supply in India)`,
    [
      'M1 is called narrow money and M3 is called broad money.',
      'M3 includes time deposits with banks.',
      'M2 and M4 include deposits with post office savings banks.',
      'M4 is the most liquid measure of money supply.',
    ],
    '1, 2 and 3 only',
    ['1 and 2 only', '2, 3 and 4 only', '1, 3 and 4 only'],
  ),
  ms(
    {
      id: 'svg-eco-011',
      topic: T.bank,
      explanation:
        '1 is correct: Fiscal deficit = Total expenditure − (Revenue receipts + non-debt capital receipts); it equals the government’s borrowing requirement. 2 is incorrect: Primary deficit = Fiscal deficit − interest payments (not plus). 3 is correct: Revenue deficit = Revenue expenditure − Revenue receipts. 4 is correct: Effective revenue deficit = Revenue deficit − grants for creation of capital assets.',
      hint: 'Primary deficit removes the burden of past borrowing.',
      seconds: 120,
    },
    `${C} (Deficit measures)`,
    [
      'Fiscal deficit = Total expenditure − (Revenue receipts + Non-debt capital receipts).',
      'Primary deficit = Fiscal deficit + Interest payments.',
      'Revenue deficit = Revenue expenditure − Revenue receipts.',
      'Effective revenue deficit = Revenue deficit − Grants for creation of capital assets.',
    ],
    '1, 3 and 4 only',
    ['1 and 3 only', '1, 2 and 3 only', '1, 2, 3 and 4'],
  ),
  single(
    {
      id: 'svg-eco-012',
      topic: T.bank,
      explanation:
        'GST subsumed central excise duty (except on specified goods such as petroleum and tobacco), service tax and State VAT. Basic customs duty on imports was not subsumed in GST; only the additional duties of customs (CVD and SAD) were replaced by IGST.',
      hint: 'Imports still attract one levy outside GST.',
    },
    'Which one of the following taxes was NOT subsumed in the Goods and Services Tax?',
    'Basic customs duty',
    ['Service tax', 'Value Added Tax levied by States', 'Countervailing duty (additional duty of customs)'],
  ),
  ms(
    {
      id: 'svg-eco-013',
      topic: T.bank,
      explanation:
        '1 is correct: GST was introduced by the 101st Constitutional Amendment Act, 2016. 2 is incorrect: the GST Council under Article 279A is chaired by the Union Finance Minister, not the Prime Minister. 3 is correct: alcoholic liquor for human consumption is outside GST by the constitutional definition of GST.',
      hint: 'The Council is a Centre-States forum led by a Union Minister.',
    },
    `${C} (Goods and Services Tax)`,
    [
      'GST was introduced through the 101st Constitutional Amendment Act, 2016.',
      'The GST Council is chaired by the Prime Minister.',
      'Alcoholic liquor for human consumption is kept outside the purview of GST.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '1 only', '1, 2 and 3'],
  ),
  match(
    {
      id: 'svg-eco-014',
      topic: T.bank,
      explanation:
        'Article 266(1) constitutes the Consolidated Fund of India (A-2). Article 266(2) constitutes the Public Account of India (B-3). Article 267 provides for the Contingency Fund (C-4). Article 112 deals with the Annual Financial Statement (D-1).',
      hint: 'Both main funds share one Article with different clauses.',
    },
    ['Article 266(1)', 'Article 266(2)', 'Article 267', 'Article 112'],
    ['Annual Financial Statement', 'Consolidated Fund of India', 'Public Account of India', 'Contingency Fund of India'],
    'A-2, B-3, C-4, D-1',
    ['A-3, B-2, C-4, D-1', 'A-2, B-3, C-1, D-4', 'A-2, B-4, C-3, D-1'],
  ),
  ms(
    {
      id: 'svg-eco-015',
      topic: T.bank,
      explanation:
        '1 is correct: borrowings create a liability and are capital receipts. 2 is incorrect: recovery of loans reduces an asset and is a (non-debt) capital receipt, not a revenue receipt. 3 is correct: interest received on loans given by the government is a non-tax revenue receipt.',
      hint: 'Interest on a loan and repayment of the loan are classified differently.',
    },
    `${C} (Government receipts)`,
    [
      'Market borrowings by the government are capital receipts.',
      'Recovery of loans given by the government is a revenue receipt.',
      'Interest received on loans given by the government is a revenue receipt.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '2 and 3 only', '3 only'],
  ),
  single(
    {
      id: 'svg-eco-016',
      topic: T.bank,
      explanation:
        'Dividends and profits from public sector undertakings are non-tax revenue receipts. Disinvestment proceeds and recovery of loans are non-debt capital receipts, not revenue receipts. Corporation tax is a tax revenue receipt.',
      hint: 'Sale of a stake is capital; a payout on a stake is revenue.',
    },
    'Which one of the following is a non-tax REVENUE receipt of the Union Government?',
    'Dividends and profits from public sector undertakings',
    ['Disinvestment proceeds', 'Recovery of loans from States', 'Corporation tax'],
  ),
  ms(
    {
      id: 'svg-eco-017',
      topic: T.bank,
      explanation:
        '1 is correct: the FRBM Act was enacted in 2003. 2 is incorrect: fiscal targets are statutory (in the FRBM Act), not written into the Constitution. 3 is correct: the FRBM framework was reviewed by a committee headed by N.K. Singh (report 2017).',
      hint: 'Fiscal rules in India are statutory, not constitutional.',
    },
    `${C} (Fiscal responsibility)`,
    [
      'The Fiscal Responsibility and Budget Management Act was enacted in 2003.',
      'The FRBM targets for fiscal deficit are laid down in the Constitution of India.',
      'A committee headed by N.K. Singh reviewed the FRBM framework.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '1 only', '1, 2 and 3'],
  ),
  howMany(
    {
      id: 'svg-eco-018',
      topic: T.bank,
      explanation:
        '1 is correct: SEBI was given statutory powers by the SEBI Act, 1992. 2 is correct: PFRDA regulates the National Pension System. 3 is incorrect: chit funds are regulated by State Governments under the Chit Funds Act, 1982, not by IRDAI, which regulates insurance. So only two are correct.',
      hint: 'Chit funds fall under State registrars.',
    },
    `${C} (Financial regulators)`,
    [
      'SEBI was given statutory status in 1992.',
      'PFRDA regulates the National Pension System.',
      'Chit funds are regulated by IRDAI.',
    ],
    1,
  ),
  two(
    {
      id: 'svg-eco-019',
      topic: T.bank,
      explanation:
        '1 is correct: an income tax with rising slab rates takes a larger share of higher incomes, so it is progressive. 2 is correct: indirect taxes at uniform rates take a larger share of a poor household’s income, so they are generally regressive in effect.',
      hint: 'Judge by the share of income paid, not the rupee amount.',
    },
    `${C} (Nature of taxes)`,
    [
      'An income tax with rising slab rates is a progressive tax.',
      'Indirect taxes levied at uniform rates on consumption are generally regressive in effect.',
    ],
    2,
  ),
  // ───────────────────────── Economy: Macroeconomics ─────────────────────────
  howMany(
    {
      id: 'svg-eco-020',
      topic: T.macro,
      explanation:
        '1 is correct: GDP at market prices = GDP at factor cost + indirect taxes − subsidies. 2 is correct: NNP = GNP − depreciation. 3 is correct: GNP = GDP + net factor income from abroad. 4 is incorrect: GNP exceeds GDP only when net factor income from abroad is positive; when it is negative (as is usual for India), GNP is less than GDP. So only three are correct.',
      hint: 'The sign of net factor income from abroad decides the last one.',
      seconds: 120,
    },
    `${C} (National income aggregates)`,
    [
      'GDP at market prices = GDP at factor cost + Indirect taxes − Subsidies.',
      'NNP = GNP − Depreciation.',
      'GNP = GDP + Net factor income from abroad.',
      'GNP is always greater than GDP.',
    ],
    2,
  ),
  single(
    {
      id: 'svg-eco-021',
      topic: T.macro,
      explanation:
        'Unpaid household services of a homemaker are not included in GDP. Imputed rent of owner-occupied houses and farm produce retained for self-consumption are included by convention. Depreciation is included in Gross Domestic Product (it is deducted only to arrive at Net Domestic Product).',
      hint: 'GDP counts some non-market items, but not this one.',
    },
    'Which one of the following is NOT included in the estimation of India’s GDP?',
    'Services of a homemaker within her own household',
    ['Imputed rent of owner-occupied houses', 'Farm produce retained by farmers for self-consumption', 'Depreciation of fixed capital'],
  ),
  ms(
    {
      id: 'svg-eco-022',
      topic: T.macro,
      explanation:
        '1 is incorrect: during disinflation prices still rise, only more slowly; the price level does not fall. 2 is correct: disinflation is a fall in the rate of inflation. 3 is correct: deflation is a fall in the general price level, i.e. a negative rate of inflation.',
      hint: 'A falling speedometer still means forward motion.',
    },
    C,
    [
      'During disinflation the general price level falls.',
      'Disinflation refers to a decline in the rate of inflation.',
      'Deflation refers to a sustained fall in the general price level.',
    ],
    '2 and 3 only',
    ['1 and 2 only', '1 and 3 only', '3 only'],
  ),
  ms(
    {
      id: 'svg-eco-023',
      topic: T.macro,
      explanation:
        '1 is correct: CPI (Combined) headline inflation is the measure used for the flexible inflation target of the RBI. 2 is incorrect: WPI covers only goods; it does not include services. 3 is correct: WPI is compiled by the Office of the Economic Adviser, DPIIT, Ministry of Commerce and Industry.',
      hint: 'Wholesale prices are for goods traded in bulk.',
    },
    `${C} (Price indices in India)`,
    [
      'The RBI uses CPI (Combined) headline inflation for its inflation target.',
      'The Wholesale Price Index includes prices of services.',
      'The WPI is released by the Office of the Economic Adviser under the Ministry of Commerce and Industry.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '2 and 3 only', '1, 2 and 3'],
  ),
  two(
    {
      id: 'svg-eco-024',
      topic: T.macro,
      explanation:
        '1 is correct: stagflation is a situation of high inflation together with stagnant growth and high unemployment. 2 is correct: the (short-run) Phillips curve shows an inverse relationship between the rate of unemployment and the rate of inflation.',
      hint: 'Stagflation is the case the simple Phillips curve could not explain.',
    },
    C,
    [
      'Stagflation is a situation of high inflation along with stagnant output and high unemployment.',
      'The short-run Phillips curve shows an inverse relationship between unemployment and inflation.',
    ],
    2,
  ),
  ms(
    {
      id: 'svg-eco-025',
      topic: T.macro,
      explanation:
        '1 is correct: the current account records trade in goods and services, primary income and transfers such as remittances. 2 is correct: FDI is a capital account (financial account) flow. 3 is incorrect: a trade deficit does not necessarily mean a current account deficit, since a surplus in services and remittances can offset it.',
      hint: 'Invisibles can cover a merchandise gap.',
    },
    `${C} (Balance of payments)`,
    [
      'Remittances from Indians working abroad are recorded in the current account.',
      'Foreign Direct Investment is recorded in the capital account.',
      'A deficit in merchandise trade necessarily results in a current account deficit.',
    ],
    '1 and 2 only',
    ['2 only', '2 and 3 only', '1, 2 and 3'],
  ),
  howMany(
    {
      id: 'svg-eco-026',
      topic: T.macro,
      explanation:
        '1 is correct: the rupee was made fully convertible on the current account in 1994 (India accepted IMF Article VIII). 2 is correct: capital account convertibility is only partial. 3 is incorrect: the rupee is not fully convertible on the capital account. So only two are correct.',
      hint: 'Trade-related transactions were freed first, in the mid-1990s.',
    },
    `${C} (Convertibility of the rupee)`,
    [
      'The rupee is fully convertible on the current account.',
      'The rupee is partially convertible on the capital account.',
      'The rupee has been fully convertible on the capital account since 1994.',
    ],
    1,
  ),
  match(
    {
      id: 'svg-eco-027',
      topic: T.macro,
      explanation:
        'Laffer curve relates tax rates to tax revenue (A-2). Phillips curve relates inflation and unemployment (B-4). Engel’s law says the share of income spent on food falls as income rises (C-1). Gresham’s law says bad money drives out good money (D-3).',
      hint: 'One concept is about coins, one about food budgets.',
    },
    ['Laffer curve', 'Phillips curve', 'Engel’s law', 'Gresham’s law'],
    ['Share of food in expenditure falls as income rises', 'Tax rate and tax revenue', 'Bad money drives out good money', 'Inflation and unemployment'],
    'A-2, B-4, C-1, D-3',
    ['A-4, B-2, C-1, D-3', 'A-2, B-4, C-3, D-1', 'A-2, B-1, C-4, D-3'],
  ),
  two(
    {
      id: 'svg-eco-028',
      topic: T.macro,
      explanation:
        '1 is incorrect: a Gini coefficient of 0 indicates perfect equality; 1 indicates perfect inequality. 2 is incorrect: the closer the Lorenz curve lies to the line of equality, the lower (not greater) the inequality; inequality grows as the curve moves away from that line.',
      hint: 'Zero area between the curve and the diagonal means zero inequality.',
    },
    `${C} (Measuring inequality)`,
    [
      'A Gini coefficient of 1 indicates perfect equality of income.',
      'The closer the Lorenz curve is to the line of equality, the greater the inequality.',
    ],
    3,
  ),
  match(
    {
      id: 'svg-eco-029',
      topic: T.macro,
      explanation:
        'The First Plan (1951-56) gave priority to agriculture and was based on the Harrod-Domar model (A-3). The Second Plan (1956-61) followed the Mahalanobis model with emphasis on heavy industry (B-1). The Fourth Plan (1969-74) aimed at "growth with stability and progressive achievement of self-reliance" (C-4). The Fifth Plan (1974-79) emphasised removal of poverty (Garibi Hatao) and self-reliance (D-2).',
      hint: 'The plan after the Plan Holiday spoke of stability.',
    },
    ['First Five Year Plan', 'Second Five Year Plan', 'Fourth Five Year Plan', 'Fifth Five Year Plan'],
    ['Mahalanobis model and heavy industry', 'Removal of poverty (Garibi Hatao)', 'Priority to agriculture', 'Growth with stability and self-reliance'],
    'A-3, B-1, C-4, D-2',
    ['A-1, B-3, C-4, D-2', 'A-3, B-1, C-2, D-4', 'A-3, B-4, C-1, D-2'],
  ),
  ms(
    {
      id: 'svg-eco-030',
      topic: T.macro,
      explanation:
        '1 is incorrect: the National Development Council was an extra-constitutional and non-statutory body set up by an executive resolution in 1952. 2 is correct: the Planning Commission was set up in March 1950 by a resolution of the Union Cabinet. 3 is correct: NITI Aayog replaced the Planning Commission from 1 January 2015.',
      hint: 'Neither planning body was named in the Constitution.',
    },
    `${C} (Planning institutions)`,
    [
      'The National Development Council was a constitutional body.',
      'The Planning Commission was set up in 1950 by a resolution of the Union Cabinet.',
      'NITI Aayog replaced the Planning Commission in 2015.',
    ],
    '2 and 3 only',
    ['1 and 2 only', '3 only', '1, 2 and 3'],
  ),
  single(
    {
      id: 'svg-eco-031',
      topic: T.macro,
      explanation:
        'Cost-push inflation arises from a rise in production costs such as wages or input prices (e.g. a crude oil price shock). An increase in government spending, a cut in income tax and an expansion of bank credit all raise aggregate demand and so cause demand-pull pressure.',
      hint: 'Look for the supply-side shock.',
    },
    'Which one of the following is most likely to cause COST-PUSH inflation?',
    'A sharp rise in the international price of crude oil',
    ['A large increase in government expenditure', 'A reduction in personal income tax rates', 'A rapid expansion of bank credit to consumers'],
  ),
  ar(
    {
      id: 'svg-eco-032',
      topic: T.macro,
      explanation:
        'A is true: a fiscal deficit indicates the total borrowing requirement of the government. R is false: interest payments are a part of revenue expenditure, not capital expenditure.',
      hint: 'Interest is a recurring cost that creates no asset.',
    },
    'Fiscal deficit indicates the total borrowing requirement of the government.',
    'Interest payments are classified as capital expenditure in the Union Budget.',
    2,
  ),
  single(
    {
      id: 'svg-eco-033',
      topic: T.macro,
      explanation:
        'In India the "Plan Holiday" covered 1966-69, when three Annual Plans were implemented after the Third Plan (1961-66) owing to the wars and droughts. The Fourth Plan began in 1969.',
      hint: 'It followed the 1965 war and the drought years.',
    },
    'The period of "Plan Holiday" in India, when Annual Plans were implemented instead of a Five Year Plan, was:',
    '1966-69',
    ['1956-58', '1971-73', '1961-63'],
  ),
  // ───────────────────────── Science: Physics and chemistry ─────────────────────────
  ms(
    {
      id: 'svg-sci-001',
      topic: T.pc,
      explanation:
        '1 is correct: sound is a mechanical wave and needs a medium, so it cannot travel through vacuum. 2 is incorrect: sound travels faster in solids such as steel than in air. 3 is correct: the speed of sound in air increases with temperature.',
      hint: 'Particles packed more tightly pass the vibration on faster.',
    },
    `${C} (Sound)`,
    [
      'Sound cannot travel through vacuum.',
      'Sound travels faster in air than in steel.',
      'The speed of sound in air increases with rise in temperature.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '2 and 3 only', '1, 2 and 3'],
  ),
  howMany(
    {
      id: 'svg-sci-002',
      topic: T.pc,
      explanation:
        '1 is correct: the sky appears blue because shorter (blue) wavelengths are scattered more by air molecules (Rayleigh scattering). 2 is correct: at sunrise and sunset light travels a longer path, most blue light is scattered away and red reaches the eye. 3 is incorrect: red is used for danger signals because it is scattered the least and so is visible from far. So only two are correct.',
      hint: 'Longest visible wavelength, least scattering.',
    },
    `${C} (Scattering of light)`,
    [
      'The blue colour of the clear sky is due to scattering of light by air molecules.',
      'The Sun appears reddish at sunset because the blue component is scattered away along the longer path.',
      'Danger signals are red because red light is scattered the most by fog and smoke.',
    ],
    1,
  ),
  match(
    {
      id: 'svg-sci-003',
      topic: T.pc,
      explanation:
        'Optical fibres work on total internal reflection (A-2). A hydraulic press works on Pascal’s law (B-4). Rocket propulsion is based on Newton’s third law and conservation of momentum (C-1). A transformer works on electromagnetic (mutual) induction (D-3).',
      hint: 'A transformer needs changing magnetic flux.',
    },
    ['Optical fibre', 'Hydraulic press', 'Rocket propulsion', 'Transformer'],
    ['Newton’s third law of motion', 'Total internal reflection', 'Electromagnetic induction', 'Pascal’s law'],
    'A-2, B-4, C-1, D-3',
    ['A-4, B-2, C-1, D-3', 'A-2, B-4, C-3, D-1', 'A-2, B-1, C-4, D-3'],
  ),
  match(
    {
      id: 'svg-sci-004',
      topic: T.pc,
      explanation:
        'Pascal is the SI unit of pressure (A-3). Tesla is the SI unit of magnetic flux density (magnetic field) (B-1). Weber is the SI unit of magnetic flux (C-4). Henry is the SI unit of inductance (D-2).',
      hint: 'Flux and flux density are different quantities with different units.',
    },
    ['Pascal', 'Tesla', 'Weber', 'Henry'],
    ['Magnetic flux density', 'Inductance', 'Pressure', 'Magnetic flux'],
    'A-3, B-1, C-4, D-2',
    ['A-3, B-4, C-1, D-2', 'A-3, B-1, C-2, D-4', 'A-1, B-3, C-4, D-2'],
  ),
  ar(
    {
      id: 'svg-sci-005',
      topic: T.pc,
      explanation:
        'A is true: a body in uniform circular motion has constant speed but is accelerated (centripetal acceleration towards the centre). R is true and explains A: velocity is a vector, and its direction changes continuously, so velocity changes.',
      hint: 'Acceleration is change of velocity, not only of speed.',
    },
    'A body moving in a circle with uniform speed is accelerated.',
    'The direction of its velocity changes continuously.',
    0,
  ),
  ms(
    {
      id: 'svg-sci-006',
      topic: T.pc,
      explanation:
        '1 is correct: a fuse wire is made of a material of low melting point so that it melts on excess current. 2 is incorrect: a fuse is connected in series with the live wire, not in parallel; in parallel it would not interrupt the circuit. 3 is correct: the earth wire is connected to the metallic body of the appliance so leakage current flows to the earth.',
      hint: 'A safety device must carry the whole current to break it.',
    },
    `${C} (Domestic electric circuits)`,
    [
      'A fuse wire is made of a material with a low melting point.',
      'A fuse is connected in parallel with the appliance it protects.',
      'The earth wire is connected to the metallic body of an appliance.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '3 only', '1, 2 and 3'],
  ),
  single(
    {
      id: 'svg-sci-007',
      topic: T.pc,
      explanation:
        'Work is a scalar (the dot product of force and displacement). Momentum, impulse and torque are vector quantities.',
      hint: 'One of these is a dot product.',
    },
    'Which one of the following is a scalar quantity?',
    'Work',
    ['Momentum', 'Torque', 'Impulse'],
  ),
  ms(
    {
      id: 'svg-sci-008',
      topic: T.pc,
      explanation:
        '1 is correct: nuclear power reactors use controlled nuclear fission. 2 is correct: the Sun’s energy comes from fusion of hydrogen into helium. 3 is correct: heavy water is used as a moderator, for example in Indian PHWRs. 4 is incorrect: cadmium or boron rods are control rods that absorb neutrons; they are not moderators, which slow neutrons down.',
      hint: 'A moderator slows neutrons; a control rod swallows them.',
      seconds: 110,
    },
    `${C} (Nuclear energy)`,
    [
      'Nuclear power reactors work on controlled nuclear fission.',
      'The energy of the Sun is produced mainly by nuclear fusion.',
      'Heavy water is used as a moderator in some nuclear reactors.',
      'Cadmium rods are used as moderators to slow down neutrons.',
    ],
    '1, 2 and 3 only',
    ['1 and 2 only', '2, 3 and 4 only', '1, 2, 3 and 4'],
  ),
  match(
    {
      id: 'svg-sci-009',
      topic: T.pc,
      explanation:
        'Baking soda is sodium hydrogen carbonate, NaHCO₃ (A-4). Washing soda is sodium carbonate decahydrate, Na₂CO₃·10H₂O (B-1). Plaster of Paris is calcium sulphate hemihydrate, CaSO₄·½H₂O (C-2). Bleaching powder is calcium oxychloride, CaOCl₂ (D-3).',
      hint: 'Gypsum loses water to become one of these.',
    },
    ['Baking soda', 'Washing soda', 'Plaster of Paris', 'Bleaching powder'],
    ['Sodium carbonate decahydrate', 'Calcium sulphate hemihydrate', 'Calcium oxychloride', 'Sodium hydrogen carbonate'],
    'A-4, B-1, C-2, D-3',
    ['A-1, B-4, C-2, D-3', 'A-4, B-1, C-3, D-2', 'A-1, B-4, C-3, D-2'],
  ),
  howMany(
    {
      id: 'svg-sci-010',
      topic: T.pc,
      explanation:
        '1 is correct: pure water at 25 °C has pH 7. 2 is correct: human blood is slightly alkaline, with pH about 7.4. 3 is correct: tooth enamel starts to corrode when the pH in the mouth falls below about 5.5. 4 is incorrect: gastric juice contains hydrochloric acid and is strongly acidic (pH well below 7). So only three are correct.',
      hint: 'The stomach is the most acidic place in the list.',
      seconds: 110,
    },
    `${C} (pH in daily life)`,
    [
      'The pH of pure water at 25 °C is 7.',
      'Human blood is slightly alkaline.',
      'Tooth decay starts when the pH in the mouth falls below about 5.5.',
      'Gastric juice has a pH greater than 7.',
    ],
    2,
  ),
  ms(
    {
      id: 'svg-sci-011',
      topic: T.pc,
      explanation:
        '1 is correct: mercury is a metal that is liquid at room temperature. 2 is correct: gallium has a melting point of about 30 °C and melts on the palm. 3 is incorrect: sodium reacts vigorously with water and is stored under kerosene. 4 is correct: white phosphorus catches fire in air and is stored under water.',
      hint: 'One element is kept away from water, another inside it.',
      seconds: 110,
    },
    `${C} (Properties of elements)`,
    [
      'Mercury is a metal that is liquid at room temperature.',
      'Gallium can melt on the palm of the hand.',
      'Sodium is stored under water to prevent its reaction with air.',
      'White phosphorus is stored under water.',
    ],
    '1, 2 and 4 only',
    ['1 and 2 only', '2, 3 and 4 only', '1, 2, 3 and 4'],
  ),
  ms(
    {
      id: 'svg-sci-012',
      topic: T.pc,
      explanation:
        '1 is incorrect: diamond is a non-conductor of electricity because all four valence electrons of each carbon are used in bonding. 2 is correct: graphite conducts electricity because each carbon has one free (delocalised) electron. 3 is correct: fullerenes such as C₆₀ are allotropes of carbon.',
      hint: 'Free electrons exist only in the layered allotrope.',
    },
    `${C} (Allotropes of carbon)`,
    [
      'Diamond is a good conductor of electricity.',
      'Graphite is a good conductor of electricity.',
      'Fullerene C₆₀ is an allotrope of carbon.',
    ],
    '2 and 3 only',
    ['1 and 2 only', '1 and 3 only', '1, 2 and 3'],
  ),
  match(
    {
      id: 'svg-sci-013',
      topic: T.pc,
      explanation:
        'Laughing gas is nitrous oxide, N₂O (A-3). Marsh gas is methane, CH₄ (B-1). Dry ice is solid carbon dioxide (C-4). The 1984 Bhopal gas tragedy was caused by methyl isocyanate (D-2).',
      hint: 'Marsh gas forms from decaying organic matter in swamps.',
    },
    ['Laughing gas', 'Marsh gas', 'Dry ice', 'Gas leaked in the Bhopal tragedy'],
    ['Methane', 'Methyl isocyanate', 'Nitrous oxide', 'Solid carbon dioxide'],
    'A-3, B-1, C-4, D-2',
    ['A-1, B-3, C-4, D-2', 'A-3, B-1, C-2, D-4', 'A-4, B-1, C-3, D-2'],
  ),
  match(
    {
      id: 'svg-sci-014',
      topic: T.pc,
      explanation:
        'Vinegar contains acetic acid (A-2). Ant sting contains methanoic (formic) acid (B-4). Tomato contains oxalic acid (C-1). Curd/sour milk contains lactic acid (D-3).',
      hint: 'Formic acid takes its name from the Latin for ant.',
    },
    ['Vinegar', 'Ant sting', 'Tomato', 'Curd'],
    ['Oxalic acid', 'Acetic acid', 'Lactic acid', 'Methanoic acid'],
    'A-2, B-4, C-1, D-3',
    ['A-4, B-2, C-1, D-3', 'A-2, B-4, C-3, D-1', 'A-2, B-1, C-4, D-3'],
  ),
  ar(
    {
      id: 'svg-sci-015',
      topic: T.pc,
      explanation:
        'A is true: hard water does not readily form lather with soap. R is true and explains A: calcium and magnesium ions react with soap to form an insoluble precipitate (scum), consuming the soap.',
      hint: 'Where does the soap go in hard water?',
    },
    'Hard water does not form lather easily with soap.',
    'Calcium and magnesium salts in hard water react with soap to form an insoluble scum.',
    0,
  ),
  single(
    {
      id: 'svg-sci-016',
      topic: T.pc,
      explanation:
        'Electrolysis of water produces new substances, hydrogen and oxygen, so it is a chemical change. Crystallisation of copper sulphate, magnetisation of iron and formation of dew are physical changes in which no new substance is formed.',
      hint: 'Ask in which case a new substance appears.',
    },
    'Which one of the following is a chemical change?',
    'Electrolysis of water',
    ['Crystallisation of copper sulphate from its solution', 'Magnetisation of an iron bar', 'Formation of dew'],
  ),
  ms(
    {
      id: 'svg-sci-017',
      topic: T.pc,
      explanation:
        '1 is incorrect: at higher altitudes atmospheric pressure is lower, so water boils at a lower temperature. 2 is correct: water has a high specific heat capacity, which is why it is used as a coolant. 3 is correct: a pressure cooker raises the pressure and hence the boiling point, so food cooks faster.',
      hint: 'Boiling point moves in the same direction as pressure.',
    },
    `${C} (Heat)`,
    [
      'At higher altitudes water boils at a higher temperature.',
      'Water has a high specific heat capacity.',
      'Food cooks faster in a pressure cooker because the boiling point of water increases.',
    ],
    '2 and 3 only',
    ['1 and 2 only', '1 and 3 only', '1, 2 and 3'],
  ),
  ms(
    {
      id: 'svg-sci-018',
      topic: T.pc,
      explanation:
        '1 is correct: myopia (short-sightedness) is corrected with a concave (diverging) lens. 2 is correct: hypermetropia (long-sightedness) is corrected with a convex (converging) lens. 3 is incorrect: rear-view mirrors are convex, as they give an erect, diminished image and a wider field of view.',
      hint: 'A wider field of view needs a diverging mirror.',
    },
    `${C} (Optics in daily life)`,
    [
      'Myopia is corrected using a concave lens.',
      'Hypermetropia is corrected using a convex lens.',
      'Rear-view mirrors in vehicles are concave mirrors.',
    ],
    '1 and 2 only',
    ['2 and 3 only', '1 and 3 only', '1, 2 and 3'],
  ),
  single(
    {
      id: 'svg-sci-019',
      topic: T.pc,
      explanation:
        'Ultrasound is a mechanical (sound) wave of frequency above 20 kHz and needs a medium. X-rays, gamma rays and microwaves are all electromagnetic waves.',
      hint: 'One of these cannot cross vacuum.',
    },
    'Which one of the following is NOT an electromagnetic wave?',
    'Ultrasound',
    ['X-rays', 'Gamma rays', 'Microwaves'],
  ),
  single(
    {
      id: 'svg-sci-020',
      topic: T.pc,
      explanation:
        'In increasing order of wavelength: X-rays < ultraviolet < infrared < radio waves (visible light lies between ultraviolet and infrared). Correct order: 3, 1, 4, 2.',
      hint: 'Higher energy means shorter wavelength.',
    },
    'Arrange the following in increasing order of wavelength:\n1. Ultraviolet rays\n2. Radio waves\n3. X-rays\n4. Infrared rays',
    '3, 1, 4, 2',
    ['1, 3, 4, 2', '3, 1, 2, 4', '2, 4, 1, 3'],
  ),
  ms(
    {
      id: 'svg-sci-021',
      topic: T.pc,
      explanation:
        '1 is correct: a geostationary satellite lies in the equatorial plane. 2 is correct: its orbital period equals the Earth’s rotation period (one sidereal day, about 24 hours). 3 is incorrect: it moves west to east, in the direction of Earth’s rotation; polar orbits are used by Sun-synchronous satellites, not geostationary ones.',
      hint: 'To appear fixed, it must move with the Earth.',
    },
    `${C} (Geostationary satellites)`,
    [
      'A geostationary satellite orbits in the plane of the equator.',
      'Its period of revolution equals the period of rotation of the Earth.',
      'It moves in a polar orbit from east to west.',
    ],
    '1 and 2 only',
    ['2 only', '2 and 3 only', '1, 2 and 3'],
  ),
  ar(
    {
      id: 'svg-sci-022',
      topic: T.pc,
      explanation:
        'A is false: a body thrown up continues to have acceleration due to gravity (g, downward) at the highest point; only its velocity is momentarily zero. R is true: at the highest point the instantaneous velocity of the body is zero.',
      hint: 'Gravity does not switch off at the top.',
    },
    'At the highest point of its vertical upward motion, the acceleration of a ball is zero.',
    'At the highest point, the velocity of the ball is momentarily zero.',
    3,
  ),
  single(
    {
      id: 'svg-sci-023',
      topic: T.pc,
      explanation:
        'Brass is an alloy of copper and zinc. Bronze is copper and tin; solder is traditionally lead and tin; stainless steel is iron with chromium (and nickel).',
      hint: 'Bronze and brass both contain copper; the second metal differs.',
    },
    'Brass is an alloy of:',
    'Copper and zinc',
    ['Copper and tin', 'Lead and tin', 'Iron and chromium'],
  ),
  // ───────────────────────── Science: Biology and health ─────────────────────────
  match(
    {
      id: 'svg-sci-024',
      topic: T.bio,
      explanation:
        'Vitamin B1 (thiamine) deficiency causes beriberi (A-3). Vitamin B3 (niacin) deficiency causes pellagra (B-1). Vitamin B12 deficiency causes pernicious anaemia (C-4). Vitamin K deficiency causes impaired blood clotting (D-2).',
      hint: 'Pellagra is the "three Ds" disease.',
    },
    ['Vitamin B1', 'Vitamin B3', 'Vitamin B12', 'Vitamin K'],
    ['Pellagra', 'Impaired blood clotting', 'Beriberi', 'Pernicious anaemia'],
    'A-3, B-1, C-4, D-2',
    ['A-1, B-3, C-4, D-2', 'A-3, B-1, C-2, D-4', 'A-3, B-4, C-1, D-2'],
  ),
  ms(
    {
      id: 'svg-sci-025',
      topic: T.bio,
      explanation:
        '1 is correct: vitamins A, D, E and K are fat-soluble. 2 is correct: vitamin C is water-soluble and is easily destroyed by heat during cooking. 3 is incorrect: vitamin B12 is obtained mainly from animal foods (milk, eggs, meat); plant foods are generally poor sources.',
      hint: 'Strict vegetarians are often advised B12 supplements.',
    },
    `${C} (Vitamins)`,
    [
      'Vitamins A, D, E and K are fat-soluble.',
      'Vitamin C is water-soluble and easily destroyed by heat.',
      'Vitamin B12 is obtained mainly from plant sources.',
    ],
    '1 and 2 only',
    ['1 only', '2 and 3 only', '1, 2 and 3'],
  ),
  match(
    {
      id: 'svg-sci-026',
      topic: T.bio,
      explanation:
        'Tuberculosis is caused by a bacterium, Mycobacterium tuberculosis (A-2). Malaria is caused by a protozoan, Plasmodium (B-4). Ringworm is a fungal infection (C-1). Measles is a viral disease (D-3).',
      hint: 'Ringworm is not caused by a worm.',
    },
    ['Tuberculosis', 'Malaria', 'Ringworm', 'Measles'],
    ['Fungus', 'Bacterium', 'Virus', 'Protozoan'],
    'A-2, B-4, C-1, D-3',
    ['A-4, B-2, C-1, D-3', 'A-2, B-4, C-3, D-1', 'A-2, B-1, C-4, D-3'],
  ),
  ms(
    {
      id: 'svg-sci-027',
      topic: T.bio,
      explanation:
        '1 is correct: malaria is caused by Plasmodium and transmitted by the female Anopheles mosquito. 2 is correct: dengue is transmitted by the Aedes mosquito. 3 is incorrect: typhoid is caused by the bacterium Salmonella typhi, not a virus. 4 is correct: lymphatic filariasis in India is transmitted mainly by the Culex mosquito.',
      hint: 'Typhoid is diagnosed by the Widal test for a bacterial infection.',
      seconds: 110,
    },
    `${C} (Communicable diseases)`,
    [
      'Malaria is transmitted by the female Anopheles mosquito.',
      'Dengue is transmitted by the Aedes mosquito.',
      'Typhoid is a viral disease.',
      'Filariasis is transmitted mainly by the Culex mosquito.',
    ],
    '1, 2 and 4 only',
    ['1 and 2 only', '2, 3 and 4 only', '1, 2, 3 and 4'],
  ),
  ms(
    {
      id: 'svg-sci-028',
      topic: T.bio,
      explanation:
        '1 is correct: mature mammalian red blood cells lack a nucleus. 2 is correct: platelets (thrombocytes) help in blood clotting. 3 is incorrect: a person with blood group AB has both A and B antigens and therefore has neither anti-A nor anti-B antibodies in plasma; that is why AB is the universal recipient.',
      hint: 'Antigens on cells and antibodies in plasma are opposites.',
    },
    `${C} (Human blood)`,
    [
      'Mature red blood cells of humans lack a nucleus.',
      'Platelets help in clotting of blood.',
      'A person with blood group AB has both anti-A and anti-B antibodies in the plasma.',
    ],
    '1 and 2 only',
    ['2 and 3 only', '1 only', '1, 2 and 3'],
  ),
  ms(
    {
      id: 'svg-sci-029',
      topic: T.bio,
      explanation:
        '1 is correct: the liver is the largest gland in the human body. 2 is incorrect: bile is produced by the liver; the gall bladder only stores and concentrates it. 3 is correct: insulin is secreted by the beta cells of the islets of Langerhans in the pancreas.',
      hint: 'Storage is not production.',
    },
    `${C} (Human digestive and endocrine organs)`,
    [
      'The liver is the largest gland in the human body.',
      'Bile is produced by the gall bladder.',
      'Insulin is secreted by the beta cells of the islets of Langerhans.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '2 and 3 only', '3 only'],
  ),
  match(
    {
      id: 'svg-sci-030',
      topic: T.bio,
      explanation:
        'Thyroxine is secreted by the thyroid gland (A-4). Adrenaline is secreted by the adrenal medulla (B-1). Growth hormone is secreted by the anterior pituitary (C-2). Melatonin is secreted by the pineal gland (D-3).',
      hint: 'The "fight or flight" hormone comes from above the kidneys.',
    },
    ['Thyroxine', 'Adrenaline', 'Growth hormone', 'Melatonin'],
    ['Adrenal medulla', 'Anterior pituitary', 'Pineal gland', 'Thyroid gland'],
    'A-4, B-1, C-2, D-3',
    ['A-1, B-4, C-2, D-3', 'A-4, B-1, C-3, D-2', 'A-4, B-2, C-1, D-3'],
  ),
  howMany(
    {
      id: 'svg-sci-031',
      topic: T.bio,
      explanation:
        '1 is correct: human somatic cells have 46 chromosomes (23 pairs). 2 is correct: the sex of a child is determined by whether the father contributes an X or a Y chromosome. 3 is correct: red-green colour blindness is an X-linked recessive trait and is therefore more common in males, who have only one X. All three are correct.',
      hint: 'Mothers always give an X.',
    },
    `${C} (Human genetics)`,
    [
      'Human somatic cells contain 23 pairs of chromosomes.',
      'The sex of a child is determined by the chromosome contributed by the father.',
      'Red-green colour blindness is more common in males than in females.',
    ],
    2,
  ),
  ms(
    {
      id: 'svg-sci-032',
      topic: T.bio,
      explanation:
        '1 is correct: BCG vaccine protects against tuberculosis. 2 is incorrect: antibiotics act on bacteria and are not effective against viral infections. 3 is correct: vaccines work by stimulating the immune system to produce antibodies and memory cells.',
      hint: 'Antibiotics target structures that viruses do not have.',
    },
    `${C} (Immunity and medicines)`,
    [
      'BCG vaccine is given for protection against tuberculosis.',
      'Antibiotics are effective in treating viral infections.',
      'Vaccines work by stimulating the body to produce antibodies and memory cells.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '1 only', '1, 2 and 3'],
  ),
  ar(
    {
      id: 'svg-sci-033',
      topic: T.bio,
      explanation:
        'A is true: antibiotics do not cure the common cold. R is true and explains A: the common cold is caused by viruses (such as rhinoviruses), and antibiotics act only against bacteria.',
      hint: 'Match the drug to the type of microbe.',
    },
    'Antibiotics are not effective in curing the common cold.',
    'The common cold is caused by viruses.',
    0,
  ),
  match(
    {
      id: 'svg-sci-034',
      topic: T.bio,
      explanation:
        'Mitochondria are sites of cellular respiration and ATP production (A-3). Ribosomes are sites of protein synthesis (B-1). Lysosomes contain digestive enzymes and are called "suicide bags" (C-4). The Golgi apparatus packages and dispatches materials (D-2).',
      hint: 'The "suicide bag" bursts to digest the cell.',
    },
    ['Mitochondria', 'Ribosome', 'Lysosome', 'Golgi apparatus'],
    ['Protein synthesis', 'Packaging and secretion of materials', 'ATP production', 'Intracellular digestion'],
    'A-3, B-1, C-4, D-2',
    ['A-1, B-3, C-4, D-2', 'A-3, B-1, C-2, D-4', 'A-3, B-4, C-1, D-2'],
  ),
  single(
    {
      id: 'svg-sci-035',
      topic: T.bio,
      explanation:
        'Diphtheria is caused by the bacterium Corynebacterium diphtheriae. Hepatitis B, AIDS (HIV) and poliomyelitis are viral diseases.',
      hint: 'It is part of the DPT vaccine against bacterial diseases.',
    },
    'Which one of the following diseases is NOT caused by a virus?',
    'Diphtheria',
    ['Hepatitis B', 'AIDS', 'Poliomyelitis'],
  ),
  howMany(
    {
      id: 'svg-sci-036',
      topic: T.bio,
      explanation:
        '1 is correct: iron deficiency causes anaemia. 2 is correct: iodine deficiency can cause goitre. 3 is correct: calcium ions are needed for blood clotting. 4 is incorrect: fluorosis is caused by excess fluoride, not deficiency. So only three are correct.',
      hint: 'One disorder comes from too much, not too little.',
    },
    `${C} (Minerals in nutrition)`,
    [
      'Deficiency of iron causes anaemia.',
      'Deficiency of iodine can cause goitre.',
      'Calcium is required for clotting of blood.',
      'Deficiency of fluoride in drinking water causes fluorosis.',
    ],
    2,
  ),
  match(
    {
      id: 'svg-sci-037',
      topic: T.bio,
      explanation:
        'ELISA is a screening test for HIV infection (A-2). The Widal test is used for typhoid (B-3). The Mantoux (tuberculin) test is used for tuberculosis (C-4). The Schick test was used for susceptibility to diphtheria (D-1).',
      hint: 'Widal is the classic typhoid test.',
    },
    ['ELISA', 'Widal test', 'Mantoux test', 'Schick test'],
    ['Diphtheria', 'HIV infection', 'Typhoid', 'Tuberculosis'],
    'A-2, B-3, C-4, D-1',
    ['A-3, B-2, C-4, D-1', 'A-2, B-3, C-1, D-4', 'A-2, B-4, C-3, D-1'],
  ),
  ms(
    {
      id: 'svg-sci-038',
      topic: T.bio,
      explanation:
        '1 is incorrect: xylem conducts water and minerals; food is transported by phloem. 2 is correct: the oxygen released in photosynthesis comes from the splitting of water (photolysis). 3 is correct: stomata are mainly for gaseous exchange and also allow transpiration.',
      hint: 'Isotope studies traced the released oxygen to water, not CO₂.',
    },
    `${C} (Plant physiology)`,
    [
      'Xylem transports food from leaves to other parts of the plant.',
      'The oxygen released during photosynthesis comes from water.',
      'Stomata help in gaseous exchange and transpiration.',
    ],
    '2 and 3 only',
    ['1 and 2 only', '2 only', '1, 2 and 3'],
  ),
  ms(
    {
      id: 'svg-sci-039',
      topic: T.bio,
      explanation:
        '1 is correct: the kidney’s functional unit is the nephron. 2 is incorrect: urea is produced in the liver (ornithine cycle) and only filtered out by the kidneys. 3 is correct: dialysis (artificial kidney) removes nitrogenous wastes from blood when kidneys fail.',
      hint: 'The kidney removes urea; another organ makes it.',
    },
    `${C} (Human excretion)`,
    [
      'The nephron is the structural and functional unit of the kidney.',
      'Urea is produced in the kidneys.',
      'Haemodialysis removes nitrogenous wastes from the blood in case of kidney failure.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '2 and 3 only', '1 only'],
  ),
  two(
    {
      id: 'svg-sci-040',
      topic: T.bio,
      explanation:
        '1 is incorrect: Type 1 diabetes results from autoimmune destruction of insulin-producing beta cells; it is Type 2 that is mainly associated with insulin resistance. 2 is correct: sickle-cell anaemia is a genetic disorder caused by a mutation in the haemoglobin (beta-globin) gene.',
      hint: 'Type 1 is about missing insulin, not ignored insulin.',
    },
    C,
    [
      'Type 1 diabetes is mainly caused by insulin resistance due to obesity.',
      'Sickle-cell anaemia is caused by a mutation in the gene for haemoglobin.',
    ],
    1,
  ),
  single(
    {
      id: 'svg-sci-041',
      topic: T.bio,
      explanation:
        'Scurvy is caused by deficiency of vitamin C, a nutrient, and is not inherited. Haemophilia, thalassaemia and sickle-cell anaemia are hereditary (genetic) disorders.',
      hint: 'Three are inherited; one is cured by citrus fruit.',
    },
    'Which one of the following is NOT a genetic disorder?',
    'Scurvy',
    ['Haemophilia', 'Thalassaemia', 'Sickle-cell anaemia'],
  ),
  // ───────────────────────── Environment: Ecology and biodiversity ─────────────────────────
  ms(
    {
      id: 'svg-env-001',
      topic: T.eco,
      explanation:
        '1 is correct: energy flow in an ecosystem is unidirectional, from producers to consumers. 2 is correct: Lindeman’s 10 percent law says only about 10% of energy is transferred to the next trophic level. 3 is incorrect: the pyramid of energy is always upright and can never be inverted.',
      hint: 'Energy is lost as heat at each level and never comes back.',
    },
    `${C} (Energy flow in ecosystems)`,
    [
      'Energy flow in an ecosystem is unidirectional.',
      'About 10% of energy is transferred from one trophic level to the next.',
      'The pyramid of energy can be inverted in some aquatic ecosystems.',
    ],
    '1 and 2 only',
    ['2 only', '2 and 3 only', '1, 2 and 3'],
  ),
  ar(
    {
      id: 'svg-env-002',
      topic: T.eco,
      explanation:
        'A is true: the pyramid of biomass in the open ocean is usually inverted. R is true and explains A: phytoplankton have a small standing biomass at any instant but reproduce rapidly, supporting a larger standing biomass of consumers.',
      hint: 'Standing crop is a snapshot, not a rate.',
    },
    'The pyramid of biomass in an ocean ecosystem is usually inverted.',
    'The standing biomass of phytoplankton at any time is smaller than that of the consumers they support, because of their rapid turnover.',
    0,
  ),
  match(
    {
      id: 'svg-env-003',
      topic: T.eco,
      explanation:
        'The Ramsar Convention concerns wetlands (A-3). CITES regulates international trade in endangered species of wild fauna and flora (B-1). The Montreal Protocol phases out ozone-depleting substances (C-4). The Basel Convention controls transboundary movement of hazardous wastes (D-2).',
      hint: 'Basel and Montreal both handle chemicals, but at different stages.',
    },
    ['Ramsar Convention', 'CITES', 'Montreal Protocol', 'Basel Convention'],
    ['Trade in endangered species', 'Transboundary movement of hazardous wastes', 'Wetlands', 'Ozone-depleting substances'],
    'A-3, B-1, C-4, D-2',
    ['A-1, B-3, C-4, D-2', 'A-3, B-1, C-2, D-4', 'A-3, B-4, C-1, D-2'],
  ),
  single(
    {
      id: 'svg-env-004',
      topic: T.climate,
      explanation:
        'Stockholm Conference on the Human Environment (1972); Montreal Protocol (1987); Rio Earth Summit (1992); Kyoto Protocol adopted (1997). Correct order: 4, 2, 1, 3.',
      hint: 'The first UN environment conference gave birth to UNEP.',
    },
    'Arrange the following in chronological order:\n1. Rio Earth Summit\n2. Adoption of the Montreal Protocol\n3. Adoption of the Kyoto Protocol\n4. Stockholm Conference on the Human Environment',
    '4, 2, 1, 3',
    ['4, 1, 2, 3', '2, 4, 1, 3', '4, 2, 3, 1'],
  ),
  ms(
    {
      id: 'svg-env-005',
      topic: T.climate,
      explanation:
        '1 is correct: most atmospheric ozone lies in the stratosphere. 2 is correct: CFCs break down under UV radiation to release chlorine, which destroys ozone catalytically. 3 is correct: the Kigali Amendment (2016) to the Montreal Protocol provides for phase-down of HFCs. 4 is incorrect: HFCs do not deplete ozone (they contain no chlorine or bromine); they were targeted because they are potent greenhouse gases.',
      hint: 'Kigali brought a climate gas under an ozone treaty.',
      seconds: 120,
    },
    `${C} (Ozone layer)`,
    [
      'Most of the ozone in the atmosphere is found in the stratosphere.',
      'Chlorine released from CFCs destroys ozone molecules.',
      'The Kigali Amendment to the Montreal Protocol deals with phasing down hydrofluorocarbons.',
      'Hydrofluorocarbons are major ozone-depleting substances.',
    ],
    '1, 2 and 3 only',
    ['1 and 2 only', '2, 3 and 4 only', '1, 2, 3 and 4'],
  ),
  single(
    {
      id: 'svg-env-006',
      topic: T.climate,
      explanation:
        'Nitrogen (N₂), the main constituent of air, does not absorb infrared radiation and is not a greenhouse gas. Nitrous oxide (N₂O), methane and sulphur hexafluoride are greenhouse gases (all in the Kyoto basket).',
      hint: 'Watch the difference between N₂ and N₂O.',
    },
    'Which one of the following is NOT a greenhouse gas?',
    'Nitrogen',
    ['Nitrous oxide', 'Sulphur hexafluoride', 'Methane'],
  ),
  howMany(
    {
      id: 'svg-env-007',
      topic: T.eco,
      explanation:
        '1 is correct: the Western Ghats form part of the Western Ghats and Sri Lanka biodiversity hotspot. 2 is correct: the Nicobar Islands are part of the Sundaland hotspot. 3 is incorrect: the Eastern Ghats are not recognised as a separate global biodiversity hotspot. So only two are correct.',
      hint: 'India’s four hotspots are Himalaya, Indo-Burma, Western Ghats-Sri Lanka and Sundaland.',
    },
    `${C} (Biodiversity hotspots)`,
    [
      'The Western Ghats are part of a global biodiversity hotspot shared with Sri Lanka.',
      'The Nicobar Islands are part of the Sundaland biodiversity hotspot.',
      'The Eastern Ghats are recognised as a separate global biodiversity hotspot.',
    ],
    1,
  ),
  single(
    {
      id: 'svg-env-008',
      topic: T.eco,
      explanation:
        'A seed bank conserves genetic material outside the natural habitat, so it is ex situ conservation. National parks, biosphere reserves and sacred groves protect species in their natural habitats (in situ).',
      hint: 'In situ means "in its original place".',
    },
    'Which one of the following is an example of EX SITU conservation?',
    'Seed bank',
    ['National park', 'Biosphere reserve', 'Sacred grove'],
  ),
  match(
    {
      id: 'svg-env-009',
      topic: T.eco,
      explanation:
        'Wild Life (Protection) Act: 1972 (A-2). Forest (Conservation) Act: 1980 (B-4). Environment (Protection) Act: 1986, after the Bhopal gas tragedy (C-1). Biological Diversity Act: 2002 (D-3).',
      hint: 'The umbrella environment law followed the 1984 disaster.',
    },
    ['Wild Life (Protection) Act', 'Forest (Conservation) Act', 'Environment (Protection) Act', 'Biological Diversity Act'],
    ['1986', '1972', '2002', '1980'],
    'A-2, B-4, C-1, D-3',
    ['A-4, B-2, C-1, D-3', 'A-2, B-4, C-3, D-1', 'A-2, B-1, C-4, D-3'],
  ),
  howMany(
    {
      id: 'svg-env-010',
      topic: T.eco,
      explanation:
        '1 is correct: the Biological Diversity Act, 2002 established the National Biodiversity Authority, headquartered at Chennai. 2 is correct: it provides for State Biodiversity Boards. 3 is correct: it provides for Biodiversity Management Committees at the level of local bodies, which maintain People’s Biodiversity Registers. All three are correct.',
      hint: 'The Act sets up a three-tier structure.',
    },
    `${C} (Biological Diversity Act, 2002)`,
    [
      'The National Biodiversity Authority is headquartered at Chennai.',
      'The Act provides for State Biodiversity Boards.',
      'Biodiversity Management Committees are constituted at the level of local bodies.',
    ],
    2,
  ),
  ar(
    {
      id: 'svg-env-011',
      topic: T.eco,
      explanation:
        'A is true: excess nutrient run-off (nitrates, phosphates) can lead to fish deaths in lakes. R is true and explains A: nutrients cause algal blooms, and when the algae die their decomposition by bacteria consumes dissolved oxygen, suffocating fish.',
      hint: 'Trace the oxygen through bloom and decay.',
    },
    'Excessive run-off of fertilisers into a lake can lead to large-scale death of fish.',
    'Decomposition of algal blooms depletes the dissolved oxygen in water.',
    0,
  ),
  two(
    {
      id: 'svg-env-012',
      topic: T.eco,
      explanation:
        '1 is correct: a high Biochemical Oxygen Demand indicates a high load of biodegradable organic pollution. 2 is incorrect: clean water has a low BOD, since little organic matter is present for microbes to decompose.',
      hint: 'More organic waste means more oxygen demanded by microbes.',
    },
    `${C} (Water quality)`,
    [
      'A high Biochemical Oxygen Demand (BOD) indicates a high level of organic pollution.',
      'Clean, unpolluted water has a high BOD value.',
    ],
    0,
  ),
  ms(
    {
      id: 'svg-env-013',
      topic: T.eco,
      explanation:
        '1 is incorrect: succession on land where soil already exists (e.g. abandoned farmland, burnt forest) is secondary succession; primary succession starts on bare areas with no soil. 2 is correct: lichens are typical pioneer species on bare rock. 3 is correct: the climax community is relatively stable and in equilibrium with the environment.',
      hint: 'Primary succession must first make soil.',
    },
    `${C} (Ecological succession)`,
    [
      'Succession on an abandoned farmland is an example of primary succession.',
      'Lichens are usually the pioneer species on bare rock.',
      'The climax community is relatively stable.',
    ],
    '2 and 3 only',
    ['1 and 2 only', '2 only', '1, 2 and 3'],
  ),
  match(
    {
      id: 'svg-env-014',
      topic: T.eco,
      explanation:
        'Bhitarkanika mangroves are in Odisha (A-3). Pichavaram mangroves are in Tamil Nadu (B-1). Coringa Wildlife Sanctuary (Godavari delta mangroves) is in Andhra Pradesh (C-4). The Sundarbans in India are in West Bengal (D-2).',
      hint: 'Coringa is near Kakinada.',
    },
    ['Bhitarkanika', 'Pichavaram', 'Coringa', 'Sundarbans'],
    ['Tamil Nadu', 'West Bengal', 'Odisha', 'Andhra Pradesh'],
    'A-3, B-1, C-4, D-2',
    ['A-1, B-3, C-4, D-2', 'A-4, B-1, C-3, D-2', 'A-3, B-4, C-1, D-2'],
  ),
  two(
    {
      id: 'svg-env-015',
      topic: T.eco,
      explanation:
        '1 is correct: Kolleru is a large freshwater lake lying between the Krishna and Godavari deltas in Andhra Pradesh. 2 is correct: Kolleru Lake was designated a Ramsar wetland of international importance in 2002.',
      hint: 'It is a major bird habitat in coastal Andhra.',
    },
    `${C} (Kolleru Lake)`,
    [
      'Kolleru is a freshwater lake located between the Krishna and Godavari deltas.',
      'Kolleru Lake is designated as a Ramsar site.',
    ],
    2,
  ),
  howMany(
    {
      id: 'svg-env-016',
      topic: T.eco,
      explanation:
        '1 is correct: "Critically Endangered" is an IUCN Red List category. 2 is correct: "Extinct in the Wild" is an IUCN Red List category. 3 is incorrect: "Rare" is not a category in the current IUCN Red List system (it was used in older schemes). So only two are correct.',
      hint: 'The current list has Extinct, EW, CR, EN, VU, NT, LC, DD and NE.',
    },
    `${C} (IUCN Red List)`,
    [
      '"Critically Endangered" is a category of the current IUCN Red List.',
      '"Extinct in the Wild" is a category of the current IUCN Red List.',
      '"Rare" is a category of the current IUCN Red List.',
    ],
    1,
  ),
  ms(
    {
      id: 'svg-env-017',
      topic: T.eco,
      explanation:
        '1 is correct: the pyramid of numbers in a tree ecosystem is inverted, since one tree supports many insects and birds. 2 is incorrect: decomposers such as bacteria and fungi break down dead matter; they are not producers. 3 is correct: biomagnification means increase in concentration of non-degradable toxins (e.g. DDT, mercury) at successive trophic levels.',
      hint: 'A single large tree can feed thousands of insects.',
    },
    `${C} (Ecosystem structure)`,
    [
      'The pyramid of numbers in a tree ecosystem can be inverted.',
      'Bacteria and fungi are the producers of an ecosystem.',
      'Concentration of DDT increases at successive trophic levels of a food chain.',
    ],
    '1 and 3 only',
    ['1 and 2 only', '3 only', '1, 2 and 3'],
  ),
  // ───────────────────────── Environment: Climate and disaster management ─────────────────────────
  ms(
    {
      id: 'svg-env-018',
      topic: T.climate,
      explanation:
        '1 is correct: under the Disaster Management Act, 2005 the NDMA is chaired by the Prime Minister. 2 is incorrect: the State Disaster Management Authority is chaired by the Chief Minister, not the Governor. 3 is correct: the District Disaster Management Authority is chaired by the Collector/District Magistrate/Deputy Commissioner. 4 is correct: the National Disaster Response Force is constituted under the DM Act, 2005.',
      hint: 'Each tier is led by the head of the elected or district executive.',
      seconds: 120,
    },
    `${C} (Disaster Management Act, 2005)`,
    [
      'The National Disaster Management Authority is chaired by the Prime Minister.',
      'The State Disaster Management Authority is chaired by the Governor.',
      'The District Disaster Management Authority is chaired by the District Collector or District Magistrate.',
      'The National Disaster Response Force is constituted under this Act.',
    ],
    '1, 3 and 4 only',
    ['1 and 3 only', '1, 2 and 3 only', '1, 2, 3 and 4'],
  ),
  two(
    {
      id: 'svg-env-019',
      topic: T.climate,
      explanation:
        '1 is correct: the Sendai Framework for Disaster Risk Reduction covers 2015-2030. 2 is correct: it succeeded the Hyogo Framework for Action (2005-2015).',
      hint: 'Both are named after Japanese cities.',
    },
    `${C} (Sendai Framework)`,
    [
      'The Sendai Framework for Disaster Risk Reduction covers the period 2015-2030.',
      'It is the successor to the Hyogo Framework for Action.',
    ],
    2,
  ),
  ms(
    {
      id: 'svg-env-020',
      topic: T.climate,
      explanation:
        '1 is correct: the Richter scale is logarithmic; each whole-number step is a tenfold increase in measured amplitude. 2 is correct: the epicentre is the point on the surface directly above the focus (hypocentre). 3 is incorrect: S-waves are shear waves and cannot travel through liquids; their absence beyond a zone is evidence of the liquid outer core.',
      hint: 'The S-wave shadow zone revealed the liquid outer core.',
    },
    `${C} (Earthquakes)`,
    [
      'The Richter scale is a logarithmic scale.',
      'The epicentre is the point on the Earth’s surface directly above the focus.',
      'S-waves can travel through liquids.',
    ],
    '1 and 2 only',
    ['1 only', '2 and 3 only', '1, 2 and 3'],
  ),
  ar(
    {
      id: 'svg-env-021',
      topic: T.climate,
      explanation:
        'A is true: tropical cyclones generally do not form within about 5° of the equator. R is true and explains A: the Coriolis force, needed to set up the cyclonic rotation, is zero at the equator and negligible close to it.',
      hint: 'No spin, no cyclone.',
    },
    'Tropical cyclones generally do not form very close to the equator.',
    'The Coriolis force is negligible near the equator.',
    0,
  ),
  ms(
    {
      id: 'svg-env-022',
      topic: T.climate,
      explanation:
        '1 is incorrect: the eye of a cyclone is the region of lowest pressure, with calm weather. 2 is correct: the IMD (RSMC New Delhi) is the Regional Specialised Meteorological Centre for tropical cyclones over the North Indian Ocean. 3 is correct: in the Southern Hemisphere cyclones rotate clockwise, owing to the Coriolis effect.',
      hint: 'Winds rush in towards the lowest pressure.',
    },
    `${C} (Tropical cyclones)`,
    [
      'The eye of a cyclone is the region of highest atmospheric pressure.',
      'The India Meteorological Department is the Regional Specialised Meteorological Centre for cyclones over the North Indian Ocean.',
      'Cyclones in the Southern Hemisphere rotate clockwise.',
    ],
    '2 and 3 only',
    ['1 and 2 only', '3 only', '1, 2 and 3'],
  ),
  two(
    {
      id: 'svg-env-023',
      topic: T.climate,
      explanation:
        '1 is correct: the Indian Tsunami Early Warning Centre is operated by INCOIS at Hyderabad. 2 is correct: in the deep ocean, tsunami waves have very long wavelengths and small heights, which grow as they approach shallow coasts.',
      hint: 'Ships at sea may not even notice a tsunami passing.',
    },
    `${C} (Tsunami)`,
    [
      'The Indian Tsunami Early Warning Centre is operated by INCOIS, Hyderabad.',
      'In the deep ocean, tsunami waves have very long wavelengths and small heights.',
    ],
    2,
  ),
  ms(
    {
      id: 'svg-env-024',
      topic: T.climate,
      explanation:
        '1 is correct: the IPCC was set up in 1988 by the WMO and UNEP. 2 is correct: the UNFCCC was opened for signature at the Rio Earth Summit in 1992. 3 is incorrect: the Kyoto Protocol imposed binding emission targets only on developed (Annex I/Annex B) countries, not on developing countries like India.',
      hint: 'Common but differentiated responsibilities.',
    },
    `${C} (Climate change institutions)`,
    [
      'The IPCC was established by the WMO and UNEP.',
      'The UNFCCC was opened for signature at the Rio Earth Summit.',
      'The Kyoto Protocol set legally binding emission targets for India.',
    ],
    '1 and 2 only',
    ['2 only', '2 and 3 only', '1, 2 and 3'],
  ),
  two(
    {
      id: 'svg-env-025',
      topic: T.climate,
      explanation:
        '1 is correct: under the Paris Agreement each country sets its own Nationally Determined Contributions. 2 is incorrect: the Paris Agreement was adopted under the UNFCCC and did not replace it; the UNFCCC remains the parent convention.',
      hint: 'It is an agreement under a convention.',
    },
    `${C} (Paris Agreement, 2015)`,
    [
      'Each party sets its own emission reduction pledges called Nationally Determined Contributions.',
      'The Paris Agreement replaced the UNFCCC.',
    ],
    0,
  ),
  single(
    {
      id: 'svg-env-026',
      topic: T.climate,
      explanation:
        'Large-scale deforestation is a human (anthropogenic) cause of climate change. Milankovitch cycles (variations in Earth’s orbit), volcanic eruptions and variations in solar output are natural causes.',
      hint: 'Three of these would happen even without humans.',
    },
    'Which one of the following is NOT a natural cause of climate change?',
    'Large-scale deforestation',
    ['Milankovitch cycles', 'Volcanic eruptions', 'Variations in solar output'],
  ),
  ms(
    {
      id: 'svg-env-027',
      topic: T.climate,
      explanation:
        '1 is incorrect: acid rain has a pH below about 5.6, not above 7 (pH above 7 is alkaline). 2 is correct: acid rain is caused mainly by sulphur dioxide and nitrogen oxides. 3 is correct: normal rainwater is slightly acidic (about pH 5.6) because of dissolved carbon dioxide forming carbonic acid.',
      hint: 'Even clean rain is slightly acidic.',
    },
    `${C} (Acid rain)`,
    [
      'Acid rain is rain with a pH value above 7.',
      'Acid rain is caused mainly by oxides of sulphur and nitrogen.',
      'Normal rainwater is slightly acidic due to dissolved carbon dioxide.',
    ],
    '2 and 3 only',
    ['1 and 2 only', '2 only', '1, 2 and 3'],
  ),
  match(
    {
      id: 'svg-env-028',
      topic: T.climate,
      explanation:
        'Constructing earthquake-resistant buildings reduces the impact before an event: mitigation (A-2). Mock drills build readiness: preparedness (B-4). Search and rescue happens immediately after: response (C-1). Rebuilding houses is recovery/reconstruction (D-3).',
      hint: 'Mitigation reduces risk; preparedness readies people.',
    },
    ['Constructing earthquake-resistant buildings', 'Conducting mock evacuation drills', 'Search and rescue operations', 'Rebuilding damaged houses'],
    ['Response', 'Mitigation', 'Recovery', 'Preparedness'],
    'A-2, B-4, C-1, D-3',
    ['A-4, B-2, C-1, D-3', 'A-2, B-4, C-3, D-1', 'A-4, B-2, C-3, D-1'],
  ),
  two(
    {
      id: 'svg-env-029',
      topic: T.climate,
      explanation:
        '1 is correct: agricultural drought refers to inadequate soil moisture for crop growth. 2 is correct: hydrological drought refers to depletion of surface water and groundwater (reservoirs, lakes, aquifers).',
      hint: 'Different drought types follow rainfall deficit at different stages.',
    },
    `${C} (Types of drought)`,
    [
      'Agricultural drought refers to a lack of adequate soil moisture for crops.',
      'Hydrological drought refers to depletion of surface water and groundwater.',
    ],
    2,
  ),
  ar(
    {
      id: 'svg-env-030',
      topic: T.climate,
      explanation:
        'A is true: urban areas are often warmer than the surrounding countryside (urban heat island). R is false: urban areas have less vegetation cover, not more; it is the replacement of vegetation by concrete and asphalt, which absorb and re-radiate heat, along with waste heat from vehicles and buildings, that causes the effect.',
      hint: 'Concrete replaces trees in cities.',
    },
    'Large cities are often warmer than the surrounding rural areas.',
    'Cities have more vegetation cover than rural areas.',
    2,
  ),
  ar(
    {
      id: 'svg-env-031',
      topic: T.eco,
      explanation:
        'A is false: mangroves are salt-tolerant and grow in saline coastal intertidal zones, not in freshwater lakes in the interior. R is true: mangroves have pneumatophores (breathing roots) to obtain oxygen in waterlogged, anaerobic soils.',
      hint: 'Mangroves are halophytes of tidal coasts.',
    },
    'Mangroves grow mainly in freshwater lakes of the interior plateau.',
    'Mangroves have pneumatophores to obtain oxygen in waterlogged soils.',
    3,
  ),
  ar(
    {
      id: 'svg-sci-042',
      topic: T.pc,
      explanation:
        'A is true: it is easier to pull than to push a lawn roller (when the handle is inclined). R is false: friction depends on the normal reaction, not on surface area in this sense; when pulling, the vertical component of the applied force acts upward and reduces the normal reaction (hence friction), while pushing adds to it.',
      hint: 'Resolve the applied force into vertical and horizontal parts.',
    },
    'It is easier to pull a lawn roller than to push it.',
    'Pulling increases the area of contact between the roller and the ground.',
    2,
  ),
  ar(
    {
      id: 'svg-eco-034',
      topic: T.bank,
      explanation:
        'A is false: a reduction in the Cash Reserve Ratio increases, not reduces, the money-creating capacity of banks. R is true: a lower CRR frees a larger portion of deposits for lending, which raises the money multiplier.',
      hint: 'Less locked up means more to lend.',
    },
    'A reduction in the Cash Reserve Ratio reduces the lending capacity of banks.',
    'A lower Cash Reserve Ratio frees more of the deposits for lending by banks.',
    3,
  ),
  ar(
    {
      id: 'svg-pol-054',
      topic: T.pf,
      explanation:
        'A is true: the Rajya Sabha is a permanent House and is not subject to dissolution (Article 83(1)). R is false: one-third of its members retire every second year, not every year, and members serve six-year terms.',
      hint: 'Six-year term, staggered in thirds.',
    },
    'The Rajya Sabha is not subject to dissolution.',
    'One-third of the members of the Rajya Sabha retire every year.',
    2,
  ),
  ar(
    {
      id: 'svg-sci-043',
      topic: T.bio,
      explanation:
        'A is false: a person with blood group O (Rh negative) is regarded as the universal donor, not group AB. R is true: red cells of group O carry neither A nor B antigens, so they are not agglutinated by recipients’ anti-A or anti-B antibodies.',
      hint: 'The universal donor’s cells carry nothing to react with.',
    },
    'Persons with blood group AB are known as universal donors.',
    'Red blood cells of blood group O carry neither A nor B antigens.',
    3,
  ),
  ar(
    {
      id: 'svg-env-032',
      topic: T.climate,
      explanation:
        'A is true: the east coast of India (e.g. Andhra Pradesh and Odisha) faces more frequent tropical cyclones than the west coast, as more cyclones form over the warmer Bay of Bengal than over the Arabian Sea. R is true: the western coastal plain is narrower than the eastern one. But R is only a fact of landform and does not explain where cyclones form, so it is not the correct explanation of A.',
      hint: 'Does R speak about cyclone formation at all?',
    },
    'The east coast of India is more prone to tropical cyclones than the west coast.',
    'The west coast of India has a narrower coastal plain than the east coast.',
    1,
  ),
]
