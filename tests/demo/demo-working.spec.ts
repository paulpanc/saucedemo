import { test, expect } from '@fixtures/index';

test.describe('Demo Working Test', () => {
  test('login page loads with the correct title', async ({ loginPage, page }) => {
    await loginPage.goto();
    await expect(page).toHaveTitle('Swag Labs');
    await loginPage.usernameInput.expect().toBeVisible();
    await loginPage.passwordInput.expect().toBeVisible();
    await loginPage.loginButton.expect().toBeVisible();
  });
});
