import type { PageObject } from 'playwright-elements';
import { test as base, buildPageObject } from 'playwright-elements';
import * as pageObjectModule from '../pages';
import { InventoryPage } from '@pages/inventory.page';
import { STANDARD_USER } from '@data/users';

type TestFixtures = {
  pageObject: PageObject<typeof pageObjectModule>;
  loggedInPage: InventoryPage;
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
});

export { expect } from 'playwright-elements';
