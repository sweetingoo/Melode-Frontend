/**
 * Authentication helper functions for Playwright tests
 */

export async function login(page, email = 'admin@synerge.co.uk', password = 'Maze1234!') {
    await page.goto('/auth');
    await page.waitForSelector('input[type="email"], input[placeholder*="email" i]', { timeout: 10000 });

    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password" i]').first();
    const loginButton = page.getByRole('button', { name: /login|sign in/i }).first();

    await emailInput.fill(email);
    await passwordInput.fill(password);
    await loginButton.click();

    // Wait for navigation after login
    await page.waitForURL(/.*admin.*|.*dashboard.*/, { timeout: 15000 });
}

export async function logout(page) {
    // Try multiple ways to logout
    // Method 1: Look for logout button
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).first();
    if (await logoutButton.isVisible({ timeout: 2000 })) {
        await logoutButton.click();
        await page.waitForURL(/.*auth.*/, { timeout: 5000 });
        return;
    }

    // Method 2: Clear localStorage and redirect
    await page.evaluate(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/auth';
    });
    await page.waitForURL(/.*auth.*/, { timeout: 5000 });
}

export async function isAuthenticated(page) {
    // Check if we're on an authenticated page (not auth page)
    const currentUrl = page.url();
    return !currentUrl.includes('/auth') && !currentUrl.includes('/login');
}

