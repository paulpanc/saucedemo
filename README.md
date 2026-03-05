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
  - [Dynamic Test Data](#dynamic-test-data)
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
- [Linting](#linting)
- [Assumptions](#assumptions)
- [Limitations & Known Constraints](#limitations--known-constraints)

---

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [Playwright](https://playwright.dev) | ^1.50 | Browser automation & test runner |
| [playwright-elements](https://www.npmjs.com/package/playwright-elements) | ^1.18 | Lazy-initialised web elements & fluent API |
| [TypeScript](https://www.typescriptlang.org) | ^5.7 | Language |
| [ESLint](https://eslint.org) + [typescript-eslint](https://typescript-eslint.io) | ^9 / ^8 | Static analysis |
| [Monocart Reporter](https://github.com/cenfun/monocart-reporter) | ^2.9 | HTML test report with coverage |
| [GitHub Actions](https://docs.github.com/en/actions) | — | CI/CD |
| [GitHub Pages](https://pages.github.com) | — | Report hosting |

---

## Project Structure

```
saucedemo/
├── src/
│   ├── data/                     # Static test data constants
│   │   ├── checkout-info.ts      # Checkout form fixtures (valid / invalid)
│   │   ├── products.ts           # Reference product catalogue
│   │   └── users.ts              # All known user accounts
│   ├── fixtures/
│   │   └── index.ts              # Custom Playwright fixtures (page objects + live data)
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
│   └── checkout/
│       └── checkout.spec.ts
├── .github/
│   └── workflows/
│       └── ci.yml                # Lint → Test (matrix) → Deploy report
├── .nvmrc                        # Pinned Node.js version
├── playwright.config.ts
├── tsconfig.json
└── eslint.config.mjs
```

### Path aliases

TypeScript path aliases (configured in `tsconfig.json`) keep imports clean across the project:

| Alias | Maps to |
|---|---|
| `@pages/*` | `src/pages/*` |
| `@fixtures/*` | `src/fixtures/*` |
| `@data/*` | `src/data/*` |

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

`src/fixtures/index.ts` extends `playwright-elements`'s `test` base to provide pre-constructed page objects and shared state to every test:

| Fixture | Type | Description |
|---|---|---|
| `loginPage` | `LoginPage` | Bare login page instance |
| `inventoryPage` | `InventoryPage` | Bare inventory page instance |
| `cartPage` | `CartPage` | Bare cart page instance |
| `checkoutPage` | `CheckoutPage` | Bare checkout page instance |
| `loggedInPage` | `InventoryPage` | Navigates to `/`, logs in as `standard_user`, resolves to an `InventoryPage` |
| `products` | `ProductsData` | Depends on `loggedInPage`; fetches live names, prices, and count from the inventory |

Tests declare only the fixtures they need — Playwright handles setup and teardown automatically:

```typescript
test('...', async ({ loggedInPage, products, cartPage }) => { ... });
```

---

### Dynamic Test Data

Rather than hard-coding expected product names and prices, the `products` fixture fetches them live from the running application before each test:

```typescript
products: async ({ loggedInPage }, use) => {
  const names  = await loggedInPage.inventoryItem.name.allInnerTexts();
  const prices = await loggedInPage.getProductPrices();
  await use({ names, prices, count: names.length });
},
```

Tests then reference products by position (`products.names[0]`, `products.prices[1]`) rather than by literal string. This means the suite does not need to be updated if the product catalogue changes.

A static `PRODUCTS` constant (`src/data/products.ts`) is kept as a reference catalogue but is intentionally not used in test assertions.

---

### Test Structure — Steps over Small Tests

Related assertions that form a natural sequential flow are grouped into a single `test()` using `test.step()` rather than being split into many small independent tests. This produces richer, hierarchical report output and makes the intent of each scenario immediately clear.

```typescript
test('cart add/remove cycle updates badge and button states', async ({ loggedInPage, products }) => {
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

### Running Tests

| Command | Description |
|---|---|
| `npm test` | All tests, all browsers (headless) |
| `npm run test:headed` | All tests with a visible browser window |
| `npm run test:ui` | Interactive Playwright UI mode |
| `npm run test:debug` | Step-through debugger |
| `npm run test:auth` | Login suite only |
| `npm run test:inventory` | Inventory + burger menu suites |
| `npm run test:cart` | Cart suite only |
| `npm run test:checkout` | Checkout suite only |
| `npm run report` | Open the last Monocart HTML report |

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

| Suite | File | Scenarios |
|---|---|---|
| **Login** | `tests/auth/login.spec.ts` | Valid login; page load state; credential validation (empty fields, wrong credentials, case sensitivity, locked user); error icon/message lifecycle; all non-locked user types |
| **Inventory** | `tests/inventory/inventory.spec.ts` | Page title; catalog populated without duplicates; data validity (names, prices, images, descriptions); cart add/remove lifecycle; badge state; sort (A→Z, Z→A, price asc/desc, dropdown stability); product detail navigation; cart icon; logout |
| **Burger menu** | `tests/inventory/burger-menu.spec.ts` | Open/close interaction; all sidebar links visible; navigation (Logout, All Items, About); Reset App State clears cart and restores buttons |
| **Cart** | `tests/cart/cart.spec.ts` | Items displayed with correct data; item removal updates count and badge; cart navigation (continue shopping, checkout); empty cart state; cart persists through navigation round trip |
| **Checkout** | `tests/checkout/checkout.spec.ts` | Step one: page title, valid form proceeds, required-field validation (all combinations), field retention on failure, cancel returns to cart; Step two (single item): overview correctness (title, item, price, tax, total); cancel returns to inventory; finish navigates to complete; Step two (multi-item): subtotal calculation; Order complete: confirmation copy, badge absent, back to inventory with empty cart |

---

## CI/CD Pipeline

The pipeline is defined in `.github/workflows/ci.yml`.

### Triggers

| Event | Condition |
|---|---|
| `pull_request` | Targets the `main` branch |
| `workflow_dispatch` | Manual — choose browser and test suite |

A top-level `concurrency` group (`ci-${{ github.ref }}`) cancels any in-progress run for the same ref when a new one is triggered.

### Jobs

```
lint ──► test (matrix: 5 browsers) ──► deploy-report
```

**`lint`**
Runs `eslint .` against all TypeScript sources.

**`test`** *(matrix)*
Runs in parallel across five browser projects: `chromium`, `firefox`, `webkit`, `mobile-chrome`, `mobile-safari`. The `workflow_dispatch` inputs filter the matrix to a single browser or test suite when specified. Each job uploads its `test-results/` folder as an artifact named `playwright-report-{browser}`, retained for 3 days.

**`deploy-report`**
Runs after all matrix jobs complete (`needs: test`, `if: !cancelled()`). It:
1. Downloads every `playwright-report-*` artifact
2. Copies each into `report/{browser}/`
3. Generates a `report/index.html` landing page that links to each browser report and includes the run number, commit SHA, and a direct link back to the Actions run
4. Deploys the whole `report/` directory to GitHub Pages

A dedicated `concurrency` group (`group: pages`, `cancel-in-progress: false`) serialises concurrent deployments so parallel PR runs queue rather than race.

### GitHub Pages Report

After a successful run, the test report is available at:

```
https://<org>.github.io/<repo>/
```

Each browser has its own Monocart HTML report at `/<browser>/index.html`.

**One-time setup required**: in the repository settings go to **Settings → Pages** and set the source to **"GitHub Actions"**.

---

## Linting

ESLint is configured in `eslint.config.mjs` with `typescript-eslint`. Key enforced rules:

| Rule | Effect |
|---|---|
| `@typescript-eslint/no-explicit-any` | `error` — bans `any` type |
| `@typescript-eslint/explicit-function-return-type` | `warn` — functions must declare return types |
| `@typescript-eslint/consistent-type-imports` | `error` — enforces `import type` where possible |
| `prefer-const` / `no-var` | `error` — modern variable declarations only |
| `eqeqeq` | `error` — strict equality (`===`) required |
| `curly` | `error` — braces required on all control-flow bodies |

Run locally:

```bash
npm run lint          # report errors
npm run lint:fix      # auto-fix where possible
```

---

## Assumptions

- **Application availability** — the tests run against the live public instance at `https://www.saucedemo.com`. There is no local mock server. A network failure or temporary outage at that URL will cause all tests to fail.

- **Standard user is a valid baseline** — the `standard_user` account is used for authentication in all tests that require login. It is assumed this account always exists and can access all features without restrictions.

- **Product catalogue order is stable within a session** — the `products` fixture fetches names and prices in the DOM order returned by the page. Tests reference items by index (`names[0]`, `names[1]`). If the server randomises product order between the fixture call and the test body, assertions may target the wrong item. In practice the order is consistent within a single browser session.

- **At least three products exist** — the `Multi-item order` checkout scenario adds the first three products (`names.slice(0, 3)`). If the catalogue ever contains fewer than three items, those tests will fail.

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

### Matrix concurrency on GitHub-hosted runners
All five browser jobs run in parallel on separate `ubuntu-latest` runners. This is fast but consumes five concurrent runner slots. In organisations with restricted runner quotas the matrix may queue.

### Pages deployment overwrites on every run
Every PR that merges or triggers a manual run overwrites the same GitHub Pages URL. There is no per-branch or per-run report history maintained at the Pages level. Previous reports are accessible via GitHub Artifacts (retained for 3 days).

### Fork PRs cannot deploy to Pages
The `deploy-report` job requires `pages: write` and `id-token: write` permissions. These are not granted to workflows triggered by pull requests from forks, so the deployment step will fail for external contributors. The test jobs and artifact uploads will still succeed.

### `problem_user` and `error_user` functional limitations
The test suite only verifies that these user accounts can reach the inventory page after login. Known visual or functional quirks for `problem_user` (broken images, wrong sort behaviour) and `error_user` (intermittent API errors) are not covered by dedicated assertions.

### No visual regression testing
The suite does not include visual snapshot comparisons. `visual_user` is included in the login parametrisation solely to confirm the account can authenticate.

### Mobile browser coverage is emulated
`mobile-chrome` and `mobile-safari` projects use Playwright's device emulation (`Pixel 9` and `iPhone 16`) rather than real devices or a cloud device farm. Rendering differences on physical hardware are not captured.
