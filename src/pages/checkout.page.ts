import { $ } from 'playwright-elements';
import { BasePage } from './base.page';
import type { CheckoutInfo } from '@data/checkout-info';

interface OrderSummary {
  itemTotal: number;
  tax: number;
  total: number;
}

export class CheckoutPage extends BasePage {
  readonly pageTitle = $('.title');

  readonly firstNameInput = $('[data-test="firstName"]');
  readonly lastNameInput = $('[data-test="lastName"]');
  readonly postalCodeInput = $('[data-test="postalCode"]');
  readonly continueButton = $('[data-test="continue"]');
  readonly cancelButton = $('[data-test="cancel"]');
  readonly errorMessage = $('[data-test="error"]');

  readonly cartItem = $('.cart_item').with({
    itemName: $('.inventory_item_name'),
    itemPrice: $('.inventory_item_price'),
  });

  readonly itemSubtotalLabel = $('.summary_subtotal_label');
  readonly taxLabel = $('.summary_tax_label');
  readonly totalLabel = $('.summary_total_label');
  readonly finishButton = $('[data-test="finish"]');

  readonly completeHeader = $('.complete-header');
  readonly completeText = $('.complete-text');
  readonly backToProductsButton = $('[data-test="back-to-products"]');

  async fillInfo(info: CheckoutInfo): Promise<void> {
    await this.firstNameInput.fill(info.firstName);
    await this.lastNameInput.fill(info.lastName);
    await this.postalCodeInput.fill(info.postalCode);
  }

  async getOrderSummary(): Promise<OrderSummary> {
    const subtotalText = await this.itemSubtotalLabel.innerText();
    const taxText = await this.taxLabel.innerText();
    const totalText = await this.totalLabel.innerText();
    return {
      itemTotal: parseFloat(subtotalText.replace(/[^0-9.]/gu, '')),
      tax: parseFloat(taxText.replace(/[^0-9.]/gu, '')),
      total: parseFloat(totalText.replace(/[^0-9.]/gu, '')),
    };
  }

  async getOrderItems(): Promise<{ name: string; price: number }[]> {
    return this.cartItem.map(async item => ({
      name: await item.itemName.innerText(),
      price: parseFloat((await item.itemPrice.innerText()).replace('$', '')),
    }));
  }
}
