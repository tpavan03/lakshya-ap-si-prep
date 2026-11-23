import type { Question } from '../data'
import { severe, THREE_STATEMENTS, TWO_STATEMENTS } from './severeKit'

/**
 * Severe AP Focus, topic top-up (ids `svp-anc-*`, `svp-med-*`, `svp-cra-*`,
 * `svp-wld-*`). Hand-authored, stable facts only (no office holders, scheme
 * figures or current affairs), in the same multi-statement / match / ordering /
 * assertion–reason formats as severeApFocus.ts, with a reason for every
 * statement. They fill the canonical topics created when "AP ancient and
 * medieval history" and "AP heritage crafts and biodiversity" were split.
 */

const TOPICS = {
  anc: 'AP ancient history',
  med: 'AP medieval history',
  cra: 'AP heritage, crafts and textiles',
  wld: 'AP forests, wildlife and wetlands',
} as const

const q = (id: string, question: string, options: string[], answer: number, explanation: string, hint: string, seconds = 120): Question => {
  const topic = TOPICS[id.split('-')[1] as keyof typeof TOPICS]
  if (!topic) throw new Error(`${id}: unknown area`)
  return severe({ id, subject: 'AP Focus', topic, question, options, answer, explanation, hint, seconds })
}

const list = (items: readonly string[]) => items.map((item, i) => `${i + 1}. ${item}`).join('\n')
const ms = (stem: string, statements: readonly string[]) => `${stem}\n${list(statements)}\nWhich of the statements given above is/are correct?`
const pairs = (stem: string, rows: readonly (readonly [string, string])[]) =>
  `${stem}\n${rows.map(([a, b], i) => `${i + 1}. ${a} : ${b}`).join('\n')}\nHow many of the above pairs are correctly matched?`
const match = (stem: string, left: readonly string[], right: readonly string[]) =>
  `${stem}\nList I\n${left.map((x, i) => `${'ABCD'[i]}. ${x}`).join('\n')}\nList II\n${list(right)}\nSelect the correct code:`
const order = (stem: string, items: readonly string[]) => `${stem}\n${list(items)}\nSelect the correct sequence:`
const ar = (a: string, r: string) => `Assertion (A): ${a}\nReason (R): ${r}\nSelect the correct answer:`

const AR = [
  'Both A and R are true and R is the correct explanation of A',
  'Both A and R are true but R is not the correct explanation of A',
  'A is true but R is false',
  'A is false but R is true',
]
const PAIRS = ['Only one pair', 'Only two pairs', 'Only three pairs', 'All four pairs']

export const severeTopicApFocusQuestions: Question[] = [
  // ───────────── AP ancient history ─────────────
  q('svp-anc-001', ms('Consider the following statements about the Amaravati stupa:', [
    'Its sculptured panels are carved mainly in a greenish-white limestone.',
    'It was built entirely during the Ikshvaku period.',
    'Many of its sculptures are now held in the British Museum and the Government Museum, Chennai.',
  ]), THREE_STATEMENTS, 2,
  '1 is correct: the Amaravati reliefs are carved in the characteristic greenish-white limestone of the Palnadu region. 2 is wrong: the stupa had a long history, beginning around the Mauryan period and enlarged and embellished mainly under the Satavahanas; it was not a single Ikshvaku construction. 3 is correct: large collections of Amaravati marbles went to the British Museum (London) and the Government Museum, Chennai. So 1 and 3 only.',
  'Think about how long the Amaravati stupa was in use.', 100),

  q('svp-anc-002', pairs('Consider the following Buddhist sites and the region in which they lie:', [
    ['Bojjannakonda', 'Sankaram, near Anakapalli'],
    ['Ghantasala', 'Krishna region'],
    ['Chandavaram', 'Prakasam region'],
    ['Thotlakonda', 'Guntur region'],
  ]), PAIRS, 2,
  '1 is correct: the rock-cut Buddhist complex of Bojjannakonda–Lingalakonda is at Sankaram near Anakapalli. 2 is correct: Ghantasala, an ancient port-linked stupa site, is in the Krishna region. 3 is correct: the Chandavaram stupa stands on the Gundlakamma in the Prakasam region. 4 is wrong: Thotlakonda is a hilltop monastery near Visakhapatnam, not in the Guntur region. So only three pairs are correct.',
  'One site belongs to the north coastal cluster around Visakhapatnam.', 100),

  q('svp-anc-003', ar(
    'The Hathigumpha inscription of Kharavela refers to a Satakarni ruling to the west of Kalinga.',
    'Kharavela belonged to the Mahameghavahana (Chedi) line of Kalinga.',
  ), AR, 1,
  'A is true: the Hathigumpha inscription states that Kharavela sent his army westwards disregarding Satakarni, one of the earliest references to a Satavahana king. R is true: Kharavela was the most famous ruler of the Mahameghavahana (Chedi) dynasty of Kalinga. But his dynasty does not explain why the inscription mentions Satakarni, so R is not the explanation of A.',
  'Ask whether R explains the content of A or only describes its author.', 100),

  q('svp-anc-004', ms('Consider the following statements about the Vishnukundins:', [
    'The rock-cut Undavalli cave temples near Vijayawada are commonly attributed to the Vishnukundin period.',
    'The Vishnukundins ruled as feudatories of the Rashtrakutas.',
  ]), TWO_STATEMENTS, 0,
  '1 is correct: the rock-cut Undavalli caves on the Krishna near Vijayawada are generally associated with Vishnukundin patronage. 2 is wrong: the Vishnukundins ruled from about the 5th century until the early 7th century, when Pulakesin II of the Badami Chalukyas took Vengi — long before the Rashtrakutas rose to power in the 8th century. So 1 only.',
  'Compare the centuries of the two dynasties.', 80),

  q('svp-anc-005', ms('Consider the following statements about Satavahana coinage:', [
    'Some Satavahana coins carry a ship motif, pointing to maritime trade.',
    'Lead and potin were widely used for Satavahana coins.',
    'The Satavahanas were the first dynasty in India to issue gold coins.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: ship-type coins (associated especially with Yajna Sri Satakarni) reflect the importance of sea trade from the eastern Deccan coast. 2 is correct: the Satavahanas issued large numbers of lead and potin coins besides copper and silver. 3 is wrong: gold coinage in India was issued earlier on a large scale by the Indo-Greeks and especially the Kushanas; the Satavahanas are not known for gold issues. So 1 and 2 only.',
  'Think of which northern dynasty is famous for gold coins.', 100),

  q('svp-anc-006', ms('Consider the following statements about the Eastern Chalukyas of Vengi:', [
    'Their capital Vengi is identified with Pedavegi near Eluru.',
    'Vijayaditya III (Gunaga Vijayaditya) fought prolonged wars against the Rashtrakutas.',
    'A marriage alliance with the Cholas produced Kulottunga I, who united the Vengi and Chola thrones.',
  ]), THREE_STATEMENTS, 3,
  '1 is correct: ancient Vengi is identified with Pedavegi near Eluru. 2 is correct: Gunaga Vijayaditya (9th century) is remembered for his campaigns against the Rashtrakutas and their allies. 3 is correct: Rajaraja Narendra married a Chola princess; their son Rajendra Chalukya became the Chola emperor Kulottunga I, linking the two houses. So all three are correct.',
  'Each statement concerns a different century of the dynasty.', 110),

  q('svp-anc-007', match('Match the inscription (List I) with the ruler it principally concerns (List II):', [
    'Nasik prasasti', 'Aihole inscription', 'Mayidavolu copper plates', 'Hathigumpha inscription',
  ], [
    'Pulakesin II',
    'Gautamiputra Satakarni',
    'Kharavela',
    'Pallava Sivaskandavarman',
  ]), ['A-2, B-1, C-3, D-4', 'A-1, B-2, C-4, D-3', 'A-2, B-4, C-1, D-3', 'A-2, B-1, C-4, D-3'], 3,
  'The Nasik prasasti of Gautami Balasri eulogises her son Gautamiputra Satakarni (A-2). The Aihole inscription composed by Ravikirti records the achievements of Pulakesin II (B-1). The Mayidavolu copper plates, found in the Guntur region, are a Prakrit grant of the early Pallava prince Sivaskandavarman (C-4). The Hathigumpha inscription at Udayagiri records Kharavela of Kalinga (D-3).',
  'The Mayidavolu plates are an early Pallava record found in Andhra.', 120),

  q('svp-anc-008', ar(
    'In ancient records the Amaravati region was known as Dhanyakataka.',
    'Dhanyakataka was the capital of the Eastern Chalukyas.',
  ), AR, 2,
  'A is true: Dhanyakataka (near present Dharanikota–Amaravati) was the ancient name of the Amaravati region and an important Satavahana-period centre. R is false: the Eastern Chalukya capital was Vengi (and later Rajamahendravaram), not Dhanyakataka.',
  'Recall where the Eastern Chalukyas ruled from.', 80),

  // ───────────── AP medieval history ─────────────
  q('svp-med-001', ms('Consider the following statements about the Kakatiyas:', [
    'The Motupalli inscription of Ganapatideva assured safety and fair duties to sea traders at the port.',
    'Rudramadevi succeeded Ganapatideva on the Kakatiya throne.',
    'The Thousand Pillar Temple at Hanamkonda was built by Prataparudra II.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: Ganapatideva’s Motupalli (abhaya) inscription of the 1240s guaranteed protection and fixed duties to merchants using the port. 2 is correct: his daughter Rudramadevi succeeded him. 3 is wrong: the Thousand Pillar Temple was built in the 12th century under Rudradeva (Rudra I); Prataparudra II was the last Kakatiya ruler, defeated by the Tughlaqs in 1323. So 1 and 2 only.',
  'The temple is much older than the last Kakatiya king.', 100),

  q('svp-med-002', ms('Consider the following statements about the Reddi kingdom:', [
    'Kumaragiri Reddi is credited with Vasantarajiyam, a treatise on dance.',
    'The Reddi kingdom was annexed by the Kakatiyas.',
    'The poet Srinatha was associated with the court of Pedakomati Vema Reddi.',
  ]), THREE_STATEMENTS, 2,
  '1 is correct: Vasantarajiyam, a work on dance and dramaturgy, is attributed to Kumaragiri Reddi. 2 is wrong: the Reddi kingdom arose in the 14th century after the fall of the Kakatiyas (1323); it was later absorbed by Vijayanagara and the Gajapatis. 3 is correct: Srinatha served at the court of Pedakomati Vema Reddi of Kondavidu. So 1 and 3 only.',
  'Place the Reddis relative to the fall of Warangal.', 100),

  q('svp-med-003', order('Arrange the following events in chronological order:', [
    'Battle of Talikota (Rakkasa-Tangadi)',
    'Foundation of Hyderabad by Muhammad Quli Qutb Shah',
    'Mughal conquest of Golconda',
    'Assertion of an independent Qutb Shahi kingdom by Sultan Quli',
  ]), ['4, 2, 1, 3', '4, 1, 2, 3', '1, 4, 2, 3', '4, 1, 3, 2'], 1,
  'Sultan Quli asserted independence at Golconda in 1518 (4). The Deccan sultanates defeated Vijayanagara at Talikota in 1565 (1). Muhammad Quli Qutb Shah founded Hyderabad in 1591 (2). Aurangzeb’s forces took Golconda in 1687 (3). Sequence: 4, 1, 2, 3.',
  'The Qutb Shahi state was already about half a century old at Talikota.', 90),

  q('svp-med-004', ar(
    'The Kakatiya rulers and their nobles built a large number of irrigation tanks.',
    'The semi-arid plateau they ruled lacked dependable river irrigation, so storing rainwater in tanks was essential for agriculture.',
  ), AR, 0,
  'A is true: Kakatiya-period tanks such as those at Ramappa and Pakhal are celebrated, and tank-building was encouraged as a meritorious act. R is true and explains A: on the rain-fed Deccan plateau, away from the deltas, tanks were the practical way to store monsoon water for cultivation.',
  'Ask whether the geography in R is the reason for the policy in A.', 90),

  // ───────────── AP heritage, crafts and textiles ─────────────
  q('svp-cra-001', ms('Consider the following statements about the crafts of Andhra Pradesh:', [
    'Budithi bell-metal ware is a craft of the Chittoor region.',
    'The Bobbili veena has a Geographical Indication tag.',
    'Kondapalli toys have a Geographical Indication tag.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: Budithi, known for bell-metal and brass ware, is in the Srikakulam region of north coastal Andhra. 2 is correct: the Bobbili veena, carved from jackfruit wood, is a registered GI. 3 is correct: Kondapalli toys of light tella poniki wood are a registered GI. So 2 and 3 only.',
  'Budithi and Bobbili are both north coastal craft centres.', 90),

  q('svp-cra-002', match('Match the temple centre (List I) with its distinctive feature (List II):', [
    'Srikalahasti', 'Mahanandi', 'Ahobilam', 'Srisailam',
  ], [
    'Linga worshipped as the element air (Vayu) among the Pancha Bhuta Sthalas',
    'Nine Nandi shrines (Nava Nandulu) around the main temple',
    'Nine shrines of Narasimha (Nava Narasimha)',
    'Both a jyotirlinga and a Shakti peetha',
  ]), ['A-1, B-3, C-2, D-4', 'A-4, B-2, C-3, D-1', 'A-1, B-2, C-4, D-3', 'A-1, B-2, C-3, D-4'], 3,
  'Srikalahasti is the Vayu (air) sthala among the five element shrines (A-1). Mahanandi is surrounded by the Nava Nandulu, nine Nandi shrines (B-2). Ahobilam in the Nallamala hills has the Nava Narasimha shrines (C-3). Srisailam’s Mallikarjuna is a jyotirlinga and Bhramaramba a Shakti peetha (D-4).',
  'Two centres are known for "nine" shrines — Nandi and Narasimha; do not swap them.', 110),

  q('svp-cra-003', ms('Consider the following statements about the Tirumala temple:', [
    'Its architecture is predominantly in the northern Nagara style.',
    'The Tirumala hills form part of the Seshachalam range of the Eastern Ghats.',
    'Copper plates inscribed with Annamacharya’s sankirtanas are preserved at Tirumala.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: the Tirumala temple, with its gopurams and the gold-plated Ananda Nilayam vimana, belongs to the southern Dravida tradition. 2 is correct: the seven hills of Tirumala are part of the Seshachalam hills. 3 is correct: thousands of Annamacharya’s compositions survive on copper plates preserved by the temple. So 2 and 3 only.',
  'Gopurams and vimanas indicate which architectural tradition?', 90),

  q('svp-cra-004', ms('Consider the following statements about the Simhachalam temple:', [
    'The deity remains covered with sandalwood paste except during the Chandanotsavam, when the original form is shown.',
    'The presiding deity is a form of Shiva.',
    'The temple stands on a hill near Visakhapatnam.',
  ]), THREE_STATEMENTS, 2,
  '1 is correct: the image of Varaha Lakshmi Narasimha is kept covered in sandal paste; the nija rupa darshanam is given at Chandanotsavam (Akshaya Tritiya). 2 is wrong: the deity is Varaha Lakshmi Narasimha, a form of Vishnu. 3 is correct: Simhachalam is on a hill on the outskirts of Visakhapatnam. So 1 and 3 only.',
  'Recall the composite Vishnu form worshipped there.', 90),

  // ───────────── AP forests, wildlife and wetlands ─────────────
  q('svp-wld-001', ms('Consider the following statements about the wetlands of Andhra Pradesh:', [
    'Kolleru Lake was designated a Ramsar wetland in 2002.',
    'Pulicat Lake is separated from the Bay of Bengal largely by the barrier island of Sriharikota.',
    'Pulicat Lake lies wholly within Andhra Pradesh.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: Kolleru, the freshwater lake between the Krishna and Godavari deltas, was designated a Ramsar site in 2002. 2 is correct: the Sriharikota barrier island separates most of Pulicat lagoon from the sea. 3 is wrong: Pulicat is shared between Andhra Pradesh and Tamil Nadu. So 1 and 2 only.',
  'One of these wetlands crosses a state boundary.', 90),

  q('svp-wld-002', ar(
    'The Nagarjunasagar–Srisailam Tiger Reserve is among the largest tiger reserves in India by area.',
    'Tiger reserves are notified by State Governments on the recommendation of the National Tiger Conservation Authority under the Wildlife (Protection) Act, 1972.',
  ), AR, 1,
  'A is true: spread over the Nallamala hills, the Nagarjunasagar–Srisailam Tiger Reserve is usually cited as India’s largest tiger reserve by area. R is true: Section 38V of the Wildlife (Protection) Act, 1972 provides for notification of tiger reserves by the state on NTCA’s recommendation. But the legal procedure does not explain the reserve’s size, so R is not the explanation of A.',
  'R is a general legal fact; does it account for the size of this reserve?', 100),

  q('svp-wld-003', pairs('Consider the following wetlands/protected areas and their features:', [
    ['Pulicat Lake', 'Large wintering flocks of flamingos'],
    ['Coringa', 'Mangroves of the Godavari estuary'],
    ['Rollapadu', 'Great Indian Bustard grassland'],
    ['Kolleru', 'Brackish coastal lagoon open to the sea'],
  ]), PAIRS, 2,
  '1 is correct: Pulicat is known for large numbers of wintering greater flamingos (hence the Flamingo Festival). 2 is correct: Coringa protects the Godavari-estuary mangroves near Kakinada. 3 is correct: Rollapadu’s grasslands are a Great Indian Bustard habitat. 4 is wrong: Kolleru is a shallow freshwater lake between the deltas, not a brackish lagoon — that description fits Pulicat. So only three pairs are correct.',
  'Distinguish the freshwater lake from the coastal lagoon.', 100),

  q('svp-wld-004', ms('Consider the following statements about the mangroves of Andhra Pradesh:', [
    'They occur mainly in the Godavari and Krishna estuaries.',
    'Many mangrove trees have pneumatophores (breathing roots) suited to waterlogged saline soils.',
    'Several mangrove species show vivipary, with seeds germinating while still attached to the parent tree.',
  ]), THREE_STATEMENTS, 3,
  '1 is correct: the main mangrove stands of the state are in the Godavari (Coringa) and Krishna estuaries. 2 is correct: pneumatophores let roots obtain oxygen in anaerobic, waterlogged mud. 3 is correct: vivipary (for example in Rhizophora) is a characteristic mangrove adaptation. So all three are correct.',
  'All three describe either the location or the adaptations of mangroves.', 90),
]
