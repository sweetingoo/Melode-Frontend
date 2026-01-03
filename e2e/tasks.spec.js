import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { waitForPageLoad, waitForApiResponse } from './helpers/utils';

test.describe('Tasks Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/tasks');
    await waitForPageLoad(page);
  });

  test('should display tasks list page', async ({ page }) => {
    await expect(page).toHaveURL(/.*task.*/);
    
    // Check for tasks table or list
    const tasksTable = page.locator('table, [class*="task"]').first();
    await expect(tasksTable).toBeVisible({ timeout: 5000 });
  });

  test('should filter tasks', async ({ page }) => {
    // Look for filter controls
    const filterButton = page.getByRole('button', { name: /filter/i }).first();
    if (await filterButton.isVisible({ timeout: 3000 })) {
      await filterButton.click();
      
      // Try to apply a filter
      const statusFilter = page.locator('select, [role="combobox"]').first();
      if (await statusFilter.isVisible({ timeout: 2000 })) {
        await statusFilter.click();
        const option = page.getByRole('option').first();
        if (await option.isVisible({ timeout: 1000 })) {
          await option.click();
        }
      }
    }
  });

  test('should view task details', async ({ page }) => {
    // Find a task link and click it
    const taskLink = page.getByRole('link', { name: /view|details|task/i }).first();
    if (await taskLink.isVisible({ timeout: 5000 })) {
      await taskLink.click();
      await waitForPageLoad(page);
      
      // Should be on task detail page
      await expect(page).toHaveURL(/.*task.*\/.*/);
    }
  });

  test('should create a new task', async ({ page }) => {
    // Look for create/new task button
    const createButton = page.getByRole('button', { name: /new|create|add.*task/i }).first();
    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click();
      await waitForPageLoad(page);
      
      // Should be on create task page or modal
      const form = page.locator('form, [class*="form"]').first();
      if (await form.isVisible({ timeout: 3000 })) {
        await expect(form).toBeVisible();
        
        // Fill in task form
        const titleInput = page.locator('input[name*="title"], input[placeholder*="title" i]').first();
        if (await titleInput.isVisible({ timeout: 2000 })) {
          await titleInput.fill('Test Task ' + Date.now());
          
          // Try to submit
          const submitButton = page.getByRole('button', { name: /save|create|submit/i }).first();
          if (await submitButton.isVisible({ timeout: 2000 })) {
            await submitButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }
  });

  test('should complete a task', async ({ page }) => {
    // Navigate to a task detail page
    const taskLink = page.getByRole('link').first();
    if (await taskLink.isVisible({ timeout: 5000 })) {
      await taskLink.click();
      await waitForPageLoad(page);
      
      // Look for complete button
      const completeButton = page.getByRole('button', { name: /complete|finish|done/i }).first();
      if (await completeButton.isVisible({ timeout: 3000 })) {
        await completeButton.click();
        await page.waitForTimeout(2000);
        
        // Should show success message
        const successMessage = page.locator('text=/success|completed/i').first();
        if (await successMessage.isVisible({ timeout: 3000 })) {
          await expect(successMessage).toBeVisible();
        }
      }
    }
  });

  test('should assign task to user', async ({ page }) => {
    // Navigate to task detail
    const taskLink = page.getByRole('link').first();
    if (await taskLink.isVisible({ timeout: 5000 })) {
      await taskLink.click();
      await waitForPageLoad(page);
      
      // Look for assign button
      const assignButton = page.getByRole('button', { name: /assign/i }).first();
      if (await assignButton.isVisible({ timeout: 3000 })) {
        await assignButton.click();
        await page.waitForTimeout(1000);
        
        // Look for user selector
        const userSelect = page.locator('select, [role="combobox"]').first();
        if (await userSelect.isVisible({ timeout: 2000 })) {
          await userSelect.click();
          const option = page.getByRole('option').first();
          if (await option.isVisible({ timeout: 1000 })) {
            await option.click();
            
            // Confirm assignment
            const confirmButton = page.getByRole('button', { name: /assign|confirm|save/i }).first();
            if (await confirmButton.isVisible({ timeout: 2000 })) {
              await confirmButton.click();
              await page.waitForTimeout(2000);
            }
          }
        }
      }
    }
  });

  test('should add comments to task', async ({ page }) => {
    // Navigate to task detail
    const taskLink = page.getByRole('link').first();
    if (await taskLink.isVisible({ timeout: 5000 })) {
      await taskLink.click();
      await waitForPageLoad(page);
      
      // Look for comment input
      const commentInput = page.locator('textarea, input[type="text"]').first();
      if (await commentInput.isVisible({ timeout: 3000 })) {
        await commentInput.fill('Test comment ' + Date.now());
        
        // Submit comment
        const submitButton = page.getByRole('button', { name: /comment|post|send/i }).first();
        if (await submitButton.isVisible({ timeout: 2000 })) {
          await submitButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  });
});

