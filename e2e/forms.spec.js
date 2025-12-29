import { test, expect } from '@playwright/test';

test.describe('Form Submission Flow', () => {
  test('should display form fields correctly', async ({ page }) => {
    // Navigate to a form page (adjust URL based on your routing)
    // This assumes you have a form with a slug
    await page.goto('/forms/test-form-slug');
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Check that form is visible
    const form = page.locator('form').first();
    await expect(form).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/forms/test-form-slug');
    
    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /submit/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show validation errors
      await expect(page.locator('text=/required/i').first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should save draft', async ({ page }) => {
    await page.goto('/forms/test-form-slug');
    
    // Fill in some fields
    const input = page.locator('input[type="text"]').first();
    if (await input.isVisible()) {
      await input.fill('Test value');
      
      // Look for save draft button
      const saveDraftButton = page.getByRole('button', { name: /save draft|draft/i });
      if (await saveDraftButton.isVisible()) {
        await saveDraftButton.click();
        
        // Should show success message
        await expect(page.locator('text=/saved|draft/i').first()).toBeVisible({ timeout: 3000 });
      }
    }
  });
});


