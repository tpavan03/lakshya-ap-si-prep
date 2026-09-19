import { useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpenCheck, Check, Clock3, ExternalLink, FileKey2, FileText, Filter, RotateCcw, Search, ShieldCheck } from 'lucide-react'
import { previousPapers, type PaperStage, type PaperStatus } from '../pyq'
import { ap2018PrelimsPaper1SetC } from '../paperKeys'

export type PaperAttemptProgress = { answers: Record<string, number>; current: number; submitted?: boolean }
type PaperProgressMap = Record<string, PaperAttemptProgress>

const statusClass: Record<PaperStatus, string> = {
  Official: 'official',
  'Verified mirror': 'mirror',
  'Community scan': 'community',
  'Reference only': 'reference',
}

const stageOptions: Array<'All' | PaperStage> = ['All', 'Prelims', 'Final written', 'Other-state']

export function PaperArchive({ progress, onProgress }: { progress: PaperProgressMap; onProgress: (paperId: string, value: PaperAttemptProgress) => void }) {
  const [scope, setScope] = useState<'Andhra Pradesh' | 'Other states'>('Andhra Pradesh')
  const [stage, setStage] = useState<'All' | PaperStage>('All')
  const [year, setYear] = useState<'All' | number>('All')
  const [query, setQuery] = useState('')
  const [activePaperId, setActivePaperId] = useState<string | null>(null)
  const openPaper = (paperId: string) => {
    setActivePaperId(paperId)
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }))
  }
  const closePaper = () => {
    setActivePaperId(null)
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }))
  }

  const scoped = previousPapers.filter(paper => scope === 'Andhra Pradesh' ? paper.state === 'Andhra Pradesh' : paper.state !== 'Andhra Pradesh')
  const years = [...new Set(scoped.map(paper => paper.year))].sort((a, b) => b - a)
  const filtered = scoped.filter(paper => {
    const text = `${paper.title} ${paper.subject} ${paper.paper} ${paper.year} ${paper.languages.join(' ')}`.toLowerCase()
    return (stage === 'All' || paper.stage === stage)
      && (year === 'All' || paper.year === year)
      && (!query.trim() || text.includes(query.trim().toLowerCase()))
  })

  const apPapers = previousPapers.filter(paper => paper.state === 'Andhra Pradesh')
  const apObjectiveQuestions = apPapers.reduce((sum, paper) => sum + (paper.questions ?? 0), 0)
  const pairedKeys = apPapers.filter(paper => paper.answerKeyUrl).length

  if (activePaperId === 'ap-2018-prelims-1') {
    const paper = previousPapers.find(item => item.id === activePaperId)!
    return <PaperCompanion paper={paper} answers={ap2018PrelimsPaper1SetC} progress={progress[activePaperId] ?? { answers: {}, current: 0 }} onChange={value => onProgress(activePaperId, value)} onClose={closePaper}/>
  }

  return <>
    <div className="page-head pyq-page-head">
      <div>
        <span className="eyebrow">Previous question papers</span>
        <h1>Read the paper that was actually asked.</h1>
        <p>Prelims and final-written papers are indexed separately, with direct question-paper and answer-key links. Every source shows whether it is board-hosted, a verified mirror or a community scan.</p>
      </div>
      <a className="secondary-button" href="https://www.careerpower.in/ap-police-si-previous-year-question-papers.html" target="_blank" rel="noreferrer"><FileText size={17}/> Source index</a>
    </div>

    <section className="pyq-summary" aria-label="PYQ library summary">
      <div><strong>{apPapers.length}</strong><span>AP archive records</span><small>Papers + surviving key records</small></div>
      <div><strong>{apObjectiveQuestions.toLocaleString('en-IN')}</strong><span>questions represented</span><small>Before booklet duplicates</small></div>
      <div><strong>{pairedKeys}</strong><span>key links located</span><small>Final or preliminary keys</small></div>
      <div><strong>{previousPapers.length - apPapers.length}</strong><span>official cross-state papers</span><small>Extra topic practice</small></div>
    </section>

    <section className="archive-callout">
      <div><ShieldCheck size={22}/><div><strong>Transparent coverage</strong><p>AP SI recruitment was not held every year and no complete official 25-year archive is currently public. The library counts distinct papers, while Set A/B/C/D booklet reorderings remain variants.</p></div></div>
      <span>Checked sources · Sep 2026</span>
    </section>

    <div className="pyq-controls">
      <div className="scope-tabs" role="tablist" aria-label="Paper source">
        <button className={scope === 'Andhra Pradesh' ? 'active' : ''} onClick={() => { setScope('Andhra Pradesh'); setStage('All'); setYear('All') }}>Andhra Pradesh</button>
        <button className={scope === 'Other states' ? 'active' : ''} onClick={() => { setScope('Other states'); setStage('All'); setYear('All') }}>Other-state SI</button>
      </div>
      <div className="pyq-filter-row">
        <label className="search-box"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search year, paper or subject"/></label>
        <label className="archive-select"><Filter size={15}/><span>Stage</span><select value={stage} onChange={event => setStage(event.target.value as 'All' | PaperStage)}>{stageOptions.filter(option => scope === 'Other states' ? option === 'All' || option === 'Other-state' : option !== 'Other-state').map(option => <option key={option}>{option}</option>)}</select></label>
        <label className="archive-select"><span>Year</span><select value={year} onChange={event => setYear(event.target.value === 'All' ? 'All' : Number(event.target.value))}><option>All</option>{years.map(item => <option key={item}>{item}</option>)}</select></label>
      </div>
    </div>

    <div className="catalog-heading"><div><span className="eyebrow">{scope}</span><h2>{scope === 'Andhra Pradesh' ? 'AP SI paper catalogue' : 'Official papers for extra practice'}</h2></div><span>{filtered.length} paper{filtered.length === 1 ? '' : 's'} shown</span></div>

    <div className="pyq-catalog">
      {filtered.map(paper => <article className="pyq-card" key={paper.id}>
        <div className="paper-card-top">
          <span className="paper-year">{paper.year}</span>
          <div className="paper-badges"><em className={`provenance-badge ${statusClass[paper.status]}`}>{paper.status === 'Official' && <Check size={11}/>} {paper.status}</em><em className={`reader-badge ${paper.interactive === 'In review' ? 'review' : ''}`}>{paper.interactive === 'In review' ? 'Reader in review' : paper.interactive}</em></div>
        </div>
        <span className="paper-kicker">{paper.stage} · {paper.paper}</span>
        <h3>{paper.title}</h3>
        <p className="paper-subject">{paper.subject}</p>
        <div className="paper-facts">
          {paper.questions && <span><FileText size={14}/>{paper.questions} questions</span>}
          {paper.minutes && <span><Clock3 size={14}/>{paper.minutes} minutes</span>}
          <span>{paper.languages.join(' + ')}</span>
          {paper.examDate && <span>{paper.examDate}</span>}
        </div>
        {paper.note && <p className="paper-note">{paper.note}</p>}
        <div className="paper-actions">
          {paper.paperUrl && <a className="primary-button compact" href={paper.paperUrl} target="_blank" rel="noreferrer"><FileText size={15}/> Open paper</a>}
          {paper.interactive === 'Ready' && <button className="secondary-button compact" onClick={() => openPaper(paper.id)}><BookOpenCheck size={15}/> Attempt paper</button>}
          {paper.answerKeyUrl && <a className="secondary-button compact" href={paper.answerKeyUrl} target="_blank" rel="noreferrer"><FileKey2 size={15}/> Answer key</a>}
          {paper.sourceUrl && <a className="paper-source-link" href={paper.sourceUrl} target="_blank" rel="noreferrer">Source <ExternalLink size={13}/></a>}
        </div>
        {paper.interactive === 'In review' && <div className="reader-progress"><BookOpenCheck size={16}/><span><strong>Interactive reader being verified</strong> Question order, options and booklet-specific key must match before release.</span></div>}
      </article>)}
      {!filtered.length && <div className="empty-state compact-empty"><FileText size={28}/><h2>No matching papers</h2><p>Clear the filters or search for another year or subject.</p></div>}
    </div>

    <div className="citation-guide"><span>PROVENANCE LEGEND</span><div><em className="official">Official</em> Government-hosted paper</div><div><em className="mirror">Verified mirror</em> Paper identity checked</div><div><em className="community">Community scan</em> Use with caution</div></div>
  </>
}

function PaperCompanion({ paper, answers: answerKey, progress, onChange, onClose }: {
  paper: (typeof previousPapers)[number]
  answers: readonly number[]
  progress: PaperAttemptProgress
  onChange: (value: PaperAttemptProgress) => void
  onClose: () => void
}) {
  const current = Math.min(answerKey.length - 1, Math.max(0, progress.current ?? 0))
  const selected = progress.answers[String(current)]
  const answered = Object.keys(progress.answers).length
  const score = answerKey.reduce((sum, answer, index) => sum + (progress.answers[String(index)] === answer ? 1 : 0), 0)
  const update = (patch: Partial<PaperAttemptProgress>) => onChange({ ...progress, ...patch })
  const choose = (option: number) => { if (!progress.submitted) update({ answers: { ...progress.answers, [String(current)]: option } }) }
  const move = (next: number) => update({ current: Math.min(answerKey.length - 1, Math.max(0, next)) })
  const reset = () => onChange({ answers: {}, current: 0, submitted: false })

  return <section className="paper-reader-shell">
    <header className="paper-reader-head">
      <div><button className="reader-back" onClick={onClose}><ArrowLeft size={16}/> Paper library</button><span className="eyebrow">Interactive paper companion</span><h1>{paper.title}</h1><p>{paper.paper} · Booklet {paper.booklet} · {paper.examDate}</p></div>
      <div className="reader-score"><strong>{progress.submitted ? `${score}/100` : `${answered}/100`}</strong><span>{progress.submitted ? 'score' : 'answered'}</span></div>
    </header>
    <div className="paper-reader-notice"><ShieldCheck size={17}/><p>The paper scan is shown exactly as archived. Record answers here, then submit to compare against the APSLPRB key for Booklet C.</p><a href={paper.paperUrl} target="_blank" rel="noreferrer">Download PDF <ExternalLink size={13}/></a></div>
    <div className="paper-reader-layout">
      <div className="paper-frame-wrap">
        <iframe src={paper.readerUrl} title={`${paper.title} PDF`}/>
        <p>If the preview does not load, <a href={paper.paperUrl} target="_blank" rel="noreferrer">open the paper in a new tab</a>.</p>
      </div>
      <aside className="answer-sheet">
        <div className="answer-sheet-head"><div><span>BOOKLET {paper.booklet}</span><strong>Question {current + 1}</strong></div><small>{answered} answered</small></div>
        <div className="answer-palette">{answerKey.map((answer, index) => <button key={index} onClick={() => move(index)} className={`${index === current ? 'active' : ''} ${progress.answers[String(index)] !== undefined ? 'answered' : ''} ${progress.submitted && progress.answers[String(index)] === answer ? 'correct' : ''} ${progress.submitted && progress.answers[String(index)] !== undefined && progress.answers[String(index)] !== answer ? 'wrong' : ''}`}>{index + 1}</button>)}</div>
        <div className="answer-choice"><span>Choose your answer</span><div>{['A','B','C','D'].map((label, index) => <button key={label} onClick={() => choose(index)} disabled={progress.submitted} className={`${selected === index ? 'selected' : ''} ${progress.submitted && answerKey[current] === index ? 'correct' : ''} ${progress.submitted && selected === index && selected !== answerKey[current] ? 'wrong' : ''}`}><strong>{label}</strong><small>Option {index + 1}</small></button>)}</div></div>
        {progress.submitted && <div className="official-answer"><Check size={18}/><div><strong>Official answer: {String.fromCharCode(65 + answerKey[current])}</strong><p>Mapped from the APSLPRB Paper I key for Set C. A detailed worked solution is added only after editorial verification.</p><a href={paper.answerKeyUrl} target="_blank" rel="noreferrer">Open official-origin key <ExternalLink size={12}/></a></div></div>}
        <div className="reader-nav"><button disabled={current === 0} onClick={() => move(current - 1)}><ArrowLeft size={14}/> Previous</button><button disabled={current === answerKey.length - 1} onClick={() => move(current + 1)}>Next <ArrowRight size={14}/></button></div>
        {!progress.submitted ? <button className="submit-paper" onClick={() => update({ submitted: true })} disabled={!answered}>Submit & review <ArrowRight size={15}/></button> : <button className="retry-paper" onClick={reset}><RotateCcw size={14}/> Clear attempt</button>}
      </aside>
    </div>
  </section>
}
