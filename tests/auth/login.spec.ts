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
  test.beforeEach(async ({ pageObject }) => {
    await pageObject.login.goto();
  });

  test('logs in with valid credentials', async ({ pageObject, page }) => {
    await pageObject.login.login(STANDARD_USER.username, STANDARD_USER.password);
    await expect(page).toHaveURL(/inventory/u);
  });

  test('login page loads with correct initial state', async ({ pageObject, page }) => {
    await test.step('page title is "Swag Labs"', async () => {
      await expect(page).toHaveTitle('Swag Labs');
    });

    await test.step('username input is visible and enabled', async () => {
      await pageObject.login.usernameInput.expect().toBeVisible();
      await pageObject.login.usernameInput.expect().toBeEnabled();
    });

    await test.step('password input is visible and enabled', async () => {
      await pageObject.login.passwordInput.expect().toBeVisible();
      await pageObject.login.passwordInput.expect().toBeEnabled();
    });

    await test.step('login button is visible and enabled', async () => {
      await pageObject.login.loginButton.expect().toBeVisible();
      await pageObject.login.loginButton.expect().toBeEnabled();
    });

    await test.step('no error message shown on initial load', async () => {
      await pageObject.login.errorMessage.expect().toBeHidden();
    });
  });

  test('credential validation shows appropriate errors', async ({ pageObject, page }) => {
    await test.step('both fields empty → "Username is required"', async () => {
      await pageObject.login.login('', '');
      await pageObject.login.errorMessage.expect().toContainText('Username is required');
      await pageObject.login.goto();
    });

    await test.step('username missing → "Username is required"', async () => {
      await pageObject.login.login('', STANDARD_USER.password);
      await pageObject.login.errorMessage.expect().toContainText('Username is required');
      await pageObject.login.goto();
    });

    await test.step('password missing → "Password is required"', async () => {
      await pageObject.login.login(STANDARD_USER.username, '');
      await pageObject.login.errorMessage.expect().toContainText('Password is required');
      await pageObject.login.goto();
    });

    await test.step('invalid credentials → mismatch error', async () => {
      await pageObject.login.login('wrong_user', 'wrong_pass');
      await pageObject.login.errorMessage
        .expect()
        .toContainText('Username and password do not match');
      await pageObject.login.goto();
    });

    await test.step('locked-out user → locked out error', async () => {
      await pageObject.login.login(LOCKED_USER.username, LOCKED_USER.password);
      await pageObject.login.errorMessage.expect().toContainText('locked out');
      await pageObject.login.goto();
    });

    await test.step('username is case-sensitive — wrong case is rejected', async () => {
      await pageObject.login.login('Standard_User', STANDARD_USER.password);
      await pageObject.login.errorMessage.expect().toBeVisible();
      await expect(page).not.toHaveURL(/inventory/u);
      await pageObject.login.goto();
    });

    await test.step('password is case-sensitive — wrong case is rejected', async () => {
      await pageObject.login.login(STANDARD_USER.username, 'Secret_Sauce');
      await pageObject.login.errorMessage.expect().toBeVisible();
      await expect(page).not.toHaveURL(/inventory/u);
    });
  });

  test('error UI lifecycle after a failed login', async ({ pageObject }) => {
    await test.step('error icon, message appear and username is retained', async () => {
      await pageObject.login.login('wrong_user', 'wrong_pass');
      await pageObject.login.errorMessage.expect().toBeVisible();
      await pageObject.login.errorIcon.first().expect().toBeVisible();
      await pageObject.login.usernameInput.expect().toHaveValue('wrong_user');
    });

    await test.step('dismissing the error clears both the icon and the message', async () => {
      await pageObject.login.errorCloseButton.click();
      await pageObject.login.errorMessage.expect().toBeHidden();
      await pageObject.login.errorIcon.first().expect().toBeHidden();
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
      test(`${user.key} user lands on inventory after login`, async ({ pageObject, page }) => {
        await pageObject.login.login(user.username, user.password);
        await expect(page).toHaveURL(/inventory/u);
      });
    }
  });
});
