import type { PageObject } from 'playwright-elements';
import { test as base, buildPageObject } from 'playwright-elements';
import * as pageObjectModule from '../pages';
import { InventoryPage } from '@pages/inventory.page';
import { STANDARD_USER } from '@data/users';

type ProductsData = {
  names: string[];
  prices: number[];
  count: number;
};

type TestFixtures = {
  pageObject: PageObject<typeof pageObjectModule>;
  loggedInPage: InventoryPage;
  products: ProductsData;
};

export const test = base.extend<TestFixtures>({
  pageObject: async ({}, use) => {
    await use(buildPageObject(pageObjectModule));
  },

  loggedInPage: async ({ pageObject }, use) => {
    await pageObject.login.goto();
    await pageObject.login.login(STANDARD_USER.username, STANDARD_USER.password);
    await use(new InventoryPage());
  },

  products: async ({ loggedInPage }, use) => {
    const names = await loggedInPage.inventoryItem.name.allInnerTexts();
    const prices = await loggedInPage.getProductPrices();
    await use({ names, prices, count: names.length });
  },
});

export { expect } from 'playwright-elements';
