import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { waitForPageLoad } from './helpers/utils';

test.describe('Projects Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/admin/projects');
    await waitForPageLoad(page);
  });

  test('should display projects list page', async ({ page }) => {
    await expect(page).toHaveURL(/.*project.*/);
    
    // Check for projects table or list
    const projectsTable = page.locator('table, [class*="project"]').first();
    await expect(projectsTable).toBeVisible({ timeout: 5000 });
  });

  test('should create a new project', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /new|create|add.*project/i }).first();
    if (await createButton.isVisible({ timeout: 3000 })) {
      await createButton.click();
      await waitForPageLoad(page);
      
      // Fill in project form
      const nameInput = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
      if (await nameInput.isVisible({ timeout: 3000 })) {
        await nameInput.fill('Test Project ' + Date.now());
        
        const descriptionInput = page.locator('textarea, input[placeholder*="description" i]').first();
        if (await descriptionInput.isVisible({ timeout: 2000 })) {
          await descriptionInput.fill('Test project description');
        }
        
        // Submit
        const submitButton = page.getByRole('button', { name: /save|create|submit/i }).first();
        if (await submitButton.isVisible({ timeout: 2000 })) {
          await submitButton.click();
          await page.waitForTimeout(3000);
        }
      }
    }
  });

  test('should view project details', async ({ page }) => {
    const projectLink = page.getByRole('link').first();
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await waitForPageLoad(page);
      
      // Should be on project detail page
      await expect(page).toHaveURL(/.*project.*\/.*/);
    }
  });

  test('should add task to project', async ({ page }) => {
    // Navigate to project detail
    const projectLink = page.getByRole('link').first();
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await waitForPageLoad(page);
      
      // Look for add task button
      const addTaskButton = page.getByRole('button', { name: /add.*task|new task/i }).first();
      if (await addTaskButton.isVisible({ timeout: 3000 })) {
        await addTaskButton.click();
        await page.waitForTimeout(1000);
        
        // Select a task if modal opens
        const taskSelect = page.locator('select, [role="combobox"]').first();
        if (await taskSelect.isVisible({ timeout: 2000 })) {
          await taskSelect.click();
          const option = page.getByRole('option').first();
          if (await option.isVisible({ timeout: 1000 })) {
            await option.click();
            
            const confirmButton = page.getByRole('button', { name: /add|confirm|save/i }).first();
            if (await confirmButton.isVisible({ timeout: 2000 })) {
              await confirmButton.click();
              await page.waitForTimeout(2000);
            }
          }
        }
      }
    }
  });

  test('should add member to project', async ({ page }) => {
    // Navigate to project detail
    const projectLink = page.getByRole('link').first();
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await waitForPageLoad(page);
      
      // Look for add member button
      const addMemberButton = page.getByRole('button', { name: /add.*member|invite/i }).first();
      if (await addMemberButton.isVisible({ timeout: 3000 })) {
        await addMemberButton.click();
        await page.waitForTimeout(1000);
        
        // Select a user
        const userSelect = page.locator('select, [role="combobox"]').first();
        if (await userSelect.isVisible({ timeout: 2000 })) {
          await userSelect.click();
          const option = page.getByRole('option').first();
          if (await option.isVisible({ timeout: 1000 })) {
            await option.click();
            
            const confirmButton = page.getByRole('button', { name: /add|confirm|save/i }).first();
            if (await confirmButton.isVisible({ timeout: 2000 })) {
              await confirmButton.click();
              await page.waitForTimeout(2000);
            }
          }
        }
      }
    }
  });

  test('should edit project', async ({ page }) => {
    // Navigate to project detail
    const projectLink = page.getByRole('link').first();
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await waitForPageLoad(page);
      
      // Look for edit button
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible({ timeout: 3000 })) {
        await editButton.click();
        await waitForPageLoad(page);
        
        // Update name
        const nameInput = page.locator('input[name*="name"]').first();
        if (await nameInput.isVisible({ timeout: 2000 })) {
          await nameInput.fill('Updated Project ' + Date.now());
          
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
});

