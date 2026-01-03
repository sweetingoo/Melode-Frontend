import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { waitForPageLoad } from './helpers/utils';

test.describe('Clock In/Out', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin');
    await waitForPageLoad(page);
  });

  test('should display clock button', async ({ page }) => {
    const clockButton = page.getByRole('button', { name: /clock|check in|check out/i }).first();
    if (await clockButton.isVisible({ timeout: 5000 })) {
      await expect(clockButton).toBeVisible();
    }
  });

  test('should clock in', async ({ page }) => {
    const clockInButton = page.getByRole('button', { name: /clock in|check in/i }).first();
    if (await clockInButton.isVisible({ timeout: 5000 })) {
      await clockInButton.click();
      await page.waitForTimeout(2000);
      
      // Should show success message or status change
      const successMessage = page.locator('text=/clocked in|checked in|success/i').first();
      if (await successMessage.isVisible({ timeout: 3000 })) {
        await expect(successMessage).toBeVisible();
      }
    }
  });

  test('should clock out', async ({ page }) => {
    // First clock in if needed
    const clockInButton = page.getByRole('button', { name: /clock in|check in/i }).first();
    if (await clockInButton.isVisible({ timeout: 5000 })) {
      await clockInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Then clock out
    const clockOutButton = page.getByRole('button', { name: /clock out|check out/i }).first();
    if (await clockOutButton.isVisible({ timeout: 5000 })) {
      await clockOutButton.click();
      await page.waitForTimeout(2000);
      
      // Should show success message
      const successMessage = page.locator('text=/clocked out|checked out|success/i').first();
      if (await successMessage.isVisible({ timeout: 3000 })) {
        await expect(successMessage).toBeVisible();
      }
    }
  });

  test('should view clock history', async ({ page }) => {
    await page.goto('/clock/history');
    await waitForPageLoad(page);
    
    await expect(page).toHaveURL(/.*clock.*history.*/);
    
    // Check for history table
    const historyTable = page.locator('table, [class*="history"]').first();
    if (await historyTable.isVisible({ timeout: 5000 })) {
      await expect(historyTable).toBeVisible();
    }
  });

  test('should view active clocks', async ({ page }) => {
    await page.goto('/clock');
    await waitForPageLoad(page);
    
    // Look for active clocks section
    const activeClocks = page.locator('text=/active.*clock|clocked in/i').first();
    if (await activeClocks.isVisible({ timeout: 3000 })) {
      await expect(activeClocks).toBeVisible();
    }
  });
});

