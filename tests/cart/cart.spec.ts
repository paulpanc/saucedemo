import { test, expect } from '@fixtures/index';

test.describe('Cart', () => {
  test.describe('with items', () => {
    test.beforeEach(async ({ loggedInPage, products }) => {
      await loggedInPage.addToCartButton(products.names[0]).click();
      await loggedInPage.addToCartButton(products.names[1]).click();
      await loggedInPage.cartLink.click();
    });

    test('displays correct items and data', async ({ cartPage, products }) => {
      await test.step('page title is "Your Cart"', async () => {
        await cartPage.pageTitle.expect().toHaveText('Your Cart');
      });

      await test.step('both added products appear in the cart', async () => {
        await expect(cartPage.cartItem.locator.filter({ hasText: products.names[0] })).toBeVisible();
        await expect(cartPage.cartItem.locator.filter({ hasText: products.names[1] })).toBeVisible();
      });

      await test.step('cart shows 2 items', async () => {
        await expect(cartPage.cartItem.locator).toHaveCount(2);
      });

      await test.step('header badge count matches list count', async () => {
        expect(await cartPage.getCartBadgeCount()).toBe(await cartPage.cartItem.count());
      });

      await test.step('first item has correct price and quantity of 1', async () => {
        const items = await cartPage.getCartItems();
        const firstItem = items.find(i => i.name === products.names[0]);
        expect(firstItem).toBeDefined();
        expect(firstItem?.price).toBeCloseTo(products.prices[0], 2);
        expect(firstItem?.quantity).toBe(1);
      });

      await test.step('all items have non-empty descriptions', async () => {
        const items = await cartPage.getCartItems();
        for (const item of items) {
          expect(item.description.trim().length).toBeGreaterThan(0);
        }
      });
    });

    test('removing items updates cart state correctly', async ({ cartPage, products }) => {
      await test.step('remove first item → item gone, count = 1, badge = 1', async () => {
        await cartPage.removeButton(products.names[0]).click();
        await expect(cartPage.cartItem.locator.filter({ hasText: products.names[0] })).toHaveCount(0);
        await expect(cartPage.cartItem.locator).toHaveCount(1);
        expect(await cartPage.getCartBadgeCount()).toBe(1);
      });

      await test.step('remove last item → cart is empty', async () => {
        await cartPage.removeButton(products.names[1]).click();
        await expect(cartPage.cartItem.locator).toHaveCount(0);
      });
    });

    test('cart navigation options work correctly', async ({ cartPage, loggedInPage, page }) => {
      await test.step('continue shopping returns to inventory', async () => {
        await cartPage.continueShoppingButton.click();
        await expect(page).toHaveURL(/inventory/u);
      });

      await test.step('checkout button proceeds to checkout step one', async () => {
        await loggedInPage.cartLink.click();
        await cartPage.checkoutButton.click();
        await expect(page).toHaveURL(/checkout-step-one/u);
      });
    });
  });

  test.describe('empty cart', () => {
    test.beforeEach(async ({ loggedInPage }) => {
      await loggedInPage.cartLink.click();
    });

    test('empty cart state is correct', async ({ cartPage }) => {
      await test.step('page title is "Your Cart"', async () => {
        await cartPage.pageTitle.expect().toHaveText('Your Cart');
      });

      await test.step('cart has no items', async () => {
        await expect(cartPage.cartItem.locator).toHaveCount(0);
      });

      await test.step('checkout button is visible', async () => {
        await cartPage.checkoutButton.expect().toBeVisible();
      });

      await test.step('cart badge is hidden', async () => {
        await cartPage.cartBadge.expect().toBeHidden();
      });
    });
  });

  test.describe('cart persistence', () => {
    test.beforeEach(async ({ loggedInPage, products }) => {
      await loggedInPage.addToCartButton(products.names[0]).click();
      await loggedInPage.cartLink.click();
    });

    test('cart persists through a navigation round trip', async ({
      cartPage,
      loggedInPage,
      products,
    }) => {
      await test.step('continue shopping → inventory, badge still shows 1', async () => {
        await cartPage.continueShoppingButton.click();
        expect(await loggedInPage.getCartBadgeCount()).toBe(1);
      });

      await test.step('return to cart → item is still present', async () => {
        await loggedInPage.cartLink.click();
        await expect(cartPage.cartItem.locator.filter({ hasText: products.names[0] })).toBeVisible();
      });
    });
  });
});
