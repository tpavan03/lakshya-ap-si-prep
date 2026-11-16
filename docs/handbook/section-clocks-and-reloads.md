# Understand section clocks and reload recovery

A timed simulation uses its saved start and section deadlines. Reloading a page does not grant a fresh time allowance. In a section-timed test, only the current allowed question IDs can be answered or navigated to; a visible future section label is not permission to enter it early.

Use the runner's displayed time remaining and section indicators. An inactive browser tab may delay visual updates, but that does not make elapsed wall-clock time disappear. When the clock has finished, the runner submits the current answer state.

Save and resume are recovery features, not a pause button for the simulated exam clock. If you want an interrupted, less formal session, choose a suitable custom practice setup before starting. Test configuration and recorded timestamps explain a restored attempt more reliably than the browser's last displayed counter.

## Implementation references

- [src/components/TestRunner.tsx](../../src/components/TestRunner.tsx)
- [src/lib/examEngine.ts](../../src/lib/examEngine.ts)
