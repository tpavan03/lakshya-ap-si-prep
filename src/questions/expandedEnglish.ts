import type { Question } from '../data'

const SOURCE = 'Original editorial practice · APSLPRB descriptive English syllabus · British Council grammar alignment'

const rotateOptions = (correct: string, distractors: string[], seed: number) => {
  const values = [correct, ...distractors]
  const shift = seed % 4
  const options = [...values.slice(shift), ...values.slice(0, shift)]
  return { options, answer: options.indexOf(correct) }
}

const make = (
  family: string,
  index: number,
  topic: string,
  question: string,
  correct: string,
  distractors: string[],
  explanation: string,
  hint: string,
  seconds: number,
  difficulty: Question['difficulty'],
): Question => {
  const { options, answer } = rotateOptions(correct, distractors, index)
  return {
    id: `enx-${family}-${String(index + 1).padStart(3, '0')}`,
    subject: 'English', topic, question, options, answer, explanation, hint, seconds, difficulty, source: SOURCE,
  }
}

const people = ['inspector', 'clerk', 'analyst', 'surveyor']

const agreementRules = [
  { lead: 'Each of the', noun: 'witnesses', verb: 'has', wrong: ['have', 'having', 'are'], note: '“Each” is singular; the plural noun inside the of-phrase does not control the verb.' },
  { lead: 'Neither of the', noun: 'reports', verb: 'is', wrong: ['are', 'were', 'have'], note: '“Neither” is singular in formal standard English.' },
  { lead: 'The quality of the', noun: 'records', verb: 'has', wrong: ['have', 'are', 'were'], note: 'The head noun “quality”, not “records”, controls the singular verb.' },
  { lead: 'A series of', noun: 'briefings', verb: 'was', wrong: ['were', 'have', 'are'], note: 'The head noun “series” is singular here.' },
  { lead: 'The officers, along with the', noun: 'supervisor', verb: 'are', wrong: ['is', 'has', 'was'], note: 'An “along with” phrase does not change the number of the plural subject “officers”.' },
  { lead: 'More than one of the', noun: 'applicants', verb: 'has', wrong: ['have', 'are', 'were'], note: 'The idiom “more than one” normally takes a singular verb.' },
  { lead: 'Many a', noun: 'candidate', verb: 'has', wrong: ['have', 'are', 'were'], note: '“Many a” is followed by a singular noun and singular verb.' },
  { lead: 'The number of', noun: 'complaints', verb: 'is', wrong: ['are', 'have', 'were'], note: '“The number” denotes one total and takes a singular verb.' },
  { lead: 'A number of', noun: 'complaints', verb: 'are', wrong: ['is', 'has', 'was'], note: '“A number of” means several and takes a plural verb.' },
  { lead: 'Either the guards or the', noun: 'officer', verb: 'is', wrong: ['are', 'have', 'were'], note: 'With either…or, agreement follows the nearer subject, “officer”.' },
  { lead: 'Either the officer or the', noun: 'guards', verb: 'are', wrong: ['is', 'has', 'was'], note: 'With either…or, agreement follows the nearer plural subject, “guards”.' },
  { lead: 'Ten kilometres', noun: 'on this road', verb: 'is', wrong: ['are', 'have', 'were'], note: 'A distance considered as one amount takes a singular verb.' },
  { lead: 'The police', noun: 'in this district', verb: 'are', wrong: ['is', 'has', 'was'], note: '“Police” is treated as a plural collective noun in standard English.' },
  { lead: 'One of the files that', noun: 'remain sealed', verb: 'is', wrong: ['are', 'have', 'were'], note: 'The main subject is “one”; the relative clause does not change its singular verb.' },
  { lead: 'Bread and butter', noun: 'for breakfast', verb: 'is', wrong: ['are', 'have', 'were'], note: 'The paired expression denotes a single customary dish here.' },
  { lead: 'What the witnesses described', noun: 'in court', verb: 'was', wrong: ['were', 'have', 'are'], note: 'A what-clause functioning as one subject normally takes a singular verb.' },
]

const agreementQuestions = agreementRules.flatMap((rule, ri) => people.map((person, pi) => {
  const i = ri * people.length + pi
  const tail = ['been independently verified.', 'included in the final note.', 'available for examination.', `been reviewed by the ${person}.`][pi]
  const correct = `${rule.lead} ${rule.noun} ${rule.verb} ${tail}`
  return make('agr', i, 'Subject–verb agreement', `Choose the sentence with correct subject–verb agreement.`, correct,
    rule.wrong.map(word => `${rule.lead} ${rule.noun} ${word} ${tail}`), rule.note, 'Identify the head of the subject phrase before choosing the verb.', 45, ri > 7 ? 'Hard' : 'Medium')
}))

const voiceVerbs = [
  ['records', 'verify', 'verified'], ['route', 'inspect', 'inspected'], ['statement', 'record', 'recorded'], ['evidence', 'preserve', 'preserved'],
  ['notice', 'issue', 'issued'], ['boundary', 'mark', 'marked'], ['vehicle', 'seize', 'seized'], ['request', 'approve', 'approved'],
  ['sample', 'analyse', 'analysed'], ['message', 'encrypt', 'encrypted'], ['warrant', 'execute', 'executed'], ['scene', 'photograph', 'photographed'],
  ['complaint', 'register', 'registered'], ['identity', 'confirm', 'confirmed'], ['parcel', 'deliver', 'delivered'], ['rule', 'enforce', 'enforced'],
] as const
const thirdPerson = (verb: string) => {
  if (/[^aeiou]y$/.test(verb)) return `${verb.slice(0, -1)}ies`
  if (/(?:s|x|z|ch|sh|o)$/.test(verb)) return `${verb}es`
  return `${verb}s`
}
const presentParticiple = (verb: string) => {
  if (/ie$/.test(verb)) return `${verb.slice(0, -2)}ying`
  if (/[^e]e$/.test(verb)) return `${verb.slice(0, -1)}ing`
  return `${verb}ing`
}
const voiceTimes = [
  { active: (a:string,v:string,o:string) => `The ${a} ${thirdPerson(v)} the ${o}.`, passive: (a:string,p:string,o:string) => `The ${o} is ${p} by the ${a}.`, tense: 'simple present' },
  { active: (a:string,_v:string,o:string,p:string) => `The ${a} has ${p} the ${o}.`, passive: (a:string,p:string,o:string) => `The ${o} has been ${p} by the ${a}.`, tense: 'present perfect' },
  { active: (a:string,v:string,o:string) => `The ${a} was ${presentParticiple(v)} the ${o}.`, passive: (a:string,p:string,o:string) => `The ${o} was being ${p} by the ${a}.`, tense: 'past continuous' },
  { active: (a:string,v:string,o:string) => `The ${a} will ${v} the ${o}.`, passive: (a:string,p:string,o:string) => `The ${o} will be ${p} by the ${a}.`, tense: 'simple future' },
]
const voiceQuestions = voiceVerbs.flatMap(([object, verb, participle], vi) => voiceTimes.map((time, ti) => {
  const i = vi * 4 + ti
  const actor = people[ti]
  const active = time.active(actor, verb, object, participle)
  const correct = time.passive(actor, participle, object)
  return make('voi', i, 'Voice', `Choose the passive equivalent without changing the tense: “${active}”`, correct,
    [`The ${object} is ${participle} by the ${actor}.`, `The ${object} was ${participle} by the ${actor}.`, `The ${object} has ${participle} by the ${actor}.`].filter(x => x !== correct).slice(0, 3).concat(`The ${actor} is ${participle} by the ${object}.`).slice(0,3),
    `The object becomes the subject, and the auxiliary must preserve the ${time.tense}.`, 'Locate the tense-bearing auxiliary before changing the word order.', 50, ti === 2 ? 'Hard' : 'Medium')
}))

const narrationStatements = [
  ['I am checking the register', 'he was checking the register'], ['I have completed the survey', 'he had completed the survey'],
  ['I will return tomorrow', 'he would return the next day'], ['I saw this vehicle yesterday', 'he had seen that vehicle the previous day'],
  ['We can solve the case', 'they could solve the case'], ['I may visit this office tonight', 'he might visit that office that night'],
  ['I wrote the note last week', 'he had written the note the previous week'], ['My team is ready now', 'his team was ready then'],
  ['I do not know the address', 'he did not know the address'], ['We are waiting here', 'they were waiting there'],
  ['I must finish this task', 'he had to finish that task'], ['I have never met her', 'he had never met her'],
  ['The road is closed today', 'the road was closed that day'], ['I cannot disclose these details', 'he could not disclose those details'],
  ['I was reading the order', 'he had been reading the order'], ['We shall submit our forms', 'they would submit their forms'],
] as const
const speakers = ['Arun', 'Dev', 'Kiran', 'Mohan']
const narrationQuestions = narrationStatements.flatMap(([direct, reported], si) => speakers.map((speaker, pi) => {
  const i = si * 4 + pi
  const correct = `${speaker} said that ${reported}.`
  return make('nar', i, 'Narration', `Convert to indirect speech: ${speaker} said, “${direct}.”`, correct,
    [`${speaker} said that ${direct.toLowerCase()}.`, `${speaker} says that ${reported}.`, `${speaker} told that ${reported}.`],
    'After a past reporting verb, adjust pronouns, tense and time/place expressions to the reporting viewpoint.', 'Check three things separately: speaker, verb tense, and deictic words such as today or here.', 55, si > 5 ? 'Hard' : 'Medium')
}))

const modifierBases = [
  ['Walking through the gate', 'the officer noticed the damaged lock', 'the damaged lock noticed the officer'],
  ['After reviewing the file', 'the inspector signed the order', 'the order signed the inspector'],
  ['Covered in dust', 'the abandoned car was difficult to identify', 'the team found the abandoned car'],
  ['To prevent delay', 'the clerk sent the notice immediately', 'the notice made the clerk hurry'],
  ['Having completed the patrol', 'the constables returned to the station', 'the station received the constables'],
  ['While interviewing the witness', 'the investigator took careful notes', 'the notes appeared important'],
  ['Built beside the river', 'the outpost faces seasonal flooding', 'engineers worry about the outpost'],
  ['Using a calibrated device', 'the technician measured the distance', 'the distance became accurate'],
  ['Before entering the room', 'the team photographed the doorway', 'the doorway looked narrow'],
  ['Alarmed by the smoke', 'the residents called the fire service', 'the fire service received calls'],
  ['Without revealing her source', 'the reporter described the allegation', 'the allegation reached the editor'],
  ['Exhausted after the search', 'the rescue team paused briefly', 'the search ended at sunset'],
  ['Designed for rough terrain', 'the vehicle can cross shallow streams', 'drivers prefer the vehicle'],
  ['Looking at the map', 'the surveyor identified a shorter route', 'a shorter route appeared obvious'],
  ['Although badly damaged', 'the document remained legible', 'the archivist could read the document'],
  ['By comparing both accounts', 'the analyst found a contradiction', 'a contradiction surprised the analyst'],
] as const
const modifierQuestions = modifierBases.flatMap(([intro, correctClause, dangling], mi) => people.map((_, pi) => {
  const i = mi * 4 + pi
  const punctuation = ['.', ' during the inquiry.', ' before noon.', ' without assistance.'][pi]
  const correct = `${intro}, ${correctClause}${punctuation}`
  return make('mod', i, 'Modifiers', 'Choose the sentence in which the opening modifier clearly describes the grammatical subject.', correct,
    [`${intro}, ${dangling}${punctuation}`, `While ${intro.toLowerCase()}, ${dangling}${punctuation}`, `${intro} ${dangling}${punctuation}`],
    `The understood subject of “${intro}” must be the noun that immediately follows it.`, 'Ask who or what performs the action in the opening phrase.', 55, mi > 6 ? 'Hard' : 'Medium')
}))

const punctuationItems = [
  ['After the meeting ended', 'the committee issued its decision', 'introductory clause'],
  ['If the signal fails', 'use the alternate channel', 'conditional clause'],
  ['The report however', 'needs one correction', 'conjunctive interruption'],
  ['The evidence which was sealed', 'remained secure', 'non-restrictive relative clause'],
  ['Bring three items', 'a torch, a map, and a radio', 'list after an independent introduction'],
  ['The witness said', '“I heard two voices.”', 'direct quotation'],
  ['The road was flooded', 'nevertheless, the convoy continued', 'two independent clauses'],
  ['Only one conclusion was possible', 'the document was forged', 'explanation after a complete clause'],
  ['The inspector asked', '“Who authorised the search?”', 'quoted question'],
  ['Before dawn', 'the patrol changed shifts', 'introductory phrase'],
  ['The van old but reliable', 'completed the journey', 'non-essential interrupter'],
  ['No Ravi did not sign', 'the register', 'direct address/interjection'],
  ['The files belong to the officers', 'room', 'singular possessive'],
  ['The two constables', 'helmets were damaged', 'plural possessive'],
  ['She bought notebooks pens', 'folders and clips', 'items in a series'],
  ['The notice was brief clear', 'and accurate', 'coordinate adjectives'],
] as const
const punctForms = [
  (a:string,b:string) => `${a}, ${b}.`, (a:string,b:string) => `${a}; ${b}.`,
  (a:string,b:string) => `${a}: ${b}.`, (a:string,b:string) => `${a}—${b}.`,
]
const punctuationQuestions = punctuationItems.flatMap(([a,b,rule], pi) => punctForms.map((_, fi) => {
  const i = pi * 4 + fi
  // Each family uses a curated correct form; suffixes create distinct proofreading contexts.
  const curated = [
    `${a}, ${b}.`, `${a}, ${b}.`, `The report, however, needs one correction.`, `The evidence, which was sealed, remained secure.`,
    `${a}: ${b}.`, `${a}, ${b}`, `${a}; ${b}.`, `${a}: ${b}.`,
    `${a}, ${b}`, `${a}, ${b}.`, `The van, old but reliable, completed the journey.`, `No, Ravi did not sign the register.`,
    `The files belong to the officer's room.`, `The two constables' helmets were damaged.`, `She bought notebooks, pens, folders, and clips.`, `The notice was brief, clear, and accurate.`,
  ][pi]
  const tag = ['in the draft', 'in the final copy', 'under formal style', 'during proofreading'][fi]
  const noInternalMarks = curated.replace(/[,;:—'“”]/g, '')
  const semicolonEverywhere = curated.replace(/[,:'—]/g, ';').replace(/[“”]/g, '')
  const colonCandidate = curated.replace(/[,;'—]/g, ':').replace(/[“”]/g, '')
  const colonEverywhere = colonCandidate === curated ? curated.replace(':', ',') : colonCandidate
  return make('pun', i, 'Punctuation', `Choose the correctly punctuated version ${tag}.`, curated,
    [noInternalMarks, semicolonEverywhere, colonEverywhere],
    `Standard punctuation marks the ${rule}; the selected version preserves that relationship.`, 'Read the sentence aloud and identify clause boundaries, interruptions, ownership, or list structure.', 45, pi > 5 ? 'Hard' : 'Medium')
}))

const vocabulary = [
  ['abate','become less intense','increase sharply','remain hidden','divide equally'], ['ambiguous','open to more than one meaning','perfectly clear','deliberately false','highly emotional'],
  ['arbitrary','based on personal whim rather than reason','required by law','supported by evidence','agreed unanimously'], ['bolster','support or strengthen','weaken permanently','copy exactly','delay secretly'],
  ['candid','frank and honest','indirect and evasive','angry and violent','formal and lengthy'], ['coherent','logical and connected','brief but false','secret and coded','loud and repetitive'],
  ['corroborate','confirm with supporting evidence','deny without inquiry','summarise briefly','remove from a record'], ['credible','worthy of belief','impossible to read','legally privileged','unrelated to the issue'],
  ['defer','postpone','approve immediately','reject finally','describe fully'], ['diligent','careful and persistent','careless and hurried','silent and fearful','newly appointed'],
  ['discrepancy','inconsistency or difference','formal agreement','complete copy','minor delay'], ['elicit','draw out a response','conceal a response','invent a record','end a meeting'],
  ['empirical','based on observation or experiment','based only on tradition','purely imaginary','legally binding'], ['explicit','stated clearly and directly','merely implied','factually incorrect','needlessly polite'],
  ['feasible','practicable or possible','unlawful','expensive','temporary'], ['fortify','strengthen or protect','abandon','measure','announce'],
  ['impartial','fair and unbiased','personally involved','poorly informed','strictly confidential'], ['impede','hinder or obstruct','assist greatly','record accurately','finish early'],
  ['implicit','suggested but not directly stated','announced publicly','proved scientifically','written carelessly'], ['inadvertent','unintentional','carefully planned','openly hostile','legally valid'],
  ['inference','conclusion drawn from evidence','direct quotation','unrelated detail','official command'], ['lucid','clear and easy to understand','secret and encrypted','very lengthy','technically invalid'],
  ['meticulous','extremely careful about detail','unwilling to cooperate','quick to accuse','unable to decide'], ['mitigate','make less severe','make unavoidable','measure precisely','publish widely'],
  ['objective','free from personal bias','based on preference','impossible to verify','intended to deceive'], ['obsolete','no longer in use','newly purchased','difficult to operate','temporarily unavailable'],
  ['plausible','seemingly reasonable or probable','certainly false','officially approved','poorly expressed'], ['pragmatic','focused on practical results','guided only by theory','excessively optimistic','morally uncertain'],
  ['preclude','prevent from happening','predict accurately','require by rule','report afterward'], ['provisional','temporary pending confirmation','permanent and final','secret and unofficial','incorrectly dated'],
  ['reconcile','make consistent or compatible','keep entirely separate','repeat from memory','reject as irrelevant'], ['redundant','unnecessary because it repeats or is no longer needed','essential to success','newly introduced','difficult to replace'],
  ['refute','prove a claim false','repeat a claim','accept without proof','hide the evidence'], ['scrutinise','examine closely','approve casually','discard immediately','copy mechanically'],
  ['sporadic','occurring irregularly','continuous and predictable','legally prohibited','carefully documented'], ['substantiate','support with evidence','remove from consideration','state as a rumour','simplify the wording'],
  ['succinct','brief and clear','vague and indirect','detailed and repetitive','harsh and critical'], ['tenable','capable of being defended','already disproved','easy to memorise','required by custom'],
  ['tentative','not yet certain or final','completely confident','officially secret','needlessly complex'], ['transparent','open and easy to understand','hidden from everyone','physically fragile','written by hand'],
  ['validate','confirm soundness or accuracy','make less relevant','translate literally','postpone indefinitely'], ['vigilant','alert and watchful','relaxed and inattentive','uncertain and hesitant','noisy and disruptive'],
  ['viable','capable of working successfully','certain to fail','morally admirable','very expensive'], ['waive','voluntarily give up a right or requirement','enforce strictly','explain carefully','transfer secretly'],
  ['concede','admit that something is true','deny categorically','investigate privately','announce proudly'], ['constrain','limit or restrict','encourage freely','record permanently','combine completely'],
  ['converge','move toward a common point','move farther apart','remain stationary','change without pattern'], ['detrimental','causing harm','bringing benefit','having no effect','requiring attention'],
  ['exhaustive','thorough and complete','physically tiring only','short and selective','unreliable'], ['extraneous','irrelevant or unnecessary','central to the matter','verified by experts','difficult to obtain'],
  ['fallacious','based on mistaken reasoning','supported by valid logic','stated with confidence','written anonymously'], ['indispensable','absolutely necessary','easily replaced','temporarily useful','legally doubtful'],
  ['negligible','too small to be significant','large and obvious','difficult to measure','rapidly increasing'], ['nuanced','showing subtle distinctions','entirely one-sided','deliberately vague','factually empty'],
  ['pervasive','spread throughout an area or group','limited to one case','recently discovered','easy to prevent'], ['presumptive','based on probability until disproved','proved beyond doubt','unrelated to evidence','stated as a request'],
  ['resilient','able to recover from difficulty','likely to collapse','unwilling to change','protected by law'], ['reticent','reluctant to speak freely','eager to explain','unable to hear','trained to negotiate'],
  ['salient','most noticeable or important','hidden and irrelevant','chronologically first','legally disputed'], ['stringent','strict and demanding','optional and flexible','old-fashioned','poorly drafted'],
  ['unanimous','agreed by everyone','decided by one person','evenly divided','not formally recorded'], ['unequivocal','clear and unambiguous','polite but uncertain','partly incorrect','open to revision'],
  ['verify','check that something is true or accurate','assume without checking','remove permanently','describe approximately'], ['vindicate','clear from blame or prove justified','accuse without proof','delay a judgment','change the subject'],
] as const
const vocabContexts = ['The inquiry note used the word', 'In the evidence review, the term', 'The editorial described the finding as', 'The officer called the account']
const vocabularyQuestions = vocabulary.map(([word,correct,...wrong], i) => make('voc', i, 'Vocabulary in context',
  `${vocabContexts[i % 4]} “${word}”. Which meaning best fits the word?`, correct, wrong,
  `In this context, “${word}” means “${correct}”.`, 'Replace the highlighted word with each option and preserve the sentence meaning.', 40, i > 31 ? 'Hard' : 'Medium'))

const correctionPatterns = [
  ['No sooner did the bell ring than the candidates entered.', 'No sooner did the bell ring when the candidates entered.', 'Use “no sooner…than”, not “when”.'],
  ['Hardly had the patrol left when the rain began.', 'Hardly had the patrol left than the rain began.', 'The standard pair is “hardly…when”.'],
  ['She is senior to me in service.', 'She is senior than me in service.', '“Senior” takes “to”, not “than”.'],
  ['The officer prevented him from entering.', 'The officer prevented him to enter.', '“Prevent” is followed by object + from + gerund.'],
  ['He insisted on examining the original.', 'He insisted to examine the original.', '“Insist” takes “on” followed by a gerund.'],
  ['The equipment consists of three units.', 'The equipment comprises of three units.', 'Use “consists of”; “comprises of” is non-standard in formal editing.'],
  ['She prefers walking to driving.', 'She prefers walking than driving.', 'The parallel comparison is “prefer X to Y”.'],
  ['The reason is that the road was closed.', 'The reason is because the road was closed.', 'Formal editing pairs “the reason” with a that-clause.'],
  ['He has been working here since 2021.', 'He is working here since 2021.', 'An action continuing from a past point requires the present perfect continuous.'],
  ['If I had known, I would have acted earlier.', 'If I would have known, I would act earlier.', 'A past unreal condition uses had + participle and would have + participle.'],
  ['The news is encouraging.', 'The news are encouraging.', '“News” is grammatically singular.'],
  ['One should perform one’s duty.', 'One should perform his duty.', 'Formal pronoun agreement keeps “one” with “one’s”.'],
  ['The scenery here is beautiful.', 'The sceneries here are beautiful.', '“Scenery” is normally an uncountable noun.'],
  ['She discussed the proposal with us.', 'She discussed about the proposal with us.', '“Discuss” takes a direct object without “about”.'],
  ['He ordered that the gate be closed.', 'He ordered that the gate was closed.', 'A mandative clause uses the base form “be”.'],
  ['Despite the rain, the search continued.', 'Despite of the rain, the search continued.', '“Despite” is not followed by “of”.'],
] as const
const correctionQuestions = correctionPatterns.flatMap(([correct,wrong,note], ci) => people.map((_, pi) => {
  const i = ci * 4 + pi
  const labels = ['formal report', 'edited statement', 'official memorandum', 'proofread transcript']
  const lowered = correct.charAt(0).toLowerCase() + correct.slice(1)
  return make('cor', i, 'Sentence correction', `Choose the correct form for a ${labels[pi]}.`, correct,
    [wrong, `Although ${lowered}`, `Because ${lowered}`], note, 'Check the governing conjunction, preposition, verb pattern, or agreement rule.', 50, ci > 6 ? 'Hard' : 'Medium')
}))

const editingItems = [
  ['The team collected, labelled, and sealed the samples.', 'The team collected, labelling, and sealed the samples.', 'parallel past-tense verbs'],
  ['The notice was clear, concise, and accurate.', 'The notice was clearly, concise, and accuracy.', 'parallel adjectives'],
  ['The purpose is to inspect the site and to record defects.', 'The purpose is inspecting the site and to record defects.', 'parallel infinitives'],
  ['Applicants must attach proof, sign the form, and pay the fee.', 'Applicants must attach proof, signing the form, and payment of the fee.', 'parallel verb phrases'],
  ['The policy aims to reduce delay without weakening review.', 'The policy aims at reducing delay without to weaken review.', 'matched gerund complements'],
  ['She is responsible for drafting and revising the order.', 'She is responsible for drafting and to revise the order.', 'parallel gerunds'],
  ['The report explains what happened, why it happened, and how it was addressed.', 'The report explains what happened, the reason, and addressing it.', 'parallel interrogative clauses'],
  ['The device is both inexpensive and reliable.', 'The device is both inexpensive and it is reliable.', 'balanced both…and structure'],
  ['The witness was neither evasive nor hostile.', 'The witness neither was evasive or hostile.', 'balanced neither…nor structure'],
  ['The new route is safer than the old one.', 'The new route is safer than travelling on the old road.', 'comparison of like terms'],
  ['Unlike the first statement, the second statement contains dates.', 'Unlike the first statement, dates appear in the second statement.', 'logical comparison'],
  ['The committee valued accuracy more than speed.', 'The committee valued accuracy more than working quickly.', 'parallel nouns in comparison'],
  ['The officer asked whether the seal was intact.', 'The officer asked that whether the seal was intact.', 'remove redundant complementiser'],
  ['Because the bridge was unsafe, it was closed.', 'Being that the bridge was unsafe, it was closed.', 'standard causal conjunction'],
  ['There were fewer vehicles on the road.', 'There were less vehicles on the road.', 'fewer for countable nouns'],
  ['The amount of water was insufficient.', 'The number of water was insufficient.', 'amount for uncountable nouns'],
] as const
const editingQuestions = editingItems.flatMap(([correct,wrong,focus], ei) => people.map((_, pi) => {
  const i = ei * 4 + pi
  const lowered = correct.charAt(0).toLowerCase() + correct.slice(1)
  return make('edt', i, 'Editing', `An editor is checking ${['a field note','an incident report','a public notice','a briefing'][pi]}. Which sentence has sound structure?`, correct,
    [wrong, `Although ${lowered}`, `Because ${lowered}`], `The correct sentence maintains ${focus}; the alternatives contain faulty parallelism, comparison, or an incomplete dependent clause.`, 'Compare the grammatical form on each side of conjunctions and comparisons.', 55, ei > 5 ? 'Hard' : 'Medium')
}))

const passages = [
  ['A patrol route was shortened after data showed that two low-risk lanes consumed a third of the shift. Response time improved, but supervisors retained random checks in those lanes.', 'The change used risk evidence while preserving unpredictable oversight.', 'The two lanes were permanently abandoned.', 'Efficiency can improve without eliminating all coverage.'],
  ['A village restored a wetland instead of deepening every drain. During heavy rain, the wetland held excess water and released it slowly after the peak had passed.', 'Natural storage reduced peak runoff.', 'Deep drains can never control floods.', 'The timing of water release matters to flood risk.'],
  ['An office translated its forms into three local languages. Applications initially rose, while the proportion returned for correction fell.', 'Clearer access reduced avoidable errors.', 'Every applicant became literate.', 'Language accessibility can improve administrative accuracy.'],
  ['Researchers found that learners who retrieved ideas from memory retained more after a week than learners who reread the same page for an equal time.', 'Active recall improved delayed retention.', 'Rereading prevents all learning.', 'Equal study time can produce different outcomes depending on method.'],
  ['A city added bus lanes on a crowded corridor. Cars moved slightly slower at first, but total people carried per hour increased because buses became faster and fuller.', 'The corridor moved more people despite slower cars.', 'Every traveller switched to a bus.', 'Transport capacity should be measured in people, not vehicles alone.'],
  ['A team compared a witness account with timestamped video. Most details matched, but the stated time differed by twenty minutes.', 'The account was broadly corroborated with one discrepancy.', 'The witness fabricated the entire account.', 'Agreement on many details does not erase a specific inconsistency.'],
  ['Farmers shifted part of their land from one water-intensive crop to pulses. Income remained stable because input costs fell, although gross revenue was slightly lower.', 'Lower costs offset reduced gross revenue.', 'Pulses always earn more revenue.', 'Profit depends on both revenue and cost.'],
  ['A library extended evening hours for a month. Attendance grew on weekdays but not weekends, so it retained only the weekday extension.', 'The final policy responded to observed demand.', 'Weekend access was prohibited.', 'A pilot can reveal where a broad change is unnecessary.'],
  ['A warning system sent fewer alerts after its threshold was raised. False alarms declined, but two real incidents were detected later.', 'The new threshold involved a trade-off.', 'Higher thresholds improve every outcome.', 'Reducing false positives can increase missed or delayed detections.'],
  ['A district published procurement data in reusable digital form. Journalists and citizens could compare prices across offices without retyping hundreds of pages.', 'Machine-readable disclosure made scrutiny easier.', 'Publication guaranteed that no error existed.', 'The format of disclosure affects how usable transparency is.'],
  ['A road project finished early after activities were rearranged, yet the safety inspection still occurred at its scheduled stage.', 'Sequencing saved time without omitting the inspection.', 'Every early project compromises safety.', 'Efficiency may come from workflow design rather than skipped safeguards.'],
  ['Two neighbourhoods received identical water quotas. One had twice the population, so equal quotas produced unequal supply per resident.', 'Equal totals did not create equal per-person allocation.', 'The larger neighbourhood used no water.', 'Fairness may require attention to relevant differences.'],
  ['An archive digitised fragile records but kept the originals in climate-controlled storage. Digital copies improved access; originals remained essential for authentication.', 'Digitisation served access and preservation together.', 'Digital copies made original records worthless.', 'Copies and originals can serve different functions.'],
  ['A health campaign measured success only by leaflets distributed. A later survey found high distribution but little change in behaviour.', 'Output counts alone did not establish impact.', 'Leaflets can never influence behaviour.', 'Activity measures and outcome measures answer different questions.'],
  ['A committee invited written objections before changing a rule. It adopted some suggestions, rejected others with reasons, and published the final decision.', 'Consultation informed but did not surrender decision-making.', 'Every objection had to be accepted.', 'Meaningful consultation includes consideration and reasons.'],
  ['A reserve reopened one trail after erosion controls worked, while another remained closed because vegetation had not recovered.', 'The reserve applied site-specific evidence.', 'All trails recovered at the same rate.', 'Similar sites may justify different decisions when conditions differ.'],
] as const
const comprehensionQuestions = passages.flatMap(([passage,main,unsupported,inference], pi) => [
  make('cmp', pi*4, 'Comprehension & inference', `Read: “${passage}” Which statement best expresses the main point?`, main, [unsupported, inference, 'The passage offers no evidence for any conclusion.'], 'The main point combines the central action and its demonstrated result without overstating either.', 'Select the option broad enough to cover the passage but narrow enough to stay supported.', 75, 'Hard'),
  make('cmp', pi*4+1, 'Comprehension & inference', `Read: “${passage}” Which claim is NOT supported?`, unsupported, [main, inference, 'The described decision used at least one observed result.'], 'The unsupported option adds an absolute or a fact absent from the passage.', 'Look for an option that goes beyond the stated evidence.', 70, 'Hard'),
  make('cmp', pi*4+2, 'Comprehension & inference', `Read: “${passage}” Which inference is most reasonable?`, inference, [unsupported, 'No comparison can be made from the information given.', 'The outcome proves the same policy must work everywhere.'], 'A sound inference follows from the relationship described while allowing reasonable limits.', 'Prefer a qualified conclusion over an absolute generalisation.', 80, 'Hard'),
  make('cmp', pi*4+3, 'Comprehension & inference', `Read: “${passage}” Which summary is most accurate?`, main, [unsupported, 'The passage merely lists unrelated events.', 'The author proves a universal rule without exceptions.'], 'An accurate summary preserves the passage’s scope and causal or comparative relationship.', 'Reject summaries containing “always”, “never”, or claims not established.', 70, 'Hard'),
])

const grammarPatterns = [
  ['By the time the team arrived, the crowd ___ .','had dispersed',['has dispersed','disperses','will disperse'],'Past perfect marks the earlier of two past actions.'],
  ['If the alarm ___, the guard will respond.','sounds',['sounded','will sound','had sounded'],'A real future condition uses present simple in the if-clause.'],
  ['She ___ the register every morning.','checks',['is check','checking','has check'],'A habitual action takes the simple present.'],
  ['The files ___ before the inspection began.','had been arranged',['were arranging','have arranged','will be arranged'],'Past perfect passive marks a completed action before another past event.'],
  ['He has lived here ___ 2020.','since',['for','from','during'],'“Since” introduces the starting point of a continuing period.'],
  ['They waited ___ two hours.','for',['since','by','at'],'“For” introduces a duration.'],
  ['She is ___ university graduate.','a',['an','the','no article'],'“University” begins with the consonant sound /j/.'],
  ['This is ___ most reliable route in the area.','the',['a','an','no article'],'A superlative normally takes “the”.'],
  ['The officer divided the work ___ four teams.','among',['between','with','into'],'“Among” is appropriate for distribution across more than two recipients.'],
  ['The report differs ___ the earlier version.','from',['than','with','to'],'The standard collocation is “differ from”.'],
  ['You ___ wear a helmet; the rule is mandatory.','must',['might','could','would'],'“Must” expresses strong obligation.'],
  ['The door is locked; they ___ have left.','must',['should','would','ought'],'“Must have” expresses a strong deduction about the past.'],
  ['I wish I ___ the answer.','knew',['know','will know','have know'],'After “wish” about a present unreal situation, use a past form.'],
  ['It is time we ___ the review.','started',['start','will start','have starting'],'“It is time” commonly takes a past form for a present recommendation.'],
  ['Not only the clerk but also the officers ___ present.','were',['was','is','has'],'With not only…but also, the verb agrees with the nearer plural subject.'],
  ['Had she received the message, she ___ replied.','would have',['will have','had','would'],'An inverted third conditional takes would have + participle in the result.'],
] as const
const grammarQuestions = grammarPatterns.flatMap(([stem,correct,wrong,note], gi) => people.map((_, pi) => {
  const i = gi * 4 + pi
  return make('grm', i, 'Grammar & usage', `${stem} Choose the best completion for ${['a report','a statement','formal English','standard usage'][pi]}.`, correct, wrong as unknown as string[], note, 'Use the time marker, article sound, governing word, or clause pattern as the clue.', 45, gi > 7 ? 'Hard' : 'Medium')
}))

export const expandedEnglishQuestions: Question[] = [
  ...agreementQuestions,
  ...voiceQuestions,
  ...narrationQuestions,
  ...modifierQuestions,
  ...punctuationQuestions,
  ...vocabularyQuestions,
  ...correctionQuestions,
  ...editingQuestions,
  ...comprehensionQuestions,
  ...grammarQuestions,
]
