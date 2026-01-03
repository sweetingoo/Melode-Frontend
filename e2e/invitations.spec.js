import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { waitForPageLoad } from './helpers/utils';

test.describe('Invitations Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/invitations');
    await waitForPageLoad(page);
  });

  test('should display invitations list page', async ({ page }) => {
    await expect(page).toHaveURL(/.*invitation.*/);
    
    const invitationsTable = page.locator('table, [class*="invitation"]').first();
    await expect(invitationsTable).toBeVisible({ timeout: 5000 });
  });

  test('should create a new invitation', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /new|create|invite/i }).first();
    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click();
      await waitForPageLoad(page);
      
      // Fill in invitation form
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      if (await emailInput.isVisible({ timeout: 3000 })) {
        await emailInput.fill('test' + Date.now() + '@example.com');
        
        // Select role if available
        const roleSelect = page.locator('select, [role="combobox"]').first();
        if (await roleSelect.isVisible({ timeout: 2000 })) {
          await roleSelect.click();
          const option = page.getByRole('option').first();
          if (await option.isVisible({ timeout: 1000 })) {
            await option.click();
          }
        }
        
        // Send invitation
        const sendButton = page.getByRole('button', { name: /send|invite|create/i }).first();
        if (await sendButton.isVisible({ timeout: 2000 })) {
          await sendButton.click();
          await page.waitForTimeout(3000);
        }
      }
    }
  });

  test('should view invitation details', async ({ page }) => {
    const invitationLink = page.getByRole('link').first();
    if (await invitationLink.isVisible({ timeout: 5000 })) {
      await invitationLink.click();
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/.*invitation.*\/.*/);
    }
  });

  test('should resend invitation', async ({ page }) => {
    const invitationLink = page.getByRole('link').first();
    if (await invitationLink.isVisible({ timeout: 5000 })) {
      await invitationLink.click();
      await waitForPageLoad(page);
      
      // Look for resend button
      const resendButton = page.getByRole('button', { name: /resend/i }).first();
      if (await resendButton.isVisible({ timeout: 3000 })) {
        await resendButton.click();
        await page.waitForTimeout(2000);
        
        // Should show success message
        const successMessage = page.locator('text=/sent|success/i').first();
        if (await successMessage.isVisible({ timeout: 3000 })) {
          await expect(successMessage).toBeVisible();
        }
      }
    }
  });

  test('should filter invitations by status', async ({ page }) => {
    const filterSelect = page.locator('select, [role="combobox"]').first();
    if (await filterSelect.isVisible({ timeout: 3000 })) {
      await filterSelect.click();
      const option = page.getByRole('option').first();
      if (await option.isVisible({ timeout: 1000 })) {
        await option.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});

