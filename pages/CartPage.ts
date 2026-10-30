import { Locator, Page } from '@playwright/test';
import { CheckoutPage, OrderSummary } from './CheckoutPage';

export class CartPage {
  readonly root: Locator;
  readonly summary: OrderSummary;
  readonly promoInput: Locator;
  readonly applyButton: Locator;
  readonly checkoutButton: Locator;
  readonly promoStatus: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('#cart');
    this.summary = new OrderSummary(this.root);
    this.promoInput = page.locator('#code');
    this.applyButton = page.locator('#apply');
    this.checkoutButton = page.locator('#checkout-button');
    this.promoStatus = page.locator('#promo-status');
  }

  async applyPromoCode(code: string) {
    await this.promoInput.fill(code);
    await this.applyButton.click();
  }

  async continueToCheckout(): Promise<CheckoutPage> {
    await this.checkoutButton.click();
    return new CheckoutPage(this.page);
  }
}
