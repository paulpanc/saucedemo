import { expect, test } from '@fixtures/index';
import { SortOption } from '@pages/inventory.page';

test.describe('Inventory', () => {
  test('displays "Products" as the page title', async ({ loggedInPage }) => {
    await loggedInPage.pageTitle.expect().toHaveText('Products');
  });

  test('product catalog is populated without duplicates', async ({ loggedInPage, products }) => {
    await test.step('product count is greater than zero', async () => {
      expect(products.count).toBeGreaterThan(0);
    });

    await test.step('each product name appears exactly once', async () => {
      const names = await loggedInPage.inventoryItem.name.allInnerTexts();
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(products.count);
    });
  });

  test('product catalog data is valid', async ({ loggedInPage, products }) => {
    await test.step('all product names are non-empty strings', async () => {
      const names = await loggedInPage.inventoryItem.name.allInnerTexts();
      for (const name of names) {
        expect(name.trim().length).toBeGreaterThan(0);
      }
    });

    await test.step('all product prices are positive numbers', async () => {
      const prices = await loggedInPage.getProductPrices();
      for (const price of prices) {
        expect(price).toBeGreaterThan(0);
      }
    });

    await test.step('each product card has a non-empty image src', async () => {
      for (let i = 0; i < products.count; i++) {
        const details = await loggedInPage.getProductDetails(i);
        expect(details.imageUrl.trim().length).toBeGreaterThan(0);
      }
    });

    await test.step('each product card has a non-empty description', async () => {
      for (let i = 0; i < products.count; i++) {
        const details = await loggedInPage.getProductDetails(i);
        expect(details.description.trim().length).toBeGreaterThan(0);
      }
    });
  });

  test('cart add/remove cycle updates badge and button states', async ({
    loggedInPage,
    products,
  }) => {
    await test.step('badge is hidden on fresh login', async () => {
      await loggedInPage.cartBadge.expect().toBeHidden();
    });

    await test.step('add first product → badge = 1, remove button visible, add button hidden', async () => {
      await loggedInPage.addToCartButton(products.names[0]).click();
      expect(await loggedInPage.getCartBadgeCount()).toBe(1);
      await loggedInPage.removeFromCartButton(products.names[0]).expect().toBeVisible();
      await loggedInPage.addToCartButton(products.names[0]).expect().toBeHidden();
    });

    await test.step('add second product → badge = 2', async () => {
      await loggedInPage.addToCartButton(products.names[1]).click();
      expect(await loggedInPage.getCartBadgeCount()).toBe(2);
    });

    await test.step('remove first product → badge = 1', async () => {
      await loggedInPage.removeFromCartButton(products.names[0]).click();
      expect(await loggedInPage.getCartBadgeCount()).toBe(1);
    });

    await test.step('remove last product → badge hidden', async () => {
      await loggedInPage.removeFromCartButton(products.names[1]).click();
      await loggedInPage.cartBadge.expect().toBeHidden();
    });

    await test.step('add all products → badge equals total product count', async () => {
      for (const name of products.names) {
        await loggedInPage.addToCartButton(name).click();
      }
      expect(await loggedInPage.getCartBadgeCount()).toBe(products.count);
    });
  });

  test('products can be sorted by name and price', async ({ loggedInPage, products }) => {
    await test.step('sort dropdown is visible and enabled', async () => {
      await loggedInPage.sortDropdown.expect().toBeVisible();
      await loggedInPage.sortDropdown.expect().toBeEnabled();
    });

    await test.step('A → Z sorts names alphabetically ascending', async () => {
      await loggedInPage.sortDropdown.selectOption(SortOption.AZ);
      const names = await loggedInPage.inventoryItem.name.allInnerTexts();
      expect(names).toEqual([...names].sort());
      await expect(loggedInPage.inventoryItem.locator).toHaveCount(products.count);
    });

    await test.step('Z → A sorts names alphabetically descending', async () => {
      await loggedInPage.sortDropdown.selectOption(SortOption.ZA);
      const names = await loggedInPage.inventoryItem.name.allInnerTexts();
      expect(names).toEqual([...names].sort().reverse());
      await expect(loggedInPage.inventoryItem.locator).toHaveCount(products.count);
    });

    await test.step('price low → high sorts prices ascending', async () => {
      await loggedInPage.sortDropdown.selectOption(SortOption.LOHI);
      const prices = await loggedInPage.getProductPrices();
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
      await expect(loggedInPage.inventoryItem.locator).toHaveCount(products.count);
    });

    await test.step('price high → low sorts prices descending', async () => {
      await loggedInPage.sortDropdown.selectOption(SortOption.HILO);
      const prices = await loggedInPage.getProductPrices();
      expect(prices).toEqual([...prices].sort((a, b) => b - a));
      await expect(loggedInPage.inventoryItem.locator).toHaveCount(products.count);
    });
  });

  test('navigating to a product detail page works correctly', async ({
    loggedInPage,
    products,
    pageObject,
  }) => {
    await test.step('clicking product name navigates to the detail page', async () => {
      await loggedInPage.inventoryItem.name.first().click();
      await pageObject.inventory.cartLink.expect().toBeVisible();
    });

    await test.step('detail page shows the name of the clicked product', async () => {
      await pageObject.inventory.inventoryItem.name.expect().toHaveText(products.names[0]);
    });
  });

  test('navigates to cart page via cart icon', async ({ loggedInPage, pageObject }) => {
    await loggedInPage.cartLink.click();
    await pageObject.cart.pageTitle.expect().toBeVisible();
  });

  test('logs out and redirects to login page', async ({ loggedInPage, pageObject }) => {
    await loggedInPage.logout();
    await pageObject.login.loginButton.expect().toBeVisible();
  });
});
