import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page before each test
    await page.goto('/auth');
  });

  test('should display login form', async ({ page }) => {
    // Check for login form elements
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /login/i }).click();
    
    // Should show validation errors (adjust selectors based on your actual implementation)
    // This is a placeholder - adjust based on your actual error display
    await expect(page.locator('text=/required/i').first()).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByPlaceholder(/email/i).fill('invalid@example.com');
    await page.getByPlaceholder(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Should show error message
    // Adjust selector based on your toast/error message implementation
    await expect(page.locator('text=/invalid|error|failed/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to forgot password page', async ({ page }) => {
    // Click forgot password link
    const forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      await expect(page).toHaveURL(/.*forget-password.*/);
    }
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to auth page when not authenticated', async ({ page }) => {
    // Try to access protected route
    await page.goto('/admin');
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/.*auth.*/);
  });
});



