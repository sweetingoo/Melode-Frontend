import { test, expect } from '@playwright/test';
import { login, logout, isAuthenticated } from './helpers/auth';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Wait for validation errors
    await page.waitForTimeout(500);
    const errorMessages = page.locator('text=/required|invalid|error/i');
    const count = await errorMessages.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i]').first();
    const loginButton = page.getByRole('button', { name: /login|sign in/i }).first();
    
    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');
    await loginButton.click();
    
    // Should show error message (toast or inline)
    await page.waitForTimeout(2000);
    const errorElement = page.locator('text=/invalid|error|failed|incorrect/i').first();
    await expect(errorElement).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await login(page);
    
    // Should redirect to admin/dashboard
    await expect(page).toHaveURL(/.*admin.*|.*dashboard.*/, { timeout: 10000 });
    expect(await isAuthenticated(page)).toBe(true);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    const forgotPasswordLink = page.getByRole('link', { name: /forgot password|forget password/i });
    if (await forgotPasswordLink.isVisible({ timeout: 2000 })) {
      await forgotPasswordLink.click();
      await expect(page).toHaveURL(/.*forget-password|.*forgot-password.*/);
    }
  });

  test('should navigate to signup page', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: /sign up|signup|create account/i });
    if (await signupLink.isVisible({ timeout: 2000 })) {
      await signupLink.click();
      await expect(page).toHaveURL(/.*signup|.*register.*/);
    }
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to auth page when not authenticated', async ({ page }) => {
    await page.goto('/admin');
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/.*auth.*/, { timeout: 10000 });
  });

  test('should allow access to protected routes when authenticated', async ({ page }) => {
    await login(page);
    await page.goto('/admin');
    
    // Should be on admin page, not redirected
    await expect(page).toHaveURL(/.*admin.*/);
  });

  test('should logout successfully', async ({ page }) => {
    await login(page);
    await page.goto('/admin');
    
    // Try to logout
    await logout(page);
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/.*auth.*/, { timeout: 10000 });
  });
});
