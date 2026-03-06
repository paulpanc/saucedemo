# Saucedemo E2E Test Automation Framework

End-to-end test automation framework for [saucedemo.com](https://www.saucedemo.com), an e-commerce demo application. Built with **TypeScript**, **Playwright**, and **playwright-elements**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture & Design Patterns](#architecture--design-patterns)
  - [Page Object Model](#page-object-model)
  - [Lazy Element Initialisation](#lazy-element-initialisation)
  - [Custom Fixtures](#custom-fixtures)
  - [Static Test Data](#static-test-data)
  - [Test Structure — Steps over Small Tests](#test-structure--steps-over-small-tests)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Pipeline](#cicd-pipeline)
  - [Triggers](#triggers)
  - [Jobs](#jobs)
  - [GitHub Pages Report](#github-pages-report)
- [Code Quality](#code-quality)
  - [Linting](#linting)
  - [Formatting](#formatting)
  - [Pre-commit Hooks](#pre-commit-hooks)
- [Assumptions](#assumptions)
- [Limitations & Known Constraints](#limitations--known-constraints)

---

## Tech Stack

| Tool                                                                             | Version | Purpose                                    |
| -------------------------------------------------------------------------------- | ------- | ------------------------------------------ |
| [Playwright](https://playwright.dev)                                             | ^1.50   | Browser automation & test runner           |
| [playwright-elements](https://www.npmjs.com/package/playwright-elements)         | ^1.18   | Lazy-initialised web elements & fluent API |
| [TypeScript](https://www.typescriptlang.org)                                     | ^5.7    | Language                                   |
| [ESLint](https://eslint.org) + [typescript-eslint](https://typescript-eslint.io) | ^9 / ^8 | Static analysis                            |
| [Prettier](https://prettier.io)                                                  | ^3.8    | Code formatting                            |
| [Husky](https://typicode.github.io/husky)                                        | ^9      | Git hooks                                  |
| [lint-staged](https://github.com/lint-staged/lint-staged)                        | ^16     | Run checks on staged files only            |
| [Monocart Reporter](https://github.com/cenfun/monocart-reporter)                 | ^2.9    | HTML test report with coverage             |
| [GitHub Actions](https://docs.github.com/en/actions)                             | —       | CI/CD                                      |
| [GitHub Pages](https://pages.github.com)                                         | —       | Report hosting                             |

---

## Project Structure

```
saucedemo/
├── src/
│   ├── data/                     # Static test data constants
│   │   ├── checkout-info.ts      # Checkout form data (valid / invalid combinations)
│   │   ├── products.ts           # Product catalogue (names, prices, helpers)
│   │   └── users.ts              # All known user accounts
│   ├── fixtures/
│   │   └── index.ts              # Custom Playwright fixtures
│   └── pages/                    # Page Object classes
│       ├── base.page.ts          # Abstract base — navigation helper
│       ├── login.page.ts
│       ├── inventory.page.ts
│       ├── cart.page.ts
│       └── checkout.page.ts
├── tests/
│   ├── auth/
│   │   └── login.spec.ts
│   ├── inventory/
│   │   ├── inventory.spec.ts
│   │   └── burger-menu.spec.ts
│   ├── cart/
│   │   └── cart.spec.ts
│   ├── checkout/
│   │   └── checkout.spec.ts
│   └── demo/
│       ├── demo-broken.spec.ts   # Intentionally failing test (demo purposes)
│       └── demo-working.spec.ts  # Simple passing test (demo purposes)
├── .github/
│   ├── scripts/
│   │   └── generate-report-index.py  # Builds the Pages landing page
│   └── workflows/
│       └── ci.yml                # Lint → Test (matrix) → Deploy report
├── .husky/
│   └── pre-commit                # Runs lint-staged before every commit
├── .nvmrc                        # Pinned Node.js version
├── .prettierrc                   # Prettier configuration
├── playwright.config.ts
├── tsconfig.json
└── eslint.config.mjs
```

### Path aliases

TypeScript path aliases (configured in `tsconfig.json`) keep imports clean across the project:

| Alias         | Maps to          |
| ------------- | ---------------- |
| `@pages/*`    | `src/pages/*`    |
| `@fixtures/*` | `src/fixtures/*` |
| `@data/*`     | `src/data/*`     |

---

## Architecture & Design Patterns

### Page Object Model

Every page of the application is represented by a dedicated class that extends `BasePage`. Each class exposes:

- **Element locators** — `readonly` fields using `$()` from `playwright-elements`.
- **Complex action methods** — multi-step operations (e.g. `login()`, `fillInfo()`, `logout()`) or methods that contain conditional logic or data transformation (e.g. `getCartBadgeCount()`, `getProductPrices()`).

Single-operation wrappers (a method that only calls `.click()` or returns `.innerText()` on a single element) are intentionally absent. Tests interact with exposed element locators directly, which keeps page objects lean and pushes the assertion intent into the test layer where it belongs.

```
BasePage (abstract)
├── LoginPage
├── InventoryPage
├── CartPage
└── CheckoutPage
```

**`BasePage`** provides a single protected helper, `navigate(path)`, which delegates to `BrowserInstance.currentPage.goto()`. All public page-level abstractions live in the concrete subclasses.

---

### Lazy Element Initialisation

Elements are defined using `$()` from `playwright-elements`. A `WebElement` wraps a Playwright `Locator` and is **lazily resolved** — it only binds to the active page when an action is called on it, not at class instantiation time.

This eliminates the need to pass a `page` parameter to page object constructors and means a single page object instance is safe to reuse across test steps, even after navigations.

Compound elements (groups of related sub-elements scoped to a parent) use `.with()`:

```typescript
readonly inventoryItem = $('.inventory_item').with({
  name:        $('.inventory_item_name'),
  description: $('.inventory_item_desc'),
  price:       $('.inventory_item_price'),
  image:       $('.inventory_item_img img'),
});

readonly sidebarMenu = $('.bm-menu-wrap').with({
  allItemsLink: $('#inventory_sidebar_link'),
  aboutLink:    $('#about_sidebar_link'),
  logoutLink:   $('#logout_sidebar_link'),
  resetLink:    $('#reset_sidebar_link'),
});
```

Sub-elements are scoped to their parent, so `inventoryItem.name` refers to `.inventory_item_name` _inside_ `.inventory_item`.

`WebElement` also exposes `.expect()` which returns a `LocatorAssertions` object, enabling auto-retried Playwright assertions directly on elements:

```typescript
await loginPage.errorMessage.expect().toBeVisible();
await cartPage.cartBadge.expect().toBeHidden();
```

---

### Custom Fixtures

`src/fixtures/index.ts` extends `playwright-elements`'s `test` base using `buildPageObject`, which automatically instantiates all exported page classes from `src/pages/index.ts` and exposes them under a single `pageObject` fixture keyed by page name:

| Fixture        | Type                       | Description                                                                                                                       |
| -------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `pageObject`   | `PageObject<typeof pages>` | Combined object exposing all page instances: `pageObject.login`, `pageObject.inventory`, `pageObject.cart`, `pageObject.checkout` |
| `loggedInPage` | `InventoryPage`            | Navigates to `/`, logs in as `STANDARD_USER`, resolves to an `InventoryPage`                                                      |

Tests declare only the fixtures they need — Playwright handles setup and teardown automatically:

```typescript
test('...', async ({ loggedInPage, pageObject }) => { ... });
```

---

### Static Test Data

All test data is defined as individually named exports in `src/data/`. This avoids generic Record lookups (e.g. `USERS['standard']`) in favour of explicit, type-safe constants that are easy to import and discover.

**`src/data/users.ts`** — one export per user account:

```typescript
export const STANDARD_USER: User = { username: 'standard_user', password: 'secret_sauce' };
export const LOCKED_USER: User = { username: 'locked_out_user', password: 'secret_sauce' };
// PROBLEM_USER, PERFORMANCE_GLITCH_USER, ERROR_USER, VISUAL_USER …
```

**`src/data/products.ts`** — all six catalogue items hardcoded in default A→Z order, plus helpers:

```typescript
export const BACKPACK_PRODUCT: Product = { name: 'Sauce Labs Backpack', price: 29.99 };
export const BIKE_LIGHT_PRODUCT: Product = { name: 'Sauce Labs Bike Light', price: 9.99 };
export const BOLT_TSHIRT_PRODUCT: Product = { name: 'Sauce Labs Bolt T-Shirt', price: 15.99 };
// FLEECE_JACKET_PRODUCT, ONESIE_PRODUCT, RED_TSHIRT_PRODUCT …

export const ALL_PRODUCTS: Product[] = [
  /* all six in order */
];
export const PRODUCT_COUNT = ALL_PRODUCTS.length; // 6
```

**`src/data/checkout-info.ts`** — one export per form-fill scenario:

```typescript
export const VALID_CHECKOUT_INFO: CheckoutInfo = {
  firstName: 'John',
  lastName: 'Doe',
  postalCode: '12345',
};
export const EMPTY_FIRST_NAME_CHECKOUT_INFO: CheckoutInfo = {
  firstName: '',
  lastName: 'Doe',
  postalCode: '12345',
};
// EMPTY_LAST_NAME_CHECKOUT_INFO, EMPTY_POSTAL_CODE_CHECKOUT_INFO …
```

Tests import exactly what they need:

```typescript
import { BACKPACK_PRODUCT, BIKE_LIGHT_PRODUCT } from '@data/products';
import { VALID_CHECKOUT_INFO } from '@data/checkout-info';
```

---

### Test Structure — Steps over Small Tests

Related assertions that form a natural sequential flow are grouped into a single `test()` using `test.step()` rather than being split into many small independent tests. This produces richer, hierarchical report output and makes the intent of each scenario immediately clear.

```typescript
test('cart add/remove cycle updates badge and button states', async ({ loggedInPage }) => {
  await test.step('badge is hidden on fresh login', async () => { ... });
  await test.step('add first product → badge = 1, remove button visible', async () => { ... });
  await test.step('remove last product → badge hidden', async () => { ... });
});
```

Genuinely independent scenarios (e.g. the parametrised user-type loop in `login.spec.ts`, and each navigation destination in `burger-menu.spec.ts`) remain as separate `test()` calls so a failure in one does not suppress results for others.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) — version is pinned in `.nvmrc` (install with [nvm](https://github.com/nvm-sh/nvm))
- [npm](https://www.npmjs.com) — bundled with Node.js

```bash
nvm install   # reads .nvmrc
nvm use
```

### Installation

```bash
npm install
npx playwright install --with-deps
```

`npm install` also runs `husky` via the `prepare` script, which installs the pre-commit hook automatically.

### Running Tests

| Command                  | Description                             |
| ------------------------ | --------------------------------------- |
| `npm test`               | All tests, all browsers (headless)      |
| `npm run test:headed`    | All tests with a visible browser window |
| `npm run test:ui`        | Interactive Playwright UI mode          |
| `npm run test:debug`     | Step-through debugger                   |
| `npm run test:auth`      | Login suite only                        |
| `npm run test:inventory` | Inventory + burger menu suites          |
| `npm run test:cart`      | Cart suite only                         |
| `npm run test:checkout`  | Checkout suite only                     |
| `npm run report`         | Open the last Monocart HTML report      |

To run a single browser:

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project=mobile-chrome
npx playwright test --project=mobile-safari
```

---

## Test Coverage

| Suite           | File                                  | Scenarios                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Login**       | `tests/auth/login.spec.ts`            | Valid login; page load state; credential validation (empty fields, wrong credentials, case sensitivity, locked user); error icon/message lifecycle; all non-locked user types                                                                                                                                                                                                                                          |
| **Inventory**   | `tests/inventory/inventory.spec.ts`   | Page title; catalog populated without duplicates; data validity (names, prices, images, descriptions); cart add/remove lifecycle; badge state; sort (A→Z, Z→A, price asc/desc, dropdown stability); product detail navigation; cart icon; logout                                                                                                                                                                       |
| **Burger menu** | `tests/inventory/burger-menu.spec.ts` | Open/close interaction; all sidebar links visible; navigation (Logout, All Items, About)                                                                                                                                                                                                                                                                                                                               |
| **Cart**        | `tests/cart/cart.spec.ts`             | Items displayed with correct data; item removal updates count and badge; cart navigation (continue shopping, checkout); empty cart state; cart persists through navigation round trip                                                                                                                                                                                                                                  |
| **Checkout**    | `tests/checkout/checkout.spec.ts`     | Step one: page title, valid form proceeds, required-field validation (all combinations), field retention on failure, cancel returns to cart; Step two (single item): overview correctness (title, item, price, tax, total); cancel returns to inventory; finish navigates to complete; Step two (multi-item): subtotal calculation; Order complete: confirmation copy, badge absent, back to inventory with empty cart |

---

## CI/CD Pipeline

The pipeline is defined in `.github/workflows/ci.yml`.

### Triggers

| Event               | Condition                                          |
| ------------------- | -------------------------------------------------- |
| `pull_request`      | Targets the `main` branch — runs **chromium only** |
| `workflow_dispatch` | Manual — choose browser and test suite             |

A top-level `concurrency` group (`ci-${{ github.ref }}`) cancels any in-progress run for the same ref when a new one is triggered.

### Jobs

```
lint ──► test (matrix) ──► deploy-report
```

**`lint`**
Runs `eslint .` against all TypeScript sources.

**`test`** _(matrix)_
Runs across browser projects: `chromium`, `firefox`, `webkit`, `mobile-chrome`, `mobile-safari`. On `pull_request` events only `chromium` runs. On `workflow_dispatch` the matrix can be filtered to a single browser or test suite via the manual inputs. Each job uploads its `test-results/` folder as an artifact named `playwright-report-{browser}`, retained for 3 days.

**`deploy-report`**
Skipped on `pull_request` events (GitHub Pages only allows deployments from the default branch). Runs after all matrix jobs complete on other triggers. It:

1. Checks out the repository (to access `.github/scripts/`)
2. Downloads every `playwright-report-*` artifact
3. Copies each into `report/{browser}/`
4. Runs `.github/scripts/generate-report-index.py` to build a `report/index.html` landing page that links to each browser report and includes the run number, commit SHA, and a direct link back to the Actions run
5. Deploys the whole `report/` directory to GitHub Pages

A dedicated `concurrency` group (`group: pages`, `cancel-in-progress: false`) serialises concurrent deployments so parallel runs queue rather than race.

### GitHub Pages Report

After a successful run, the test report is available at:

```
https://<org>.github.io/<repo>/
```

Each browser has its own Monocart HTML report at `/<browser>/index.html`.

**One-time setup required**: in the repository settings go to **Settings → Pages** and set the source to **"GitHub Actions"**.

---

## Code Quality

### Linting

ESLint is configured in `eslint.config.mjs` with `typescript-eslint`. Key enforced rules:

| Rule                                               | Effect                                               |
| -------------------------------------------------- | ---------------------------------------------------- |
| `@typescript-eslint/no-explicit-any`               | `error` — bans `any` type                            |
| `@typescript-eslint/explicit-function-return-type` | `warn` — functions must declare return types         |
| `@typescript-eslint/consistent-type-imports`       | `error` — enforces `import type` where possible      |
| `prefer-const` / `no-var`                          | `error` — modern variable declarations only          |
| `eqeqeq`                                           | `error` — strict equality (`===`) required           |
| `curly`                                            | `error` — braces required on all control-flow bodies |

```bash
npm run lint        # report errors
npm run lint:fix    # auto-fix where possible
```

### Formatting

[Prettier](https://prettier.io) is configured in `.prettierrc` (single quotes, trailing commas, 100-char print width).

```bash
npm run format        # format all files in place
npm run format:check  # check formatting without writing
```

### Pre-commit Hooks

[Husky](https://typicode.github.io/husky) installs a `pre-commit` hook (`.husky/pre-commit`) that runs [lint-staged](https://github.com/lint-staged/lint-staged) before every commit:

| Staged file pattern    | Steps run                           |
| ---------------------- | ----------------------------------- |
| `*.{ts,mjs}`           | `eslint --fix` → `prettier --check` |
| `*.{json,yml,yaml,md}` | `prettier --check`                  |

`eslint --fix` auto-corrects fixable lint errors and re-stages the result. `prettier --check` **fails the commit** if any staged file is not formatted — run `npm run format` and re-stage before retrying.

---

## Assumptions

- **Application availability** — the tests run against the live public instance at `https://www.saucedemo.com`. There is no local mock server. A network failure or temporary outage at that URL will cause all tests to fail.

- **Standard user is a valid baseline** — `STANDARD_USER` (`standard_user`) is used for authentication in all tests that require login. It is assumed this account always exists and can access all features without restrictions.

- **Product catalogue is stable** — product names and prices are hardcoded in `src/data/products.ts` based on the live catalogue at the time of writing. If saucedemo.com changes its product catalogue, the hardcoded constants and any test assertions that reference specific names or prices will need to be updated.

- **Credentials are publicly known** — all user credentials (`secret_sauce`, etc.) are the documented demo credentials for saucedemo.com and are safe to commit to source control.

- **GitHub Pages is pre-enabled** — the `deploy-report` job assumes the repository has GitHub Pages configured with "GitHub Actions" as the source. Without this setting the deployment step will fail.

---

## Limitations & Known Constraints

### Test isolation

Tests rely on Playwright's per-test browser context for isolation. State is not explicitly reset between tests through the application (e.g. clearing cookies via the API); instead each test navigates to the desired starting state as part of its setup. The `resetAppState` action in the burger menu tests uses the application's own reset mechanism to clear the cart.

### No API-layer setup

There is no API or database layer available for saucedemo.com, so all pre-conditions (adding items to cart, navigating to a page) are performed through the UI. This makes setup steps longer than they would be with an API shortcut.

### `getCartBadgeCount()` uses a snapshot check

`InventoryPage.getCartBadgeCount()` and `CartPage.getCartBadgeCount()` internally call `Locator.isVisible()`, which is a point-in-time snapshot with no auto-retry. In rare cases where the badge has not yet rendered after an add-to-cart action, these methods may return `0` incorrectly. Subsequent assertions that use `expect(cartBadge).toHaveText()` or `toBeHidden()` directly on the locator would be more resilient but require the caller to know the exact expected count.

### PR runs are chromium-only

Pull request workflows only run the `chromium` project to keep feedback fast. Full cross-browser coverage (all five projects) runs on `workflow_dispatch` with `browser: all`, or can be triggered selectively via the manual input.

### Matrix concurrency on GitHub-hosted runners

All browser jobs run in parallel on separate `ubuntu-latest` runners. This is fast but consumes concurrent runner slots. In organisations with restricted runner quotas the matrix may queue.

### Pages deployment overwrites on every run

Every merge to `main` or manual dispatch overwrites the same GitHub Pages URL. There is no per-branch or per-run report history maintained at the Pages level. Previous reports are accessible via GitHub Artifacts (retained for 3 days).

### Fork PRs cannot deploy to Pages

The `deploy-report` job requires `pages: write` and `id-token: write` permissions. These are not granted to workflows triggered by pull requests from forks, so the deployment step will fail for external contributors. The test jobs and artifact uploads will still succeed.

### `problem_user` and `error_user` functional limitations

The test suite only verifies that these user accounts can reach the inventory page after login. Known visual or functional quirks for `problem_user` (broken images, wrong sort behaviour) and `error_user` (intermittent API errors) are not covered by dedicated assertions.

### No visual regression testing

The suite does not include visual snapshot comparisons. `visual_user` is included in the login parametrisation solely to confirm the account can authenticate.

### Mobile browser coverage is emulated

`mobile-chrome` and `mobile-safari` projects use Playwright's device emulation (`Pixel 9` and `iPhone 16`) rather than real devices or a cloud device farm. Rendering differences on physical hardware are not captured.
