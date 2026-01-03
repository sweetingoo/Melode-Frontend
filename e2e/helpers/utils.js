/**
 * Utility functions for Playwright tests
 */

export async function waitForApiResponse(page, urlPattern) {
  return page.waitForResponse(
    (response) => response.url().includes(urlPattern) && response.status() === 200,
    { timeout: 10000 }
  );
}

export async function waitForToast(page, messagePattern) {
  // Wait for toast notification to appear
  await page.waitForSelector('[role="status"], .toast, [data-sonner-toast]', { timeout: 5000 });
  // Check if message contains the pattern
  const toast = page.locator('[role="status"], .toast, [data-sonner-toast]').first();
  await expect(toast).toContainText(new RegExp(messagePattern, 'i'), { timeout: 3000 });
}

export async function fillFormField(page, label, value) {
  // Try multiple ways to find the field
  const labelElement = page.getByText(label, { exact: false }).first();
  if (await labelElement.isVisible({ timeout: 2000 })) {
    const field = page.locator(`input[name*="${label.toLowerCase()}"], textarea[name*="${label.toLowerCase()}"]`).first();
    if (await field.isVisible({ timeout: 2000 })) {
      await field.fill(value);
      return;
    }
  }
  
  // Fallback: try to find by placeholder
  const placeholderField = page.getByPlaceholder(new RegExp(label, 'i')).first();
  if (await placeholderField.isVisible({ timeout: 2000 })) {
    await placeholderField.fill(value);
  }
}

export async function clickButtonByText(page, text, exact = false) {
  const button = page.getByRole('button', { name: new RegExp(text, 'i') }).first();
  await button.click({ timeout: 5000 });
}

export async function waitForPageLoad(page) {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    // Don't wait for networkidle as it can be too strict
    await page.waitForTimeout(1000); // Give a moment for dynamic content
  } catch (error) {
    // If timeout, just continue - page might still be usable
    console.warn('Page load timeout, continuing anyway');
  }
}

export async function navigateToSection(page, sectionName) {
  // Try to find navigation link
  const navLink = page.getByRole('link', { name: new RegExp(sectionName, 'i') }).first();
  if (await navLink.isVisible({ timeout: 3000 })) {
    await navLink.click();
    await waitForPageLoad(page);
  }
}

