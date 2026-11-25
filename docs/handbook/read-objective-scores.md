# Read objective scores and unanswered questions

The runner displays the configured marks for correct and wrong answers before you complete a paper. Those values belong to that quiz blueprint. Do not apply another exam's negative-marking assumption simply because both use multiple-choice questions.

The scoring engine records question reviews and section-level results alongside the attempt. Unanswered questions are distinct from wrong responses. A review flag does not itself change the mark calculation. Inspect the submitted review to understand which recorded answers contributed to the score.

Application scores describe a practice attempt, not an official result, selection probability or fabricated rank. When investigating an unexpected total, check the paper identity, configured marking values and answer sheet first. A manual paper without a matched key follows a different review path and must not be compared as though an official answer key had been verified.

## Implementation references

- [src/lib/examEngine.ts](../../src/lib/examEngine.ts)
- [src/components/TestRunner.tsx](../../src/components/TestRunner.tsx)
