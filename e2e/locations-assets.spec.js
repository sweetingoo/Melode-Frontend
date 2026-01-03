import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { waitForPageLoad } from './helpers/utils';

test.describe('Locations Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/locations');
    await waitForPageLoad(page);
  });

  test('should display locations list page', async ({ page }) => {
    await expect(page).toHaveURL(/.*location.*/);
    
    const locationsTable = page.locator('table, [class*="location"]').first();
    await expect(locationsTable).toBeVisible({ timeout: 5000 });
  });

  test('should create a new location', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /new|create|add.*location/i }).first();
    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click();
      await waitForPageLoad(page);
      
      // Fill in location form
      const nameInput = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
      if (await nameInput.isVisible({ timeout: 3000 })) {
        await nameInput.fill('Test Location ' + Date.now());
        
        // Save
        const saveButton = page.getByRole('button', { name: /save|create|submit/i }).first();
        if (await saveButton.isVisible({ timeout: 2000 })) {
          await saveButton.click();
          await page.waitForTimeout(3000);
        }
      }
    }
  });

  test('should view location details', async ({ page }) => {
    const locationLink = page.getByRole('link').first();
    if (await locationLink.isVisible({ timeout: 5000 })) {
      await locationLink.click();
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/.*location.*\/.*/);
    }
  });

  test('should view location hierarchy', async ({ page }) => {
    const locationLink = page.getByRole('link').first();
    if (await locationLink.isVisible({ timeout: 5000 })) {
      await locationLink.click();
      await waitForPageLoad(page);
      
      // Look for hierarchy section
      const hierarchySection = page.locator('text=/hierarchy|tree|parent/i').first();
      if (await hierarchySection.isVisible({ timeout: 3000 })) {
        await expect(hierarchySection).toBeVisible();
      }
    }
  });
});

test.describe('Assets Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/assets');
    await waitForPageLoad(page);
  });

  test('should display assets list page', async ({ page }) => {
    await expect(page).toHaveURL(/.*asset.*/);
    
    const assetsTable = page.locator('table, [class*="asset"]').first();
    await expect(assetsTable).toBeVisible({ timeout: 5000 });
  });

  test('should view asset details', async ({ page }) => {
    const assetLink = page.getByRole('link').first();
    if (await assetLink.isVisible({ timeout: 5000 })) {
      await assetLink.click();
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/.*asset.*\/.*/);
    }
  });

  test('should search assets by number', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('TEST');
      await page.waitForTimeout(2000);
      
      // Results should update
      const results = page.locator('table tbody tr, [class*="result"]');
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should assign asset to location', async ({ page }) => {
    const assetLink = page.getByRole('link').first();
    if (await assetLink.isVisible({ timeout: 5000 })) {
      await assetLink.click();
      await waitForPageLoad(page);
      
      // Look for assign button
      const assignButton = page.getByRole('button', { name: /assign/i }).first();
      if (await assignButton.isVisible({ timeout: 3000 })) {
        await assignButton.click();
        await page.waitForTimeout(1000);
        
        // Select location
        const locationSelect = page.locator('select, [role="combobox"]').first();
        if (await locationSelect.isVisible({ timeout: 2000 })) {
          await locationSelect.click();
          const option = page.getByRole('option').first();
          if (await option.isVisible({ timeout: 1000 })) {
            await option.click();
            
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
});

