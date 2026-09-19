export type PaperStage = 'Prelims' | 'Final written' | 'Other-state'
export type PaperStatus = 'Official' | 'Verified mirror' | 'Community scan' | 'Reference only'
export type InteractiveStatus = 'Ready' | 'In review' | 'PDF only'

export type PreviousPaper = {
  id: string
  state: 'Andhra Pradesh' | 'Kerala' | 'Rajasthan'
  year: number
  stage: PaperStage
  paper: string
  subject: string
  title: string
  examDate?: string
  questions?: number
  minutes?: number
  languages: string[]
  paperUrl?: string
  readerUrl?: string
  booklet?: string
  answerKeyUrl?: string
  sourceUrl?: string
  status: PaperStatus
  interactive: InteractiveStatus
  note?: string
}

const careerPower = 'https://www.careerpower.in/ap-police-si-previous-year-question-papers.html'
const freshersNow = 'https://www.freshersnow.com/ap-police-si-previous-question-papers-pdf/'
const freeJobAlert2016 = 'https://www.freejobalert.com/andhra-pradesh-examwise-answer-keys/310876/'

export const previousPapers: PreviousPaper[] = [
  {
    id: 'ap-2023-prelims-1', state: 'Andhra Pradesh', year: 2023, stage: 'Prelims', paper: 'Paper I',
    subject: 'Arithmetic & reasoning', title: 'AP SI Preliminary Written Test — Paper I', examDate: '19 Feb 2023', questions: 100, minutes: 180,
    languages: ['English', 'Telugu'], status: 'Verified mirror', interactive: 'In review',
    paperUrl: 'https://www.careerpower.in/blog/wp-content/uploads/2025/08/13143909/AP-Police-SI-Prelims-Exam-Official-Paper-I-Held-On_-19-Feb-2023.pdf',
    answerKeyUrl: 'https://img.freejobalert.com/uploads/2023/02/Final-Answer-Key-Paper-one-AP-Police-SI-Posts.pdf', sourceUrl: careerPower,
  },
  {
    id: 'ap-2023-prelims-2', state: 'Andhra Pradesh', year: 2023, stage: 'Prelims', paper: 'Paper II',
    subject: 'General Studies', title: 'AP SI Preliminary Written Test — Paper II', examDate: '19 Feb 2023', questions: 100, minutes: 180,
    languages: ['English', 'Telugu'], status: 'Verified mirror', interactive: 'In review',
    paperUrl: 'https://www.careerpower.in/blog/wp-content/uploads/2025/08/13143907/AP-Police-SI-Prelims-Exam-Official-Paper-II-Held-On_-19-Feb-2023_compressed.pdf',
    answerKeyUrl: 'https://slprb.ap.gov.in/PDFS/Paper-II_Final_Key_SI%28PWT%29.pdf', sourceUrl: careerPower,
  },
  {
    id: 'ap-2023-final-3', state: 'Andhra Pradesh', year: 2023, stage: 'Final written', paper: 'Paper III',
    subject: 'Arithmetic & mental ability', title: 'AP SI Final Written Test — Paper III', examDate: '15 Oct 2023', questions: 200, minutes: 180,
    languages: ['English', 'Telugu'], status: 'Verified mirror', interactive: 'In review',
    paperUrl: 'https://www.careerpower.in/blog/wp-content/uploads/2025/08/13143901/AP-Police-SI-Mains-Exam-Arithmetic-MA-Official-Paper-III-Held-On_-15-Oct-2023.pdf',
    answerKeyUrl: 'https://www.freshersnow.com/ap-police-si-final-written-exam-answer-key-2023/', sourceUrl: careerPower,
  },
  {
    id: 'ap-2023-final-4', state: 'Andhra Pradesh', year: 2023, stage: 'Final written', paper: 'Paper IV',
    subject: 'General Studies', title: 'AP SI Final Written Test — Paper IV', examDate: '15 Oct 2023', questions: 200, minutes: 180,
    languages: ['English', 'Telugu'], status: 'Verified mirror', interactive: 'In review',
    paperUrl: 'https://www.careerpower.in/blog/wp-content/uploads/2025/08/13143900/AP-Police-SI-Mains-Exam-GS-Official-Paper-IV-Held-On_-15-Oct-2023.pdf',
    answerKeyUrl: 'https://www.freshersnow.com/ap-police-si-final-written-exam-answer-key-2023/', sourceUrl: careerPower,
  },
  {
    id: 'ap-2018-prelims-1', state: 'Andhra Pradesh', year: 2018, stage: 'Prelims', paper: 'Paper I',
    subject: 'Arithmetic & reasoning', title: 'AP SI Preliminary Written Test — Paper I', examDate: '16 Dec 2018', questions: 100, minutes: 180,
    languages: ['English', 'Telugu'], status: 'Community scan', interactive: 'Ready', booklet: 'C',
    paperUrl: 'https://drive.usercontent.google.com/download?id=1ofPjDLLCyHFvIpLzzda8FRLY6E_a9MEA&export=download&confirm=t',
    readerUrl: 'https://drive.google.com/file/d/1ofPjDLLCyHFvIpLzzda8FRLY6E_a9MEA/preview',
    answerKeyUrl: 'https://img.freejobalert.com/uploads/2018/12/Answer-Key-AP-Police-SI-Posts-FN.pdf', sourceUrl: careerPower,
  },
  {
    id: 'ap-2018-prelims-2', state: 'Andhra Pradesh', year: 2018, stage: 'Prelims', paper: 'Paper II',
    subject: 'General Studies', title: 'AP SI Preliminary Written Test — Paper II', examDate: '16 Dec 2018', questions: 100, minutes: 180,
    languages: ['English'], status: 'Verified mirror', interactive: 'In review',
    paperUrl: 'https://www.careerpower.in/blog/wp-content/uploads/2025/08/13143859/AP-Police-SI-Prelims-2018-Paper-2-English.pdf',
    answerKeyUrl: 'https://www.forum.universityupdates.in/attachments/si-pwt-preliminary-key-paper-ii-16-12-2018-an-pdf.5633/', sourceUrl: careerPower,
  },
  {
    id: 'ap-2018-final-3', state: 'Andhra Pradesh', year: 2018, stage: 'Final written', paper: 'Paper III',
    subject: 'Arithmetic & mental ability', title: 'AP SI Final Written Test — Paper III', examDate: '24 Feb 2019', questions: 200, minutes: 180,
    languages: ['English', 'Telugu'], status: 'Verified mirror', interactive: 'In review',
    paperUrl: 'https://files.freshersnow.com/wp-content/uploads/2022/10/AP-Police-SI-Mains-2018-Paper-3.pdf',
    answerKeyUrl: 'https://img.freejobalert.com/uploads/2019/06/Final-Key-AP-Police-SI-RSI-Paper-III.pdf', sourceUrl: freshersNow,
    note: 'The 2018 recruitment final written test was held in February 2019.',
  },
  {
    id: 'ap-2018-final-4', state: 'Andhra Pradesh', year: 2018, stage: 'Final written', paper: 'Paper IV',
    subject: 'General Studies', title: 'AP SI Final Written Test — Paper IV', examDate: '24 Feb 2019', questions: 200, minutes: 180,
    languages: ['English', 'Telugu'], status: 'Verified mirror', interactive: 'In review',
    paperUrl: 'https://files.freshersnow.com/wp-content/uploads/2022/10/AP-Police-SI-Mains-2018-Paper-4-English.pdf',
    answerKeyUrl: 'https://img.freejobalert.com/uploads/2019/02/Preliminary-Key-Paper-IV-AP-Police-SI-RSI-Other-Posts.pdf', sourceUrl: freshersNow,
    note: 'The available key is the board-origin preliminary key.',
  },
  {
    id: 'ap-2016-prelims-1', state: 'Andhra Pradesh', year: 2016, stage: 'Prelims', paper: 'Paper I',
    subject: 'Arithmetic & reasoning', title: 'AP SI Preliminary Written Test — Paper I', examDate: '27 Nov 2016', questions: 100, minutes: 180,
    languages: ['English'], status: 'Verified mirror', interactive: 'In review',
    paperUrl: 'https://www.careerpower.in/blog/wp-content/uploads/2025/08/13143912/AP-Police-SI-Prelims-2016-Paper-I-English.pdf',
    answerKeyUrl: freeJobAlert2016, sourceUrl: careerPower,
  },
  {
    id: 'ap-2016-prelims-2', state: 'Andhra Pradesh', year: 2016, stage: 'Prelims', paper: 'Paper II',
    subject: 'General Studies', title: 'AP SI Preliminary Written Test — Paper II', examDate: '27 Nov 2016', questions: 100, minutes: 180,
    languages: ['English'], status: 'Verified mirror', interactive: 'In review',
    paperUrl: 'https://www.careerpower.in/blog/wp-content/uploads/2025/08/13143910/AP-Police-SI-Prelims-2016-Paper-II-English.pdf',
    answerKeyUrl: freeJobAlert2016, sourceUrl: careerPower,
  },
  {
    id: 'ap-2016-final-3', state: 'Andhra Pradesh', year: 2016, stage: 'Final written', paper: 'Paper III',
    subject: 'Arithmetic & mental ability', title: 'AP SI Final Written Test — Paper III', examDate: '19 Feb 2017', questions: 200, minutes: 180,
    languages: ['English'], status: 'Verified mirror', interactive: 'In review',
    paperUrl: 'https://www.careerpower.in/blog/wp-content/uploads/2025/08/13143904/AP-Police-SI-Mains-2016-Paper-3-English.pdf',
    answerKeyUrl: freeJobAlert2016, sourceUrl: careerPower,
  },
  {
    id: 'ap-2016-final-4', state: 'Andhra Pradesh', year: 2016, stage: 'Final written', paper: 'Paper IV',
    subject: 'General Studies', title: 'AP SI Final Written Test — Paper IV', examDate: '19 Feb 2017', questions: 200, minutes: 180,
    languages: ['English'], status: 'Verified mirror', interactive: 'In review',
    paperUrl: 'https://www.careerpower.in/blog/wp-content/uploads/2025/08/13143902/AP-Police-SI-Mains-2016-Paper-4-English.pdf',
    answerKeyUrl: freeJobAlert2016, sourceUrl: careerPower,
  },
  {
    id: 'ap-2011-final-3', state: 'Andhra Pradesh', year: 2011, stage: 'Final written', paper: 'Paper III',
    subject: 'Arithmetic, reasoning & mental ability', title: 'Undivided AP SI — Paper III', questions: 200, minutes: 180,
    languages: ['Telugu'], status: 'Community scan', interactive: 'PDF only',
    paperUrl: 'https://drive.google.com/file/d/1oI-M2gdkAheLf3LMC_JSqWZ-fFC33Ung/preview',
    answerKeyUrl: 'https://img.freejobalert.com/uploads/2011/07/Answerkey-AP-Police-SI-Paper-III1.pdf',
    sourceUrl: 'https://tsstudies.blogspot.com/2022/05/ap-police-2011-si-paper-iii-arithmetic.html',
    note: 'Older undivided-Andhra Pradesh scan; verify image quality before timed use.',
  },
  {
    id: 'ap-2011-final-4-key', state: 'Andhra Pradesh', year: 2011, stage: 'Final written', paper: 'Paper IV',
    subject: 'General Studies', title: 'Undivided AP SI — Paper IV key record',
    languages: ['English', 'Telugu', 'Urdu'], status: 'Reference only', interactive: 'PDF only',
    answerKeyUrl: 'https://img.freejobalert.com/uploads/2011/07/Answerkey-AP-Police-SI-Paper-IV1.pdf',
    sourceUrl: 'https://www.schools9.info/2012/12/ap-police-si-question-paper-key-8th-9th.html',
    note: 'The final key survives, but the linked question-paper scan is no longer retrievable.',
  },
  {
    id: 'ap-2008-final-3-key', state: 'Andhra Pradesh', year: 2008, stage: 'Final written', paper: 'Paper III',
    subject: 'Arithmetic, reasoning & mental ability', title: 'AP SI Recruitment 2008(2) — Paper III key record',
    languages: ['English', 'Telugu', 'Urdu'], status: 'Reference only', interactive: 'PDF only',
    answerKeyUrl: 'https://img.freejobalert.com/uploads/2011/07/1.-SI-Rect.-2008-2-Paper-III-Final-Key.pdf',
    sourceUrl: freeJobAlert2016, note: 'Official-origin final key located; matching question booklet is not publicly retrievable.',
  },
  {
    id: 'ap-2008-final-4-key', state: 'Andhra Pradesh', year: 2008, stage: 'Final written', paper: 'Paper IV',
    subject: 'General Studies', title: 'AP SI Recruitment 2008(2) — Paper IV revised key record',
    languages: ['English', 'Telugu', 'Urdu'], status: 'Reference only', interactive: 'PDF only',
    answerKeyUrl: 'https://img.freejobalert.com/uploads/2011/07/SI-Rect-2008-2-PAPERIV-Revised-Final-Key-06-09-2011.xls',
    sourceUrl: freeJobAlert2016, note: 'Revised final key located; it supersedes the earlier Paper IV key. The question booklet is unavailable.',
  },
  {
    id: 'kerala-2024-main-tamil', state: 'Kerala', year: 2024, stage: 'Other-state', paper: 'Main · 127/24 T',
    subject: 'Mixed SI main paper', title: 'Kerala PSC SI / Armed Police SI Main — Tamil', examDate: '26 Sep 2024', questions: 100, minutes: 90,
    languages: ['English', 'Tamil'], status: 'Official', interactive: 'PDF only',
    paperUrl: 'https://www.keralapsc.gov.in/sites/default/files/2024-09/127-24T%20(A).pdf',
    answerKeyUrl: 'https://www.keralapsc.gov.in/sites/default/files/2024-10/127-24t.pdf',
    sourceUrl: 'https://www.keralapsc.gov.in/sub-inspector-police-armed-police-sub-inspector-main-examination-3',
  },
  {
    id: 'kerala-2024-main-malayalam', state: 'Kerala', year: 2024, stage: 'Other-state', paper: 'Main · 127/24 M',
    subject: 'Mixed SI main paper', title: 'Kerala PSC SI / Armed Police SI Main — Malayalam', examDate: '26 Sep 2024', questions: 100, minutes: 90,
    languages: ['English', 'Malayalam'], status: 'Official', interactive: 'PDF only',
    paperUrl: 'https://www.keralapsc.gov.in/sites/default/files/2024-09/127-24M%20(A).pdf',
    answerKeyUrl: 'https://keralapsc.gov.in/sites/default/files/2024-10/127-24M.pdf',
    sourceUrl: 'https://keralapsc.gov.in/sub-inspector-police-armed-police-sub-inspector-main-examination-2',
  },
  {
    id: 'kerala-2023-main', state: 'Kerala', year: 2023, stage: 'Other-state', paper: 'Main · 158/2023',
    subject: 'Mixed SI main paper', title: 'Kerala PSC Sub Inspector Main', examDate: '23 Aug 2023', questions: 100, minutes: 90,
    languages: ['English', 'Tamil'], status: 'Official', interactive: 'PDF only',
    paperUrl: 'https://www.keralapsc.gov.in/sites/default/files/2023-08/qp__si__main__tamil.pdf',
    answerKeyUrl: 'https://www.keralapsc.gov.in/sites/default/files/2023-10/158_2023_t_slsx.pdf',
    sourceUrl: 'https://www.keralapsc.gov.in/ml/node/40957',
  },
  {
    id: 'kerala-2023-prelim', state: 'Kerala', year: 2023, stage: 'Other-state', paper: 'Common prelim · 047/23 M',
    subject: 'Degree-level common prelim', title: 'Kerala PSC Common Preliminary — SI eligibility stream', examDate: '27 May 2023', questions: 100,
    languages: ['English', 'Malayalam'], status: 'Official', interactive: 'PDF only',
    paperUrl: 'https://www.keralapsc.gov.in/sites/default/files/2023-05/047_23_m__set_a_.pdf',
    answerKeyUrl: 'https://www.keralapsc.gov.in/sites/default/files/2023-05/cpe_degree__stage_iii__malayalam.pdf',
    sourceUrl: 'https://www.keralapsc.gov.in/field-officer-kfdc-ltd-assistant-universities-sub-inspector-police-trainee-police-common-1',
  },
  ...[
    ['rj-2021-13', 2021, '13 Sep 2021', 'E041A852-8D25-4EEE-8705-39BA1C33763A', '9BD19D66-E8DC-4901-9FE6-50D60C026D1D'],
    ['rj-2021-14', 2021, '14 Sep 2021', '2E5977F1-8A46-45B2-AC19-D3F0EE3F6F0D', 'B4800BF9-B70F-487F-983D-19CE650B4667'],
    ['rj-2021-15', 2021, '15 Sep 2021', 'FFF8AC1B-5450-4426-88E4-A1BA7584D897', 'ACD2FF22-9C93-4909-91B5-1F2659DAF7D4'],
    ['rj-2016', 2016, '07 Oct 2018', '32866B9A-8DCF-4CC4-A85F-1C5FFDA6C816', '8E0A71BF-43D0-4E8A-B1D5-BBEE2C66DE4D'],
  ].map(([id, year, examDate, paperId, keyId]): PreviousPaper => ({
    id: String(id), state: 'Rajasthan', year: Number(year), stage: 'Other-state', paper: 'Paper II',
    subject: 'General Knowledge & General Science', title: `RPSC Sub Inspector Combined Competitive — ${examDate}`,
    examDate: String(examDate), questions: 100, languages: ['Hindi'], status: 'Official', interactive: 'PDF only',
    paperUrl: `https://rpsc.rajasthan.gov.in/Static/PreviousQuestionPaper/${paperId}.pdf`,
    answerKeyUrl: `https://rpsc.rajasthan.gov.in/Static/AnswerKeys/${keyId}.pdf`,
    sourceUrl: 'https://rpsc.rajasthan.gov.in/previousquestionpapers.aspx',
  })),
]

export const apPapers = previousPapers.filter(paper => paper.state === 'Andhra Pradesh')
export const otherStatePapers = previousPapers.filter(paper => paper.state !== 'Andhra Pradesh')
