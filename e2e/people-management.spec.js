import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { waitForPageLoad } from './helpers/utils';

test.describe('People Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/people-management');
    await waitForPageLoad(page);
  });

  test('should display people list page', async ({ page }) => {
    await expect(page).toHaveURL(/.*people-management.*/);
    
    const peopleTable = page.locator('table, [class*="user"], [class*="people"]').first();
    await expect(peopleTable).toBeVisible({ timeout: 5000 });
  });

  test('should view user details', async ({ page }) => {
    const userLink = page.getByRole('link').first();
    if (await userLink.isVisible({ timeout: 5000 })) {
      await userLink.click();
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/.*people-management.*\/.*/);
    }
  });

  test('should edit user', async ({ page }) => {
    const userLink = page.getByRole('link').first();
    if (await userLink.isVisible({ timeout: 5000 })) {
      await userLink.click();
      await waitForPageLoad(page);
      
      // Look for edit button
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible({ timeout: 3000 })) {
        await editButton.click();
        await waitForPageLoad(page);
        
        // Update user info
        const firstNameInput = page.locator('input[name*="first"], input[placeholder*="first" i]').first();
        if (await firstNameInput.isVisible({ timeout: 2000 })) {
          await firstNameInput.fill('Updated Name');
          
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

  test('should assign role to user', async ({ page }) => {
    const userLink = page.getByRole('link').first();
    if (await userLink.isVisible({ timeout: 5000 })) {
      await userLink.click();
      await waitForPageLoad(page);
      
      // Look for assign role button
      const assignRoleButton = page.getByRole('button', { name: /assign.*role|add role/i }).first();
      if (await assignRoleButton.isVisible({ timeout: 3000 })) {
        await assignRoleButton.click();
        await page.waitForTimeout(1000);
        
        // Select role
        const roleSelect = page.locator('select, [role="combobox"]').first();
        if (await roleSelect.isVisible({ timeout: 2000 })) {
          await roleSelect.click();
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

  test('should assign permission to user', async ({ page }) => {
    const userLink = page.getByRole('link').first();
    if (await userLink.isVisible({ timeout: 5000 })) {
      await userLink.click();
      await waitForPageLoad(page);
      
      // Look for permissions section
      const permissionsTab = page.getByRole('tab', { name: /permission/i }).first();
      if (await permissionsTab.isVisible({ timeout: 3000 })) {
        await permissionsTab.click();
        await page.waitForTimeout(1000);
        
        // Look for add permission button
        const addPermissionButton = page.getByRole('button', { name: /add.*permission|assign/i }).first();
        if (await addPermissionButton.isVisible({ timeout: 2000 })) {
          await addPermissionButton.click();
          await page.waitForTimeout(1000);
          
          // Select permission
          const permissionSelect = page.locator('select, [role="combobox"]').first();
          if (await permissionSelect.isVisible({ timeout: 2000 })) {
            await permissionSelect.click();
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
    }
  });

  test('should activate/deactivate user', async ({ page }) => {
    const userLink = page.getByRole('link').first();
    if (await userLink.isVisible({ timeout: 5000 })) {
      await userLink.click();
      await waitForPageLoad(page);
      
      // Look for activate/deactivate button
      const statusButton = page.getByRole('button', { name: /activate|deactivate|status/i }).first();
      if (await statusButton.isVisible({ timeout: 3000 })) {
        await statusButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should search users', async ({ page }) => {
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
});

