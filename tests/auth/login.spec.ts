import { test, expect } from '@fixtures/index';
import { USERS } from '@data/users';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('logs in with valid credentials', async ({ loginPage, page }) => {
    await loginPage.login(USERS.standard.username, USERS.standard.password);
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
      await loginPage.login('', USERS.standard.password);
      await loginPage.errorMessage.expect().toContainText('Username is required');
      await loginPage.goto();
    });

    await test.step('password missing → "Password is required"', async () => {
      await loginPage.login(USERS.standard.username, '');
      await loginPage.errorMessage.expect().toContainText('Password is required');
      await loginPage.goto();
    });

    await test.step('invalid credentials → mismatch error', async () => {
      await loginPage.login('wrong_user', 'wrong_pass');
      await loginPage.errorMessage.expect().toContainText('Username and password do not match');
      await loginPage.goto();
    });

    await test.step('locked-out user → locked out error', async () => {
      await loginPage.login(USERS.locked.username, USERS.locked.password);
      await loginPage.errorMessage.expect().toContainText('locked out');
      await loginPage.goto();
    });

    await test.step('username is case-sensitive — wrong case is rejected', async () => {
      await loginPage.login('Standard_User', USERS.standard.password);
      await loginPage.errorMessage.expect().toBeVisible();
      await expect(page).not.toHaveURL(/inventory/u);
      await loginPage.goto();
    });

    await test.step('password is case-sensitive — wrong case is rejected', async () => {
      await loginPage.login(USERS.standard.username, 'Secret_Sauce');
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
      { key: 'standard', ...USERS.standard },
      { key: 'problem', ...USERS.problem },
      { key: 'performance_glitch', ...USERS.performanceGlitch },
      { key: 'error', ...USERS.error },
      { key: 'visual', ...USERS.visual },
    ];

    for (const user of loginableUsers) {
      test(`${user.key} user lands on inventory after login`, async ({ loginPage, page }) => {
        await loginPage.login(user.username, user.password);
        await expect(page).toHaveURL(/inventory/u);
      });
    }
  });
});
