import type { Question } from '../data'
import { severe, THREE_STATEMENTS, TWO_STATEMENTS } from './severeKit'

/**
 * Severe AP Focus bank (ids `svp-*`): hand-authored hard items on Andhra Pradesh
 * history, movements, geography, rivers, economy, culture, crafts and governance,
 * modelled on the multi-statement / match / ordering / assertion-reason style of
 * recent APPSC Group-2 and AP SI Paper II papers. Only stable facts are used;
 * district names, office holders, scheme figures and capital questions are avoided.
 */

const TOPICS = {
  his: 'AP ancient and medieval history',
  mod: 'AP modern history and social movements',
  geo: 'AP physical geography',
  riv: 'AP rivers and water projects',
  eco: 'AP economy and agriculture',
  art: 'AP literature and performing arts',
  gov: 'AP formation and governance',
  bio: 'AP heritage crafts and biodiversity',
} as const

type Area = keyof typeof TOPICS

const q = (id: string, question: string, options: string[], answer: number, explanation: string, hint: string, seconds = 120): Question => {
  const area = id.split('-')[1] as Area
  const topic = TOPICS[area]
  if (!topic) throw new Error(`${id}: unknown area`)
  return severe({ id, subject: 'AP Focus', topic, question, options, answer, explanation, hint, seconds })
}

const list = (items: readonly string[]) => items.map((item, i) => `${i + 1}. ${item}`).join('\n')
const ms = (stem: string, statements: readonly string[]) => `${stem}\n${list(statements)}\nWhich of the statements given above is/are correct?`
const pairs = (stem: string, rows: readonly (readonly [string, string])[]) =>
  `${stem}\n${rows.map(([a, b], i) => `${i + 1}. ${a} : ${b}`).join('\n')}\nHow many of the above pairs are correctly matched?`
const howMany = (stem: string, items: readonly string[]) => `${stem}\n${list(items)}\nHow many of the above are correct?`
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
const COUNT = ['Only one', 'Only two', 'Only three', 'All four']

export const severeApFocusQuestions: Question[] = [
  // ───────────── AP ancient and medieval history ─────────────
  q('svp-his-001', ms('Consider the following statements about the Satavahanas:', [
    'The achievements of Gautamiputra Satakarni are recorded in the Nasik prasasti issued by his mother Gautami Balasri.',
    'Satavahana inscriptions were composed mainly in Sanskrit.',
    'The Satavahana king Hala is credited with compiling the Gathasaptasati in Maharashtri Prakrit.',
  ]), THREE_STATEMENTS, 2,
  '1 is correct: the Nasik cave inscription of Gautami Balasri eulogises her son Gautamiputra Satakarni. 2 is wrong: Satavahana inscriptions are overwhelmingly in Prakrit, not Sanskrit. 3 is correct: the Gathasaptasati (Sattasai), an anthology of Prakrit verses, is attributed to Hala. So 1 and 3 only.',
  'Think of the language of the Satavahana court and its records.', 100),

  q('svp-his-002', ms('Consider the following statements about the Ikshvakus of the Krishna valley:', [
    'Their capital was Vijayapuri in the Nagarjunakonda valley.',
    'While the kings performed Vedic sacrifices, royal women of the family were major patrons of Buddhist foundations at Nagarjunakonda.',
    'They ruled from Vengi, which later became the capital of the Eastern Chalukyas.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: Vijayapuri in the Nagarjunakonda valley was the Ikshvaku capital. 2 is correct: Vasishthiputra Chamtamula is credited with Vedic sacrifices such as the Asvamedha, while queens and princesses (for example Chamtisri) endowed the Buddhist viharas and stupas. 3 is wrong: Vengi was the seat of the Salankayanas and later the Eastern Chalukyas, not of the Ikshvakus. So 1 and 2 only.',
  'Separate the Krishna valley capital from the Godavari–Krishna doab capital.', 100),

  q('svp-his-003', ar(
    'The Ikshvaku-period monuments now seen at the Nagarjunakonda island museum are largely relocated reconstructions.',
    'The original Nagarjunakonda valley was submerged by the reservoir of the Nagarjuna Sagar dam on the Krishna.',
  ), AR, 0,
  'A is true: several stupas, viharas and other structures were dismantled and rebuilt on the hilltop (now an island) and on the reservoir bank. R is true: the valley went under the Nagarjuna Sagar reservoir. R is exactly why the monuments had to be relocated, so R correctly explains A.',
  'Ask why the structures had to be moved at all.', 90),

  q('svp-his-004', match('Match the Buddhist site (List I) with its distinctive feature (List II):', [
    'Bhattiprolu', 'Salihundam', 'Guntupalli', 'Thotlakonda',
  ], [
    'Hilltop monastery overlooking the sea near Visakhapatnam',
    'Relic-casket inscriptions in an early southern Brahmi variant',
    'Stupa complex on the bank of the Vamsadhara river',
    'Rock-cut circular chaitya cave',
  ]), ['A-2, B-3, C-1, D-4', 'A-3, B-2, C-4, D-1', 'A-2, B-4, C-3, D-1', 'A-2, B-3, C-4, D-1'], 3,
  'Bhattiprolu stupa yielded relic caskets with inscriptions in the so-called Bhattiprolu script, an early southern Brahmi variant (A-2). Salihundam stands on the bank of the Vamsadhara in the Srikakulam region (B-3). Guntupalli is famous for its rock-cut circular chaityagriha (C-4). Thotlakonda is a hilltop monastery overlooking the Bay of Bengal near Visakhapatnam (D-1).',
  'Bhattiprolu is best known for a script, not for architecture.', 120),

  q('svp-his-005', ms('Consider the following statements about the Vishnukundins:', [
    'Their records describe them as devotees of Sri Parvata Swami, the deity of Srisailam.',
    'Their rule in the Vengi region ended with the conquests of Pulakesin II of Badami, after which Kubja Vishnuvardhana was placed in charge of Vengi.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: Vishnukundin inscriptions call the family worshippers of Sri Parvata Swami (Srisailam). 2 is correct: Pulakesin II’s eastern campaign ended Vishnukundin power in coastal Andhra, and his brother Kubja Vishnuvardhana founded the Eastern Chalukya line at Vengi. Hence both.',
  'One statement is about religion, the other about the dynasty that followed.', 90),

  q('svp-his-006', ms('Consider the following statements about the Eastern Chalukyas of Vengi:', [
    'The line was founded by Kubja Vishnuvardhana, brother of Pulakesin II.',
    'Nannaya began the Telugu Mahabharata under the patronage of Rajaraja Narendra of this dynasty.',
    'Kulottunga I, born of Eastern Chalukya–Chola marriage ties, ascended the Chola throne and linked the two houses.',
  ]), THREE_STATEMENTS, 3,
  '1 is correct: Kubja Vishnuvardhana founded the dynasty at Vengi in the 7th century. 2 is correct: Nannaya, the Adikavi, was court poet of Rajaraja Narendra. 3 is correct: Rajendra Chalukya, son of Rajaraja Narendra and a Chola princess, became Kulottunga I of the Chola empire. All three are correct.',
  'All three statements describe well-known landmarks of the dynasty.', 100),

  q('svp-his-007', order('Arrange the following events in chronological order:', [
    'Kubja Vishnuvardhana established at Vengi',
    'Battle of Talikota (Rakkasa-Tangadi)',
    'Foundation of the Vijayanagara kingdom by Harihara and Bukka',
    'Final defeat of Kakatiya Prataparudra II by the Tughlaq army under Ulugh Khan',
  ]), ['1, 3, 4, 2', '1, 4, 3, 2', '4, 1, 3, 2', '1, 4, 2, 3'], 1,
  'Kubja Vishnuvardhana took Vengi in the early 7th century (c. 624 CE). Ulugh Khan (later Muhammad bin Tughlaq) captured Warangal and Prataparudra II in 1323. Vijayanagara was founded in 1336. Talikota was fought in 1565. Sequence: 1, 4, 3, 2.',
  'The fall of Warangal came just over a decade before Vijayanagara.', 90),

  q('svp-his-008', pairs('Consider the following pairs relating to the Kakatiyas:', [
    ['Ganapatideva', 'Shifted the capital from Hanumakonda to Orugallu'],
    ['Rudramadevi', 'Her kingdom is described by Marco Polo, who visited Motupalli'],
    ['Recherla Rudra', 'Builder of the Thousand Pillar temple at Hanumakonda'],
    ['Motupalli inscription', 'Charter of protection (abhaya-sasana) issued by Ganapatideva to sea traders'],
  ]), PAIRS, 2,
  'Pair 1 is correct: Ganapatideva completed the shift of the capital to Orugallu (Warangal). Pair 2 is correct: Marco Polo landed at Motupalli and praised the queen who ruled there, i.e. Rudramadevi. Pair 3 is wrong: the Thousand Pillar temple was built by Rudradeva (Rudra I); Recherla Rudra, Ganapatideva’s general, built the Ramappa temple at Palampet. Pair 4 is correct: Ganapatideva’s Motupalli charter assured merchants of fair customs and protection. Three pairs are correct.',
  'Two Kakatiya-era temples are often confused by their builders.', 120),

  q('svp-his-009', ms('Consider the following statements about the Reddi kingdoms:', [
    'Prolaya Vema Reddi founded the kingdom with Addanki as an early capital; Kondavidu later became its principal seat.',
    'Srinatha served as a court poet of Krishnadevaraya.',
    'Errana, who completed the Aranya Parva of the Telugu Mahabharata, enjoyed the patronage of Prolaya Vema Reddi.',
  ]), THREE_STATEMENTS, 2,
  '1 is correct: the Reddi kingdom began at Addanki under Prolaya Vema Reddi (14th century) and shifted to Kondavidu. 2 is wrong: Srinatha (14th–15th century) was vidyadhikari under Pedakomati Vema Reddi and lived long before Krishnadevaraya (1509–1529). 3 is correct: Errana was Prolaya Vema Reddi’s court poet. So 1 and 3 only.',
  'Check the century of Srinatha against that of Krishnadevaraya.', 100),

  q('svp-his-010', ms('Consider the following statements about the period after the fall of Warangal (1323):', [
    'Musunuri Prolaya Nayaka and Kapaya Nayaka led a confederacy of Nayakas that freed much of Andhra from Tughlaq control.',
    'The Vilasa copper-plate grant of Prolaya Nayaka describes the hardships suffered under Tughlaq occupation.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: the Musunuri Nayakas, Prolaya Nayaka and later Kapaya Nayaka, organised the resistance that ended Tughlaq rule over most of Andhra. 2 is correct: the Vilasa grant is the key source describing the oppression of the Tughlaq period. Both are correct.',
  'The Vilasa grant is the standard source for this episode.', 90),

  q('svp-his-011', order('Arrange the ruling dynasties of Vijayanagara in chronological order:', [
    'Tuluva', 'Aravidu', 'Sangama', 'Saluva',
  ]), ['3, 1, 4, 2', '3, 4, 2, 1', '4, 3, 1, 2', '3, 4, 1, 2'], 3,
  'Vijayanagara was ruled successively by the Sangama (from 1336), Saluva (from c. 1485), Tuluva (from c. 1505, including Krishnadevaraya) and Aravidu (from c. 1570, ruling from Penukonda and Chandragiri) dynasties. Sequence: 3, 4, 1, 2.',
  'Krishnadevaraya’s dynasty was the third.', 70),

  q('svp-his-012', ms('Consider the following statements about Krishnadevaraya:', [
    'He composed Amuktamalyada in Telugu on the legend of Andal (Goda Devi).',
    'He is credited with the Sanskrit drama Jambavati Kalyanam.',
    'Fernao Nuniz visited his court and left the famous eyewitness account of the Mahanavami festival during his reign.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: Amuktamalyada narrates the story of Andal and Vishnu. 2 is correct: Jambavati Kalyanam is a Sanskrit play attributed to him. 3 is wrong: the eyewitness account of Krishnadevaraya’s court and the Mahanavami festival is by Domingo Paes; Fernao Nuniz came later, during Achyutaraya’s reign, and wrote a chronicle. So 1 and 2 only.',
  'Two Portuguese visitors, two different reigns.', 100),

  q('svp-his-013', ar(
    'The Battle of Talikota (1565) led to the rapid decline of the Vijayanagara kingdom and the sack of its capital.',
    'Krishnadevaraya personally commanded the Vijayanagara army at Talikota.',
  ), AR, 2,
  'A is true: after the defeat in 1565 the city of Vijayanagara (Hampi) was sacked and the empire never regained its power. R is false: Krishnadevaraya died in 1529; the Vijayanagara forces at Talikota were led by Aliya Rama Raya, regent for Sadasiva Raya.',
  'Check when Krishnadevaraya died.', 80),

  q('svp-his-014', ms('With reference to Krishnadevaraya’s campaigns against the Gajapatis of Odisha, consider the following:', [
    'The hill fort of Udayagiri was captured from the Gajapatis.',
    'Kondavidu was captured from the Gajapatis during the same series of campaigns.',
    'He set up a pillar of victory at Potnuru near Simhachalam.',
  ]), THREE_STATEMENTS, 3,
  '1 is correct: Udayagiri (Nellore region) fell to him early in the Kalinga campaign. 2 is correct: Kondavidu, then a Gajapati stronghold, was taken next. 3 is correct: his victory pillar at Potnuru-Simhadri marks the northernmost point of the campaign. All three are correct.',
  'The campaign moved from south to north along the coast.', 100),

  q('svp-his-015', ms('Consider the following statements about the Qutb Shahis of Golconda:', [
    'Akkanna and Madanna were ministers of Muhammad Quli Qutb Shah.',
    'Muhammad Quli Qutb Shah founded Hyderabad and built the Charminar (1591).',
    'Golconda was annexed by Aurangzeb in 1687, ending the rule of Abul Hasan Tana Shah.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: Akkanna and Madanna were the powerful ministers of the last ruler, Abul Hasan Tana Shah. 2 is correct: Muhammad Quli founded Hyderabad and built the Charminar in 1591. 3 is correct: Aurangzeb took Golconda in 1687 and Tana Shah was imprisoned. So 2 and 3 only.',
  'The two Brahmin ministers belong to the last reign.', 100),

  q('svp-his-016', pairs('Consider the following Pancharama kshetras and their locations:', [
    ['Ksheerarama', 'Palakollu'],
    ['Kumararama', 'Samarlakota (Samalkot)'],
    ['Somarama', 'Bhimavaram'],
    ['Amararama', 'Srisailam'],
  ]), PAIRS, 2,
  'Pairs 1, 2 and 3 are correct: Ksheerarama is at Palakollu, Kumararama (Kumara Bhimeswara) at Samarlakota and Somarama at Gunupudi, Bhimavaram. Pair 4 is wrong: Amararama (Amareswara) is at Amaravati on the Krishna, not at Srisailam (a Jyotirlinga, not a Pancharama). The fifth Pancharama is Draksharama. Three pairs are correct.',
  'Srisailam is a Jyotirlinga, not a Pancharama.', 110),

  q('svp-his-017', ms('Consider the following statements about the Veerabhadra temple at Lepakshi:', [
    'It was built in the 16th century by the brothers Virupanna and Viranna, officials of the Vijayanagara kingdom.',
    'It is noted for its hanging pillar and a large monolithic Nandi nearby.',
    'It stands in the Krishna delta.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: Virupanna and Viranna, governors under Achyutaraya, built the temple. 2 is correct: the hanging pillar and the huge monolithic Nandi are its best-known features. 3 is wrong: Lepakshi is in the dry Rayalaseema region near Hindupur, far from the Krishna delta. So 1 and 2 only.',
  'Lepakshi is near the Karnataka border in Rayalaseema.', 90),

  q('svp-his-018', ms('Consider the following statements about Ashokan inscriptions in Andhra:', [
    'The Erragudi edicts are written in the Kharoshthi script.',
    'Erragudi in the Kurnool region has a set of Ashoka’s Major Rock Edicts.',
  ]), TWO_STATEMENTS, 1,
  '1 is wrong: the Erragudi edicts are in Brahmi (some lines are even written boustrophedon); Kharoshthi was used only in the north-west. 2 is correct: Erragudi is one of the sites of Ashoka’s Major Rock Edicts in south India. So 2 only.',
  'Kharoshthi belongs to the north-west frontier.', 80),

  q('svp-his-019', ms('Consider the following statements about the north coastal region:', [
    'Mukhalingam is identified with Kalinganagara, an early capital of the Eastern Gangas.',
    'The Srikurmam temple is dedicated to the Kurma (tortoise) incarnation of Vishnu.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: Mukhalingam on the Vamsadhara is identified with Kalinganagara of the Eastern Ganga kings. 2 is correct: Srikurmam is one of the rare temples where Vishnu is worshipped as Kurma. Both are correct.',
  'Both are temple towns of the Srikakulam region.', 80),

  q('svp-his-020', 'Which one of the following pairs of capital and dynasty is NOT correctly matched?',
    ['Vijayapuri – Ikshvakus', 'Vengi – Eastern Chalukyas', 'Kondavidu – Reddis', 'Penukonda – Kakatiyas'], 3,
  'Vijayapuri was the Ikshvaku capital, Vengi the Eastern Chalukya capital and Kondavidu the later Reddi capital, so the first three are correct. Penukonda was a seat of the Aravidu rulers of Vijayanagara after Talikota; the Kakatiya capitals were Hanumakonda and Orugallu (Warangal). Hence the fourth pair is wrong.',
  'One of these is a post-Talikota Vijayanagara seat.', 70),

  q('svp-his-021', ms('Consider the following statements about the Battle of Palnadu:', [
    'It was fought at Karempudi in the 12th century.',
    'Brahma Naidu and Nayakuralu Nagamma led the rival factions in the conflict.',
    'Srinatha composed Palnati Veera Charitra on this episode.',
  ]), THREE_STATEMENTS, 3,
  '1 is correct: the battle was fought at Karempudi in the Palnadu region in the late 12th century. 2 is correct: Brahma Naidu (minister of Malideva’s faction) and Nagamma (minister of Nalagama’s faction) were the rival leaders. 3 is correct: Srinatha’s Palnati Veera Charitra narrates the story. All three are correct.',
  'This is the “Andhra Kurukshetra”.', 90),

  q('svp-his-022', ar(
    'After 1565 the Aravidu rulers moved the seat of the Vijayanagara kingdom to Penukonda and later to Chandragiri.',
    'The city of Vijayanagara (Hampi) was sacked after the defeat at Talikota.',
  ), AR, 0,
  'A is true: Tirumala Deva Raya shifted to Penukonda, and later Aravidu rulers moved to Chandragiri (and Vellore). R is true: the victorious Deccan Sultanates sacked Hampi. The destruction of the old capital is the reason the seat moved, so R correctly explains A.',
  'Why could they not return to Hampi?', 80),

  q('svp-his-023', order('Arrange the following dynasties in the order in which they rose to power in the Krishna–Godavari region:', [
    'Vishnukundins', 'Satavahanas', 'Eastern Chalukyas', 'Ikshvakus',
  ]), ['2, 4, 3, 1', '2, 4, 1, 3', '4, 2, 1, 3', '2, 1, 4, 3'], 1,
  'The Satavahanas came first (from about the 1st century BCE), followed by the Ikshvakus (3rd century CE), then the Vishnukundins (5th–7th centuries) and finally the Eastern Chalukyas (from the 7th century). Sequence: 2, 4, 1, 3.',
  'The Eastern Chalukyas replaced the Vishnukundins.', 70),

  // ───────────── AP modern history and social movements ─────────────
  q('svp-mod-001', ms('Consider the following statements about the Andhra movement:', [
    'The first Andhra Mahasabha (Andhra conference) was held at Bapatla in 1913.',
    'The Indian National Congress constituted a separate Andhra Provincial Congress Committee in 1918.',
    'The Jogipet (1930) conference of the Andhra Mahasabha was presided over by Konda Venkatappayya.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: the first Andhra conference met at Bapatla in 1913. 2 is correct: the Congress recognised a separate Andhra circle in 1918. 3 is wrong: Jogipet (1930) was the first conference of the Andhra Mahasabha in the Nizam’s Hyderabad State and was presided over by Suravaram Pratapa Reddy. So 1 and 2 only.',
  'Two different “Andhra Mahasabhas” existed — one in each region.', 100),

  q('svp-mod-002', ms('Consider the following statements about the Sri Bagh Pact:', [
    'It was signed between leaders of Coastal Andhra and Telangana.',
    'It was concluded on 16 November 1937 at Sri Bagh, the Madras residence of Kasinathuni Nageswara Rao.',
    'It assured Rayalaseema priority in the use of Krishna and Tungabhadra waters.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: the pact was between leaders of Coastal Andhra and Rayalaseema (Telangana was then in the Nizam’s state). 2 is correct: it was signed on 16 November 1937 at Sri Bagh, Kasinathuni Nageswara Rao’s house in Madras. 3 is correct: it promised priority to Rayalaseema in irrigation from the Krishna and Tungabhadra, besides balancing the location of the university and the high court/capital. So 2 and 3 only.',
  'In 1937 Telangana was not part of the Madras Presidency.', 110),

  q('svp-mod-003', ms('Consider the following statements:', [
    'Potti Sriramulu died on 15 December 1952 during his fast for a separate Andhra State.',
    'The High Court of the new Andhra State was located at Kurnool.',
    'Andhra State was inaugurated on 1 October 1953 with Kurnool as its capital.',
  ]), THREE_STATEMENTS, 2,
  '1 is correct: his fast began on 19 October 1952 and he died on 15 December 1952, after 58 days. 2 is wrong: the capital was at Kurnool but the High Court was at Guntur. 3 is correct: Andhra State came into existence on 1 October 1953 with Kurnool as capital. So 1 and 3 only.',
  'The capital and the High Court were in different towns.', 100),

  q('svp-mod-004', pairs('Consider the following pairs relating to Andhra State (1953):', [
    ['First Chief Minister', 'Tanguturi Prakasam'],
    ['First Governor', 'C. M. Trivedi'],
    ['Committee on its financial and administrative issues', 'Justice K. N. Wanchoo'],
    ['Seat of the High Court', 'Guntur'],
  ]), PAIRS, 3,
  'All four are correct: Tanguturi Prakasam was the first Chief Minister; C. M. Trivedi the first Governor; Justice K. N. Wanchoo examined the financial and administrative questions arising from the creation of the state; and the High Court functioned at Guntur.',
  'Every pair here is a standard 1953 fact.', 100),

  q('svp-mod-005', ms('Consider the following statements about the States Reorganisation Commission (1953–55):', [
    'It was chaired by Fazl Ali with K. M. Panikkar and H. N. Kunzru as members.',
    'It suggested that the Telangana region could remain a separate state and merge with Andhra after the 1961 elections if its legislature agreed by a two-thirds majority.',
    'It recommended the immediate merger of Telangana with Andhra State.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: Fazl Ali chaired; Panikkar and Kunzru were members. 2 is correct: the SRC favoured a separate Hyderabad State (Telangana) for the time being, with merger possible after the 1961 elections on a two-thirds vote of its legislature. 3 is therefore wrong: the commission did not recommend immediate merger; the merger of 1956 was a political decision. So 1 and 2 only.',
  'Statements 2 and 3 cannot both be true.', 110),

  q('svp-mod-006', ms('Consider the following statements about the Gentlemen’s Agreement:', [
    'It was concluded on 20 February 1956 between leaders of Andhra and Telangana.',
    'It provided for a Regional Council (standing committee) for the Telangana region.',
    'It provided that if the Chief Minister was from Andhra, the Deputy Chief Minister would be from Telangana, and vice versa.',
  ]), THREE_STATEMENTS, 3,
  '1 is correct: the agreement was reached in Delhi on 20 February 1956. 2 is correct: a Telangana Regional Council was to oversee development and planning for the region. 3 is correct: it included the CM/Deputy CM sharing clause. All three are correct.',
  'All three are core provisions or facts of the 1956 agreement.', 100),

  q('svp-mod-007', order('Arrange the following in chronological order:', [
    'Gentlemen’s Agreement',
    'Death of Potti Sriramulu',
    'Sri Bagh Pact',
    'Report of the JVP Committee',
  ]), ['4, 3, 2, 1', '3, 2, 4, 1', '3, 4, 1, 2', '3, 4, 2, 1'], 3,
  'Sri Bagh Pact – November 1937; JVP (Jawaharlal–Vallabhbhai–Pattabhi) Committee report – 1949; death of Potti Sriramulu – December 1952; Gentlemen’s Agreement – February 1956. Sequence: 3, 4, 2, 1.',
  'Only one event is pre-independence.', 90),

  q('svp-mod-008', ms('Consider the following statements about the Mulki rules and the Jai Andhra movement:', [
    'The Mulki rules were introduced by the Madras Presidency government.',
    'The Supreme Court upheld the validity of the Mulki rules in 1972, which triggered the Jai Andhra agitation.',
    'The Six-Point Formula that followed was given constitutional backing through Article 371D, inserted by the Constitution (32nd Amendment) Act, 1973.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: the Mulki rules originated in Hyderabad State, by a firman of the Nizam (1919). 2 is correct: the Supreme Court’s 1972 verdict upholding them sparked the Jai Andhra movement in Coastal Andhra and Rayalaseema. 3 is correct: the Six-Point Formula (1973) was backed by Article 371D through the 32nd Amendment. So 2 and 3 only.',
  'Mulki means “local” in the Nizam’s dominions.', 110),

  q('svp-mod-009', ar(
    'President’s Rule was imposed in Andhra Pradesh in January 1973.',
    'Article 371E provides for the establishment of a central university in Andhra Pradesh.',
  ), AR, 1,
  'A is true: President’s Rule was imposed in January 1973 after the Jai Andhra agitation forced the government out. R is true: Article 371E (also from the 32nd Amendment) provides for a central university. But a provision for a university has nothing to do with why President’s Rule was imposed, so R does not explain A.',
  'Both are true; ask whether one causes the other.', 80),

  q('svp-mod-010', ms('Consider the following statements about Kandukuri Veeresalingam:', [
    'He founded the Andhra Mahasabha in 1913.',
    'He performed the first widow remarriage in Andhra at Rajahmundry on 11 December 1881.',
    'He started the journal Viveka Vardhini.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: he had no role in founding the Andhra Mahasabha; his own institutions included the Hitakarini Samajam. 2 is correct: the first widow remarriage he organised took place at Rajahmundry on 11 December 1881. 3 is correct: he started Viveka Vardhini (1874) as a vehicle for social reform. So 2 and 3 only.',
  'He was a social reformer, not a leader of the separate-state movement.', 100),

  q('svp-mod-011', match('Match the writer/reformer (List I) with the work or cause (List II):', [
    'Gidugu Venkata Ramamurthy', 'Gurajada Apparao', 'Unnava Lakshminarayana', 'Gurram Jashuva',
  ], [
    'Gabbilam', 'Movement for the spoken (vyavaharika) Telugu idiom', 'Kanyasulkam', 'Malapalli',
  ]), ['A-3, B-2, C-4, D-1', 'A-2, B-3, C-4, D-1', 'A-2, B-4, C-3, D-1', 'A-2, B-3, C-1, D-4'], 1,
  'Gidugu Ramamurthy led the movement for the spoken Telugu idiom (A-2). Gurajada wrote the play Kanyasulkam (B-3). Unnava Lakshminarayana wrote the novel Malapalli (C-4). Gurram Jashuva wrote Gabbilam (D-1).',
  'Malapalli is a novel; Gabbilam is a poem addressed to a bat.', 110),

  q('svp-mod-012', ms('Consider the following statements about the Chirala-Perala movement:', [
    'It was part of the Civil Disobedience Movement of 1930.',
    'It was led by Duggirala Gopalakrishnayya against the formation of a municipality and the tax burden it imposed.',
    'Residents left the town and lived in a camp named Ramnagar.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: the struggle took place in 1919–21, in the Non-Cooperation phase, not in 1930. 2 is correct: Duggirala Gopalakrishnayya led the protest against the Chirala-Perala municipality and its higher taxes. 3 is correct: thousands left the town and lived in the Ramnagar camp. So 2 and 3 only.',
  'Date the movement first.', 100),

  q('svp-mod-013', pairs('Consider the following pairs relating to the Non-Cooperation phase in Andhra:', [
    ['Pedanandipadu', 'No-tax campaign'],
    ['Palnadu', 'Forest satyagraha in which Kanneganti Hanumanthu was killed'],
    ['Chirala-Perala', 'Duggirala Gopalakrishnayya'],
    ['Rampa', 'Tanguturi Prakasam'],
  ]), PAIRS, 2,
  'Pair 1 is correct: Pedanandipadu (Guntur region) saw a no-tax campaign in 1921–22. Pair 2 is correct: the Palnadu forest satyagraha is remembered for Kanneganti Hanumanthu. Pair 3 is correct. Pair 4 is wrong: the Rampa rebellion (1922–24) was led by Alluri Sitarama Raju, not Prakasam. Three pairs are correct.',
  'The Rampa leader was a tribal-movement hero, not a Congress leader.', 110),

  q('svp-mod-014', ms('Consider the following statements about Alluri Sitarama Raju:', [
    'He led the Rampa rebellion of 1922–24 in the Godavari agency.',
    'His men raided police stations such as Chintapalli and Krishnadevipeta in August 1922.',
    'He was captured and killed by the police in May 1924.',
  ]), THREE_STATEMENTS, 3,
  '1 is correct: the Rampa (Manyam) rebellion ran from 1922 to 1924. 2 is correct: the raids on Chintapalli, Krishnadevipeta and Rajavommangi police stations in August 1922 began the revolt. 3 is correct: he was captured and shot on 7 May 1924. All three are correct.',
  'All three are the standard milestones of the revolt.', 90),

  q('svp-mod-015', ms('Consider the following statements about Pingali Venkayya:', [
    'The Bezwada meeting of 1921 was an annual session of the Indian National Congress.',
    'He presented a design of a national flag to Gandhi at the meeting of the All India Congress Committee at Bezwada (Vijayawada) in 1921.',
  ]), TWO_STATEMENTS, 1,
  '1 is wrong: the Bezwada gathering of 1921 was a meeting of the All India Congress Committee, not an annual session of the Congress (the 1921 annual session was at Ahmedabad). 2 is correct: Pingali Venkayya showed his flag design to Gandhi at Bezwada in 1921. So 2 only.',
  'An AICC meeting and an annual session are different bodies.', 80),

  q('svp-mod-016', ms('Consider the following statements about Tanguturi Prakasam:', [
    'He was the first Chief Minister of Andhra Pradesh formed in 1956.',
    'He was popularly called “Andhra Kesari”.',
    'He bared his chest before armed police during the Simon Commission boycott in Madras in 1928.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: he was the first CM of Andhra State (1953); the first CM of Andhra Pradesh (1956) was Neelam Sanjiva Reddy. 2 is correct: he is remembered as Andhra Kesari. 3 is correct: his defiance of the police during the Simon boycott in 1928 is the origin of the title. So 2 and 3 only.',
  'Andhra State and Andhra Pradesh had different first Chief Ministers.', 90),

  q('svp-mod-017', ms('Consider the following statements about the Justice Party:', [
    'The South Indian Liberal Federation (Justice Party) was founded in 1916 by T. M. Nair and P. Theagaraya Chetty, among others.',
    'The Raja of Panagal (Panaganti Ramarayaningar) headed a Justice Party ministry in the Madras Presidency.',
    'The Justice Party led the Vandemataram movement in Andhra.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: it was founded in 1916 by T. M. Nair, P. Theagaraya Chetty and C. Natesa Mudaliar. 2 is correct: the Raja of Panagal was Chief Minister (Premier) of Madras in the 1920s. 3 is wrong: the Justice Party was a non-Brahmin party that cooperated with dyarchy; the Vandemataram movement (1905–08) predates it and was a Swadeshi-era nationalist movement. So 1 and 2 only.',
  'The Justice Party was formed after the Swadeshi movement ended.', 100),

  q('svp-mod-018', ms('Consider the following statements about the Vandemataram (Swadeshi) movement in Andhra:', [
    'Bipin Chandra Pal’s lecture tour of coastal Andhra in 1907 gave a strong impetus to the movement.',
    'The Andhra Jateeya Kalasala (National College) was founded at Machilipatnam in 1910.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: Pal’s speeches at Rajahmundry, Kakinada, Machilipatnam and elsewhere in 1907 roused the region. 2 is correct: the Andhra Jateeya Kalasala at Machilipatnam, a product of the national-education idea, was founded in 1910 (Kopalle Hanumantha Rao was associated with it). Both are correct.',
  'Both are Swadeshi-era events.', 80),

  q('svp-mod-019', ms('Consider the following statements about the Andhra Mahasabha in the Nizam’s Hyderabad State:', [
    'Its first conference was held at Jogipet in 1930 under Suravaram Pratapa Reddy.',
    'It functioned within the Madras Presidency.',
    'Suravaram Pratapa Reddy edited the Golconda Patrika.',
  ]), THREE_STATEMENTS, 2,
  '1 is correct: Jogipet (1930) was the first conference, presided over by Suravaram Pratapa Reddy. 2 is wrong: this Andhra Mahasabha worked among Telugu people of the Nizam’s Hyderabad State, not the Madras Presidency. 3 is correct: Suravaram edited the Golconda Patrika. So 1 and 3 only.',
  'This body is distinct from the 1913 Bapatla Andhra Mahasabha.', 100),

  q('svp-mod-020', ms('Consider the following statements:', [
    'The Dhar Commission (1948) advised against reorganising states mainly on a linguistic basis.',
    'The JVP Committee consisted of Jawaharlal Nehru, Vallabhbhai Patel and Pattabhi Sitaramayya.',
    'The JVP Committee recommended the immediate creation of linguistic states.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: the S. K. Dhar Commission preferred administrative convenience over language. 2 is correct: JVP stands for Jawaharlal, Vallabhbhai and Pattabhi. 3 is wrong: the JVP Committee (1949) also advised postponing linguistic reorganisation, though it left the door open for an Andhra State without Madras city. So 1 and 2 only.',
  'Both 1948–49 bodies were cautious about language-based states.', 100),

  q('svp-mod-021', pairs('Consider the following personalities and their popular titles:', [
    ['Kandukuri Veeresalingam', 'Gadya Tikkana'],
    ['Duggirala Gopalakrishnayya', 'Andhra Ratna'],
    ['Tanguturi Prakasam', 'Andhra Kesari'],
    ['Potti Sriramulu', 'Amarajeevi'],
  ]), PAIRS, 3,
  'All four are correct: Veeresalingam was called Gadya Tikkana for his prose; Duggirala Gopalakrishnayya was Andhra Ratna; Prakasam was Andhra Kesari; Potti Sriramulu is remembered as Amarajeevi.',
  'Every title here is standard.', 90),

  q('svp-mod-022', ms('Consider the following statements about Telugu journalism in the national movement:', [
    'Andhra Patrika was founded by Kasinathuni Nageswara Rao, initially as a weekly from Bombay in 1908.',
    'Krishna Patrika of Machilipatnam is closely associated with Mutnuri Krishna Rao as its editor.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: Andhra Patrika began as a weekly in Bombay in 1908 and later became a daily from Madras. 2 is correct: Mutnuri Krishna Rao edited Krishna Patrika for decades. Both are correct.',
  'Both papers were pillars of nationalist Telugu journalism.', 80),

  // ───────────── AP physical geography ─────────────
  q('svp-geo-001', ms('Consider the following statements about the Eastern Ghats in Andhra Pradesh:', [
    'The Nallamala hills lie between the Krishna and the Pennar rivers.',
    'The Velikonda range lies to the east of the Nallamala, along the western border of the Nellore region.',
    'The Erramala hills lie to the east of the Nallamala.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: the Nallamala run between the lower Krishna and the Pennar. 2 is correct: the Velikonda range lies east of the Nallamala and separates the Nellore plains from the interior. 3 is wrong: the Erramala hills lie west of the Nallamala, in the Kurnool–Kadapa region. So 1 and 2 only.',
  'From west to east: Erramala, Nallamala, Velikonda.', 100),

  q('svp-geo-002', order('Arrange the following ranges from west to east:', [
    'Velikonda', 'Erramala', 'Nallamala',
  ]), ['2, 3, 1', '3, 2, 1', '2, 1, 3', '1, 3, 2'], 0,
  'The Erramala hills are in the west (Kurnool–Kadapa interior), the Nallamala lie in the middle, and the Velikonda range lies to the east, nearest the Nellore coastal plain. Sequence: 2, 3, 1.',
  'Velikonda is closest to the coast.', 70),

  q('svp-geo-003', ms('Consider the following statements about Kolleru lake:', [
    'It lies between the Godavari and Krishna deltas.',
    'It is fed by streams such as the Budameru and Tammileru and drains into the sea through the Upputeru.',
    'It was designated a Ramsar wetland in 2002.',
  ]), THREE_STATEMENTS, 3,
  '1 is correct: Kolleru occupies the depression between the two deltas. 2 is correct: Budameru and Tammileru are its main feeders; the Upputeru carries its waters to the Bay of Bengal. 3 is correct: it became a Ramsar site in 2002. All three are correct.',
  'Kolleru is a freshwater lake with one outlet channel.', 100),

  q('svp-geo-004', ms('Consider the following statements about Pulicat lake:', [
    'It is the second largest brackish-water lagoon in India after Chilika.',
    'The barrier island of Sriharikota separates much of it from the Bay of Bengal.',
    'It lies wholly within Andhra Pradesh.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: Pulicat is usually ranked second after Chilika. 2 is correct: Sriharikota island lies between the lagoon and the sea. 3 is wrong: the lagoon straddles the Andhra Pradesh–Tamil Nadu border, although the larger part is in AP. So 1 and 2 only.',
  'The lagoon is shared with a neighbouring state.', 100),

  q('svp-geo-005', ar(
    'The Nellore region receives a large share of its annual rainfall during October–December.',
    'South coastal Andhra receives relatively little from the south-west monsoon and gets heavy rain from the retreating (north-east) monsoon and its cyclones.',
  ), AR, 0,
  'A is true: Nellore and the far south of the AP coast receive much of their rain in October–December. R is true and explains it: this stretch lies in the rain-shadow of the south-west monsoon and gets the bulk of its rain from the north-east monsoon and Bay cyclones.',
  'Which monsoon reaches this coast directly?', 90),

  q('svp-geo-006', ms('Consider the following statements about Andhra Pradesh after 2 June 2014:', [
    'Andhra Pradesh shares a boundary with Chhattisgarh.',
    'Yanam, part of the Union Territory of Puducherry, is an enclave within Andhra Pradesh.',
    'Andhra Pradesh shares a boundary with Maharashtra.',
  ]), ['1 only', '1 and 2 only', '2 and 3 only', '1, 2 and 3'], 1,
  '1 is correct: the northern agency areas of AP touch Chhattisgarh. 2 is correct: Yanam lies within the Godavari delta and is surrounded by AP. 3 is wrong: after bifurcation Maharashtra borders Telangana, not AP. So 1 and 2 only.',
  'AP’s neighbours are Odisha, Chhattisgarh, Telangana, Karnataka and Tamil Nadu.', 90),

  q('svp-geo-007', ms('Consider the following statements:', [
    'Arma Konda in the Eastern Ghats of north coastal Andhra is generally cited as the highest peak in Andhra Pradesh.',
    'Mahendragiri, often confused with AP peaks, lies in Odisha.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: Arma Konda (about 1,680 m) in the Visakhapatnam agency is generally cited as AP’s highest peak. 2 is correct: Mahendragiri is in the Gajapati region of Odisha. Both are correct.',
  'The highest AP peak is in the northern Eastern Ghats.', 80),

  q('svp-geo-008', pairs('Consider the following pairs:', [
    ['Borra caves', 'Limestone caves in the Ananthagiri hills'],
    ['Belum caves', 'Limestone cave system in the Kurnool region'],
    ['Undavalli caves', 'Rock-cut cave temples near Vijayawada'],
    ['Gosthani river', 'Flows through the Belum caves'],
  ]), PAIRS, 2,
  'Pair 1 is correct: Borra caves are karst caves in the Ananthagiri hills near Araku. Pair 2 is correct: Belum is a long limestone cave system in the Kurnool region. Pair 3 is correct: Undavalli has rock-cut cave temples, including a reclining Vishnu, on the Krishna near Vijayawada. Pair 4 is wrong: the Gosthani flows through the Borra caves, not Belum. Three pairs are correct.',
  'The river passes through the caves in the northern hills.', 110),

  q('svp-geo-009', order('Arrange the following coastal places from north to south:', [
    'Machilipatnam', 'Kalingapatnam', 'Kakinada', 'Sriharikota',
  ]), ['3, 2, 1, 4', '2, 3, 1, 4', '2, 1, 3, 4', '2, 3, 4, 1'], 1,
  'Kalingapatnam (Vamsadhara mouth, Srikakulam coast) is northernmost, then Kakinada (Godavari delta), then Machilipatnam (Krishna delta coast), and Sriharikota (near Pulicat) in the far south. Sequence: 2, 3, 1, 4.',
  'Follow the order of the river mouths: Vamsadhara, Godavari, Krishna.', 80),

  q('svp-geo-010', ms('Consider the following statements about soils of Andhra Pradesh:', [
    'Black (regur) soils are prominent in the western parts of the state, especially in the Rayalaseema interior.',
    'Alluvial soils dominate the Godavari and Krishna deltas.',
    'Laterite soils dominate the Krishna delta.',
  ]), ['1 only', '1 and 2 only', '2 and 3 only', '3 only'], 1,
  '1 is correct: black cotton soils occur widely in the Kurnool and other western Rayalaseema areas. 2 is correct: deltaic alluvium covers the Godavari–Krishna deltas. 3 is wrong: laterites are found in parts of the Eastern Ghats hill tracts, not as the dominant soil of the Krishna delta. So 1 and 2 only.',
  'Deltas are built of river-borne sediment.', 90),

  q('svp-geo-011', ar(
    'Kakinada Bay is a sheltered anchorage.',
    'Hope Island, which shelters the bay, is a volcanic island.',
  ), AR, 2,
  'A is true: Kakinada Bay is protected from open-sea waves and serves as an anchorage. R is false: Hope Island is a sand spit built from sediments of the Godavari delta, not a volcanic island.',
  'Think of what the Godavari carries to the sea.', 80),

  q('svp-geo-012', 'Which one of the following hill ranges is NOT part of the Eastern Ghats in Andhra Pradesh?',
    ['Seshachalam', 'Lankamala', 'Velikonda', 'Anaimalai'], 3,
  'Seshachalam (Tirumala), Lankamala and Velikonda are all Eastern Ghats ranges in southern AP. The Anaimalai hills are part of the Western Ghats in Tamil Nadu–Kerala.',
  'One range belongs to the other Ghats.', 60),

  q('svp-geo-013', ms('Consider the following statements:', [
    'Horsley Hills is a hill station in the Rayalaseema region.',
    'The Araku valley lies in the Eastern Ghats north of the Godavari.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: Horsley Hills lies near Madanapalle in Rayalaseema. 2 is correct: Araku valley is in the Visakhapatnam agency, well north of the Godavari. Both are correct.',
  'One is in the far south, the other in the north.', 70),

  q('svp-geo-014', ar(
    'The Diviseema area suffered catastrophic loss of life in the cyclone of November 1977.',
    'Diviseema is a low-lying deltaic island tract near the mouths of the Krishna.',
  ), AR, 0,
  'A is true: the November 1977 cyclone and storm surge devastated Diviseema. R is true: it is a low-lying island tract in the Krishna delta. The low elevation exposed it to the storm surge, so R explains A.',
  'Storm surges hit low-lying deltas hardest.', 80),

  q('svp-geo-015', ms('Consider the following statements:', [
    'Diviseema lies in the Godavari delta.',
    'Konaseema lies between the Gautami and Vasishta branches of the Godavari.',
  ]), TWO_STATEMENTS, 1,
  '1 is wrong: Diviseema is in the Krishna delta. 2 is correct: Konaseema is the island-like tract between the Gautami and Vasishta Godavari. So 2 only.',
  'One delta island per river.', 70),

  q('svp-geo-016', order('Arrange the following hill areas from north to south:', [
    'Seshachalam hills', 'Papikonda hills', 'Ananthagiri hills', 'Nallamala hills',
  ]), ['3, 2, 4, 1', '2, 3, 4, 1', '3, 4, 2, 1', '3, 2, 1, 4'], 0,
  'Ananthagiri (Araku region) is northernmost, the Papikonda hills flank the Godavari gorge further south, the Nallamala lie south of the Krishna, and the Seshachalam (Tirumala) hills are in the far south. Sequence: 3, 2, 4, 1.',
  'Use the Godavari and the Krishna as dividing lines.', 80),

  q('svp-geo-017', ar(
    'Sriharikota is well suited as a rocket launch site.',
    'Its east-coast location allows eastward launches that gain from the Earth’s rotation, with the sea providing a safe range for spent stages.',
  ), AR, 0,
  'A is true: Sriharikota hosts the Satish Dhawan Space Centre. R is true and explains A: eastward launches gain velocity from the Earth’s rotation and the Bay of Bengal offers a safe drop zone, together with its relatively low latitude.',
  'Why do launch sites prefer an open sea to the east?', 80),

  // ───────────── AP rivers and water projects ─────────────
  q('svp-riv-001', 'Which one of the following is NOT a tributary of the Krishna?',
    ['Bhima', 'Musi', 'Manjira', 'Ghataprabha'], 2,
  'The Bhima, Musi and Ghataprabha all join the Krishna. The Manjira is a tributary of the Godavari.',
  'One river drains to the north into another system.', 60),

  q('svp-riv-002', 'Which one of the following is NOT a tributary of the Godavari?',
    ['Pranahita', 'Dindi', 'Sabari', 'Manjira'], 1,
  'The Pranahita, Sabari and Manjira are tributaries of the Godavari. The Dindi is a tributary of the Krishna.',
  'The odd one joins the Krishna in Telangana.', 60),

  q('svp-riv-003', 'Which one of the following is NOT a tributary of the Pennar?',
    ['Chitravati', 'Papagni', 'Kunderu', 'Hagari'], 3,
  'The Chitravati, Papagni and Kunderu all join the Pennar. The Hagari (Vedavati) is a tributary of the Tungabhadra.',
  'One river flows north to the Tungabhadra.', 70),

  q('svp-riv-004', order('Arrange the following on the Krishna from upstream to downstream:', [
    'Pulichintala project', 'Srisailam dam', 'Prakasam barrage', 'Nagarjuna Sagar dam',
  ]), ['2, 4, 3, 1', '4, 2, 1, 3', '2, 1, 4, 3', '2, 4, 1, 3'], 3,
  'Going downstream: Srisailam (Nallamala gorge) → Nagarjuna Sagar → Pulichintala → Prakasam barrage at Vijayawada (head of the delta). Sequence: 2, 4, 1, 3.',
  'The barrage is at the head of the delta.', 80),

  q('svp-riv-005', ms('Consider the following statements about the Dowleswaram anicut:', [
    'It was constructed under Sir Arthur Cotton between 1847 and 1852.',
    'It is located at the head of the Godavari delta near Rajahmundry.',
    'It lies upstream of the Polavaram project.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: Cotton’s anicut was built in 1847–52 (later rebuilt as the Sir Arthur Cotton Barrage). 2 is correct: it stands where the Godavari enters its delta near Rajahmundry. 3 is wrong: Polavaram is upstream of Dowleswaram. So 1 and 2 only.',
  'A delta-head structure is downstream of a gorge dam.', 90),

  q('svp-riv-006', ms('Consider the following statements about the Prakasam barrage:', [
    'It is across the Krishna at Vijayawada.',
    'It replaced the 19th-century Krishna anicut built under Sir Arthur Cotton.',
    'It is named after Tanguturi Prakasam.',
  ]), ['1 only', '1 and 3 only', '2 and 3 only', '1, 2 and 3'], 3,
  '1 is correct: it spans the Krishna at Vijayawada. 2 is correct: it was built in the 1950s in place of the old Krishna anicut of the 1850s. 3 is correct: it is named after Andhra Kesari Tanguturi Prakasam. All three are correct.',
  'All three are about the delta-head structure on the Krishna.', 80),

  q('svp-riv-007', ms('Consider the following statements about Nagarjuna Sagar:', [
    'Its foundation stone was laid by Jawaharlal Nehru in December 1955.',
    'Its right bank canal is named Jawahar canal and the left bank canal Lal Bahadur Shastri canal.',
    'It is located upstream of the Srisailam dam.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: Nehru laid the foundation on 10 December 1955. 2 is correct: the right canal is the Jawahar canal and the left canal the Lal Bahadur canal. 3 is wrong: Nagarjuna Sagar is downstream of Srisailam. So 1 and 2 only.',
  'Srisailam is in the Nallamala gorge, higher up the river.', 90),

  q('svp-riv-008', ms('Consider the following statements about the Tungabhadra:', [
    'It is formed by the confluence of the Tunga and the Bhadra at Kudli in Karnataka.',
    'It joins the Krishna near Alampur–Sangameswaram.',
    'The Handri joins it at Kurnool.',
  ]), THREE_STATEMENTS, 3,
  '1 is correct: the Tunga and Bhadra unite at Kudli near Shivamogga. 2 is correct: the Tungabhadra meets the Krishna near Alampur, at Sangameswaram (now in Srisailam backwaters). 3 is correct: the Handri meets the Tungabhadra at Kurnool. All three are correct.',
  'Kurnool stands at a confluence.', 90),

  q('svp-riv-009', ms('Consider the following statements about the Pennar:', [
    'It rises in the Nallamala hills.',
    'It has cut the Gandikota gorge through the Erramala hills.',
    'The Somasila dam is built across it.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: the Pennar rises in the Nandi hills of Karnataka. 2 is correct: at Gandikota the river has carved a deep gorge through the Erramala hills. 3 is correct: Somasila dam is on the Pennar in the Nellore region. So 2 and 3 only.',
  'The Pennar is an inter-state river.', 90),

  q('svp-riv-010', pairs('Consider the following pairs:', [
    ['Vamsadhara', 'Rises in Odisha'],
    ['Nagavali', 'Thotapalli barrage'],
    ['Vamsadhara', 'Gotta barrage'],
    ['Nagavali', 'Enters the sea at Kalingapatnam'],
  ]), PAIRS, 2,
  'Pair 1 is correct: the Vamsadhara rises in the Kalahandi–Rayagada hills of Odisha. Pair 2 is correct: Thotapalli barrage is on the Nagavali. Pair 3 is correct: Gotta barrage is on the Vamsadhara. Pair 4 is wrong: Kalingapatnam is at the mouth of the Vamsadhara; the Nagavali enters the sea further south, near Srikakulam. Three pairs are correct.',
  'Kalingapatnam is the northern of the two mouths.', 110),

  q('svp-riv-011', order('Arrange the mouths of the following rivers from north to south:', [
    'Pennar', 'Nagavali', 'Krishna', 'Vamsadhara',
  ]), ['4, 2, 3, 1', '2, 4, 3, 1', '4, 3, 2, 1', '4, 2, 1, 3'], 0,
  'Vamsadhara (Kalingapatnam) is northernmost, then the Nagavali (near Srikakulam), then the Krishna (delta near Machilipatnam), and the Pennar (near Nellore) in the south. Sequence: 4, 2, 3, 1.',
  'The two Srikakulam rivers come first.', 80),

  q('svp-riv-012', ms('Consider the following statements about the Polavaram project:', [
    'It is located downstream of the Dowleswaram barrage.',
    'It was declared a national project under Section 90 of the Andhra Pradesh Reorganisation Act, 2014.',
    'It is across the Godavari.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: Polavaram lies upstream of Dowleswaram, below the Papikonda gorge. 2 is correct: Section 90 of the AP Reorganisation Act, 2014 declares it a national project. 3 is correct: it is a multipurpose project on the Godavari. So 2 and 3 only.',
  'Dowleswaram is at the head of the delta.', 90),

  q('svp-riv-013', ar(
    'The Machkund hydroelectric project is a joint project of Andhra Pradesh and Odisha.',
    'The Machkund–Sileru river is a tributary of the Sabari, which joins the Godavari.',
  ), AR, 1,
  'A is true: Machkund is jointly owned and shared by AP and Odisha. R is true: the Machkund continues as the Sileru and joins the Sabari, a Godavari tributary. But the river’s basin does not explain why the project is jointly owned — that arises from inter-state agreement on a boundary river. So R is not the explanation of A.',
  'Basin membership is not the reason for joint ownership.', 90),

  q('svp-riv-014', ms('Consider the following statements about the Telugu Ganga project:', [
    'It supplies Krishna water to Chennai city.',
    'It draws water from the Godavari at Polavaram.',
    'The Somasila and Kandaleru reservoirs form part of its system.',
  ]), THREE_STATEMENTS, 2,
  '1 is correct: it was conceived to carry Krishna water to Chennai, besides irrigating Rayalaseema and Nellore areas. 2 is wrong: it draws from the Srisailam reservoir (through Pothireddypadu), not from the Godavari. 3 is correct: Somasila and Kandaleru are its storage points. So 1 and 3 only.',
  'The name tells you which river (the Ganga of the Telugus) it carries.', 100),

  q('svp-riv-015', pairs('Consider the following water disputes tribunals and their particulars:', [
    ['First Krishna Water Disputes Tribunal', 'Chaired by Justice R. S. Bachawat'],
    ['Second Krishna Water Disputes Tribunal', 'Chaired by Justice Brijesh Kumar'],
    ['Godavari Water Disputes Tribunal', 'Chaired by Justice R. S. Bachawat'],
    ['Vamsadhara Water Disputes Tribunal', 'Dispute between Andhra Pradesh and Karnataka'],
  ]), PAIRS, 2,
  'Pairs 1 and 3 are correct: Justice R. S. Bachawat headed both the first Krishna and the Godavari tribunals. Pair 2 is correct: Justice Brijesh Kumar headed the second Krishna tribunal. Pair 4 is wrong: the Vamsadhara dispute is between Andhra Pradesh and Odisha. Three pairs are correct.',
  'The Vamsadhara rises in a neighbouring eastern state.', 110),

  q('svp-riv-016', ms('Consider the following statements about the Kurnool–Cuddapah (KC) canal:', [
    'It was built in the 19th century by a private company, the Madras Irrigation Company.',
    'It draws water from the Tungabhadra at the Sunkesula anicut.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: the KC canal was built by the Madras Irrigation and Canal Company and later taken over by the government. 2 is correct: its head works are at Sunkesula on the Tungabhadra, upstream of Kurnool. Both are correct.',
  'The canal begins near Kurnool.', 80),

  q('svp-riv-017', match('Match the project (List I) with the river (List II):', [
    'Pulichintala', 'Somasila', 'Thotapalli', 'Gotta barrage',
  ], [
    'Vamsadhara', 'Krishna', 'Nagavali', 'Pennar',
  ]), ['A-2, B-4, C-3, D-1', 'A-2, B-3, C-4, D-1', 'A-4, B-2, C-3, D-1', 'A-2, B-4, C-1, D-3'], 0,
  'Pulichintala is on the Krishna (A-2), Somasila on the Pennar (B-4), Thotapalli on the Nagavali (C-3) and the Gotta barrage on the Vamsadhara (D-1).',
  'Pair the two north-coastal barrages carefully.', 100),

  q('svp-riv-018', ms('Consider the following statements:', [
    'The Sangameswaram temple at the confluence of the Krishna and the Tungabhadra lies in the Srisailam backwaters and is submerged for much of the year.',
    'The Musi joins the Krishna in Telangana.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: the Sangameswaram temple near the Krishna–Tungabhadra confluence emerges only when the Srisailam reservoir level falls. 2 is correct: the Musi, which flows through Hyderabad, joins the Krishna in the Nalgonda region of Telangana. Both are correct.',
  'Both statements describe confluences with the Krishna.', 80),

  q('svp-riv-019', 'Which one of the following projects is NOT on the Krishna?',
    ['Pulichintala', 'Srisailam', 'Somasila', 'Nagarjuna Sagar'], 2,
  'Pulichintala, Srisailam and Nagarjuna Sagar are all on the Krishna. Somasila is on the Pennar.',
  'One dam is in the Nellore region.', 60),

  q('svp-riv-020', ms('Consider the following statements:', [
    'The Sabari is a tributary of the Krishna.',
    'Upper Sileru and Lower Sileru are hydroelectric projects in the Godavari basin.',
  ]), TWO_STATEMENTS, 1,
  '1 is wrong: the Sabari joins the Godavari, upstream of the Polavaram area. 2 is correct: the Sileru projects lie on the Machkund–Sileru, which drains to the Sabari and then the Godavari. So 2 only.',
  'The Sabari joins the larger northern river.', 70),

  q('svp-riv-021', ms('Consider the following statements:', [
    'The Handri-Neeva Sujala Sravanthi scheme draws Godavari water for Rayalaseema.',
    'The Veligonda project is designed to take Krishna water from the Srisailam reservoir through tunnels across the Nallamala to the Prakasam region.',
  ]), TWO_STATEMENTS, 1,
  '1 is wrong: Handri-Neeva lifts Krishna water from the Srisailam foreshore. 2 is correct: Veligonda (Pula Subbaiah Veligonda project) uses tunnels through the Nallamala to carry Srisailam water to the drought-prone Prakasam area. So 2 only.',
  'Rayalaseema schemes depend on the Srisailam reservoir.', 90),

  q('svp-riv-022', ms('Consider the following statements about the Godavari:', [
    'It rises at Trimbakeshwar near Nashik.',
    'Its tributary, the Pranahita, is formed by the union of the Wardha and the Wainganga.',
    'Below Dowleswaram it divides into the Gautami and Vasishta branches.',
  ]), THREE_STATEMENTS, 3,
  '1 is correct: it rises at Trimbakeshwar in the Western Ghats. 2 is correct: the Wardha and Wainganga combine to form the Pranahita. 3 is correct: below Dowleswaram the river splits into the Gautami (east) and Vasishta (west) branches. All three are correct.',
  'All three are textbook facts.', 90),

  // ───────────── AP economy and agriculture ─────────────
  q('svp-eco-001', pairs('Consider the following rice-variety prefixes and the research stations they denote:', [
    ['BPT', 'Bapatla'],
    ['MTU', 'Maruteru'],
    ['NLR', 'Nellore'],
    ['Samba Mahsuri (BPT 5204)', 'Developed at Maruteru'],
  ]), PAIRS, 2,
  'Pairs 1–3 are correct: AP rice varieties carry station codes — BPT for Bapatla, MTU for Maruteru and NLR for Nellore. Pair 4 is wrong: Samba Mahsuri is BPT 5204, released from Bapatla, as its code shows. Three pairs are correct.',
  'Read the code in brackets.', 100),

  q('svp-eco-002', pairs('Consider the following institutions and their headquarters:', [
    ['Central Tobacco Research Institute (ICAR)', 'Rajahmundry'],
    ['Indian Institute of Oil Palm Research (ICAR)', 'Pedavegi'],
    ['Spices Board', 'Guntur'],
    ['Indian Institute of Millets Research (ICAR)', 'Tirupati'],
  ]), PAIRS, 1,
  'Pair 1 is correct: CTRI is at Rajahmundry. Pair 2 is correct: IIOPR is at Pedavegi near Eluru. Pair 3 is wrong: the Spices Board is headquartered at Kochi (Guntur has regional presence because of chillies). Pair 4 is wrong: the IIMR is in Hyderabad. Two pairs are correct.',
  'Two national bodies here are based outside AP.', 110),

  q('svp-eco-003', match('Match the mineral locality (List I) with the mineral (List II):', [
    'Mangampeta', 'Tummalapalle', 'Gudur', 'Vajrakarur',
  ], [
    'Uranium', 'Mica', 'Kimberlite (diamond)', 'Barytes',
  ]), ['A-4, B-1, C-3, D-2', 'A-1, B-4, C-2, D-3', 'A-4, B-2, C-1, D-3', 'A-4, B-1, C-2, D-3'], 3,
  'Mangampeta (Kadapa region) has one of the world’s largest barytes deposits (A-4). Tummalapalle (Kadapa region) is a uranium mine (B-1). Gudur (Nellore region) is AP’s mica belt (C-2). Vajrakarur (Anantapur region) is known for kimberlite pipes and diamonds (D-3).',
  'Both Kadapa localities are famous, for different minerals.', 110),

  q('svp-eco-004', ms('Consider the following statements:', [
    'The Visakhapatnam Steel Plant (RINL) is India’s first shore-based integrated steel plant.',
    'The 1966 agitation for the plant was popularised with the slogan “Visakha Ukku – Andhrula Hakku”.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: the Vizag plant is the first coastal (shore-based) integrated steel plant in India. 2 is correct: the slogan means “Visakha steel is the right of Andhras”. Both are correct.',
  'Both statements are about the same plant.', 80),

  q('svp-eco-005', ms('Consider the following statements about Geographical Indication (GI) tags:', [
    'Araku Valley Arabica coffee, grown largely by tribal farmers, has a GI tag.',
    'Banaganapalle mango has a GI tag.',
    'Guntur Sannam chilli has a GI tag.',
  ]), THREE_STATEMENTS, 3,
  'All three are GI-registered products of Andhra Pradesh: Araku Valley Arabica coffee from the Eastern Ghats agency, Banaganapalle mango from the Kurnool region, and Guntur Sannam chilli.',
  'All three are celebrated AP farm products.', 90),

  q('svp-eco-006', ar(
    'The Godavari and Krishna deltas are known as the rice bowl of Andhra Pradesh.',
    'They combine fertile deltaic alluvium with assured canal irrigation from the anicuts/barrages at the delta heads.',
  ), AR, 0,
  'A is true: the two deltas produce the bulk of AP’s paddy. R is true and explains A: alluvial soils and the canal systems fed by Dowleswaram and the Prakasam barrage make intensive rice cultivation possible.',
  'Soil plus water.', 80),

  q('svp-eco-007', ms('Consider the following statements about Visakhapatnam:', [
    'Hindustan Shipyard traces its origin to the Scindia Steam Navigation Company, which set up a shipyard there in 1941.',
    'The HPCL Visakh refinery was originally set up by Caltex.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: Scindia founded the shipyard at Visakhapatnam in 1941; it was later nationalised as Hindustan Shipyard. 2 is correct: the refinery was set up by Caltex in the 1950s and later became part of HPCL. Both are correct.',
  'Both units began under private ownership.', 80),

  q('svp-eco-008', 'Which one of the following pairs of mineral and its occurrence in Andhra Pradesh is NOT correctly matched?',
    ['Asbestos – Pulivendula region', 'Uranium – Tummalapalle', 'Bauxite – Eastern Ghats of the Visakhapatnam agency', 'Barytes – Gudur'], 3,
  'Asbestos occurs around Pulivendula, uranium at Tummalapalle and bauxite in the Eastern Ghats of the Visakhapatnam agency. Barytes is associated with Mangampeta; Gudur is known for mica. Hence the fourth pair is wrong.',
  'Gudur belongs to a different mineral.', 80),

  q('svp-eco-009', ms('Consider the following statements:', [
    'The Golconda diamonds were mined inside Golconda fort itself.',
    'The Kollur mines on the Krishna were a source of the famous “Golconda diamonds”.',
  ]), TWO_STATEMENTS, 1,
  '1 is wrong: Golconda was the trading and cutting centre, not the mine site. 2 is correct: diamonds from Kollur and other Krishna-valley mines were marketed and cut at Golconda. So 2 only.',
  'The name refers to the market, not the mine.', 70),

  q('svp-eco-010', ms('Consider the following statements about agriculture in Andhra Pradesh:', [
    'Duggirala is a well-known turmeric market.',
    'Flue-cured Virginia tobacco is an important commercial crop of the Prakasam region.',
    'Groundnut cultivation is concentrated chiefly in the Godavari delta.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: Duggirala (Guntur region) is a major turmeric trading centre. 2 is correct: the Prakasam region is a leading FCV tobacco area (the Tobacco Board is headquartered in Guntur). 3 is wrong: groundnut is a dryland crop concentrated in Rayalaseema, especially the Anantapur region, not the irrigated paddy-growing Godavari delta. So 1 and 2 only.',
  'Groundnut prefers dry red soils.', 90),

  q('svp-eco-011', pairs('Consider the following universities and their locations:', [
    ['Acharya N. G. Ranga Agricultural University', 'Lam, Guntur'],
    ['Dr. Y. S. R. Horticultural University', 'Venkataramannagudem'],
    ['Sri Venkateswara Veterinary University', 'Anantapur'],
    ['Professor Jayashankar Agricultural University', 'Guntur'],
  ]), PAIRS, 1,
  'Pair 1 is correct: ANGRAU is headquartered at Lam, Guntur. Pair 2 is correct: the Horticultural University is at Venkataramannagudem (West Godavari region). Pair 3 is wrong: SVVU is at Tirupati. Pair 4 is wrong: Professor Jayashankar Agricultural University is in Hyderabad, Telangana. Two pairs are correct.',
  'One veterinary university is in a temple town; one university belongs to Telangana.', 110),

  q('svp-eco-012', ar(
    'The Anantapur region is a major groundnut-growing area of Andhra Pradesh.',
    'Its red sandy soils and low rainfall suit a hardy dryland oilseed crop like groundnut.',
  ), AR, 0,
  'A is true: Anantapur is the leading groundnut region of the state. R is true and explains A: groundnut tolerates low rainfall and does well in light, well-drained red soils, which characterise this, one of AP’s driest regions.',
  'Match the crop to the soil and rainfall.', 80),

  q('svp-eco-013', ms('Consider the following statements:', [
    'The Singareni coalfields of the Godavari valley lie largely in present Andhra Pradesh.',
    'The limestone belt around Yerraguntla supports a cement industry.',
  ]), TWO_STATEMENTS, 1,
  '1 is wrong: the Singareni coalfields lie in the Godavari valley of Telangana. 2 is correct: limestone deposits in the Yerraguntla (Kadapa) area support several cement plants. So 2 only.',
  'The coal belt stayed with the other state in 2014.', 80),

  q('svp-eco-014', 'Which one of the following is NOT a GI-registered agricultural product of Andhra Pradesh?',
    ['Araku Valley Arabica coffee', 'Banaganapalle mango', 'Guntur Sannam chilli', 'Pokkali rice'], 3,
  'Araku coffee, Banaganapalle mango and Guntur Sannam chilli are AP GI products. Pokkali rice, a salt-tolerant variety grown in coastal wetlands, is a GI product of Kerala.',
  'One belongs to the Kerala backwaters.', 60),

  q('svp-eco-015', pairs('Consider the following ports and their particulars:', [
    ['Visakhapatnam', 'A major port under the Union government'],
    ['Kakinada', 'Has both a deep-water port and an anchorage port'],
    ['Krishnapatnam', 'In the Nellore region'],
    ['Gangavaram', 'Near Visakhapatnam'],
  ]), PAIRS, 3,
  'All four are correct: Visakhapatnam is AP’s major port administered by the Union; Kakinada has a deep-water port and the older anchorage port in the bay; Krishnapatnam is on the Nellore coast; Gangavaram is a deep-water port just south of Visakhapatnam.',
  'Every pair is accurate.', 90),

  q('svp-eco-016', ms('Consider the following statements:', [
    'Ilmenite-rich beach sands occur along the Srikakulam coast.',
    'The mica belt of Andhra Pradesh is centred on Gudur.',
    'The Tummalapalle deposit is mined for barytes.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: heavy-mineral beach sands with ilmenite occur along the Srikakulam coast. 2 is correct: Gudur in the Nellore region is AP’s mica belt. 3 is wrong: Tummalapalle is a uranium mine; barytes is mined at Mangampeta. So 1 and 2 only.',
  'Two Kadapa minerals are easily swapped.', 90),

  // ───────────── AP literature and performing arts ─────────────
  q('svp-art-001', ms('Consider the following statements about the Kavitrayam:', [
    'Nannaya began the Andhra Mahabharatam at the court of Rajaraja Narendra.',
    'Tikkana composed his parvas at the court of Kakatiya Prataparudra.',
    'Errana completed the unfinished Aranya Parva.',
  ]), THREE_STATEMENTS, 2,
  '1 is correct: Nannaya wrote under Rajaraja Narendra of Vengi. 2 is wrong: Tikkana was associated with Manumasiddhi, the Telugu Choda ruler of Nellore; he composed fifteen parvas from Virata onwards. 3 is correct: Errana completed the Aranya Parva left unfinished by Nannaya. So 1 and 3 only.',
  'Tikkana belongs to Nellore.', 100),

  q('svp-art-002', pairs('Consider the following poets and their titles:', [
    ['Nannaya', 'Adikavi'],
    ['Tikkana', 'Kavibrahma'],
    ['Errana', 'Prabandha Parameswara'],
    ['Srinatha', 'Kavisarvabhauma'],
  ]), PAIRS, 3,
  'All four are correct: Nannaya is the Adikavi; Tikkana is Kavibrahma; Errana is Prabandha Parameswara (also Sambhu dasudu); Srinatha is Kavisarvabhauma.',
  'All are standard titles.', 90),

  q('svp-art-003', match('Match the poet (List I) with the work (List II):', [
    'Allasani Peddana', 'Nandi Timmana', 'Dhurjati', 'Tenali Ramakrishna',
  ], [
    'Panduranga Mahatmyamu', 'Parijatapaharanamu', 'Manucharitra', 'Sri Kalahastiswara Mahatmyamu',
  ]), ['A-3, B-2, C-4, D-1', 'A-2, B-3, C-4, D-1', 'A-3, B-2, C-1, D-4', 'A-3, B-4, C-2, D-1'], 0,
  'Peddana wrote Manucharitra (Swarochisha Manusambhavamu) (A-3); Nandi Timmana wrote Parijatapaharanamu (B-2); Dhurjati wrote Sri Kalahastiswara Mahatmyamu (C-4); Tenali Ramakrishna wrote Panduranga Mahatmyamu (D-1).',
  'Dhurjati was a devotee of the Srikalahasti deity.', 110),

  q('svp-art-004', match('Match the poet (List I) with the work (List II):', [
    'Ramarajabhushana (Bhattumurti)', 'Pingali Surana', 'Madayagari Mallana', 'Ayyalaraju Ramabhadrudu',
  ], [
    'Kalapurnodayamu', 'Ramabhyudayamu', 'Vasucharitramu', 'Rajasekhara Charitramu',
  ]), ['A-1, B-3, C-4, D-2', 'A-3, B-1, C-2, D-4', 'A-3, B-4, C-1, D-2', 'A-3, B-1, C-4, D-2'], 3,
  'Ramarajabhushana wrote Vasucharitramu (A-3); Pingali Surana wrote Kalapurnodayamu (B-1); Madayagari Mallana wrote Rajasekhara Charitramu (C-4) — not to be confused with Veeresalingam’s novel Rajasekhara Charitramu; Ayyalaraju Ramabhadrudu wrote Ramabhyudayamu (D-2).',
  'Ramabhadrudu’s work is about Rama.', 120),

  q('svp-art-005', ar(
    'Allasani Peddana is called “Andhra Kavitapitamaha”.',
    'Allasani Peddana is the author of Amuktamalyada.',
  ), AR, 2,
  'A is true: Peddana, the foremost of the Ashtadiggajas and author of Manucharitra, is called Andhra Kavitapitamaha. R is false: Amuktamalyada was composed by Krishnadevaraya himself.',
  'Who wrote Amuktamalyada?', 70),

  q('svp-art-006', ms('Consider the following statements about Kuchipudi:', [
    'Siddhendra Yogi is credited with the dance-drama Bhama Kalapam.',
    'The Tarangam item involves dancing on the rim of a brass plate.',
    'It was traditionally performed by women attached to temples.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: Bhama Kalapam is attributed to Siddhendra Yogi. 2 is correct: Tarangam is danced on the rim of a brass plate, sometimes with a water pot on the head. 3 is wrong: Kuchipudi was traditionally performed by troupes of Brahmin men (Bhagavatulu) of Kuchipudi village, who also played female roles. So 1 and 2 only.',
  'Think of the Bhagavatulu of the village.', 100),

  q('svp-art-007', pairs('Consider the following art forms and their descriptions:', [
    ['Tholu bommalata', 'Leather shadow puppetry'],
    ['Burra katha', 'Narrative performance by a main singer with a tambura and two side artists'],
    ['Tappeta gullu', 'Folk drum-dance of the Rayalaseema region'],
    ['Perini Sivatandavam', 'Harvest dance of Rayalaseema women'],
  ]), PAIRS, 1,
  'Pair 1 is correct. Pair 2 is correct: the kathakudu sings with a tambura, supported by two co-artists. Pair 3 is wrong: Tappeta gullu, with drums hung from the neck, belongs to the north coastal (Srikakulam–Vizianagaram) region. Pair 4 is wrong: Perini Sivatandavam is a vigorous male warrior dance associated with the Kakatiyas, revived by Nataraja Ramakrishna. Two pairs are correct.',
  'Two descriptions have the wrong region or performers.', 110),

  q('svp-art-008', ms('Consider the following statements about Tallapaka Annamacharya:', [
    'He was born at Tallapaka.',
    'His sankirtanas on Lord Venkateswara were preserved on copper plates.',
    'He was one of the Ashtadiggajas of Krishnadevaraya’s court.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: he was born at Tallapaka in the Kadapa–Rajampet area. 2 is correct: his compositions were inscribed on copper plates kept at Tirumala. 3 is wrong: he lived in the 15th century (1408–1503) and was a saint-composer, not one of the Ashtadiggajas. So 1 and 2 only.',
  'He was a saint-composer, not a court poet.', 90),

  q('svp-art-009', ar(
    'Most of Tyagaraja’s kritis are in Telugu, although he lived in the Tamil country.',
    'He was born into a Telugu-speaking family whose roots are traced to the Andhra region.',
  ), AR, 0,
  'A is true: Tyagaraja, who lived at Tiruvaiyaru near Thanjavur, composed mostly in Telugu. R is true: his family was Telugu-speaking and traced its origin to Kakarla in Andhra. His mother tongue is the reason he composed in Telugu, so R explains A.',
  'Which language did he grow up speaking?', 80),

  q('svp-art-010', match('Match the composer (List I) with the work or theme (List II):', [
    'Kshetrayya', 'Kancherla Gopanna (Ramadasu)', 'Narayana Tirtha', 'Annamacharya',
  ], [
    'Sri Krishna Leela Tarangini', 'Sankirtanas on Lord Venkateswara', 'Padams on Muvva Gopala', 'Kirtanas on Bhadrachala Rama',
  ]), ['A-3, B-4, C-2, D-1', 'A-4, B-3, C-1, D-2', 'A-3, B-1, C-4, D-2', 'A-3, B-4, C-1, D-2'], 3,
  'Kshetrayya’s padams are addressed to Muvva Gopala (A-3); Ramadasu sang of Rama of Bhadrachalam (B-4); Narayana Tirtha wrote the Sanskrit Sri Krishna Leela Tarangini, used in Kuchipudi (C-1); Annamacharya composed sankirtanas on Venkateswara (D-2).',
  'Muvva (Movva) is Kshetrayya’s village.', 110),

  q('svp-art-011', ms('Consider the following statements about Jnanpith awards to Telugu writers:', [
    'Sri Sri received the Jnanpith for Maha Prasthanam.',
    'Viswanatha Satyanarayana was the first Telugu writer to receive it, for Ramayana Kalpavrukshamu.',
    'C. Narayana Reddy received it for Viswambhara.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: Sri Sri never received the Jnanpith. 2 is correct: Viswanatha Satyanarayana received it (1970) for Ramayana Kalpavrukshamu. 3 is correct: C. Narayana Reddy received it (1988) for Viswambhara. So 2 and 3 only.',
  'The revolutionary poet’s classic did not win this award.', 90),

  q('svp-art-012', ms('Consider the following statements:', [
    'Bammera Potana composed the Andhra Maha Bhagavatamu and dedicated it to Rama rather than to a king.',
    'Palkuriki Somanatha wrote the Basava Puranamu in dwipada metre.',
    'Gona Budda Reddy wrote the Ranganatha Ramayanamu in dwipada metre.',
  ]), THREE_STATEMENTS, 3,
  '1 is correct: Potana refused royal patronage and dedicated his Bhagavatam to Sri Rama. 2 is correct: Somanatha’s Basava Puranamu, a Veerasaiva work, is in dwipada. 3 is correct: Ranganatha Ramayanamu is the earliest Telugu Ramayana and is in dwipada. All three are correct.',
  'Dwipada is a couplet metre popular with early non-courtly poets.', 100),

  q('svp-art-013', ms('Consider the following statements about Molla (Atukuri Molla):', [
    'She was a court poet of Kakatiya Rudramadevi.',
    'She composed the Molla Ramayanam and came from a potter family.',
  ]), TWO_STATEMENTS, 1,
  '1 is wrong: her date is debated (usually placed between the 14th and 16th centuries), after Rudramadevi’s 13th-century reign, and she is not recorded as a court poet of any Kakatiya ruler. 2 is correct: Molla, a woman poet from a potter (kummari) family, wrote a short, simple Telugu Ramayana. So 2 only.',
  'Her date is centuries after the Kakatiyas.', 80),

  q('svp-art-014', howMany('Consider the following works:', [
    'Srungara Naishadhamu', 'Palnati Veera Charitra', 'Kasi Khandamu', 'Manucharitra',
  ]).replace('How many of the above are correct?', 'How many of the above were composed by Srinatha?'), COUNT, 2,
  'Srungara Naishadhamu, Palnati Veera Charitra and Kasi Khandamu are works of Srinatha. Manucharitra is by Allasani Peddana. So three.',
  'One work belongs to the Ashtadiggajas.', 90),

  q('svp-art-015', ms('Consider the following statements:', [
    'Telugu was declared a classical language in 2008, along with Kannada.',
    'Telugu Language Day (29 August) marks the birth anniversary of Gidugu Venkata Ramamurthy.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: Telugu and Kannada were granted classical status in 2008. 2 is correct: 29 August, Gidugu Ramamurthy’s birthday, is observed as Telugu Language Day. Both are correct.',
  'Both are commonly asked language facts.', 70),

  q('svp-art-016', ms('Consider the following statements:', [
    'Burrakatha is a solo silent mime without music.',
    'Adibhatla Narayana Das is regarded as the father of Harikatha in Telugu.',
    'Sheik Nazar was a renowned Burrakatha artist.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: Burrakatha is a sung narrative with tambura and small drums, by a main narrator and two co-artists. 2 is correct: Adibhatla Narayana Das shaped the Telugu Harikatha. 3 is correct: Sheik Nazar is the best-known Burrakatha exponent (Padma Shri). So 2 and 3 only.',
  'Burrakatha is named after a musical instrument.', 90),

  q('svp-art-017', match('Match the writer (List I) with the work (List II):', [
    'Sri Sri', 'Gurram Jashuva', 'Tripuraneni Ramaswamy', 'Boyi Bhimanna',
  ], [
    'Paleru', 'Suta Puranam', 'Maha Prasthanam', 'Gabbilam',
  ]), ['A-3, B-4, C-1, D-2', 'A-4, B-3, C-2, D-1', 'A-3, B-2, C-4, D-1', 'A-3, B-4, C-2, D-1'], 3,
  'Sri Sri wrote Maha Prasthanam (A-3); Gurram Jashuva wrote Gabbilam (B-4); Tripuraneni Ramaswamy Chowdary wrote Suta Puranam (C-2); Boyi Bhimanna wrote the play Paleru (D-1).',
  'Paleru is a play about a farm servant.', 110),

  q('svp-art-018', ms('Consider the following statements about Vemana:', [
    'Many of his verses end with the refrain “Viswadabhirama Vinura Vema”.',
    'C. P. Brown collected, edited and translated his verses.',
    'He composed the Dasarathi Satakam.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: the makutam “Viswadabhirama Vinura Vema” marks his verses. 2 is correct: C. P. Brown published and translated Vemana’s poems in the 19th century. 3 is wrong: Dasarathi Satakam is attributed to Kancherla Gopanna (Ramadasu). So 1 and 2 only.',
  'The Dasarathi Satakam is a Rama-bhakti work.', 90),

  q('svp-art-019', 'Which one of the following poets is NOT counted among the Ashtadiggajas?',
    ['Nandi Timmana', 'Dhurjati', 'Pingali Surana', 'Bammera Potana'], 3,
  'Nandi Timmana, Dhurjati and Pingali Surana appear in the traditional list of the Ashtadiggajas. Bammera Potana, author of the Andhra Maha Bhagavatamu, lived in the 15th century and refused court patronage.',
  'One poet refused to serve any king.', 70),

  q('svp-art-020', pairs('Consider the following pairs:', [
    ['Vempati Chinna Satyam', 'Kuchipudi'],
    ['Nataraja Ramakrishna', 'Revival of Perini and Andhra Natyam'],
    ['Mangalampalli Balamuralikrishna', 'Carnatic music'],
    ['Yamini Krishnamurthy', 'Kathakali'],
  ]), PAIRS, 2,
  'Pairs 1–3 are correct: Vempati Chinna Satyam systematised Kuchipudi; Nataraja Ramakrishna revived Perini and Andhra Natyam; Balamuralikrishna was a Carnatic vocalist and composer. Pair 4 is wrong: Yamini Krishnamurthy is a Bharatanatyam and Kuchipudi dancer, not a Kathakali artist. Three pairs are correct.',
  'Kathakali is from Kerala.', 100),

  q('svp-art-021', order('Arrange the following poets in chronological order:', [
    'Srinatha', 'Nannaya', 'Allasani Peddana', 'Tikkana',
  ]), ['2, 4, 1, 3', '2, 1, 4, 3', '4, 2, 1, 3', '2, 4, 3, 1'], 0,
  'Nannaya – 11th century; Tikkana – 13th century; Srinatha – late 14th–15th century; Allasani Peddana – 16th century. Sequence: 2, 4, 1, 3.',
  'Kavitrayam first, Ashtadiggajas last.', 80),

  q('svp-art-022', ar(
    'Gurajada Apparao’s Kanyasulkam is a landmark social play in Telugu.',
    'It satirises the practice of bride-price, under which young girls were married off to old men for money.',
  ), AR, 0,
  'A is true: Kanyasulkam (1892) is a milestone of modern Telugu drama. R is true and explains A: its satire of kanyasulkam (bride-price) and the social evils around it is what made it a landmark social play.',
  'The title itself names the evil.', 70),

  // ───────────── AP formation and governance ─────────────
  q('svp-gov-001', pairs('Consider the following pairs relating to Andhra Pradesh after 1956:', [
    ['First Chief Minister of Andhra Pradesh', 'Neelam Sanjiva Reddy'],
    ['First Governor of Andhra Pradesh', 'C. M. Trivedi'],
    ['First Speaker of the AP Legislative Assembly', 'Ayyadevara Kaleswara Rao'],
    ['First Dalit Chief Minister of Andhra Pradesh', 'Damodaram Sanjivayya'],
  ]), PAIRS, 3,
  'All four are correct: Neelam Sanjiva Reddy was the first CM of AP (1956); C. M. Trivedi continued as the first Governor; Ayyadevara Kaleswara Rao was the first Speaker; Damodaram Sanjivayya (1960–62) was the first Dalit CM.',
  'Each pair is a standard first.', 100),

  q('svp-gov-002', ms('Consider the following statements about the Andhra Pradesh Legislative Council:', [
    'It was created in 1956, along with the formation of the state.',
    'It was abolished in 1985.',
    'It was revived in 2007.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: the Council was created in 1958, not 1956. 2 is correct: it was abolished in 1985 during N. T. Rama Rao’s tenure. 3 is correct: it was revived in 2007. So 2 and 3 only.',
  'The council came two years after the state.', 90),

  q('svp-gov-003', ar(
    'Andhra Pradesh was among the first states to adopt the three-tier Panchayati Raj system, in 1959.',
    'Andhra Pradesh introduced the mandal system in place of taluks and panchayat samitis in the mid-1980s.',
  ), AR, 1,
  'A is true: AP introduced Panchayati Raj on 1 November 1959, soon after Rajasthan (2 October 1959). R is true: the mandal system was introduced in the mid-1980s. But a 1980s reform cannot explain a 1959 decision; the 1959 adoption followed the Balwantrai Mehta Committee. So R does not explain A.',
  'Can a later event explain an earlier one?', 80),

  q('svp-gov-004', ms('Consider the following statements about Article 371D:', [
    'It provides for the establishment of a central university in the state.',
    'It was inserted by the Constitution (32nd Amendment) Act, 1973.',
    'It enables the President to provide for equitable opportunities in public employment and education for people of different parts of the state.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: the central university provision is Article 371E. 2 is correct: Article 371D came with the 32nd Amendment, 1973. 3 is correct: this is its core purpose (local cadres, local areas for admission). So 2 and 3 only.',
  'Two adjacent articles were inserted together.', 100),

  q('svp-gov-005', ms('Consider the following statements about the Andhra Pradesh Reorganisation Act, 2014:', [
    'The appointed day for the formation of Telangana was 2 June 2014.',
    'The Act explicitly grants special category status to the residuary state of Andhra Pradesh.',
    'Hyderabad was made the common capital for a period not exceeding ten years.',
  ]), THREE_STATEMENTS, 2,
  '1 is correct: Telangana came into being on 2 June 2014. 2 is wrong: the Act does not contain special category status; that was a separate assurance given in Parliament, while the Act (Sections 46 and 94) speaks of grants and fiscal incentives. 3 is correct: Section 5 made Hyderabad the common capital for not more than ten years. So 1 and 3 only.',
  'Special category status was promised outside the text of the Act.', 110),

  q('svp-gov-006', pairs('Consider the following pairs (as provided after bifurcation in 2014):', [
    ['Andhra Pradesh – Lok Sabha seats', '25'],
    ['Telangana – Lok Sabha seats', '17'],
    ['Andhra Pradesh – Rajya Sabha seats', '11'],
    ['Telangana – Legislative Assembly seats', '175'],
  ]), PAIRS, 2,
  'Pairs 1–3 are correct: AP has 25 Lok Sabha and 11 Rajya Sabha seats; Telangana has 17 Lok Sabha seats. Pair 4 is wrong: 175 is the strength of the AP Legislative Assembly; Telangana’s Assembly has 119 seats. Three pairs are correct.',
  'The two Assemblies were 175 and 119.', 100),

  q('svp-gov-007', ms('Consider the following provisions of the Andhra Pradesh Reorganisation Act, 2014:', [
    'Section 8 gives the Governor a special responsibility for the security of residents in the common capital area.',
    'Section 90 declares the Polavaram irrigation project a national project.',
    'The Thirteenth Schedule lists commitments on education institutions and infrastructure for the successor states.',
  ]), THREE_STATEMENTS, 3,
  '1 is correct: Section 8 deals with the Governor’s responsibility for law and order and security in the common capital. 2 is correct: Section 90 makes Polavaram a national project. 3 is correct: the Thirteenth Schedule lists institutions (such as IIT, IIM, AIIMS) and infrastructure to be set up. All three are correct.',
  'These are the three most-quoted parts of the Act.', 100),

  q('svp-gov-008', order('Arrange the following in chronological order:', [
    'Six-Point Formula and the 32nd Constitutional Amendment',
    'Jai Telangana agitation',
    'Formation of the Telugu Desam Party',
    'Government Order 610 on local-cadre appointments',
  ]), ['1, 2, 3, 4', '2, 1, 4, 3', '2, 3, 1, 4', '2, 1, 3, 4'], 3,
  'Jai Telangana agitation – 1969; Six-Point Formula and 32nd Amendment – 1973; Telugu Desam Party founded – 29 March 1982; GO 610 – 1985. Sequence: 2, 1, 3, 4.',
  'The regional agitation came before the constitutional fix.', 90),

  q('svp-gov-009', pairs('Consider the following commissions/committees and their subjects:', [
    ['Srikrishna Committee', 'Examined the demand for a separate Telangana; reported in December 2010'],
    ['Girglani Commission', 'Violations of GO 610 in public employment'],
    ['Justice K. N. Wanchoo (1953)', 'Financial and administrative issues of the new Andhra State'],
    ['Fazl Ali Commission', 'Submitted its report in 1948'],
  ]), PAIRS, 2,
  'Pair 1 is correct: the Srikrishna Committee reported on 30 December 2010. Pair 2 is correct: the J. M. Girglani Commission (2001) examined GO 610 violations. Pair 3 is correct. Pair 4 is wrong: the Fazl Ali (States Reorganisation) Commission was set up in 1953 and reported in 1955; the 1948 body was the Dhar Commission. Three pairs are correct.',
  'Confusing two linguistic-states commissions is the trap.', 110),

  q('svp-gov-010', ms('Consider the following statements:', [
    'The Telugu Desam Party was founded by N. T. Rama Rao on 29 March 1982.',
    'The mandal system replaced the taluk and panchayat samiti structure during N. T. Rama Rao’s government.',
    'P. V. Narasimha Rao was Chief Minister when the Jai Andhra agitation broke out in 1972.',
  ]), THREE_STATEMENTS, 3,
  '1 is correct: NTR founded the TDP on 29 March 1982. 2 is correct: the mandal reform was carried out by the NTR government in the mid-1980s. 3 is correct: P. V. Narasimha Rao was CM (1971–73) when the agitation began after the Mulki verdict; President’s Rule followed in January 1973. All three are correct.',
  'All three are well-documented.', 100),

  q('svp-gov-011', ms('Consider the following statements:', [
    'Telugu was among the languages first declared classical in 2004.',
    'The Andhra Pradesh Official Language Act, 1966 made Telugu the official language of the state.',
  ]), TWO_STATEMENTS, 1,
  '1 is wrong: Tamil was the first, in 2004; Telugu and Kannada were declared classical in 2008. 2 is correct: the AP Official Language Act of 1966 adopted Telugu as the official language. So 2 only.',
  'Only one language was declared classical in 2004.', 70),

  q('svp-gov-012', ms('Consider the following statements about Neelam Sanjiva Reddy:', [
    'He was the first Chief Minister of Andhra Pradesh.',
    'He served as Speaker of the Lok Sabha.',
    'He was the first Chief Minister of Andhra State (1953).',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: he became the first CM of AP on 1 November 1956. 2 is correct: he was Speaker of the Lok Sabha before becoming President of India in 1977. 3 is wrong: the first CM of Andhra State (1953) was Tanguturi Prakasam; Sanjiva Reddy was Deputy CM then. So 1 and 2 only.',
  'Andhra State and Andhra Pradesh had different first CMs.', 90),

  q('svp-gov-013', ar(
    'Andhra State was formed on 1 October 1953.',
    'The JVP Committee had recommended an Andhra State that would include Madras city.',
  ), AR, 2,
  'A is true. R is false: the JVP Committee was willing to consider an Andhra State only without Madras city, which was a major sticking point in the movement.',
  'Madras city remained with Tamil Nadu.', 80),

  q('svp-gov-014', ms('Consider the following statements:', [
    'Bhadrachalam temple town was among the areas transferred to Andhra Pradesh.',
    'Seven mandals of the former Khammam district were transferred to Andhra Pradesh in 2014, chiefly in connection with the Polavaram project.',
  ]), TWO_STATEMENTS, 1,
  '1 is wrong: Bhadrachalam town, with the Sri Rama temple, remained in Telangana. 2 is correct: the AP Reorganisation (Amendment) legislation of 2014 moved seven Khammam mandals (in the Polavaram submergence area) to AP. So 2 only.',
  'The temple town stayed where it was.', 80),

  q('svp-gov-015', 'Under the Andhra Pradesh Reorganisation Act, 2014, which one of the following was NOT provided for?',
    ['Krishna River Management Board', 'Godavari River Management Board', 'An Apex Council chaired by the Union Minister of Water Resources', 'A Cauvery Water Management Authority'], 3,
  'The Act provides for the Krishna and Godavari River Management Boards and an Apex Council chaired by the Union Water Resources Minister to supervise them. The Cauvery Water Management Authority has nothing to do with the Act; it arose from the Cauvery dispute among Karnataka, Tamil Nadu, Kerala and Puducherry.',
  'AP’s rivers do not include the Cauvery.', 70),

  q('svp-gov-016', ms('Consider the following statements about Damodaram Sanjivayya:', [
    'He was the first Dalit Chief Minister of Andhra Pradesh (1960–62).',
    'He later served as President of the Indian National Congress.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: he was CM of AP from 1960 to 1962, the first Dalit to hold the office. 2 is correct: he became President of the Indian National Congress in 1962. Both are correct.',
  'He was also the first Dalit to head the Congress.', 70),

  q('svp-gov-017', ar(
    'The Andhra Pradesh Administrative Tribunal was constituted under a constitutional provision special to the state.',
    'Article 371D empowers the President to provide for an Administrative Tribunal for the state dealing with appointments and service matters.',
  ), AR, 0,
  'A is true: the APAT was set up in 1975 under Article 371D. R is true and explains A: clause (3) of Article 371D allows the President to constitute such a tribunal.',
  'Look for the clause that creates the tribunal.', 80),

  q('svp-gov-018', ms('Consider the following statements about the 1969 Telangana agitation:', [
    'The Telangana Praja Samithi was led by K. Chandrasekhar Rao.',
    'The Telangana Praja Samithi was led by M. Chenna Reddy.',
  ]), TWO_STATEMENTS, 1,
  '1 is wrong: K. Chandrasekhar Rao founded a different party, the Telangana Rashtra Samithi, in 2001. 2 is correct: Marri Chenna Reddy led the Telangana Praja Samithi in 1969. So 2 only.',
  'Two “Samithis” separated by three decades.', 70),

  // ───────────── AP heritage crafts and biodiversity ─────────────
  q('svp-bio-001', ms('Consider the following statements about Kalamkari:', [
    'The Srikalahasti style is drawn freehand with a bamboo kalam, often on mythological themes.',
    'The Machilipatnam (Pedana) style relies mainly on block printing, with Persian-influenced motifs.',
    'Both styles use mainly synthetic chemical dyes.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: Srikalahasti Kalamkari is pen-drawn, typically showing epic and temple themes. 2 is correct: Machilipatnam Kalamkari is block-printed and carries Persian motifs reflecting historic trade links. 3 is wrong: both traditions are known for natural and vegetable dyes with mordants. So 1 and 2 only.',
  'Kalam means pen; vegetable dyes are central to both.', 100),

  q('svp-bio-002', pairs('Consider the following textiles and the state they belong to:', [
    ['Uppada Jamdani sarees', 'Andhra Pradesh'],
    ['Dharmavaram silk sarees', 'Andhra Pradesh'],
    ['Pochampally Ikat', 'Andhra Pradesh'],
    ['Venkatagiri sarees', 'Andhra Pradesh'],
  ]), PAIRS, 2,
  'Uppada (Kakinada region), Dharmavaram (Anantapur region) and Venkatagiri (Nellore region) are AP textiles. Pochampally Ikat belongs to Telangana (Nalgonda–Yadadri region). Three pairs are correct.',
  'One famous ikat is from across the 2014 border.', 90),

  q('svp-bio-003', 'Which one of the following is NOT a GI-registered craft of Andhra Pradesh?',
    ['Kondapalli toys', 'Etikoppaka toys', 'Nirmal toys', 'Budithi bell and brass metal craft'], 2,
  'Kondapalli toys, Etikoppaka toys and Budithi bell-metal craft are AP GI products. Nirmal toys and craft belong to Telangana.',
  'One toy tradition is from Adilabad region.', 60),

  q('svp-bio-004', match('Match the craft centre (List I) with its craft (List II):', [
    'Kondapalli', 'Etikoppaka', 'Bobbili', 'Durgi',
  ], [
    'Stone carving', 'Lacquered, lathe-turned toys of ankudu wood', 'Light toys of soft tella poniki wood', 'Veena carved from jackfruit wood',
  ]), ['A-3, B-2, C-4, D-1', 'A-2, B-3, C-4, D-1', 'A-3, B-2, C-1, D-4', 'A-3, B-4, C-2, D-1'], 0,
  'Kondapalli toys are made of light tella poniki wood (A-3). Etikoppaka toys are lathe-turned from ankudu wood and lacquered (B-2). The Bobbili veena is carved from jackfruit wood (C-4). Durgi in the Palnadu region is known for stone carving (D-1).',
  'Two wooden-toy traditions use two different woods.', 110),

  q('svp-bio-005', ms('Consider the following statements about Etikoppaka toys:', [
    'Etikoppaka village lies on the bank of the Varaha river in north coastal Andhra.',
    'The toys are coloured with lac and natural dyes.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: Etikoppaka is on the Varaha river near Anakapalli. 2 is correct: the craft is known for lacquer colours made with natural dyes, giving smooth, rounded, child-safe toys. Both are correct.',
  'The craft is famous for its safe colours.', 80),

  q('svp-bio-006', ms('Consider the following statements about Geographical Indication tags for food items:', [
    'Tirupati laddu has a GI tag.',
    'Bandar laddu of Machilipatnam has a GI tag.',
    'Hyderabadi Haleem is a GI product registered for Andhra Pradesh.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: Tirupati laddu was registered as a GI (2009). 2 is correct: Bandar laddu (Machilipatnam) also has a GI tag. 3 is wrong: Hyderabadi Haleem is associated with Hyderabad, now in Telangana. So 1 and 2 only.',
  'Bandar is the old name of Machilipatnam.', 90),

  q('svp-bio-007', pairs('Consider the following protected areas and the species they are best known for:', [
    ['Rollapadu Wildlife Sanctuary', 'Great Indian Bustard'],
    ['Nelapattu Bird Sanctuary', 'Breeding spot-billed pelicans'],
    ['Koundinya Wildlife Sanctuary', 'Asian elephant'],
    ['Sri Lankamalleswara Wildlife Sanctuary', 'Jerdon’s courser'],
  ]), PAIRS, 3,
  'All four are correct: Rollapadu (Kurnool region) protects the Great Indian Bustard; Nelapattu is a pelican and heron breeding site; Koundinya (Palamaner area) is AP’s elephant sanctuary; Sri Lankamalleswara is famous for the rediscovery of Jerdon’s courser.',
  'Every pair is a signature species.', 110),

  q('svp-bio-008', ms('Consider the following statements about Jerdon’s courser:', [
    'It was rediscovered in 1986 after it had long been feared extinct.',
    'It is a large diurnal raptor.',
    'The scrub jungle of the Sri Lankamalleswara Wildlife Sanctuary is its known habitat.',
  ]), THREE_STATEMENTS, 2,
  '1 is correct: it was rediscovered in 1986 near Reddipalli after about eight decades without records. 2 is wrong: it is a small nocturnal courser (family Glareolidae), not a raptor. 3 is correct: it lives in the scrub forests of the Lankamalleswara area. So 1 and 3 only.',
  'Coursers are ground birds related to pratincoles.', 100),

  q('svp-bio-009', ms('Consider the following statements about the Coringa Wildlife Sanctuary:', [
    'It lies in the Krishna estuary near Machilipatnam.',
    'It protects mangrove forests near Kakinada.',
    'The fishing cat is found there.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: Coringa is in the Godavari estuary near Kakinada; the Krishna estuary has the Krishna Wildlife Sanctuary. 2 is correct: Coringa is a mangrove sanctuary near Kakinada. 3 is correct: the fishing cat lives in these mangroves. So 2 and 3 only.',
  'Two mangrove sanctuaries, two estuaries.', 100),

  q('svp-bio-010', ms('Consider the following statements:', [
    'The Nagarjunasagar–Srisailam Tiger Reserve spans the Nallamala hills.',
    'The Chenchus, a particularly vulnerable tribal group, live in these forests.',
    'The Gundla Brahmeswaram Wildlife Sanctuary is in the Seshachalam hills.',
  ]), THREE_STATEMENTS, 0,
  '1 is correct: NSTR is in the Nallamala forests around the Krishna gorge. 2 is correct: the Chenchus are a PVTG living in the Nallamala. 3 is wrong: Gundla Brahmeswaram lies in the Nallamala, adjoining the tiger reserve, not in the Seshachalam hills. So 1 and 2 only.',
  'Gundla Brahmeswaram is a Nallamala sanctuary.', 100),

  q('svp-bio-011', ms('Consider the following statements about the Papikonda National Park:', [
    'It lies along the Godavari gorge in the Eastern Ghats.',
    'It lies on the banks of the Krishna.',
  ]), TWO_STATEMENTS, 0,
  '1 is correct: Papikonda National Park covers the hills flanking the Godavari gorge. 2 is wrong: it is on the Godavari, not the Krishna. So 1 only.',
  'The Papikonda gorge is upstream of Polavaram.', 60),

  q('svp-bio-012', ms('Consider the following statements about the state symbols of Andhra Pradesh:', [
    'The Indian roller (palapitta) is the present state bird.',
    'The blackbuck is the state animal.',
  ]), TWO_STATEMENTS, 1,
  '1 is wrong: in 2018 AP adopted the rose-ringed parakeet (rama chiluka) as its state bird; the Indian roller is Telangana’s state bird. 2 is correct: the blackbuck (Krishna jinka) is AP’s state animal. So 2 only.',
  'AP changed its state bird in 2018.', 70),

  q('svp-bio-013', ms('Consider the following statements about Kolleru:', [
    'The Atapaka bird sanctuary on Kolleru is known for nesting spot-billed (grey) pelicans.',
    '“Operation Kolleru” (2006) demolished fish tanks inside the sanctuary limits.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: Atapaka is a well-known pelicanry on Kolleru. 2 is correct: in 2006 the government demolished aquaculture tanks that had encroached on the sanctuary, under the Supreme Court’s directions. Both are correct.',
  'One statement is about birds, the other about encroachment.', 80),

  q('svp-bio-014', pairs('Consider the following bird sanctuaries/heronries and their locations:', [
    ['Telineelapuram', 'Srikakulam region'],
    ['Uppalapadu', 'Near Guntur'],
    ['Atapaka', 'Kolleru lake'],
    ['Nelapattu', 'Kolleru lake'],
  ]), PAIRS, 2,
  'Pair 1 is correct: Telineelapuram is a heronry of pelicans and painted storks in the Srikakulam region. Pair 2 is correct: Uppalapadu is close to Guntur. Pair 3 is correct. Pair 4 is wrong: Nelapattu is in the south, near Pulicat lake, not on Kolleru. Three pairs are correct.',
  'Nelapattu is close to Sriharikota.', 100),

  q('svp-bio-015', ms('Consider the following statements:', [
    'The Seshachalam hills were declared a Biosphere Reserve in 2010.',
    'Red sanders (Pterocarpus santalinus) is endemic to the southern Eastern Ghats, including these hills.',
    'The Talakona waterfall lies within the Sri Venkateswara National Park.',
  ]), THREE_STATEMENTS, 3,
  '1 is correct: Seshachalam was declared a Biosphere Reserve in 2010. 2 is correct: red sanders is endemic to the southern Eastern Ghats of AP. 3 is correct: Talakona falls is inside the Sri Venkateswara National Park. All three are correct.',
  'All three describe the Tirumala hill forests.', 100),

  q('svp-bio-016', ar(
    'The golden gecko (Calodactylodes aureus) is found in the Eastern Ghats around Tirumala.',
    'The golden gecko is endemic to the Western Ghats alone.',
  ), AR, 2,
  'A is true: the Indian golden gecko is recorded from rocky forests of the Eastern Ghats, including the Tirumala–Seshachalam hills. R is false: since it occurs in the Eastern Ghats, it cannot be endemic to the Western Ghats.',
  'If A is true, can R also be true?', 70),

  q('svp-bio-017', ms('Consider the following statements about Tholu Bommalata:', [
    'The puppets are wooden string marionettes.',
    'Nimmalakunta village is famous for its leather puppets.',
    'The puppets are made of thin, translucent, coloured leather and shown on a backlit screen.',
  ]), THREE_STATEMENTS, 1,
  '1 is wrong: they are flat leather shadow puppets, not wooden marionettes. 2 is correct: Nimmalakunta (Anantapur region) is the best-known centre for leather puppets. 3 is correct: tholu means leather; the translucent painted figures throw coloured shadows on a lit screen. So 2 and 3 only.',
  'Tholu means leather.', 80),

  q('svp-bio-018', howMany('Consider the following GI-registered handloom textiles:', [
    'Mangalagiri sarees and fabrics', 'Gadwal sarees', 'Narayanpet handloom sarees', 'Venkatagiri sarees',
  ]).replace('How many of the above are correct?', 'How many of the above belong to present-day Andhra Pradesh?'), COUNT, 1,
  'Mangalagiri (Guntur region) and Venkatagiri (Nellore region) belong to Andhra Pradesh. Gadwal and Narayanpet are in Telangana. So two.',
  'Two of these are Telangana weaves from the Mahbubnagar region.', 90),

  q('svp-bio-019', ms('Consider the following statements:', [
    'Budithi in the Srikakulam region is known for bell-metal and brass ware.',
    'The Bobbili veena is traditionally carved from a single block of jackfruit wood.',
  ]), TWO_STATEMENTS, 2,
  '1 is correct: Budithi bell and brass metal craft has a GI tag. 2 is correct: the Bobbili veena (ekanda veena) is carved from one piece of jackfruit wood. Both are correct.',
  'Both are north coastal crafts.', 70),

  q('svp-bio-020', ms('Consider the following statements:', [
    'The Krishna Wildlife Sanctuary protects the mangroves of the Krishna estuary.',
    'The Krishna Wildlife Sanctuary is the main habitat of the Great Indian Bustard in Andhra Pradesh.',
  ]), TWO_STATEMENTS, 0,
  '1 is correct: Krishna WLS covers the mangroves of the Krishna delta. 2 is wrong: the Great Indian Bustard is a grassland bird protected at Rollapadu in the Kurnool region. So 1 only.',
  'Bustards need grasslands, not mangroves.', 70),

  q('svp-bio-021', 'Which one of the following is NOT a coastal or wetland protected area?',
    ['Coringa Wildlife Sanctuary', 'Krishna Wildlife Sanctuary', 'Pulicat Lake Bird Sanctuary', 'Rollapadu Wildlife Sanctuary'], 3,
  'Coringa and Krishna WLS are mangrove sanctuaries, and Pulicat is a lagoon sanctuary. Rollapadu is an inland dry grassland sanctuary for the Great Indian Bustard.',
  'One sanctuary protects grassland birds.', 60),
]
