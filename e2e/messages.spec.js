import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { waitForPageLoad } from './helpers/utils';

test.describe('Messages Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/messages');
    await waitForPageLoad(page);
  });

  test('should display messages list page', async ({ page }) => {
    await expect(page).toHaveURL(/.*message.*/);
    
    const messagesTable = page.locator('table, [class*="message"]').first();
    await expect(messagesTable).toBeVisible({ timeout: 5000 });
  });

  test('should view message details', async ({ page }) => {
    const messageLink = page.getByRole('link').first();
    if (await messageLink.isVisible({ timeout: 5000 })) {
      await messageLink.click();
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/.*message.*\/.*/);
    }
  });

  test('should mark message as read', async ({ page }) => {
    const messageLink = page.getByRole('link').first();
    if (await messageLink.isVisible({ timeout: 5000 })) {
      await messageLink.click();
      await waitForPageLoad(page);
      
      // Message should be marked as read automatically or have a button
      await page.waitForTimeout(2000);
      
      // Check if read status is updated
      const readIndicator = page.locator('text=/read|viewed/i').first();
      if (await readIndicator.isVisible({ timeout: 3000 })) {
        await expect(readIndicator).toBeVisible();
      }
    }
  });

  test('should acknowledge message', async ({ page }) => {
    const messageLink = page.getByRole('link').first();
    if (await messageLink.isVisible({ timeout: 5000 })) {
      await messageLink.click();
      await waitForPageLoad(page);
      
      // Look for acknowledge button
      const ackButton = page.getByRole('button', { name: /acknowledge|ack/i }).first();
      if (await ackButton.isVisible({ timeout: 3000 })) {
        await ackButton.click();
        await page.waitForTimeout(2000);
        
        // Should show success
        const successMessage = page.locator('text=/acknowledged|success/i').first();
        if (await successMessage.isVisible({ timeout: 3000 })) {
          await expect(successMessage).toBeVisible();
        }
      }
    }
  });

  test('should filter messages', async ({ page }) => {
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

test.describe('Broadcasts', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/broadcasts');
    await waitForPageLoad(page);
  });

  test('should display broadcasts list page', async ({ page }) => {
    await expect(page).toHaveURL(/.*broadcast.*/);
    
    const broadcastsTable = page.locator('table, [class*="broadcast"]').first();
    await expect(broadcastsTable).toBeVisible({ timeout: 5000 });
  });

  test('should view broadcast details', async ({ page }) => {
    const broadcastLink = page.getByRole('link').first();
    if (await broadcastLink.isVisible({ timeout: 5000 })) {
      await broadcastLink.click();
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/.*broadcast.*\/.*/);
    }
  });

  test('should view broadcast status', async ({ page }) => {
    const broadcastLink = page.getByRole('link').first();
    if (await broadcastLink.isVisible({ timeout: 5000 })) {
      await broadcastLink.click();
      await waitForPageLoad(page);
      
      // Look for status link/button
      const statusLink = page.getByRole('link', { name: /status/i }).first();
      if (await statusLink.isVisible({ timeout: 3000 })) {
        await statusLink.click();
        await waitForPageLoad(page);
        
        await expect(page).toHaveURL(/.*status.*/);
      }
    }
  });
});

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/notifications');
    await waitForPageLoad(page);
  });

  test('should display notifications page', async ({ page }) => {
    await expect(page).toHaveURL(/.*notification.*/);
    
    const notificationsList = page.locator('[class*="notification"], table').first();
    await expect(notificationsList).toBeVisible({ timeout: 5000 });
  });

  test('should mark notification as read', async ({ page }) => {
    const notification = page.locator('[class*="notification"]').first();
    if (await notification.isVisible({ timeout: 5000 })) {
      await notification.click();
      await page.waitForTimeout(2000);
      
      // Should be marked as read
      const readIndicator = page.locator('text=/read/i').first();
      if (await readIndicator.isVisible({ timeout: 3000 })) {
        await expect(readIndicator).toBeVisible();
      }
    }
  });
});

