import { $, type WebElement } from 'playwright-elements';
import { BasePage } from './base.page';

export enum SortOption {
  AZ = 'az',
  ZA = 'za',
  LOHI = 'lohi',
  HILO = 'hilo',
}

export interface ProductItem {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

export class InventoryPage extends BasePage {
  readonly pageTitle = $('.title');
  readonly sortDropdown = $('[data-test="product-sort-container"]');
  readonly cartBadge = $('.shopping_cart_badge');
  readonly cartLink = $('.shopping_cart_link');

  readonly inventoryItem = $('.inventory_item').with({
    name: $('.inventory_item_name'),
    description: $('.inventory_item_desc'),
    price: $('.inventory_item_price'),
    image: $('.inventory_item_img img'),
  });

  readonly burgerMenuButton = $('#react-burger-menu-btn');

  readonly sidebarMenu = $('.bm-menu-wrap').with({
    closeButton: $('#react-burger-cross-btn'),
    allItemsLink: $('#inventory_sidebar_link'),
    aboutLink: $('#about_sidebar_link'),
    logoutLink: $('#logout_sidebar_link'),
    resetLink: $('#reset_sidebar_link'),
  });

  readonly menuCloseButton = $('#react-burger-cross-btn');
  readonly logoutLink = $('#logout_sidebar_link');

  async getProductPrices(): Promise<number[]> {
    const texts = await this.inventoryItem.price.allInnerTexts();
    return texts.map((t) => parseFloat(t.replace('$', '')));
  }

  async getProductDetails(index: number): Promise<ProductItem> {
    const item = this.inventoryItem.nth(index).locator;
    const name = await item.locator('.inventory_item_name').innerText();
    const description = await item.locator('.inventory_item_desc').innerText();
    const priceText = await item.locator('.inventory_item_price').innerText();
    const imageUrl = (await item.locator('.inventory_item_img img').getAttribute('src')) ?? '';
    return {
      name,
      description,
      price: parseFloat(priceText.replace('$', '')),
      imageUrl,
    };
  }

  addToCartButton(productName: string): WebElement {
    const slug = productName.toLowerCase().replace(/\s+/gu, '-');
    return $(`[data-test="add-to-cart-${slug}"]`);
  }

  removeFromCartButton(productName: string): WebElement {
    const slug = productName.toLowerCase().replace(/\s+/gu, '-');
    return $(`[data-test="remove-${slug}"]`);
  }

  async getCartBadgeCount(): Promise<number> {
    if (!(await this.cartBadge.isVisible())) {
      return 0;
    }
    return parseInt(await this.cartBadge.innerText(), 10);
  }

  async logout(): Promise<void> {
    await this.burgerMenuButton.click({ delay: 100 });
    await this.logoutLink.click();
  }
}
