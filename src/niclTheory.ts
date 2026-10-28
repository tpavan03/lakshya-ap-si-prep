import type { Topic } from "./data";
import type { TheoryChapter } from "./theory";

const rbi = {
  label: "RBI financial education",
  url: "https://www.rbi.org.in/FinancialEducation/Home.aspx",
};
const irdai = {
  label: "IRDAI policyholder handbooks",
  url: "https://old.irdai.gov.in/ADMINCMS/cms/frmGeneral_NoYearList.aspx?DF=HBKENG&mid=14.7.1",
};
const recruitment = {
  label: "NICL 2026–27 official advertisement",
  url: "https://nationalinsurance.nic.co.in/sites/default/files/2026-10/NICL%20AO%20Recruitment%20Advertisment%202026-27_0.pdf",
};

export const niclTheoryChapters: TheoryChapter[] = [
  {
    topicId: "nicl-quant",
    subject: "Arithmetic",
    title: "Quantitative aptitude & data interpretation",
    overview:
      "Translate tables and commercial scenarios into a small set of relationships. In Prelims, 35 questions share a strict 20-minute section; Mains requires deeper calculations and selection judgement.",
    sections: [
      {
        title: "Ratio, percentages and averages",
        concepts: [
          "Read the denominator first: percentage change uses the old value; a share uses the relevant total.",
          "Successive increases and discounts multiply. A 20% increase followed by a 20% decrease leaves 96% of the original.",
          "Use weighted averages when groups have different sizes. The mean of group means is valid only for equal weights.",
          "For replacement averages, change in total = number of observations × change in mean.",
        ],
      },
      {
        title: "Commercial and rate problems",
        concepts: [
          "Profit percentage is normally based on cost price; discount is based on marked price.",
          "Interest questions must specify compounding frequency. For two years of annual compounding, CI−SI = P(r/100)².",
          "Work rates add; worker completion times do not. After a worker leaves, recompute the remaining work and rate.",
          "Round-trip average speed uses total distance divided by total time; equal-distance journeys use the harmonic mean.",
        ],
      },
      {
        title: "DI under time pressure",
        concepts: [
          "Identify the unit in each row or column before calculating: counts, rupees, thousands and percentages are different.",
          "Compare changes directly when possible; computing two full totals may be unnecessary.",
          "For caselet DI, write a compact table and resolve the relationships before answering any dependent question.",
          "Use approximation only when the choices are sufficiently separated; keep exact fractions until the final rounding step.",
        ],
      },
    ],
    formulae: [
      {
        label: "Weighted mean",
        expression: "weighted mean = Σ(weight × value) / Σweight",
        explanation:
          "For premium per policy, weights are policy counts, not the number of product categories.",
      },
      {
        label: "Repeated replacement",
        expression: "original substance remaining = V(1 − x/V)^n",
        explanation:
          "V is constant total volume; x is the volume removed and replaced at each of n steps.",
      },
      {
        label: "Equal-distance average speed",
        expression: "average speed = 2uv/(u + v)",
        explanation:
          "Applicable only when the distances travelled at u and v are equal.",
      },
      {
        label: "Partnership profit",
        expression: "share ∝ invested capital × investment duration",
        explanation:
          "Split changing investments into separate time intervals before adding contributions.",
      },
    ],
    workedExamples: [
      {
        problem:
          "A ₹1,000 item is marked up by 50% and then discounted by 20% and 10%. Find the profit percentage.",
        steps: [
          "Marked price = 1000×1.5=1500.",
          "Selling price = 1500×0.8×0.9=1080.",
          "Profit =80 on cost1000, so profit percentage =8%.",
        ],
        answer: "8% profit",
      },
      {
        problem:
          "An office sells 100 policies at ₹4,000 and 200 at ₹7,000. Find the weighted mean premium.",
        steps: [
          "Premium total =100×4000+200×7000=₹18,00,000.",
          "Number of policies =300.",
          "Divide total premium by policy count: 18,00,000/300=₹6,000.",
        ],
        answer: "₹6,000 per policy",
      },
    ],
    traps: [
      "Adding successive discount rates.",
      "Using a simple mean for unequal groups.",
      "Mixing km/h with metres/second.",
      "Continuing to use the joint work rate after a worker leaves.",
    ],
    revision: [
      "Convert common fractions to percentages mentally.",
      "Write units beside intermediate quantities.",
      "Use the whole DI set’s data before choosing a method.",
      "Review slow correct answers as well as wrong ones.",
    ],
    sources: [
      recruitment,
      { label: "NCERT Mathematics", url: "https://ncert.nic.in/textbook.php" },
    ],
  },
  {
    topicId: "nicl-reasoning",
    subject: "Reasoning",
    title: "Puzzles, arrangements & logical reasoning",
    overview:
      "Build one consistent model of the clues, then answer from that model. Practise deciding when to invest in a puzzle set and when to move to an independent question.",
    sections: [
      {
        title: "Seating and scheduling",
        concepts: [
          "Record whether people face north, south, the centre or outward; left and right depend on orientation.",
          "Start with fixed positions, endpoints and tightly linked blocks rather than vague clues.",
          "For floors and days, label a consistent order before placing people.",
          "When a clue permits multiple cases, keep the cases separate until another clue eliminates one.",
        ],
      },
      {
        title: "Syllogisms and inequalities",
        concepts: [
          "Preserve quantifiers: some establishes existence, while all does not reverse its direction.",
          "Two groups inside the same larger group need not overlap.",
          "A chain containing a strict inequality can establish a strict end-to-end inequality only when all links point in the same direction.",
          "Do not compare two endpoints when a chain changes direction; test possible orders instead.",
        ],
      },
      {
        title: "Sufficiency and critical reasoning",
        concepts: [
          "Evaluate statement I alone, statement II alone and then their combination.",
          "Enough information to answer yes or no is sufficient; the answer does not need to be yes.",
          "Separate a necessary assumption from a statement that merely sounds sensible.",
          "For causal conclusions, examine alternative causes, sample selection and changes in measurement.",
        ],
      },
    ],
    formulae: [
      {
        label: "Ranking without ties",
        expression: "total = rank from top + rank from bottom − 1",
        explanation:
          "Use both ranks of the same person in the same unchanged list.",
      },
      {
        label: "Net displacement",
        expression: "distance = √(net horizontal² + net vertical²)",
        explanation:
          "First cancel opposite-direction movements, then apply the right triangle.",
      },
      {
        label: "Linear seating gaps",
        expression: "people between positions i and j = |i − j| − 1",
        explanation: "Do not include the two endpoint people in the count.",
      },
    ],
    workedExamples: [
      {
        problem: "P>Q≥R=S<T. Does P>S follow? Does T>Q follow?",
        steps: [
          "P>Q≥R=S guarantees P>S.",
          "T>S gives no direct comparison with Q.",
          "For example Q=5,S=2,T=3 or T=8 both satisfy the relevant clues.",
        ],
        answer: "Only P>S follows.",
      },
      {
        problem: "Is integer n divisible by18? I: divisible by9. II: even.",
        steps: [
          "I alone permits9, so it cannot decide divisibility by18.",
          "II alone permits2, so it is insufficient.",
          "Together, divisibility by coprime9 and2 gives divisibility by18.",
        ],
        answer: "Both statements together are sufficient.",
      },
    ],
    traps: [
      "Reversing all A are B to all B are A.",
      "Inferring overlap from two separate some statements.",
      "Losing the facing direction in a seating puzzle.",
      "Treating a correlation as proof of one cause.",
    ],
    revision: [
      "Use a small labelled diagram.",
      "Mark definite placements separately from cases.",
      "Recheck the question’s left/right viewpoint.",
      "Discard conclusions that are merely possible rather than necessary.",
    ],
    sources: [
      recruitment,
      {
        label: "SATHEE — Government learning portal",
        url: "https://sathee.iitk.ac.in/",
      },
    ],
  },
  {
    topicId: "nicl-english",
    subject: "English",
    title: "English language, comprehension & editing",
    overview:
      "Read for the author’s claim, qualification and evidence. Grammar choices must preserve both the sentence’s structure and its intended meaning.",
    sections: [
      {
        title: "Reading comprehension",
        concepts: [
          "Locate the main claim and the role of each paragraph before examining fine details.",
          "An inference must be supported by the passage; a plausible outside fact is not enough.",
          "Track qualifications such as may, some, often and only: choices that strengthen them can be wrong.",
          "Infer vocabulary from the sentence’s logical role, not from one memorised dictionary meaning.",
        ],
      },
      {
        title: "Grammar and editing",
        concepts: [
          "Find the true subject before matching the verb; a nearby plural modifier may be a distraction.",
          "Use parallel grammatical forms for comparable list elements.",
          "Check tense against the time relationship, especially completed action before another past or future event.",
          "An introductory modifying phrase should logically describe the subject of the clause that follows.",
        ],
      },
      {
        title: "Cloze, connectors and order",
        concepts: [
          "Read the entire cloze paragraph before filling individual blanks.",
          "Use contrast, cause, consequence and concession to choose connectors.",
          "In sentence arrangement, resolve pronouns and expressions such as this change or therefore to their antecedents.",
          "Check both meaning and collocation; a grammatically possible word may be contextually wrong.",
        ],
      },
    ],
    formulae: [
      {
        label: "Third conditional",
        expression: "If + past perfect, would have + past participle",
        explanation:
          "An unreal past condition: If I had checked, I would have noticed.",
      },
      {
        label: "Modal passive",
        expression: "modal + be + past participle",
        explanation: "The documents must be verified.",
      },
      {
        label: "Correlative pairs",
        expression: "hardly … when; no sooner … than",
        explanation:
          "Fronted hardly/no sooner commonly requires auxiliary-subject inversion.",
      },
    ],
    workedExamples: [
      {
        problem: "Correct: “The number of unresolved claims have fallen.”",
        steps: [
          "The subject is number, which is singular.",
          "The phrase of unresolved claims modifies number.",
          "Replace have with has.",
        ],
        answer: "The number of unresolved claims has fallen.",
      },
      {
        problem:
          "A passage says automation can reduce delays but requires a correction process. Is “Automation always makes every decision correct” supported?",
        steps: [
          "Can is qualified; always is absolute.",
          "The correction process implies errors remain possible.",
          "The choice overstates the passage.",
        ],
        answer: "No; the absolute claim is unsupported.",
      },
    ],
    traps: [
      "Choosing an answer that is true generally but absent from the passage.",
      "Confusing affect/effect or stationery/stationary.",
      "Ignoring negation in “not supported”.",
      "Treating plausible as proven.",
    ],
    revision: [
      "Read the full question before deciding.",
      "Identify each connector’s logical role.",
      "Check pronouns against their antecedents.",
      "Prefer the concise option only when it preserves all relevant meaning.",
    ],
    sources: [
      recruitment,
      {
        label: "British Council LearnEnglish",
        url: "https://learnenglish.britishcouncil.org/",
      },
    ],
  },
  {
    topicId: "nicl-awareness",
    subject: "General Awareness",
    title: "Insurance, banking & financial awareness",
    overview:
      "Connect insurance terms to small real-world cases. Use this static foundation alongside a dated current-affairs routine; historical numbers and officeholders are not silently presented as current.",
    sections: [
      {
        title: "Insurance contracts and risk",
        concepts: [
          "Indemnity compensates covered financial loss within the contract; it does not promise a profit.",
          "Subrogation concerns recovery rights after indemnification. Contribution concerns sharing a common indemnity loss between insurers.",
          "A deductible is an amount retained by the insured; a co-payment is a specified share of admissible cost.",
          "Pooling is more effective when losses are sufficiently independent. Concentrated catastrophe exposures can generate correlated claims.",
        ],
      },
      {
        title: "Financial institutions and payments",
        concepts: [
          "Distinguish the mandates of IRDAI, RBI, SEBI and NPCI before memorising abbreviations.",
          "NEFT is batch-based; RTGS settles individually on a gross basis. Verify operating details through RBI guidance.",
          "Eligible deposits across branches of one insured bank aggregate in the same right and capacity for DICGC cover.",
          "KYC and secure authentication serve different purposes; never disclose an OTP because a caller knows a policy number.",
        ],
      },
      {
        title: "Economy and current-affairs method",
        concepts: [
          "Distinguish nominal growth from real growth and disinflation from a falling price level.",
          "For fixed-coupon bonds, higher required yields generally reduce market prices.",
          "Maintain a dated monthly log of official RBI, IRDAI, government and NICL releases; attach the source and effective date.",
          "Study an update by asking who issued it, what changed, when it takes effect and which earlier rule it replaces.",
        ],
      },
    ],
    formulae: [
      {
        label: "Claims ratio",
        expression: "claims ratio = incurred claims / earned premium × 100",
        explanation: "Keep gross/net and accounting bases consistent.",
      },
      {
        label: "Pro-rata earned premium",
        expression:
          "earned premium = annual premium × elapsed covered fraction",
        explanation:
          "This simplified model assumes risk is earned evenly over the coverage period.",
      },
      {
        label: "Real income change",
        expression:
          "real growth factor = nominal-income factor / price-level factor",
        explanation:
          "If income rises6% and prices8%, factor1.06/1.08 is below1.",
      },
    ],
    workedExamples: [
      {
        problem:
          "An admissible ₹80,000 claim has a flat ₹10,000 deductible and no other adjustment.",
        steps: [
          "Start from the admissible covered loss, ₹80,000.",
          "Subtract the stated deductible of ₹10,000.",
          "The insurer pays ₹70,000 under the specified assumptions.",
        ],
        answer: "₹70,000",
      },
      {
        problem:
          "Eligible deposits are ₹3 lakh in savings and ₹3 lakh in an FD at two branches of the same bank, in the same right and capacity. Ignore interest.",
        steps: [
          "Aggregate deposits across branches: ₹6 lakh.",
          "DICGC’s published cap is ₹5 lakh for the relevant depositor/bank/capacity.",
          "The maximum insured amount is therefore ₹5 lakh.",
        ],
        answer: "₹5 lakh, not a separate cap per account or branch.",
      },
    ],
    traps: [
      "Confusing subrogation with contribution.",
      "Treating a sum insured as automatic payment of that amount.",
      "Calling slower positive inflation deflation.",
      "Using an old regulator circular without checking amendments.",
    ],
    revision: [
      "Keep a dated official-source notebook.",
      "Separate static concepts from changing rates and appointments.",
      "Read product exclusions and definitions together.",
      "Distinguish written premium, earned premium and investment income.",
    ],
    sources: [
      recruitment,
      irdai,
      rbi,
      { label: "DICGC official FAQs", url: "https://www.dicgc.org.in/FAQs" },
    ],
  },
  {
    topicId: "nicl-computers",
    subject: "Computer Knowledge",
    title: "Computer knowledge & safe digital work",
    overview:
      "Move beyond abbreviation recall: understand how memory, networks, spreadsheets and database records behave in a financial-services office.",
    sections: [
      {
        title: "Hardware, operating systems and networks",
        concepts: [
          "RAM is volatile working memory; persistent storage survives normal power loss.",
          "The operating system schedules processes and manages memory, files and devices.",
          "DNS resolves names, DHCP provides IP configuration, and routers forward packets between networks.",
          "HTTPS protects transport under validated TLS but does not guarantee a website’s content is honest.",
        ],
      },
      {
        title: "Spreadsheets and databases",
        concepts: [
          "Relative spreadsheet references move on copying; dollar signs fix a row, column or both.",
          "COUNT counts numeric spreadsheet cells; COUNTA counts non-empty cells.",
          "A database primary key identifies rows; a foreign key maintains a reference to a related key.",
          "WHERE filters rows before grouping; HAVING filters aggregate groups.",
        ],
      },
      {
        title: "Security and data handling",
        concepts: [
          "Authentication establishes identity; authorisation decides which records and actions that identity may access.",
          "Use distinct authentication factors rather than two memorised secrets when claiming MFA.",
          "Backups should be tested and include a copy protected against the same failure that can affect the live data.",
          "Treat customer IDs as identifiers, preserving leading zeros; validate imports before applying records.",
        ],
      },
    ],
    formulae: [
      {
        label: "Binary units",
        expression: "1 KiB = 1024 bytes; 1 MiB = 1024 KiB",
        explanation:
          "Binary prefixes distinguish these units from decimal kB and MB.",
      },
      {
        label: "Conditional sum",
        expression: "=SUMIF(criteria_range, criterion, sum_range)",
        explanation:
          "Adds the corresponding values only when the condition matches.",
      },
      {
        label: "Absolute reference",
        expression: "=$B$2*C3 copied down becomes =$B$2*C4",
        explanation: "B2 is fixed; C3 is relative.",
      },
    ],
    workedExamples: [
      {
        problem: "A formula =$B$2*C3 is copied down one row.",
        steps: [
          "Dollar signs keep B2’s column and row fixed.",
          "C3 has no dollar signs and shifts with the copy.",
          "The result is =$B$2*C4.",
        ],
        answer: "=$B$2*C4",
      },
      {
        problem: "A caller asks for an OTP to release an insurance refund.",
        steps: [
          "An OTP can authorise a sensitive action.",
          "Knowledge of a policy number does not establish the caller’s authority.",
          "Do not disclose it; independently contact the official service channel.",
        ],
        answer: "Decline and verify through an official channel.",
      },
    ],
    traps: [
      "Assuming private browsing hides all network activity.",
      "Treating HTTPS as proof that a site is legitimate.",
      "Losing identifier leading zeros during CSV import.",
      "Granting an authenticated user access to every customer’s records.",
    ],
    revision: [
      "Practise copied spreadsheet references.",
      "Identify which network component performs each role.",
      "Use least privilege and independent verification.",
      "Separate backups, synchronisation and version history.",
    ],
    sources: [
      recruitment,
      { label: "NCERT ICT resources", url: "https://ncert.nic.in/ict.php" },
      {
        label: "CERT-In awareness resources",
        url: "https://www.cert-in.org.in/",
      },
    ],
  },
  {
    topicId: "nicl-it-professional",
    subject: "IT Professional Knowledge",
    title: "IT specialist professional knowledge",
    overview:
      "A dedicated Mains track for the Information Technology specialist. Work through calculations, code behaviour and system scenarios across algorithms, DBMS, operating systems, networking, security and software engineering.",
    sections: [
      {
        title: "Algorithms, structures and programming",
        concepts: [
          "Derive loop counts before naming complexity: consecutive n-loops are O(n), nested triangular loops are O(n²).",
          "Know the guarantees and failure cases of binary search, sorting, hash tables, heaps and balanced search trees.",
          "BFS gives shortest edge-count paths in unweighted graphs; Dijkstra requires non-negative edge weights for its usual guarantee.",
          "Track aliasing of mutable values, recursion progress and the language-specific behaviour of numeric types.",
        ],
      },
      {
        title: "Database and operating-system reasoning",
        concepts: [
          "Joins can multiply rows; filtering right-side NULLs after a LEFT JOIN can remove unmatched left rows.",
          "Separate dirty reads, non-repeatable reads, phantoms and lost updates by constructing a short concurrent execution.",
          "Recognise partial and transitive functional dependencies rather than memorising normal-form names alone.",
          "Derive page offset bits from page size; distinguish virtual pages, physical frames and cached TLB translations.",
          "Understand race conditions, synchronisation, scheduling, deadlock conditions and working-set pressure.",
        ],
      },
      {
        title: "Networks, security and reliable services",
        concepts: [
          "For conventional IPv4 subnets, host bits determine block size; remove network and broadcast addresses where applicable.",
          "Separate local frame destination from final IP destination when a packet crosses a router.",
          "Understand TCP handshake, flow control versus congestion control, DNS record types and HTTP method semantics.",
          "Use parameterised SQL, safe output encoding, object-level authorisation and appropriate session protections.",
          "Retries, at-least-once delivery and concurrent updates require explicit idempotency or consistency mechanisms.",
        ],
      },
    ],
    formulae: [
      {
        label: "Conventional IPv4 host count",
        expression: "usable hosts = 2^(32 − prefix length) − 2",
        explanation:
          "This conventional formula excludes network/broadcast and does not apply unchanged to special /31 or /32 cases.",
      },
      {
        label: "Page offset",
        expression: "offset bits = log₂(page size in bytes)",
        explanation: "4KiB=4096=2¹² bytes, so the offset uses12 bits.",
      },
      {
        label: "Hash load factor",
        expression: "α = number of entries / number of buckets",
        explanation:
          "Collision strategy and hash distribution affect actual performance.",
      },
      {
        label: "Triangular iteration count",
        expression: "1 + 2 + … + n = n(n + 1)/2",
        explanation:
          "This is Θ(n²), despite each individual loop having a finite upper limit.",
      },
    ],
    workedExamples: [
      {
        problem:
          "Find the network address and conventional usable-host count for192.168.10.77/26.",
        steps: [
          "/26 leaves6 host bits, so blocks contain64 addresses.",
          "77 lies in the64–127 block; network address is192.168.10.64.",
          "Usable-host count is64−2=62.",
        ],
        answer: "192.168.10.64 with62 conventional usable host addresses.",
      },
      {
        problem:
          "Two threads read balance100, subtract10 and both write90. Explain the result and a remedy.",
        steps: [
          "Each thread calculates from the same old balance.",
          "The second write overwrites the first, so one deduction is lost.",
          "Use an atomic database update or appropriate transaction locking/isolation, with retry behaviour designed explicitly.",
        ],
        answer: "A lost update; the correct serial result would be80.",
      },
    ],
    traps: [
      "Calling all two-loop code quadratic without checking whether the loops are nested.",
      "Counting an IPv4 subnet’s total addresses as usable hosts.",
      "Confusing authentication with per-record authorisation.",
      "Assuming a cache automatically preserves database consistency.",
      "Treating at-least-once delivery as exactly-once processing.",
    ],
    revision: [
      "Trace one small example before generalising.",
      "Compute network block boundaries explicitly.",
      "Draw concurrent operation order for transaction questions.",
      "State language, protocol and isolation assumptions.",
      "Connect testing to unit, integration, regression and recovery behaviour.",
    ],
    sources: [
      recruitment,
      {
        label: "PostgreSQL documentation",
        url: "https://www.postgresql.org/docs/current/",
      },
      { label: "Python tutorial", url: "https://docs.python.org/3/tutorial/" },
      { label: "IETF RFC Editor", url: "https://www.rfc-editor.org/" },
      { label: "OWASP Top 10", url: "https://owasp.org/www-project-top-ten/" },
    ],
  },
  {
    topicId: "nicl-descriptive",
    subject: "English",
    title: "Mains descriptive English: essay, précis & comprehension",
    overview:
      "The official NICL Mains descriptive paper has30 marks in30 minutes: essay10, précis10 and comprehension10. Practise all three forms within one total time budget; self-review is not an official score.",
    sections: [
      {
        title: "Essay",
        concepts: [
          "Use a clear position, two or three developed points and a short conclusion.",
          "Prefer supported, specific examples to memorised slogans or unsupported statistics.",
          "Address the actual prompt and reserve time to check agreement, tense and punctuation.",
        ],
      },
      {
        title: "Précis",
        concepts: [
          "Identify the central argument and keep the source’s logical relationships.",
          "Remove repetition, examples and ornament without adding your own opinion.",
          "Follow the word limit and title instructions in the actual prompt.",
        ],
      },
      {
        title: "Comprehension",
        concepts: [
          "Answer the asked question directly from the passage.",
          "Do not replace evidence with background knowledge.",
          "Use complete, concise sentences when the prompt expects written answers.",
        ],
      },
    ],
    formulae: [
      {
        label: "Total descriptive allocation",
        expression:
          "essay10 + précis10 + comprehension10 =30 marks; total time30 minutes",
        explanation:
          "Time can be planned across the three tasks; use actual exam instructions for word limits and any revised allocation.",
      },
    ],
    workedExamples: [
      {
        problem:
          "An essay asks whether digital insurance services can improve access. Outline a balanced response.",
        steps: [
          "Introduce access as both availability and practical ability to use a service.",
          "Explain lower travel cost and faster submission.",
          "Discuss connectivity, language and accessibility barriers.",
          "Conclude with assisted digital channels and clear grievance routes.",
        ],
        answer:
          "A focused argument with benefits, barriers and a practical conclusion.",
      },
    ],
    traps: [
      "Writing a memorised essay that does not answer the prompt.",
      "Adding an opinion to a précis.",
      "Spending the whole budget on the essay.",
      "Treating a self-review checklist as an official mark.",
    ],
    revision: [
      "Use a visible total timer.",
      "Plan before typing.",
      "Follow the displayed word limit.",
      "Reserve a short final proofread.",
    ],
    sources: [
      recruitment,
      {
        label: "British Council writing practice",
        url: "https://learnenglish.britishcouncil.org/skills/writing",
      },
    ],
  },
];

export const niclTopics: Topic[] = niclTheoryChapters.map((chapter) => ({
  id: chapter.topicId,
  subject: chapter.subject,
  title: chapter.title,
  description: chapter.overview,
  concepts: chapter.sections.map((section) => section.title),
  sources: chapter.sources.map((source) => ({
    ...source,
    note: "Primary or maintained learning reference; use current exam instructions for binding rules.",
  })),
}));
