import { test, expect } from '@fixtures/index';
import {
  VALID_CHECKOUT_INFO,
  EMPTY_FIRST_NAME_CHECKOUT_INFO,
  EMPTY_LAST_NAME_CHECKOUT_INFO,
  EMPTY_POSTAL_CODE_CHECKOUT_INFO,
} from '@data/checkout-info';
import { BACKPACK_PRODUCT, BIKE_LIGHT_PRODUCT, BOLT_TSHIRT_PRODUCT } from '@data/products';

test.describe('Checkout', () => {
  test.describe('Customer information', () => {
    test.beforeEach(async ({ loggedInPage, pageObject }) => {
      await loggedInPage.addToCartButton(BACKPACK_PRODUCT.name).click();
      await loggedInPage.cartLink.click();
      await pageObject.cart.checkoutButton.click();
    });

    test('displays "Checkout: Your Information" as the page title', async ({ pageObject }) => {
      await pageObject.checkout.pageTitle.expect().toHaveText('Checkout: Your Information');
    });

    test('proceeds to step two with valid information', async ({ pageObject }) => {
      await pageObject.checkout.fillInfo(VALID_CHECKOUT_INFO);
      await pageObject.checkout.continueButton.click();
      await pageObject.checkout.finishButton.expect().toBeVisible();
    });

    test('validates required fields and retains values on failure', async ({ pageObject }) => {
      await test.step('all fields empty → "First Name is required"', async () => {
        await pageObject.checkout.continueButton.click();
        await pageObject.checkout.errorMessage.expect().toBeVisible();
        await pageObject.checkout.errorMessage.expect().toContainText('First Name is required');
        await pageObject.checkout.errorMessage.locator.locator('.error-button').click();
      });

      await test.step('first name missing → "First Name is required"', async () => {
        await pageObject.checkout.fillInfo(EMPTY_FIRST_NAME_CHECKOUT_INFO);
        await pageObject.checkout.continueButton.click();
        await pageObject.checkout.errorMessage.expect().toContainText('First Name is required');
        await pageObject.checkout.errorMessage.locator.locator('.error-button').click();
      });

      await test.step('last name missing → "Last Name is required"', async () => {
        await pageObject.checkout.fillInfo(EMPTY_LAST_NAME_CHECKOUT_INFO);
        await pageObject.checkout.continueButton.click();
        await pageObject.checkout.errorMessage.expect().toContainText('Last Name is required');
        await pageObject.checkout.errorMessage.locator.locator('.error-button').click();
      });

      await test.step('postal code missing → "Postal Code is required"', async () => {
        await pageObject.checkout.fillInfo(EMPTY_POSTAL_CODE_CHECKOUT_INFO);
        await pageObject.checkout.continueButton.click();
        await pageObject.checkout.errorMessage.expect().toContainText('Postal Code is required');
        await pageObject.checkout.errorMessage.locator.locator('.error-button').click();
      });

      await test.step('last name and postal code are retained after a failed attempt', async () => {
        await pageObject.checkout.fillInfo(VALID_CHECKOUT_INFO);
        await pageObject.checkout.firstNameInput.fill('');
        await pageObject.checkout.continueButton.click();
        await pageObject.checkout.lastNameInput.expect().toHaveValue(VALID_CHECKOUT_INFO.lastName);
        await pageObject.checkout.postalCodeInput
          .expect()
          .toHaveValue(VALID_CHECKOUT_INFO.postalCode);
      });
    });

    test('cancel returns to cart page', async ({ pageObject }) => {
      await pageObject.checkout.cancelButton.click();
      await pageObject.cart.pageTitle.expect().toBeVisible();
    });
  });

  test.describe('Order overview', () => {
    test.beforeEach(async ({ loggedInPage, pageObject }) => {
      await loggedInPage.addToCartButton(BACKPACK_PRODUCT.name).click();
      await loggedInPage.cartLink.click();
      await pageObject.cart.checkoutButton.click();
      await pageObject.checkout.fillInfo(VALID_CHECKOUT_INFO);
      await pageObject.checkout.continueButton.click();
    });

    test('order overview shows correct details', async ({ pageObject }) => {
      await test.step('page title is "Checkout: Overview"', async () => {
        await pageObject.checkout.pageTitle.expect().toHaveText('Checkout: Overview');
      });

      await test.step('added item appears in the order', async () => {
        await expect(
          pageObject.checkout.cartItem.locator.filter({ hasText: BACKPACK_PRODUCT.name }),
        ).toBeVisible();
      });

      await test.step('item price matches the inventory price', async () => {
        const items = await pageObject.checkout.getOrderItems();
        const firstItem = items.find((i) => i.name === BACKPACK_PRODUCT.name);
        expect(firstItem?.price).toBeCloseTo(BACKPACK_PRODUCT.price, 2);
      });

      await test.step('tax is greater than zero', async () => {
        const summary = await pageObject.checkout.getOrderSummary();
        expect(summary.tax).toBeGreaterThan(0);
      });

      await test.step('total equals subtotal plus tax', async () => {
        const summary = await pageObject.checkout.getOrderSummary();
        expect(summary.total).toBeCloseTo(summary.itemTotal + summary.tax, 2);
      });
    });

    test('cancel returns to inventory page', async ({ pageObject }) => {
      await pageObject.checkout.cancelButton.click();
      await pageObject.inventory.pageTitle.expect().toBeVisible();
    });

    test('finish button completes the order', async ({ pageObject }) => {
      await pageObject.checkout.finishButton.click();
      await pageObject.checkout.completeHeader.expect().toBeVisible();
    });
  });

  test.describe('Multi-item order', () => {
    test.beforeEach(async ({ loggedInPage, pageObject }) => {
      for (const product of [BACKPACK_PRODUCT, BIKE_LIGHT_PRODUCT, BOLT_TSHIRT_PRODUCT]) {
        await loggedInPage.addToCartButton(product.name).click();
      }
      await loggedInPage.cartLink.click();
      await pageObject.cart.checkoutButton.click();
      await pageObject.checkout.fillInfo(VALID_CHECKOUT_INFO);
      await pageObject.checkout.continueButton.click();
    });

    test('subtotal equals the sum of all item prices', async ({ pageObject }) => {
      const expectedSubtotal =
        BACKPACK_PRODUCT.price + BIKE_LIGHT_PRODUCT.price + BOLT_TSHIRT_PRODUCT.price;
      const summary = await pageObject.checkout.getOrderSummary();
      expect(summary.itemTotal).toBeCloseTo(expectedSubtotal, 2);
    });
  });

  test.describe('Order complete', () => {
    test.beforeEach(async ({ loggedInPage, pageObject }) => {
      await loggedInPage.addToCartButton(BACKPACK_PRODUCT.name).click();
      await loggedInPage.cartLink.click();
      await pageObject.cart.checkoutButton.click();
      await pageObject.checkout.fillInfo(VALID_CHECKOUT_INFO);
      await pageObject.checkout.continueButton.click();
      await pageObject.checkout.finishButton.click();
    });

    test('order completion state is correct', async ({ pageObject, loggedInPage }) => {
      await test.step('shows "Thank you for your order!" header', async () => {
        await pageObject.checkout.completeHeader.expect().toHaveText('Thank you for your order!');
      });

      await test.step('shows dispatched confirmation text', async () => {
        await pageObject.checkout.completeText.expect().toContainText('dispatched');
      });

      await test.step('cart badge is absent on the confirmation page', async () => {
        await pageObject.cart.cartBadge.expect().toBeHidden();
      });

      await test.step('"Back Home" returns to inventory with an empty cart', async () => {
        await pageObject.checkout.backToProductsButton.click();
        await pageObject.inventory.pageTitle.expect().toBeVisible();
        expect(await loggedInPage.getCartBadgeCount()).toBe(0);
      });
    });
  });
});
