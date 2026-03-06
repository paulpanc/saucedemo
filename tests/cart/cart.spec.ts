import { test, expect } from '@fixtures/index';

test.describe('Cart', () => {
  test.describe('with items', () => {
    test.beforeEach(async ({ loggedInPage, products }) => {
      await loggedInPage.addToCartButton(products.names[0]).click();
      await loggedInPage.addToCartButton(products.names[1]).click();
      await loggedInPage.cartLink.click();
    });

    test('displays correct items and data', async ({ pageObject, products }) => {
      await test.step('page title is "Your Cart"', async () => {
        await pageObject.cart.pageTitle.expect().toHaveText('Your Cart');
      });

      await test.step('both added products appear in the cart', async () => {
        await expect(
          pageObject.cart.cartItem.locator.filter({ hasText: products.names[0] }),
        ).toBeVisible();
        await expect(
          pageObject.cart.cartItem.locator.filter({ hasText: products.names[1] }),
        ).toBeVisible();
      });

      await test.step('cart shows 2 items', async () => {
        await expect(pageObject.cart.cartItem.locator).toHaveCount(2);
      });

      await test.step('header badge count matches list count', async () => {
        expect(await pageObject.cart.getCartBadgeCount()).toBe(
          await pageObject.cart.cartItem.count(),
        );
      });

      await test.step('first item has correct price and quantity of 1', async () => {
        const items = await pageObject.cart.getCartItems();
        const firstItem = items.find((i) => i.name === products.names[0]);
        expect(firstItem).toBeDefined();
        expect(firstItem?.price).toBeCloseTo(products.prices[0], 2);
        expect(firstItem?.quantity).toBe(1);
      });

      await test.step('all items have non-empty descriptions', async () => {
        const items = await pageObject.cart.getCartItems();
        for (const item of items) {
          expect(item.description.trim().length).toBeGreaterThan(0);
        }
      });
    });

    test('removing items updates cart state correctly', async ({ pageObject, products }) => {
      await test.step('remove first item → item gone, count = 1, badge = 1', async () => {
        await pageObject.cart.removeButton(products.names[0]).click();
        await expect(
          pageObject.cart.cartItem.locator.filter({ hasText: products.names[0] }),
        ).toHaveCount(0);
        await expect(pageObject.cart.cartItem.locator).toHaveCount(1);
        expect(await pageObject.cart.getCartBadgeCount()).toBe(1);
      });

      await test.step('remove last item → cart is empty', async () => {
        await pageObject.cart.removeButton(products.names[1]).click();
        await expect(pageObject.cart.cartItem.locator).toHaveCount(0);
      });
    });

    test('cart navigation options work correctly', async ({ pageObject, loggedInPage, page }) => {
      await test.step('continue shopping returns to inventory', async () => {
        await pageObject.cart.continueShoppingButton.click();
        await expect(page).toHaveURL(/inventory/u);
      });

      await test.step('checkout button proceeds to checkout step one', async () => {
        await loggedInPage.cartLink.click();
        await pageObject.cart.checkoutButton.click();
        await expect(page).toHaveURL(/checkout-step-one/u);
      });
    });
  });

  test.describe('empty cart', () => {
    test.beforeEach(async ({ loggedInPage }) => {
      await loggedInPage.cartLink.click();
    });

    test('empty cart state is correct', async ({ pageObject }) => {
      await test.step('page title is "Your Cart"', async () => {
        await pageObject.cart.pageTitle.expect().toHaveText('Your Cart');
      });

      await test.step('cart has no items', async () => {
        await expect(pageObject.cart.cartItem.locator).toHaveCount(0);
      });

      await test.step('checkout button is visible', async () => {
        await pageObject.cart.checkoutButton.expect().toBeVisible();
      });

      await test.step('cart badge is hidden', async () => {
        await pageObject.cart.cartBadge.expect().toBeHidden();
      });
    });
  });

  test.describe('cart persistence', () => {
    test.beforeEach(async ({ loggedInPage, products }) => {
      await loggedInPage.addToCartButton(products.names[0]).click();
      await loggedInPage.cartLink.click();
    });

    test('cart persists through a navigation round trip', async ({
      pageObject,
      loggedInPage,
      products,
    }) => {
      await test.step('continue shopping → inventory, badge still shows 1', async () => {
        await pageObject.cart.continueShoppingButton.click();
        expect(await loggedInPage.getCartBadgeCount()).toBe(1);
      });

      await test.step('return to cart → item is still present', async () => {
        await loggedInPage.cartLink.click();
        await expect(
          pageObject.cart.cartItem.locator.filter({ hasText: products.names[0] }),
        ).toBeVisible();
      });
    });
  });
});
