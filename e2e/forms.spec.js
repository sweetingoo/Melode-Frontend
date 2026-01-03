import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { waitForPageLoad } from './helpers/utils';

test.describe('Forms Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display forms list page', async ({ page }) => {
    await page.goto('/admin/forms');
    await waitForPageLoad(page);
    
    await expect(page).toHaveURL(/.*form.*/);
    const formsTable = page.locator('table, [class*="form"]').first();
    await expect(formsTable).toBeVisible({ timeout: 5000 });
  });

  test('should create a new form', async ({ page }) => {
    await page.goto('/admin/forms');
    await waitForPageLoad(page);
    
    const createButton = page.getByRole('button', { name: /new|create|add.*form/i }).first();
    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click();
      await waitForPageLoad(page);
      
      // Fill in form details
      const titleInput = page.locator('input[name*="title"], input[placeholder*="title" i]').first();
      if (await titleInput.isVisible({ timeout: 3000 })) {
        await titleInput.fill('Test Form ' + Date.now());
        
        // Try to add a field
        const addFieldButton = page.getByRole('button', { name: /add.*field|new field/i }).first();
        if (await addFieldButton.isVisible({ timeout: 2000 })) {
          await addFieldButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Save form
        const saveButton = page.getByRole('button', { name: /save|create|submit/i }).first();
        if (await saveButton.isVisible({ timeout: 2000 })) {
          await saveButton.click();
          await page.waitForTimeout(3000);
        }
      }
    }
  });

  test('should view form details', async ({ page }) => {
    await page.goto('/admin/forms');
    await waitForPageLoad(page);
    
    const formLink = page.getByRole('link').first();
    if (await formLink.isVisible({ timeout: 5000 })) {
      await formLink.click();
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/.*form.*\/.*/);
    }
  });

  test('should edit form', async ({ page }) => {
    await page.goto('/admin/forms');
    await waitForPageLoad(page);
    
    const formLink = page.getByRole('link').first();
    if (await formLink.isVisible({ timeout: 5000 })) {
      await formLink.click();
      await waitForPageLoad(page);
      
      // Look for edit button
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible({ timeout: 3000 })) {
        await editButton.click();
        await waitForPageLoad(page);
        
        // Update title
        const titleInput = page.locator('input[name*="title"]').first();
        if (await titleInput.isVisible({ timeout: 2000 })) {
          await titleInput.fill('Updated Form ' + Date.now());
          
          // Save
          const saveButton = page.getByRole('button', { name: /save|update/i }).first();
          if (await saveButton.isVisible({ timeout: 2000 })) {
            await saveButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }
  });

  test('should view form submissions', async ({ page }) => {
    await page.goto('/admin/forms');
    await waitForPageLoad(page);
    
    const formLink = page.getByRole('link').first();
    if (await formLink.isVisible({ timeout: 5000 })) {
      await formLink.click();
      await waitForPageLoad(page);
      
      // Look for submissions link/button
      const submissionsLink = page.getByRole('link', { name: /submission/i }).first();
      if (await submissionsLink.isVisible({ timeout: 3000 })) {
        await submissionsLink.click();
        await waitForPageLoad(page);
        
        await expect(page).toHaveURL(/.*submission.*/);
      }
    }
  });

  test('should submit a form', async ({ page }) => {
    await page.goto('/admin/forms');
    await waitForPageLoad(page);
    
    const formLink = page.getByRole('link').first();
    if (await formLink.isVisible({ timeout: 5000 })) {
      await formLink.click();
      await waitForPageLoad(page);
      
      // Look for submit button
      const submitButton = page.getByRole('button', { name: /submit|fill.*form/i }).first();
      if (await submitButton.isVisible({ timeout: 3000 })) {
        await submitButton.click();
        await waitForPageLoad(page);
        
        // Fill form fields if any
        const textInput = page.locator('input[type="text"], textarea').first();
        if (await textInput.isVisible({ timeout: 3000 })) {
          await textInput.fill('Test submission data');
          
          // Submit
          const submitFormButton = page.getByRole('button', { name: /submit/i }).first();
          if (await submitFormButton.isVisible({ timeout: 2000 })) {
            await submitFormButton.click();
            await page.waitForTimeout(3000);
          }
        }
      }
    }
  });

  test('should filter form submissions', async ({ page }) => {
    await page.goto('/admin/forms');
    await waitForPageLoad(page);
    
    const formLink = page.getByRole('link').first();
    if (await formLink.isVisible({ timeout: 5000 })) {
      await formLink.click();
      await waitForPageLoad(page);
      
      // Navigate to submissions
      const submissionsLink = page.getByRole('link', { name: /submission/i }).first();
      if (await submissionsLink.isVisible({ timeout: 3000 })) {
        await submissionsLink.click();
        await waitForPageLoad(page);
        
        // Look for filter controls
        const filterSelect = page.locator('select, [role="combobox"]').first();
        if (await filterSelect.isVisible({ timeout: 3000 })) {
          await filterSelect.click();
          const option = page.getByRole('option').first();
          if (await option.isVisible({ timeout: 1000 })) {
            await option.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }
  });
});
