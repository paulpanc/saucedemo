import { $, type WebElement } from 'playwright-elements';
import { BasePage } from './base.page';

export interface CartItem {
  name: string;
  description: string;
  price: number;
  quantity: number;
}

export class CartPage extends BasePage {
  readonly pageTitle = $('.title');
  readonly cartBadge = $('.shopping_cart_badge');
  readonly checkoutButton = $('[data-test="checkout"]');
  readonly continueShoppingButton = $('[data-test="continue-shopping"]');

  readonly cartItem = $('.cart_item').with({
    itemName: $('.inventory_item_name'),
    itemDescription: $('.inventory_item_desc'),
    itemPrice: $('.inventory_item_price'),
    itemQuantity: $('.cart_quantity'),
  });

  async getCartItems(): Promise<CartItem[]> {
    return this.cartItem.map(async item => ({
      name: await item.itemName.innerText(),
      description: await item.itemDescription.innerText(),
      price: parseFloat((await item.itemPrice.innerText()).replace('$', '')),
      quantity: parseInt(await item.itemQuantity.innerText(), 10),
    }));
  }

  removeButton(productName: string): WebElement {
    const slug = productName.toLowerCase().replace(/\s+/gu, '-');
    return $(`[data-test="remove-${slug}"]`);
  }

  async getCartBadgeCount(): Promise<number> {
    if (!(await this.cartBadge.isVisible())) {
      return 0;
    }
    return parseInt(await this.cartBadge.innerText(), 10);
  }
}
