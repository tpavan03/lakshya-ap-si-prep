export type Subject = 'Arithmetic' | 'Reasoning' | 'General Studies' | 'AP Focus' | 'English'

export type Question = {
  id: string
  subject: Subject
  topic: string
  question: string
  options: string[]
  answer: number
  explanation: string
  hint: string
  seconds: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  source: string
  exam?: string
}

const q = (id: string, subject: Subject, topic: string, question: string, options: string[], answer: number, explanation: string, hint: string, seconds = 60, difficulty: Question['difficulty'] = 'Medium', exam?: string): Question => ({
  id, subject, topic, question, options, answer, explanation, hint, seconds, difficulty, source: exam ? 'Adapted practice — verify against linked archive' : 'Original practice', exam,
})

export const questions: Question[] = [
  q('a01','Arithmetic','Percentages','A number increases from 240 to 300. What is the percentage increase?',['20%','25%','30%','60%'],1,'The increase is 60. Divide 60 by 240 and multiply by 100: 25%.','Find change ÷ original.',45,'Easy'),
  q('a02','Arithmetic','Ratio','The ratio of men to women is 7:5. If the total is 144, how many are women?',['48','60','72','84'],1,'There are 12 equal parts. Each part is 12, so women = 5 × 12 = 60.','Convert the total into 12 equal parts.',50,'Easy'),
  q('a03','Arithmetic','Time & work','A completes a job in 12 days and B in 18 days. How long do they take together?',['6.2 days','7.2 days','8 days','9 days'],1,'Combined daily work is 1/12 + 1/18 = 5/36. Time = 36/5 = 7.2 days.','Add their one-day work.',70),
  q('a04','Arithmetic','Profit & loss','An article bought for ₹800 is sold at a 15% profit. Find the selling price.',['₹880','₹900','₹920','₹940'],2,'Profit = 15% of 800 = 120. Selling price = ₹920.','Add 15% of cost price.',40,'Easy'),
  q('a05','Arithmetic','Simple interest','Find simple interest on ₹5,000 at 8% per annum for 3 years.',['₹1,000','₹1,100','₹1,200','₹1,400'],2,'SI = PRT/100 = 5000 × 8 × 3 / 100 = ₹1,200.','Use PRT/100.',45,'Easy'),
  q('a06','Arithmetic','Average','The average of five numbers is 28. If one number is removed, the average is 25. What was removed?',['25','28','35','40'],3,'Original total is 140; remaining total is 100. The removed number is 40.','Compare the two totals.',55),
  q('a07','Arithmetic','Time & distance','A train covers 360 km in 4.5 hours. What is its average speed?',['72 km/h','75 km/h','80 km/h','90 km/h'],2,'Speed = 360 ÷ 4.5 = 80 km/h.','Distance ÷ time.',40,'Easy'),
  q('a08','Arithmetic','Mensuration','What is the area of a circle of radius 7 cm? Use π = 22/7.',['44 cm²','88 cm²','154 cm²','308 cm²'],2,'Area = πr² = 22/7 × 49 = 154 cm².','Use πr².',45,'Easy'),
  q('r01','Reasoning','Number series','Choose the next number: 3, 8, 15, 24, 35, ?',['46','47','48','49'],2,'Differences are 5, 7, 9, 11; next difference is 13, giving 48.','Look at consecutive differences.',55),
  q('r02','Reasoning','Coding','If POLICE is coded as QPMJDF, how is CRIME coded?',['DSJNF','DSJMF','BRHLD','ETKOG'],0,'Each letter is shifted forward by one: C→D, R→S, I→J, M→N, E→F.','Shift each letter equally.',55,'Easy'),
  q('r03','Reasoning','Blood relations','Meena says, “He is the son of my mother’s only son.” How is the boy related to Meena?',['Son','Brother','Nephew','Cousin'],2,'Meena’s mother’s only son is Meena’s brother; his son is her nephew.','Build the relation one phrase at a time.',65),
  q('r04','Reasoning','Directions','A person walks 4 km north, 3 km east, then 4 km south. Where is the person from the start?',['3 km east','3 km west','4 km north','5 km east'],0,'North and south movements cancel, leaving 3 km east.','Cancel opposite movements.',45,'Easy'),
  q('r05','Reasoning','Syllogism','All inspectors are officers. Some officers are athletes. Which conclusion definitely follows?',['All athletes are inspectors','Some inspectors are athletes','All inspectors are officers','No officer is an athlete'],2,'The first sentence directly states that all inspectors are officers; no overlap with athletes is guaranteed.','Accept only what must be true.',55),
  q('r06','Reasoning','Analogy','Constitution : Country :: Rules : ?',['Game','Citizen','Court','Election'],0,'A constitution governs a country; rules govern a game.','Find the governing document and governed entity.',45,'Easy'),
  q('r07','Reasoning','Clock','What is the angle between the hands of a clock at 3:30?',['60°','75°','90°','105°'],1,'Minute hand is at 180°. Hour hand is at 105°. Difference = 75°.','The hour hand moves 0.5° per minute.',70,'Hard'),
  q('g01','General Studies','Polity','Which Article of the Constitution abolishes untouchability?',['Article 14','Article 15','Article 17','Article 21'],2,'Article 17 abolishes untouchability and forbids its practice in any form.','It is one of the equality provisions.',45,'Easy'),
  q('g02','General Studies','Polity','A Money Bill can be introduced only in which House?',['Rajya Sabha','Lok Sabha','Either House','Joint sitting'],1,'Under Article 109, a Money Bill can originate only in the Lok Sabha.','Think of the directly elected House.',50),
  q('g03','General Studies','History','Who presided over the Lahore Session of the Indian National Congress in 1929?',['Mahatma Gandhi','Jawaharlal Nehru','Sardar Patel','Subhas Chandra Bose'],1,'Jawaharlal Nehru presided over the 1929 Lahore Session, associated with the Purna Swaraj resolution.','Connect 1929 with Purna Swaraj.',50),
  q('g04','General Studies','Geography','The Tropic of Cancer passes through how many Indian states?',['6','7','8','9'],2,'It passes through eight states: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura and Mizoram.','Trace west to east.',55),
  q('g05','General Studies','Science','Which part of the cell is called the powerhouse of the cell?',['Nucleus','Ribosome','Mitochondrion','Golgi body'],2,'Mitochondria produce most cellular ATP through respiration.','It produces ATP.',40,'Easy'),
  q('g06','General Studies','Economy','Repo rate is the rate at which which institution lends short-term funds to commercial banks?',['SEBI','RBI','NABARD','Finance Ministry'],1,'The Reserve Bank of India lends to commercial banks at the repo rate against eligible securities.','It is a monetary-policy rate.',45,'Easy'),
  q('g07','General Studies','Environment','The Ramsar Convention primarily concerns which ecosystems?',['Deserts','Wetlands','Mountains','Grasslands'],1,'The Ramsar Convention provides the framework for conservation and wise use of wetlands.','The convention is named after a lakeside city.',45),
  q('g08','General Studies','Physics','Which SI unit measures electric resistance?',['Ampere','Volt','Ohm','Watt'],2,'Electrical resistance is measured in ohms (Ω).','Recall Ohm’s law.',35,'Easy'),
  q('g09','General Studies','History','The Permanent Settlement of Bengal was introduced by whom?',['Lord Wellesley','Lord Cornwallis','Lord Curzon','Lord Dalhousie'],1,'Lord Cornwallis introduced the Permanent Settlement in 1793.','Think of the 1793 land-revenue arrangement.',50),
  q('g10','General Studies','Geography','Which river is known as the Dakshina Ganga?',['Krishna','Godavari','Kaveri','Narmada'],1,'The Godavari is commonly called the Dakshina Ganga because of its length and cultural importance.','It is India’s second-longest river.',40,'Easy'),
  q('ap01','AP Focus','Geography','Which is the largest district of Andhra Pradesh by area after the 2022 reorganisation?',['Anantapuramu','Prakasam','Alluri Sitharama Raju','Kurnool'],1,'Prakasam is the largest district by area under the 26-district arrangement. Administrative boundaries can change, so verify against current AP records.','Think of the central coastal region extending inland.',55),
  q('ap02','AP Focus','History','The Amaravati school of art flourished mainly under which dynasty?',['Satavahanas','Pallavas','Cholas','Eastern Chalukyas'],0,'The Amaravati Buddhist art tradition reached prominence under Satavahana patronage.','Connect Amaravati’s stupa with early Deccan rule.',50),
  q('ap03','AP Focus','Polity','Andhra State was formed in which year?',['1948','1950','1953','1956'],2,'Andhra State was formed on 1 October 1953; Andhra Pradesh followed in 1956.','Distinguish Andhra State from Andhra Pradesh.',45,'Easy'),
  q('ap04','AP Focus','Geography','Which major river forms an extensive delta around Rajamahendravaram and Konaseema?',['Pennar','Vamsadhara','Godavari','Nagavali'],2,'The Godavari branches into distributaries and forms the fertile Konaseema delta.','Recall the Dowleswaram barrage region.',40,'Easy'),
  q('ap05','AP Focus','Economy','Sri City, a major integrated business city, is located in which district?',['Tirupati','Krishna','Kakinada','Anakapalli'],0,'Sri City lies near Tada in Tirupati district under the current district organisation.','It is close to the Tamil Nadu border.',50),
  q('ap06','AP Focus','Culture','Kuchipudi, the classical dance form, originated in which present-day district?',['NTR','Krishna','Guntur','Eluru'],1,'Kuchipudi village is in Krishna district.','The village and dance share a name.',40,'Easy'),
  q('e01','English','Grammar','Choose the grammatically correct sentence.',['Each of the officers have arrived.','Each of the officers has arrived.','Each of the officer have arrived.','Each officers has arrived.'],1,'“Each” is singular and takes “has”; “of the officers” does not change the subject.','Find the true subject.',40,'Easy'),
  q('e02','English','Vocabulary','Choose the word closest in meaning to “vigilant”.',['Careless','Watchful','Noisy','Flexible'],1,'Vigilant means keeping careful watch for possible danger or difficulty.','A police officer must remain ___.',35,'Easy'),
  q('e03','English','Usage','Choose the correct passive form: “The team completed the inquiry.”',['The inquiry completed the team.','The inquiry was completed by the team.','The team was completed by the inquiry.','The inquiry has complete by the team.'],1,'The object becomes the subject and the simple past becomes “was completed”.','Keep the tense unchanged.',45,'Easy'),
  q('e04','English','Comprehension','A report is concise when it does what?',['Uses the most words possible','States relevant facts briefly','Avoids evidence','Uses only technical terms'],1,'Concise writing conveys necessary information clearly without needless words.','Concise means brief and complete.',35,'Easy'),
]

export type Topic = {
  id: string
  subject: Subject
  title: string
  description: string
  concepts: string[]
  sources: { label: string; note: string; url: string }[]
}

export const topics: Topic[] = [
  {id:'percentages',subject:'Arithmetic',title:'Arithmetic foundations',description:'Build speed in the SSC-standard core before adding shortcuts.',concepts:['Number system & simplification','Percentages, ratio & average','Profit, loss & interest','Time, work, speed & distance','Mensuration, clocks & calendars'],sources:[{label:'NCERT Mathematics',note:'Start with Classes 6–10 examples and exercises.',url:'https://ncert.nic.in/textbook.php'},{label:'R.S. Aggarwal — Quantitative Aptitude',note:'Commercial reference for graded practice; use the latest edition.',url:'https://www.schandpublishing.com/books/competitive-exams/quantitative-aptitude/quantitative-aptitude-competitive-examinations/9789355012326/'}]},
  {id:'reasoning',subject:'Reasoning',title:'Reasoning & mental ability',description:'Learn the pattern, then practise within a strict time budget.',concepts:['Series, analogy & classification','Coding and decoding','Directions & blood relations','Syllogism and statements','Spatial and non-verbal reasoning'],sources:[{label:'R.S. Aggarwal — Verbal & Non-Verbal Reasoning',note:'Topic-wise worked examples and practice.',url:'https://www.schandpublishing.com/books/competitive-exams/reasoning/verbal-non-verbal-reasoning/9789355013927/'},{label:'SATHEE aptitude resources',note:'Free Government of India learning and practice portal.',url:'https://sathee.iitk.ac.in/'}]},
  {id:'polity',subject:'General Studies',title:'Polity, economy & society',description:'Read the constitutional structure first; memorise articles in context.',concepts:['Constitution and fundamental rights','Parliament, President and judiciary','State and local government','Planning, reforms and rural development','Basic macroeconomics'],sources:[{label:'Constitution of India',note:'Official Legislative Department text.',url:'https://www.legislative.gov.in/constitution-of-india'},{label:'NCERT Political Science',note:'Classes 9–12 build clear conceptual foundations.',url:'https://ncert.nic.in/textbook.php'},{label:'RBI financial education',note:'Primary-source explainers for banking and monetary policy.',url:'https://www.rbi.org.in/FinancialEducation/Home.aspx'}]},
  {id:'history',subject:'General Studies',title:'History & culture',description:'Use a timeline and connect movements, laws and leaders.',concepts:['Ancient and medieval India','Modern India and national movement','Art, religion and literature','Post-independence consolidation','Andhra history and culture'],sources:[{label:'NCERT History',note:'Read Classes 6–12 selectively against the syllabus.',url:'https://ncert.nic.in/textbook.php'},{label:'Indian Culture Portal',note:'Government-curated material on art and heritage.',url:'https://indianculture.gov.in/'}]},
  {id:'geography',subject:'General Studies',title:'Geography, science & environment',description:'Combine maps and diagrams with short factual revision.',concepts:['Indian physical geography','Climate, soils and resources','General science in daily life','Ecology and biodiversity','Disaster management'],sources:[{label:'NCERT textbooks',note:'Core geography and science source.',url:'https://ncert.nic.in/textbook.php'},{label:'NDMA',note:'Official disaster-management guidelines.',url:'https://ndma.gov.in/'},{label:'ISRO Bhuvan',note:'Explore Indian maps and thematic layers.',url:'https://bhuvan.nrsc.gov.in/'}]},
  {id:'ap-focus',subject:'AP Focus',title:'Andhra Pradesh focus',description:'Connect state facts to wider history, geography, economy and governance.',concepts:['Physical and economic geography','History and state formation','Art, literature and movements','Districts, rivers and projects','Current schemes and administration'],sources:[{label:'AP Government portal',note:'Departments, districts, schemes and primary updates.',url:'https://www.ap.gov.in/'},{label:'AP Economic Survey',note:'Use the latest official socioeconomic review.',url:'https://apfinance.gov.in/'},{label:'AP Legislature',note:'State legislative information and documents.',url:'https://aplegislature.org/'}]},
  {id:'language',subject:'English',title:'Descriptive English & Telugu/Urdu',description:'Papers I and II are qualifying, but they still require timed writing practice.',concepts:['Comprehension and précis','Short essay and paragraph','Letter and report writing','Grammar and usage','Translation practice'],sources:[{label:'British Council LearnEnglish',note:'Free grammar and writing lessons.',url:'https://learnenglish.britishcouncil.org/'},{label:'CIIL language resources',note:'Government language-learning resources.',url:'https://www.ciil.org/'}]},
]

export const archives = [
  {year:'2023',title:'AP SI Preliminary Written Test',detail:'Paper I: Arithmetic & Reasoning · Paper II: General Studies',url:'https://slprb.ap.gov.in/',status:'Official portal'},
  {year:'2022',title:'AP SI recruitment notification',detail:'Official pattern, syllabus, eligibility and selection rules',url:'https://entri.app/blog/wp-content/uploads/2022/11/ap-police-si-notification.pdf',status:'Notification mirror'},
  {year:'2018',title:'AP Police SI paper archive',detail:'Use the linked scan for paper practice; explanations here are editorial.',url:'https://slprb.ap.gov.in/',status:'Source index'},
  {year:'2016',title:'AP Police SI paper archive',detail:'Previous-cycle reference for repeated concepts and difficulty.',url:'https://slprb.ap.gov.in/',status:'Source index'},
]

export const mockSeries = Array.from({length: 50}, (_, index) => {
  const number = index + 1
  const full = number % 5 === 0
  const subjects: Subject[] = ['Arithmetic','Reasoning','General Studies','AP Focus','English']
  return {
    id: `mock-${String(number).padStart(2,'0')}`,
    number,
    title: full ? `Full Prelims Simulation ${number / 5}` : `${subjects[index % subjects.length]} Sectional ${number}`,
    type: full ? 'Full paper' : 'Sectional',
    questions: full ? 100 : 25,
    minutes: full ? 180 : 30,
    subject: full ? 'Mixed' : subjects[index % subjects.length],
    locked: number > 1 && number % 5 !== 0,
  }
})
