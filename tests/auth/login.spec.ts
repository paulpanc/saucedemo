import { test, expect } from '@fixtures/index';
import {
  STANDARD_USER,
  LOCKED_USER,
  PROBLEM_USER,
  PERFORMANCE_GLITCH_USER,
  ERROR_USER,
  VISUAL_USER,
} from '@data/users';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('logs in with valid credentials', async ({ loginPage, page }) => {
    await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
    await expect(page).toHaveURL(/inventory/u);
  });

  test('login page loads with correct initial state', async ({ loginPage, page }) => {
    await test.step('page title is "Swag Labs"', async () => {
      await expect(page).toHaveTitle('Swag Labs');
    });

    await test.step('username input is visible and enabled', async () => {
      await loginPage.usernameInput.expect().toBeVisible();
      await loginPage.usernameInput.expect().toBeEnabled();
    });

    await test.step('password input is visible and enabled', async () => {
      await loginPage.passwordInput.expect().toBeVisible();
      await loginPage.passwordInput.expect().toBeEnabled();
    });

    await test.step('login button is visible and enabled', async () => {
      await loginPage.loginButton.expect().toBeVisible();
      await loginPage.loginButton.expect().toBeEnabled();
    });

    await test.step('no error message shown on initial load', async () => {
      await loginPage.errorMessage.expect().toBeHidden();
    });
  });

  test('credential validation shows appropriate errors', async ({ loginPage, page }) => {
    await test.step('both fields empty → "Username is required"', async () => {
      await loginPage.login('', '');
      await loginPage.errorMessage.expect().toContainText('Username is required');
      await loginPage.goto();
    });

    await test.step('username missing → "Username is required"', async () => {
      await loginPage.login('', STANDARD_USER.password);
      await loginPage.errorMessage.expect().toContainText('Username is required');
      await loginPage.goto();
    });

    await test.step('password missing → "Password is required"', async () => {
      await loginPage.login(STANDARD_USER.username, '');
      await loginPage.errorMessage.expect().toContainText('Password is required');
      await loginPage.goto();
    });

    await test.step('invalid credentials → mismatch error', async () => {
      await loginPage.login('wrong_user', 'wrong_pass');
      await loginPage.errorMessage.expect().toContainText('Username and password do not match');
      await loginPage.goto();
    });

    await test.step('locked-out user → locked out error', async () => {
      await loginPage.login(LOCKED_USER.username, LOCKED_USER.password);
      await loginPage.errorMessage.expect().toContainText('locked out');
      await loginPage.goto();
    });

    await test.step('username is case-sensitive — wrong case is rejected', async () => {
      await loginPage.login('Standard_User', STANDARD_USER.password);
      await loginPage.errorMessage.expect().toBeVisible();
      await expect(page).not.toHaveURL(/inventory/u);
      await loginPage.goto();
    });

    await test.step('password is case-sensitive — wrong case is rejected', async () => {
      await loginPage.login(STANDARD_USER.username, 'Secret_Sauce');
      await loginPage.errorMessage.expect().toBeVisible();
      await expect(page).not.toHaveURL(/inventory/u);
    });
  });

  test('error UI lifecycle after a failed login', async ({ loginPage }) => {
    await test.step('error icon, message appear and username is retained', async () => {
      await loginPage.login('wrong_user', 'wrong_pass');
      await loginPage.errorMessage.expect().toBeVisible();
      await loginPage.errorIcon.first().expect().toBeVisible();
      await loginPage.usernameInput.expect().toHaveValue('wrong_user');
    });

    await test.step('dismissing the error clears both the icon and the message', async () => {
      await loginPage.errorCloseButton.click();
      await loginPage.errorMessage.expect().toBeHidden();
      await loginPage.errorIcon.first().expect().toBeHidden();
    });
  });

  test.describe('all non-locked user types', () => {
    const loginableUsers: { key: string; username: string; password: string }[] = [
      { key: 'standard', ...STANDARD_USER },
      { key: 'problem', ...PROBLEM_USER },
      { key: 'performance_glitch', ...PERFORMANCE_GLITCH_USER },
      { key: 'error', ...ERROR_USER },
      { key: 'visual', ...VISUAL_USER },
    ];

    for (const user of loginableUsers) {
      test(`${user.key} user lands on inventory after login`, async ({ loginPage, page }) => {
        await loginPage.login(user.username, user.password);
        await expect(page).toHaveURL(/inventory/u);
      });
    }
  });
});
