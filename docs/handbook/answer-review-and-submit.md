# Use answer clearing, review flags and submission

Selecting an option records an answer for the current allowed question. Clearing the answer removes that selection; marking a question for review is a separate action. A review flag is a reminder, not a second answer or a guarantee that the question will remain accessible after its timed section ends.

Before submitting, compare answered and unanswered counts with the question navigation. Avoid assuming that simply visiting a question records a response. The runner protects submission against duplicate completion callbacks.

**Save & exit** first attempts to store the active sheet. If storage fails, the runner displays an error and keeps the test open instead of pretending that recovery is safe. Follow that message and submit or protect your data before clearing browser storage. Closing the tab without a successful save is not a reliable backup method.

## Implementation references

- [src/components/TestRunner.tsx](../../src/components/TestRunner.tsx)
