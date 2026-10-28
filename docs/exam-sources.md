# Exam evidence and content provenance

Checked on 28 October 2026. The app is an independent preparation product. Its simulations use the pattern below, while published amendments and instructions for a candidate’s actual examination remain authoritative.

## NICL AO: verified 2026–27 advertisement

Primary document: [NICL Recruitment of 321 Administrative Officers (Scale I), 2026–27](https://nationalinsurance.nic.co.in/sites/default/files/2026-10/NICL%20AO%20Recruitment%20Advertisment%202026-27_0.pdf). The PDF was retrieved directly from the NICL host and its examination-scheme text inspected locally. The official recruitment page is [NICL Recruitment](https://nationalinsurance.nic.co.in/recruitment).

| Stage / stream | Objective structure | Section times | Objective total |
|---|---|---|---|
| Prelims, both streams | English 30; Reasoning 35; Quantitative Aptitude 35 | 20 / 20 / 20 minutes | 100 questions, 100 marks, 60 minutes |
| Mains, Generalist | Reasoning 50; General Awareness 50; Quantitative Aptitude 50; English 50; Computer Knowledge 50 | 40 / 30 / 40 / 40 / 30 minutes | 250 questions, 250 marks, 180 minutes |
| Mains, IT Specialist | Reasoning 40; General Awareness 40; Quantitative Aptitude 40; English 40; Computer Knowledge 40; IT Professional Knowledge 50 | 35 / 20 / 35 / 30 / 25 / 35 minutes | 250 questions, 250 marks, 180 minutes |

The advertisement identifies these section lists as not necessarily the delivery sequence. The app uses a disclosed fixed practice sequence. Each section is separately timed. For both objective stages, an incorrect answer loses one-quarter of the assigned mark; a blank answer has no penalty.

Mains also has a 30-minute, 30-mark descriptive English paper: essay 10, précis 10 and comprehension 10. It is qualifying and follows the objective paper in the official examination. App practice and self-review do not claim official descriptive scoring. Section and overall qualifying cutoffs are determined by NICL, not fabricated from a user’s local attempt history.

The Generalist and IT streams share common practice subjects but have distinct Mains blueprints. The app does not treat IT Professional Knowledge as an extra Generalist section, or substitute elementary Computer Knowledge for specialist preparation.

## NICL authored bank

`src/questions/nicl.ts` contains 627 unique, editorially authored practice items:

| Subject | Questions |
|---|---:|
| Quantitative aptitude (`Arithmetic`) | 192 |
| Reasoning | 120 |
| English | 92 |
| General Awareness | 66 |
| Computer Knowledge | 71 |
| IT Professional Knowledge | 86 |

Quantitative items include twelve complete DI data sets, two-step replacement, rates, interest, partnership and probability. Reasoning includes complete seating and scheduling scenarios plus inequalities, syllogisms, critical reasoning and data sufficiency. English includes five original reading passages, four five-blank cloze passages, editing, connectors and sentence arrangement. IT covers algorithms, data structures, DBMS/SQL, transaction anomalies, operating systems, subnet calculations, protocols, security, programming and service reliability.

Every question repeats any required source scenario in its own stem so that independent selection remains solvable. Parameterised arithmetic families provide numerical variants; they are not described as separately verified historical exam questions. Difficulty labels and solve-time targets are editorial training settings, not NICL-certified measurements. The full-bank validator checks IDs, stems, option integrity and minimum section capacity; independent numerical tests cover percentage-growth denominators, replacement and probability models.

All these questions are labelled **Original NICL AO practice**. They are not original NICL PYQs and are never presented as extracted official questions. Publisher-hosted memory-based papers belong in the separately labelled archive with their source attribution. They are not silently transcribed into the authored bank.

General Awareness is a static conceptual foundation, not a claim of complete current-affairs coverage. No unverified current officeholder, policy rate, recruitment date or recent event was generated to increase the count. The learning chapter explains how to maintain a dated official-source current-affairs notebook.

## Learning references

- [IRDAI policyholder handbooks](https://old.irdai.gov.in/ADMINCMS/cms/frmGeneral_NoYearList.aspx?DF=HBKENG&mid=14.7.1): background concepts and product terminology. Historical handbook rules must not be used as a substitute for amended current regulations.
- [IRDAI-hosted policy wording example](https://old.irdai.gov.in/ADMINCMS/cms/Uploadedfiles/NLP1516/32.pdf): examples of deductible and subrogation clauses. Individual policy terms vary; arithmetic scenarios state their own assumptions.
- [RBI financial education](https://www.rbi.org.in/FinancialEducation/Home.aspx) and [RBI centralised payment systems FAQ](https://www.rbi.org.in/scripts/faqview.aspx/upload/FAQView.aspx?Id=144): banking and payment-system foundations.
- [DICGC FAQs](https://www.dicgc.org.in/FAQs): eligible deposit aggregation and the ₹5 lakh cover limit, including principal and interest, in the same right and capacity at an insured bank.
- [NCERT textbooks](https://ncert.nic.in/textbook.php), [SATHEE](https://sathee.iitk.ac.in/) and [British Council LearnEnglish](https://learnenglish.britishcouncil.org/): mathematics, reasoning and English learning references.
- [PostgreSQL documentation](https://www.postgresql.org/docs/current/), [Python tutorial](https://docs.python.org/3/tutorial/), [IETF RFC Editor](https://www.rfc-editor.org/) and [OWASP Top 10](https://owasp.org/www-project-top-ten/): maintained technical references for the IT track. These are references, not sources of copied examination questions.

The seven authored NICL theory chapters are exported from `src/niclTheory.ts`, each with concepts, formulae or rules, worked examples, common traps, revision points and sources.

## AP SI evidence boundary

AP SI follows its own board notification and paper archive. Existing AP practice remains editorial and separate from scanned historical papers. A scan, an answer key, an interactive transcript and an original authored question are different artifacts; the interface must preserve their respective provenance. Older booklet order and final-versus-preliminary key status must be checked before claiming machine-scored historical accuracy.
