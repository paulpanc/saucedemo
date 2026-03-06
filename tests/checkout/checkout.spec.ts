import { test, expect } from '@fixtures/index';
import {
  VALID_CHECKOUT_INFO,
  EMPTY_FIRST_NAME_CHECKOUT_INFO,
  EMPTY_LAST_NAME_CHECKOUT_INFO,
  EMPTY_POSTAL_CODE_CHECKOUT_INFO,
} from '@data/checkout-info';

test.describe('Checkout', () => {
  test.describe('Customer information', () => {
    test.beforeEach(async ({ loggedInPage, cartPage, products }) => {
      await loggedInPage.addToCartButton(products.names[0]).click();
      await loggedInPage.cartLink.click();
      await cartPage.checkoutButton.click();
    });

    test('displays "Checkout: Your Information" as the page title', async ({ checkoutPage }) => {
      await checkoutPage.pageTitle.expect().toHaveText('Checkout: Your Information');
    });

    test('proceeds to step two with valid information', async ({ checkoutPage, page }) => {
      await checkoutPage.fillInfo(VALID_CHECKOUT_INFO);
      await checkoutPage.continueButton.click();
      await expect(page).toHaveURL(/checkout-step-two/u);
    });

    test('validates required fields and retains values on failure', async ({ checkoutPage }) => {
      await test.step('all fields empty → "First Name is required"', async () => {
        await checkoutPage.continueButton.click();
        await checkoutPage.errorMessage.expect().toBeVisible();
        await checkoutPage.errorMessage.expect().toContainText('First Name is required');
        await checkoutPage.errorMessage.locator.locator('.error-button').click();
      });

      await test.step('first name missing → "First Name is required"', async () => {
        await checkoutPage.fillInfo(EMPTY_FIRST_NAME_CHECKOUT_INFO);
        await checkoutPage.continueButton.click();
        await checkoutPage.errorMessage.expect().toContainText('First Name is required');
        await checkoutPage.errorMessage.locator.locator('.error-button').click();
      });

      await test.step('last name missing → "Last Name is required"', async () => {
        await checkoutPage.fillInfo(EMPTY_LAST_NAME_CHECKOUT_INFO);
        await checkoutPage.continueButton.click();
        await checkoutPage.errorMessage.expect().toContainText('Last Name is required');
        await checkoutPage.errorMessage.locator.locator('.error-button').click();
      });

      await test.step('postal code missing → "Postal Code is required"', async () => {
        await checkoutPage.fillInfo(EMPTY_POSTAL_CODE_CHECKOUT_INFO);
        await checkoutPage.continueButton.click();
        await checkoutPage.errorMessage.expect().toContainText('Postal Code is required');
        await checkoutPage.errorMessage.locator.locator('.error-button').click();
      });

      await test.step('last name and postal code are retained after a failed attempt', async () => {
        await checkoutPage.fillInfo(VALID_CHECKOUT_INFO);
        await checkoutPage.firstNameInput.fill('');
        await checkoutPage.continueButton.click();
        await checkoutPage.lastNameInput.expect().toHaveValue(VALID_CHECKOUT_INFO.lastName);
        await checkoutPage.postalCodeInput.expect().toHaveValue(VALID_CHECKOUT_INFO.postalCode);
      });
    });

    test('cancel returns to cart page', async ({ checkoutPage, page }) => {
      await checkoutPage.cancelButton.click();
      await expect(page).toHaveURL(/cart/u);
    });
  });

  test.describe('Order overview', () => {
    test.beforeEach(async ({ loggedInPage, cartPage, checkoutPage, products }) => {
      await loggedInPage.addToCartButton(products.names[0]).click();
      await loggedInPage.cartLink.click();
      await cartPage.checkoutButton.click();
      await checkoutPage.fillInfo(VALID_CHECKOUT_INFO);
      await checkoutPage.continueButton.click();
    });

    test('order overview shows correct details', async ({ checkoutPage, products }) => {
      await test.step('page title is "Checkout: Overview"', async () => {
        await checkoutPage.pageTitle.expect().toHaveText('Checkout: Overview');
      });

      await test.step('added item appears in the order', async () => {
        await expect(
          checkoutPage.cartItem.locator.filter({ hasText: products.names[0] }),
        ).toBeVisible();
      });

      await test.step('item price matches the inventory price', async () => {
        const items = await checkoutPage.getOrderItems();
        const firstItem = items.find(i => i.name === products.names[0]);
        expect(firstItem?.price).toBeCloseTo(products.prices[0], 2);
      });

      await test.step('tax is greater than zero', async () => {
        const summary = await checkoutPage.getOrderSummary();
        expect(summary.tax).toBeGreaterThan(0);
      });

      await test.step('total equals subtotal plus tax', async () => {
        const summary = await checkoutPage.getOrderSummary();
        expect(summary.total).toBeCloseTo(summary.itemTotal + summary.tax, 2);
      });
    });

    test('cancel returns to inventory page', async ({ checkoutPage, page }) => {
      await checkoutPage.cancelButton.click();
      await expect(page).toHaveURL(/inventory/u);
    });

    test('finish button completes the order', async ({ checkoutPage, page }) => {
      await checkoutPage.finishButton.click();
      await expect(page).toHaveURL(/checkout-complete/u);
    });
  });

  test.describe('Multi-item order', () => {
    test.beforeEach(async ({ loggedInPage, cartPage, checkoutPage, products }) => {
      for (const name of products.names.slice(0, 3)) {
        await loggedInPage.addToCartButton(name).click();
      }
      await loggedInPage.cartLink.click();
      await cartPage.checkoutButton.click();
      await checkoutPage.fillInfo(VALID_CHECKOUT_INFO);
      await checkoutPage.continueButton.click();
    });

    test('subtotal equals the sum of all item prices', async ({ checkoutPage, products }) => {
      const expectedSubtotal = products.prices.slice(0, 3).reduce((sum, p) => sum + p, 0);
      const summary = await checkoutPage.getOrderSummary();
      expect(summary.itemTotal).toBeCloseTo(expectedSubtotal, 2);
    });
  });

  test.describe('Order complete', () => {
    test.beforeEach(async ({ loggedInPage, cartPage, checkoutPage, products }) => {
      await loggedInPage.addToCartButton(products.names[0]).click();
      await loggedInPage.cartLink.click();
      await cartPage.checkoutButton.click();
      await checkoutPage.fillInfo(VALID_CHECKOUT_INFO);
      await checkoutPage.continueButton.click();
      await checkoutPage.finishButton.click();
    });

    test('order completion state is correct', async ({
      checkoutPage,
      cartPage,
      loggedInPage,
      page,
    }) => {
      await test.step('shows "Thank you for your order!" header', async () => {
        await checkoutPage.completeHeader.expect().toHaveText('Thank you for your order!');
      });

      await test.step('shows dispatched confirmation text', async () => {
        await checkoutPage.completeText.expect().toContainText('dispatched');
      });

      await test.step('cart badge is absent on the confirmation page', async () => {
        await cartPage.cartBadge.expect().toBeHidden();
      });

      await test.step('"Back Home" returns to inventory with an empty cart', async () => {
        await checkoutPage.backToProductsButton.click();
        await expect(page).toHaveURL(/inventory/u);
        expect(await loggedInPage.getCartBadgeCount()).toBe(0);
      });
    });
  });
});
