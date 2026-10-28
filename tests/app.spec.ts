import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function enter(page: Page, path = "") {
  await page.goto(`/${path}`);
  const guest = page.getByRole("button", { name: "Explore on this device" });
  await expect(
    page
      .getByRole("heading", { name: "Welcome to your study desk." })
      .or(page.getByRole("button", { name: "Open profile settings" })),
  ).toBeVisible();
  if (await guest.isVisible()) await guest.click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
}
async function nav(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name, exact: true })
    .click();
}

test("custom practice records marks, review, mistakes and separate exam progress", async ({
  page,
}) => {
  await enter(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  const originalOverflow = await page.evaluate(
    () => document.body.style.overflow,
  );
  await nav(page, "Custom practice");
  await page.getByLabel("Questions", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Start custom test" }).click();
  const runner = page.getByRole("dialog").first();
  await expect(runner.getByText("QUESTION 1", { exact: false })).toBeVisible();
  await runner
    .getByRole("group", { name: "Answer options" })
    .getByRole("button")
    .first()
    .click();
  await runner.getByRole("button", { name: "Save & next" }).click();
  await runner
    .getByRole("group", { name: "Answer options" })
    .getByRole("button")
    .last()
    .click();
  await runner
    .getByRole("button", { name: "Submit test", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(2);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    "hidden",
  );
  await page.getByRole("button", { name: "Submit & view results" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe(originalOverflow);
  await expect(page.getByText("NET MARKS", { exact: true })).toBeVisible();
  await expect(page.getByText("Worked solution", { exact: true })).toHaveCount(
    2,
  );
  await page.locator(".review-card").last().scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("apsi-command:v1")!),
  );
  expect(saved.exams["ap-si"].attempts).toHaveLength(1);
  expect(saved.exams["ap-si"].attempts[0].total).toBe(2);
  expect(saved.exams["nicl-ao"].attempts).toHaveLength(0);
  await page
    .getByRole("button", { name: "NICL AO National Insurance" })
    .click();
  await nav(page, "Performance");
  await expect(
    page.getByText("Your progress starts with one test."),
  ).toBeVisible();
});

test("Google sign-in stays on the app when cloud health is unavailable and guest access works", async ({
  page,
}) => {
  let healthRequests = 0;
  await page.route("**/auth/v1/health", async (route) => {
    healthRequests++;
    await route.abort("failed");
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Welcome to your study desk." }),
  ).toBeVisible();
  const appUrl = page.url();
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Cloud sign-in is unavailable. Explore on this device and try again later.",
  );
  expect(healthRequests).toBe(1);
  expect(page.url()).toBe(appUrl);
  await page.getByRole("button", { name: "Explore on this device" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Open profile settings" }),
  ).toBeVisible();
});

test("NICL IT full mains has six exact sections and locks future answers across reload", async ({
  page,
}) => {
  await enter(page, "?exam=nicl-ao&view=tests&stage=mains&stream=it");
  await expect(
    page.getByText("IT professional knowledge", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("250 questions", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Start test 01", exact: true })
    .click();
  await page.getByRole("button", { name: "Start test", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Question 41", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Question 1", exact: true }),
  ).toBeEnabled();
  await expect(page.getByRole("button", { name: "Show hint" })).toHaveCount(0);
  await page.getByRole("button", { name: "Save & exit" }).click();
  await page.reload();
  const guest = page.getByRole("button", { name: "Explore on this device" });
  await expect(
    page
      .getByRole("heading", { name: "Welcome to your study desk." })
      .or(page.getByRole("button", { name: "Open profile settings" })),
  ).toBeVisible();
  if (await guest.isVisible()) await guest.click();
  await page.getByRole("button", { name: "Resume test" }).click();
  await expect(
    page.getByRole("button", { name: "Question 41", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("timer")).toContainText("34:");
});

test("legacy AP records migrate and remain isolated from NICL", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "apsi-command:v1",
      JSON.stringify({
        version: 2,
        profile: { name: "Legacy candidate" },
        attempts: [
          {
            id: "old",
            title: "Old AP set",
            date: "2026-10-20T10:00:00Z",
            score: 7,
            total: 10,
            seconds: 600,
            subjects: { Arithmetic: { correct: 7, total: 10 } },
          },
        ],
        saved: ["a01"],
      }),
    );
  });
  await enter(page);
  await nav(page, "Performance");
  await expect(page.getByText("Old AP set", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "NICL AO National Insurance" })
    .click();
  await nav(page, "Performance");
  await expect(
    page.getByText("Your progress starts with one test."),
  ).toBeVisible();
});

test("paper provenance, no-results, accessible controls and desktop layout", async ({
  page,
}) => {
  await enter(page, "?exam=nicl-ao&view=papers");
  await expect(
    page.getByText("Memory-based", { exact: true }).first(),
  ).toBeVisible();
  const search = page.getByRole("textbox", { name: /search/i });
  await search.fill("zz-no-paper");
  await expect(page.getByText(/No matching papers/i).first()).toBeVisible();
  await page.getByRole("button", { name: "Clear paper search" }).click();
  await expect(search).toHaveValue("");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("narrow screens retain navigation, writing drafts and keyboard dialog behavior", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?exam=nicl-ao&view=tests&stage=mains");
  const guest = page.getByRole("button", { name: "Explore on this device" });
  await expect(
    page
      .getByRole("heading", { name: "Welcome to your study desk." })
      .or(page.getByRole("button", { name: "Open profile settings" })),
  ).toBeVisible();
  if (await guest.isVisible()) await guest.click();
  await page.getByRole("button", { name: "English writing" }).click();
  await page.getByRole("button", { name: "Start 30-minute practice" }).click();
  await page
    .getByLabel("Your response")
    .fill("Insurance should be accessible, accountable and clear.");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "English writing" }).click();
  await expect(page.getByLabel("Your response")).toHaveValue(
    "Insurance should be accessible, accountable and clear.",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("dialog", { name: "Navigation" })
    .getByRole("button", { name: "Custom practice", exact: true })
    .click();
  await expect(page.getByText("Build the test you need.")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-practice.png",
    fullPage: true,
  });
});

test("expired persisted attempts auto-submit exactly once", async ({
  page,
}) => {
  await enter(page);
  await nav(page, "Custom practice");
  await page.getByLabel("Questions", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Start custom test" }).click();
  await page.getByRole("button", { name: "Save & exit" }).click();
  await page.evaluate(() => {
    const key = "exam-prep-king:active-quiz:v1",
      q = JSON.parse(localStorage.getItem(key)!);
    q.startedAt = Date.now() - q.minutes * 60000 - 2000;
    q.expiresAt = Date.now() - 2000;
    localStorage.setItem(key, JSON.stringify(q));
  });
  await page.getByRole("button", { name: "Resume test" }).click();
  await expect(page.getByText("NET MARKS", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("apsi-command:v1")!).exams["ap-si"]
          .attempts.length,
    ),
  ).toBe(1);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("exam-prep-king:active-quiz:v1"),
    ),
  ).toBeNull();
});

test("desktop dashboard has no serious accessibility violations", async ({
  page,
}) => {
  await enter(page);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.screenshot({
    path: "test-results/desktop-dashboard.png",
    fullPage: true,
  });
});

test("the full test series is discoverable and test 30 can be opened, completed and retaken", async ({
  page,
}) => {
  await enter(page, "?exam=nicl-ao&view=tests&stage=prelims");
  await expect(
    page.getByRole("heading", { name: "30 full-length tests", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Test edition" }),
  ).toHaveCount(0);
  await expect(page.locator(".series-test-card")).toHaveCount(6);
  const pages = page.getByRole("navigation", { name: "Test series pages" });
  await pages
    .getByRole("button", { name: "Tests 25 to 30", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Prelims mock test 30", exact: true }),
  ).toBeVisible();
  await expect(
    pages.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await expect(page).toHaveURL(/testPage=5/);
  await page.reload();
  const guest = page.getByRole("button", { name: "Explore on this device" });
  await expect(guest).toBeVisible();
  await guest.click();
  await page
    .getByRole("button", { name: "Start test 30", exact: true })
    .click();
  await page.getByRole("button", { name: "Start test", exact: true }).click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("exam-prep-king:active-quiz:v1")!).seed,
    ),
  ).toBe(30);
  await page.getByRole("button", { name: "Submit test", exact: true }).click();
  await page
    .getByRole("button", { name: "Submit & view results", exact: true })
    .click();
  await expect(page.getByText("NET MARKS", { exact: true })).toBeVisible();
  await nav(page, "Test series");
  await expect(
    page.getByRole("button", { name: "Retake test 30", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Last score: 0 / 100", { exact: true }),
  ).toBeVisible();
});

test("archive filters stay aligned on phone and desktop and the 2017 paper uses a composite timer", async ({
  page,
}) => {
  await enter(page, "?exam=nicl-ao&view=papers");
  await expect(page.locator(".paper-library-card")).toHaveCount(3);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page
        .locator(".paper-filter-grid .search-box")
        .evaluate((node) => getComputedStyle(node).flexDirection),
    ).toBe("row");
    for (const name of ["Stage", "Year"]) {
      const fits = await page
        .getByRole("combobox", { name, exact: true })
        .evaluate((node) => {
          const field = node.closest("label")!.getBoundingClientRect(),
            control = node.getBoundingClientRect();
          return (
            control.bottom <= field.bottom + 1 &&
            control.right <= field.right + 1
          );
        });
      expect(fits).toBe(true);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(
    await page
      .locator(".paper-library-note p")
      .evaluate((node) => node.getBoundingClientRect().width),
  ).toBeGreaterThan(230);
  await page
    .getByRole("combobox", { name: "Year", exact: true })
    .selectOption("2017");
  await expect(page.locator(".paper-library-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Attempt paper", exact: true })
    .click();
  await expect(page.getByText(/One composite timer/)).toBeVisible();
  await expect(
    page.getByText(/no automatic score is calculated/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Start timed attempt", exact: false })
    .click();
  await expect(
    page.getByRole("button", { name: "Question 100", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Question 100", exact: true }).click();
  await page.getByRole("button", { name: "E Option 5", exact: true }).click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("apsi-command:v1")!).exams["nicl-ao"]
          .pyqProgress["nicl-2017-prelims"].answers["99"],
    ),
  ).toBe(4);
});

test("test series works with keyboard paging and has no accessibility violations on mobile", async ({
  page,
}) => {
  await enter(page, "?exam=nicl-ao&view=tests&stage=prelims");
  const secondPage = page.getByRole("button", {
    name: "Tests 7 to 12",
    exact: true,
  });
  await secondPage.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Start test 07", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
