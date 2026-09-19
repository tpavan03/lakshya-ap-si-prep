import { test, expect } from '@playwright/test'

test('signed-out visitors enter through the account screen', async ({ page }) => {
  await page.goto('https://lakshya-ap-si-prep.vercel.app')
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Continue your mission.' })).toBeVisible()
  await expect(page.getByText('Your study history is stored under your own account.')).toBeVisible()
})
