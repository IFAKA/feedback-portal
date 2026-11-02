import { expect, test } from '@playwright/test';

test('creates a feedback session and opens host room', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Project name').fill('Navigation polish');
  await page.getByLabel('Target URL').fill('https://example.com');
  await page.getByLabel('Tester name').fill('Alex Chen');
  await page.getByRole('button', { name: 'Start live review' }).click();
  await expect(page).toHaveURL(/\/host\?sessionId=ses_/);
  await expect(page.getByText('Navigation polish')).toBeVisible();
  await expect(page.getByText(/Room ID:/)).toBeVisible();
});
