import { test } from '@fixtures/index';

test.describe('Demo Broken Test', () => {
  test('intentionally broken test for demo purposes', async ({ loginPage }) => {
    await loginPage.login('wrong_user', 'wrong_pass');
    await loginPage.errorMessage.expect().not.toBeVisible();
  });
});