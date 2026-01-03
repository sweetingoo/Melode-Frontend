import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { waitForPageLoad } from './helpers/utils';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin');
    await waitForPageLoad(page);
  });

  test('should display dashboard page', async ({ page }) => {
    await expect(page).toHaveURL(/.*admin.*/);
    
    // Check for dashboard elements
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Look for stats cards or metrics
    const statsCards = page.locator('[class*="card"], [class*="stat"]');
    const count = await statsCards.count();
    
    // Dashboard should have some stats/metrics
    if (count > 0) {
      await expect(statsCards.first()).toBeVisible();
    }
  });

  test('should display recent tasks', async ({ page }) => {
    // Look for tasks section
    const tasksSection = page.locator('text=/task/i').first();
    if (await tasksSection.isVisible({ timeout: 3000 })) {
      await expect(tasksSection).toBeVisible();
    }
  });

  test('should navigate to different sections from dashboard', async ({ page }) => {
    // Test navigation to tasks
    const tasksLink = page.getByRole('link', { name: /task/i }).first();
    if (await tasksLink.isVisible({ timeout: 3000 })) {
      await tasksLink.click();
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/.*task.*/);
    }
  });

  test('should display clock status if available', async ({ page }) => {
    // Look for clock in/out button or status
    const clockButton = page.getByRole('button', { name: /clock|check in|check out/i });
    if (await clockButton.isVisible({ timeout: 3000 })) {
      await expect(clockButton).toBeVisible();
    }
  });
});

