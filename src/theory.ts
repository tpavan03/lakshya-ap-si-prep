import type { Subject } from './data'

export type TheorySection = {
  title: string
  concepts: string[]
}

export type TheoryFormula = {
  label: string
  expression: string
  explanation: string
}

export type TheoryWorkedExample = {
  problem: string
  steps: string[]
  answer: string
}

export type TheorySource = {
  label: string
  url: string
}

export type TheoryChapter = {
  /** Matches an id in the exported `topics` collection. */
  topicId: string
  subject: Subject
  title: string
  overview: string
  sections: TheorySection[]
  formulae: TheoryFormula[]
  workedExamples: TheoryWorkedExample[]
  traps: string[]
  revision: string[]
  sources: TheorySource[]
}

export const theoryChapters: TheoryChapter[] = [
  {
    topicId: 'percentages', subject: 'Arithmetic', title: 'Arithmetic foundations',
    overview: 'Build every calculation from ratios, proportions and units. Translate the words into a quantity relationship first; shortcuts become safe only after that relationship is clear.',
    sections: [
      { title: 'Numbers, ratio and percentage', concepts: [
        'A percentage is a ratio with denominator 100. Convert x% to x/100 before multiplying.',
        'If A:B = m:n, write A = mk and B = nk. A total then contains m+n equal parts.',
        'For successive percentage changes, apply multipliers such as 1.20 and 0.90; do not simply add unlike increases and decreases.',
        'An average is total quantity divided by number of observations. Reconstruct the total before adding, removing or replacing an item.',
      ]},
      { title: 'Commercial arithmetic', concepts: [
        'Profit and loss percentages are normally measured on cost price; discount is measured on marked price.',
        'Simple interest is calculated only on the original principal. Compound interest adds each period’s interest to the base.',
        'In mixtures and partnerships, contribution depends on both quantity and relevant time where the question specifies duration.',
      ]},
      { title: 'Work, motion and measurement', concepts: [
        'Treat one day’s work as a rate. Together, independent workers add rates, not completion times.',
        'Keep distance, speed and time units consistent. Relative speeds add in opposite directions and subtract in the same direction.',
        'For mensuration, distinguish boundary measures from surface measures and volume; units reveal which formula is appropriate.',
      ]},
    ],
    formulae: [
      { label: 'Percentage change', expression: 'change % = (new − original) / original × 100', explanation: 'The original value is always the comparison base.' },
      { label: 'Successive changes', expression: 'net % = a + b + ab/100', explanation: 'Use signed values: a decrease of 10% means b = −10.' },
      { label: 'Average', expression: 'average = sum of observations / number of observations', explanation: 'Therefore sum = average × count.' },
      { label: 'Simple interest', expression: 'SI = PRT/100; amount = P + SI', explanation: 'R is the annual percentage rate and T is in years.' },
      { label: 'Compound amount', expression: 'A = P(1 + R/100)^T', explanation: 'For varying rates, multiply the appropriate period factors.' },
      { label: 'Combined work', expression: '1/T = 1/a + 1/b', explanation: 'If A and B take a and b days separately, their daily work rates add.' },
      { label: 'Motion', expression: 'distance = speed × time', explanation: 'Convert minutes to hours and metres per second to kilometres per hour when required.' },
      { label: 'Circle', expression: 'circumference = 2πr; area = πr²', explanation: 'Circumference is a length; area has square units.' },
    ],
    workedExamples: [
      { problem: 'A price rises by 20% and then falls by 20%. What is the net change?', steps: ['Assume the original price is 100.', 'After the rise: 100 × 1.20 = 120.', 'After the fall: 120 × 0.80 = 96.', 'Compare 96 with the original 100.'], answer: 'A 4% decrease.' },
      { problem: 'A completes a job in 12 days and B in 18 days. How long together?', steps: ['A’s daily rate is 1/12 and B’s is 1/18.', 'Combined rate = 3/36 + 2/36 = 5/36.', 'Time is the reciprocal: 36/5 days.'], answer: '7.2 days.' },
      { problem: 'The average of six values is 24. Replacing 18 by x raises the average to 27. Find x.', steps: ['Original total = 6 × 24 = 144.', 'New total = 6 × 27 = 162.', 'The replacement adds 18, so x − 18 = 18.'], answer: 'x = 36.' },
    ],
    traps: ['Using the final value as the denominator in percentage change.', 'Cancelling equal percentage increase and decrease as if their bases were identical.', 'Adding work times instead of daily work rates.', 'Mixing minutes and hours or metres and kilometres.', 'Using selling price as the profit-percentage base unless explicitly stated.', 'Confusing radius with diameter or square units with cubic units.'],
    revision: ['Memorise common fraction–percentage pairs from 1/2 through 1/20.', 'Write units beside every intermediate quantity.', 'Estimate the likely range before calculating.', 'For ratios, count total parts before finding one part.', 'For averages, reconstruct totals.', 'Use multipliers for repeated percentage change.'],
    sources: [
      { label: 'NCERT Mathematics textbooks', url: 'https://ncert.nic.in/textbook.php' },
      { label: 'SATHEE quantitative aptitude', url: 'https://sathee.iitk.ac.in/' },
      { label: 'R.S. Aggarwal Quantitative Aptitude', url: 'https://www.schandpublishing.com/books/competitive-exams/quantitative-aptitude/quantitative-aptitude-competitive-examinations/9789355012326/' },
    ],
  },
  {
    topicId: 'reasoning', subject: 'Reasoning', title: 'Reasoning and mental ability',
    overview: 'Reasoning questions reward controlled representation. Convert prose into symbols, diagrams, tables or ordered cases, then eliminate options that violate a stated constraint.',
    sections: [
      { title: 'Patterns and codes', concepts: ['For series, inspect differences, second differences, ratios, alternating terms and digit operations in that order.', 'In analogies, state the precise relationship before checking options.', 'For letter codes, record alphabet positions A=1 through Z=26 and test a uniform shift before complex rules.', 'Classification requires one property shared by exactly three options; avoid subjective associations.'] },
      { title: 'Relations and spatial reasoning', concepts: ['Draw a small family tree with gender and generation levels for blood relations.', 'Represent directions on coordinate axes; take east and north as positive directions.', 'For ranking, total persons = rank from top + rank from bottom − 1.', 'In clocks, the hour hand moves continuously by half a degree per minute.'] },
      { title: 'Deduction and arrangements', concepts: ['In syllogisms, a universal statement does not imply existence unless an existential premise supplies it.', 'Use Venn containment for all/no/some relations and accept only conclusions true in every valid diagram.', 'For seating puzzles, fix absolute positions first, then place linked pairs and test remaining cases.', 'A statement–assumption question asks what must be taken for granted, not what is merely plausible.'] },
    ],
    formulae: [
      { label: 'Alphabet mirror', expression: 'position from left + position from right = 27', explanation: 'Useful for opposite-letter coding such as A↔Z.' },
      { label: 'Ranking total', expression: 'total = top rank + bottom rank − 1', explanation: 'The same person is counted in both ranks, so subtract once.' },
      { label: 'Clock angle', expression: '|30H − 5.5M| degrees', explanation: 'Take the smaller angle by replacing a result over 180° with 360° minus it.' },
      { label: 'Direction distance', expression: 'straight distance = √(east–west net² + north–south net²)', explanation: 'First cancel movements on each axis.' },
    ],
    workedExamples: [
      { problem: 'A person is 17th from the top and 24th from the bottom. How many people are there?', steps: ['Add the two ranks: 17 + 24 = 41.', 'The person was counted twice, so subtract 1.'], answer: '40 people.' },
      { problem: 'Find the smaller angle at 4:20.', steps: ['Hour-hand position = 30×4 + 0.5×20 = 130°.', 'Minute-hand position = 6×20 = 120°.', 'Difference = 10°.'], answer: '10°.' },
      { problem: 'All recruits are trained. No trained person is careless. Can any recruit be careless?', steps: ['Place recruits wholly inside trained persons.', 'Place careless persons outside trained persons.', 'The recruit and careless regions cannot overlap.'], answer: 'No; no recruit can be careless.' },
    ],
    traps: ['Assuming the next series rule before checking all terms.', 'Reversing left and right when the person faces south.', 'Inferring “all B are A” from “all A are B”.', 'Treating “some” as “all”.', 'Forgetting that the hour hand moves between hour marks.', 'Accepting an arrangement that satisfies only some constraints.'],
    revision: ['Write alphabet positions without reciting the alphabet repeatedly.', 'Draw relations rather than holding them in memory.', 'Use coordinates for multi-turn direction problems.', 'Test syllogism conclusions against a counterexample diagram.', 'Mark fixed and relative arrangement clues differently.', 'Budget a final check for viewpoint words.'],
    sources: [{ label: 'SATHEE aptitude resources', url: 'https://sathee.iitk.ac.in/' }, { label: 'R.S. Aggarwal Verbal & Non-Verbal Reasoning', url: 'https://www.schandpublishing.com/books/competitive-exams/reasoning/verbal-non-verbal-reasoning/9789355013927/' }],
  },
  {
    topicId: 'polity', subject: 'General Studies', title: 'Polity, economy and society',
    overview: 'Study constitutional institutions as a connected system: source of authority, composition, term, powers, limits and accountability. In economics, follow the chain from an indicator or policy tool to its likely effects.',
    sections: [
      { title: 'Constitutional framework', concepts: ['The Preamble states constitutional purposes; Fundamental Rights constrain state action and provide remedies.', 'Directive Principles guide governance but are generally non-justiciable; Fundamental Duties address citizen responsibility.', 'Amendment procedures vary by provision: simple majority, special majority, or special majority plus ratification by at least half the states.', 'Judicial review and the basic-structure doctrine limit the amending and ordinary law-making powers.'] },
      { title: 'Union, state and local institutions', concepts: ['Parliament comprises the President, Lok Sabha and Rajya Sabha; executive responsibility operates through the Council of Ministers.', 'A Money Bill can originate only in Lok Sabha and requires the Speaker’s certification.', 'The Supreme Court and High Courts exercise original, appellate and writ jurisdictions under defined provisions.', 'The 73rd and 74th Amendments constitutionalised rural and urban local-government frameworks.'] },
      { title: 'Economy and development', concepts: ['GDP measures final production within domestic territory; GNP/GNI adjusts for net factor income from abroad.', 'Inflation changes purchasing power; the RBI uses instruments including the policy repo rate, reserve requirements and open-market operations.', 'Fiscal policy concerns government revenue, spending and borrowing; monetary policy concerns money, liquidity and interest conditions.', 'Development measures extend beyond income to health, education, distribution and access to public services.'] },
    ],
    formulae: [
      { label: 'Nominal GDP', expression: 'Σ(current price × current quantity)', explanation: 'It reflects both price and output changes.' },
      { label: 'Real GDP', expression: 'Σ(base-year price × current quantity)', explanation: 'Holding prices constant isolates output change.' },
      { label: 'Inflation rate', expression: '(current price index − previous index) / previous index × 100', explanation: 'The chosen index and comparison period must be stated.' },
      { label: 'Fiscal deficit', expression: 'total expenditure − (revenue receipts + non-debt capital receipts)', explanation: 'It represents the government’s borrowing requirement for the period.' },
    ],
    workedExamples: [
      { problem: 'A bill contains only a new tax and related incidental provisions. Where may it be introduced?', steps: ['Tax matters fall within Article 110’s Money Bill scope when the bill contains only permitted matters.', 'A Money Bill may be introduced only in Lok Sabha.', 'Prior presidential recommendation is required.'], answer: 'Lok Sabha, subject to the constitutional requirements and Speaker’s certification.' },
      { problem: 'A price index rises from 160 to 168. Find the inflation rate.', steps: ['Increase = 168 − 160 = 8.', 'Divide by the previous index: 8/160 = 0.05.', 'Multiply by 100.'], answer: '5%.' },
    ],
    traps: ['Treating the Preamble as an independent source of government power.', 'Confusing constitutional amendment with ordinary legislation.', 'Assuming Rajya Sabha has the same power as Lok Sabha over a Money Bill.', 'Mixing Fundamental Rights with Directive Principles.', 'Equating a higher nominal GDP with higher real output.', 'Confusing fiscal deficit with revenue deficit or public debt.'],
    revision: ['For each institution, revise composition, appointment, term, removal and powers.', 'Link major constitutional articles to their principle rather than memorising isolated numbers.', 'Contrast Lok Sabha and Rajya Sabha in a two-column table.', 'Trace one monetary-policy change through borrowing, demand and inflation.', 'Separate stocks such as debt from flows such as annual deficit.', 'Verify current officeholders and rates from official sources close to the exam.'],
    sources: [{ label: 'Constitution of India — Legislative Department', url: 'https://legislative.gov.in/constitution-of-india/' }, { label: 'NCERT political science and economics', url: 'https://ncert.nic.in/textbook.php' }, { label: 'RBI financial education', url: 'https://www.rbi.org.in/FinancialEducation/Home.aspx' }, { label: 'India Budget', url: 'https://www.indiabudget.gov.in/' }],
  },
  {
    topicId: 'history', subject: 'General Studies', title: 'History and culture',
    overview: 'Organise history by chronology, evidence, cause and consequence. Connect political change with economy, society, religion, art and regional developments instead of memorising rulers as isolated facts.',
    sections: [
      { title: 'Ancient and medieval India', concepts: ['Archaeology, inscriptions, coins and literary traditions provide different kinds of evidence and must be read with their limits.', 'The Mauryan period is studied through edicts, texts and material evidence; Ashokan inscriptions illuminate dhamma and administration.', 'Temple, stupa and cave architecture can be identified through plan, patronage, material and iconography.', 'Medieval states combined military power, agrarian revenue, local intermediaries, trade and cultural patronage in changing forms.'] },
      { title: 'Modern India and the national movement', concepts: ['Colonial land-revenue systems altered relations among cultivators, intermediaries and the state.', 'The Revolt of 1857 had varied regional causes and leadership; avoid reducing it to one explanation.', 'The national movement passed through moderate, swadeshi, Gandhian mass and other revolutionary or constitutional strands.', 'Acts of 1909, 1919 and 1935 progressively changed representation and provincial governance without establishing full sovereignty.'] },
      { title: 'Culture and Andhra connections', concepts: ['The lower Krishna valley preserves major Buddhist sites including Amaravati and Nagarjunakonda.', 'Telugu literary history includes classical court traditions, bhakti compositions, social reform writing and modern movements.', 'Kuchipudi, Burrakatha, Kalamkari and regional crafts should be studied through form, place, practitioners and social setting.', 'State formation requires distinguishing Andhra State in 1953 from Andhra Pradesh in 1956 and the later 2014 reorganisation.'] },
    ],
    formulae: [
      { label: 'Source test', expression: 'claim → source type → date/place → author/patron → corroboration', explanation: 'A reliable historical conclusion states what the evidence can and cannot establish.' },
      { label: 'Causal analysis', expression: 'long-term conditions + immediate trigger + mobilisation → event', explanation: 'Major events rarely have a single sufficient cause.' },
      { label: 'Chronology frame', expression: 'event → preceding development → immediate consequence → long-term significance', explanation: 'This prevents correct facts from being placed in the wrong sequence.' },
    ],
    workedExamples: [
      { problem: 'Place these in order: Non-Cooperation Movement, Swadeshi Movement, Civil Disobedience Movement, Quit India Movement.', steps: ['Partition of Bengal and Swadeshi: 1905.', 'Non-Cooperation: 1920–22.', 'Civil Disobedience began in 1930.', 'Quit India began in 1942.'], answer: 'Swadeshi → Non-Cooperation → Civil Disobedience → Quit India.' },
      { problem: 'An inscription praises a king and records a land grant. What should a historian infer?', steps: ['The grant is evidence for the recorded transaction and administrative vocabulary.', 'Praise may reveal ideals of kingship but can exaggerate achievement.', 'Compare its date, provenance and claims with other evidence.'], answer: 'Use the inscription as valuable but purpose-shaped evidence, not as a neutral account of every claim.' },
    ],
    traps: ['Placing similarly named dynasties or rulers in the wrong region.', 'Treating literary praise as literal proof without corroboration.', 'Assigning a single cause to a mass movement.', 'Confusing an Act’s proposal with powers actually transferred.', 'Projecting present state boundaries onto earlier periods.', 'Confusing Andhra State, united Andhra Pradesh and reorganised Andhra Pradesh dates.'],
    revision: ['Maintain one national timeline and one Andhra timeline.', 'Attach every cultural form to place, period and defining feature.', 'Compare revenue systems by region, collector and cultivator relationship.', 'Revise movements by cause, leadership, method, geography and result.', 'Use maps for kingdoms, ports and archaeological sites.', 'Prefer official museums, archives and textbooks for disputed spellings or dates.'],
    sources: [{ label: 'NCERT history textbooks', url: 'https://ncert.nic.in/textbook.php' }, { label: 'Indian Culture Portal', url: 'https://indianculture.gov.in/' }, { label: 'Archaeological Survey of India', url: 'https://asi.nic.in/' }, { label: 'National Archives of India', url: 'https://nationalarchives.nic.in/' }],
  },
  {
    topicId: 'geography', subject: 'General Studies', title: 'Geography, science and environment',
    overview: 'Use maps, cycles and cause–effect chains. Geography explains spatial patterns, science explains mechanisms, and environmental study connects those mechanisms with ecosystems, hazards and human decisions.',
    sections: [
      { title: 'Physical and Indian geography', concepts: ['Latitude influences solar angle and day length; altitude, distance from sea, relief and circulation modify climate locally.', 'Indian monsoon rainfall depends on seasonal pressure and wind reversal, moisture paths, relief and moving weather systems.', 'Rivers erode, transport and deposit material; gradients and discharge shape valleys, floodplains and deltas.', 'Soils reflect parent material, climate, organisms, relief and time, and are altered by erosion, irrigation and land use.'] },
      { title: 'General science', concepts: ['Motion relates displacement, velocity and acceleration; force changes motion according to mass and acceleration.', 'Work transfers energy when a force produces displacement; power measures the rate of energy transfer.', 'Electric current, potential difference and resistance are connected by Ohm’s law under appropriate physical conditions.', 'Cells, tissues, organs and systems form levels of biological organisation; energy flow and material cycles connect organisms.'] },
      { title: 'Ecology and disaster management', concepts: ['Energy flows through food chains while matter cycles; only a fraction of energy passes to the next trophic level.', 'Biodiversity includes genetic, species and ecosystem diversity, each supporting resilience and services.', 'A hazard becomes a disaster through exposure and vulnerability; preparedness and mitigation can reduce risk.', 'Watersheds, wetlands, mangroves and forests can reduce some hazards while providing habitat and livelihoods.'] },
    ],
    formulae: [
      { label: 'Density', expression: 'density = mass / volume', explanation: 'Use consistent units; density helps predict floating and material properties.' },
      { label: 'Newton’s second law', expression: 'F = ma', explanation: 'Net force equals mass times acceleration.' },
      { label: 'Work and power', expression: 'W = Fs cosθ; P = W/t', explanation: 'Only the force component along displacement performs mechanical work.' },
      { label: 'Ohm’s law', expression: 'V = IR', explanation: 'For an ohmic conductor at stable physical conditions, voltage is current times resistance.' },
      { label: 'Disaster-risk frame', expression: 'risk ∝ hazard × exposure × vulnerability / capacity', explanation: 'This is a conceptual relationship: capacity reduces likely loss even when the hazard remains.' },
    ],
    workedExamples: [
      { problem: 'A 12 V source drives 2 A through a resistor. Find resistance.', steps: ['Use V = IR.', 'Rearrange: R = V/I.', 'R = 12/2.'], answer: '6 ohms.' },
      { problem: 'Why does heavy rain not create equal flood risk everywhere?', steps: ['Rain intensity is the hazard.', 'Population and assets determine exposure.', 'Drainage, building quality and preparedness affect vulnerability and capacity.', 'Therefore similar rainfall can cause different losses.'], answer: 'Flood risk depends on exposure, vulnerability and capacity as well as rainfall.' },
      { problem: 'A force of 20 N moves a box 5 m in its direction in 10 seconds. Find work and power.', steps: ['W = Fs = 20×5 = 100 J.', 'P = W/t = 100/10.'], answer: 'Work = 100 J; power = 10 W.' },
    ],
    traps: ['Confusing weather with long-period climate.', 'Assuming every Indian river is perennial or east flowing.', 'Mixing mass and weight.', 'Applying Ohm’s law without consistent units.', 'Treating a food chain as a closed energy cycle.', 'Equating hazard occurrence with disaster severity.'],
    revision: ['Practise locating rivers, ranges, soils and protected areas on blank maps.', 'Draw the monsoon and water cycles from memory.', 'Track SI units with every science formula.', 'Connect each environmental convention to its subject.', 'Separate mitigation, preparedness, response and recovery.', 'Verify changing protected-area or climate facts from official sources.'],
    sources: [{ label: 'NCERT geography and science textbooks', url: 'https://ncert.nic.in/textbook.php' }, { label: 'India Meteorological Department', url: 'https://mausam.imd.gov.in/' }, { label: 'National Disaster Management Authority', url: 'https://ndma.gov.in/' }, { label: 'ISRO Bhuvan', url: 'https://bhuvan.nrsc.gov.in/' }, { label: 'Ministry of Environment, Forest and Climate Change', url: 'https://moef.gov.in/' }],
  },
  {
    topicId: 'ap-focus', subject: 'AP Focus', title: 'Andhra Pradesh focus',
    overview: 'Study Andhra Pradesh through stable physical and historical structures, then update administrative, economic and scheme-related facts from state primary sources before the examination.',
    sections: [
      { title: 'Land, water and economy', concepts: ['Andhra Pradesh extends along the Bay of Bengal and includes coastal plains, Eastern Ghats uplands and the inland Rayalaseema region.', 'Godavari and Krishna form major delta systems; Pennar, Vamsadhara and Nagavali are also important regional rivers.', 'Agriculture, aquaculture, ports, manufacturing and services have different spatial concentrations and infrastructure needs.', 'Read irrigation projects by river, location, purpose and command area rather than memorising names alone.'] },
      { title: 'History, society and culture', concepts: ['Amaravati, Nagarjunakonda and Salihundam illustrate major Buddhist connections in different parts of the region.', 'Satavahana, Eastern Chalukya, Kakatiya, Vijayanagara and later political histories intersect with Andhra regions in different periods.', 'Alluri Sitarama Raju and the Rampa movement belong to the agency-area resistance history of the 1920s.', 'Telugu literature, Kuchipudi, Burrakatha, leather puppetry, Kalamkari and wooden-toy traditions link cultural form with community and place.'] },
      { title: 'Governance and current development', concepts: ['District and local administration implement state programmes through sector departments and elected institutions.', 'Budgets and socioeconomic surveys distinguish allocations from expenditure and outputs from outcomes.', 'Population, health, education, agriculture and industry indicators should be compared by year and source methodology.', 'Current districts, officeholders and programmes can change; label the reference date and prefer official portals.'] },
    ],
    formulae: [
      { label: 'Indicator growth', expression: '(current value − previous value) / previous value × 100', explanation: 'State the years and whether values are nominal or real.' },
      { label: 'Per-capita measure', expression: 'aggregate value / relevant population', explanation: 'Per-capita comparisons require compatible years and population estimates.' },
      { label: 'Project map', expression: 'river → location → structure → purpose → beneficiary region', explanation: 'This five-part chain prevents confusion between similarly named irrigation projects.' },
      { label: 'Culture map', expression: 'form → place → material/method → community/patronage', explanation: 'Use the chain to revise crafts and performing arts with context.' },
    ],
    workedExamples: [
      { problem: 'Distinguish the 1953 and 1956 state-formation milestones.', steps: ['Andhra State was formed on 1 October 1953 for Telugu-speaking areas separated from Madras State.', 'Andhra Pradesh was formed on 1 November 1956 during states reorganisation by joining Andhra State with the Telugu-speaking Telangana region of Hyderabad State.', 'Later reorganisation in 2014 created present-day Andhra Pradesh and Telangana.'], answer: '1953: Andhra State; 1956: Andhra Pradesh; 2014: bifurcation into the present states.' },
      { problem: 'An AP indicator grows from 250 to 290. Find its growth rate.', steps: ['Change = 290 − 250 = 40.', 'Divide by base value: 40/250 = 0.16.', 'Multiply by 100.'], answer: '16%.' },
    ],
    traps: ['Using undivided-state facts for present Andhra Pradesh without a date.', 'Confusing district headquarters with district names after reorganisation.', 'Pairing an irrigation project with the wrong river.', 'Treating budget allocation as actual expenditure or measured outcome.', 'Confusing similarly located Buddhist, temple and craft sites.', 'Relying on coaching lists for changing schemes instead of official documents.'],
    revision: ['Create a blank AP map for rivers, districts, ports and major sites.', 'Keep a dated sheet for current administrative facts.', 'Revise state formation as a three-milestone timeline.', 'Read the latest official socioeconomic survey by sector.', 'Pair each art or craft with place and defining method.', 'Cross-check every changing statistic shortly before the exam.'],
    sources: [{ label: 'Government of Andhra Pradesh', url: 'https://www.ap.gov.in/' }, { label: 'AP Finance Department', url: 'https://apfinance.gov.in/' }, { label: 'AP Legislature', url: 'https://aplegislature.org/' }, { label: 'AP State Portal — districts', url: 'https://www.ap.gov.in/#/districts' }, { label: 'APSLPRB', url: 'https://slprb.ap.gov.in/' }],
  },
  {
    topicId: 'language', subject: 'English', title: 'Descriptive English and Telugu/Urdu',
    overview: 'Qualifying language papers test comprehension and controlled expression. Build accuracy at sentence level, then apply it to précis, translation, letters, reports and essays under a fixed time budget.',
    sections: [
      { title: 'Grammar and usage', concepts: ['Make the finite verb agree with the head of the subject, not a nearby noun inside a phrase.', 'Control tense by establishing the time relationship among actions; use perfect forms when one action precedes another reference point.', 'Modifiers should sit next to the word they describe, and coordinated items should share a parallel grammatical form.', 'In voice and narration, preserve meaning and time while changing subject focus, pronouns and deictic expressions.'] },
      { title: 'Comprehension, précis and translation', concepts: ['Separate the author’s explicit claim from a reasonable inference and from an unsupported extension.', 'A précis preserves the central argument, logical order and tone in substantially fewer words without examples or personal comment.', 'Translate meaning, register and function rather than replacing each word mechanically.', 'Resolve pronoun reference, connectives and paragraph transitions before answering detail questions.'] },
      { title: 'Functional and extended writing', concepts: ['A formal letter needs a clear purpose, relevant facts, appropriate request and consistent register.', 'A report normally presents heading, context, verified observations, analysis where required and actionable conclusion.', 'An essay benefits from a thesis, logically ordered paragraphs, evidence or examples and a conclusion that answers the prompt.', 'Reserve editing time for agreement, tense, spelling, punctuation, repetition and factual consistency.'] },
    ],
    formulae: [
      { label: 'Précis workflow', expression: 'read → identify thesis → group supporting ideas → draft → compress → verify', explanation: 'The final version must remain faithful, coherent and self-contained.' },
      { label: 'Paragraph structure', expression: 'claim → explanation → evidence/example → link', explanation: 'Each paragraph should advance one controlling idea.' },
      { label: 'Subject–verb agreement', expression: 'head subject number → finite verb number', explanation: 'Ignore intervening prepositional and parenthetical phrases while identifying agreement.' },
      { label: 'Passive construction', expression: 'object + tense-carrying be + past participle (+ by-agent)', explanation: 'Keep the original tense; omit the agent when unknown or unimportant.' },
      { label: 'Timed writing budget', expression: 'plan 15% + draft 70% + revise 15%', explanation: 'Adjust by task, but protect explicit planning and revision time.' },
    ],
    workedExamples: [
      { problem: 'Correct: “Each of the reports have been checked.”', steps: ['The head subject is “Each”, which is singular.', '“Of the reports” is a prepositional phrase and does not control agreement.', 'Use the singular auxiliary “has”.'], answer: 'Each of the reports has been checked.' },
      { problem: 'Change to passive: “The team had secured the scene.”', steps: ['The object “the scene” becomes the subject.', 'Past perfect is carried by “had”.', 'Passive past perfect uses “had been” + past participle.'], answer: 'The scene had been secured by the team.' },
      { problem: 'Summarise: “Repeated retrieval requires effort, yet that effort strengthens later recall more effectively than passive rereading.”', steps: ['Core subject: retrieval practice.', 'Contrast: feels effortful but improves later recall.', 'Remove comparison wording that can be compressed without losing meaning.'], answer: 'Effortful retrieval strengthens long-term recall better than passive rereading.' },
    ],
    traps: ['Choosing a verb by the nearest noun instead of the head subject.', 'Changing tense while converting active to passive.', 'Using an inference as if the passage stated it directly.', 'Adding personal opinion to a précis.', 'Translating idioms word for word.', 'Writing a polished introduction but leaving little time for the requested analysis.'],
    revision: ['Maintain an error log grouped by grammar rule.', 'Practise one timed précis and one functional-writing task each week.', 'Learn vocabulary through sentences and collocations.', 'Read answer options for scope words such as only, always and some.', 'Outline essays in three minutes before drafting.', 'Proofread once for meaning and once for surface errors.'],
    sources: [{ label: 'British Council LearnEnglish', url: 'https://learnenglish.britishcouncil.org/' }, { label: 'Central Institute of Indian Languages', url: 'https://www.ciil.org/' }, { label: 'NCERT textbooks', url: 'https://ncert.nic.in/textbook.php' }, { label: 'Purdue Online Writing Lab', url: 'https://owl.purdue.edu/' }],
  },
]

export const theoryByTopicId: Readonly<Record<string, TheoryChapter>> = Object.fromEntries(
  theoryChapters.map(chapter => [chapter.topicId, chapter]),
)
