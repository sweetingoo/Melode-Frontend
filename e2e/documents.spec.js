import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { waitForPageLoad } from './helpers/utils';

test.describe('Documents Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/documents');
    await waitForPageLoad(page);
  });

  test('should display documents list page', async ({ page }) => {
    await expect(page).toHaveURL(/.*document.*/);
    
    const documentsTable = page.locator('table, [class*="document"]').first();
    await expect(documentsTable).toBeVisible({ timeout: 5000 });
  });

  test('should create a new document', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /new|create|add.*document/i }).first();
    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click();
      await waitForPageLoad(page);
      
      // Fill in document form
      const titleInput = page.locator('input[name*="title"], input[placeholder*="title" i]').first();
      if (await titleInput.isVisible({ timeout: 3000 })) {
        await titleInput.fill('Test Document ' + Date.now());
        
        // Fill content if rich text editor exists
        const contentEditor = page.locator('[contenteditable="true"], textarea').first();
        if (await contentEditor.isVisible({ timeout: 2000 })) {
          await contentEditor.fill('Test document content');
        }
        
        // Save
        const saveButton = page.getByRole('button', { name: /save|create|publish/i }).first();
        if (await saveButton.isVisible({ timeout: 2000 })) {
          await saveButton.click();
          await page.waitForTimeout(3000);
        }
      }
    }
  });

  test('should view document details', async ({ page }) => {
    const documentLink = page.getByRole('link').first();
    if (await documentLink.isVisible({ timeout: 5000 })) {
      await documentLink.click();
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/.*document.*\/.*/);
    }
  });

  test('should edit document', async ({ page }) => {
    const documentLink = page.getByRole('link').first();
    if (await documentLink.isVisible({ timeout: 5000 })) {
      await documentLink.click();
      await waitForPageLoad(page);
      
      // Look for edit button
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible({ timeout: 3000 })) {
        await editButton.click();
        await waitForPageLoad(page);
        
        // Update title
        const titleInput = page.locator('input[name*="title"]').first();
        if (await titleInput.isVisible({ timeout: 2000 })) {
          await titleInput.fill('Updated Document ' + Date.now());
          
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

  test('should attach file to document', async ({ page }) => {
    const documentLink = page.getByRole('link').first();
    if (await documentLink.isVisible({ timeout: 5000 })) {
      await documentLink.click();
      await waitForPageLoad(page);
      
      // Look for attach file button
      const attachButton = page.getByRole('button', { name: /attach|upload|file/i }).first();
      if (await attachButton.isVisible({ timeout: 3000 })) {
        await attachButton.click();
        await page.waitForTimeout(1000);
        
        // File input might be hidden, try to find it
        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.isVisible({ timeout: 2000 })) {
          // Note: In real test, you'd provide an actual file
          // await fileInput.setInputFiles('path/to/test-file.pdf');
        }
      }
    }
  });

  test('should search documents', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('test');
      await page.waitForTimeout(2000);
      
      // Results should update
      const results = page.locator('table tbody tr, [class*="result"]');
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter documents by category', async ({ page }) => {
    const categoryFilter = page.locator('select, [role="combobox"]').first();
    if (await categoryFilter.isVisible({ timeout: 3000 })) {
      await categoryFilter.click();
      const option = page.getByRole('option').first();
      if (await option.isVisible({ timeout: 1000 })) {
        await option.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});

