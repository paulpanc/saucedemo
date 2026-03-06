import { test as base } from 'playwright-elements';
import { LoginPage } from '@pages/login.page';
import { InventoryPage } from '@pages/inventory.page';
import { CartPage } from '@pages/cart.page';
import { CheckoutPage } from '@pages/checkout.page';
import { STANDARD_USER } from '@data/users';

type ProductsData = {
  names: string[];
  prices: number[];
  count: number;
};

type TestFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  loggedInPage: InventoryPage;
  products: ProductsData;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({}, use) => {
    await use(new LoginPage());
  },

  inventoryPage: async ({}, use) => {
    await use(new InventoryPage());
  },

  cartPage: async ({}, use) => {
    await use(new CartPage());
  },

  checkoutPage: async ({}, use) => {
    await use(new CheckoutPage());
  },

  loggedInPage: async ({}, use) => {
    const loginPage = new LoginPage();
    await loginPage.goto();
    await loginPage.login(STANDARD_USER.username, STANDARD_USER.password);
    await use(new InventoryPage());
  },

  products: async ({ loggedInPage }, use) => {
    const names = await loggedInPage.inventoryItem.name.allInnerTexts();
    const prices = await loggedInPage.getProductPrices();
    await use({ names, prices, count: names.length });
  },
});

export { expect } from 'playwright-elements';
