import { test, expect } from '@fixtures/index';

test.describe('Burger menu', () => {
  test('menu open and close interaction works correctly', async ({ loggedInPage }) => {
    await test.step('menu is closed by default', async () => {
      await loggedInPage.sidebarMenu.expect().toHaveAttribute('aria-hidden', 'true');
    });

    await test.step('opens when the burger button is clicked', async () => {
      await loggedInPage.burgerMenuButton.click();
      await loggedInPage.sidebarMenu.expect().toHaveAttribute('aria-hidden', 'false');
    });

    await test.step('closes when the X button is clicked', async () => {
      await loggedInPage.menuCloseButton.click();
      await loggedInPage.sidebarMenu.expect().toHaveAttribute('aria-hidden', 'true');
    });
  });

  test('all sidebar links are visible when the menu is open', async ({ loggedInPage }) => {
    await test.step('open the sidebar menu', async () => {
      await loggedInPage.burgerMenuButton.click();
    });

    await test.step('All Items link is visible', async () => {
      await loggedInPage.sidebarMenu.allItemsLink.expect().toBeVisible();
    });

    await test.step('About link is visible', async () => {
      await loggedInPage.sidebarMenu.aboutLink.expect().toBeVisible();
    });

    await test.step('Logout link is visible', async () => {
      await loggedInPage.sidebarMenu.logoutLink.expect().toBeVisible();
    });

    await test.step('Reset App State link is visible', async () => {
      await loggedInPage.sidebarMenu.resetLink.expect().toBeVisible();
    });
  });

  test.describe('navigation', () => {
    test('Logout redirects to the login page', async ({ loggedInPage, page }) => {
      await loggedInPage.logout();
      await expect(page).toHaveURL('/');
    });

    test('All Items navigates back to inventory from cart', async ({ loggedInPage, page }) => {
      await loggedInPage.cartLink.click();
      await expect(page).toHaveURL(/cart/u);
      await loggedInPage.burgerMenuButton.click();
      await loggedInPage.sidebarMenu.allItemsLink.click();
      await expect(page).toHaveURL(/inventory/u);
    });

    test('About navigates to the Sauce Labs website', async ({ loggedInPage, page }) => {
      await loggedInPage.burgerMenuButton.click();
      await loggedInPage.sidebarMenu.aboutLink.click();
      await expect(page).toHaveURL(/saucelabs\.com/u);
    });
  });
});
