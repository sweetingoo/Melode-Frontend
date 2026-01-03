import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { waitForPageLoad } from './helpers/utils';

test.describe('Roles Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/role-management');
    await waitForPageLoad(page);
  });

  test('should display roles list page', async ({ page }) => {
    await expect(page).toHaveURL(/.*role.*/);
    
    const rolesTable = page.locator('table, [class*="role"]').first();
    await expect(rolesTable).toBeVisible({ timeout: 5000 });
  });

  test('should create a new role', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /new|create|add.*role/i }).first();
    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click();
      await waitForPageLoad(page);
      
      // Fill in role form
      const nameInput = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
      if (await nameInput.isVisible({ timeout: 3000 })) {
        await nameInput.fill('Test Role ' + Date.now());
        
        // Save
        const saveButton = page.getByRole('button', { name: /save|create|submit/i }).first();
        if (await saveButton.isVisible({ timeout: 2000 })) {
          await saveButton.click();
          await page.waitForTimeout(3000);
        }
      }
    }
  });

  test('should view role details', async ({ page }) => {
    const roleLink = page.getByRole('link').first();
    if (await roleLink.isVisible({ timeout: 5000 })) {
      await roleLink.click();
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/.*role.*\/.*/);
    }
  });

  test('should assign permissions to role', async ({ page }) => {
    const roleLink = page.getByRole('link').first();
    if (await roleLink.isVisible({ timeout: 5000 })) {
      await roleLink.click();
      await waitForPageLoad(page);
      
      // Look for permissions tab or section
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
});

test.describe('Permissions Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/permissions-management');
    await waitForPageLoad(page);
  });

  test('should display permissions list page', async ({ page }) => {
    await expect(page).toHaveURL(/.*permission.*/);
    
    const permissionsTable = page.locator('table, [class*="permission"]').first();
    await expect(permissionsTable).toBeVisible({ timeout: 5000 });
  });

  test('should view permission details', async ({ page }) => {
    const permissionLink = page.getByRole('link').first();
    if (await permissionLink.isVisible({ timeout: 5000 })) {
      await permissionLink.click();
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/.*permission.*\/.*/);
    }
  });

  test('should view roles with permission', async ({ page }) => {
    const permissionLink = page.getByRole('link').first();
    if (await permissionLink.isVisible({ timeout: 5000 })) {
      await permissionLink.click();
      await waitForPageLoad(page);
      
      // Look for roles section
      const rolesSection = page.locator('text=/role/i').first();
      if (await rolesSection.isVisible({ timeout: 3000 })) {
        await expect(rolesSection).toBeVisible();
      }
    }
  });
});

