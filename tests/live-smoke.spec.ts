import { test, expect } from '@playwright/test'

test('live auth panel and 100-question mock are available', async ({ page }) => {
  await page.goto('https://lakshya-ap-si-prep.vercel.app')
  await page.getByRole('button', { name: /Aspirant/ }).click()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  await page.locator('.profile-panel .icon-button').click()

  await page.getByRole('button', { name: 'Mock series' }).click()
  await page.getByRole('button', { name: 'Full paper', exact: true }).click()
  await page.getByRole('button', { name: 'Start test' }).first().click()
  await expect(page.getByText('Question 1 of 100')).toBeVisible()
  await expect(page.locator('.palette button')).toHaveCount(100)
})
