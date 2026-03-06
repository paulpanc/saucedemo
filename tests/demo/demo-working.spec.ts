import { test, expect } from '@fixtures/index';

test.describe('Demo Working Test', () => {
  test('login page loads with the correct title', async ({ pageObject, page }) => {
    await pageObject.login.goto();
    await expect(page).toHaveTitle('Swag Labs');
    await pageObject.login.usernameInput.expect().toBeVisible();
    await pageObject.login.passwordInput.expect().toBeVisible();
    await pageObject.login.loginButton.expect().toBeVisible();
  });
});
