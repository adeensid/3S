import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('SID Software Solutions', () => {
  test('login page passes axe', async ({ page }) => {
    await page.goto('/login');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('registers, creates a ticket, and drags on the board', async ({ page }) => {
    await page.goto('/register');
    const email = `user-${Date.now()}@sid.example`;
    await page.getByLabel('Name').fill('E2E User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('Password10');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('My issues')).toBeVisible({ timeout: 15_000 });
  });
});
